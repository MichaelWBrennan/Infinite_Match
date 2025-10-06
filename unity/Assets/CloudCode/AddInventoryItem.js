// Cloud Code function to add inventory item to player
// This function is called from the Unity client to add inventory items

const { EconomyApi } = require("@unity-services/economy-2.4");

module.exports = async ({ params, context, logger }) => {
    try {
        const { itemId, quantity } = params;
        
        if (!itemId || !quantity || quantity <= 0) {
            return {
                success: false,
                errorMessage: "Invalid parameters"
            };
        }
        
        // Get player ID from context
        const playerId = context.playerId;
        
        if (!playerId) {
            return {
                success: false,
                errorMessage: "Player not authenticated"
            };
        }
        
        // Add inventory item using Economy API
        await EconomyApi.addInventoryItem({
            playerId: playerId,
            inventoryItemId: itemId,
            quantity: quantity
        });
        
        logger.info(`Added ${quantity} ${itemId} to player ${playerId}`);
        
        return {
            success: true,
            itemId: itemId,
            quantity: quantity
        };
        
    } catch (error) {
        logger.error(`AddInventoryItem error: ${error.message}`);
        return {
            success: false,
            errorMessage: error.message
        };
    }
};