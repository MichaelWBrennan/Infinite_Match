// Cloud Code function to add currency to player balance
// This function is called from the Unity client to add currency

const { EconomyApi } = require("@unity-services/economy-2.4");

module.exports = async ({ params, context, logger }) => {
    try {
        const { currencyId, amount } = params;
        
        if (!currencyId || !amount || amount <= 0) {
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
        
        // Add currency using Economy API
        await EconomyApi.addCurrencyResource({
            playerId: playerId,
            currencyId: currencyId,
            amount: amount
        });
        
        logger.info(`Added ${amount} ${currencyId} to player ${playerId}`);
        
        return {
            success: true,
            currencyId: currencyId,
            amount: amount
        };
        
    } catch (error) {
        logger.error(`AddCurrency error: ${error.message}`);
        return {
            success: false,
            errorMessage: error.message
        };
    }
};