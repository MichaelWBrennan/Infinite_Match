# 🚀 Complete Offline Setup

The core game and documented self-hosted services can run without hosted APIs,
once dependencies and Docker images are available locally. Platform SDK mocks
are test stubs, not real platform integrations. Payments/store billing and other
optional hosted adapters do not become offline services; self-hosting still has
infrastructure and maintenance costs. See [the architecture guide](OPENSOURCE_MIGRATION.md).

## ✅ What's Been Migrated

### **Analytics & Monitoring**
- ❌ Amplitude → ✅ PostHog (self-hosted)
- ❌ Mixpanel → ✅ PostHog (self-hosted)  
- ❌ Datadog → ✅ Prometheus + Grafana (self-hosted)
- ❌ Sentry SaaS → ✅ GlitchTip (MIT, Sentry-SDK-compatible)

### **Cloud Services**
- ❌ AWS S3 → ✅ MinIO (S3-compatible)
- ❌ DynamoDB → ✅ PostgreSQL
- ❌ Google Cloud → ✅ Self-hosted alternatives
- ❌ Azure → ✅ Self-hosted alternatives
- ❌ MongoDB (SSPL) → ✅ FerretDB (Apache-2.0, MongoDB wire protocol on Postgres)
- ❌ Redis (RSAL/SSPL) → ✅ Valkey (BSD-3, Redis protocol compatible)
- ❌ Sentry SaaS → ✅ GlitchTip (MIT, Sentry-SDK-compatible)
- ❌ MailHog (abandoned) → ✅ Mailpit (MIT)

### **Platform SDKs**
- ❌ External CDN scripts → ✅ Self-hosted mocks
- All platform SDKs (Kongregate, Facebook, TikTok, etc.) now work offline

### **Fonts & Assets**
- ❌ Google Fonts → ✅ Local font files
- ❌ External CDN assets → ✅ Local assets

## 🎯 Quick Start (Offline)

### 1. **Setup Offline Environment**
```bash
npm run offline:setup
```

### 2. **Start All Services**
```bash
npm run offline:start
```

### 3. **Verify Everything Works**
```bash
npm run offline:verify
```

## 🔧 Manual Setup

### 1. **Install Dependencies**
```bash
npm install
```

### 2. **Start Open Source Services**
```bash
docker-compose -f docker-compose.opensource.yml up -d
```

### 3. **Configure Environment**
```bash
cp .env.offline .env
```

### 4. **Start Application**
```bash
npm run dev
```

## 🌐 Service Access

| Service | URL | Credentials |
|---------|-----|-------------|
| **Application** | http://localhost:3000 | - |
| **Grafana** | http://localhost:3001 | admin/admin |
| **Prometheus** | http://localhost:9090 | - |
| **PostHog** | http://localhost:8000 | - |
| **MinIO Console** | http://localhost:9001 | minioadmin/minioadmin |
| **Sentry** | http://localhost:9002 | - |
| **MailHog** | http://localhost:8025 | - |

## 📁 Self-Hosted Files

### **Analytics & Monitoring**
- `public/js/posthog.min.js` - PostHog analytics (offline mode)
- `public/js/sentry.min.js` - Sentry error tracking (offline mode)
- `src/services/unified-analytics-service.js` - Unified analytics service
- `src/services/prometheus-monitoring-service.js` - Prometheus monitoring

### **Platform SDKs**
- `public/js/platform-sdks.js` - Mock implementations of all platform SDKs

### **Cloud Services**
- `src/services/open-source-cloud-services.js` - Self-hosted cloud services
- `docker-compose.opensource.yml` - All services in Docker

### **Fonts & Assets**
- `public/css/fonts.css` - Local font definitions
- All external CDN assets replaced with local versions

## 🔒 Security & Privacy

