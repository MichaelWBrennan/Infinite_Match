#!/bin/bash

# iOS Certificate and Provisioning Profile Setup
# This script helps set up iOS certificates for App Store submission

set -e

echo "🍎 Setting up iOS Certificates for Evergreen Puzzler..."

# Check if Xcode is installed
if ! command -v xcodebuild &> /dev/null; then
    echo "❌ Xcode is not installed. Please install Xcode from the Mac App Store."
    exit 1
fi

echo "✅ Xcode found: $(xcodebuild -version | head -n1)"

# Check if Apple Developer account is configured
if ! security find-identity -v -p codesigning | grep -q "Apple Development"; then
    echo "⚠️  No Apple Development certificate found."
    echo "   Please log in to your Apple Developer account in Xcode:"
    echo "   Xcode > Preferences > Accounts > Add Apple ID"
    exit 1
fi

echo "✅ Apple Developer account configured"

# Create certificates directory
mkdir -p certificates
cd certificates

echo "📋 iOS Certificate Setup Instructions:"
echo ""
echo "1. APPLE DEVELOPER ACCOUNT SETUP:"
echo "   - Go to https://developer.apple.com/account"
echo "   - Sign in with your Apple ID"
echo "   - Accept the Apple Developer Agreement"
echo "   - Pay the $99/year fee (if not already paid)"
echo ""

echo "2. CREATE APP IDENTIFIER:"
echo "   - Go to Certificates, Identifiers & Profiles"
echo "   - Click Identifiers > + (Add)"
echo "   - Select App IDs > Continue"
echo "   - Select App > Continue"
echo "   - Description: Evergreen Puzzler"
echo "   - Bundle ID: com.evergreen.match3"
echo "   - Capabilities: Game Center, iCloud, Push Notifications"
echo "   - Click Continue > Register"
echo ""

echo "3. CREATE DEVELOPMENT CERTIFICATE:"
echo "   - Go to Certificates > + (Add)"
echo "   - Select iOS App Development > Continue"
echo "   - Upload CSR file (created by Xcode)"
echo "   - Download and install certificate"
echo ""

echo "4. CREATE DISTRIBUTION CERTIFICATE:"
echo "   - Go to Certificates > + (Add)"
echo "   - Select iOS Distribution (App Store and Ad Hoc) > Continue"
echo "   - Upload CSR file (created by Xcode)"
echo "   - Download and install certificate"
echo ""

echo "5. CREATE PROVISIONING PROFILES:"
echo "   - Go to Profiles > + (Add)"
echo "   - Select iOS App Development > Continue"
echo "   - Select App ID: com.evergreen.match3 > Continue"
echo "   - Select Development Certificate > Continue"
echo "   - Select Devices > Continue"
echo "   - Name: Evergreen Puzzler Development > Generate"
echo "   - Download and install profile"
echo ""

echo "6. CREATE APP STORE PROVISIONING PROFILE:"
echo "   - Go to Profiles > + (Add)"
echo "   - Select App Store > Continue"
echo "   - Select App ID: com.evergreen.match3 > Continue"
echo "   - Select Distribution Certificate > Continue"
echo "   - Name: Evergreen Puzzler App Store > Generate"
echo "   - Download and install profile"
echo ""

echo "7. CREATE TESTFLIGHT PROVISIONING PROFILE:"
echo "   - Go to Profiles > + (Add)"
echo "   - Select App Store > Continue"
echo "   - Select App ID: com.evergreen.match3 > Continue"
echo "   - Select Distribution Certificate > Continue"
echo "   - Name: Evergreen Puzzler TestFlight > Generate"
echo "   - Download and install profile"
echo ""

echo "8. CONFIGURE UNITY BUILD SETTINGS:"
echo "   - Open Unity"
echo "   - Go to Edit > Project Settings > Player > iOS Settings"
echo "   - Bundle Identifier: com.evergreen.match3"
echo "   - Target Device: iPhone and iPad"
echo "   - Target iOS Version: 12.0"
echo "   - Scripting Backend: IL2CPP"
echo "   - Architecture: ARM64"
echo "   - Development Team: [Your Team ID]"
echo "   - Provisioning Profile: [Your Profile ID]"
echo ""

echo "9. ENVIRONMENT VARIABLES FOR CI/CD:"
echo "   export APPLE_TEAM_ID=\"[Your Team ID]\""
echo "   export PROVISIONING_PROFILE_ID=\"[Your Profile ID]\""
echo "   export UNITY_CLOUD_PROJECT_ID=\"[Your Unity Project ID]\""
echo ""

echo "10. TESTFLIGHT SETUP:"
echo "    - Go to App Store Connect"
echo "    - Create new app: Evergreen Puzzler"
echo "    - Bundle ID: com.evergreen.match3"
echo "    - Configure TestFlight settings"
echo "    - Upload build for testing"
echo ""

echo "📱 iOS Build Commands:"
echo ""
echo "# Development Build"
echo "Unity -batchmode -quit -projectPath ./unity -executeMethod Evergreen.Editor.BuildScript.CIBuildiOS"
echo ""
echo "# Production Build (for App Store)"
echo "export BUILD_TYPE=production"
echo "export APPLE_TEAM_ID=\"[Your Team ID]\""
echo "export PROVISIONING_PROFILE_ID=\"[Your Profile ID]\""
echo "Unity -batchmode -quit -projectPath ./unity -executeMethod Evergreen.Editor.BuildScript.CIBuildiOS"
echo ""

echo "🔍 Verification Commands:"
echo ""
echo "# Check certificates"
echo "security find-identity -v -p codesigning"
echo ""
echo "# Check provisioning profiles"
echo "ls ~/Library/MobileDevice/Provisioning\\ Profiles/"
echo ""
echo "# Verify app bundle"
echo "codesign -dv --verbose=4 build/iOS/EvergreenPuzzler.app"
echo ""

echo "📋 Next Steps:"
echo "1. Complete the certificate setup above"
echo "2. Configure Unity build settings"
echo "3. Build iOS app"
echo "4. Upload to App Store Connect"
echo "5. Submit for App Store review"
echo ""

echo "✅ iOS Certificate Setup Instructions Complete!"
echo "   Follow the steps above to set up your iOS certificates and provisioning profiles."