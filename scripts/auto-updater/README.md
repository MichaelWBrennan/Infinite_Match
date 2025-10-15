# 🤖 Unity Package & SDK Auto-Updater

An automated system that keeps all Unity packages and SDKs up to date, running daily via GitHub Actions or cron jobs.

## 🚀 Features

- **Daily Updates**: Automatically checks for and applies package updates
- **Smart Updates**: Skips major updates with breaking changes by default
- **Backup & Rollback**: Creates backups before updates and supports rollback
- **Build Testing**: Tests builds after updates to ensure compatibility
- **Multiple Platforms**: Supports WebGL, Android, iOS, and Standalone builds
- **Detailed Reporting**: Generates comprehensive update reports
- **GitHub Integration**: Creates pull requests for updates
- **Local Development**: Supports cron jobs for local development

## 📁 Structure

```
scripts/auto-updater/
├── package-updater.py      # Main Python updater script
├── update-packages.sh      # Shell script for manual execution
├── setup-cron.sh          # Cron job setup script
├── updater-config.yaml    # Configuration file
└── README.md              # This file
```

## 🛠️ Setup

### 1. GitHub Actions (Recommended)

The system is already configured with GitHub Actions workflows:

- **Daily Updates**: Runs automatically at 2 AM UTC
- **Manual Trigger**: Can be triggered manually from GitHub Actions
- **Pull Requests**: Creates PRs for updates
- **Build Testing**: Tests all platforms after updates

### 2. Local Development Setup

For local development, you can set up a cron job:

```bash
# Make scripts executable
chmod +x scripts/auto-updater/*.sh

# Set up daily cron job
./scripts/auto-updater/setup-cron.sh --setup

# Check status
./scripts/auto-updater/setup-cron.sh --status

# Test the system
./scripts/auto-updater/setup-cron.sh --test
```

### 3. Manual Execution

You can also run updates manually:

```bash
# Check for updates only
./scripts/auto-updater/update-packages.sh --check-only

# Run full update process
./scripts/auto-updater/update-packages.sh

# Dry run (preview changes)
./scripts/auto-updater/update-packages.sh --dry-run

# Force update (even if no updates available)
./scripts/auto-updater/update-packages.sh --force-update

# Include major updates with breaking changes
./scripts/auto-updater/update-packages.sh --update-major
```

## ⚙️ Configuration

Edit `updater-config.yaml` to customize the behavior:

```yaml
# Update schedule
schedule:
  cron: "0 2 * * *"  # Daily at 2 AM UTC
  timezone: "UTC"

# Package update settings
packages:
  unity_packages:
    - "com.unity.analytics"
    - "com.unity.cloud.build"
    # ... more packages

# Update behavior
update_behavior:
  auto_apply_minor: true
  auto_apply_patch: true
  auto_apply_major: false  # Requires manual approval
  skip_breaking_changes: true
  max_updates_per_run: 10
```

## 📊 Monitoring

### Logs

- **Cron Logs**: `logs/cron.log` (for cron jobs)
- **Update Logs**: `logs/package-updater.log`
- **Build Logs**: `logs/unity.log`

### Reports

- **Update Reports**: `reports/update_report_YYYYMMDD_HHMMSS.json`
- **Package Versions Cache**: `reports/package-versions-cache.json`

### Backups

- **Backup Directory**: `backups/backup_YYYYMMDD_HHMMSS/`
- **Backup Retention**: 7 days (configurable)

## 🔧 Commands

### Package Updater Script

```bash
# Basic usage
python3 scripts/auto-updater/package-updater.py

# Check for updates only
python3 scripts/auto-updater/package-updater.py --check-only

# Dry run (preview changes)
python3 scripts/auto-updater/package-updater.py --dry-run

# Force update
python3 scripts/auto-updater/package-updater.py --force-update

# Include major updates
python3 scripts/auto-updater/package-updater.py --update-major

# Create backup only
python3 scripts/auto-updater/package-updater.py --backup-only

# Rollback to specific backup
python3 scripts/auto-updater/package-updater.py --rollback backup_20241201_120000
```

### Shell Script

```bash
# Check for updates
./scripts/auto-updater/update-packages.sh --check-only

# Run full update
./scripts/auto-updater/update-packages.sh

# Dry run
./scripts/auto-updater/update-packages.sh --dry-run

# Force update
./scripts/auto-updater/update-packages.sh --force-update

# Include major updates
./scripts/auto-updater/update-packages.sh --update-major

# Create backup
./scripts/auto-updater/update-packages.sh --backup-only

# List backups
./scripts/auto-updater/update-packages.sh --list-backups

# Rollback
./scripts/auto-updater/update-packages.sh --rollback backup_20241201_120000

# Test build
./scripts/auto-updater/update-packages.sh --test-build
```

