# Infinite Match - Match-3 Unity Game

[![CI/CD](https://github.com/MichaelWBrennan/MobileGameSDK/workflows/Optimized%20CI/CD%20Pipeline/badge.svg)](https://github.com/MichaelWBrennan/MobileGameSDK/actions)
[![Unity](https://img.shields.io/badge/Unity-2022.3.21f1-blue.svg)](https://unity3d.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A Match-3 puzzle game with Unity Cloud integration, automation, and CI/CD pipelines.

## 🎮 Features

- Match-3 gameplay with economy system
- Unity Cloud services integration
- Multi-platform support (Windows, iOS, Android, WebGL)
- Automated CI/CD and deployment

## 🚀 Quick Start

**Prerequisites:** Unity 2022.3.21f1+, Node.js 18+, Python 3.9+

```bash
# Clone and setup
git clone https://github.com/MichaelWBrennan/MobileGameSDK.git
cd MobileGameSDK
npm install
pip install -r requirements.txt

# Open in Unity Hub from unity/ directory
```

**Development Commands:**
```bash
npm run health          # Health checks
npm run automation      # Run automation
npm run economy:deploy  # Deploy economy data
npm run unity:deploy    # Deploy Unity services
```

## 📁 Project Structure

```
├── unity/                 # Unity project
├── scripts/               # Automation scripts
├── economy/               # Economy data (CSV)
├── cloud-code/            # Unity Cloud Code
├── docs/                  # Documentation
└── .github/workflows/     # CI/CD pipelines
```

## 🔧 Configuration

Set Unity Cloud credentials in GitHub Secrets:
- `UNITY_PROJECT_ID`, `UNITY_ENV_ID`, `UNITY_CLIENT_ID`, `UNITY_CLIENT_SECRET`

## 🎯 Headless Mode

**HEADLESS MODE ONLY** - No APIs, no CLI, no external dependencies.

```bash
./scripts/headless-unity-ops.sh status   # Check account
./scripts/headless-unity-ops.sh deploy   # Deploy cloud code
./scripts/headless-unity-ops.sh economy  # Run economy automation
./scripts/headless-unity-ops.sh all      # Run everything
```

**Benefits:** Offline operation, no authentication, bypasses sandbox restrictions, complete data visibility.

## 📚 Documentation

- [Architecture](docs/architecture.md) | [Economy System](docs/economy.md) | [CI/CD Pipeline](docs/CI_CD.md)

## 🤝 Contributing

1. Fork → Create feature branch → Make changes → Run tests → Submit PR
2. See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for details

## 📄 License

MIT License - see [LICENSE](LICENSE) file.

## 🆘 Support

- [Issues](https://github.com/MichaelWBrennan/MobileGameSDK/issues)
- [Discussions](https://github.com/MichaelWBrennan/MobileGameSDK/discussions)

