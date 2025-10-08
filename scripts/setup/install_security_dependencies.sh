#!/bin/bash

# Security Dependencies Installation Script
# Installs all required dependencies for the enhanced security system

set -e

echo "🔒 Installing Security Dependencies"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Install Node.js dependencies
echo "📦 Installing Node.js security dependencies..."
cd server

# Install new security packages
npm install bcryptjs@^2.4.3 \
            jsonwebtoken@^9.0.2 \
            cors@^2.8.5 \
            express-validator@^7.0.1 \
            express-slow-down@^2.0.1 \
            express-brute@^1.0.1 \
            express-brute-redis@^0.0.1 \
            hpp@^0.2.3 \
            xss@^1.0.14 \
            express-mongo-sanitize@^2.2.0 \
            express-request-id@^1.0.0 \
            express-request-logger@^1.0.0 \
            winston@^3.11.0 \
            winston-daily-rotate-file@^4.7.1

echo "✅ Node.js security dependencies installed"

# Create logs directory
echo "📁 Creating logs directory..."
mkdir -p logs
echo "✅ Logs directory created"

# Create security configuration file
echo "⚙️  Creating security configuration..."
cat > security_config.json << EOF
{
  "security": {
    "jwt_secret": "your-jwt-secret-key-change-this-in-production",
    "encryption_key": "your-encryption-key-change-this-in-production",
    "rate_limiting": {
      "window_ms": 900000,
      "max_requests": 100,
      "auth_max_requests": 5
    },
    "anti_cheat": {
      "enable_validation": true,
      "max_violations_before_ban": 5,
      "risk_score_threshold": 0.8
    },
    "cors": {
      "allowed_origins": [
        "http://localhost:3000",
        "https://yourdomain.com"
      ]
    }
  }
}
EOF
echo "✅ Security configuration created"

# Create environment file template
echo "🔐 Creating environment file template..."
cat > .env.template << EOF
# Security Configuration
JWT_SECRET=your-jwt-secret-key-change-this-in-production
ENCRYPTION_KEY=your-encryption-key-change-this-in-production
NODE_ENV=development

# Server Configuration
PORT=3030
HOST=localhost

# Security Settings
ENABLE_SECURITY=true
ENABLE_ANTI_CHEAT=true
ENABLE_RATE_LIMITING=true
ENABLE_INPUT_VALIDATION=true

# Logging
LOG_LEVEL=info
LOG_FILE=logs/security.log
EOF
echo "✅ Environment file template created"

# Create security test script
echo "🧪 Creating security test script..."
cat > test_security.sh << 'EOF'
#!/bin/bash

echo "🔒 Running Security Tests"
echo "========================"

# Check if server is running
if ! curl -s http://localhost:3030/health > /dev/null; then
    echo "❌ Server is not running. Please start the server first:"
    echo "   npm start"
    exit 1
fi

# Run security tests
echo "Running Python security tests..."
python3 ../scripts/security/security_test.py

echo "✅ Security tests completed"
EOF

chmod +x test_security.sh
echo "✅ Security test script created"

# Create security monitoring script
echo "📊 Creating security monitoring script..."
cat > monitor_security.sh << 'EOF'
#!/bin/bash

echo "📊 Security Monitoring Dashboard"
echo "==============================="

# Check server status
echo "🖥️  Server Status:"
if curl -s http://localhost:3030/health > /dev/null; then
    echo "   ✅ Server is running"
    curl -s http://localhost:3030/health | jq '.'
else
    echo "   ❌ Server is not running"
fi

echo ""

# Check security logs
echo "📋 Recent Security Events:"
if [ -f "logs/security-$(date +%Y-%m-%d).log" ]; then
    echo "   Recent security events:"
    tail -n 10 "logs/security-$(date +%Y-%m-%d).log"
else
    echo "   No security logs found for today"
fi

echo ""

# Check system resources
echo "💾 System Resources:"
echo "   Memory usage: $(free -h | grep '^Mem:' | awk '{print $3 "/" $2}')"
echo "   Disk usage: $(df -h . | tail -1 | awk '{print $3 "/" $2 " (" $5 ")"}')"

echo ""

# Check active connections
echo "🌐 Active Connections:"
netstat -tuln | grep :3030 | wc -l | xargs echo "   Active connections on port 3030:"
EOF

chmod +x monitor_security.sh
echo "✅ Security monitoring script created"

# Create security update script
echo "🔄 Creating security update script..."
cat > update_security.sh << 'EOF'
#!/bin/bash

echo "🔄 Updating Security Dependencies"
echo "================================="

# Update npm packages
echo "📦 Updating Node.js packages..."
npm update

# Check for security vulnerabilities
echo "🔍 Checking for security vulnerabilities..."
npm audit

# Fix vulnerabilities if possible
echo "🔧 Attempting to fix vulnerabilities..."
npm audit fix

echo "✅ Security update completed"
EOF

chmod +x update_security.sh
echo "✅ Security update script created"

cd ..

echo ""
echo "🎉 Security Dependencies Installation Complete!"
echo "=============================================="
echo ""
echo "📋 Next Steps:"
echo "1. Copy .env.template to .env and update the values:"
echo "   cp server/.env.template server/.env"
echo "   nano server/.env"
echo ""
echo "2. Start the server:"
echo "   cd server && npm start"
echo ""
echo "3. Run security tests:"
echo "   cd server && ./test_security.sh"
echo ""
echo "4. Monitor security:"
echo "   cd server && ./monitor_security.sh"
echo ""
echo "5. Update security dependencies:"
echo "   cd server && ./update_security.sh"
echo ""
echo "🔒 Security features enabled:"
echo "   ✅ Anti-cheat validation"
echo "   ✅ Rate limiting & DDoS protection"
echo "   ✅ Input sanitization & validation"
echo "   ✅ Session management"
echo "   ✅ Security logging"
echo "   ✅ IP reputation tracking"
echo "   ✅ Data encryption"
echo ""
echo "📚 For more information, see SECURITY_IMPLEMENTATION.md"