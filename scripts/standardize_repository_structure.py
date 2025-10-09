#!/usr/bin/env python3
"""
Repository Structure Standardization Script
Ensures the repository follows industry standard file structure
"""

import os
import shutil
from pathlib import Path
import json
from datetime import datetime

class RepositoryStandardizer:
    def __init__(self):
        self.repo_root = Path(".")
        self.backup_dir = Path("structure_standardization_backup")
        self.changes_log = []
        
    def log_change(self, action, source, destination="", reason=""):
        """Log structural changes"""
        change = {
            "timestamp": datetime.now().isoformat(),
            "action": action,
            "source": str(source),
            "destination": str(destination),
            "reason": reason
        }
        self.changes_log.append(change)
        print(f"{action.upper()}: {source} -> {destination} - {reason}")

    def create_backup(self):
        """Create backup before making changes"""
        if not self.backup_dir.exists():
            self.backup_dir.mkdir(parents=True)
        print(f"📁 Backup created at: {self.backup_dir}")

    def standardize_root_structure(self):
        """Ensure root directory follows industry standards"""
        print("\n=== STANDARDIZING ROOT STRUCTURE ===")
        
        # Move configuration files to proper locations
        config_files = [
            ("eslint.config.js", "config/"),
            (".eslintrc.js", "config/"),
            ("jest.config.js", "config/"),
            ("pylintrc", "config/"),
        ]
        
        for file_name, target_dir in config_files:
            source = self.repo_root / file_name
            if source.exists():
                target = self.repo_root / target_dir / file_name
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.move(str(source), str(target))
                self.log_change("MOVED", source, target, "Configuration file to config/ directory")

    def standardize_documentation_structure(self):
        """Ensure documentation follows industry standards"""
        print("\n=== STANDARDIZING DOCUMENTATION STRUCTURE ===")
        
        # Move root-level documentation to docs/
        root_docs = [
            "CODING_STANDARDS.md",
            "CONTRIBUTING.md", 
            "PROJECT_STRUCTURE.md",
            "FINAL_REDUNDANCY_CLEANUP_SUMMARY.md",
            "economy_conversion_report.md",
            "health-report.md",
            "deployment-status.json",
            "ai_optimization_report.json"
        ]
        
        for doc in root_docs:
            source = self.repo_root / doc
            if source.exists():
                if doc.endswith('.json'):
                    target = self.repo_root / "docs" / "reports" / doc
                else:
                    target = self.repo_root / "docs" / doc
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.move(str(source), str(target))
                self.log_change("MOVED", source, target, "Documentation to docs/ directory")

    def standardize_scripts_structure(self):
        """Ensure scripts follow industry standards"""
        print("\n=== STANDARDIZING SCRIPTS STRUCTURE ===")
        
        # Move utility scripts to proper locations
        script_moves = [
            ("import_csv_to_dashboard.sh", "scripts/utilities/"),
            ("scripts/trigger_deployment.sh", "scripts/deployment/"),
            ("scripts/run-all-checks.sh", "scripts/health/"),
            ("scripts/auto-fix-all.sh", "scripts/quality/"),
        ]
        
        for script, target_dir in script_moves:
            source = self.repo_root / script
            if source.exists():
                target = self.repo_root / target_dir / Path(script).name
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.move(str(source), str(target))
                self.log_change("MOVED", source, target, f"Script to {target_dir}")

    def standardize_config_structure(self):
        """Ensure configuration follows industry standards"""
        print("\n=== STANDARDIZING CONFIG STRUCTURE ===")
        
        # Ensure config directory has proper structure
        config_dirs = [
            "config/linting/",
            "config/testing/",
            "config/build/",
            "config/deployment/"
        ]
        
        for config_dir in config_dirs:
            dir_path = self.repo_root / config_dir
            dir_path.mkdir(parents=True, exist_ok=True)
            
        # Move config files to appropriate subdirectories
        config_moves = [
            ("config/eslint.config.js", "config/linting/"),
            ("config/.eslintrc.js", "config/linting/"),
            ("config/jest.config.js", "config/testing/"),
            ("config/pylintrc", "config/linting/"),
        ]
        
        for source, target_dir in config_moves:
            source_path = self.repo_root / source
            if source_path.exists():
                target = self.repo_root / target_dir / source_path.name
                shutil.move(str(source_path), str(target))
                self.log_change("MOVED", source_path, target, f"Config file to {target_dir}")

    def standardize_assets_structure(self):
        """Ensure assets follow industry standards"""
        print("\n=== STANDARDIZING ASSETS STRUCTURE ===")
        
        # Ensure assets have proper subdirectories
        asset_dirs = [
            "assets/images/",
            "assets/audio/",
            "assets/fonts/",
            "assets/icons/",
            "assets/animations/",
            "assets/effects/"
        ]
        
        for asset_dir in asset_dirs:
            dir_path = self.repo_root / asset_dir
            dir_path.mkdir(parents=True, exist_ok=True)

    def standardize_unity_structure(self):
        """Ensure Unity project follows industry standards"""
        print("\n=== STANDARDIZING UNITY STRUCTURE ===")
        
        # Ensure Unity project has proper structure
        unity_dirs = [
            "unity/Assets/Scripts/",
            "unity/Assets/Prefabs/",
            "unity/Assets/Materials/",
            "unity/Assets/Textures/",
            "unity/Assets/Audio/",
            "unity/Assets/Animations/",
            "unity/Assets/UI/",
            "unity/Assets/Scenes/",
            "unity/Assets/StreamingAssets/",
            "unity/Assets/Resources/",
            "unity/Assets/Editor/",
            "unity/ProjectSettings/",
            "unity/Packages/"
        ]
        
        for unity_dir in unity_dirs:
            dir_path = self.repo_root / unity_dir
            dir_path.mkdir(parents=True, exist_ok=True)

    def create_standard_readme(self):
        """Create industry-standard README structure"""
        print("\n=== CREATING STANDARD README ===")
        
        readme_content = """# Evergreen Puzzler - Match-3 Unity Game

[![CI/CD](https://github.com/MichaelWBrennan/MobileGameSDK/workflows/Optimized%20CI/CD%20Pipeline/badge.svg)](https://github.com/MichaelWBrennan/MobileGameSDK/actions)
[![Unity](https://img.shields.io/badge/Unity-2022.3.21f1-blue.svg)](https://unity3d.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A comprehensive Match-3 puzzle game built with Unity, featuring advanced automation, CI/CD pipelines, and cloud services integration.

## 🎮 Features

- **Match-3 Gameplay**: Classic puzzle mechanics with modern enhancements
- **Economy System**: Currencies, inventory, and virtual purchases
- **Cloud Services**: Unity Cloud integration for analytics and remote config
- **Automation**: Comprehensive CI/CD and deployment automation
- **Multi-platform**: Support for Windows, iOS, Android, and WebGL

## 🚀 Quick Start

### Prerequisites

- Unity 2022.3.21f1 or later
- Node.js 18+ (for automation scripts)
- Python 3.9+ (for utility scripts)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/MichaelWBrennan/MobileGameSDK.git
   cd MobileGameSDK
   ```

2. **Install dependencies**
   ```bash
   npm install
   pip install -r requirements.txt
   ```

3. **Open in Unity**
   - Open Unity Hub
   - Add project from `unity/` directory
   - Open the project

### Development

```bash
# Run health checks
npm run health

# Run automation
npm run automation

# Deploy economy data
npm run economy:deploy

# Deploy Unity services
npm run unity:deploy
```

## 📁 Project Structure

```
├── assets/                 # Game assets
├── cloud-code/            # Unity Cloud Code functions
├── config/                # Configuration files
├── docs/                  # Documentation
├── economy/               # Economy data (CSV files)
├── scripts/               # Automation and utility scripts
├── src/                   # Server-side code
├── unity/                 # Unity project
└── .github/workflows/     # CI/CD pipelines
```

## 🔧 Configuration

### Unity Cloud Services

Set up your Unity Cloud credentials in GitHub Secrets:

- `UNITY_PROJECT_ID`
- `UNITY_ENV_ID`
- `UNITY_CLIENT_ID`
- `UNITY_CLIENT_SECRET`

### Environment Variables

```bash
export UNITY_PROJECT_ID="your-project-id"
export UNITY_ENV_ID="your-environment-id"
export UNITY_CLIENT_ID="your-client-id"
export UNITY_CLIENT_SECRET="your-client-secret"
```

## 📚 Documentation

- [Architecture](docs/architecture.md)
- [Economy System](docs/economy.md)
- [CI/CD Pipeline](docs/CI_CD.md)
- [Setup Guide](docs/setup/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and checks
5. Submit a pull request

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for detailed guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- [Issues](https://github.com/MichaelWBrennan/MobileGameSDK/issues)
- [Discussions](https://github.com/MichaelWBrennan/MobileGameSDK/discussions)
- [Unity Documentation](https://docs.unity3d.com/)

---

**Built with ❤️ using Unity, Node.js, and modern development practices.**
"""
        
        with open("README.md", "w") as f:
            f.write(readme_content)
        
        self.log_change("CREATED", "README.md", "", "Industry-standard README structure")

    def create_gitignore_standard(self):
        """Ensure .gitignore follows industry standards"""
        print("\n=== CREATING STANDARD .GITIGNORE ===")
        
        gitignore_content = """# Unity
[Ll]ibrary/
[Tt]emp/
[Oo]bj/
[Bb]uild/
[Bb]uilds/
[Ll]ogs/
[Uu]ser[Ss]ettings/
MemoryCaptures/
[Aa]ssets/AssetStoreTools*
[Aa]ssets/Plugins/Editor/JetBrains*
.vs/
.vscode/
*.tmp
*.user
*.userprefs
*.pidb
*.booproj
*.svd
*.pdb
*.mdb
*.opendb
*.VC.db
*.pidb.meta
*.pdb.meta
*.mdb.meta
*.VC.VC.opendb
*.VC.VC.opendb.meta
sysinfo.txt
*.apk
*.aab
*.unitypackage
*.app

# Node.js
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.npm
.yarn-integrity
package-lock.json
yarn.lock

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST

# IDEs
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Dependency directories
node_modules/
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env
.env.test
.env.local
.env.development.local
.env.test.local
.env.production.local

# Backup files
*_backup/
backup/
redundancy_cleanup_backup/
structure_standardization_backup/

# Temporary files
*.tmp
*.temp
temp/
tmp/

# Build artifacts
build/
dist/
out/

# Test results
test-results/
coverage/
.nyc_output/

# Documentation build
docs/_build/
site/
"""
        
        with open(".gitignore", "w") as f:
            f.write(gitignore_content)
        
        self.log_change("CREATED", ".gitignore", "", "Industry-standard .gitignore")

    def generate_structure_report(self):
        """Generate structure standardization report"""
        report = {
            "standardization_timestamp": datetime.now().isoformat(),
            "total_changes": len(self.changes_log),
            "changes_by_type": {},
            "new_structure": self.get_current_structure(),
            "changes": self.changes_log
        }
        
        # Count changes by type
        for change in self.changes_log:
            action = change["action"]
            if action not in report["changes_by_type"]:
                report["changes_by_type"][action] = 0
            report["changes_by_type"][action] += 1
        
        # Save report
        with open("structure_standardization_report.json", "w") as f:
            json.dump(report, f, indent=2)
        
        print(f"\n=== STRUCTURE STANDARDIZATION REPORT ===")
        print(f"Total changes: {report['total_changes']}")
        for action, count in report["changes_by_type"].items():
            print(f"{action}: {count}")
        print(f"Report saved: structure_standardization_report.json")

    def get_current_structure(self):
        """Get current repository structure"""
        structure = {}
        for root, dirs, files in os.walk(self.repo_root):
            if any(skip in root for skip in ['.git', 'node_modules', '__pycache__']):
                continue
            
            rel_path = os.path.relpath(root, self.repo_root)
            if rel_path == '.':
                rel_path = 'root'
            
            structure[rel_path] = {
                'directories': [d for d in dirs if not d.startswith('.')],
                'files': [f for f in files if not f.startswith('.')]
            }
        
        return structure

    def run_standardization(self):
        """Run complete structure standardization"""
        print("🏗️ Starting Repository Structure Standardization")
        print("=" * 60)
        
        # Create backup
        self.create_backup()
        
        # Run standardization steps
        self.standardize_root_structure()
        self.standardize_documentation_structure()
        self.standardize_scripts_structure()
        self.standardize_config_structure()
        self.standardize_assets_structure()
        self.standardize_unity_structure()
        self.create_standard_readme()
        self.create_gitignore_standard()
        
        # Generate report
        self.generate_structure_report()
        
        print("\n🎉 Repository structure standardization completed!")
        print("📁 Backup created for safety")
        print("📊 Check structure_standardization_report.json for details")

if __name__ == "__main__":
    standardizer = RepositoryStandardizer()
    standardizer.run_standardization()