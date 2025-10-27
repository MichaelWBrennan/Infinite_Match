/**
 * Local Level Manager - Handles level progression and management
 */

class LocalLevelManager {
  constructor() {
    this.levels = [];
    this.progress = {
      currentLevel: 1,
      totalLevels: 0,
      levelsCompleted: 0,
      totalStars: 0,
      totalScore: 0
    };
  }

  async initialize() {
    console.log('🎯 Initializing Level Manager...');
    
    // Load existing data
    this.loadData();
    
    // If no levels exist, create default levels
    if (this.levels.length === 0) {
      this.createDefaultLevels();
    }
    
    this.updateProgress();
    console.log(`✅ Level Manager initialized with ${this.levels.length} levels`);
  }

  createDefaultLevels() {
    const defaultLevels = [
      // Tutorial levels
      {
        id: 1,
        name: "Welcome to the Game",
        description: "Learn the basics of matching gems",
        unlocked: true,
        completed: false,
        stars: 0,
        bestScore: 0,
        targetScore: 1000,
        moves: 30,
        timeLimit: 0,
        difficulty: "tutorial",
        gems: ["red", "blue", "green", "yellow"],
        powerups: [],
        rewards: { coins: 100, xp: 50 },
        objectives: [
          { type: "score", target: 1000, description: "Score 1000 points" }
        ]
      },
      {
        id: 2,
        name: "First Match",
        description: "Make your first 3-match",
        unlocked: false,
        completed: false,
        stars: 0,
        bestScore: 0,
        targetScore: 1500,
        moves: 25,
        timeLimit: 0,
        difficulty: "easy",
        gems: ["red", "blue", "green", "yellow", "purple"],
        powerups: [],
        rewards: { coins: 150, xp: 75 },
        objectives: [
          { type: "score", target: 1500, description: "Score 1500 points" },
          { type: "moves", target: 25, description: "Complete in 25 moves" }
        ]
      },
      {
        id: 3,
        name: "Power Up Introduction",
        description: "Learn about power-ups",
        unlocked: false,
        completed: false,
        stars: 0,
        bestScore: 0,
        targetScore: 2000,
        moves: 20,
        timeLimit: 0,
        difficulty: "easy",
        gems: ["red", "blue", "green", "yellow", "purple", "orange"],
        powerups: ["bomb", "rainbow"],
        rewards: { coins: 200, xp: 100 },
        objectives: [
          { type: "score", target: 2000, description: "Score 2000 points" },
          { type: "powerups", target: 1, description: "Use 1 power-up" }
        ]
      },
      // Regular levels
      {
        id: 4,
        name: "Gem Collector",
        description: "Collect specific gems",
        unlocked: false,
        completed: false,
        stars: 0,
        bestScore: 0,
        targetScore: 2500,
        moves: 25,
        timeLimit: 0,
        difficulty: "medium",
        gems: ["red", "blue", "green", "yellow", "purple", "orange"],
        powerups: ["bomb", "rainbow", "lightning"],
        rewards: { coins: 250, xp: 125 },
        objectives: [
          { type: "score", target: 2500, description: "Score 2500 points" },
          { type: "collect", target: 20, gem: "red", description: "Collect 20 red gems" }
        ]
      },
      {
        id: 5,
        name: "Time Challenge",
        description: "Complete the level in time",
        unlocked: false,
        completed: false,
        stars: 0,
        bestScore: 0,
        targetScore: 3000,
        moves: 30,
        timeLimit: 120,
        difficulty: "medium",
        gems: ["red", "blue", "green", "yellow", "purple", "orange"],
        powerups: ["bomb", "rainbow", "lightning", "striped"],
        rewards: { coins: 300, xp: 150 },
        objectives: [
          { type: "score", target: 3000, description: "Score 3000 points" },
          { type: "time", target: 120, description: "Complete in 2 minutes" }
        ]
      }
    ];

    this.levels = defaultLevels;
    this.saveData();
  }

  getLevels() {
    return this.levels.map(level => ({
      id: level.id,
      name: level.name,
      description: level.description,
      unlocked: level.unlocked,
      completed: level.completed,
      stars: level.stars,
      bestScore: level.bestScore,
      targetScore: level.targetScore,
      moves: level.moves,
      timeLimit: level.timeLimit,
      difficulty: level.difficulty,
      gems: level.gems,
      powerups: level.powerups,
      rewards: level.rewards,
      objectives: level.objectives
    }));
  }

  getLevel(levelId) {
    return this.levels.find(level => level.id === levelId);
  }

  unlockLevel(levelId) {
    const level = this.levels.find(l => l.id === levelId);
    if (level && !level.unlocked) {
      level.unlocked = true;
      this.saveData();
      return true;
    }
    return false;
  }

