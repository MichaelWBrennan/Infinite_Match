import { Logger } from '../core/logger/index.js';
import { ServiceError } from '../core/errors/ErrorHandler.js';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

/**
 * Free AI Content Generator - 100% Free AI-powered infinite content creation
 * Uses Ollama (local LLM), Hugging Face, and Stable Diffusion - NO subscriptions or trials
 */
class FreeAIContentGenerator {
  constructor() {
    this.logger = new Logger('FreeAIContentGenerator');
    
    // Configuration for free AI services
    this.config = {
      // Ollama configuration (local LLM)
      ollama: {
        baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        model: process.env.OLLAMA_MODEL || 'llama3.1:8b', // Free model
        fallbackModel: 'llama3.1:7b'
      },
      
      // Hugging Face configuration (free tier)
      huggingface: {
        apiUrl: 'https://api-inference.huggingface.co/models',
        models: {
          text: 'microsoft/DialoGPT-medium', // Free model
          image: 'stabilityai/stable-diffusion-2-1', // Free model
          sentiment: 'cardiffnlp/twitter-roberta-base-sentiment-latest'
        },
        apiKey: process.env.HUGGINGFACE_API_KEY || null // Optional for higher limits
      },
      
      // Local ML models configuration
      localML: {
        enabled: process.env.ENABLE_LOCAL_ML === 'true',
        modelsPath: './models/',
        cacheSize: 1000
      }
    };

    // Content generation state
    this.contentTemplates = new Map();
    this.generatedContent = new Map();
    this.playerPreferences = new Map();
    this.marketTrends = new Map();
    this.localMLModels = new Map();
    this.cache = new Map();

    this.initializeContentTemplates();
    this.initializeLocalML();
  }

  /**
   * Initialize local ML models for content enhancement
   */
  async initializeLocalML() {
    if (!this.config.localML.enabled) {
      this.logger.info('Local ML disabled, using cloud services only');
      return;
    }

    try {
      // Initialize simple ML models for content analysis
      await this.loadLocalModels();
      this.logger.info('Local ML models initialized successfully');
    } catch (error) {
      this.logger.warn('Failed to initialize local ML models, falling back to cloud services', error);
    }
  }

  /**
   * Load local ML models
   */
  async loadLocalModels() {
    // Simple sentiment analysis model
    this.localMLModels.set('sentiment', {
      analyze: (text) => {
        // Simple rule-based sentiment analysis
        const positiveWords = ['good', 'great', 'excellent', 'amazing', 'fantastic', 'wonderful'];
        const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'disappointing'];
        
        const words = text.toLowerCase().split(/\s+/);
        const positiveCount = words.filter(word => positiveWords.includes(word)).length;
        const negativeCount = words.filter(word => negativeWords.includes(word)).length;
        
        if (positiveCount > negativeCount) return { sentiment: 'positive', score: 0.7 };
        if (negativeCount > positiveCount) return { sentiment: 'negative', score: 0.7 };
        return { sentiment: 'neutral', score: 0.5 };
      }
    });

    // Simple difficulty calculator
    this.localMLModels.set('difficulty', {
      calculate: (levelData, playerProfile) => {
        const baseDifficulty = levelData.difficulty || 5;
        const playerLevel = playerProfile.currentLevel || 1;
        const performance = playerProfile.recentPerformance || 'average';
        
        let adjustment = 0;
        if (performance === 'good') adjustment = -0.5;
        if (performance === 'poor') adjustment = 0.5;
        
        const adjustedDifficulty = Math.max(1, Math.min(10, baseDifficulty + adjustment));
        return adjustedDifficulty;
      }
    });

