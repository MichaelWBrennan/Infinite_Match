// UseInventoryItem Cloud Code Function
const { EconomyApi } = require("@unity-services/economy-1.0");

module.exports = async ({ params, context, logger }) => {
  try {
    const { itemId, quantity = 1 } = params;
    if (!itemId) throw new Error("Missing required parameter: itemId");
    if (quantity <= 0) throw new Error("Quantity must be positive");
    
    const inventory = await EconomyApi.getInventoryItems();
    const item = inventory.find(i => i.id === itemId);
    
    if (!item || item.quantity < quantity) throw new Error("Insufficient inventory items");
    
    await EconomyApi.useInventoryItem({ itemId, quantity });
    logger.info(`Used ${quantity} ${itemId} from player inventory`);
    
    return { success: true, itemId, quantity, remainingQuantity: item.quantity - quantity };
  } catch (error) {
    logger.error(`UseInventoryItem failed: ${error.message}`);
    throw error;
  }
};