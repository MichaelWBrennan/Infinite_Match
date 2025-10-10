// SpendCurrency Cloud Code Function
const { EconomyApi } = require("@unity-services/economy-1.0");

module.exports = async ({ params, context, logger }) => {
  try {
    const { currencyId, amount } = params;
    if (!currencyId || !amount) throw new Error("Missing required parameters");
    if (amount <= 0) throw new Error("Amount must be positive");

    const balance = await EconomyApi.getCurrencyBalance({ currencyId });
    if (balance.amount < amount) throw new Error("Insufficient funds");

    await EconomyApi.spendCurrency({ currencyId, amount });
    logger.info(`Spent ${amount} ${currencyId} from player`);

    return { success: true, currencyId, amount, newBalance: balance.amount - amount };
  } catch (error) {
    logger.error(`SpendCurrency failed: ${error.message}`);
    throw error;
  }
};