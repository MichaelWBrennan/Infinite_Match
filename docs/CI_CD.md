# CI/CD

## Goals
- Fast iteration and reproducible builds for Android/iOS
- Nightly content validation and remote-config sanity checks

## GitHub Actions (suggested)
- `.github/workflows/android.yml`: Godot headless export to Android, upload artifacts
- `.github/workflows/ios.yml`: Godot headless export to iOS (macOS runner)
- Add a `validate-levels` job to parse `config/levels/*.json` and run a quick solver sim

## Store Readiness
- Receipt validation hooks present
- Price string bridges in place

## Next Steps
- Add keystore handling (GitHub secrets), versioning, changelog
- Integrate PlayFab/Firebase deploy for remote-config defaults
