#!/bin/bash

# Free AI Content Generator Setup Script
# Sets up 100% free AI services with no subscriptions or trials

set -e

echo "🚀 Setting up Free AI Content Generator..."
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running on supported OS
check_os() {
    print_status "Checking operating system..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
        print_success "Linux detected"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        print_success "macOS detected"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        OS="windows"
        print_success "Windows detected"
    else
        print_error "Unsupported operating system: $OSTYPE"
        exit 1
    fi
}

# Install Ollama
install_ollama() {
    print_status "Installing Ollama (Local LLM)..."
    
    if command -v ollama &> /dev/null; then
        print_success "Ollama is already installed"
    else
        print_status "Downloading and installing Ollama..."
        
        case $OS in
            "linux")
                curl -fsSL https://ollama.ai/install.sh | sh
                ;;
            "macos")
                if command -v brew &> /dev/null; then
                    brew install ollama
                else
                    print_warning "Homebrew not found. Please install Ollama manually from https://ollama.ai"
                    return 1
                fi
                ;;
            "windows")
                print_warning "Please install Ollama manually from https://ollama.ai"
                return 1
                ;;
        esac
        
        if command -v ollama &> /dev/null; then
            print_success "Ollama installed successfully"
        else
            print_error "Failed to install Ollama"
            return 1
        fi
    fi
}

# Start Ollama service
start_ollama() {
    print_status "Starting Ollama service..."
    
    # Check if Ollama is already running
    if curl -s http://localhost:11434/api/tags &> /dev/null; then
        print_success "Ollama is already running"
    else
        print_status "Starting Ollama in background..."
        ollama serve &
        sleep 5
        
        # Wait for Ollama to start
        for i in {1..30}; do
            if curl -s http://localhost:11434/api/tags &> /dev/null; then
                print_success "Ollama started successfully"
                break
            fi
            if [ $i -eq 30 ]; then
                print_error "Failed to start Ollama"
                return 1
            fi
            sleep 1
        done
    fi
}

# Download AI models
download_models() {
    print_status "Downloading AI models..."
    
    # Download primary model
    print_status "Downloading Llama 3.1 8B model (this may take a while)..."
    ollama pull llama3.1:8b
    
    # Download fallback model
    print_status "Downloading Llama 3.1 7B model..."
    ollama pull llama3.1:7b
    
    # Download lightweight model
    print_status "Downloading Llama 3.1 3B model..."
    ollama pull llama3.1:3b
    
    # Download code model
    print_status "Downloading Code Llama model..."
    ollama pull codellama:7b
    
    print_success "All models downloaded successfully"
}

# Install Node.js dependencies
install_dependencies() {
    print_status "Installing Node.js dependencies..."
    
    if [ -f "package.json" ]; then
        npm install
        print_success "Dependencies installed"
    else
        print_warning "package.json not found. Please run this script from the project root."
        return 1
    fi
}

# Create environment file
create_env_file() {
    print_status "Creating environment configuration..."
    
    cat > .env.free-ai << EOF
# Free AI Content Generator Configuration
# No API keys required - everything is free!

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b

# Hugging Face Configuration (optional - free tier available)
# HUGGINGFACE_API_KEY=your_free_api_key_here

# Local ML Configuration
ENABLE_LOCAL_ML=true

# Content Generation Settings
NODE_ENV=development
GAME_VERSION=1.0.0

# Performance Settings
MAX_CONCURRENT_REQUESTS=5
REQUEST_TIMEOUT=30000
CACHE_SIZE=1000
EOF

    print_success "Environment file created: .env.free-ai"
}

# Test the setup
test_setup() {
    print_status "Testing the setup..."
    
    # Test Ollama
    if curl -s http://localhost:11434/api/tags | grep -q "llama3.1:8b"; then
        print_success "Ollama is working correctly"
    else
        print_error "Ollama test failed"
        return 1
    fi
    
    # Test Node.js script
    if node -e "
        const { FreeAIContentGenerator } = require('./src/services/free-ai-content-generator.js');
        console.log('Free AI Content Generator loaded successfully');
    " 2>/dev/null; then
        print_success "Node.js integration working"
    else
        print_warning "Node.js integration test failed (this is normal if the module isn't built yet)"
    fi
}

# Create usage example
create_example() {
    print_status "Creating usage example..."
    
    cat > examples/free-ai-example.js << 'EOF'
const { FreeAIContentGenerator } = require('../src/services/free-ai-content-generator.js');

async function example() {
    const ai = new FreeAIContentGenerator();
    
    try {
        // Generate a level
        const level = await ai.generateLevel(1, 5, {
            id: 'player1',
            currentLevel: 1,
            preferredColors: ['red', 'blue', 'green'],
            recentPerformance: 'good',
            segment: 'casual'
        });
        
        console.log('Generated Level:', JSON.stringify(level, null, 2));
        
        // Generate an event
        const event = await ai.generateEvent('daily', 'casual', {
            popularThemes: ['Fantasy', 'Sci-Fi'],
            engagementPatterns: 'Peak hours: 7-9 PM'
        });
        
        console.log('Generated Event:', JSON.stringify(event, null, 2));
        
        // Generate a visual asset
        const visual = await ai.generateVisualAsset('icon', 'magic crystal', 'fantasy');
        
        console.log('Generated Visual:', JSON.stringify(visual, null, 2));
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

example();
EOF

    print_success "Usage example created: examples/free-ai-example.js"
}

# Main setup function
main() {
    echo "🎮 Free AI Content Generator Setup"
    echo "=================================="
    echo "This will set up 100% free AI services with no subscriptions or trials."
    echo ""
    
    check_os
    install_ollama
    start_ollama
    download_models
    install_dependencies
    create_env_file
    create_example
    test_setup
    
    echo ""
    echo "🎉 Setup Complete!"
    echo "=================="
    echo ""
    echo "✅ Ollama is running with free AI models"
    echo "✅ Node.js dependencies installed"
    echo "✅ Environment configuration created"
    echo "✅ Usage example created"
    echo ""
    echo "🚀 Next Steps:"
    echo "1. Copy .env.free-ai to .env"
    echo "2. Run: node examples/free-ai-example.js"
    echo "3. Start using the FreeAIContentGenerator in your code!"
    echo ""
    echo "📚 Documentation:"
    echo "- Ollama: https://ollama.ai"
    echo "- Hugging Face: https://huggingface.co"
    echo "- Free AI Models: https://huggingface.co/models?pipeline_tag=text-generation&sort=downloads"
    echo ""
    echo "💡 Tips:"
    echo "- Ollama models are downloaded locally, so no internet required after setup"
    echo "- Hugging Face free tier has rate limits but no subscription required"
    echo "- All generated content is stored locally by default"
    echo ""
}

# Run main function
main "$@"