// Cloud Code function to spend currency from player
// This function is called from the Unity client to spend currency

const { EconomyApi } = require('@unity-services/economy-2.4.0');

module.exports = async ({ params, context, logger }) => {
  try {
    const { currencyId, amount } = params;

    if (!currencyId || !amount || amount <= 0) {
      return {
        success: false,
        errorMessage: 'Invalid parameters: currencyId and amount are required',
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

    // Check if player has enough currency
    const economyApi = new EconomyApi();
    const currentBalance = await economyApi.getCurrencyBalance({
      playerId: playerId,
      currencyId: currencyId,
    });

    if (currentBalance.balance < amount) {
      return {
        success: false,
        errorMessage: 'Insufficient funds',
        currentBalance: currentBalance.balance,
        requiredAmount: amount,
      };
    }

    // Spend currency
    const result = await economyApi.subtractCurrencyBalance({
      playerId: playerId,
      currencyId: currencyId,
      amount: amount,
    });

    logger.info(`Spent ${amount} ${currencyId} from player ${playerId}`);

    return {
      success: true,
      newBalance: result.balance,
      currencyId: currencyId,
      amountSpent: amount,
    };
  } catch (error) {
    logger.error(`Error spending currency: ${error.message}`);
    return {
      success: false,
      errorMessage: error.message,
    };
  }
};
