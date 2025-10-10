// AddCurrency Cloud Code Function
const { EconomyApi } = require("@unity-services/economy-1.0");

module.exports = async ({ params, context, logger }) => {
  try {
    const { currencyId, amount } = params;
    if (!currencyId || !amount) throw new Error("Missing required parameters");
    if (amount <= 0) throw new Error("Amount must be positive");

    await EconomyApi.addCurrency({ currencyId, amount });
    logger.info(`Added ${amount} ${currencyId} to player`);

    return { success: true, currencyId, amount };
  } catch (error) {
    logger.error(`AddCurrency failed: ${error.message}`);
    throw error;
  }
};