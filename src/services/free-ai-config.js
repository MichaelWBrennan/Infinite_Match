/**
 * Free AI Content Generator Configuration
 * Configuration for 100% free AI services with no subscriptions or trials
 */

export const FREE_AI_CONFIG = {
  // Ollama Configuration (Local LLM - Completely Free)
  ollama: {
    // Download and install Ollama from https://ollama.ai
    // Then run: ollama pull llama3.1:8b
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    models: {
      primary: 'llama3.1:8b',      // 8B parameter model - good balance
      fallback: 'llama3.1:7b',     // 7B parameter model - faster
      lightweight: 'llama3.1:3b',  // 3B parameter model - very fast
      code: 'codellama:7b'         // Specialized for code generation
    },
    options: {
      temperature: 0.7,
      top_p: 0.9,
      max_tokens: 2000,
      timeout: 30000
    }
  },

  // Hugging Face Configuration (Free Tier)
  huggingface: {
    apiUrl: 'https://api-inference.huggingface.co/models',
    // Optional: Get free API key from https://huggingface.co/settings/tokens
    apiKey: process.env.HUGGINGFACE_API_KEY || null,
    
    // Free models (no API key required, but slower)
    models: {
      // Text generation models
      text: {
        primary: 'microsoft/DialoGPT-medium',
        fallback: 'gpt2',
        code: 'microsoft/CodeGPT-small-py'
      },
      
      // Image generation models
      image: {
        primary: 'stabilityai/stable-diffusion-2-1',
        fallback: 'runwayml/stable-diffusion-v1-5',
        anime: 'gsdf/Counterfeit-V2.5'
      },
      
      // Sentiment analysis
      sentiment: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
      
      // Text classification
      classification: 'distilbert-base-uncased-finetuned-sst-2-english'
    },
    
    // Rate limits for free tier
    rateLimits: {
      requestsPerMinute: 60,
      requestsPerHour: 1000,
      maxTokensPerRequest: 1000
    }
  },

  // Local ML Models Configuration
  localML: {
    enabled: process.env.ENABLE_LOCAL_ML === 'true',
    modelsPath: './models/',
    cacheSize: 1000,
    
    // Simple ML models that don't require external APIs
    models: {
      sentiment: {
        type: 'rule-based',
        description: 'Simple rule-based sentiment analysis'
      },
      difficulty: {
        type: 'algorithmic',
        description: 'Algorithmic difficulty calculation'
      },
      engagement: {
        type: 'heuristic',
        description: 'Heuristic engagement prediction'
      }
    }
  },

  // Content Generation Settings
  content: {
    // Level generation
    level: {
      minDifficulty: 1,
      maxDifficulty: 10,
      defaultMoves: 25,
      boardSize: { width: 8, height: 8 },
      colors: ['red', 'blue', 'green', 'yellow', 'purple', 'orange'],
      specialTiles: ['bomb', 'rocket', 'color_bomb', 'rainbow', 'striped']
    },
    
    // Event generation
    event: {
      types: ['daily', 'weekly', 'monthly', 'special'],
      themes: ['fantasy', 'sci-fi', 'nature', 'space', 'ocean', 'forest'],
      durations: { daily: 1, weekly: 7, monthly: 30, special: 14 }
    },
    
    // Visual asset generation
    visual: {
      sizes: ['small', 'medium', 'large'],
      formats: ['png', 'jpg', 'webp'],
      dimensions: {
        small: { width: 256, height: 256 },
        medium: { width: 512, height: 512 },
        large: { width: 1024, height: 1024 }
      }
    }
  },

  // Fallback and Error Handling
  fallback: {
    // If AI services fail, use template-based generation
    useTemplates: true,
    
    // If templates fail, use simple random generation
    useRandom: true,
    
    // Cache generated content to reduce API calls
    enableCaching: true,
    cacheExpiry: 24 * 60 * 60 * 1000, // 24 hours
    maxCacheSize: 1000
  },

  // Performance Settings
  performance: {
    // Concurrent request limits
    maxConcurrentRequests: 5,
    
    // Timeout settings
    requestTimeout: 30000,
    
    // Retry settings
    maxRetries: 3,
    retryDelay: 1000,
    
    // Batch processing
    batchSize: 10,
    batchDelay: 100
  }
};

// Environment-specific configurations
export const getEnvironmentConfig = (env = process.env.NODE_ENV) => {
  const baseConfig = FREE_AI_CONFIG;
  
  switch (env) {
    case 'development':
      return {
        ...baseConfig,
        ollama: {
          ...baseConfig.ollama,
          options: {
            ...baseConfig.ollama.options,
            temperature: 0.8, // More creative in dev
            max_tokens: 1000  // Faster responses
          }
        },
        performance: {
          ...baseConfig.performance,
          maxConcurrentRequests: 2,
          requestTimeout: 15000
        }
      };
      
    case 'production':
      return {
        ...baseConfig,
        ollama: {
          ...baseConfig.ollama,
          options: {
            ...baseConfig.ollama.options,
            temperature: 0.7, // More consistent in prod
            max_tokens: 2000
          }
        },
        performance: {
          ...baseConfig.performance,
          maxConcurrentRequests: 10,
          requestTimeout: 60000
        }
      };
      
    case 'test':
      return {
        ...baseConfig,
        ollama: {
          ...baseConfig.ollama,
          baseUrl: 'http://localhost:11434',
          models: {
            ...baseConfig.ollama.models,
            primary: 'llama3.1:3b' // Faster for tests
          }
        },
        performance: {
          ...baseConfig.performance,
          maxConcurrentRequests: 1,
          requestTimeout: 5000
        }
      };
      
    default:
      return baseConfig;
  }
};

// Service availability checker
export const checkServiceAvailability = async () => {
  const results = {
    ollama: false,
    huggingface: false,
    localML: false
  };
  
  try {
    // Check Ollama
    const ollamaResponse = await fetch(`${FREE_AI_CONFIG.ollama.baseUrl}/api/tags`, {
      method: 'GET',
      timeout: 5000
    });
    results.ollama = ollamaResponse.ok;
  } catch (error) {
    console.warn('Ollama not available:', error.message);
  }
  
  try {
    // Check Hugging Face
    const hfResponse = await fetch(`${FREE_AI_CONFIG.huggingface.apiUrl}/${FREE_AI_CONFIG.huggingface.models.text}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(FREE_AI_CONFIG.huggingface.apiKey && {
          'Authorization': `Bearer ${FREE_AI_CONFIG.huggingface.apiKey}`
        })
      },
      body: JSON.stringify({ inputs: 'test' }),
      timeout: 10000
    });
    results.huggingface = hfResponse.ok;
  } catch (error) {
    console.warn('Hugging Face not available:', error.message);
  }
  
  // Local ML is always available
  results.localML = FREE_AI_CONFIG.localML.enabled;
  
  return results;
};

export default FREE_AI_CONFIG;