# Evergreen Match-3 Unity Game

A comprehensive Match-3 puzzle game built with Unity, featuring automated deployment, CI/CD, and industry-standard architecture.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Unity 2022.3+
- Python 3.8+
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

### Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with hot reload
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run health` - Run health check
- `npm run economy:deploy` - Deploy economy data
- `npm run unity:deploy` - Deploy Unity Services

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