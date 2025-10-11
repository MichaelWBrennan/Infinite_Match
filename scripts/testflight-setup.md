# TestFlight Setup Guide for Evergreen Puzzler

## Overview
TestFlight is Apple's beta testing platform that allows you to distribute pre-release versions of your app to internal and external testers.

## Prerequisites
- Apple Developer Account ($99/year)
- App Store Connect access
- iOS app built and ready for testing
- Provisioning profiles configured

## Step 1: App Store Connect Setup

### 1.1 Create App Record
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click "My Apps" > "+" > "New App"
3. Fill in app information:
   - **Platform**: iOS
   - **Name**: Evergreen Puzzler
   - **Primary Language**: English (U.S.)
   - **Bundle ID**: com.evergreen.match3
   - **SKU**: evergreen-match3-ios
   - **User Access**: Full Access

### 1.2 App Information
- **Category**: Games > Puzzle
- **Content Rights**: No third-party content
- **Age Rating**: 4+ (Ages 4 and up)
- **App Store Availability**: All countries and regions

## Step 2: TestFlight Configuration

### 2.1 Internal Testing
1. Go to your app in App Store Connect
2. Click "TestFlight" tab
3. Click "Internal Testing" > "+" to add internal testers
4. Add team members who can test the app
5. Upload your first build

### 2.2 External Testing
1. Click "External Testing" > "+"
2. Create a new group (e.g., "Beta Testers")
3. Add external testers by email
4. Configure testing details:
   - **What to Test**: Core gameplay, UI/UX, performance
   - **Feedback**: How to provide feedback
   - **Test Information**: Instructions for testers

## Step 3: Build Upload

### 3.1 Xcode Archive
```bash
# Build iOS app
Unity -batchmode -quit -projectPath ./unity -executeMethod Evergreen.Editor.BuildScript.CIBuildiOS

# Open Xcode project
open build/iOS/Unity-iPhone.xcodeproj

# Archive the app
# In Xcode: Product > Archive
```

### 3.2 Upload to App Store Connect
1. In Xcode Organizer, select your archive
2. Click "Distribute App"
3. Select "App Store Connect"
4. Select "Upload"
5. Choose your distribution certificate
6. Click "Upload"

## Step 4: TestFlight Build Management

### 4.1 Build Processing
- Apple processes builds (usually 10-60 minutes)
- You'll receive email when processing is complete
- Builds are available for testing once processed

### 4.2 Build Information
- **Version**: 1.0.0 (1)
- **Build**: 1
- **Status**: Ready to Test
- **TestFlight**: Enabled

### 4.3 Testing Groups
- **Internal Testing**: Up to 100 team members
- **External Testing**: Up to 10,000 testers
- **External Testing Review**: Apple reviews before release

## Step 5: Tester Management

### 5.1 Internal Testers
- Team members with App Store Connect access
- No review required
- Immediate access to builds

### 5.2 External Testers
- Anyone with Apple ID
- Apple review required (24-48 hours)
- Limited to 10,000 testers
- 90-day testing period per build

### 5.3 Tester Invitations
1. Go to TestFlight > External Testing
2. Click your testing group
3. Click "Add Testers"
4. Enter email addresses
5. Send invitations

## Step 6: Testing Process

### 6.1 Tester Experience
1. Receive email invitation
2. Install TestFlight app from App Store
3. Accept invitation in TestFlight
4. Download and install your app
5. Test and provide feedback

### 6.2 Feedback Collection
- **In-App Feedback**: TestFlight provides feedback button
- **Crash Reports**: Automatically collected
- **Analytics**: Available in App Store Connect
- **Reviews**: Testers can leave reviews

## Step 7: Build Updates

### 7.1 Upload New Build
1. Increment build number in Unity
2. Build and archive new version
3. Upload to App Store Connect
4. Add to TestFlight groups

### 7.2 Version Management
- **Version**: Major version (1.0.0)
- **Build**: Incremental build number (1, 2, 3...)
- **TestFlight**: Each build is separate

## Step 8: App Store Submission

### 8.1 Final Build
1. Complete all testing
2. Fix any critical issues
3. Upload final build
4. Submit for App Store review

### 8.2 Review Process
- **Review Time**: 24-48 hours typically
- **Status Updates**: Available in App Store Connect
- **Rejection**: Fix issues and resubmit

## TestFlight Best Practices

### 9.1 Testing Strategy
- **Internal Testing**: Core functionality, critical bugs
- **External Testing**: User experience, edge cases
- **Beta Testing**: Real-world usage, performance

### 9.2 Communication
- **Release Notes**: Clear description of changes
- **Testing Instructions**: What to test and how
- **Feedback Channels**: How to report issues

### 9.3 Build Quality
- **Stability**: No crashes or major bugs
- **Performance**: Smooth gameplay
- **Features**: Complete functionality
- **UI/UX**: Polished user interface

## Troubleshooting

### 10.1 Common Issues
- **Build Processing Failed**: Check certificates and provisioning
- **Tester Can't Install**: Verify device compatibility
- **App Crashes**: Check crash reports in App Store Connect

### 10.2 Support Resources
- [TestFlight Documentation](https://developer.apple.com/testflight/)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [Unity iOS Publishing](https://docs.unity3d.com/Manual/iphone-publishing.html)

## Environment Variables for CI/CD

```bash
# Required environment variables
export APPLE_TEAM_ID="[Your Team ID]"
export PROVISIONING_PROFILE_ID="[Your Profile ID]"
export UNITY_CLOUD_PROJECT_ID="[Your Unity Project ID]"
export BUILD_TYPE="production"
export VERSION="1.0.0"
export BUILD_NUMBER="1"
```

## Build Commands

```bash
# Development build
Unity -batchmode -quit -projectPath ./unity -executeMethod Evergreen.Editor.BuildScript.CIBuildiOS

# Production build
export BUILD_TYPE=production
export APPLE_TEAM_ID="[Your Team ID]"
export PROVISIONING_PROFILE_ID="[Your Profile ID]"
Unity -batchmode -quit -projectPath ./unity -executeMethod Evergreen.Editor.BuildScript.CIBuildiOS
```

## Success Checklist

- [ ] Apple Developer Account active
- [ ] App Store Connect app created
- [ ] Certificates and provisioning profiles configured
- [ ] Unity build settings configured
- [ ] iOS app built successfully
- [ ] App uploaded to App Store Connect
- [ ] TestFlight groups created
- [ ] Testers invited
- [ ] Testing completed
- [ ] App submitted for review
- [ ] App approved and published

Your iOS app is now ready for TestFlight testing and App Store submission! 🎉