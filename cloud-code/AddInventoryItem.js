// AddInventoryItem Cloud Code Function
const { EconomyApi } = require("@unity-services/economy-1.0");

module.exports = async ({ params, context, logger }) => {
  try {
    const { itemId, quantity = 1 } = params;
    if (!itemId) throw new Error("Missing required parameter: itemId");
    if (quantity <= 0) throw new Error("Quantity must be positive");

    await EconomyApi.addInventoryItem({ itemId, quantity });
    logger.info(`Added ${quantity} ${itemId} to player inventory`);

    return { success: true, itemId, quantity };
  } catch (error) {
    logger.error(`AddInventoryItem failed: ${error.message}`);
    throw error;
  }
};