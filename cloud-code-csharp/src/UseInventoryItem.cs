using Unity.Services.CloudCode;
using Unity.Services.Economy;
using Unity.Services.Core;
using System;
using System.Threading.Tasks;
using System.Linq;

[CloudCodeFunction("UseInventoryItem")]
public class UseInventoryItem : CloudCodeFunction
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

            // Get current inventory
            var inventory = await EconomyService.Instance.Inventory.GetInventoryItemsAsync();
            var item = inventory.FirstOrDefault(i => i.InventoryItemId == itemId);

            if (item == null || item.Amount < quantity)
                throw new InvalidOperationException("Insufficient inventory items");

            // Use inventory item
            await EconomyService.Instance.Inventory.UseInventoryItemAsync(itemId, quantity);

            // Log success
            Logger.LogInfo($"Used {quantity} {itemId} from player inventory");

            return new
            {
                success = true,
                itemId = itemId,
                quantity = quantity,
                remainingQuantity = item.Amount - quantity
            };
        }
        catch (Exception ex)
        {
            Logger.LogError($"UseInventoryItem failed: {ex.Message}");
            throw;
        }
    }
}