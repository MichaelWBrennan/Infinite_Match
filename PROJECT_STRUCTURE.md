# Project Structure

This document outlines the refactored project structure for the Evergreen Match-3 Unity game.

## Directory Overview

```
/workspace/
├── 📁 assets/                    # Game assets (sprites, audio, etc.)
├── 📁 assets_external/           # External asset libraries
├── 📁 build/                     # Build artifacts and tools
├── 📁 config/                    # Configuration files
│   ├── 📁 levels/               # Level configurations (removed duplicates)
│   ├── 📁 themes/               # Theme configurations
│   └── 📁 remote/               # Remote configuration
├── 📁 deployment/               # Deployment configurations
├── 📁 docs/                     # Documentation
│   ├── 📁 guides/               # Setup and usage guides
│   ├── 📁 reports/              # Analysis reports
│   ├── 📁 features/             # Feature documentation
│   └── 📁 setup/                # Setup instructions
├── 📁 economy/                  # Economy data (CSV files)
├── 📁 i18n/                     # Internationalization files
├── 📁 marketing/                # Marketing materials
├── 📁 metadata/                 # App store metadata
├── 📁 monitoring/               # Monitoring and reports
├── 📁 scripts/                  # Automation and utility scripts
│   ├── 📁 unity/                # Unity-specific scripts
│   ├── 📁 automation/           # General automation
│   ├── 📁 maintenance/          # Health checks and monitoring
│   ├── 📁 setup/                # Setup scripts
│   └── 📁 utilities/            # Utility scripts
├── 📁 server/                   # Backend server
├── 📁 unity/                    # Unity project
│   ├── 📁 Assets/               # Unity assets
│   │   ├── 📁 CloudCode/        # Unity Cloud Code functions
│   │   ├── 📁 Scripts/          # C# scripts
│   │   └── 📁 StreamingAssets/  # Streaming assets
│   └── 📁 Packages/             # Unity packages
└── 📄 README.md                 # Main project README
```

## Key Improvements

### 1. **Consolidated Scripts** (`/scripts/`)
- **Before**: 25+ scripts scattered in root `/scripts/` directory
- **After**: Organized into logical subdirectories:
  - `unity/` - Unity-specific automation
  - `automation/` - General automation
  - `maintenance/` - Health checks and monitoring
  - `setup/` - Initial setup scripts
  - `utilities/` - General utility scripts

### 2. **Organized Documentation** (`/docs/`)
- **Before**: Multiple README files and guides scattered in root
- **After**: Structured documentation with clear categories:
  - `guides/` - Setup and usage guides
  - `reports/` - Analysis and test reports
  - `features/` - Feature documentation
  - `setup/` - Setup instructions

### 3. **Consolidated Configuration** (`/config/`)
- **Before**: Duplicate level files in `/config/levels/` and `/unity/Assets/StreamingAssets/levels/`
- **After**: Single source of truth in Unity StreamingAssets, consolidated remote config

### 4. **Removed Duplicates**
- Removed duplicate cloud code files (kept Unity version)
- Removed duplicate level configuration files
- Consolidated documentation files

### 5. **Standardized Naming**
- **Before**: Mixed naming conventions (`unity_100_percent_working.py`, `UNITY_ECONOMY_INTEGRATION_GUIDE.md`)
- **After**: Consistent snake_case for scripts, kebab-case for documentation

## File Naming Conventions

- **Scripts**: `snake_case.py` (e.g., `unity_automation_main.py`)
- **Documentation**: `kebab-case.md` (e.g., `unity-economy-integration-guide.md`)
- **Configuration**: `snake_case.json` (e.g., `game_config.json`)
- **Directories**: `snake_case/` (e.g., `scripts/unity/`)

## Benefits

1. **Improved Navigation**: Clear directory structure makes it easier to find files
2. **Reduced Duplication**: Eliminated duplicate files and configurations
3. **Better Organization**: Related files are grouped together logically
4. **Consistent Naming**: Standardized naming conventions across the project
5. **Easier Maintenance**: Clear separation of concerns makes maintenance easier
6. **Scalability**: Structure supports future growth and new features

## Migration Notes

- All script references have been updated in documentation
- Unity project structure remains unchanged for compatibility
- Configuration files maintain their original functionality
- No breaking changes to existing workflows