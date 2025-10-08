# Unity Headless Build System

This repository is configured for **completely headless Unity development** - you never need to open the Unity Editor. All builds, tests, and deployments are handled automatically via GitHub Actions.

## 🎯 Overview

- **Zero Unity Editor interaction** - Everything runs in CI/CD
- **Multi-platform builds** - Windows, Linux, WebGL, Android, iOS
- **Automated testing** - Headless tests run on every build
- **Deployment ready** - Stubs for Itch.io, Steam, Google Play, App Store, Netlify
- **Complete automation** - Push to main → automatic build and test

## 🚀 Quick Start

### 1. Configure Unity Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

```
UNITY_EMAIL=your-unity-email@example.com
UNITY_PASSWORD=your-unity-password
UNITY_LICENSE=your-unity-license-string
```

**How to get Unity License:**
1. Download Unity Hub
2. Sign in with your Unity account
3. Go to Settings → License Management
4. Copy the license string

### 2. Trigger Your First Build

```bash
# Push to main branch
git push origin main

# Or manually trigger via GitHub Actions
# Go to Actions tab → Unity Headless Build & Test → Run workflow
```

### 3. Download Builds

After the workflow completes:
1. Go to the Actions tab
2. Click on the latest workflow run
3. Scroll down to "Artifacts"
4. Download the platform builds you need

## 📁 Project Structure

```
unity/
├── Assets/
│   ├── Scenes/
│   │   ├── Bootstrap.unity          # Entry point for headless builds
│   │   ├── MainMenu.unity           # Main menu scene
│   │   └── Gameplay.unity           # Gameplay scene
│   ├── Scripts/
│   │   ├── App/
│   │   │   ├── Bootstrap.cs         # Original bootstrap
│   │   │   └── BootstrapHeadless.cs # Headless-specific bootstrap
│   │   ├── Core/
│   │   │   └── GameManager.cs       # Main game manager
│   │   ├── Editor/
│   │   │   └── BuildScript.cs       # Build automation script
│   │   └── Testing/
│   │       └── HeadlessTests.cs     # Headless test suite
│   └── StreamingAssets/             # Game data files
├── Packages/
│   └── manifest.json                # Unity package dependencies
└── ProjectSettings/
    └── ProjectSettings.asset        # Unity project settings
```

## 🔧 Adding C# Scripts and Assets

### Adding New Scripts

1. **Create your script** in the appropriate folder:
   ```csharp
   // Assets/Scripts/YourFeature/YourScript.cs
   using UnityEngine;
   
   public class YourScript : MonoBehaviour
   {
       void Start()
       {
           Debug.Log("Your script is working!");
       }
   }
   ```

2. **Commit and push**:
   ```bash
   git add Assets/Scripts/YourFeature/YourScript.cs
   git commit -m "Add new feature script"
   git push origin main
   ```

3. **The build will automatically include your script** - no Unity Editor needed!

### Adding Assets

1. **Place assets** in the appropriate folder:
   ```
   Assets/
   ├── Textures/          # Images, sprites
   ├── Audio/            # Sound effects, music
   ├── Models/           # 3D models
   ├── Prefabs/          # Prefab objects
   └── Materials/        # Materials
   ```

2. **Reference in code**:
   ```csharp
   public Sprite mySprite;
   public AudioClip mySound;
   public GameObject myPrefab;
   ```

3. **Commit and push** - assets are automatically included in builds!

### Adding New Scenes

1. **Create scene file** (copy from existing scene)
2. **Add to BuildScript.cs**:
   ```csharp
   private static readonly string[] Scenes = {
       "Assets/Scenes/Bootstrap.unity",
       "Assets/Scenes/MainMenu.unity",
       "Assets/Scenes/Gameplay.unity",
       "Assets/Scenes/YourNewScene.unity"  // Add here
   };
   ```

## 🧪 Testing

### Writing Tests

Add tests to `Assets/Scripts/Testing/HeadlessTests.cs`:

```csharp
[Test]
public void YourFeature_WorksCorrectly()
{
    // Arrange
    var yourObject = new GameObject("TestObject");
    var yourComponent = yourObject.AddComponent<YourScript>();
    
    // Act
    yourComponent.DoSomething();
    
    // Assert
    Assert.IsTrue(yourComponent.IsWorking);
    
    // Clean up
    Object.DestroyImmediate(yourObject);
}
```

### Test Categories

- **Unit Tests**: Test individual components
- **Integration Tests**: Test component interactions
- **Performance Tests**: Test memory usage, frame rate
- **Headless Tests**: Test without user interaction

## 🏗️ Build Configuration

### Build Scripts

The `BuildScript.cs` handles all platform builds:

- **Windows**: Standalone Windows 64-bit
- **Linux**: Standalone Linux 64-bit  
- **WebGL**: Web browser builds
- **Android**: APK builds
- **iOS**: Xcode project for App Store

### Build Settings

Modify build settings in `BuildScript.cs`:

