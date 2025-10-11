# Infinite Match - Match-3 Unity Game

[![CI/CD](https://github.com/MichaelWBrennan/MobileGameSDK/workflows/Optimized%20CI/CD%20Pipeline/badge.svg)](https://github.com/MichaelWBrennan/MobileGameSDK/actions)
[![Unity](https://img.shields.io/badge/Unity-2022.3.21f1-blue.svg)](https://unity3d.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A Match-3 puzzle game with Unity Cloud integration and automated deployment.

## 🚀 Quick Start

**Prerequisites:** Unity 2022.3.21f1+, Node.js 18+

```bash
git clone https://github.com/MichaelWBrennan/MobileGameSDK.git
cd MobileGameSDK
npm install
# Open unity/ directory in Unity Hub
```

**Commands:**
```bash
npm run health          # Health checks
npm run automation      # Run automation
npm run economy:deploy  # Deploy economy data
```

## 🔧 Setup

1. Set Unity Cloud credentials in GitHub Secrets: `UNITY_PROJECT_ID`, `UNITY_ENV_ID`, `UNITY_CLIENT_ID`, `UNITY_CLIENT_SECRET`
2. Run `npm run health` to verify setup
3. See [docs/SETUP.md](docs/SETUP.md) for detailed configuration

## 📁 Structure

- `unity/` - Unity project
- `scripts/` - Automation scripts  
- `economy/` - Economy data (CSV)
- `cloud-code/` - Unity Cloud Code
- `docs/` - Documentation

## 📚 Documentation

- [Setup Guide](docs/SETUP.md) - Complete setup instructions
- [Architecture](docs/ARCHITECTURE.md) - System overview
- [Economy](docs/ECONOMY.md) - Monetization systems

## 📄 License

MIT License - see [LICENSE](LICENSE)