  completeLevel(levelId, score, stars, movesUsed, timeSpent) {
    const level = this.levels.find(l => l.id === levelId);
    if (!level || !level.unlocked) {
      return { success: false, error: 'Level not available' };
    }

    // Update level data
    level.completed = true;
    level.bestScore = Math.max(level.bestScore, score);
    level.stars = Math.max(level.stars, stars);

    // Calculate stars based on performance
    const calculatedStars = this.calculateStars(level, score, movesUsed, timeSpent);
    level.stars = Math.max(level.stars, calculatedStars);

    // Unlock next level
    const nextLevel = this.levels.find(l => l.id === levelId + 1);
    if (nextLevel && !nextLevel.unlocked) {
      nextLevel.unlocked = true;
    }

    this.updateProgress();
    this.saveData();

    return {
      success: true,
      level: level,
      stars: level.stars,
      nextLevel: nextLevel ? nextLevel.id : null,
      rewards: level.rewards
    };
  }

  calculateStars(level, score, movesUsed, timeSpent) {
    let stars = 0;

    // Star 1: Complete the level
    if (score >= level.targetScore) {
      stars = 1;
    }

    // Star 2: Use fewer moves than target
    if (movesUsed <= level.moves * 0.8) {
      stars = 2;
    }

    // Star 3: Use even fewer moves or complete quickly
    if (movesUsed <= level.moves * 0.6 || (level.timeLimit > 0 && timeSpent <= level.timeLimit * 0.7)) {
      stars = 3;
    }

    return stars;
  }

  getProgress() {
    return {
      currentLevel: this.progress.currentLevel,
      totalLevels: this.progress.totalLevels,
      levelsCompleted: this.progress.levelsCompleted,
      totalStars: this.progress.totalStars,
      totalScore: this.progress.totalScore,
      completionPercentage: Math.round((this.progress.levelsCompleted / this.progress.totalLevels) * 100)
    };
  }

  updateProgress() {
    this.progress.totalLevels = this.levels.length;
    this.progress.levelsCompleted = this.levels.filter(l => l.completed).length;
    this.progress.totalStars = this.levels.reduce((sum, l) => sum + l.stars, 0);
    this.progress.totalScore = this.levels.reduce((sum, l) => sum + l.bestScore, 0);
    
    // Find current level (first unlocked but not completed)
    const currentLevel = this.levels.find(l => l.unlocked && !l.completed);
    this.progress.currentLevel = currentLevel ? currentLevel.id : this.levels.length;
  }

  getLevelMap() {
    return this.levels.map(level => ({
      id: level.id,
      name: level.name,
      unlocked: level.unlocked,
      completed: level.completed,
      stars: level.stars,
      difficulty: level.difficulty,
      position: this.getLevelPosition(level.id)
    }));
  }

  getLevelPosition(levelId) {
    // Simple grid layout - 5 levels per row
    const row = Math.floor((levelId - 1) / 5);
    const col = (levelId - 1) % 5;
    return { row, col };
  }

  resetLevel(levelId) {
    const level = this.levels.find(l => l.id === levelId);
    if (level) {
      level.completed = false;
      level.stars = 0;
      level.bestScore = 0;
      this.saveData();
      return true;
    }
    return false;
  }

  resetAllLevels() {
    this.levels.forEach(level => {
      level.completed = false;
      level.stars = 0;
      level.bestScore = 0;
      level.unlocked = level.id === 1; // Only unlock first level
    });
    this.updateProgress();
    this.saveData();
  }

  addCustomLevel(levelData) {
    const newLevel = {
      id: this.levels.length + 1,
      ...levelData,
      unlocked: false,
      completed: false,
      stars: 0,
      bestScore: 0
    };
    
    this.levels.push(newLevel);
    this.saveData();
    return newLevel;
  }

  loadData() {
    try {
      const data = JSON.parse(localStorage.getItem('game_levels') || '{}');
      this.levels = data.levels || [];
      this.progress = data.progress || this.progress;
    } catch (error) {
      console.error('Failed to load level data:', error);
      this.levels = [];
    }
  }

  saveData() {
    const data = {
      levels: this.levels,
      progress: this.progress,
      lastSaved: Date.now()
    };
    localStorage.setItem('game_levels', JSON.stringify(data));
  }

  export() {
    return {
      levels: this.levels,
      progress: this.progress
    };
  }

  import(data) {
    if (data.levels) this.levels = data.levels;
    if (data.progress) this.progress = data.progress;
    this.saveData();
  }
}

// Make it globally available
window.LocalLevelManager = LocalLevelManager;