    // Engagement predictor
    this.localMLModels.set('engagement', {
      predict: (content, playerProfile) => {
        // Simple engagement prediction based on content complexity and player preferences
        const complexity = this.calculateContentComplexity(content);
        const playerPreference = this.getPlayerEngagementPreference(playerProfile);
        
        // Higher engagement for content that matches player preferences
        const baseEngagement = 0.5;
        const preferenceMatch = this.calculatePreferenceMatch(content, playerProfile);
        const complexityMatch = 1 - Math.abs(complexity - playerPreference) / 10;
        
        return Math.min(1, baseEngagement + (preferenceMatch * 0.3) + (complexityMatch * 0.2));
      }
    });
  }

  /**
   * Generate infinite levels using free AI
   */
  async generateLevel(levelNumber, difficulty, playerProfile) {
    try {
      this.logger.info(`Generating level ${levelNumber} with free AI`);

      // Try Ollama first (local), fallback to Hugging Face
      let levelData;
      try {
        levelData = await this.generateWithOllama('level', {
          levelNumber,
          difficulty,
          playerProfile
        });
      } catch (error) {
        this.logger.warn('Ollama failed, trying Hugging Face', error);
        levelData = await this.generateWithHuggingFace('level', {
          levelNumber,
          difficulty,
          playerProfile
        });
      }

      // If both fail, use template-based generation
      if (!levelData) {
        levelData = this.generateFromTemplate('level', {
          levelNumber,
          difficulty,
          playerProfile
        });
      }

      // Enhance with local ML
      const enhancedLevel = await this.enhanceLevelWithLocalML(levelData, playerProfile);

      // Store in cache
      this.generatedContent.set(enhancedLevel.id, enhancedLevel);

      this.logger.info(`Generated level ${levelNumber} with free AI`, { levelId: enhancedLevel.id });
      return enhancedLevel;
    } catch (error) {
      this.logger.error('Failed to generate level with free AI', { error: error.message });
      throw new ServiceError('AI_LEVEL_GENERATION_FAILED', 'Failed to generate level');
    }
  }

  /**
   * Generate infinite events using free AI
   */
  async generateEvent(eventType, playerSegment, marketTrends) {
    try {
      this.logger.info(`Generating ${eventType} event with free AI`);

      let eventData;
      try {
        eventData = await this.generateWithOllama('event', {
          eventType,
          playerSegment,
          marketTrends
        });
      } catch (error) {
        this.logger.warn('Ollama failed, trying Hugging Face', error);
        eventData = await this.generateWithHuggingFace('event', {
          eventType,
          playerSegment,
          marketTrends
        });
      }

      if (!eventData) {
        eventData = this.generateFromTemplate('event', {
          eventType,
          playerSegment,
          marketTrends
        });
      }

      const enhancedEvent = await this.enhanceEventWithLocalML(eventData, marketTrends);

      this.generatedContent.set(enhancedEvent.id, enhancedEvent);

      this.logger.info(`Generated ${eventType} event with free AI`, { eventId: enhancedEvent.id });
      return enhancedEvent;
    } catch (error) {
      this.logger.error('Failed to generate event with free AI', { error: error.message });
      throw new ServiceError('AI_EVENT_GENERATION_FAILED', 'Failed to generate event');
    }
  }

  /**
   * Generate visual assets using free Stable Diffusion
   */
  async generateVisualAsset(assetType, description, style) {
    try {
      this.logger.info(`Generating ${assetType} visual asset with free AI`);

      const prompt = this.buildVisualPrompt(assetType, description, style);
      
      // Use Hugging Face Stable Diffusion (free)
      const imageData = await this.generateImageWithHuggingFace(prompt);
      
      const processedAsset = await this.processVisualAsset(imageData, assetType);

      this.generatedContent.set(processedAsset.id, processedAsset);

      this.logger.info(`Generated ${assetType} visual asset with free AI`, {
        assetId: processedAsset.id,
      });
      return processedAsset;
    } catch (error) {
      this.logger.error('Failed to generate visual asset with free AI', { error: error.message });
      throw new ServiceError('AI_VISUAL_GENERATION_FAILED', 'Failed to generate visual asset');
    }
  }

  /**
   * Generate content using Ollama (local LLM)
   */
  async generateWithOllama(contentType, params) {
    try {
      const prompt = this.buildPrompt(contentType, params);
      
      const response = await axios.post(`${this.config.ollama.baseUrl}/api/generate`, {
        model: this.config.ollama.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 2000
        }
      });

      if (response.data && response.data.response) {
        return this.parseAIResponse(response.data.response, contentType);
      }
      
      throw new Error('Invalid response from Ollama');
    } catch (error) {
      this.logger.warn('Ollama generation failed', error);
      throw error;
    }
  }

  /**
   * Generate content using Hugging Face (free tier)
   */
  async generateWithHuggingFace(contentType, params) {
    try {
      const prompt = this.buildPrompt(contentType, params);
      
      const headers = {};
      if (this.config.huggingface.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.huggingface.apiKey}`;
      }

      const response = await axios.post(
        `${this.config.huggingface.apiUrl}/${this.config.huggingface.models.text}`,
        {
          inputs: prompt,
          parameters: {
            max_length: 1000,
            temperature: 0.7,
            do_sample: true
          }
        },
        { headers }
      );

      if (response.data && response.data[0] && response.data[0].generated_text) {
        return this.parseAIResponse(response.data[0].generated_text, contentType);
      }
      
      throw new Error('Invalid response from Hugging Face');
    } catch (error) {
      this.logger.warn('Hugging Face generation failed', error);
      throw error;
    }
  }

  /**
   * Generate image using Hugging Face Stable Diffusion
   */
  async generateImageWithHuggingFace(prompt) {
    try {
      const headers = {};
      if (this.config.huggingface.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.huggingface.apiKey}`;
      }

      const response = await axios.post(
        `${this.config.huggingface.apiUrl}/${this.config.huggingface.models.image}`,
        {
          inputs: prompt,
          parameters: {
            num_inference_steps: 20,
            guidance_scale: 7.5,
            width: 512,
            height: 512
          }
        },
        { 
          headers,
          responseType: 'arraybuffer'
        }
      );

      // Convert to base64
      const base64 = Buffer.from(response.data).toString('base64');
      return `data:image/png;base64,${base64}`;
    } catch (error) {
      this.logger.warn('Hugging Face image generation failed', error);
      throw error;
    }
  }

  /**
   * Generate content from templates (fallback)
   */
  generateFromTemplate(contentType, params) {
    const templates = this.contentTemplates.get(contentType);
    if (!templates) {
      throw new Error(`No template found for content type: ${contentType}`);
    }

    if (contentType === 'level') {
      return this.generateLevelFromTemplate(params, templates);
    } else if (contentType === 'event') {
      return this.generateEventFromTemplate(params, templates);
    }

    throw new Error(`Template generation not implemented for: ${contentType}`);
  }

  /**
   * Generate level from template
   */
  generateLevelFromTemplate(params, templates) {
    const { levelNumber, difficulty, playerProfile } = params;
    
    // Select template based on difficulty
    let template;
    if (difficulty <= 3) template = templates.basic;
    else if (difficulty <= 7) template = templates.intermediate;
    else template = templates.advanced;

    // Generate board
    const board = this.generateBoard(template, difficulty);
    
    // Generate objectives
    const objectives = this.generateObjectives(template, difficulty);

    return {
      id: uuidv4(),
      levelNumber,
      difficulty,
      board,
      objectives,
      moves: template.moves,
      timeLimit: null,
      powerUps: this.selectPowerUps(difficulty),
      theme: this.selectTheme(playerProfile),
      estimatedDuration: this.calculateDuration(difficulty),
      difficultyCurve: difficulty / 10,
      generatedAt: new Date().toISOString(),
      metadata: {
        generator: 'free-ai-content-generator',
        version: '1.0.0',
        method: 'template',
        playerId: playerProfile.id,
      }
    };
  }

  /**
   * Generate event from template
   */
  generateEventFromTemplate(params, templates) {
    const { eventType, playerSegment, marketTrends } = params;
    
    const template = templates[eventType] || templates.daily;
    
    return {
      id: uuidv4(),
      name: this.generateEventName(eventType, marketTrends),
      type: eventType,
      description: this.generateEventDescription(eventType, playerSegment),
      duration: template.duration,
      objectives: this.generateEventObjectives(template, eventType),
      rewards: this.generateEventRewards(template, playerSegment),
      theme: this.selectEventTheme(marketTrends),
      visualAssets: {
        banner: null, // Would be generated separately
        icon: null
      },
      monetization: {
        premiumPass: eventType === 'weekly' || eventType === 'monthly',
        specialOffers: true
      },
      generatedAt: new Date().toISOString(),
      metadata: {
        generator: 'free-ai-content-generator',
        version: '1.0.0',
        method: 'template',
        marketData: marketTrends,
      }
    };
  }

  /**
   * Enhance level with local ML
   */
  async enhanceLevelWithLocalML(levelData, playerProfile) {
    if (!this.config.localML.enabled) {
      return levelData;
    }

    const difficultyModel = this.localMLModels.get('difficulty');
    const engagementModel = this.localMLModels.get('engagement');

    const adjustedDifficulty = difficultyModel.calculate(levelData, playerProfile);
    const engagementPrediction = engagementModel.predict(levelData, playerProfile);

    return {
      ...levelData,
      id: levelData.id || uuidv4(),
      difficulty: adjustedDifficulty,
      aiEnhancements: {
        engagementPrediction,
        difficultyAdjustment: adjustedDifficulty - (levelData.difficulty || 5),
        playerProfileMatch: this.calculateProfileMatch(levelData, playerProfile),
        mlMethod: 'local'
      },
      metadata: {
        ...levelData.metadata,
        enhanced: true,
        enhancementMethod: 'local-ml'
      }
    };
  }

  /**
   * Enhance event with local ML
   */
  async enhanceEventWithLocalML(eventData, marketTrends) {
    if (!this.config.localML.enabled) {
      return eventData;
    }

    const engagementModel = this.localMLModels.get('engagement');
    const mockPlayerProfile = { segment: 'casual', preferences: {} };
    
    const engagementScore = engagementModel.predict(eventData, mockPlayerProfile);

    return {
      ...eventData,
      id: eventData.id || uuidv4(),
      marketOptimization: {
        trendAlignment: this.calculateTrendAlignment(eventData, marketTrends),
        revenuePotential: this.calculateRevenuePotential(eventData, marketTrends),
        engagementScore,
        mlMethod: 'local'
      },
      metadata: {
        ...eventData.metadata,
        enhanced: true,
        enhancementMethod: 'local-ml'
      }
    };
  }

  /**
   * Build prompts for different content types
   */
  buildPrompt(contentType, params) {
    if (contentType === 'level') {
      return this.buildLevelPrompt(params.levelNumber, params.difficulty, params.playerProfile);
    } else if (contentType === 'event') {
      return this.buildEventPrompt(params.eventType, params.playerSegment, params.marketTrends);
    }
    throw new Error(`Unknown content type: ${contentType}`);
  }

  /**
   * Build level generation prompt
   */
  buildLevelPrompt(levelNumber, difficulty, playerProfile) {
    return `Create a match-3 puzzle level JSON for a mobile game:

Level: ${levelNumber}
Difficulty: ${difficulty}/10
Player Level: ${playerProfile.currentLevel}
Colors: ${playerProfile.preferredColors?.join(', ') || 'Any'}

Return ONLY valid JSON in this exact format:
{
  "levelNumber": ${levelNumber},
  "difficulty": ${difficulty},
  "board": {
    "width": 8,
    "height": 8,
    "tiles": [["red","blue","green","yellow","purple","red","blue","green"], ...],
    "specialTiles": [{"x":2,"y":3,"type":"bomb"}],
    "obstacles": [{"x":1,"y":1,"type":"ice"}]
  },
  "objectives": [{"type":"score","target":10000,"description":"Score 10,000 points"}],
  "moves": 25,
  "powerUps": ["rocket","bomb"],
  "theme": "fantasy"
}`;
  }

  /**
   * Build event generation prompt
   */
  buildEventPrompt(eventType, playerSegment, marketTrends) {
    return `Create a ${eventType} game event JSON for ${playerSegment} players:

Market Trends: ${marketTrends.popularThemes?.join(', ') || 'Fantasy, Sci-Fi'}

Return ONLY valid JSON in this exact format:
{
  "name": "Event Name",
  "type": "${eventType}",
  "description": "Event description",
  "duration": 7,
  "objectives": [{"id":"obj_1","description":"Complete 10 levels","target":10,"reward":{"coins":500}}],
  "rewards": [{"tier":"bronze","requirements":1,"rewards":{"coins":100}}],
  "theme": "fantasy"
}`;
  }

  /**
   * Build visual generation prompt
   */
  buildVisualPrompt(assetType, description, style) {
    return `A ${assetType} for a match-3 mobile game: ${description}, ${style}, colorful, modern, mobile-optimized, 512x512 pixels, game art style`;
  }

  /**
   * Parse AI response and extract JSON
   */
  parseAIResponse(response, contentType) {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // If no JSON found, try to parse the entire response
      return JSON.parse(response);
    } catch (error) {
      this.logger.warn('Failed to parse AI response as JSON', { response, error: error.message });
      return null;
    }
  }

  /**
   * Generate board for match-3 level
   */
  generateBoard(template, difficulty) {
    const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
    const width = 8;
    const height = 8;
    
    const tiles = [];
    for (let y = 0; y < height; y++) {
      const row = [];
      for (let x = 0; x < width; x++) {
        row.push(colors[Math.floor(Math.random() * colors.length)]);
      }
      tiles.push(row);
    }

    // Add special tiles based on difficulty
    const specialTiles = [];
    const specialCount = Math.min(template.specialTiles, Math.floor(difficulty / 2));
    for (let i = 0; i < specialCount; i++) {
      specialTiles.push({
        x: Math.floor(Math.random() * width),
        y: Math.floor(Math.random() * height),
        type: ['bomb', 'rocket', 'color_bomb'][Math.floor(Math.random() * 3)]
      });
    }

    return {
      width,
      height,
      tiles,
      specialTiles,
      obstacles: []
    };
  }

  /**
   * Generate objectives for level
   */
  generateObjectives(template, difficulty) {
    const objectives = [];
    const objectiveCount = Math.min(template.objectives, Math.floor(difficulty / 3) + 1);
    
    for (let i = 0; i < objectiveCount; i++) {
      objectives.push({
        type: 'score',
        target: 5000 + (difficulty * 1000),
        description: `Score ${5000 + (difficulty * 1000)} points`
      });
    }
    
    return objectives;
  }

  /**
   * Select power-ups based on difficulty
   */
  selectPowerUps(difficulty) {
    const allPowerUps = ['rocket', 'bomb', 'color_bomb', 'rainbow', 'striped'];
    const count = Math.min(Math.floor(difficulty / 3) + 1, 3);
    return allPowerUps.slice(0, count);
  }

  /**
   * Select theme based on player profile
   */
  selectTheme(playerProfile) {
    const themes = ['fantasy', 'sci-fi', 'nature', 'space', 'ocean', 'forest'];
    return themes[Math.floor(Math.random() * themes.length)];
  }

  /**
   * Calculate duration based on difficulty
   */
  calculateDuration(difficulty) {
    return 60 + (difficulty * 10); // 60-160 seconds
  }

  /**
   * Generate event name
   */
  generateEventName(eventType, marketTrends) {
    const themes = marketTrends.popularThemes || ['Fantasy', 'Sci-Fi', 'Adventure'];
    const theme = themes[Math.floor(Math.random() * themes.length)];
    const eventNames = {
      daily: [`${theme} Daily Challenge`, `Quick ${theme} Quest`],
      weekly: [`${theme} Weekly Tournament`, `Epic ${theme} Adventure`],
      monthly: [`${theme} Grand Championship`, `Legendary ${theme} Quest`]
    };
    
    const names = eventNames[eventType] || eventNames.daily;
    return names[Math.floor(Math.random() * names.length)];
  }

  /**
   * Generate event description
   */
  generateEventDescription(eventType, playerSegment) {
    const descriptions = {
      daily: `Complete daily challenges to earn exclusive rewards!`,
      weekly: `Join the weekly tournament and compete for amazing prizes!`,
      monthly: `The ultimate monthly championship awaits! Show your skills!`
    };
    return descriptions[eventType] || descriptions.daily;
  }

  /**
   * Generate event objectives
   */
  generateEventObjectives(template, eventType) {
    const objectives = [];
    for (let i = 0; i < template.objectives; i++) {
      objectives.push({
        id: `obj_${i + 1}`,
        description: `Complete ${5 + (i * 5)} levels`,
        target: 5 + (i * 5),
        reward: { coins: 100 * (i + 1), gems: 10 * (i + 1) }
      });
    }
    return objectives;
  }

  /**
   * Generate event rewards
   */
  generateEventRewards(template, playerSegment) {
    return [
      { tier: 'bronze', requirements: 1, rewards: { coins: 100, gems: 10 } },
      { tier: 'silver', requirements: 3, rewards: { coins: 300, gems: 30 } },
      { tier: 'gold', requirements: 5, rewards: { coins: 500, gems: 50 } }
    ];
  }

  /**
   * Select event theme
   */
  selectEventTheme(marketTrends) {
    const themes = marketTrends.popularThemes || ['Fantasy', 'Sci-Fi', 'Adventure'];
    return themes[Math.floor(Math.random() * themes.length)].toLowerCase();
  }

  /**
   * Process visual asset
   */
  async processVisualAsset(imageData, assetType) {
    return {
      id: uuidv4(),
      type: assetType,
      originalUrl: imageData,
      processedUrl: imageData,
      formats: {
        webp: imageData,
        png: imageData,
        jpg: imageData,
      },
      sizes: {
        small: imageData,
        medium: imageData,
        large: imageData,
      },
      generatedAt: new Date().toISOString(),
      metadata: {
        generator: 'free-ai-content-generator',
        version: '1.0.0',
        method: 'stable-diffusion'
      }
    };
  }

  /**
   * Initialize content templates
   */
  initializeContentTemplates() {
    this.contentTemplates.set('level', {
      basic: { moves: 25, objectives: 1, specialTiles: 0 },
      intermediate: { moves: 20, objectives: 2, specialTiles: 2 },
      advanced: { moves: 15, objectives: 3, specialTiles: 4 },
    });

    this.contentTemplates.set('event', {
      daily: { duration: 1, objectives: 3, rewards: 'small' },
      weekly: { duration: 7, objectives: 10, rewards: 'medium' },
      monthly: { duration: 30, objectives: 50, rewards: 'large' },
    });
  }

  // Helper methods for ML calculations
  calculateContentComplexity(content) {
    // Simple complexity calculation based on content properties
    let complexity = 5; // Base complexity
    
    if (content.board && content.board.specialTiles) {
      complexity += content.board.specialTiles.length * 0.5;
    }
    
    if (content.objectives) {
      complexity += content.objectives.length * 0.3;
    }
    
    return Math.min(10, complexity);
  }

  getPlayerEngagementPreference(playerProfile) {
    // Map player segment to preferred complexity
    const preferences = {
      casual: 3,
      regular: 5,
      hardcore: 8,
      competitive: 9
    };
    
    return preferences[playerProfile.segment] || 5;
  }

  calculatePreferenceMatch(content, playerProfile) {
    // Simple preference matching algorithm
    const contentComplexity = this.calculateContentComplexity(content);
    const playerPreference = this.getPlayerEngagementPreference(playerProfile);
    
    const difference = Math.abs(contentComplexity - playerPreference);
    return Math.max(0, 1 - (difference / 10));
  }

  calculateProfileMatch(levelData, playerProfile) {
    // Calculate how well the content matches player profile
    let match = 0.5; // Base match
    
    // Check color preferences
    if (playerProfile.preferredColors && levelData.board) {
      const levelColors = new Set();
      levelData.board.tiles.forEach(row => {
        row.forEach(color => levelColors.add(color));
      });
      
      const preferredColors = new Set(playerProfile.preferredColors);
      const colorMatch = [...levelColors].filter(color => preferredColors.has(color)).length / levelColors.size;
      match += colorMatch * 0.3;
    }
    
    // Check difficulty match
    const difficultyMatch = 1 - Math.abs((levelData.difficulty || 5) - (playerProfile.currentLevel || 1)) / 10;
    match += difficultyMatch * 0.2;
    
    return Math.min(1, match);
  }

  calculateTrendAlignment(eventData, marketTrends) {
    // Calculate how well event aligns with market trends
    let alignment = 0.5;
    
    if (marketTrends.popularThemes && eventData.theme) {
      const themeMatch = marketTrends.popularThemes.some(theme => 
        eventData.theme.toLowerCase().includes(theme.toLowerCase())
      );
      if (themeMatch) alignment += 0.3;
    }
    
    return Math.min(1, alignment);
  }

  calculateRevenuePotential(eventData, marketTrends) {
    // Calculate potential revenue based on event characteristics
    let potential = 0.5;
    
    if (eventData.monetization && eventData.monetization.premiumPass) {
      potential += 0.2;
    }
    
    if (eventData.duration > 7) {
      potential += 0.1;
    }
    
    return Math.min(1, potential);
  }

  calculateEngagementScore(eventData, marketTrends) {
    // Calculate engagement score based on event design
    let score = 0.5;
    
    if (eventData.objectives && eventData.objectives.length > 0) {
      score += Math.min(0.3, eventData.objectives.length * 0.05);
    }
    
    if (eventData.rewards && eventData.rewards.length > 0) {
      score += Math.min(0.2, eventData.rewards.length * 0.05);
    }
    
    return Math.min(1, score);
  }

  /**
   * Get service status
   */
  getServiceStatus() {
    return {
      status: 'active',
      services: {
        ollama: this.config.ollama.baseUrl,
        huggingface: this.config.huggingface.apiUrl,
        localML: this.config.localML.enabled
      },
      generatedContent: this.generatedContent.size,
      cacheSize: this.cache.size
    };
  }
}

export { FreeAIContentGenerator };