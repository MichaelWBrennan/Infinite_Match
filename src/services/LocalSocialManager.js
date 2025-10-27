/**
 * Local Social Manager - Handles social features locally
 */

class LocalSocialManager {
  constructor() {
    this.friends = [];
    this.gifts = [];
    this.guilds = [];
    this.chatMessages = [];
    this.leaderboards = {
      daily: [],
      weekly: [],
      monthly: [],
      allTime: []
    };
  }

  async initialize() {
    console.log('👥 Initializing Social Manager...');
    
    this.loadData();
    
    if (this.friends.length === 0) {
      this.createDefaultFriends();
    }
    
    if (this.guilds.length === 0) {
      this.createDefaultGuilds();
    }
    
    this.updateLeaderboards();
    console.log(`✅ Social Manager initialized with ${this.friends.length} friends`);
  }

  createDefaultFriends() {
    this.friends = [
      {
        id: 'friend_1',
        name: 'Alex Player',
        avatar: 'avatar_1',
        online: false,
        lastSeen: Date.now() - 3600000, // 1 hour ago
        level: 15,
        score: 125000,
        giftsSent: 0,
        giftsReceived: 0,
        isBlocked: false
      },
      {
        id: 'friend_2',
        name: 'Sarah Gamer',
        avatar: 'avatar_2',
        online: true,
        lastSeen: Date.now(),
        level: 22,
        score: 180000,
        giftsSent: 0,
        giftsReceived: 0,
        isBlocked: false
      },
      {
        id: 'friend_3',
        name: 'Mike Champion',
        avatar: 'avatar_3',
        online: false,
        lastSeen: Date.now() - 86400000, // 1 day ago
        level: 8,
        score: 75000,
        giftsSent: 0,
        giftsReceived: 0,
        isBlocked: false
      }
    ];
    
    this.saveData();
  }

  createDefaultGuilds() {
    this.guilds = [
      {
        id: 'guild_1',
        name: 'Elite Players',
        description: 'Top players only',
        level: 5,
        members: 25,
        maxMembers: 50,
        isPublic: true,
        requirements: { minLevel: 20, minScore: 100000 },
        created: Date.now() - 2592000000, // 30 days ago
        leader: 'friend_1'
      },
      {
        id: 'guild_2',
        name: 'Casual Gamers',
        description: 'For casual players',
        level: 3,
        members: 15,
        maxMembers: 30,
        isPublic: true,
        requirements: { minLevel: 5, minScore: 10000 },
        created: Date.now() - 1296000000, // 15 days ago
        leader: 'friend_2'
      }
    ];
    
    this.saveData();
  }

  // ==================== FRIENDS MANAGEMENT ====================
  
  getFriends() {
    return this.friends.filter(friend => !friend.isBlocked);
  }

  getFriend(friendId) {
    return this.friends.find(friend => friend.id === friendId);
  }

  addFriend(friendId, friendName, avatar = 'default') {
    // Check if friend already exists
    if (this.friends.find(f => f.id === friendId)) {
      return { success: false, error: 'Friend already exists' };
    }

    const newFriend = {
      id: friendId,
      name: friendName,
      avatar: avatar,
      online: false,
      lastSeen: Date.now(),
      level: 1,
      score: 0,
      giftsSent: 0,
      giftsReceived: 0,
      isBlocked: false
    };

    this.friends.push(newFriend);
    this.saveData();
    
    return { success: true, friend: newFriend };
  }

  removeFriend(friendId) {
    const index = this.friends.findIndex(friend => friend.id === friendId);
    if (index !== -1) {
      this.friends.splice(index, 1);
      this.saveData();
      return { success: true };
    }
    return { success: false, error: 'Friend not found' };
  }

  blockFriend(friendId) {
    const friend = this.friends.find(f => f.id === friendId);
    if (friend) {
      friend.isBlocked = true;
      this.saveData();
      return { success: true };
    }
    return { success: false, error: 'Friend not found' };
  }

  unblockFriend(friendId) {
    const friend = this.friends.find(f => f.id === friendId);
    if (friend) {
      friend.isBlocked = false;
      this.saveData();
      return { success: true };
    }
    return { success: false, error: 'Friend not found' };
  }

