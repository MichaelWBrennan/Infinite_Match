// Cloud Code function to add currency to player
// This function is called from the Unity client to add currency

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

    // Add currency to player balance
    const economyApi = new EconomyApi();
    const result = await economyApi.addCurrencyBalance({
      playerId: playerId,
      currencyId: currencyId,
      amount: amount,
    });

    logger.info(`Added ${amount} ${currencyId} to player ${playerId}`);

    return {
      success: true,
      newBalance: result.balance,
      currencyId: currencyId,
      amountAdded: amount,
    };
  } catch (error) {
    logger.error(`Error adding currency: ${error.message}`);
    return {
      success: false,
      errorMessage: error.message,
    };
  }
};
