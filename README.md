# Evergreen Match-3 (Unity)

This repository now targets Unity for all platforms. Godot content has been removed.

## Quick start
- Unity 2022.3 LTS recommended.
- Open the `unity` folder as the project in Unity Hub.
- Press Play; the Bootstrap scene will show the Main Menu UI.
- Levels are JSON under `unity/Assets/StreamingAssets/levels/`.

## CI
- Android and iOS export workflows use `game-ci/unity-builder`.
- Provide UNITY_LICENSE and Android/iOS signing secrets in GitHub.

## Features
- Match-3 engine (C#) with LevelManager reading JSON configs.
- Ads/IAP managers (UnityAdsManager, IAPManager stubs) under `unity/Assets/Scripts`.

## Docs
See `/docs` for architecture, economy, live ops, and roadmap.
