/**
 * Local Inventory Manager - Handles inventory and item management
 */

class LocalInventoryManager {
  constructor() {
    this.inventory = [];
    this.availableItems = [];
    this.equippedItems = {};
    this.itemCategories = {
      powerups: 'Power-ups',
      boosters: 'Boosters',
      decorations: 'Decorations',
      consumables: 'Consumables',
      special: 'Special Items'
    };
  }

  async initialize() {
    console.log('🎒 Initializing Inventory Manager...');
    
    this.loadData();
    
    if (this.availableItems.length === 0) {
      this.createDefaultItems();
    }
    
    if (this.inventory.length === 0) {
      this.createDefaultInventory();
    }
    
    console.log(`✅ Inventory Manager initialized with ${this.inventory.length} items`);
  }

  createDefaultItems() {
    this.availableItems = [
      // Power-ups
      {
        id: 'bomb',
        name: 'Bomb',
        description: 'Clears gems in a 3x3 area',
        category: 'powerups',
        type: 'powerup',
        rarity: 'common',
        icon: 'bomb_icon',
        maxStack: 99,
        usable: true,
        consumable: true,
        price: { coins: 100 },
        effects: {
          type: 'area_clear',
          radius: 1,
          damage: 100
        }
      },
      {
        id: 'rainbow',
        name: 'Rainbow',
        description: 'Clears an entire row',
        category: 'powerups',
        type: 'powerup',
        rarity: 'uncommon',
        icon: 'rainbow_icon',
        maxStack: 50,
        usable: true,
        consumable: true,
        price: { coins: 200 },
        effects: {
          type: 'row_clear',
          direction: 'horizontal'
        }
      },
      {
        id: 'lightning',
        name: 'Lightning',
        description: 'Clears an entire column',
        category: 'powerups',
        type: 'powerup',
        rarity: 'uncommon',
        icon: 'lightning_icon',
        maxStack: 50,
        usable: true,
        consumable: true,
        price: { coins: 200 },
        effects: {
          type: 'column_clear',
          direction: 'vertical'
        }
      },
      {
        id: 'striped',
        name: 'Striped Candy',
        description: 'Creates a striped candy that clears a row or column',
        category: 'powerups',
        type: 'powerup',
        rarity: 'rare',
        icon: 'striped_icon',
        maxStack: 25,
        usable: true,
        consumable: true,
        price: { coins: 300 },
        effects: {
          type: 'striped_candy',
          direction: 'both'
        }
      },
      {
        id: 'color_bomb',
        name: 'Color Bomb',
        description: 'Clears all gems of the same color',
        category: 'powerups',
        type: 'powerup',
        rarity: 'epic',
        icon: 'color_bomb_icon',
        maxStack: 10,
        usable: true,
        consumable: true,
        price: { gems: 5 },
        effects: {
          type: 'color_clear',
          target: 'same_color'
        }
      },
      
      // Boosters
      {
        id: 'extra_moves',
        name: 'Extra Moves',
        description: 'Adds 5 extra moves to the level',
        category: 'boosters',
        type: 'booster',
        rarity: 'common',
        icon: 'extra_moves_icon',
        maxStack: 99,
        usable: true,
        consumable: true,
        price: { coins: 150 },
        effects: {
          type: 'extra_moves',
          amount: 5
        }
      },
      {
        id: 'extra_time',
        name: 'Extra Time',
        description: 'Adds 30 seconds to the level timer',
        category: 'boosters',
        type: 'booster',
        rarity: 'common',
        icon: 'extra_time_icon',
        maxStack: 99,
        usable: true,
        consumable: true,
        price: { coins: 150 },
        effects: {
          type: 'extra_time',
          amount: 30000 // 30 seconds in milliseconds
        }
      },
      {
        id: 'score_multiplier',
        name: 'Score Multiplier',
        description: 'Doubles score for the next level',
        category: 'boosters',
        type: 'booster',
        rarity: 'uncommon',
        icon: 'score_multiplier_icon',
        maxStack: 50,
        usable: true,
        consumable: true,
        price: { coins: 250 },
        effects: {
          type: 'score_multiplier',
          multiplier: 2,
          duration: 1 // 1 level
        }
      },
      
      // Decorations
      {
        id: 'castle_theme',
        name: 'Castle Theme',
        description: 'Beautiful castle background theme',
        category: 'decorations',
        type: 'decoration',
        rarity: 'rare',
        icon: 'castle_theme_icon',
        maxStack: 1,
        usable: false,
        consumable: false,
        price: { gems: 20 },
        effects: {
          type: 'theme',
          theme: 'castle'
        }
      },
      {
        id: 'garden_theme',
        name: 'Garden Theme',
        description: 'Peaceful garden background theme',
        category: 'decorations',
        type: 'decoration',
        rarity: 'rare',
        icon: 'garden_theme_icon',
        maxStack: 1,
        usable: false,
        consumable: false,
        price: { gems: 20 },
        effects: {
          type: 'theme',
          theme: 'garden'
        }
      },
      {
        id: 'space_theme',
        name: 'Space Theme',
        description: 'Cosmic space background theme',
        category: 'decorations',
        type: 'decoration',
        rarity: 'epic',
        icon: 'space_theme_icon',
        maxStack: 1,
        usable: false,
        consumable: false,
        price: { gems: 50 },
        effects: {
          type: 'theme',
          theme: 'space'
        }
      },
      
      // Consumables
      {
        id: 'energy_potion',
        name: 'Energy Potion',
        description: 'Restores 10 energy instantly',
        category: 'consumables',
        type: 'consumable',
        rarity: 'common',
        icon: 'energy_potion_icon',
        maxStack: 99,
        usable: true,
        consumable: true,
        price: { coins: 50 },
        effects: {
          type: 'energy_restore',
          amount: 10
        }
      },
      {
        id: 'lucky_coin',
        name: 'Lucky Coin',
        description: 'Increases coin rewards by 50% for next level',
        category: 'consumables',
        type: 'consumable',
        rarity: 'uncommon',
        icon: 'lucky_coin_icon',
        maxStack: 50,
        usable: true,
        consumable: true,
        price: { coins: 100 },
        effects: {
          type: 'coin_multiplier',
          multiplier: 1.5,
          duration: 1
        }
      },
      
      // Special Items
      {
        id: 'golden_gem',
        name: 'Golden Gem',
        description: 'Special gem that gives bonus points',
        category: 'special',
        type: 'special',
        rarity: 'legendary',
        icon: 'golden_gem_icon',
        maxStack: 5,
        usable: true,
        consumable: true,
        price: { gems: 10 },
        effects: {
          type: 'bonus_points',
          multiplier: 3
        }
      },
      {
        id: 'mystery_box',
        name: 'Mystery Box',
        description: 'Contains random rewards',
        category: 'special',
        type: 'special',
        rarity: 'epic',
        icon: 'mystery_box_icon',
        maxStack: 10,
        usable: true,
        consumable: true,
        price: { gems: 5 },
        effects: {
          type: 'random_rewards',
          possibleRewards: ['coins', 'gems', 'powerups']
        }
      }
    ];

    this.saveData();
  }

