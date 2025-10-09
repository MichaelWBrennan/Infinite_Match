// Cloud Code function to use/consume inventory item from player
// This function is called from the Unity client to use inventory items

const { EconomyApi } = require('@unity-services/economy-2.4.0');

module.exports = async ({ params, context, logger }) => {
  try {
    const { itemId, quantity = 1 } = params;

    if (!itemId || quantity <= 0) {
      return {
        success: false,
        errorMessage: 'Invalid parameters: itemId and quantity are required',
      };
    }

    // Get player ID from context
    const playerId = context.playerId;

    if (!playerId) {
      return {
        success: false,
        errorMessage: 'Player not authenticated',
      };
    }

    // Check if player has enough items
    const economyApi = new EconomyApi();
    const currentInventory = await economyApi.getInventoryItem({
      playerId: playerId,
      itemId: itemId,
    });

    if (!currentInventory || currentInventory.quantity < quantity) {
      return {
        success: false,
        errorMessage: 'Insufficient inventory',
        currentQuantity: currentInventory ? currentInventory.quantity : 0,
        requiredQuantity: quantity,
      };
    }

    // Use inventory item
    const result = await economyApi.subtractInventoryItem({
      playerId: playerId,
      itemId: itemId,
      quantity: quantity,
    });

    logger.info(`Used ${quantity} ${itemId} from player ${playerId} inventory`);

    return {
      success: true,
      itemId: itemId,
      quantityUsed: quantity,
      newQuantity: result.quantity,
    };
  } catch (error) {
    logger.error(`Error using inventory item: ${error.message}`);
    return {
      success: false,
      errorMessage: error.message,
    };
  }
};
