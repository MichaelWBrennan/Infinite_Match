// Cloud Code function to use/consume inventory item
// This function is called from the Unity client to use inventory items

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
        
        // Get current inventory count
        const inventory = await EconomyApi.getPlayerInventory({
            playerId: playerId,
            inventoryItemId: itemId
        });
        
        if (inventory.count < quantity) {
            return {
                success: false,
                errorMessage: "Insufficient inventory"
            };
        }
        
        // Use inventory item using Economy API
        await EconomyApi.decrementInventoryItem({
            playerId: playerId,
            inventoryItemId: itemId,
            quantity: quantity
        });
        
        logger.info(`Used ${quantity} ${itemId} from player ${playerId}`);
        
        return {
            success: true,
            itemId: itemId,
            quantity: quantity,
            newCount: inventory.count - quantity
        };
        
    } catch (error) {
        logger.error(`UseInventoryItem error: ${error.message}`);
        return {
            success: false,
            errorMessage: error.message
        };
    }
};