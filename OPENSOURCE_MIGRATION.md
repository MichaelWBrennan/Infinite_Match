# Open Source Migration Guide

This document outlines the migration from proprietary cloud services to open source alternatives for the Infinite Match Unity Game.

## 🎯 Migration Overview

We've replaced all proprietary services with open source alternatives to reduce costs and increase control over your infrastructure.

## 📊 Services Migrated

### Analytics Services
- **Before**: Amplitude + Mixpanel + Unity Analytics
- **After**: PostHog (unified analytics)
- **Savings**: $700-3000/month

### Monitoring & Error Tracking
- **Before**: Datadog + Sentry
- **After**: Prometheus + Grafana + Sentry (self-hosted)
- **Savings**: $200-1000/month

### Cloud Storage & Database
- **Before**: AWS S3 + DynamoDB + Google Cloud + Azure
- **After**: MinIO + PostgreSQL + Redis + MongoDB
- **Savings**: $600-2300/month

### Email Services
- **Before**: AWS SES
- **After**: SMTP (MailHog for development)
- **Savings**: $50-200/month

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Open Source Services
```bash
docker-compose -f docker-compose.opensource.yml up -d
```

### 3. Configure Environment
```bash
cp .env.opensource .env
# Edit .env with your actual API keys
```

### 4. Start Application
```bash
npm run dev
```

## 🔧 Service Configuration

### PostHog Analytics
1. Access PostHog at http://localhost:8000
2. Create a new project
3. Get your API keys from Settings > Project API Keys
4. Update `.env`:
   ```
   POSTHOG_API_KEY=your-api-key
   POSTHOG_PUBLIC_KEY=your-public-key
   ```

### Sentry Error Tracking
1. Access Sentry at http://localhost:9002
2. Create a new project
3. Get your DSN from Settings > Projects
4. Update `.env`:
   ```
   SENTRY_DSN=your-sentry-dsn
   ```

### MinIO Object Storage
1. Access MinIO Console at http://localhost:9001
2. Login with `minioadmin` / `minioadmin`
3. Create a bucket named `match3game`

### Grafana Monitoring
1. Access Grafana at http://localhost:3001
2. Login with `admin` / `admin`
3. Import dashboards from `monitoring/grafana/dashboards/`

## 📁 New File Structure

```
├── src/services/
│   ├── unified-analytics-service.js      # PostHog analytics
│   ├── prometheus-monitoring-service.js  # Prometheus metrics
│   └── open-source-cloud-services.js     # Self-hosted cloud services
├── monitoring/
│   ├── prometheus.yml                    # Prometheus config
│   └── grafana/                          # Grafana dashboards
├── docker-compose.opensource.yml         # Open source services
├── .env.opensource                       # Environment template
└── scripts/migrate-to-opensource.js      # Migration helper
```

## 🔄 Migration Benefits

### Cost Savings
- **Before**: $1,700-6,900/month
- **After**: $0/month (self-hosted)
- **Annual Savings**: $20,400-82,800

### Benefits
- ✅ **Full Control**: Own your data and infrastructure
- ✅ **No Vendor Lock-in**: Open source alternatives
- ✅ **Cost Effective**: No monthly service fees
- ✅ **Privacy**: Data stays on your servers
- ✅ **Customizable**: Modify services as needed
- ✅ **Transparent**: Open source code

## 🛠️ Service Endpoints

| Service | URL | Credentials |
|---------|-----|-------------|
| Application | http://localhost:3000 | - |
| Grafana | http://localhost:3001 | admin/admin |
| Prometheus | http://localhost:9090 | - |
| PostHog | http://localhost:8000 | - |
| MinIO Console | http://localhost:9001 | minioadmin/minioadmin |
| Sentry | http://localhost:9002 | - |
| MailHog | http://localhost:8025 | - |

## 📈 Monitoring

### Prometheus Metrics
- Game events and performance
- API request metrics
- Database connection metrics
- Custom business metrics

### Grafana Dashboards
- Game analytics dashboard
- System performance dashboard
- Error tracking dashboard
- Custom dashboards

## 🔒 Security Considerations

1. **Change Default Passwords**: Update all default credentials
2. **Network Security**: Use proper firewall rules
3. **SSL/TLS**: Enable HTTPS for production
4. **Backup Strategy**: Implement regular backups
5. **Updates**: Keep services updated

## 🚨 Troubleshooting

### Common Issues

1. **Services Not Starting**
   ```bash
   docker-compose -f docker-compose.opensource.yml logs
   ```

2. **Database Connection Issues**
   - Check if PostgreSQL is running
   - Verify connection string in `.env`

3. **Analytics Not Working**
   - Verify PostHog API keys
   - Check browser console for errors

4. **Monitoring Not Showing Data**
   - Verify Prometheus is scraping metrics
   - Check Grafana datasource configuration

## 📚 Additional Resources

- [PostHog Documentation](https://posthog.com/docs)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [MinIO Documentation](https://docs.min.io/)
- [Sentry Documentation](https://docs.sentry.io/)

## 🤝 Support

For issues with the migration:
1. Check the troubleshooting section
2. Review service logs
3. Check GitHub issues
4. Create a new issue with details

## 📝 Migration Checklist

- [ ] Install new dependencies
- [ ] Start open source services
- [ ] Configure environment variables
- [ ] Test analytics tracking
- [ ] Verify monitoring dashboards
- [ ] Test file uploads (MinIO)
- [ ] Test email functionality
- [ ] Update production deployment
- [ ] Monitor for 24 hours
- [ ] Remove old service dependencies

---

**Note**: This migration maintains backward compatibility with existing data and APIs. The old services are still available during the transition period.