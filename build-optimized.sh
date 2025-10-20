#!/bin/bash

# Optimized Build Script for Infinite Match Unity Game
# Consolidates all build functionality into a single script

set -e

echo "🚀 Starting optimized build process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 22+ to continue."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 22 ]; then
    print_error "Node.js version 22+ is required. Current version: $(node -v)"
    exit 1
fi

# Install dependencies
print_status "Installing dependencies..."
npm install --production=false

# Run linting
print_status "Running linting..."
npm run lint

# Run tests
print_status "Running tests..."
npm run test

# Build TypeScript
print_status "Building TypeScript..."
npm run build

# Health check
print_status "Running health check..."
npm run health

# Create optimized directory structure
print_status "Creating optimized directory structure..."
mkdir -p dist/optimized/{api,assets,config,scripts}

# Copy essential files
cp -r dist/server dist/optimized/
cp -r dist/routes dist/optimized/
cp -r dist/core dist/optimized/
cp -r dist/services dist/optimized/
cp -r dist/middleware dist/optimized/
cp -r dist/types dist/optimized/

# Copy configuration files
cp -r config dist/optimized/
cp package.json dist/optimized/
cp README-OPTIMIZED.md dist/optimized/README.md

# Copy essential assets (only default theme)
print_status "Copying essential assets..."
mkdir -p dist/optimized/assets/match3
cp -r assets/match3/default dist/optimized/assets/match3/

# Copy API files
cp -r api dist/optimized/

# Copy scripts
cp scripts/health-check.js dist/optimized/scripts/

# Create optimized package.json for production
cat > dist/optimized/package.json << EOF
{
  "name": "infinite-match-unity-optimized",
  "version": "1.0.0",
  "description": "Optimized Infinite Match Unity Game",
  "main": "server/index.js",
  "scripts": {
    "start": "node server/index.js",
    "health": "node scripts/health-check.js"
  },
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.913.0",
    "@aws-sdk/client-s3": "^3.913.0",
    "@aws-sdk/client-ses": "^3.913.0",
    "@aws-sdk/client-sns": "^3.913.0",
    "@aws-sdk/client-sqs": "^3.913.0",
    "@azure/cosmos": "^4.6.0",
    "@azure/identity": "^4.13.0",
    "@azure/storage-blob": "^12.29.1",
    "@google-cloud/firestore": "^7.11.6",
    "@google-cloud/storage": "^7.17.2",
    "@sentry/node": "^10.20.0",
    "axios": "^1.12.2",
    "bcryptjs": "^3.0.2",
    "compression": "^1.8.1",
    "cors": "^2.8.5",
    "dotenv": "^17.2.3",
    "express": "^5.1.0",
    "express-rate-limit": "^8.1.0",
    "express-validator": "^7.2.1",
    "helmet": "^8.1.0",
    "ioredis": "^5.8.1",
    "jsonwebtoken": "^9.0.2",
    "lodash": "^4.17.21",
    "mongoose": "^8.19.1",
    "redis": "^5.8.3",
    "socket.io": "^4.8.1",
    "uuid": "^13.0.0",
    "winston": "^3.18.3",
    "xss": "^1.0.15"
  },
  "engines": {
    "node": ">=22.0.0"
  },
  "type": "module"
}
EOF

# Create .env template
cat > dist/optimized/.env.template << EOF
# Server Configuration
PORT=3000
HOST=0.0.0.0
NODE_ENV=production

# Security
JWT_SECRET=your-secret-key-here
BCRYPT_SALT_ROUNDS=12

# Database
MONGODB_URI=mongodb://localhost:27017/match3game
REDIS_URL=redis://localhost:6379

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket-name
AWS_DYNAMODB_TABLE=match3game
AWS_SNS_TOPIC_ARN=your-sns-topic-arn
AWS_SQS_QUEUE_URL=your-sqs-queue-url
AWS_SES_FROM_EMAIL=your-email@domain.com

# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_KEY_FILE=path/to/keyfile.json

# Azure Configuration
AZURE_STORAGE_ACCOUNT=your-storage-account
AZURE_COSMOS_ENDPOINT=your-cosmos-endpoint
AZURE_COSMOS_KEY=your-cosmos-key
AZURE_COSMOS_DATABASE=match3game

# Analytics
SENTRY_DSN=your-sentry-dsn

# CORS
CORS_ORIGIN=*
CORS_CREDENTIALS=false

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Game Configuration
GAME_MAX_LEVEL=1000
GAME_MAX_SCORE=999999
GAME_BOARD_SIZE=8
GAME_COLORS=red,blue,green,yellow,purple,orange
GAME_MIN_MATCH=3
EOF

# Create Dockerfile for optimized deployment
cat > dist/optimized/Dockerfile << EOF
FROM node:22-alpine

WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install --only=production

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node scripts/health-check.js || exit 1

# Start application
CMD ["npm", "start"]
EOF

# Create docker-compose.yml for easy deployment
cat > dist/optimized/docker-compose.yml << EOF
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/match3game
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongodb
      - redis
    restart: unless-stopped

  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  mongodb_data:
  redis_data:
EOF

# Calculate size reduction
ORIGINAL_SIZE=$(du -sh . | cut -f1)
OPTIMIZED_SIZE=$(du -sh dist/optimized | cut -f1)

print_status "Build completed successfully!"
print_status "Original size: $ORIGINAL_SIZE"
print_status "Optimized size: $OPTIMIZED_SIZE"
print_status "Optimized build available in: dist/optimized/"

# Create deployment instructions
cat > dist/optimized/DEPLOYMENT.md << EOF
# Deployment Instructions

## Quick Start

1. Copy the optimized build to your server
2. Copy .env.template to .env and configure your environment variables
3. Run: \`npm install\`
4. Run: \`npm start\`

## Docker Deployment

1. Run: \`docker-compose up -d\`
2. Access the application at http://localhost:3000

## Environment Variables

See .env.template for all required environment variables.

## Health Check

The application includes a health check endpoint at /health
EOF

print_status "Deployment instructions created in dist/optimized/DEPLOYMENT.md"