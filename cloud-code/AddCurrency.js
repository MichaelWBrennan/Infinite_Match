// AddCurrency Cloud Code Function
const { EconomyApi } = require("@unity-services/economy-1.0");

module.exports = async ({ params, context, logger }) => {
  try {
    const { currencyId, amount } = params;

    if (!currencyId || !amount) {
      throw new Error("Missing required parameters: currencyId, amount");
    }

    if (amount <= 0) {
      throw new Error("Amount must be positive");
    }

    // Add currency to player
    await EconomyApi.addCurrency({
      currencyId: currencyId,
      amount: amount
    });

    logger.info(`Added ${amount} ${currencyId} to player`);

    return {
      success: true,
      currencyId: currencyId,
      amount: amount
    };
  } catch (error) {
    logger.error(`AddCurrency failed: ${error.message}`);
    throw error;
  }
};