```csharp
private static void SetWindowsSettings()
{
    PlayerSettings.SetScriptingBackend(BuildTargetGroup.Standalone, ScriptingImplementation.Mono);
    PlayerSettings.stripEngineCode = !IsDevelopmentBuild();
    // Add your custom settings here
}
```

### Version Management

Versions are automatically managed:
- **Version**: From `VERSION` environment variable or project settings
- **Build Number**: From `BUILD_NUMBER` environment variable
- **Build Type**: From `BUILD_TYPE` environment variable (development/release)

## 🚀 Deployment (Optional)

### Enable Deployment

Uncomment the deployment section in `.github/workflows/unity-build.yml`:

```yaml
# deploy:
#   name: Deploy Builds
#   runs-on: ubuntu-latest
#   needs: [build-windows, build-linux, build-webgl, build-android, build-ios]
#   if: github.ref == 'refs/heads/main'
```

### Configure Deployment Secrets

Add these secrets for deployment:

```
# Itch.io
ITCH_USERNAME=your-itch-username
ITCH_GAME=your-game-name
BUTLER_API_KEY=your-butler-api-key

# Steam
STEAM_USERNAME=your-steam-username
STEAM_PASSWORD=your-steam-password
STEAM_SSFN=your-ssfn-file
STEAM_SSFN_SECRET=your-ssfn-secret
STEAM_APPID=your-app-id
STEAM_DEPOT=your-depot-id

# Google Play
GOOGLE_PLAY_SERVICE_ACCOUNT_JSON=your-service-account-json

# iOS App Store
APPLE_ID=your-apple-id
APPLE_APP_SPECIFIC_PASSWORD=your-app-specific-password
APPLE_TEAM_ID=your-team-id

# Netlify (for WebGL)
NETLIFY_AUTH_TOKEN=your-netlify-token
NETLIFY_SITE_ID=your-site-id
```

### Deployment Platforms

- **Itch.io**: Automatic upload via Butler
- **Steam**: Automatic upload via SteamPipe
- **Google Play**: Automatic APK/AAB upload
- **App Store**: Automatic IPA upload
- **Netlify**: Automatic WebGL deployment

## 🔍 Troubleshooting

### Build Failures

1. **Check the Actions tab** for detailed error logs
2. **Common issues**:
   - Missing Unity secrets
   - Script compilation errors
   - Missing dependencies
   - Platform-specific build errors

### Test Failures

1. **Check test results** in the Actions artifacts
2. **Common issues**:
   - Assertion failures
   - Timeout errors
   - Memory leaks
   - Performance issues

### Debugging

1. **Enable debug logging** in your scripts:
   ```csharp
   Debug.Log("Debug message");
   Debug.LogError("Error message");
   ```

2. **Check build logs** in GitHub Actions for detailed output

3. **Use headless testing** to verify functionality without UI

## 📊 Monitoring

### Build Status

- **Green checkmark**: All builds and tests passed
- **Red X**: Build or test failed
- **Yellow circle**: Build in progress

### Performance Metrics

- **Build time**: How long each platform takes to build
- **Test duration**: How long tests take to run
- **Build size**: Size of each platform build
- **Memory usage**: Memory consumption during tests

### Notifications

Configure notifications in GitHub:
1. Go to Settings → Notifications
2. Enable "Actions" notifications
3. Choose email or webhook notifications

## 🎮 Game Development Workflow

### Daily Development

1. **Write code** in your favorite editor
2. **Add assets** to the appropriate folders
3. **Write tests** for new functionality
4. **Commit and push** to trigger builds
5. **Download builds** from GitHub Actions
6. **Test locally** with downloaded builds

### Feature Development

1. **Create feature branch**:
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Develop and test**:
   ```bash
   git add .
   git commit -m "Add new feature"
   git push origin feature/new-feature
   ```

3. **Create pull request** - builds run automatically
4. **Merge to main** - triggers full build and deployment

### Release Process

1. **Update version** in `ProjectSettings.asset`
2. **Tag release**:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
3. **Deploy automatically** to all platforms

## 🛠️ Advanced Configuration

### Custom Build Steps

Add custom build steps in `BuildScript.cs`:

```csharp
private static void CustomBuildStep()
{
    // Your custom build logic here
    Debug.Log("Running custom build step...");
}
```

### Environment Variables

Use environment variables for configuration:

```csharp
string apiKey = Environment.GetEnvironmentVariable("API_KEY");
string buildType = Environment.GetEnvironmentVariable("BUILD_TYPE");
```

### Conditional Builds

Build only specific platforms:

```yaml
# In workflow file
if: github.event.inputs.platform == 'windows'
```

## 📚 Resources

- [Unity Test Framework](https://docs.unity3d.com/Packages/com.unity.test-framework@latest/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Unity Cloud Build](https://unity.com/products/cloud-build)
- [Unity Services](https://unity.com/products/unity-services)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Push and create a pull request
6. The CI system will automatically test your changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Happy headless game development! 🎮✨**