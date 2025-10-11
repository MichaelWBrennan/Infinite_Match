# Google Play Store Compliance Checklist for Evergreen Puzzler

## ✅ Completed Requirements

### 1. Android App Bundle (AAB) Format
- ✅ Updated build script to generate `.aab` files instead of `.apk`
- ✅ Enabled `EditorUserBuildSettings.buildAppBundle = true`
- ✅ Using Gradle build system

### 2. Target SDK Version
- ✅ Set to Android API Level 34 (Android 14) - Required for 2024
- ✅ Minimum SDK Level 21 (Android 5.0) for broad compatibility

### 3. Android Manifest Configuration
- ✅ Created comprehensive `AndroidManifest.xml` with proper permissions
- ✅ Added required meta-data for Unity Services
- ✅ Configured proper activity settings
- ✅ Added file provider for sharing functionality
- ✅ Included queries for Android 11+ compatibility

### 4. Permissions
- ✅ Only necessary permissions declared
- ✅ Internet permission for Unity Services
- ✅ Network state for connectivity checks
- ✅ Optional permissions marked as `required="false"`
- ✅ No sensitive permissions without justification

### 5. Privacy Policy
- ✅ Created comprehensive privacy policy
- ✅ Covers data collection, usage, and sharing
- ✅ Includes GDPR, CCPA, and COPPA compliance
- ✅ Addresses Unity Analytics and Cloud Services

### 6. Security Settings
- ✅ Disabled cleartext traffic (`usesCleartextTraffic="false"`)
- ✅ Proper backup rules configured
- ✅ Data extraction rules for Android 12+
- ✅ File provider for secure file sharing

## 🔄 Additional Requirements to Complete

### 7. Content Rating
- [ ] Complete Google Play Console content rating questionnaire
- [ ] Ensure game content is appropriate for target age group
- [ ] No violence, inappropriate content, or harmful material

### 8. Store Listing Assets
- [ ] High-quality app icon (512x512 PNG)
- [ ] Feature graphic (1024x500 PNG)
- [ ] Screenshots (minimum 2, recommended 8)
- [ ] App description (4000 characters max)
- [ ] Short description (80 characters max)

### 9. App Signing
- [ ] Generate release keystore for production
- [ ] Configure keystore in Unity build settings
- [ ] Set up Google Play App Signing (recommended)

### 10. Testing Requirements
- [ ] Test on various Android devices and screen sizes
- [ ] Verify performance on low-end devices
- [ ] Test in-app purchases (if applicable)
- [ ] Validate Unity Services integration

### 11. Legal Requirements
- [ ] Terms of Service document
- [ ] End User License Agreement (EULA)
- [ ] Age verification (if applicable)
- [ ] Regional compliance (GDPR, CCPA, etc.)

### 12. Performance Optimization
- [ ] Optimize app size (target < 150MB for initial download)
- [ ] Implement proper memory management
- [ ] Optimize battery usage
- [ ] Test network efficiency

## 🚨 Critical Actions Required

### 1. Keystore Setup
```bash
# Generate release keystore
keytool -genkey -v -keystore evergreen-release.keystore -alias evergreen -keyalg RSA -keysize 2048 -validity 10000
```

### 2. Environment Variables for CI/CD
Set these environment variables in your CI/CD system:
- `KEYSTORE_NAME`: Path to keystore file
- `KEYSTORE_PASS`: Keystore password
- `KEYALIAS_NAME`: Key alias name
- `KEYALIAS_PASS`: Key alias password

### 3. Unity Project Settings
- [ ] Configure Unity Cloud Project ID in manifest
- [ ] Set up proper build configurations
- [ ] Enable ProGuard/R8 for code obfuscation
- [ ] Configure proper app icons and splash screens

### 4. Google Play Console Setup
- [ ] Create Google Play Console account
- [ ] Set up app listing
- [ ] Configure pricing and distribution
- [ ] Set up content rating
- [ ] Upload AAB file for review

## 📋 Pre-Submission Checklist

Before submitting to Google Play Store:

- [ ] All permissions are justified and necessary
- [ ] Privacy policy is accessible and comprehensive
- [ ] App has been tested on multiple devices
- [ ] Performance is optimized for target devices
- [ ] No crashes or major bugs
- [ ] In-app purchases work correctly (if applicable)
- [ ] Unity Services are properly configured
- [ ] App meets Google Play quality guidelines
- [ ] All legal documents are in place
- [ ] Store listing is complete and compelling

## 🔧 Build Commands

### Development Build
```bash
# Set environment variables
export BUILD_TYPE=development
export VERSION=1.0.0
export BUILD_NUMBER=1

# Build Android AAB
Unity -batchmode -quit -projectPath ./unity -executeMethod Evergreen.Editor.BuildScript.CIBuildAndroid
```

### Production Build
```bash
# Set environment variables
export BUILD_TYPE=production
export VERSION=1.0.0
export BUILD_NUMBER=1
export KEYSTORE_NAME=evergreen-release.keystore
export KEYSTORE_PASS=your_keystore_password
export KEYALIAS_NAME=evergreen
export KEYALIAS_PASS=your_key_password

# Build Android AAB
Unity -batchmode -quit -projectPath ./unity -executeMethod Evergreen.Editor.BuildScript.CIBuildAndroid
```

## 📞 Support

For questions about Google Play Store compliance:
- Google Play Console Help: https://support.google.com/googleplay/android-developer
- Unity Android Publishing: https://docs.unity3d.com/Manual/android-publishing.html
- Google Play Policy Center: https://play.google.com/about/developer-content-policy/