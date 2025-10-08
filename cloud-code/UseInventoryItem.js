// Unity Cloud Code function to use inventory item

const { validateParams, commonValidators } = require('./validationUtils');

/**
 * Use inventory item from player
 * @param {Object} params - Function parameters
 * @param {string} params.itemId - Item ID to use
 * @param {number} params.quantity - Quantity to use (defaults to 1)
 * @param {Object} context - Unity context
 * @param {Object} logger - Logger instance
 * @returns {Promise<Object>} Result object
 */
module.exports = async ({ params, context, logger }) => {
  try {
    const { itemId, quantity = 1 } = params;

    // Validate parameters
    const validation = validateParams(params, ['itemId'], {
      itemId: commonValidators.itemId,
      quantity: commonValidators.quantity
    });

    if (!validation.isValid) {
      throw new Error(`Invalid parameters: ${validation.errors.join(', ')}`);
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
