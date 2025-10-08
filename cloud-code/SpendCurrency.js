// Unity Cloud Code function to spend currency from player

const { validateParams, commonValidators } = require('./validationUtils');

/**
 * Spend currency from player inventory
 * @param {Object} params - Function parameters
 * @param {string} params.currencyId - Currency ID to spend
 * @param {number} params.amount - Amount to spend
 * @param {Object} context - Unity context
 * @param {Object} logger - Logger instance
 * @returns {Promise<Object>} Result object
 */
module.exports = async ({ params, context, logger }) => {
  try {
    const { currencyId, amount } = params;

    // Validate parameters
    const validation = validateParams(params, ['currencyId', 'amount'], {
      currencyId: commonValidators.currencyId,
      amount: commonValidators.amount
    });

    if (!validation.isValid) {
      throw new Error(`Invalid parameters: ${validation.errors.join(', ')}`);
    }

    // Get player inventory
    const inventory = await context.services.inventory.getInventoryItems();

    // Find existing currency
    const existingCurrency = inventory.find((item) => item.id === currencyId);

    if (!existingCurrency) {
      throw new Error(`Currency ${currencyId} not found in inventory`);
    }

    if (existingCurrency.amount < amount) {
      throw new Error(
        `Insufficient currency. Required: ${amount}, Available: ${existingCurrency.amount}`
      );
    }

    // Update currency amount
    const newAmount = existingCurrency.amount - amount;
    await context.services.inventory.updateInventoryItem({
      id: currencyId,
      amount: newAmount,
    });

    logger.info(
      `Spent ${amount} of currency ${currencyId}. Remaining: ${newAmount}`
    );

    return {
      success: true,
      currencyId,
      amount,
      newTotal: newAmount,
    };
  } catch (error) {
    logger.error('Error spending currency:', error);
    throw error;
  }
};
