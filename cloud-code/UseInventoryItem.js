// Unity Cloud Code function to use inventory item

/**
 * Use inventory item from player
 * @param {Object} params - Function parameters
 * @param {string} params.itemId - Item ID to use
 * @param {number} params.amount - Amount to use
 * @param {Object} context - Unity context
 * @param {Object} logger - Logger instance
 * @returns {Promise<Object>} Result object
 */
module.exports = async ({ params, context, logger }) => {
  try {
    const { itemId, quantity = 1 } = params;

    // Validate parameters
    if (!itemId || quantity <= 0) {
      throw new Error(
        'Invalid parameters: itemId is required and quantity must be positive'
      );
    }

    // Get player inventory
    const inventory = await context.services.inventory.getInventoryItems();

    // Find existing item
    const existingItem = inventory.find((item) => item.id === itemId);

    if (!existingItem) {
      throw new Error(`Item ${itemId} not found in inventory`);
    }

    if (existingItem.amount < quantity) {
      throw new Error(
        `Insufficient quantity. Required: ${quantity}, Available: ${existingItem.amount}`
      );
    }

    // Update item quantity
    const newAmount = existingItem.amount - quantity;
    await context.services.inventory.updateInventoryItem({
      id: itemId,
      amount: newAmount,
    });

    logger.info(`Used ${quantity} of item ${itemId}. Remaining: ${newAmount}`);

    return {
      success: true,
      itemId,
      quantity,
      newTotal: newAmount,
    };
  } catch (error) {
    logger.error('Error using inventory item:', error);
    throw error;
  }
};