  createDefaultInventory() {
    // Give player some starting items
    this.addItem('bomb', 5);
    this.addItem('rainbow', 3);
    this.addItem('lightning', 3);
    this.addItem('extra_moves', 2);
    this.addItem('energy_potion', 3);
    this.addItem('castle_theme', 1);
    
    this.saveData();
  }

  // ==================== INVENTORY MANAGEMENT ====================
  
  getInventory() {
    return this.inventory.map(item => ({
      ...item,
      itemDetails: this.getItemDetails(item.itemId)
    }));
  }

  getItem(itemId) {
    return this.inventory.find(item => item.itemId === itemId);
  }

  addItem(itemId, quantity = 1, source = 'purchase') {
    const itemDetails = this.getItemDetails(itemId);
    if (!itemDetails) {
      return { success: false, error: 'Item not found' };
    }

    let inventoryItem = this.inventory.find(item => item.itemId === itemId);
    
    if (inventoryItem) {
      // Check if we can add more to the stack
      if (inventoryItem.quantity + quantity > itemDetails.maxStack) {
        return { success: false, error: 'Cannot add more items, stack limit reached' };
      }
      
      inventoryItem.quantity += quantity;
    } else {
      // Create new inventory item
      inventoryItem = {
        id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        itemId: itemId,
        quantity: quantity,
        acquiredAt: Date.now(),
        source: source,
        used: 0
      };
      
      this.inventory.push(inventoryItem);
    }

    this.saveData();
    return { success: true, item: inventoryItem };
  }

