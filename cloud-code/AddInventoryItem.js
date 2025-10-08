// Unity Cloud Code function to add inventory item to player
const { CloudCode } = require('@unity-services/cloud-code-js');

module.exports = async ({ params, context, logger }) => {
  try {
    const { itemId, quantity = 1 } = params;
    
    // Validate parameters
    if (!itemId || quantity <= 0) {
      throw new Error('Invalid parameters: itemId is required and quantity must be positive');
    }
    
    // Get player inventory
    const inventory = await context.services.inventory.getInventoryItems();
    
    // Find existing item
    const existingItem = inventory.find(item => item.id === itemId);
    
    if (existingItem) {
      // Update existing item quantity
      await context.services.inventory.updateInventoryItem({
        id: itemId,
        amount: existingItem.amount + quantity
      });
    } else {
      // Add new item
      await context.services.inventory.addInventoryItem({
        id: itemId,
        amount: quantity
      });
    }
    
    logger.info(`Added ${quantity} of item ${itemId}`);
    
    return {
      success: true,
      itemId,
      quantity,
      newTotal: existingItem ? existingItem.amount + quantity : quantity
    };
    
  } catch (error) {
    logger.error('Error adding inventory item:', error);
    throw error;
  }
};