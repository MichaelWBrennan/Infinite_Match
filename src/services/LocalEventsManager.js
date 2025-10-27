/**
 * Local Events Manager - Handles events and special content
 */

class LocalEventsManager {
  constructor() {
    this.events = [];
    this.specialOffers = [];
    this.participations = [];
    this.eventRewards = [];
  }

  async initialize() {
    console.log('🎉 Initializing Events Manager...');
    
    this.loadData();
    
    if (this.events.length === 0) {
      this.createDefaultEvents();
    }
    
    if (this.specialOffers.length === 0) {
      this.createDefaultOffers();
    }
    
    this.updateEventStatuses();
    console.log(`✅ Events Manager initialized with ${this.events.length} events`);
  }

  createDefaultEvents() {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;

    this.events = [
      {
        id: 'daily_challenge',
        name: 'Daily Challenge',
        description: 'Complete 3 levels to earn bonus rewards',
        type: 'daily',
        status: 'active',
        startTime: now,
        endTime: now + oneDay,
        requirements: {
          levels: 3,
          minScore: 1000
        },
        rewards: {
          coins: 500,
          gems: 10,
          powerups: { bomb: 2 }
        },
        participants: 0,
        maxParticipants: 1000,
        difficulty: 'easy'
      },
      {
        id: 'weekend_special',
        name: 'Weekend Special',
        description: 'Score 50,000 points this weekend',
        type: 'weekend',
        status: 'upcoming',
        startTime: now + (2 * oneDay),
        endTime: now + (4 * oneDay),
        requirements: {
          score: 50000,
          timeLimit: 2 * oneDay
        },
        rewards: {
          coins: 2000,
          gems: 50,
          powerups: { rainbow: 3, lightning: 2 }
        },
        participants: 0,
        maxParticipants: 500,
        difficulty: 'medium'
      },
      {
        id: 'powerup_master',
        name: 'Power-up Master',
        description: 'Use 20 power-ups in a single day',
        type: 'challenge',
        status: 'active',
        startTime: now,
        endTime: now + oneDay,
        requirements: {
          powerups: 20,
          timeLimit: oneDay
        },
        rewards: {
          coins: 1000,
          gems: 25,
          powerups: { bomb: 5, rainbow: 3, lightning: 2 }
        },
        participants: 0,
        maxParticipants: 200,
        difficulty: 'hard'
      },
      {
        id: 'level_marathon',
        name: 'Level Marathon',
        description: 'Complete 10 levels in a row',
        type: 'marathon',
        status: 'active',
        startTime: now,
        endTime: now + (3 * oneDay),
        requirements: {
          levels: 10,
          consecutive: true
        },
        rewards: {
          coins: 3000,
          gems: 75,
          powerups: { bomb: 10, rainbow: 5, lightning: 5 }
        },
        participants: 0,
        maxParticipants: 100,
        difficulty: 'expert'
      },
      {
        id: 'monthly_tournament',
        name: 'Monthly Tournament',
        description: 'Compete for the top spot this month',
        type: 'tournament',
        status: 'upcoming',
        startTime: now + (7 * oneDay),
        endTime: now + (30 * oneDay),
        requirements: {
          minLevel: 10,
          registration: true
        },
        rewards: {
          coins: 10000,
          gems: 200,
          powerups: { bomb: 20, rainbow: 10, lightning: 10 },
          special: 'tournament_badge'
        },
        participants: 0,
        maxParticipants: 50,
        difficulty: 'expert'
      }
    ];

    this.saveData();
  }