  removeItem(itemId, quantity = 1) {
    const inventoryItem = this.inventory.find(item => item.itemId === itemId);
    if (!inventoryItem) {
      return { success: false, error: 'Item not found in inventory' };
    }

    if (inventoryItem.quantity < quantity) {
      return { success: false, error: 'Not enough items' };
    }

    inventoryItem.quantity -= quantity;
    
    if (inventoryItem.quantity <= 0) {
      // Remove item from inventory
      const index = this.inventory.indexOf(inventoryItem);
      this.inventory.splice(index, 1);
    }

    this.saveData();
    return { success: true, item: inventoryItem };
  }

  useItem(itemId, quantity = 1) {
    const inventoryItem = this.inventory.find(item => item.itemId === itemId);
    if (!inventoryItem) {
      return { success: false, error: 'Item not found in inventory' };
    }

    const itemDetails = this.getItemDetails(itemId);
    if (!itemDetails.usable) {
      return { success: false, error: 'Item is not usable' };
    }

    if (inventoryItem.quantity < quantity) {
      return { success: false, error: 'Not enough items' };
    }

    // Apply item effects
    const effects = this.applyItemEffects(itemDetails, quantity);
    
    // Update inventory
    if (itemDetails.consumable) {
      inventoryItem.quantity -= quantity;
      inventoryItem.used += quantity;
      
      if (inventoryItem.quantity <= 0) {
        const index = this.inventory.indexOf(inventoryItem);
        this.inventory.splice(index, 1);
      }
    }

    this.saveData();
    
    return { 
      success: true, 
      item: inventoryItem, 
      effects: effects,
      remaining: inventoryItem.quantity
    };
  }

  applyItemEffects(itemDetails, quantity) {
    const effects = [];
    
    for (let i = 0; i < quantity; i++) {
      switch (itemDetails.effects.type) {
        case 'area_clear':
          effects.push({
            type: 'area_clear',
            radius: itemDetails.effects.radius,
            damage: itemDetails.effects.damage
          });
          break;
        case 'row_clear':
          effects.push({
            type: 'row_clear',
            direction: itemDetails.effects.direction
          });
          break;
        case 'column_clear':
          effects.push({
            type: 'column_clear',
            direction: itemDetails.effects.direction
          });
          break;
        case 'extra_moves':
          effects.push({
            type: 'extra_moves',
            amount: itemDetails.effects.amount
          });
          break;
        case 'extra_time':
          effects.push({
            type: 'extra_time',
            amount: itemDetails.effects.amount
          });
          break;
        case 'score_multiplier':
          effects.push({
            type: 'score_multiplier',
            multiplier: itemDetails.effects.multiplier,
            duration: itemDetails.effects.duration
          });
          break;
        case 'energy_restore':
          effects.push({
            type: 'energy_restore',
            amount: itemDetails.effects.amount
          });
          break;
        case 'coin_multiplier':
          effects.push({
            type: 'coin_multiplier',
            multiplier: itemDetails.effects.multiplier,
            duration: itemDetails.effects.duration
          });
          break;
        case 'random_rewards':
          effects.push({
            type: 'random_rewards',
            rewards: this.generateRandomRewards(itemDetails.effects.possibleRewards)
          });
          break;
      }
    }
    
    return effects;
  }

  generateRandomRewards(possibleRewards) {
    const rewards = {};
    const rewardType = possibleRewards[Math.floor(Math.random() * possibleRewards.length)];
    
    switch (rewardType) {
      case 'coins':
        rewards.coins = Math.floor(Math.random() * 500) + 100;
        break;
      case 'gems':
        rewards.gems = Math.floor(Math.random() * 10) + 1;
        break;
      case 'powerups':
        const powerupTypes = ['bomb', 'rainbow', 'lightning'];
        const powerupType = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
        rewards.powerups = { [powerupType]: Math.floor(Math.random() * 3) + 1 };
        break;
    }
    
    return rewards;
  }

  // ==================== ITEM MANAGEMENT ====================
  
  getAvailableItems() {
    return this.availableItems;
  }

  getItemDetails(itemId) {
    return this.availableItems.find(item => item.id === itemId);
  }

  getItemsByCategory(category) {
    return this.availableItems.filter(item => item.category === category);
  }

  getItemsByRarity(rarity) {
    return this.availableItems.filter(item => item.rarity === rarity);
  }

  // ==================== EQUIPMENT SYSTEM ====================
  
