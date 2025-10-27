/**
 * Local Tutorial Engine - Handles tutorial and onboarding
 */

import { Logger } from '../core/logger/index.js';

class LocalTutorialEngine {
  constructor() {
    this.logger = new Logger('LocalTutorialEngine');
    this.tutorialSteps = [];
    this.currentStepIndex = 0;
    this.completed = false;
    this.skipped = false;
    this.hints = [];
  }

  async initialize() {
    this.logger.info('Initializing Tutorial Engine...');
    
    this.loadData();
    
    if (this.tutorialSteps.length === 0) {
      this.createDefaultTutorial();
    }
    
    this.logger.info(`Tutorial Engine initialized with ${this.tutorialSteps.length} steps`);
  }

  createDefaultTutorial() {
    this.tutorialSteps = [
      {
        id: 'welcome',
        title: 'Welcome to Infinite Match!',
        description: 'Welcome to the most exciting match-3 puzzle game!',
        content: 'In this game, you\'ll match colorful gems to score points and complete challenging levels.',
        type: 'intro',
        completed: false,
        required: true,
        order: 1,
        actions: ['click_continue'],
        rewards: { coins: 50 }
      },
      {
        id: 'basic_matching',
        title: 'Basic Matching',
        description: 'Learn how to match gems',
        content: 'Match 3 or more gems of the same color by clicking and dragging. Try to make a match now!',
        type: 'interactive',
        completed: false,
        required: true,
        order: 2,
        actions: ['make_match'],
        target: { type: 'match', count: 1 },
        rewards: { coins: 100 }
      },
      {
        id: 'scoring',
        title: 'Scoring Points',
        description: 'Understand how scoring works',
        content: 'Each match gives you points. Longer matches and special combinations give more points!',
        type: 'info',
        completed: false,
        required: true,
        order: 3,
        actions: ['click_continue'],
        rewards: { coins: 75 }
      },
      {
        id: 'powerups_intro',
        title: 'Power-ups Introduction',
        description: 'Learn about power-ups',
        content: 'Power-ups help you clear more gems. You\'ll find them in the bottom of the screen.',
        type: 'info',
        completed: false,
        required: true,
        order: 4,
        actions: ['click_continue'],
        rewards: { coins: 100 }
      },
      {
        id: 'bomb_powerup',
        title: 'Bomb Power-up',
        description: 'Learn to use the bomb',
        content: 'The bomb clears gems in a 3x3 area. Click on a gem to place the bomb!',
        type: 'interactive',
        completed: false,
        required: true,
        order: 5,
        actions: ['use_powerup'],
        target: { type: 'powerup', powerup: 'bomb' },
        rewards: { coins: 150, powerups: { bomb: 1 } }
      },
      {
        id: 'rainbow_powerup',
        title: 'Rainbow Power-up',
        description: 'Learn to use the rainbow',
        content: 'The rainbow clears an entire row. Drag it to the row you want to clear!',
        type: 'interactive',
        completed: false,
        required: true,
        order: 6,
        actions: ['use_powerup'],
        target: { type: 'powerup', powerup: 'rainbow' },
        rewards: { coins: 150, powerups: { rainbow: 1 } }
      },
      {
        id: 'objectives',
        title: 'Level Objectives',
        description: 'Understand level objectives',
        content: 'Each level has specific objectives. Complete them to earn stars and progress!',
        type: 'info',
        completed: false,
        required: true,
        order: 7,
        actions: ['click_continue'],
        rewards: { coins: 100 }
      },
      {
        id: 'energy_system',
        title: 'Energy System',
        description: 'Learn about energy',
        content: 'You need energy to play levels. Energy regenerates over time or you can buy more.',
        type: 'info',
        completed: false,
        required: true,
        order: 8,
        actions: ['click_continue'],
        rewards: { coins: 100 }
      },
      {
        id: 'shop_intro',
        title: 'Shop Introduction',
        description: 'Learn about the shop',
        content: 'Use coins to buy power-ups and energy in the shop. You can also buy gems with real money.',
        type: 'info',
        completed: false,
        required: true,
        order: 9,
        actions: ['click_continue'],
        rewards: { coins: 150 }
      },
      {
        id: 'tutorial_complete',
        title: 'Tutorial Complete!',
        description: 'You\'re ready to play!',
        content: 'Congratulations! You\'ve learned the basics. Now go and enjoy the game!',
        type: 'completion',
        completed: false,
        required: true,
        order: 10,
        actions: ['click_continue'],
        rewards: { coins: 500, gems: 10 }
      }
    ];

    this.saveData();
  }

  getStatus() {
    return {
      completed: this.completed,
      skipped: this.skipped,
      currentStep: this.currentStepIndex + 1,
      totalSteps: this.tutorialSteps.length,
      progress: Math.round((this.currentStepIndex / this.tutorialSteps.length) * 100)
    };
  }

