# Evergreen Match-3 Unity Game

A comprehensive Match-3 puzzle game built with Unity, featuring **complete headless development**, automated deployment, CI/CD, and industry-standard architecture. **Zero Unity Editor interaction required** - everything runs in CI/CD!

## 🎯 Key Features

- **🚀 Zero Unity Editor Development** - Complete headless Unity development
- **🔄 Full CI/CD Pipeline** - Automated testing, building, and deployment
- **🌐 Multi-Platform Builds** - Windows, Linux, WebGL, Android, iOS
- **☁️ Unity Services Integration** - Economy, Cloud Code, Remote Config
- **🛒 Storefront Automation** - Google Play, App Store, Steam, Itch.io
- **🤖 Auto-Fix & Auto-Commit** - Automatic code style fixes
- **📊 Comprehensive Monitoring** - Health checks and analytics

## 🚀 Quick Start

### Prerequisites

- Node.js 22+ 
- Unity 2022.3+ (for local development only)
- Python 3.13+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd evergreen-match3-unity
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the server**
   ```bash
   npm run dev
   ```

### Headless Development (Recommended)

This project is configured for **completely headless Unity development**:

1. **Add Unity Secrets** to GitHub (Settings → Secrets and variables → Actions):
   ```
   UNITY_EMAIL=your-unity-email@example.com
   UNITY_PASSWORD=your-unity-password
   UNITY_LICENSE=your-unity-license-string
   UNITY_PROJECT_ID=your-unity-project-id
   UNITY_ENV_ID=your-unity-environment-id
   ```

2. **Push to main branch** - builds run automatically in GitHub Actions
3. **Download builds** from the Actions tab artifacts section
4. **No Unity Editor required!** 🎉

## 📁 Project Structure

```
├── src/                          # Source code
│   ├── core/                     # Core modules
│   │   ├── config/              # Configuration management
│   │   ├── logger/              # Logging system
│   │   └── security/            # Security utilities
│   ├── services/                # Business logic services
│   │   ├── unity/               # Unity Services integration
│   │   └── economy/             # Economy data management
│   ├── routes/                  # API routes
│   │   ├── auth.js              # Authentication routes
│   │   ├── economy.js           # Economy routes
│   │   ├── game.js              # Game routes
│   │   └── admin.js             # Admin routes
│   └── server/                  # Server application
├── scripts/                     # Utility scripts
│   ├── health-check.js          # System health monitoring
│   ├── economy-deploy.js        # Economy deployment
│   └── unity-deploy.js          # Unity Services deployment
├── config/                      # Configuration files
│   ├── economy/                 # Economy data (CSV)
│   └── remote/                  # Remote configuration
├── unity/                       # Unity project
└── docs/                        # Documentation
```

## 🛠️ Development

### Headless Development Workflow

This project supports **complete headless Unity development**:

1. **Write code** in your favorite editor (VS Code, Vim, etc.)
2. **Add assets** to the appropriate Unity folders
3. **Write tests** for new functionality
4. **Commit and push** to trigger automatic builds
5. **Download builds** from GitHub Actions artifacts
6. **Test locally** with downloaded builds

**Zero Unity Editor interaction required!** 🎉

### Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with hot reload
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run health` - Run health check
- `npm run economy:deploy` - Deploy economy data
- `npm run unity:deploy` - Deploy Unity Services
- `npm run automation` - Run complete automation pipeline

### API Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

#### Economy
- `GET /api/economy/data` - Get economy data
- `GET /api/economy/report` - Get economy report
- `POST /api/economy/deploy` - Deploy economy data

#### Game
- `POST /api/game/submit_data` - Submit game data
- `GET /api/game/progress` - Get player progress
- `GET /api/game/leaderboard` - Get leaderboard

#### Admin
- `GET /api/admin/health` - System health
- `GET /api/admin/economy/stats` - Economy statistics
- `POST /api/admin/unity/deploy` - Deploy to Unity

## 🔧 Configuration

### Environment Variables

See `.env.example` for all available configuration options.

### Unity Services

1. Create a Unity project
2. Enable Unity Services (Economy, Cloud Code, Remote Config)
3. Get your Project ID and Environment ID
4. Create OAuth credentials
5. Update `.env` with your credentials

## 🚀 Deployment

### Automated Deployment

The project includes automated deployment scripts:

```bash
# Deploy economy data
npm run economy:deploy

# Deploy all Unity Services
npm run unity:deploy

# Check system health
npm run health
```

### CI/CD

GitHub Actions workflows are configured for:
- Automated testing
- Code quality checks
- Unity Services deployment
- Health monitoring

## 🔒 Security

- Rate limiting and DDoS protection
- Input sanitization and validation
- JWT-based authentication
- Session management
- Security logging and monitoring
- CORS configuration

## 📊 Monitoring

- Health check endpoints
- Comprehensive logging
- Performance monitoring
- Security event tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the documentation in `/docs`
- Open an issue on GitHub
- Contact the development team