# Evergreen Match-3 (Unity)

This repository now targets Unity for all platforms. Godot content has been removed.

## Quick start
- Unity 2022.3 LTS recommended.
- Open the `unity` folder as the project in Unity Hub.
- Press Play; the Bootstrap scene will show the Main Menu UI.
- Levels are JSON under `unity/Assets/StreamingAssets/levels/`.

## CI/CD
- Android and iOS export workflows use `game-ci/unity-builder`.
- Automated builds and deployments to Google Play and TestFlight.
- Fastlane integration for store metadata and screenshots.
- Provide UNITY_LICENSE and Android/iOS signing secrets in GitHub.

## Deployment

### GitHub Secrets Required

Add the following secrets to your GitHub repository settings:

#### Unity License
- `UNITY_LICENSE` - Your Unity license (base64 encoded)
- `UNITY_EMAIL` - Your Unity account email
- `UNITY_PASSWORD` - Your Unity account password

#### Android Signing
- `ANDROID_KEYSTORE_BASE64` - Your Android keystore file (base64 encoded)
- `ANDROID_KEYSTORE_PASS` - Your keystore password
- `ANDROID_KEYALIAS_NAME` - Your key alias name
- `ANDROID_KEYALIAS_PASS` - Your key alias password

#### Google Play Console
- `GOOGLE_PLAY_JSON` - Your Google Play Console service account JSON key

#### iOS Signing
- `APPLE_TEAM_ID` - Your Apple Developer Team ID
- `APP_STORE_CONNECT_API_KEY` - Your App Store Connect API key (base64 encoded)
- `APP_STORE_CONNECT_ISSUER_ID` - Your App Store Connect issuer ID
- `APP_STORE_CONNECT_KEY_ID` - Your App Store Connect key ID

#### Optional
- `SLACK_WEBHOOK_URL` - Slack webhook URL for deployment notifications

### Workflow Triggers

The CI/CD pipeline is triggered by:
- **Push to `main` branch** - Automatic build and deployment
- **Pull Request to `main`** - Build only (no deployment)
- **Manual trigger** - Use the "Actions" tab to run manually with custom options

### Build Artifacts

- **Android**: AAB files uploaded to Google Play Internal track
- **iOS**: IPA files uploaded to TestFlight
- **Metadata**: Automatically uploaded from `fastlane/metadata/` directory
- **Screenshots**: Automatically uploaded from `fastlane/screenshots/` directory
- **Changelog**: Generated from latest commit message

### Fastlane Integration

The project includes Fastlane configuration for automated store uploads:

- **Android**: Uploads to Google Play Console with metadata and screenshots
- **iOS**: Uploads to TestFlight with metadata and screenshots
- **Metadata**: Store descriptions, titles, and changelogs
- **Screenshots**: App store screenshots for different device sizes

### Manual Fastlane Commands

You can run Fastlane commands locally:

```bash
# Deploy Android to Google Play
fastlane android deploy track:internal

# Deploy iOS to TestFlight
fastlane ios deploy

# Upload metadata only
fastlane upload_metadata_all

# Upload screenshots only
fastlane upload_screenshots_all

# Deploy to both platforms
fastlane deploy_all
```

### Customization

The workflow is modular and can be easily extended:

- **Tracks**: Add new deployment tracks (alpha, beta, production)
- **Platforms**: Add new platforms or modify existing ones
- **Metadata**: Update store descriptions in `fastlane/metadata/`
- **Screenshots**: Add screenshots to `fastlane/screenshots/`
- **Notifications**: Add Slack, Discord, or email notifications

## Features
- Match-3 engine (C#) with LevelManager reading JSON configs.
- Ads/IAP managers (UnityAdsManager, IAPManager stubs) under `unity/Assets/Scripts`.

## Docs
See `/docs` for architecture, economy, live ops, and roadmap.
