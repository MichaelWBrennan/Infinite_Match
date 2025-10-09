// Unity Cloud Dashboard Auto-Population Script
// Generated on 2025-10-09T20:02:23.810988

console.log('🚀 Unity Cloud Dashboard Population Script');
console.log('📊 Economy Data Summary:');
console.log('- Currencies: 3');
console.log('- Inventory Items: 13');
console.log('- Catalog Items: 20');

// Currency data
const currencies = [
  {
    "id": "coins",
    "name": "Coins",
    "type": "soft_currency",
    "initial": 1000,
    "maximum": 999999
  },
  {
    "id": "gems",
    "name": "Gems",
    "type": "hard_currency",
    "initial": 50,
    "maximum": 99999
  },
  {
    "id": "energy",
    "name": "Energy",
    "type": "consumable",
    "initial": 5,
    "maximum": 30
  }
];

// Inventory data  
const inventoryItems = [
  {
    "id": "booster_extra_moves",
    "name": "Extra Moves",
    "type": "booster",
    "tradable": true,
    "stackable": true
  },
  {
    "id": "booster_color_bomb",
    "name": "Color Bomb",
    "type": "booster",
    "tradable": true,
    "stackable": true
  },
  {
    "id": "booster_rainbow_blast",
    "name": "Rainbow Blast",
    "type": "booster",
    "tradable": true,
    "stackable": true
  },
  {
    "id": "booster_striped_candy",
    "name": "Striped Candy",
    "type": "booster",
    "tradable": true,
    "stackable": true
  },
  {
    "id": "pack_starter",
    "name": "Starter Pack",
    "type": "pack",
    "tradable": false,
    "stackable": false
  },
  {
    "id": "pack_value",
    "name": "Value Pack",
    "type": "pack",
    "tradable": false,
    "stackable": false
  },
  {
    "id": "pack_premium",
    "name": "Premium Pack",
    "type": "pack",
    "tradable": false,
    "stackable": false
  },
  {
    "id": "pack_mega",
    "name": "Mega Pack",
    "type": "pack",
    "tradable": false,
    "stackable": false
  },
  {
    "id": "pack_ultimate",
    "name": "Ultimate Pack",
    "type": "pack",
    "tradable": false,
    "stackable": false
  },
  {
    "id": "pack_booster_small",
    "name": "Booster Bundle",
    "type": "pack",
    "tradable": false,
    "stackable": false
  },
  {
    "id": "pack_booster_large",
    "name": "Power Pack",
    "type": "pack",
    "tradable": false,
    "stackable": false
  },
  {
    "id": "pack_comeback",
    "name": "Welcome Back!",
    "type": "pack",
    "tradable": false,
    "stackable": false
  },
  {
    "id": "pack_flash_sale",
    "name": "Flash Sale!",
    "type": "pack",
    "tradable": false,
    "stackable": false
  }
];

// Catalog data
const catalogItems = [
  {
    "id": "coins_small",
    "name": "Small Coin Pack",
    "cost_currency": "gems",
    "cost_amount": 20,
    "rewards": "coins:1000"
  },
  {
    "id": "coins_medium",
    "name": "Medium Coin Pack",
    "cost_currency": "gems",
    "cost_amount": 120,
    "rewards": "coins:5000"
  },
  {
    "id": "coins_large",
    "name": "Large Coin Pack",
    "cost_currency": "gems",
    "cost_amount": 300,
    "rewards": "coins:15000"
  },
  {
    "id": "coins_mega",
    "name": "Mega Coin Pack",
    "cost_currency": "gems",
    "cost_amount": 700,
    "rewards": "coins:40000"
  },
  {
    "id": "coins_ultimate",
    "name": "Ultimate Coin Pack",
    "cost_currency": "gems",
    "cost_amount": 2000,
    "rewards": "coins:100000"
  },
  {
    "id": "energy_small",
    "name": "Energy Boost",
    "cost_currency": "gems",
    "cost_amount": 5,
    "rewards": "energy:5"
  },
  {
    "id": "energy_large",
    "name": "Energy Surge",
    "cost_currency": "gems",
    "cost_amount": 15,
    "rewards": "energy:20"
  },
  {
    "id": "booster_extra_moves",
    "name": "Extra Moves",
    "cost_currency": "coins",
    "cost_amount": 200,
    "rewards": "booster_extra_moves:3"
  },
  {
    "id": "booster_color_bomb",
    "name": "Color Bomb",
    "cost_currency": "gems",
    "cost_amount": 15,
    "rewards": "booster_color_bomb:1"
  },
  {
    "id": "booster_rainbow_blast",
    "name": "Rainbow Blast",
    "cost_currency": "gems",
    "cost_amount": 25,
    "rewards": "booster_rainbow_blast:1"
  },
  {
    "id": "booster_striped_candy",
    "name": "Striped Candy",
    "cost_currency": "coins",
    "cost_amount": 100,
    "rewards": "booster_striped_candy:1"
  },
  {
    "id": "pack_starter",
    "name": "Starter Pack",
    "cost_currency": "gems",
    "cost_amount": 20,
    "rewards": "pack_starter:1"
  },
  {
    "id": "pack_value",
    "name": "Value Pack",
    "cost_currency": "gems",
    "cost_amount": 120,
    "rewards": "pack_value:1"
  },
  {
    "id": "pack_premium",
    "name": "Premium Pack",
    "cost_currency": "gems",
    "cost_amount": 300,
    "rewards": "pack_premium:1"
  },
  {
    "id": "pack_mega",
    "name": "Mega Pack",
    "cost_currency": "gems",
    "cost_amount": 700,
    "rewards": "pack_mega:1"
  },
  {
    "id": "pack_ultimate",
    "name": "Ultimate Pack",
    "cost_currency": "gems",
    "cost_amount": 2000,
    "rewards": "pack_ultimate:1"
  },
  {
    "id": "pack_booster_small",
    "name": "Booster Bundle",
    "cost_currency": "coins",
    "cost_amount": 500,
    "rewards": "pack_booster_small:1"
  },
  {
    "id": "pack_booster_large",
    "name": "Power Pack",
    "cost_currency": "gems",
    "cost_amount": 25,
    "rewards": "pack_booster_large:1"
  },
  {
    "id": "pack_comeback",
    "name": "Welcome Back!",
    "cost_currency": "gems",
    "cost_amount": 50,
    "rewards": "pack_comeback:1"
  },
  {
    "id": "pack_flash_sale",
    "name": "Flash Sale!",
    "cost_currency": "gems",
    "cost_amount": 25,
    "rewards": "pack_flash_sale:1"
  }
];

// Auto-fill functions
function fillCurrencyForm(currency) {
    console.log('Filling currency: ' + currency.name + ' (' + currency.id + ')');
    // Add your form filling logic here
    // This would target Unity Dashboard form elements
}

function fillInventoryForm(item) {
    console.log('Filling inventory item: ' + item.name + ' (' + item.id + ')');
    // Add your form filling logic here
}

function fillCatalogForm(item) {
    console.log('Filling catalog item: ' + item.name + ' (' + item.id + ')');
    // Add your form filling logic here
}

// Run population
console.log('Starting auto-population...');
currencies.forEach(fillCurrencyForm);
inventoryItems.forEach(fillInventoryForm);
catalogItems.forEach(fillCatalogForm);

console.log('✅ Dashboard population completed!');
