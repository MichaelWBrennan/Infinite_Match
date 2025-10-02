Idle Tap Cash: Evergreen

How to run:
- Open in Godot 4.3+
- Ensure autoloads are set (already configured in `project.godot`)
- Play main scene `res://scenes/Main.tscn`

Monetization:
- Rewarded: simulated in editor; on device, integrates with any available ad singleton. Track events via ByteBrew.
- Interstitials: triggered on button or after N taps (remote-configurable).
- IAP: sample stubs; integrate store-specific plugin if desired. Purchase tracked via ByteBrew.

Analytics:
- ByteBrew plugins are included for Android/iOS. Configure Game ID and Secret Key in export settings per ByteBrew docs. Remote configs read keys like `reward_boost`, `interstitial_interval`, `ad_rewarded_android`, `ad_interstitial_android`, `ad_rewarded_ios`, `ad_interstitial_ios`.

CI/CD:
- Android: `.github/workflows/android.yml` exports a release APK.
- iOS: `.github/workflows/ios.yml` exports Xcode project and builds IPA when signing secrets are provided.

Assets:
- All placeholders are simple generated UI and OFL-friendly guidance.
