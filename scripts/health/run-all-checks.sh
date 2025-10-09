#!/bin/bash

# Comprehensive check script for the Evergreen Match-3 Unity project
# This script runs all linting, testing, and validation checks

set -e  # Exit on any error

echo "🔍 Running comprehensive checks for Evergreen Match-3 Unity project..."
echo "=================================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        return 1
    fi
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function to print info
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Track overall status
OVERALL_STATUS=0

echo ""
print_info "1. Installing dependencies..."

# Install Node.js dependencies
cd /workspace
npm install --silent
cd /workspace/server
npm install --silent
cd /workspace

# Install Python dependencies
pip3 install -r requirements.txt --quiet

print_status $? "Dependencies installed"

echo ""
print_info "2. Running JavaScript/TypeScript linting..."

# Run ESLint
if npx eslint . --ext .js,.ts --ignore-pattern node_modules/ --ignore-pattern server/node_modules/ --format=compact > /tmp/eslint_output.txt 2>&1; then
    print_status 0 "ESLint passed"
else
    print_warning "ESLint found issues (see /tmp/eslint_output.txt for details)"
    OVERALL_STATUS=1
fi

echo ""
print_info "3. Running JavaScript/TypeScript formatting check..."

# Run Prettier check
if npx prettier --check "**/*.{js,ts,json}" --ignore-path .gitignore > /tmp/prettier_output.txt 2>&1; then
    print_status 0 "Prettier formatting check passed"
else
    print_warning "Prettier found formatting issues (see /tmp/prettier_output.txt for details)"
    OVERALL_STATUS=1
fi

echo ""
print_info "4. Running Python linting..."

# Run flake8
if /home/ubuntu/.local/bin/flake8 scripts/ --count --select=E9,F63,F7,F82 --show-source --statistics > /tmp/flake8_critical.txt 2>&1; then
    print_status 0 "Python critical issues check passed"
else
    print_warning "Python critical issues found (see /tmp/flake8_critical.txt for details)"
    OVERALL_STATUS=1
fi

# Run flake8 with warnings
/home/ubuntu/.local/bin/flake8 scripts/ --count --exit-zero --max-complexity=10 --max-line-length=88 --statistics > /tmp/flake8_warnings.txt 2>&1
WARNING_COUNT=$(grep -c "E\|W\|F" /tmp/flake8_warnings.txt || echo "0")
if [ "$WARNING_COUNT" -gt 0 ]; then
    print_warning "Python found $WARNING_COUNT style issues (see /tmp/flake8_warnings.txt for details)"
else
    print_status 0 "Python style check passed"
fi

echo ""
print_info "5. Running Python syntax validation..."

# Check Python syntax
if find scripts -name "*.py" -exec python3 -m py_compile {} \; > /tmp/python_syntax.txt 2>&1; then
    print_status 0 "Python syntax validation passed"
else
    print_warning "Python syntax issues found (see /tmp/python_syntax.txt for details)"
    OVERALL_STATUS=1
fi

echo ""
print_info "6. Running tests..."

# Run Node.js tests
cd /workspace/server
if npm test > /tmp/node_tests.txt 2>&1; then
    print_status 0 "Node.js tests passed"
else
    print_warning "Node.js tests failed (see /tmp/node_tests.txt for details)"
    OVERALL_STATUS=1
fi

cd /workspace

# Run root tests
if npm test > /tmp/root_tests.txt 2>&1; then
    print_status 0 "Root tests passed"
else
    print_warning "Root tests failed (see /tmp/root_tests.txt for details)"
    OVERALL_STATUS=1
fi

echo ""
print_info "7. Running security audit..."

# Run npm audit
if npm audit --audit-level=moderate > /tmp/npm_audit.txt 2>&1; then
    print_status 0 "NPM security audit passed"
else
    print_warning "NPM security issues found (see /tmp/npm_audit.txt for details)"
    OVERALL_STATUS=1
fi

cd /workspace/server
if npm audit --audit-level=moderate > /tmp/server_npm_audit.txt 2>&1; then
    print_status 0 "Server NPM security audit passed"
else
    print_warning "Server NPM security issues found (see /tmp/server_npm_audit.txt for details)"
    OVERALL_STATUS=1
fi

cd /workspace

echo ""
print_info "8. Running Unity validation..."

# Run Unity validation
if python3 scripts/validation/zero_unity_editor_validation.py > /tmp/unity_validation.txt 2>&1; then
    print_status 0 "Unity validation passed"
else
    print_warning "Unity validation completed with warnings (see /tmp/unity_validation.txt for details)"
    OVERALL_STATUS=1
fi

echo ""
print_info "9. Validating JSON files..."

# Check JSON files
if find . -name "*.json" -not -path "./node_modules/*" -not -path "./server/node_modules/*" -exec python3 -m json.tool {} \; > /tmp/json_validation.txt 2>&1; then
    print_status 0 "JSON validation passed"
else
    print_warning "JSON validation issues found (see /tmp/json_validation.txt for details)"
    OVERALL_STATUS=1
fi

echo ""
print_info "10. Running build verification..."

# Check server syntax
if node -c server/server.js > /tmp/server_syntax.txt 2>&1; then
    print_status 0 "Server syntax check passed"
else
    print_warning "Server syntax issues found (see /tmp/server_syntax.txt for details)"
    OVERALL_STATUS=1
fi

echo ""
echo "=================================================================="
echo "📊 CHECK SUMMARY"
echo "=================================================================="

# Summary
if [ $OVERALL_STATUS -eq 0 ]; then
    print_status 0 "All critical checks passed! 🎉"
    echo ""
    print_info "Your repository is ready for new branches!"
    echo "All essential checks are in place and passing."
else
    print_warning "Some checks failed. Please review the output above."
    echo ""
    print_info "Check the following files for detailed error information:"
    echo "  - /tmp/eslint_output.txt (JavaScript/TypeScript linting)"
    echo "  - /tmp/prettier_output.txt (Code formatting)"
    echo "  - /tmp/flake8_critical.txt (Python critical issues)"
    echo "  - /tmp/flake8_warnings.txt (Python style warnings)"
    echo "  - /tmp/python_syntax.txt (Python syntax)"
    echo "  - /tmp/node_tests.txt (Node.js tests)"
    echo "  - /tmp/root_tests.txt (Root tests)"
    echo "  - /tmp/npm_audit.txt (NPM security audit)"
    echo "  - /tmp/server_npm_audit.txt (Server NPM security audit)"
    echo "  - /tmp/unity_validation.txt (Unity validation)"
    echo "  - /tmp/json_validation.txt (JSON validation)"
    echo "  - /tmp/server_syntax.txt (Server syntax)"
fi

echo ""
print_info "CI/CD Pipeline Configuration:"
echo "  - GitHub Actions workflow: .github/workflows/ci.yml"
echo "  - ESLint configuration: eslint.config.js"
echo "  - Prettier configuration: .prettierrc"
echo "  - Flake8 configuration: .flake8"
echo "  - Pylint configuration: pylintrc"

echo ""
print_info "To run this check script again:"
echo "  bash scripts/run-all-checks.sh"

exit $OVERALL_STATUS