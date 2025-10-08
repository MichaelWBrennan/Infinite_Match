// Unity Cloud Code function to add currency to player

/**
 * Add currency to player inventory
 * @param {Object} params - Function parameters
 * @param {string} params.currencyId - Currency ID to add
 * @param {number} params.amount - Amount to add
 * @param {Object} context - Unity context
 * @param {Object} logger - Logger instance
 * @returns {Promise<Object>} Result object
 */
module.exports = async ({ params, context, logger }) => {
  try {
    const { currencyId, amount } = params;

    // Validate parameters
    if (!currencyId || !amount || amount <= 0) {
      throw new Error('Invalid parameters: currencyId and amount are required');
    }

    // Get player inventory
    const inventory = await context.services.inventory.getInventoryItems();

    // Find existing currency
    const existingCurrency = inventory.find((item) => item.id === currencyId);

    if (existingCurrency) {
      // Update existing currency
      await context.services.inventory.updateInventoryItem({
        id: currencyId,
        amount: existingCurrency.amount + amount,
      });
    } else {
      // Add new currency
      await context.services.inventory.addInventoryItem({
        id: currencyId,
        amount: amount,
      });
    }

    logger.info(`Added ${amount} of currency ${currencyId}`);

    return {
      success: true,
      currencyId,
      amount,
      newTotal: existingCurrency ? existingCurrency.amount + amount : amount,
    };
  } catch (error) {
    logger.error('Error adding currency:', error);
    throw error;
  }
};
