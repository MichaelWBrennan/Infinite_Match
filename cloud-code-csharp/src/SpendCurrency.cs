using Unity.Services.CloudCode;
using Unity.Services.Economy;
using Unity.Services.Core;
using System;
using System.Threading.Tasks;

[CloudCodeFunction("SpendCurrency")]
public class SpendCurrency : CloudCodeFunction
{
    public async Task<object> ExecuteAsync(CloudCodeRequest request)
    {
        try
        {
            // Parse parameters
            var currencyId = request.GetParameter<string>("currencyId");
            var amount = request.GetParameter<int>("amount");

            // Validate parameters
            if (string.IsNullOrEmpty(currencyId))
                throw new ArgumentException("currencyId is required");
            
            if (amount <= 0)
                throw new ArgumentException("amount must be positive");

            // Get current balance
            var balance = await EconomyService.Instance.Currency.GetCurrencyBalanceAsync(currencyId);
            
            if (balance.Amount < amount)
                throw new InvalidOperationException("Insufficient funds");

            // Spend currency
            await EconomyService.Instance.Currency.SpendCurrencyAsync(currencyId, amount);

            // Log success
            Logger.LogInfo($"Spent {amount} {currencyId} from player");

            return new
            {
                success = true,
                currencyId = currencyId,
                amount = amount,
                newBalance = balance.Amount - amount
            };
        }
        catch (Exception ex)
        {
            Logger.LogError($"SpendCurrency failed: {ex.Message}");
            throw;
        }
    }
}