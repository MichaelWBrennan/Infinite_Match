# 🎮 Evergreen Match-3 Unity Game

A comprehensive Match-3 puzzle game built with Unity, featuring **100% automated development**, complete headless Unity workflows, and enterprise-grade architecture. **Zero Unity Editor interaction required** - everything runs automatically in CI/CD!

## 🚀 Key Features

- **🤖 Complete Automation** - Headless Unity development, full CI/CD pipeline, auto-fix & auto-commit
- **🌐 Multi-Platform** - Android, iOS, Windows, Linux, macOS, WebGL
- **☁️ Unity Services** - Economy system, Cloud Code, Remote Config, Analytics
- **🛒 Storefront Automation** - Google Play, App Store, Steam, Itch.io
- **🔒 Enterprise Security** - Anti-cheat system, JWT authentication, security middleware

## 🚀 Quick Start

### Prerequisites
- Node.js 22+
- Python 3.13+
- Unity 2022.3+ (for local development only)
- Git

### Installation
```bash
git clone <repository-url>
cd evergreen-match3-unity
npm install
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### Headless Development (Recommended)
1. Add Unity Secrets to GitHub (Settings → Secrets and variables → Actions)
2. Push to main branch - builds run automatically in GitHub Actions
3. Download builds from the Actions tab artifacts section
4. **No Unity Editor required!** 🎉

## 📁 Project Structure

```
├── src/                    # Source code (core, services, routes)
├── scripts/               # Automation and utility scripts
├── config/                # Configuration files
├── unity/                 # Unity project
├── assets/                # Game assets
├── economy/               # Economy data (CSV files)
├── .github/workflows/     # GitHub Actions workflows
└── docs/                  # Documentation
```

## 🛠️ Development

### Available Scripts
- `npm run dev` - Start development server
- `npm test` - Run tests
- `npm run health` - System health check
- `npm run deploy:all` - Deploy everything
- `npm run automation` - Run complete automation pipeline

### Headless Workflow
1. Write code in your favorite editor
2. Add assets to Unity folders
3. Commit and push to trigger automatic builds
4. Download builds from GitHub Actions
5. Test locally with downloaded builds

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile

### Economy System
- `GET /api/economy/data` - Get economy data
- `POST /api/economy/purchase` - Purchase item
- `POST /api/economy/deploy` - Deploy economy data

### Game Data
- `POST /api/game/submit_data` - Submit game data
- `GET /api/game/progress` - Get player progress
- `POST /api/game/save` - Save game state

### Admin & Monitoring
- `GET /api/admin/health` - System health
- `GET /api/admin/performance` - Performance metrics
- `GET /api/admin/logs` - System logs

## 🎮 Game Features

- **Core Gameplay** - Tile management, scoring system, level progression, power-ups
- **Audio System** - Background music, sound effects, spatial audio
- **UI System** - Responsive design, smooth animations, accessibility
- **Physics System** - Realistic physics, collision detection, particle effects

## 🔒 Security

- **Anti-Cheat System** - Speed hack detection, memory monitoring, behavior analysis
- **Data Security** - AES-256-GCM encryption, input sanitization, network security
- **Session Management** - JWT tokens, session validation, auto-logout

## 📊 Monitoring

- **Health Monitoring** - System status, performance metrics, error tracking
- **Game Analytics** - Player behavior, economy analytics, performance analytics
- **Security Monitoring** - Threat detection, violation tracking, risk assessment

## 🚀 Deployment

### Automated Deployment
```bash
npm run economy:deploy    # Deploy economy data
npm run unity:deploy      # Deploy Unity Services
npm run deploy:all        # Deploy everything
npm run health           # Check system health
```

### CI/CD Pipeline
- Automated testing, code quality, security scanning
- Unity Services deployment (Economy, Cloud Code, Remote Config)
- Multi-platform builds (Windows, Linux, WebGL, Android, iOS)
- Storefront deployment (Google Play, App Store, Steam, Itch.io)

## 🔧 Configuration

See `.env.example` for all configuration options including:
- Server configuration (PORT, JWT_SECRET, etc.)
- Unity Services (Project ID, Environment ID, OAuth credentials)
- Database (DATABASE_URL, REDIS_URL)
- Security (Rate limiting, CORS, etc.)
- Monitoring (Health checks, performance monitoring)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Install dependencies: `npm install && pip install -r requirements.txt`
4. Make changes following coding standards
5. Run tests: `npm test && npm run lint && npm run format`
6. Submit a pull request

## 📚 Documentation

- `/docs/guides/` - How-to guides and tutorials
- `/docs/setup/` - Setup and installation instructions
- `/docs/features/` - Feature documentation
- `CODING_STANDARDS.md` - Coding standards and best practices

## 🆘 Support

- **Health Check** - `npm run health`
- **Dashboard** - `npm run dashboard`
- **Security** - `npm run security`
- **Issues** - Open an issue on GitHub

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**🎮 Ready to build amazing Match-3 games? Just push your code and watch the magic happen! 🚀**