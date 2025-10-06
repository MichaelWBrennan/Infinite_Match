// Cloud Code function to spend currency from player balance
// This function is called from the Unity client to spend currency

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
        
        // Get current balance
        const balance = await EconomyApi.getPlayerBalance({
            playerId: playerId,
            currencyId: currencyId
        });
        
        if (balance.balance < amount) {
            return {
                success: false,
                errorMessage: "Insufficient balance"
            };
        }
        
        // Spend currency using Economy API
        await EconomyApi.decrementCurrencyResource({
            playerId: playerId,
            currencyId: currencyId,
            amount: amount
        });
        
        logger.info(`Spent ${amount} ${currencyId} from player ${playerId}`);
        
        return {
            success: true,
            currencyId: currencyId,
            amount: amount,
            newBalance: balance.balance - amount
        };
        
    } catch (error) {
        logger.error(`SpendCurrency error: ${error.message}`);
        return {
            success: false,
            errorMessage: error.message
        };
    }
};