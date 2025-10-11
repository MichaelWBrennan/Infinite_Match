#!/bin/bash

# Generate Android Keystore for Google Play Store
# This script creates a production-ready keystore for app signing

set -e

KEYSTORE_NAME="evergreen-release.keystore"
KEY_ALIAS="evergreen"
KEYSTORE_PASS_FILE="keystore-password.txt"
KEY_PASS_FILE="key-password.txt"

echo "🔐 Generating Android Keystore for Evergreen Puzzler..."

# Check if keystore already exists
if [ -f "$KEYSTORE_NAME" ]; then
    echo "⚠️  Keystore already exists. Backing up existing keystore..."
    mv "$KEYSTORE_NAME" "${KEYSTORE_NAME}.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Generate random passwords
KEYSTORE_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
KEY_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

# Save passwords to files (for CI/CD)
echo "$KEYSTORE_PASSWORD" > "$KEYSTORE_PASS_FILE"
echo "$KEY_PASSWORD" > "$KEY_PASS_FILE"

echo "📝 Keystore password: $KEYSTORE_PASSWORD"
echo "📝 Key password: $KEY_PASSWORD"
echo ""
echo "⚠️  IMPORTANT: Save these passwords securely! They cannot be recovered."
echo "⚠️  Store these passwords in your CI/CD environment variables:"
echo "   KEYSTORE_PASS=$KEYSTORE_PASSWORD"
echo "   KEYALIAS_PASS=$KEY_PASSWORD"
echo ""

# Generate the keystore
keytool -genkey -v \
    -keystore "$KEYSTORE_NAME" \
    -alias "$KEY_ALIAS" \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -storepass "$KEYSTORE_PASSWORD" \
    -keypass "$KEY_PASSWORD" \
    -dname "CN=Evergreen Games, OU=Development, O=Evergreen, L=City, S=State, C=US"

echo "✅ Keystore generated successfully!"
echo "📁 Keystore file: $KEYSTORE_NAME"
echo "🔑 Key alias: $KEY_ALIAS"
echo ""

# Verify keystore
echo "🔍 Verifying keystore..."
keytool -list -v -keystore "$KEYSTORE_NAME" -storepass "$KEYSTORE_PASSWORD"

echo ""
echo "📋 Next steps:"
echo "1. Move the keystore to a secure location"
echo "2. Add passwords to your CI/CD environment variables"
echo "3. Update Unity build settings with keystore path"
echo "4. Test the build process"
echo "5. Upload to Google Play Console"
echo ""
echo "🔒 Security reminder:"
echo "- Never commit keystore files to version control"
echo "- Store passwords in secure environment variables"
echo "- Keep backup copies in secure locations"