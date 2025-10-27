/**
 * Local Real-Time Events System - Simulates real-time events without external APIs
 */

import { Logger } from '../core/logger/index.js';

class LocalRealTimeEvents {
  constructor() {
    this.logger = new Logger('LocalRealTimeEvents');
    this.events = [];
    this.activeEvents = [];
    this.eventQueue = [];
    this.lastUpdate = Date.now();
    this.updateInterval = 1000; // 1 second
    this.isRunning = false;
  }

  async initialize() {
    this.logger.info('Initializing Local Real-Time Events System...');
    
    this.loadData();
    this.createDefaultEvents();
    this.startEventEngine();
    
    this.logger.info('Local Real-Time Events System initialized');
  }

  createDefaultEvents() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;

    this.events = [
      {
        id: 'hourly_coin_bonus',
        name: 'Hourly Coin Bonus',
        description: 'Earn bonus coins every hour!',
        type: 'recurring',
        interval: oneHour,
        lastTriggered: now - oneHour,
        nextTrigger: now,
        active: true,
        rewards: { coins: 100 },
        duration: 5 * 60 * 1000, // 5 minutes
        maxParticipants: 1000
      },
      {
        id: 'daily_energy_boost',
        name: 'Daily Energy Boost',
        description: 'Free energy boost every day!',
        type: 'daily',
        triggerTime: '12:00', // 12 PM
        lastTriggered: null,
        nextTrigger: this.getNextDailyTrigger('12:00'),
        active: true,
        rewards: { energy: 10 },
        duration: 2 * 60 * 60 * 1000, // 2 hours
        maxParticipants: 500
      },
      {
        id: 'weekend_special',
        name: 'Weekend Special',
        description: 'Special weekend event!',
        type: 'weekly',
        triggerDay: 6, // Saturday
        triggerTime: '18:00', // 6 PM
        lastTriggered: null,
        nextTrigger: this.getNextWeeklyTrigger(6, '18:00'),
        active: true,
        rewards: { coins: 500, gems: 25 },
        duration: 48 * 60 * 60 * 1000, // 48 hours
        maxParticipants: 200
      },
      {
        id: 'midnight_magic',
        name: 'Midnight Magic',
        description: 'Magical event at midnight!',
        type: 'daily',
        triggerTime: '00:00', // Midnight
        lastTriggered: null,
        nextTrigger: this.getNextDailyTrigger('00:00'),
        active: true,
        rewards: { gems: 10, powerups: { bomb: 2 } },
        duration: 1 * 60 * 60 * 1000, // 1 hour
        maxParticipants: 100
      },
      {
        id: 'random_surprise',
        name: 'Random Surprise',
        description: 'Random surprise event!',
        type: 'random',
        probability: 0.1, // 10% chance per hour
        lastTriggered: null,
        nextTrigger: now + (Math.random() * 2 * oneHour), // Random within 2 hours
        active: true,
        rewards: { coins: 200, gems: 5 },
        duration: 30 * 60 * 1000, // 30 minutes
        maxParticipants: 50
      }
    ];