  createDefaultOffers() {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    this.specialOffers = [
      {
        id: 'starter_pack',
        name: 'Starter Pack',
        description: 'Perfect for new players',
        type: 'bundle',
        price: 4.99,
        currency: 'USD',
        originalPrice: 9.99,
        discount: 50,
        items: {
          coins: 1000,
          gems: 50,
          powerups: { bomb: 5, rainbow: 3, lightning: 2 }
        },
        status: 'active',
        startTime: now,
        endTime: now + (7 * oneDay),
        maxPurchases: 1,
        purchases: 0,
        requirements: {
          maxLevel: 5
        }
      },
      {
        id: 'energy_boost',
        name: 'Energy Boost',
        description: 'Get 50 energy instantly',
        type: 'energy',
        price: 1.99,
        currency: 'USD',
        originalPrice: 2.99,
        discount: 33,
        items: {
          energy: 50
        },
        status: 'active',
        startTime: now,
        endTime: now + (3 * oneDay),
        maxPurchases: 3,
        purchases: 0,
        requirements: {}
      },
      {
        id: 'gem_bonus',
        name: 'Gem Bonus',
        description: 'Double gems for 24 hours',
        type: 'boost',
        price: 2.99,
        currency: 'USD',
        originalPrice: 4.99,
        discount: 40,
        items: {
          boost: 'double_gems',
          duration: 24 * 60 * 60 * 1000 // 24 hours
        },
        status: 'active',
        startTime: now,
        endTime: now + (5 * oneDay),
        maxPurchases: 2,
        purchases: 0,
        requirements: {}
      },
      {
        id: 'premium_pack',
        name: 'Premium Pack',
        description: 'Best value for money',
        type: 'bundle',
        price: 9.99,
        currency: 'USD',
        originalPrice: 19.99,
        discount: 50,
        items: {
          coins: 5000,
          gems: 200,
          powerups: { bomb: 20, rainbow: 10, lightning: 10 },
          energy: 100
        },
        status: 'active',
        startTime: now,
        endTime: now + (14 * oneDay),
        maxPurchases: 1,
        purchases: 0,
        requirements: {
          minLevel: 10
        }
      }
    ];

    this.saveData();
  }

  // ==================== EVENTS MANAGEMENT ====================
  
  getActiveEvents() {
    return this.events.filter(event => event.status === 'active');
  }

  getUpcomingEvents() {
    return this.events.filter(event => event.status === 'upcoming');
  }

  getEvent(eventId) {
    return this.events.find(event => event.id === eventId);
  }

  participateInEvent(eventId) {
    const event = this.events.find(e => e.id === eventId);
    if (!event) {
      return { success: false, error: 'Event not found' };
    }

    if (event.status !== 'active') {
      return { success: false, error: 'Event is not active' };
    }

    if (event.participants >= event.maxParticipants) {
      return { success: false, error: 'Event is full' };
    }

    // Check if already participating
    const existingParticipation = this.participations.find(p => p.eventId === eventId && p.playerId === 'player');
    if (existingParticipation) {
      return { success: false, error: 'Already participating in this event' };
    }

    const participation = {
      id: `participation_${Date.now()}`,
      eventId: eventId,
      playerId: 'player',
      startTime: Date.now(),
      progress: {},
      completed: false,
      rewards: null
    };

    this.participations.push(participation);
    event.participants++;
    
    this.saveData();
    
    return { success: true, participation: participation };
  }

  updateEventProgress(eventId, progress) {
    const participation = this.participations.find(p => p.eventId === eventId && p.playerId === 'player');
    if (!participation) {
      return { success: false, error: 'Not participating in this event' };
    }

    participation.progress = { ...participation.progress, ...progress };
    
    // Check if event requirements are met
    const event = this.events.find(e => e.id === eventId);
    if (event && this.checkEventCompletion(event, participation.progress)) {
      participation.completed = true;
      participation.rewards = event.rewards;
    }

    this.saveData();
    
    return { success: true, participation: participation };
  }

  checkEventCompletion(event, progress) {
    const requirements = event.requirements;
    
    for (const [key, value] of Object.entries(requirements)) {
      if (key === 'levels' && (!progress.levelsCompleted || progress.levelsCompleted < value)) {
        return false;
      }
      if (key === 'score' && (!progress.totalScore || progress.totalScore < value)) {
        return false;
      }
      if (key === 'powerups' && (!progress.powerupsUsed || progress.powerupsUsed < value)) {
        return false;
      }
    }
    
    return true;
  }

  claimEventRewards(eventId) {
    const participation = this.participations.find(p => p.eventId === eventId && p.playerId === 'player');
    if (!participation) {
      return { success: false, error: 'Not participating in this event' };
    }

    if (!participation.completed) {
      return { success: false, error: 'Event not completed' };
    }

    if (participation.rewardsClaimed) {
      return { success: false, error: 'Rewards already claimed' };
    }

    participation.rewardsClaimed = true;
    this.saveData();
    
    return { success: true, rewards: participation.rewards };
  }

