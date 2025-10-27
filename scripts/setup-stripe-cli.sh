#!/bin/bash

# Stripe CLI Setup Script
# This script helps set up Stripe CLI for local development and testing

set -e

echo "🎮 Setting up Stripe CLI for Infinite Match Game..."

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI is not installed. Please install it first:"
    echo "   Visit: https://stripe.com/docs/stripe-cli"
    exit 1
fi

echo "✅ Stripe CLI is installed"

# Check if user is logged in
if ! stripe config --list &> /dev/null; then
    echo "🔐 Please log in to Stripe CLI:"
    stripe login
fi

echo "✅ Logged in to Stripe CLI"

# Create webhook endpoint
echo "🔗 Setting up webhook endpoint..."
WEBHOOK_URL="http://localhost:3000/api/stripe/webhook"

# Check if webhook already exists
if stripe webhook_endpoints list | grep -q "$WEBHOOK_URL"; then
    echo "✅ Webhook endpoint already exists"
else
    echo "Creating webhook endpoint..."
    stripe webhook_endpoints create \
        --url "$WEBHOOK_URL" \
        --enabled-events payment_intent.succeeded \
        --enabled-events payment_intent.payment_failed \
        --enabled-events customer.subscription.created \
        --enabled-events customer.subscription.updated \
        --enabled-events customer.subscription.deleted \
        --enabled-events invoice.payment_succeeded \
        --enabled-events invoice.payment_failed
    echo "✅ Webhook endpoint created"
fi

# Get webhook secret
echo "🔑 Getting webhook secret..."
WEBHOOK_SECRET=$(stripe webhook_endpoints list --limit 1 --format json | jq -r '.data[0].secret')

if [ "$WEBHOOK_SECRET" != "null" ] && [ -n "$WEBHOOK_SECRET" ]; then
    echo "✅ Webhook secret: $WEBHOOK_SECRET"
    echo ""
    echo "📝 Add this to your .env file:"
    echo "STRIPE_WEBHOOK_SECRET=$WEBHOOK_SECRET"
    echo ""
else
    echo "❌ Failed to get webhook secret"
fi

# Create test products and prices
echo "🛍️  Creating test products and prices..."

# Create test products
GEMS_100_PRODUCT=$(stripe products create \
    --name "100 Gems" \
    --description "Perfect for small purchases" \
    --metadata game_item_id=gems_100 \
    --format json | jq -r '.id')

GEMS_500_PRODUCT=$(stripe products create \
    --name "500 Gems" \
    --description "Great value pack" \
    --metadata game_item_id=gems_500 \
    --format json | jq -r '.id')

GEMS_1000_PRODUCT=$(stripe products create \
    --name "1000 Gems" \
    --description "Best value for money" \
    --metadata game_item_id=gems_1000 \
    --format json | jq -r '.id')

PREMIUM_PASS_PRODUCT=$(stripe products create \
    --name "Premium Pass" \
    --description "Monthly subscription with exclusive benefits" \
    --metadata game_item_id=premium_pass \
    --format json | jq -r '.id')

echo "✅ Test products created"

# Create test prices
GEMS_100_PRICE=$(stripe prices create \
    --product "$GEMS_100_PRODUCT" \
    --unit-amount 99 \
    --currency usd \
    --format json | jq -r '.id')

GEMS_500_PRICE=$(stripe prices create \
    --product "$GEMS_500_PRODUCT" \
    --unit-amount 499 \
    --currency usd \
    --format json | jq -r '.id')

GEMS_1000_PRICE=$(stripe prices create \
    --product "$GEMS_1000_PRODUCT" \
    --unit-amount 999 \
    --currency usd \
    --format json | jq -r '.id')

PREMIUM_PASS_PRICE=$(stripe prices create \
    --product "$PREMIUM_PASS_PRODUCT" \
    --unit-amount 1999 \
    --currency usd \
    --recurring interval=month \
    --format json | jq -r '.id')

echo "✅ Test prices created"

# Create test configuration file
cat > stripe-test-config.json << EOF
{
  "products": {
    "gems_100": {
      "productId": "$GEMS_100_PRODUCT",
      "priceId": "$GEMS_100_PRICE",
      "name": "100 Gems",
      "amount": 0.99,
      "currency": "usd"
    },
    "gems_500": {
      "productId": "$GEMS_500_PRODUCT",
      "priceId": "$GEMS_500_PRICE",
      "name": "500 Gems",
      "amount": 4.99,
      "currency": "usd"
    },
    "gems_1000": {
      "productId": "$GEMS_1000_PRODUCT",
      "priceId": "$GEMS_1000_PRICE",
      "name": "1000 Gems",
      "amount": 9.99,
      "currency": "usd"
    },
    "premium_pass": {
      "productId": "$PREMIUM_PASS_PRODUCT",
      "priceId": "$PREMIUM_PASS_PRICE",
      "name": "Premium Pass",
      "amount": 19.99,
      "currency": "usd",
      "recurring": true
    }
  },
  "webhook": {
    "url": "$WEBHOOK_URL",
    "secret": "$WEBHOOK_SECRET"
  }
}
EOF

echo "✅ Test configuration saved to stripe-test-config.json"

# Start webhook listener
echo "🎧 Starting webhook listener..."
echo "   This will forward webhook events to your local server"
echo "   Press Ctrl+C to stop"
echo ""

# Function to start webhook listener
start_webhook_listener() {
    stripe listen --forward-to "$WEBHOOK_URL"
}

# Check if user wants to start webhook listener
read -p "Do you want to start the webhook listener now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    start_webhook_listener
else
    echo "To start the webhook listener later, run:"
    echo "stripe listen --forward-to $WEBHOOK_URL"
fi

echo ""
echo "🎉 Stripe CLI setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Add the webhook secret to your .env file"
echo "2. Start your server: npm run dev"
echo "3. Test payments using stripe-test.html"
echo "4. Use 'stripe logs tail' to view webhook events"
echo ""
echo "🔗 Useful commands:"
echo "  stripe listen --forward-to $WEBHOOK_URL  # Start webhook listener"
echo "  stripe logs tail                         # View webhook events"
echo "  stripe trigger payment_intent.succeeded  # Test webhook events"
echo "  stripe customers list                    # List customers"
echo "  stripe products list                     # List products"
echo "  stripe prices list                       # List prices"