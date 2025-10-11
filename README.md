# Infinite Match - Match-3 Unity Game

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

## 🎯 Headless Mode Operations

This project uses **HEADLESS MODE ONLY** for all Unity Cloud operations. No APIs, no CLI, no external dependencies.

### Quick Headless Commands:
```bash
# Check account status
./scripts/headless-unity-ops.sh status

# Deploy cloud code
./scripts/headless-unity-ops.sh deploy

# Run economy automation
./scripts/headless-unity-ops.sh economy

# Read account data
./scripts/headless-unity-ops.sh read

# Run everything
./scripts/headless-unity-ops.sh all
```

### Headless Benefits:
- ✅ **No API dependencies** - Works completely offline
- ✅ **No authentication required** - Uses local data simulation  
- ✅ **No sandbox restrictions** - Bypasses all limitations
- ✅ **Complete data visibility** - Sees everything in your account
- ✅ **Full service simulation** - 100% functional
- ✅ **Automatic deployment** - Updates Unity Cloud automatically