    this.saveData();
  }

  getNextDailyTrigger(time) {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    const trigger = new Date(now);
    trigger.setHours(hours, minutes, 0, 0);
    
    if (trigger <= now) {
      trigger.setDate(trigger.getDate() + 1);
    }
    
    return trigger.getTime();
  }

  getNextWeeklyTrigger(dayOfWeek, time) {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    const trigger = new Date(now);
    trigger.setHours(hours, minutes, 0, 0);
    
    // Find next occurrence of the day
    const daysUntilTarget = (dayOfWeek - now.getDay() + 7) % 7;
    trigger.setDate(trigger.getDate() + daysUntilTarget);
    
    if (trigger <= now) {
      trigger.setDate(trigger.getDate() + 7);
    }
    
    return trigger.getTime();
  }

  // ==================== EVENT ENGINE ====================
  
  startEventEngine() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.eventLoop();
  }

  stopEventEngine() {
    this.isRunning = false;
  }

  eventLoop() {
    if (!this.isRunning) return;
    
    const now = Date.now();
    this.processEvents(now);
    this.updateActiveEvents(now);
    
    setTimeout(() => this.eventLoop(), this.updateInterval);
  }

  processEvents(now) {
    this.events.forEach(event => {
      if (!event.active) return;
      
      switch (event.type) {
        case 'recurring':
          this.processRecurringEvent(event, now);
          break;
        case 'daily':
          this.processDailyEvent(event, now);
          break;
        case 'weekly':
          this.processWeeklyEvent(event, now);
          break;
        case 'random':
          this.processRandomEvent(event, now);
          break;
      }
    });
  }

  processRecurringEvent(event, now) {
    if (now >= event.nextTrigger) {
      this.triggerEvent(event);
      event.lastTriggered = now;
      event.nextTrigger = now + event.interval;
      this.saveData();
    }
  }

  processDailyEvent(event, now) {
    if (now >= event.nextTrigger) {
      this.triggerEvent(event);
      event.lastTriggered = now;
      event.nextTrigger = this.getNextDailyTrigger(event.triggerTime);
      this.saveData();
    }
  }

  processWeeklyEvent(event, now) {
    if (now >= event.nextTrigger) {
      this.triggerEvent(event);
      event.lastTriggered = now;
      event.nextTrigger = this.getNextWeeklyTrigger(event.triggerDay, event.triggerTime);
      this.saveData();
    }
  }

  processRandomEvent(event, now) {
    if (now >= event.nextTrigger) {
      if (Math.random() < event.probability) {
        this.triggerEvent(event);
        event.lastTriggered = now;
      }
      event.nextTrigger = now + (Math.random() * 2 * 60 * 60 * 1000); // Random within 2 hours
      this.saveData();
    }
  }

  triggerEvent(event) {
    const activeEvent = {
      id: event.id,
      name: event.name,
      description: event.description,
      rewards: event.rewards,
      startTime: Date.now(),
      endTime: Date.now() + event.duration,
      maxParticipants: event.maxParticipants,
      participants: [],
      status: 'active'
    };
    
    this.activeEvents.push(activeEvent);
    this.emitEventTriggered(activeEvent);
    
    // Auto-remove after duration
    setTimeout(() => {
      this.removeActiveEvent(event.id);
    }, event.duration);
  }

  removeActiveEvent(eventId) {
    const index = this.activeEvents.findIndex(e => e.id === eventId);
    if (index !== -1) {
      const event = this.activeEvents[index];
      event.status = 'completed';
      this.emitEventCompleted(event);
      this.activeEvents.splice(index, 1);
    }
  }

  // ==================== EVENT PARTICIPATION ====================
  
  participateInEvent(eventId, playerId = 'player') {
    const event = this.activeEvents.find(e => e.id === eventId);
    if (!event) {
      return { success: false, error: 'Event not found or not active' };
    }
    
    if (event.participants.length >= event.maxParticipants) {
      return { success: false, error: 'Event is full' };
    }
    
    if (event.participants.includes(playerId)) {
      return { success: false, error: 'Already participating' };
    }
    
    event.participants.push(playerId);
    this.emitEventParticipation(event, playerId);
    
    return { success: true, event: event };
  }

  leaveEvent(eventId, playerId = 'player') {
    const event = this.activeEvents.find(e => e.id === eventId);
    if (!event) {
      return { success: false, error: 'Event not found' };
    }
    
    const index = event.participants.indexOf(playerId);
    if (index === -1) {
      return { success: false, error: 'Not participating in this event' };
    }
    
    event.participants.splice(index, 1);
    this.emitEventLeave(event, playerId);
    
    return { success: true };
  }

  // ==================== EVENT DATA ACCESS ====================
  
  getActiveEvents() {
    return this.activeEvents.filter(e => e.status === 'active');
  }

  getEvent(eventId) {
    return this.activeEvents.find(e => e.id === eventId);
  }

  getUpcomingEvents() {
    const now = Date.now();
    return this.events
      .filter(e => e.active && e.nextTrigger > now)
      .sort((a, b) => a.nextTrigger - b.nextTrigger);
  }

  getEventHistory() {
    return this.events.map(event => ({
      id: event.id,
      name: event.name,
      lastTriggered: event.lastTriggered,
      nextTrigger: event.nextTrigger,
      type: event.type
    }));
  }

  // ==================== EVENT MANAGEMENT ====================
  
  createEvent(eventData) {
    const event = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...eventData,
      lastTriggered: null,
      active: true
    };
    
    // Set next trigger based on type
    switch (event.type) {
      case 'daily':
        event.nextTrigger = this.getNextDailyTrigger(event.triggerTime);
        break;
      case 'weekly':
        event.nextTrigger = this.getNextWeeklyTrigger(event.triggerDay, event.triggerTime);
        break;
      case 'random':
        event.nextTrigger = Date.now() + (Math.random() * 2 * 60 * 60 * 1000);
        break;
    }
    
    this.events.push(event);
    this.saveData();
    
    return { success: true, event: event };
  }

  updateEvent(eventId, updates) {
    const event = this.events.find(e => e.id === eventId);
    if (!event) {
      return { success: false, error: 'Event not found' };
    }
    
    Object.assign(event, updates);
    this.saveData();
    
    return { success: true, event: event };
  }

  deleteEvent(eventId) {
    const index = this.events.findIndex(e => e.id === eventId);
    if (index === -1) {
      return { success: false, error: 'Event not found' };
    }
    
    this.events.splice(index, 1);
    this.saveData();
    
    return { success: true };
  }

  // ==================== EVENT NOTIFICATIONS ====================
  
  emitEventTriggered(event) {
    if (typeof window !== 'undefined' && window.gameAPI) {
      window.gameAPI.emit('realtime_event_triggered', event);
    }
  }

  emitEventCompleted(event) {
    if (typeof window !== 'undefined' && window.gameAPI) {
      window.gameAPI.emit('realtime_event_completed', event);
    }
  }

  emitEventParticipation(event, playerId) {
    if (typeof window !== 'undefined' && window.gameAPI) {
      window.gameAPI.emit('realtime_event_participation', { event, playerId });
    }
  }

  emitEventLeave(event, playerId) {
    if (typeof window !== 'undefined' && window.gameAPI) {
      window.gameAPI.emit('realtime_event_leave', { event, playerId });
    }
  }

  // ==================== EVENT STATISTICS ====================
  
  getEventStats() {
    const now = Date.now();
    const activeCount = this.activeEvents.length;
    const upcomingCount = this.events.filter(e => e.active && e.nextTrigger > now).length;
    const totalParticipants = this.activeEvents.reduce((sum, e) => sum + e.participants.length, 0);
    
    return {
      activeEvents: activeCount,
      upcomingEvents: upcomingCount,
      totalParticipants: totalParticipants,
      isRunning: this.isRunning,
      lastUpdate: this.lastUpdate
    };
  }

  // ==================== UTILITY METHODS ====================
  
  updateActiveEvents(now) {
    this.lastUpdate = now;
  }

  loadData() {
    try {
      const data = JSON.parse(localStorage.getItem('game_realtime_events') || '{}');
      this.events = data.events || [];
      this.activeEvents = data.activeEvents || [];
      this.lastUpdate = data.lastUpdate || Date.now();
    } catch (error) {
      console.error('Failed to load real-time events data:', error);
      this.events = [];
      this.activeEvents = [];
    }
  }

  saveData() {
    const data = {
      events: this.events,
      activeEvents: this.activeEvents,
      lastUpdate: this.lastUpdate
    };
    localStorage.setItem('game_realtime_events', JSON.stringify(data));
  }

  export() {
    return {
      events: this.events,
      activeEvents: this.activeEvents,
      lastUpdate: this.lastUpdate
    };
  }

  import(data) {
    if (data.events) this.events = data.events;
    if (data.activeEvents) this.activeEvents = data.activeEvents;
    if (data.lastUpdate) this.lastUpdate = data.lastUpdate;
    this.saveData();
  }
}

// Make it globally available
window.LocalRealTimeEvents = LocalRealTimeEvents;