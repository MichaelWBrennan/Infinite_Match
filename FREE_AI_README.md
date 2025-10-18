# 🆓 Free AI Content Generator

**100% Free AI-powered infinite content creation for games - No subscriptions, no trials, no API keys required!**

## 🌟 Features

- **🤖 Local AI Models**: Uses Ollama with free Llama models
- **☁️ Cloud AI Fallback**: Hugging Face free tier as backup
- **🎮 Game Content**: Generate levels, events, and visual assets
- **🧠 Local ML**: Smart content enhancement without external APIs
- **⚡ Fast & Reliable**: Works offline after initial setup
- **🔒 Privacy-First**: All processing happens locally

## 🚀 Quick Start

### 1. Run the Setup Script

```bash
chmod +x scripts/setup-free-ai.sh
./scripts/setup-free-ai.sh
```

### 2. Copy Environment Configuration

```bash
cp .env.free-ai .env
```

### 3. Test the Installation

```bash
node examples/free-ai-example.js
```

## 📋 Requirements

- **Node.js** 18+ 
- **8GB RAM** (for local AI models)
- **10GB free disk space** (for model storage)
- **Internet connection** (for initial setup only)

## 🛠️ Installation

### Option 1: Automated Setup (Recommended)

```bash
# Clone the repository
git clone <your-repo-url>
cd your-repo

# Run the setup script
chmod +x scripts/setup-free-ai.sh
./scripts/setup-free-ai.sh
```

### Option 2: Manual Setup

#### 1. Install Ollama

**Linux/macOS:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