  getCurrentStep() {
    if (this.completed || this.skipped) {
      return null;
    }
    
    return this.tutorialSteps[this.currentStepIndex] || null;
  }

  completeStep(stepId) {
    const step = this.tutorialSteps.find(s => s.id === stepId);
    if (!step || step.completed) {
      return { success: false, error: 'Step not found or already completed' };
    }

    step.completed = true;
    this.currentStepIndex++;

    // Check if tutorial is complete
    if (this.currentStepIndex >= this.tutorialSteps.length) {
      this.completed = true;
    }

    this.saveData();

    return {
      success: true,
      step: step,
      rewards: step.rewards,
      nextStep: this.getCurrentStep(),
      completed: this.completed
    };
  }

  skip() {
    this.skipped = true;
    this.completed = false;
    this.saveData();
    return { success: true, message: 'Tutorial skipped' };
  }

  reset() {
    this.tutorialSteps.forEach(step => {
      step.completed = false;
    });
    this.currentStepIndex = 0;
    this.completed = false;
    this.skipped = false;
    this.saveData();
    return { success: true, message: 'Tutorial reset' };
  }

  getHints() {
    const currentStep = this.getCurrentStep();
    if (!currentStep) {
      return [];
    }

    // Generate contextual hints based on current step
    const hints = [];
    
    switch (currentStep.id) {
      case 'basic_matching':
        hints.push('Look for groups of 3 or more gems of the same color');
        hints.push('You can match horizontally or vertically');
        break;
      case 'bomb_powerup':
        hints.push('Click on any gem to place the bomb');
        hints.push('The bomb will clear a 3x3 area around it');
        break;
      case 'rainbow_powerup':
        hints.push('Drag the rainbow to the row you want to clear');
        hints.push('The rainbow clears the entire row');
        break;
      default:
        hints.push('Follow the instructions on screen');
    }

    return hints;
  }

  getStepById(stepId) {
    return this.tutorialSteps.find(step => step.id === stepId);
  }

  getCompletedSteps() {
    return this.tutorialSteps.filter(step => step.completed);
  }

  getRemainingSteps() {
    return this.tutorialSteps.filter(step => !step.completed);
  }

  isStepRequired(stepId) {
    const step = this.getStepById(stepId);
    return step ? step.required : false;
  }

  getTutorialProgress() {
    const completed = this.getCompletedSteps().length;
    const total = this.tutorialSteps.length;
    
    return {
      completed,
      total,
      percentage: Math.round((completed / total) * 100),
      currentStep: this.currentStepIndex + 1,
      isComplete: this.completed,
      isSkipped: this.skipped
    };
  }

  addCustomStep(stepData) {
    const newStep = {
      id: `custom_${Date.now()}`,
      ...stepData,
      completed: false,
      order: this.tutorialSteps.length + 1
    };
    
    this.tutorialSteps.push(newStep);
    this.saveData();
    return newStep;
  }

  removeStep(stepId) {
    const index = this.tutorialSteps.findIndex(step => step.id === stepId);
    if (index !== -1) {
      this.tutorialSteps.splice(index, 1);
      this.saveData();
      return true;
    }
    return false;
  }

  reorderSteps(stepIds) {
    const reorderedSteps = [];
    
    stepIds.forEach(stepId => {
      const step = this.tutorialSteps.find(s => s.id === stepId);
      if (step) {
        reorderedSteps.push(step);
      }
    });
    
    this.tutorialSteps = reorderedSteps;
    this.saveData();
    return true;
  }

  loadData() {
    try {
      const data = JSON.parse(localStorage.getItem('game_tutorial') || '{}');
      this.tutorialSteps = data.tutorialSteps || [];
      this.currentStepIndex = data.currentStepIndex || 0;
      this.completed = data.completed || false;
      this.skipped = data.skipped || false;
    } catch (error) {
      console.error('Failed to load tutorial data:', error);
      this.tutorialSteps = [];
    }
  }

  saveData() {
    const data = {
      tutorialSteps: this.tutorialSteps,
      currentStepIndex: this.currentStepIndex,
      completed: this.completed,
      skipped: this.skipped,
      lastSaved: Date.now()
    };
    localStorage.setItem('game_tutorial', JSON.stringify(data));
  }

  export() {
    return {
      tutorialSteps: this.tutorialSteps,
      currentStepIndex: this.currentStepIndex,
      completed: this.completed,
      skipped: this.skipped
    };
  }

  import(data) {
    if (data.tutorialSteps) this.tutorialSteps = data.tutorialSteps;
    if (data.currentStepIndex !== undefined) this.currentStepIndex = data.currentStepIndex;
    if (data.completed !== undefined) this.completed = data.completed;
    if (data.skipped !== undefined) this.skipped = data.skipped;
    this.saveData();
  }
}

// Make it globally available
window.LocalTutorialEngine = LocalTutorialEngine;