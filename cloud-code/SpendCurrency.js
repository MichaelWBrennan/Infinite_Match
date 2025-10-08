// Unity Cloud Code function to spend currency from player
const { CloudCode } = require('@unity-services/cloud-code-js');

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
    const existingCurrency = inventory.find(item => item.id === currencyId);
    
    if (!existingCurrency) {
      throw new Error(`Currency ${currencyId} not found in inventory`);
    }
    
    if (existingCurrency.amount < amount) {
      throw new Error(`Insufficient currency. Required: ${amount}, Available: ${existingCurrency.amount}`);
    }
    
    // Update currency amount
    const newAmount = existingCurrency.amount - amount;
    await context.services.inventory.updateInventoryItem({
      id: currencyId,
      amount: newAmount
    });
    
    logger.info(`Spent ${amount} of currency ${currencyId}. Remaining: ${newAmount}`);
    
    return {
      success: true,
      currencyId,
      amount,
      newTotal: newAmount
    };
    
  } catch (error) {
    logger.error('Error spending currency:', error);
    throw error;
  }
};