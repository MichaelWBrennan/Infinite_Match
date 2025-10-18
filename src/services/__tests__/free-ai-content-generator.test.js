import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { FreeAIContentGenerator } from '../free-ai-content-generator.js';

// Mock axios for testing
jest.mock('axios');
import axios from 'axios';

describe('FreeAIContentGenerator', () => {
  let ai;
  let mockAxios;

  beforeEach(() => {
    ai = new FreeAIContentGenerator();
    mockAxios = axios;
    
    // Mock console methods to reduce noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      expect(ai).toBeDefined();
      expect(ai.config).toBeDefined();
      expect(ai.config.ollama).toBeDefined();
      expect(ai.config.huggingface).toBeDefined();
      expect(ai.config.localML).toBeDefined();
    });

    it('should initialize content templates', () => {
      expect(ai.contentTemplates.size).toBeGreaterThan(0);
      expect(ai.contentTemplates.has('level')).toBe(true);
      expect(ai.contentTemplates.has('event')).toBe(true);
    });
  });

  describe('Template-based Generation', () => {
    it('should generate level from template', () => {
      const playerProfile = {
        id: 'test-player',
        currentLevel: 1,
        preferredColors: ['red', 'blue'],
        recentPerformance: 'good',
        segment: 'casual'
      };

      const level = ai.generateFromTemplate('level', {
        levelNumber: 1,
        difficulty: 5,
        playerProfile
      });

      expect(level).toBeDefined();
      expect(level.id).toBeDefined();
      expect(level.levelNumber).toBe(1);
      expect(level.difficulty).toBe(5);
      expect(level.board).toBeDefined();
      expect(level.board.width).toBe(8);
      expect(level.board.height).toBe(8);
      expect(level.board.tiles).toBeDefined();
      expect(level.objectives).toBeDefined();
      expect(level.moves).toBeDefined();
    });

    it('should generate event from template', () => {
      const marketTrends = {
        popularThemes: ['Fantasy', 'Sci-Fi'],
        engagementPatterns: 'Peak hours: 7-9 PM'
      };

      const event = ai.generateFromTemplate('event', {
        eventType: 'daily',
        playerSegment: 'casual',
        marketTrends
      });

      expect(event).toBeDefined();
      expect(event.id).toBeDefined();
      expect(event.type).toBe('daily');
      expect(event.name).toBeDefined();
      expect(event.description).toBeDefined();
      expect(event.duration).toBeDefined();
      expect(event.objectives).toBeDefined();
      expect(event.rewards).toBeDefined();
    });
  });

  describe('Board Generation', () => {
    it('should generate valid board structure', () => {
      const template = { moves: 25, objectives: 1, specialTiles: 0 };
      const board = ai.generateBoard(template, 5);

      expect(board).toBeDefined();
      expect(board.width).toBe(8);
      expect(board.height).toBe(8);
      expect(board.tiles).toBeDefined();
      expect(board.tiles.length).toBe(8);
      expect(board.tiles[0].length).toBe(8);
      expect(board.specialTiles).toBeDefined();
      expect(Array.isArray(board.specialTiles)).toBe(true);
    });

    it('should generate tiles with valid colors', () => {
      const template = { moves: 25, objectives: 1, specialTiles: 0 };
      const board = ai.generateBoard(template, 5);
      const validColors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

      board.tiles.forEach(row => {
        row.forEach(color => {
          expect(validColors).toContain(color);
        });
      });
    });
  });

  describe('Objectives Generation', () => {
    it('should generate objectives based on template', () => {
      const template = { moves: 25, objectives: 2, specialTiles: 0 };
      const objectives = ai.generateObjectives(template, 5);

      expect(objectives).toBeDefined();
      expect(Array.isArray(objectives)).toBe(true);
      expect(objectives.length).toBeLessThanOrEqual(2);
      
      objectives.forEach(objective => {
        expect(objective.type).toBe('score');
        expect(objective.target).toBeGreaterThan(0);
        expect(objective.description).toBeDefined();
      });
    });
  });

  describe('Power-up Selection', () => {
    it('should select power-ups based on difficulty', () => {
      const powerUps1 = ai.selectPowerUps(1);
      const powerUps5 = ai.selectPowerUps(5);
      const powerUps10 = ai.selectPowerUps(10);

      expect(Array.isArray(powerUps1)).toBe(true);
      expect(Array.isArray(powerUps5)).toBe(true);
      expect(Array.isArray(powerUps10)).toBe(true);
      
      expect(powerUps1.length).toBeLessThanOrEqual(powerUps5.length);
      expect(powerUps5.length).toBeLessThanOrEqual(powerUps10.length);
    });

    it('should return valid power-up types', () => {
      const powerUps = ai.selectPowerUps(5);
      const validPowerUps = ['rocket', 'bomb', 'color_bomb', 'rainbow', 'striped'];

      powerUps.forEach(powerUp => {
        expect(validPowerUps).toContain(powerUp);
      });
    });
  });

  describe('Event Generation', () => {
    it('should generate event name', () => {
      const marketTrends = { popularThemes: ['Fantasy', 'Sci-Fi'] };
      const name = ai.generateEventName('daily', marketTrends);

      expect(name).toBeDefined();
      expect(typeof name).toBe('string');
      expect(name.length).toBeGreaterThan(0);
    });

    it('should generate event description', () => {
      const description = ai.generateEventDescription('daily', 'casual');

      expect(description).toBeDefined();
      expect(typeof description).toBe('string');
      expect(description.length).toBeGreaterThan(0);
    });

    it('should generate event objectives', () => {
      const template = { duration: 1, objectives: 3, rewards: 'small' };
      const objectives = ai.generateEventObjectives(template, 'daily');

      expect(objectives).toBeDefined();
      expect(Array.isArray(objectives)).toBe(true);
      expect(objectives.length).toBe(3);
      
      objectives.forEach(objective => {
        expect(objective.id).toBeDefined();
        expect(objective.description).toBeDefined();
        expect(objective.target).toBeGreaterThan(0);
        expect(objective.reward).toBeDefined();
      });
    });
  });

  describe('ML Calculations', () => {
    it('should calculate content complexity', () => {
      const content = {
        board: { specialTiles: [{ x: 1, y: 1, type: 'bomb' }] },
        objectives: [{ type: 'score', target: 1000 }]
      };

      const complexity = ai.calculateContentComplexity(content);
      expect(complexity).toBeGreaterThan(0);
      expect(complexity).toBeLessThanOrEqual(10);
    });

    it('should calculate player engagement preference', () => {
      const playerProfile = { segment: 'casual' };
      const preference = ai.getPlayerEngagementPreference(playerProfile);

      expect(preference).toBeGreaterThan(0);
      expect(preference).toBeLessThanOrEqual(10);
    });

    it('should calculate preference match', () => {
      const content = { difficulty: 5 };
      const playerProfile = { currentLevel: 5 };

      const match = ai.calculatePreferenceMatch(content, playerProfile);
      expect(match).toBeGreaterThanOrEqual(0);
      expect(match).toBeLessThanOrEqual(1);
    });
  });

  describe('Service Status', () => {
    it('should return service status', () => {
      const status = ai.getServiceStatus();

      expect(status).toBeDefined();
      expect(status.status).toBe('active');
      expect(status.services).toBeDefined();
      expect(status.services.ollama).toBeDefined();
      expect(status.services.huggingface).toBeDefined();
      expect(status.services.localML).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid content type in template generation', () => {
      expect(() => {
        ai.generateFromTemplate('invalid', {});
      }).toThrow('No template found for content type: invalid');
    });

    it('should handle missing player profile gracefully', () => {
      const level = ai.generateFromTemplate('level', {
        levelNumber: 1,
        difficulty: 5,
        playerProfile: null
      });

      expect(level).toBeDefined();
      expect(level.id).toBeDefined();
    });
  });

  describe('Configuration', () => {
    it('should use default configuration when no config provided', () => {
      const ai = new FreeAIContentGenerator();
      
      expect(ai.config.ollama.baseUrl).toBe('http://localhost:11434');
      expect(ai.config.ollama.model).toBe('llama3.1:8b');
      expect(ai.config.huggingface.apiUrl).toBe('https://api-inference.huggingface.co/models');
    });
  });
});