  updateFriendStatus(friendId, online, level, score) {
    const friend = this.friends.find(f => f.id === friendId);
    if (friend) {
      friend.online = online;
      friend.lastSeen = Date.now();
      if (level) friend.level = level;
      if (score) friend.score = score;
      this.saveData();
      return { success: true };
    }
    return { success: false, error: 'Friend not found' };
  }

  // ==================== GIFTS SYSTEM ====================
  
  getGifts() {
    return this.gifts.filter(gift => gift.to === 'player' && !gift.claimed);
  }

  sendGift(friendId, giftType, message = '') {
    const friend = this.friends.find(f => f.id === friendId);
    if (!friend) {
      return { success: false, error: 'Friend not found' };
    }

    const gift = {
      id: `gift_${Date.now()}`,
      from: 'player',
      to: friendId,
      type: giftType,
      message: message,
      timestamp: Date.now(),
      claimed: false,
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
    };

    this.gifts.push(gift);
    
    // Update friend's gift count
    friend.giftsReceived++;
    
    this.saveData();
    return { success: true, gift: gift };
  }

  claimGift(giftId) {
    const gift = this.gifts.find(g => g.id === giftId);
    if (!gift) {
      return { success: false, error: 'Gift not found' };
    }

    if (gift.claimed) {
      return { success: false, error: 'Gift already claimed' };
    }

    if (gift.expiresAt < Date.now()) {
      return { success: false, error: 'Gift has expired' };
    }

    gift.claimed = true;
    this.saveData();
    
    return { 
      success: true, 
      gift: gift,
      rewards: this.getGiftRewards(gift.type)
    };
  }

  getGiftRewards(giftType) {
    const rewards = {
      coins: { coins: 100 },
      gems: { gems: 5 },
      energy: { energy: 10 },
      powerup_bomb: { powerups: { bomb: 1 } },
      powerup_rainbow: { powerups: { rainbow: 1 } },
      powerup_lightning: { powerups: { lightning: 1 } }
    };
    
    return rewards[giftType] || { coins: 50 };
  }

  getGiftHistory() {
    return this.gifts.filter(gift => gift.from === 'player' || gift.claimed);
  }

  // ==================== GUILDS SYSTEM ====================
  
  getGuilds() {
    return this.guilds.filter(guild => guild.isPublic);
  }

  getGuild(guildId) {
    return this.guilds.find(guild => guild.id === guildId);
  }

  createGuild(name, description, isPublic = true, requirements = {}) {
    const guild = {
      id: `guild_${Date.now()}`,
      name: name,
      description: description,
      level: 1,
      members: 1,
      maxMembers: 30,
      isPublic: isPublic,
      requirements: requirements,
      created: Date.now(),
      leader: 'player'
    };

    this.guilds.push(guild);
    this.saveData();
    
    return { success: true, guild: guild };
  }

  joinGuild(guildId) {
    const guild = this.guilds.find(g => g.id === guildId);
    if (!guild) {
      return { success: false, error: 'Guild not found' };
    }

    if (guild.members >= guild.maxMembers) {
      return { success: false, error: 'Guild is full' };
    }

    guild.members++;
    this.saveData();
    
    return { success: true, guild: guild };
  }

  leaveGuild(guildId) {
    const guild = this.guilds.find(g => g.id === guildId);
    if (!guild) {
      return { success: false, error: 'Guild not found' };
    }

    if (guild.members > 0) {
      guild.members--;
    }
    
    this.saveData();
    return { success: true };
  }

  getGuildMembers(guildId) {
    const guild = this.guilds.find(g => g.id === guildId);
    if (!guild) {
      return [];
    }

    // Return mock members for demo
    return Array.from({ length: guild.members }, (_, i) => ({
      id: `member_${i}`,
      name: `Member ${i + 1}`,
      level: Math.floor(Math.random() * 20) + 1,
      score: Math.floor(Math.random() * 100000) + 10000,
      joinedAt: Date.now() - (i * 86400000) // Staggered join dates
    }));
  }

  // ==================== CHAT SYSTEM ====================
  
  sendGuildMessage(guildId, message) {
    const chatMessage = {
      id: `msg_${Date.now()}`,
      guildId: guildId,
      senderId: 'player',
      senderName: 'You',
      message: message,
      timestamp: Date.now()
    };

    this.chatMessages.push(chatMessage);
    this.saveData();
    
    return { success: true, message: chatMessage };
  }

