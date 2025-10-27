# 🎮 Stripe Integration Guide

Complete guide for integrating Stripe payments into the Infinite Match Unity game.

## 📋 Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Frontend Integration](#frontend-integration)
- [Webhook Handling](#webhook-handling)
- [Testing](#testing)
- [CLI Tools](#cli-tools)
- [Security](#security)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

This integration provides a complete payment solution for the Infinite Match game, including:

- **One-time payments** for in-game items (gems, power-ups, etc.)
- **Subscription payments** for premium passes and recurring benefits
- **Customer management** for tracking player purchases
- **Webhook handling** for real-time payment processing
- **Frontend components** for seamless payment UI
- **CLI tools** for development and testing

## 🚀 Installation

### Prerequisites

- Node.js 20+ 
- Stripe account (test and live)
- Stripe CLI (for local development)

### Install Dependencies

```bash
# Install Stripe SDK and frontend library
npm install stripe @stripe/stripe-js

# Install TypeScript types (if using TypeScript)
npm install --save-dev @types/stripe
```

### Install Stripe CLI

```bash
# Linux/macOS
curl -s https://packages.stripe.dev/api/security/keypairs/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
echo "deb https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
sudo apt update
sudo apt install stripe

# Or download directly
curl -L "https://github.com/stripe/stripe-cli/releases/latest/download/stripe_*_linux_x86_64.tar.gz" | tar -xz
sudo mv stripe /usr/local/bin/
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file with the following Stripe configuration:

```env
# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_API_VERSION=2023-10-16
STRIPE_CURRENCY=usd
STRIPE_COUNTRY=US
```

### Get Stripe Keys

1. **Test Keys** (for development):
   - Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
   - Copy your test publishable and secret keys

2. **Live Keys** (for production):
   - Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
   - Copy your live publishable and secret keys

3. **Webhook Secret**:
   - Go to [Webhooks](https://dashboard.stripe.com/webhooks)
   - Create a new endpoint pointing to your server
   - Copy the webhook signing secret

### Setup Script

Run the automated setup script:

```bash
./scripts/setup-stripe-cli.sh
```

This will:
- Create webhook endpoints
- Generate test products and prices
- Set up local development environment

## 🔌 API Endpoints

### Authentication

All endpoints require authentication via session validation middleware.

### Payment Intent Endpoints

#### Create Payment Intent
```http
POST /api/stripe/payment-intent
Content-Type: application/json

{
  "amount": 9.99,
  "currency": "usd",
  "productId": "gems_1000",
  "metadata": {
    "playerId": "player_123",
    "gameVersion": "1.0.0"
  }
}
```

**Response:**
```json
{
  "success": true,
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx"
}
```

#### Get Payment Intent
```http
GET /api/stripe/payment-intent/{paymentIntentId}
```

### Customer Endpoints

#### Create Customer
```http
POST /api/stripe/customer
Content-Type: application/json

{
  "email": "player@example.com",
  "name": "Player Name",
  "metadata": {
    "playerId": "player_123"
  }
}
```

#### Get Customer
```http
GET /api/stripe/customer/{customerId}
```

### Subscription Endpoints

#### Create Subscription
```http
POST /api/stripe/subscription
Content-Type: application/json

{
  "customerId": "cus_xxx",
  "priceId": "price_xxx",
  "metadata": {
    "playerId": "player_123"
  }
}
```

#### Cancel Subscription
```http
POST /api/stripe/subscription/{subscriptionId}/cancel
Content-Type: application/json

{
  "immediately": false
}
```

### Product Management

#### Create Product
```http
POST /api/stripe/product
Content-Type: application/json

{
  "name": "1000 Gems",
  "description": "Best value for money",
  "metadata": {
    "gameItemId": "gems_1000"
  },
  "images": ["https://example.com/gems.png"]
}
```

#### Create Price
```http
POST /api/stripe/price
Content-Type: application/json

{
  "productId": "prod_xxx",
  "unitAmount": 9.99,
  "currency": "usd",
  "recurring": {
    "interval": "month"
  },
  "metadata": {
    "gameItemId": "premium_pass"
  }
}
```

### Webhook Endpoint

```http
POST /api/stripe/webhook
Content-Type: application/json
Stripe-Signature: t=xxx,v1=xxx

{
  "id": "evt_xxx",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_xxx",
      "amount": 999,
      "currency": "usd",
      "metadata": {
        "playerId": "player_123",
        "productId": "gems_1000"
      }
    }
  }
}
```

## 🎨 Frontend Integration

### Basic Usage

```javascript
// Initialize Stripe
await window.StripePaymentManager.initialize();

// Create a payment
const result = await window.StripePaymentManager.processPayment({
  amount: 9.99,
  currency: 'usd',
  productId: 'gems_1000',
  metadata: {
    playerId: 'player_123'
  }
});
```

### Payment Modal

```javascript
// Show payment modal
await window.StripePaymentManager.showPaymentModal({
  amount: 9.99,
  currency: 'usd',
  productId: 'gems_1000',
  productName: '1000 Gems',
  metadata: {
    playerId: 'player_123'
  }
});

// Listen for success
window.addEventListener('stripe-payment-success', (event) => {
  console.log('Payment successful:', event.detail);
});
```

### Customer Management

```javascript
// Create customer
const customer = await window.StripePaymentManager.createCustomer({
  email: 'player@example.com',
  name: 'Player Name',
  metadata: {
    playerId: 'player_123'
  }
});

// Get customer
const customerData = await window.StripePaymentManager.getCustomer(customer.customerId);
```

### Subscription Management

```javascript
// Create subscription
const subscription = await window.StripePaymentManager.createSubscription({
  customerId: 'cus_xxx',
  priceId: 'price_xxx',
  metadata: {
    playerId: 'player_123'
  }
});

// Cancel subscription
await window.StripePaymentManager.cancelSubscription('sub_xxx', false);
```

## 🔔 Webhook Handling

### Supported Events

- `payment_intent.succeeded` - Payment completed successfully
- `payment_intent.payment_failed` - Payment failed
- `customer.subscription.created` - New subscription created
- `customer.subscription.updated` - Subscription updated
- `customer.subscription.deleted` - Subscription canceled
- `invoice.payment_succeeded` - Subscription payment succeeded
- `invoice.payment_failed` - Subscription payment failed

### Event Processing

Webhook events are automatically processed by the `StripeService`:

1. **Signature Verification** - Validates webhook authenticity
2. **Event Processing** - Routes to appropriate handler
3. **Purchase Recording** - Logs to purchase ledger
4. **Player Updates** - Updates player economy/entitlements

### Local Development

```bash
# Start webhook listener
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Test webhook events
stripe trigger payment_intent.succeeded
stripe trigger customer.subscription.created
```

## 🧪 Testing

### Test Page

Open `stripe-test.html` in your browser to test the integration:

```bash
# Start your server
npm run dev

# Open test page
open stripe-test.html
```

### Test Scenarios

1. **Initialize Stripe** - Verify SDK loads correctly
2. **Create Customer** - Test customer creation
3. **Process Payment** - Test one-time payments
4. **Create Subscription** - Test recurring payments
5. **Cancel Subscription** - Test subscription cancellation
6. **Purchase History** - Test purchase retrieval

### Test Cards

Use Stripe's test card numbers:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

### Test Products

The setup script creates test products:

- **100 Gems** - $0.99
- **500 Gems** - $4.99
- **1000 Gems** - $9.99
- **Premium Pass** - $19.99/month

## 🛠️ CLI Tools

### Stripe CLI Commands

```bash
# Login to Stripe
stripe login

# Listen for webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook

# View webhook events
stripe logs tail

# Test webhook events
stripe trigger payment_intent.succeeded
stripe trigger customer.subscription.created

# List resources
stripe customers list
stripe products list
stripe prices list
stripe webhook_endpoints list

# Create test data
stripe products create --name "Test Product"
stripe prices create --product prod_xxx --unit-amount 999 --currency usd
```

### Development Scripts

```bash
# Setup Stripe CLI
./scripts/setup-stripe-cli.sh

# Start webhook listener
npm run stripe:listen

# Test webhook events
npm run stripe:test
```

## 🔒 Security

### Best Practices

1. **Environment Variables** - Never commit API keys to version control
2. **Webhook Verification** - Always verify webhook signatures
3. **HTTPS Only** - Use HTTPS in production
4. **Input Validation** - Validate all input data
5. **Rate Limiting** - Implement rate limiting on payment endpoints
6. **Logging** - Log all payment events for audit trails

### Webhook Security

```javascript
// Verify webhook signature
const isValid = StripeService.validateWebhookSignature(rawBody, signature);
if (!isValid) {
  return res.status(400).json({ error: 'Invalid signature' });
}
```

### PCI Compliance

- Never store card details
- Use Stripe Elements for secure card input
- Process payments server-side only
- Follow Stripe's security guidelines

## 🐛 Troubleshooting

### Common Issues

#### 1. "Stripe not initialized" Error
```javascript
// Ensure Stripe is initialized before use
if (!window.StripePaymentManager.isReady()) {
  await window.StripePaymentManager.initialize();
}
```

#### 2. Webhook Signature Verification Failed
```bash
# Check webhook secret
echo $STRIPE_WEBHOOK_SECRET

# Verify webhook endpoint
stripe webhook_endpoints list
```

#### 3. Payment Intent Creation Failed
```javascript
// Check API key and permissions
const response = await fetch('/api/stripe/publishable-key');
const data = await response.json();
console.log('Publishable key:', data.publishableKey);
```

#### 4. CORS Issues
```javascript
// Ensure CORS is configured correctly
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
```

### Debug Mode

Enable debug logging:

```javascript
// Set debug mode
window.StripePaymentManager.debug = true;

// Check initialization status
console.log('Stripe ready:', window.StripePaymentManager.isReady());
```

### Logs

Check server logs for detailed error information:

```bash
# View server logs
npm run dev

# View Stripe CLI logs
stripe logs tail

# Check webhook events
stripe events list --limit 10
```

## 📚 Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Stripe Elements](https://stripe.com/docs/stripe-js)
- [Webhook Testing](https://stripe.com/docs/webhooks/test)

## 🤝 Support

For issues and questions:

1. Check the troubleshooting section
2. Review Stripe documentation
3. Check server logs for errors
4. Test with Stripe CLI tools
5. Contact support if needed

---

**Happy coding! 🎮💳**