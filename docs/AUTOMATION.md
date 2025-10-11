# 🤖 Automation & Deployment Guide

## 🚀 Fully Automated Systems

This repository is **100% self-sustaining** with zero manual upkeep required. All systems are fully automated.

### ✅ Economy System Automation
- **CSV → Unity Economy**: Automatic parsing and deployment
- **Dynamic Pricing**: Market-based price adjustments
- **Seasonal Events**: Automatic holiday/event content generation
- **A/B Testing**: Automated variant testing and optimization

### ✅ Build Pipeline Automation
- **GitHub Actions**: Automated builds on every push
- **Unity Cloud Build**: Integrated with Unity Services
- **Asset Generation**: ScriptableObjects and JSON data auto-generated
- **Validation**: Comprehensive data integrity checks

### ✅ Dependency Management
- **Auto-Updates**: Safe package updates (patch/minor only)
- **Security Patches**: Automatic security vulnerability fixes
- **Version Pinning**: Prevents breaking changes
- **Health Monitoring**: Continuous system health checks

## 🔧 Unity CLI Integration

### Features
- **Unity CLI Integration**: Uses the official Unity CLI for all operations
- **Automated Backup**: Creates backups before deployment
- **Rollback Support**: Automatically rolls back on deployment failure
- **Economy Management**: Deploys currencies, inventory items, and catalog items
- **Remote Config**: Deploys remote configuration settings
- **Cloud Code**: Deploys JavaScript cloud functions

### Required GitHub Secrets
Add these secrets to your repository settings:
- `UNITY_PROJECT_ID` - Your Unity project ID
- `UNITY_ENV_ID` - Your Unity environment ID
- `UNITY_CLIENT_ID` - Your Unity client ID
- `UNITY_CLIENT_SECRET` - Your Unity client secret

### Deployment Commands
```bash
# Deploy all services
npm run unity:deploy

# Deploy economy only
npm run economy:deploy

# Run health checks
npm run health

# Run full automation
npm run automation
```

## 📊 Economy Integration

### CSV Data Processing
The system automatically processes economy data from CSV files:
- Currency definitions and pricing
- Inventory item configurations
- Remote config values
- Seasonal event data

### Automated Deployment Workflow
1. **Data Validation** - Verify CSV data integrity
2. **Backup Creation** - Create backup of current state
3. **Deployment** - Deploy to Unity Cloud Services
4. **Verification** - Validate deployment success
5. **Rollback** - Automatic rollback on failure

## 🔍 Health Monitoring

### Automated Health Checks
- **System Status** - Overall system health score
- **Service Connectivity** - Unity Cloud Services status
- **Data Integrity** - Economy data validation
- **Performance Metrics** - Build and deployment performance

### Health Check Commands
```bash
# Run comprehensive health check
npm run health

# Check specific service
npm run health:unity
npm run health:economy
npm run health:build
```

## 🚀 CI/CD Pipeline

### GitHub Actions Workflows
- **Build Pipeline** - Automated builds on push/PR
- **Deployment Pipeline** - Automated deployment to Unity Cloud
- **Testing Pipeline** - Automated testing and validation
- **Security Pipeline** - Security scanning and compliance checks

### Automated Triggers
- **Push to main** - Full build and deployment
- **Pull Request** - Build and test only
- **Scheduled** - Nightly health checks and updates
- **Manual** - On-demand deployment and testing

## 📈 Monitoring & Reporting

### Automated Reports
- **Deployment Reports** - Detailed deployment status
- **Health Reports** - System health and performance metrics
- **Security Reports** - Security scan results and compliance
- **Economy Reports** - Economy data processing and validation

### Artifact Storage
All reports and data are automatically stored as GitHub artifacts:
- Deployment logs and reports
- Health check results
- Security scan reports
- Economy data backups

---
*This consolidated automation guide replaces multiple individual automation documents.*