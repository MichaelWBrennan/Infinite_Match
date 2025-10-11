#!/bin/bash

# Verify Google Play Store Compliance Build
# This script checks if the build meets Google Play requirements

set -e

echo "🔍 Verifying Google Play Store Compliance..."

# Check if AAB file exists
AAB_FILE="build/Android/EvergreenPuzzler.aab"
if [ ! -f "$AAB_FILE" ]; then
    echo "❌ AAB file not found at $AAB_FILE"
    echo "   Run the build process first:"
    echo "   Unity -batchmode -quit -executeMethod Evergreen.Editor.BuildScript.CIBuildAndroid"
    exit 1
fi

echo "✅ AAB file found: $AAB_FILE"

# Check AAB file size
AAB_SIZE=$(stat -f%z "$AAB_FILE" 2>/dev/null || stat -c%s "$AAB_FILE" 2>/dev/null || echo "0")
AAB_SIZE_MB=$((AAB_SIZE / 1024 / 1024))

echo "📊 AAB file size: ${AAB_SIZE_MB}MB"

if [ $AAB_SIZE_MB -gt 150 ]; then
    echo "⚠️  Warning: AAB file is larger than 150MB (${AAB_SIZE_MB}MB)"
    echo "   Consider optimizing assets or using asset bundles"
else
    echo "✅ AAB file size is acceptable (${AAB_SIZE_MB}MB)"
fi

# Check if keystore exists
KEYSTORE_FILE="evergreen-release.keystore"
if [ ! -f "$KEYSTORE_FILE" ]; then
    echo "⚠️  Release keystore not found: $KEYSTORE_FILE"
    echo "   Run: ./scripts/generate-keystore.sh"
else
    echo "✅ Release keystore found: $KEYSTORE_FILE"
fi

# Check required files
REQUIRED_FILES=(
    "unity/Assets/Plugins/Android/AndroidManifest.xml"
    "unity/Assets/Plugins/Android/res/xml/data_extraction_rules.xml"
    "unity/Assets/Plugins/Android/res/xml/backup_rules.xml"
    "unity/Assets/Plugins/Android/res/xml/file_paths.xml"
    "unity/Assets/Plugins/Android/res/values/strings.xml"
    "unity/Assets/Plugins/Android/res/values/integers.xml"
    "PRIVACY_POLICY.md"
)

echo "🔍 Checking required compliance files..."

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ Missing: $file"
        exit 1
    fi
done

# Check Android manifest content
echo "🔍 Verifying Android manifest..."

if grep -q "android:targetSdkVersion=\"34\"" "unity/Assets/Plugins/Android/AndroidManifest.xml"; then
    echo "✅ Target SDK version 34 (Android 14)"
else
    echo "❌ Target SDK version not set to 34"
    exit 1
fi

if grep -q "android:minSdkVersion=\"21\"" "unity/Assets/Plugins/Android/AndroidManifest.xml"; then
    echo "✅ Minimum SDK version 21 (Android 5.0)"
else
    echo "❌ Minimum SDK version not set to 21"
    exit 1
fi

if grep -q "android:usesCleartextTraffic=\"false\"" "unity/Assets/Plugins/Android/AndroidManifest.xml"; then
    echo "✅ Cleartext traffic disabled"
else
    echo "❌ Cleartext traffic not disabled"
    exit 1
fi

# Check build script for AAB
if grep -q "buildAppBundle = true" "unity/Assets/Scripts/Editor/BuildScript.cs"; then
    echo "✅ App Bundle enabled in build script"
else
    echo "❌ App Bundle not enabled in build script"
    exit 1
fi

# Check privacy policy
if grep -q "Privacy Policy" "PRIVACY_POLICY.md"; then
    echo "✅ Privacy policy exists"
else
    echo "❌ Privacy policy not found or incomplete"
    exit 1
fi

echo ""
echo "🎉 Google Play Store Compliance Verification Complete!"
echo ""
echo "✅ All compliance requirements met:"
echo "   - AAB format enabled"
echo "   - Target SDK 34 (Android 14)"
echo "   - Minimum SDK 21 (Android 5.0)"
echo "   - Security settings configured"
echo "   - Privacy policy created"
echo "   - Required files present"
echo ""
echo "🚀 Ready for Google Play Store submission!"
echo ""
echo "Next steps:"
echo "1. Upload AAB to Google Play Console"
echo "2. Complete store listing"
echo "3. Set content rating"
echo "4. Submit for review"