### **Benefits of Offline Setup**
- ✅ **Complete Data Control** - All data stays on your servers
- ✅ **No External Dependencies** - Works without internet
- ✅ **Privacy Compliant** - No data sent to third parties
- ✅ **Vendor Independence** - No lock-in to external services
- ✅ **Cost Effective** - Zero monthly service fees
- ✅ **Customizable** - Modify any service as needed

### **Network Security**
- All services run on localhost
- No external API calls
- Self-contained Docker environment
- CSP headers updated to block external resources

## 🛠️ Development Workflow

### **Offline Development**
1. Start services: `npm run offline:start`
2. Develop with full offline capabilities
3. All analytics, monitoring, and cloud services work locally
4. No external dependencies required

### **Production Deployment**
1. Use the same Docker Compose setup
2. Deploy to your own infrastructure
3. Configure domain names and SSL certificates
4. Scale services as needed

## 📊 Cost Comparison

| Service | Before (External) | After (Self-hosted) |
|---------|------------------|-------------------|
| Analytics | $700-3000/month | $0/month |
| Monitoring | $200-1000/month | $0/month |
| Cloud Storage | $600-2300/month | $0/month |
| **Total** | **$1,500-6,300/month** | **$0/month** |
| **Annual Savings** | - | **$18,000-75,600** |

## 🔧 Troubleshooting

### **Services Not Starting**
```bash
docker-compose -f docker-compose.opensource.yml logs
```

### **Database Connection Issues**
- Check if PostgreSQL is running: `docker ps`
- Verify connection string in `.env`

### **Analytics Not Working**
- Check browser console for errors
- Verify PostHog is running: http://localhost:8000

### **Monitoring Not Showing Data**
- Check Prometheus: http://localhost:9090
- Verify Grafana datasource configuration

## 📚 File Structure

```
├── public/
│   ├── js/
│   │   ├── posthog.min.js          # Self-hosted PostHog
│   │   ├── sentry.min.js           # Self-hosted Sentry
│   │   └── platform-sdks.js        # Mock platform SDKs
│   └── css/
│       └── fonts.css               # Local fonts
├── src/services/
│   ├── unified-analytics-service.js    # PostHog analytics
│   ├── prometheus-monitoring-service.js # Prometheus monitoring
│   └── open-source-cloud-services.js   # Self-hosted cloud services
├── monitoring/
│   ├── prometheus.yml              # Prometheus config
│   └── grafana/                    # Grafana dashboards
├── docker-compose.opensource.yml   # All services
├── .env.offline                    # Offline configuration
└── scripts/
    ├── setup-offline.js            # Offline setup script
    └── verify-offline.js           # Verification script
```

## 🎉 Success!

The self-hosted core supports offline/local development, subject to the limits above.

- ✅ **No hosted APIs required for procedural gameplay**
- ✅ **Complete data control**
- ✅ **Significant cost savings**
- ✅ **Full customization freedom**
- ✅ **Privacy controls; compliance still requires operator review**
- ✅ **Vendor independent**

Enjoy your fully offline, self-hosted development environment! 🚀

## Passive procedural levels and regional holidays

`npm run build && npm start` serves the web client, pure seeded generator and
bundled holiday calendar together. No external AI, geocoding, calendar API or
level-design service is called to make these levels. Today's challenge follows
the selected IANA time zone and rolls over at local midnight; Settings → Local
levels offers country/state/hemisphere correction and holiday opt-out, without GPS.

With a local server, regional holiday rules work even without internet. If an
anonymous browser cannot reach that server, its generated seasonal fallback
remains playable, but full holiday data and rewarded account play are unavailable.
Same-day cached holiday context is reused only for matching preferences, never
for a different local day. Detailed behavior, licenses and remaining limitations:
[Procedural levels](docs/PROCEDURAL_LEVELS.md).

For an iframe-hosted Arena development preview only, start with
`NODE_ENV=development ARENA_PREVIEW=1 HOST=0.0.0.0 npm start`. This explicit opt-in
allows the preview's frame; production keeps the strict anti-framing headers.
