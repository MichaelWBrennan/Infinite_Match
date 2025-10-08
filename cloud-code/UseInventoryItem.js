// Unity Cloud Code function to use inventory item
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
    
    if (!existingItem) {
      throw new Error(`Item ${itemId} not found in inventory`);
    }
    
    if (existingItem.amount < quantity) {
      throw new Error(`Insufficient quantity. Required: ${quantity}, Available: ${existingItem.amount}`);
    }
    
    // Update item quantity
    const newAmount = existingItem.amount - quantity;
    await context.services.inventory.updateInventoryItem({
      id: itemId,
      amount: newAmount
    });
    
    logger.info(`Used ${quantity} of item ${itemId}. Remaining: ${newAmount}`);
    
    return {
      success: true,
      itemId,
      quantity,
      newTotal: newAmount
    };
    
  } catch (error) {
    logger.error('Error using inventory item:', error);
    throw error;
  }
};