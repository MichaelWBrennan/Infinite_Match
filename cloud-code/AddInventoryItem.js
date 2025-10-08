// Unity Cloud Code function to add inventory item to player

const { validateParams, commonValidators } = require('./validationUtils');

/**
 * Add inventory item to player
 * @param {Object} params - Function parameters
 * @param {string} params.itemId - Item ID to add
 * @param {number} params.quantity - Quantity to add (defaults to 1)
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

    if (existingItem) {
      // Update existing item quantity
      await context.services.inventory.updateInventoryItem({
        id: itemId,
        amount: existingItem.amount + quantity,
      });
    } else {
      // Add new item
      await context.services.inventory.addInventoryItem({
        id: itemId,
        amount: quantity,
      });
    }

    logger.info(`Added ${quantity} of item ${itemId}`);

    return {
      success: true,
      itemId,
      quantity,
      newTotal: existingItem ? existingItem.amount + quantity : quantity,
    };
  } catch (error) {
    logger.error('Error adding inventory item:', error);
    throw error;
  }
};
