// Cloud Code function to add inventory item to player
// This function is called from the Unity client to add inventory items

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

    // Add inventory item to player
    const economyApi = new EconomyApi();
    const result = await economyApi.addInventoryItem({
      playerId: playerId,
      itemId: itemId,
      quantity: quantity,
    });

    logger.info(`Added ${quantity} ${itemId} to player ${playerId} inventory`);

    return {
      success: true,
      itemId: itemId,
      quantityAdded: quantity,
      newQuantity: result.quantity,
    };
  } catch (error) {
    logger.error(`Error adding inventory item: ${error.message}`);
    return {
      success: false,
      errorMessage: error.message,
    };
  }
};
