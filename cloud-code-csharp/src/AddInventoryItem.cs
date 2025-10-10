using Unity.Services.CloudCode;
using Unity.Services.Economy;
using Unity.Services.Core;
using System;
using System.Threading.Tasks;

[CloudCodeFunction("AddInventoryItem")]
public class AddInventoryItem : CloudCodeFunction
{
    public async Task<object> ExecuteAsync(CloudCodeRequest request)
    {
        try
        {
            // Parse parameters
            var itemId = request.GetParameter<string>("itemId");
            var quantity = request.GetParameter<int>("quantity", 1);

            // Validate parameters
            if (string.IsNullOrEmpty(itemId))
                throw new ArgumentException("itemId is required");
            
            if (quantity <= 0)
                throw new ArgumentException("quantity must be positive");

            // Add item to player inventory
            await EconomyService.Instance.Inventory.AddInventoryItemAsync(itemId, quantity);

            // Log success
            Logger.LogInfo($"Added {quantity} {itemId} to player inventory");

            return new
            {
                success = true,
                itemId = itemId,
                quantity = quantity
            };
        }
        catch (Exception ex)
        {
            Logger.LogError($"AddInventoryItem failed: {ex.Message}");
            throw;
        }
    }
}