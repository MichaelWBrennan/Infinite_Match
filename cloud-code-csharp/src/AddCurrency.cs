using Unity.Services.CloudCode;
using Unity.Services.Economy;
using Unity.Services.Core;
using System;
using System.Threading.Tasks;

[CloudCodeFunction("AddCurrency")]
public class AddCurrency : CloudCodeFunction
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

            // Add currency to player
            await EconomyService.Instance.Currency.AddCurrencyAsync(currencyId, amount);

            // Log success
            Logger.LogInfo($"Added {amount} {currencyId} to player");

            return new
            {
                success = true,
                currencyId = currencyId,
                amount = amount
            };
        }
        catch (Exception ex)
        {
            Logger.LogError($"AddCurrency failed: {ex.Message}");
            throw;
        }
    }
}