  getGuildChat(guildId, limit = 50) {
    return this.chatMessages
      .filter(msg => msg.guildId === guildId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  // ==================== LEADERBOARDS ====================
  
  updateLeaderboards() {
    // Create mock leaderboard data
    this.leaderboards.daily = this.generateLeaderboard('daily');
    this.leaderboards.weekly = this.generateLeaderboard('weekly');
    this.leaderboards.monthly = this.generateLeaderboard('monthly');
    this.leaderboards.allTime = this.generateLeaderboard('allTime');
    
    this.saveData();
  }

  generateLeaderboard(type) {
    const players = [
      { id: 'player', name: 'You', score: 150000, level: 25, avatar: 'player_avatar' },
      { id: 'friend_1', name: 'Alex Player', score: 125000, level: 15, avatar: 'avatar_1' },
      { id: 'friend_2', name: 'Sarah Gamer', score: 180000, level: 22, avatar: 'avatar_2' },
      { id: 'friend_3', name: 'Mike Champion', score: 75000, level: 8, avatar: 'avatar_3' }
    ];

    // Add some random players
    for (let i = 0; i < 20; i++) {
      players.push({
        id: `player_${i}`,
        name: `Player ${i + 1}`,
        score: Math.floor(Math.random() * 200000) + 10000,
        level: Math.floor(Math.random() * 30) + 1,
        avatar: `avatar_${i % 10}`
      });
    }

    return players
      .sort((a, b) => b.score - a.score)
      .slice(0, 100)
      .map((player, index) => ({
        ...player,
        rank: index + 1
      }));
  }

  getLeaderboard(type = 'allTime', limit = 10) {
    return this.leaderboards[type]?.slice(0, limit) || [];
  }

  getPlayerRank(playerId = 'player') {
    const allTime = this.leaderboards.allTime;
    const player = allTime.find(p => p.id === playerId);
    return player ? player.rank : null;
  }

  // ==================== SOCIAL STATS ====================
  
  getSocialStats() {
    return {
      friendsCount: this.friends.filter(f => !f.isBlocked).length,
      giftsSent: this.gifts.filter(g => g.from === 'player').length,
      giftsReceived: this.gifts.filter(g => g.to === 'player' && g.claimed).length,
      guildsJoined: this.guilds.filter(g => g.members > 0).length,
      messagesSent: this.chatMessages.filter(m => m.senderId === 'player').length,
      playerRank: this.getPlayerRank()
    };
  }

  // ==================== UTILITY METHODS ====================
  
  loadData() {
    try {
      const data = JSON.parse(localStorage.getItem('game_social') || '{}');
      this.friends = data.friends || [];
      this.gifts = data.gifts || [];
      this.guilds = data.guilds || [];
      this.chatMessages = data.chatMessages || [];
      this.leaderboards = data.leaderboards || {
        daily: [],
        weekly: [],
        monthly: [],
        allTime: []
      };
    } catch (error) {
      console.error('Failed to load social data:', error);
      this.friends = [];
      this.gifts = [];
      this.guilds = [];
      this.chatMessages = [];
      this.leaderboards = {
        daily: [],
        weekly: [],
        monthly: [],
        allTime: []
      };
    }
  }

  saveData() {
    const data = {
      friends: this.friends,
      gifts: this.gifts,
      guilds: this.guilds,
      chatMessages: this.chatMessages,
      leaderboards: this.leaderboards,
      lastSaved: Date.now()
    };
    localStorage.setItem('game_social', JSON.stringify(data));
  }

  export() {
    return {
      friends: this.friends,
      gifts: this.gifts,
      guilds: this.guilds,
      chatMessages: this.chatMessages,
      leaderboards: this.leaderboards
    };
  }

  import(data) {
    if (data.friends) this.friends = data.friends;
    if (data.gifts) this.gifts = data.gifts;
    if (data.guilds) this.guilds = data.guilds;
    if (data.chatMessages) this.chatMessages = data.chatMessages;
    if (data.leaderboards) this.leaderboards = data.leaderboards;
    this.saveData();
  }
}

// Make it globally available
window.LocalSocialManager = LocalSocialManager;