### Cron Setup Script

```bash
# Set up cron job
./scripts/auto-updater/setup-cron.sh --setup

# Verify cron job
./scripts/auto-updater/setup-cron.sh --verify

# Test update script
./scripts/auto-updater/setup-cron.sh --test

# Show status
./scripts/auto-updater/setup-cron.sh --status

# Remove cron job
./scripts/auto-updater/setup-cron.sh --remove
```

## 📦 Supported Packages

### Unity Packages
- Unity Analytics
- Unity Cloud Build
- Unity Remote Config
- Unity Services (Analytics, Authentication, Core, Economy)
- Unity TextMeshPro
- Unity Timeline
- Unity UGUI
- Unity Purchasing
- Unity Ads
- Unity Addressables
- Universal Render Pipeline (URP)
- Unity Visual Scripting
- Unity Input System
- Unity Cinemachine
- Unity Post Processing
- Unity Shader Graph
- Unity ProBuilder
- Unity Terrain Tools
- Unity AI Navigation
- Unity Multiplayer Tools
- Unity Netcode for GameObjects
- Unity Transport
- Unity Cloud Services

### Third-Party Packages
- UniTask
- UniRx
- DOTween
- Prime31 Character Controllers
- And more...

## 🔄 Update Process

1. **Check for Updates**: Scans all configured packages for newer versions
2. **Create Backup**: Creates a backup of current state
3. **Apply Updates**: Updates packages (respecting configuration rules)
4. **Test Builds**: Runs build tests on all configured platforms
5. **Generate Report**: Creates detailed update report
6. **Create PR**: Creates GitHub pull request (if using GitHub Actions)
7. **Rollback**: Automatically rolls back if builds fail

## 🚨 Safety Features

- **Backup Before Updates**: Always creates backup before making changes
- **Build Testing**: Tests builds after updates to ensure compatibility
- **Automatic Rollback**: Rolls back if builds fail
- **Breaking Change Detection**: Skips updates with known breaking changes
- **Major Update Protection**: Requires manual approval for major updates
- **Vulnerability Scanning**: Scans packages for security vulnerabilities

## 📈 Reporting

### Update Reports

Each update generates a detailed JSON report:

```json
{
  "timestamp": "2024-12-01T12:00:00Z",
  "total_updates": 5,
  "successful_updates": 4,
  "failed_updates": 1,
  "skipped_updates": 0,
  "updates": [
    {
      "package": "com.unity.analytics",
      "status": "success",
      "old_version": "3.8.1",
      "new_version": "4.0.0",
      "test_passed": true
    }
  ]
}
```

### GitHub Integration

- **Pull Requests**: Automatically creates PRs for updates
- **Build Status**: Shows build test results
- **Update Summary**: Detailed summary of changes
- **Artifacts**: Uploads build artifacts and reports

## 🛠️ Troubleshooting

### Common Issues

1. **Unity Not Found**: Ensure Unity is in PATH or set UNITY_EXECUTABLE
2. **Permission Denied**: Check file permissions for scripts and directories
3. **Build Failures**: Check Unity project configuration and dependencies
4. **Package Conflicts**: Resolve package conflicts manually
5. **Network Issues**: Check internet connection for package downloads

### Debug Mode

Enable debug logging by setting the log level in `updater-config.yaml`:

```yaml
logging:
  level: "DEBUG"
```

### Manual Rollback

If automatic rollback fails:

```bash
# List available backups
./scripts/auto-updater/update-packages.sh --list-backups

# Rollback to specific backup
./scripts/auto-updater/update-packages.sh --rollback backup_20241201_120000
```

## 🔧 Customization

### Adding New Packages

Edit `updater-config.yaml` to add new packages:

```yaml
packages:
  unity_packages:
    - "com.unity.new-package"
  third_party_packages:
    - "com.new-vendor.new-package"
```

### Custom Update Rules

Modify `package-updater.py` to add custom update logic:

```python
def custom_update_rule(package_name, current_version, latest_version):
    # Custom logic here
    return should_update
```

### Custom Build Tests

Add custom build tests in Unity:

```csharp
[MenuItem("Build/Test Build")]
public static void TestBuild()
{
    // Custom build test logic
}
```

## 📚 Dependencies

- Python 3.11+
- Unity 2024.3 LTS
- Git
- Bash (for shell scripts)

### Python Packages

- requests
- pyyaml

Install with:
```bash
pip install requests pyyaml
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues and questions:

1. Check the troubleshooting section
2. Review the logs
3. Create an issue on GitHub
4. Contact the development team

---

**Happy Updating! 🚀**