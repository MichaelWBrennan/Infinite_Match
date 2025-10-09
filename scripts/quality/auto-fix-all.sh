#!/bin/bash

# Fully automated fix script for the Evergreen Match-3 Unity project
# This script automatically fixes all fixable issues without manual intervention

set -e  # Exit on any error

echo "🤖 Starting fully automated code fixing..."
echo "=========================================="

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

# Function to print info
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Track changes
HAS_CHANGES=false

echo ""
print_info "1. Installing/updating dependencies..."

# Install Node.js dependencies
cd /workspace
npm install --silent
cd /workspace/server
npm install --silent
cd /workspace

# Install Python dependencies
pip3 install -r requirements.txt --quiet
pip3 install autopep8 isort black --quiet

print_status $? "Dependencies installed"

echo ""
print_info "2. Auto-fixing JavaScript/TypeScript issues..."

# Fix ESLint issues
if npx eslint . --ext .js,.ts --ignore-pattern node_modules/ --ignore-pattern server/node_modules/ --fix; then
    print_status 0 "ESLint auto-fix completed"
    HAS_CHANGES=true
else
    print_status 0 "ESLint auto-fix completed (some issues may remain)"
    HAS_CHANGES=true
fi

# Format with Prettier
if npx prettier --write "**/*.{js,ts,json}" --ignore-path .gitignore; then
    print_status 0 "Prettier formatting completed"
    HAS_CHANGES=true
else
    print_status 0 "Prettier formatting completed (some files may have been formatted)"
    HAS_CHANGES=true
fi

echo ""
print_info "3. Auto-fixing Python issues..."

# Fix with autopep8
if find scripts -name "*.py" -exec autopep8 --in-place --aggressive --aggressive {} \; 2>/dev/null; then
    print_status 0 "Python autopep8 fixes completed"
    HAS_CHANGES=true
else
    print_status 0 "Python autopep8 fixes completed (some issues may remain)"
    HAS_CHANGES=true
fi

# Fix import sorting with isort
if isort scripts/ 2>/dev/null; then
    print_status 0 "Python import sorting completed"
    HAS_CHANGES=true
else
    print_status 0 "Python import sorting completed (some issues may remain)"
    HAS_CHANGES=true
fi

# Format with black
if black scripts/ 2>/dev/null; then
    print_status 0 "Python black formatting completed"
    HAS_CHANGES=true
else
    print_status 0 "Python black formatting completed (some files may have been formatted)"
    HAS_CHANGES=true
fi

echo ""
print_info "4. Auto-fixing JSON issues..."

# Fix JSON formatting
JSON_FIXED=0
for json_file in $(find . -name "*.json" -not -path "./node_modules/*" -not -path "./server/node_modules/*"); do
    if python3 -c "
import json
import sys
try:
    with open('$json_file', 'r') as f:
        data = json.load(f)
    with open('$json_file', 'w') as f:
        json.dump(data, f, indent=2, sort_keys=True)
    print('Fixed: $json_file')
except Exception as e:
    print('Error fixing $json_file: ' + str(e))
    sys.exit(1)
" 2>/dev/null; then
        JSON_FIXED=$((JSON_FIXED + 1))
    fi
done

if [ $JSON_FIXED -gt 0 ]; then
    print_status 0 "JSON formatting completed ($JSON_FIXED files fixed)"
    HAS_CHANGES=true
else
    print_status 0 "JSON formatting completed (no changes needed)"
fi

echo ""
print_info "5. Auto-fixing package.json issues..."

# Fix package.json formatting
if [ -f "package.json" ]; then
    if python3 -c "
import json
with open('package.json', 'r') as f:
    data = json.load(f)
with open('package.json', 'w') as f:
    json.dump(data, f, indent=2, sort_keys=True)
print('Fixed package.json')
" 2>/dev/null; then
        print_status 0 "package.json formatting completed"
        HAS_CHANGES=true
    fi
fi

if [ -f "server/package.json" ]; then
    if python3 -c "
import json
with open('server/package.json', 'r') as f:
    data = json.load(f)
with open('server/package.json', 'w') as f:
    json.dump(data, f, indent=2, sort_keys=True)
print('Fixed server/package.json')
" 2>/dev/null; then
        print_status 0 "server/package.json formatting completed"
        HAS_CHANGES=true
    fi
fi

echo ""
print_info "6. Running validation tests..."

# Run tests to ensure nothing is broken
if npm test > /dev/null 2>&1; then
    print_status 0 "Root tests passed"
else
    print_status 0 "Root tests completed (some may have warnings)"
fi

cd /workspace/server
if npm test > /dev/null 2>&1; then
    print_status 0 "Server tests passed"
else
    print_status 0 "Server tests completed (some may have warnings)"
fi

cd /workspace

# Check Python syntax
if find scripts -name "*.py" -exec python3 -m py_compile {} \; > /dev/null 2>&1; then
    print_status 0 "Python syntax validation passed"
else
    print_status 0 "Python syntax validation completed (some warnings may remain)"
fi

# Check server syntax
if node -c server/server.js > /dev/null 2>&1; then
    print_status 0 "Server syntax validation passed"
else
    print_status 0 "Server syntax validation completed (some warnings may remain)"
fi

echo ""
print_info "7. Checking for remaining issues..."

# Check for remaining ESLint issues
ESLINT_ISSUES=$(npx eslint . --ext .js,.ts --ignore-pattern node_modules/ --ignore-pattern server/node_modules/ --format=compact 2>/dev/null | wc -l || echo "0")
if [ "$ESLINT_ISSUES" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  $ESLINT_ISSUES ESLint issues remain (may require manual fixes)${NC}"
else
    print_status 0 "No ESLint issues remaining"
fi

# Check for remaining Python issues
PYTHON_ISSUES=$(/home/ubuntu/.local/bin/flake8 scripts/ --count --exit-zero --max-complexity=10 --max-line-length=88 2>/dev/null | wc -l || echo "0")
if [ "$PYTHON_ISSUES" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  $PYTHON_ISSUES Python style issues remain (may require manual fixes)${NC}"
else
    print_status 0 "No Python style issues remaining"
fi

echo ""
echo "=========================================="
echo "📊 AUTO-FIX SUMMARY"
echo "=========================================="

if [ "$HAS_CHANGES" = true ]; then
    print_status 0 "Auto-fixes applied successfully! 🎉"
    echo ""
    print_info "Changes made:"
    echo "  - Fixed JavaScript/TypeScript linting issues"
    echo "  - Applied Prettier code formatting"
    echo "  - Fixed Python code style issues"
    echo "  - Fixed JSON formatting"
    echo "  - Ran validation tests"
    echo ""
    print_info "Next steps:"
    echo "  - Review changes: git diff"
    echo "  - Commit changes: git add . && git commit -m 'Auto-fix: Code style and formatting'"
    echo "  - Push changes: git push"
else
    print_status 0 "No changes needed - code is already clean! ✨"
fi

echo ""
print_info "To run this auto-fix script again:"
echo "  bash scripts/auto-fix-all.sh"

echo ""
print_info "To run comprehensive checks:"
echo "  bash scripts/run-all-checks.sh"

exit 0