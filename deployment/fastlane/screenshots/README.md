# Fastlane Screenshots

This directory contains screenshots for app store listings.

## Directory Structure

```
fastlane/screenshots/
├── android/
│   └── en-US/
│       ├── phoneScreenshots/     # Phone screenshots
│       ├── sevenInchScreenshots/ # 7" tablet screenshots
│       └── tenInchScreenshots/   # 10" tablet screenshots
└── ios/
    └── en-US/
        ├── iPhone6.5/           # iPhone 6.5" screenshots
        ├── iPhone5.5/           # iPhone 5.5" screenshots
        ├── iPadPro/             # iPad Pro screenshots
        └── iPad/                # iPad screenshots
```

## Screenshot Requirements

### Android (Google Play)
- **Phone**: 1080x1920px (9:16 aspect ratio)
- **7" Tablet**: 1200x1920px (5:8 aspect ratio)
- **10" Tablet**: 1600x2560px (5:8 aspect ratio)

### iOS (App Store)
- **iPhone 6.5"**: 1242x2688px (9:19.5 aspect ratio)
- **iPhone 5.5"**: 1242x2208px (9:16 aspect ratio)
- **iPad Pro**: 2048x2732px (4:5.33 aspect ratio)
- **iPad**: 1536x2048px (3:4 aspect ratio)

## Adding Screenshots

1. Take screenshots from your game
2. Resize them to the required dimensions
3. Place them in the appropriate directory
4. Name them descriptively (e.g., `gameplay_1.png`, `menu_2.png`)

## Automatic Upload

Screenshots are automatically uploaded when you run the CI/CD pipeline or Fastlane commands locally.

## Local Testing

To test screenshot upload locally:

```bash
# Upload Android screenshots
fastlane android upload_screenshots

# Upload iOS screenshots
fastlane ios upload_screenshots

# Upload all screenshots
fastlane upload_screenshots_all
```