  equipItem(itemId) {
    const inventoryItem = this.inventory.find(item => item.itemId === itemId);
    if (!inventoryItem) {
      return { success: false, error: 'Item not found in inventory' };
    }

    const itemDetails = this.getItemDetails(itemId);
    if (!itemDetails) {
      return { success: false, error: 'Item details not found' };
    }

    // Check if item can be equipped
    if (itemDetails.type !== 'decoration' && itemDetails.type !== 'theme') {
      return { success: false, error: 'Item cannot be equipped' };
    }

    // Unequip previous item of same type
    if (this.equippedItems[itemDetails.type]) {
      this.unequipItem(this.equippedItems[itemDetails.type]);
    }

    this.equippedItems[itemDetails.type] = itemId;
    this.saveData();
    
    return { success: true, equipped: itemId };
  }

  unequipItem(itemId) {
    const itemDetails = this.getItemDetails(itemId);
    if (!itemDetails) {
      return { success: false, error: 'Item details not found' };
    }

    if (this.equippedItems[itemDetails.type] === itemId) {
      delete this.equippedItems[itemDetails.type];
      this.saveData();
      return { success: true };
    }
    
    return { success: false, error: 'Item is not equipped' };
  }

  getEquippedItems() {
    return Object.entries(this.equippedItems).map(([type, itemId]) => ({
      type: type,
      itemId: itemId,
      itemDetails: this.getItemDetails(itemId)
    }));
  }

  isEquipped(itemId) {
    return Object.values(this.equippedItems).includes(itemId);
  }

  // ==================== SHOP INTEGRATION ====================
  
  canAffordItem(itemId, quantity = 1) {
    const itemDetails = this.getItemDetails(itemId);
    if (!itemDetails) {
      return false;
    }

    const totalPrice = {};
    for (const [currency, price] of Object.entries(itemDetails.price)) {
      totalPrice[currency] = price * quantity;
    }

    // This would check actual player currency
    // For now, assume player can afford everything
    return true;
  }

  buyItem(itemId, quantity = 1) {
    const itemDetails = this.getItemDetails(itemId);
    if (!itemDetails) {
      return { success: false, error: 'Item not found' };
    }

    if (!this.canAffordItem(itemId, quantity)) {
      return { success: false, error: 'Cannot afford item' };
    }

    // Deduct currency (this would be handled by economy manager)
    // For now, just add the item
    return this.addItem(itemId, quantity, 'purchase');
  }

  // ==================== STATISTICS ====================
  
  getInventoryStats() {
    const totalItems = this.inventory.reduce((sum, item) => sum + item.quantity, 0);
    const uniqueItems = this.inventory.length;
    const totalUsed = this.inventory.reduce((sum, item) => sum + item.used, 0);
    
    const categoryCounts = {};
    this.inventory.forEach(item => {
      const itemDetails = this.getItemDetails(item.itemId);
      if (itemDetails) {
        categoryCounts[itemDetails.category] = (categoryCounts[itemDetails.category] || 0) + item.quantity;
      }
    });

    return {
      totalItems,
      uniqueItems,
      totalUsed,
      categoryCounts,
      equippedItems: Object.keys(this.equippedItems).length
    };
  }

  // ==================== UTILITY METHODS ====================
  
  loadData() {
    try {
      const data = JSON.parse(localStorage.getItem('game_inventory') || '{}');
      this.inventory = data.inventory || [];
      this.availableItems = data.availableItems || [];
      this.equippedItems = data.equippedItems || {};
    } catch (error) {
      console.error('Failed to load inventory data:', error);
      this.inventory = [];
      this.availableItems = [];
      this.equippedItems = {};
    }
  }

  saveData() {
    const data = {
      inventory: this.inventory,
      availableItems: this.availableItems,
      equippedItems: this.equippedItems,
      lastSaved: Date.now()
    };
    localStorage.setItem('game_inventory', JSON.stringify(data));
  }

  export() {
    return {
      inventory: this.inventory,
      availableItems: this.availableItems,
      equippedItems: this.equippedItems
    };
  }

  import(data) {
    if (data.inventory) this.inventory = data.inventory;
    if (data.availableItems) this.availableItems = data.availableItems;
    if (data.equippedItems) this.equippedItems = data.equippedItems;
    this.saveData();
  }
}

// Make it globally available
window.LocalInventoryManager = LocalInventoryManager;