  getEventLeaderboard(eventId, limit = 10) {
    const event = this.events.find(e => e.id === eventId);
    if (!event) {
      return [];
    }

    // Generate mock leaderboard data
    const participants = this.participations
      .filter(p => p.eventId === eventId)
      .map(p => ({
        playerId: p.playerId,
        playerName: p.playerId === 'player' ? 'You' : `Player ${p.playerId}`,
        progress: p.progress,
        completed: p.completed,
        score: p.progress.totalScore || 0
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return participants.map((participant, index) => ({
      ...participant,
      rank: index + 1
    }));
  }

  // ==================== SPECIAL OFFERS ====================
  
  getSpecialOffers() {
    return this.specialOffers.filter(offer => offer.status === 'active');
  }

  getOffer(offerId) {
    return this.specialOffers.find(offer => offer.id === offerId);
  }

  claimSpecialOffer(offerId) {
    const offer = this.specialOffers.find(o => o.id === offerId);
    if (!offer) {
      return { success: false, error: 'Offer not found' };
    }

    if (offer.status !== 'active') {
      return { success: false, error: 'Offer is not active' };
    }

    if (offer.purchases >= offer.maxPurchases) {
      return { success: false, error: 'Offer limit reached' };
    }

    // Check requirements
    if (!this.checkOfferRequirements(offer)) {
      return { success: false, error: 'Requirements not met' };
    }

    offer.purchases++;
    this.saveData();
    
    return { success: true, offer: offer, items: offer.items };
  }

  checkOfferRequirements(offer) {
    const requirements = offer.requirements || {};
    
    // Check level requirements
    if (requirements.minLevel) {
      // This would check actual player level
      // For now, assume requirements are met
    }
    
    if (requirements.maxLevel) {
      // This would check actual player level
      // For now, assume requirements are met
    }
    
    return true;
  }

  // ==================== EVENT STATUS MANAGEMENT ====================
  
  updateEventStatuses() {
    const now = Date.now();
    
    this.events.forEach(event => {
      if (event.startTime <= now && event.endTime > now && event.status === 'upcoming') {
        event.status = 'active';
      } else if (event.endTime <= now && event.status === 'active') {
        event.status = 'completed';
      }
    });
    
    this.specialOffers.forEach(offer => {
      if (offer.startTime <= now && offer.endTime > now && offer.status === 'upcoming') {
        offer.status = 'active';
      } else if (offer.endTime <= now && offer.status === 'active') {
        offer.status = 'expired';
      }
    });
    
    this.saveData();
  }

  // ==================== EVENT CREATION ====================
  
  createCustomEvent(eventData) {
    const event = {
      id: `event_${Date.now()}`,
      ...eventData,
      participants: 0,
      status: 'upcoming'
    };
    
    this.events.push(event);
    this.saveData();
    
    return { success: true, event: event };
  }

  createCustomOffer(offerData) {
    const offer = {
      id: `offer_${Date.now()}`,
      ...offerData,
      purchases: 0,
      status: 'upcoming'
    };
    
    this.specialOffers.push(offer);
    this.saveData();
    
    return { success: true, offer: offer };
  }

  // ==================== STATISTICS ====================
  
  getEventStats() {
    const activeEvents = this.getActiveEvents().length;
    const upcomingEvents = this.getUpcomingEvents().length;
    const activeOffers = this.getSpecialOffers().length;
    const participations = this.participations.filter(p => p.playerId === 'player').length;
    const completedEvents = this.participations.filter(p => p.playerId === 'player' && p.completed).length;
    
    return {
      activeEvents,
      upcomingEvents,
      activeOffers,
      participations,
      completedEvents,
      completionRate: participations > 0 ? Math.round((completedEvents / participations) * 100) : 0
    };
  }

  // ==================== UTILITY METHODS ====================
  
  loadData() {
    try {
      const data = JSON.parse(localStorage.getItem('game_events') || '{}');
      this.events = data.events || [];
      this.specialOffers = data.specialOffers || [];
      this.participations = data.participations || [];
      this.eventRewards = data.eventRewards || [];
    } catch (error) {
      console.error('Failed to load events data:', error);
      this.events = [];
      this.specialOffers = [];
      this.participations = [];
      this.eventRewards = [];
    }
  }

  saveData() {
    const data = {
      events: this.events,
      specialOffers: this.specialOffers,
      participations: this.participations,
      eventRewards: this.eventRewards,
      lastSaved: Date.now()
    };
    localStorage.setItem('game_events', JSON.stringify(data));
  }

  export() {
    return {
      events: this.events,
      specialOffers: this.specialOffers,
      participations: this.participations,
      eventRewards: this.eventRewards
    };
  }

  import(data) {
    if (data.events) this.events = data.events;
    if (data.specialOffers) this.specialOffers = data.specialOffers;
    if (data.participations) this.participations = data.participations;
    if (data.eventRewards) this.eventRewards = data.eventRewards;
    this.saveData();
  }
}

// Make it globally available
window.LocalEventsManager = LocalEventsManager;