**Windows:**
Download from [ollama.ai](https://ollama.ai)

#### 2. Start Ollama Service

```bash
ollama serve
```

#### 3. Download AI Models

```bash
# Primary model (8B parameters - good balance)
ollama pull llama3.1:8b

# Fallback model (7B parameters - faster)
ollama pull llama3.1:7b

# Lightweight model (3B parameters - very fast)
ollama pull llama3.1:3b

# Code generation model
ollama pull codellama:7b
```

#### 4. Install Dependencies

```bash
npm install
```

## 🎮 Usage

### Basic Usage

```javascript
import { FreeAIContentGenerator } from './src/services/free-ai-content-generator.js';

const ai = new FreeAIContentGenerator();

// Generate a match-3 level
const level = await ai.generateLevel(1, 5, {
    id: 'player1',
    currentLevel: 1,
    preferredColors: ['red', 'blue', 'green'],
    recentPerformance: 'good',
    segment: 'casual'
});

console.log('Generated Level:', level);
```

### Generate Game Events

```javascript
// Generate a daily event
const event = await ai.generateEvent('daily', 'casual', {
    popularThemes: ['Fantasy', 'Sci-Fi'],
    engagementPatterns: 'Peak hours: 7-9 PM',
    revenueTrends: 'Weekend spikes'
});

console.log('Generated Event:', event);
```

### Generate Visual Assets

```javascript
// Generate a game icon
const visual = await ai.generateVisualAsset('icon', 'magic crystal', 'fantasy');

console.log('Generated Visual:', visual);
```

### Personalized Content

```javascript
// Generate personalized content based on player behavior
const personalizedContent = await ai.generatePersonalizedContent(
    'player123',
    'level',
    {
        preferredColors: ['red', 'blue'],
        difficultyPreference: 'medium',
        playStyle: 'casual'
    }
);
```

## 🔧 Configuration

### Environment Variables

```bash
# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b

# Hugging Face Configuration (optional)
HUGGINGFACE_API_KEY=your_free_api_key_here

# Local ML Configuration
ENABLE_LOCAL_ML=true

# Performance Settings
MAX_CONCURRENT_REQUESTS=5
REQUEST_TIMEOUT=30000
CACHE_SIZE=1000
```

### Model Selection

```javascript
// Use different models for different tasks
const config = {
    ollama: {
        model: 'llama3.1:8b',        // Best quality
        fallbackModel: 'llama3.1:7b', // Faster
        lightweightModel: 'llama3.1:3b' // Very fast
    }
};
```

## 🧠 AI Models Used

### Text Generation
- **Llama 3.1 8B**: Primary model for content generation
- **Llama 3.1 7B**: Fallback model for faster responses
- **Llama 3.1 3B**: Lightweight model for quick tasks
- **Code Llama 7B**: Specialized for code generation

### Image Generation
- **Stable Diffusion 2.1**: Free image generation
- **Stable Diffusion 1.5**: Fallback image model

### Local ML Models
- **Sentiment Analysis**: Rule-based sentiment detection
- **Difficulty Calculator**: Algorithmic difficulty adjustment
- **Engagement Predictor**: Heuristic engagement scoring

## 📊 Performance

### Speed Comparison

| Model | Size | Speed | Quality | Use Case |
|-------|------|-------|---------|----------|
| Llama 3.1 3B | 2GB | ⚡⚡⚡ | ⭐⭐⭐ | Quick generation |
| Llama 3.1 7B | 4GB | ⚡⚡ | ⭐⭐⭐⭐ | Balanced |
| Llama 3.1 8B | 5GB | ⚡ | ⭐⭐⭐⭐⭐ | Best quality |

### Memory Usage

- **Minimum**: 4GB RAM
- **Recommended**: 8GB RAM
- **Optimal**: 16GB+ RAM

## 🔄 Fallback System

The system uses a smart fallback approach:

1. **Primary**: Ollama (local, fastest)
2. **Secondary**: Hugging Face (cloud, free tier)
3. **Tertiary**: Template-based generation
4. **Final**: Random generation

## 🛡️ Privacy & Security

- **Local Processing**: All AI models run locally
- **No Data Collection**: No user data sent to external services
- **Offline Capable**: Works without internet after setup
- **Open Source**: All code is open and auditable

## 🚨 Troubleshooting

### Common Issues

#### Ollama Not Starting
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama manually
ollama serve

# Check logs
ollama logs
```

#### Model Download Fails
```bash
# Check available space
df -h

# Retry download
ollama pull llama3.1:8b

# Check model status
ollama list
```

#### Memory Issues
```bash
# Use smaller model
export OLLAMA_MODEL=llama3.1:3b

# Or reduce concurrent requests
export MAX_CONCURRENT_REQUESTS=1
```

#### Hugging Face Rate Limits
```bash
# Get free API key from https://huggingface.co/settings/tokens
export HUGGINGFACE_API_KEY=your_key_here
```

### Performance Optimization

#### For Low-End Systems
```bash
# Use lightweight model
export OLLAMA_MODEL=llama3.1:3b

# Reduce concurrent requests
export MAX_CONCURRENT_REQUESTS=1

# Disable local ML
export ENABLE_LOCAL_ML=false
```

#### For High-End Systems
```bash
# Use best model
export OLLAMA_MODEL=llama3.1:8b

# Increase concurrent requests
export MAX_CONCURRENT_REQUESTS=10

# Enable all features
export ENABLE_LOCAL_ML=true
```

## 📈 Monitoring

### Service Status

```javascript
const status = ai.getServiceStatus();
console.log('Service Status:', status);
```

### Health Check

```javascript
import { checkServiceAvailability } from './src/services/free-ai-config.js';

const availability = await checkServiceAvailability();
console.log('Available Services:', availability);
```

## 🔧 Advanced Configuration

### Custom Models

```javascript
// Use custom Ollama model
const ai = new FreeAIContentGenerator({
    ollama: {
        model: 'your-custom-model:latest'
    }
});
```

### Custom Prompts

```javascript
// Override default prompts
ai.buildLevelPrompt = (levelNumber, difficulty, playerProfile) => {
    return `Custom prompt for level ${levelNumber}`;
};
```

### Custom ML Models

```javascript
// Add custom ML model
ai.localMLModels.set('custom', {
    analyze: (data) => {
        // Your custom analysis logic
        return { result: 'custom' };
    }
});
```

## 📚 API Reference

### FreeAIContentGenerator

#### Methods

- `generateLevel(levelNumber, difficulty, playerProfile)` - Generate match-3 level
- `generateEvent(eventType, playerSegment, marketTrends)` - Generate game event
- `generateVisualAsset(assetType, description, style)` - Generate visual asset
- `generatePersonalizedContent(playerId, contentType, preferences)` - Generate personalized content
- `getServiceStatus()` - Get service status

#### Configuration

- `ollama` - Ollama configuration
- `huggingface` - Hugging Face configuration
- `localML` - Local ML configuration
- `content` - Content generation settings
- `fallback` - Fallback settings
- `performance` - Performance settings

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

## 🙏 Acknowledgments

- **Ollama** - Local LLM runtime
- **Hugging Face** - Free AI model hosting
- **Meta** - Llama models
- **Stability AI** - Stable Diffusion models

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)
- **Documentation**: [Wiki](https://github.com/your-repo/wiki)

---

**🎮 Happy Game Development with Free AI! 🚀**