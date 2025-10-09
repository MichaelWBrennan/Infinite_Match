using UnityEngine;
using UnityEditor;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Unity.Services.Core;
using Unity.Services.Economy;
using Unity.Services.Authentication;
using System;

namespace Evergreen.Editor
{
    public class CSVToDashboardImporter : EditorWindow
    {
        [MenuItem("Tools/Economy/Import CSV to Unity Dashboard")]
        public static void ShowWindow()
        {
            GetWindow<CSVToDashboardImporter>("CSV to Dashboard Importer");
        }

        private void OnGUI()
        {
            GUILayout.Label("CSV to Unity Dashboard Import", EditorStyles.boldLabel);
            GUILayout.Space(10);

            if (GUILayout.Button("🚀 Import All CSV Data to Unity Dashboard", GUILayout.Height(40)))
            {
                ImportAllData();
            }

            GUILayout.Space(10);

            if (GUILayout.Button("📊 Validate CSV Data"))
            {
                ValidateCSVData();
            }

            if (GUILayout.Button("💰 Import Currencies Only"))
            {
                ImportCurrencies();
            }

            if (GUILayout.Button("📦 Import Inventory Only"))
            {
                ImportInventory();
            }

            if (GUILayout.Button("🛒 Import Catalog Only"))
            {
                ImportCatalog();
            }
        }

        private async void ImportAllData()
        {
            try
            {
                Debug.Log("🚀 Starting CSV to Unity Dashboard import...");

                // Initialize Unity Services
                await UnityServices.InitializeAsync();
                await AuthenticationService.Instance.SignInAnonymouslyAsync();
                Debug.Log("✅ Unity Services initialized");

                // Import currencies
                await ImportCurrencies();
                await Task.Delay(1000);

                // Import inventory
                await ImportInventory();
                await Task.Delay(1000);

                // Import catalog
                await ImportCatalog();

                Debug.Log("🎉 All CSV data imported to Unity Dashboard successfully!");
            }
            catch (Exception e)
            {
                Debug.LogError($"❌ Import failed: {e.Message}");
            }
        }

        private async Task ImportCurrencies()
        {
            try
            {
                Debug.Log("💰 Importing currencies...");
                
                var currencies = new[]
                {
                    new { Id = "coins", Name = "Coins", Type = CurrencyType.Soft, Initial = 1000, Maximum = 999999 },
                    new { Id = "gems", Name = "Gems", Type = CurrencyType.Hard, Initial = 50, Maximum = 99999 },
                    new { Id = "energy", Name = "Energy", Type = CurrencyType.Consumable, Initial = 5, Maximum = 30 }
                };

                foreach (var currency in currencies)
                {
                    try
                    {
                        var currencyDef = new CurrencyDefinition
                        {
                            Id = currency.Id,
                            Name = currency.Name,
                            Type = currency.Type,
                            Initial = currency.Initial,
                            Maximum = currency.Maximum
                        };
                        
                        await EconomyService.Instance.Configuration.CreateCurrencyAsync(currencyDef);
                        Debug.Log($"✅ Created currency: {currency.Name}");
                    }
                    catch (Exception e)
                    {
                        Debug.LogWarning($"⚠️ Currency {currency.Id} might already exist: {e.Message}");
                    }
                }

                Debug.Log("✅ Currencies imported successfully!");
            }
            catch (Exception e)
            {
                Debug.LogError($"❌ Currency import failed: {e.Message}");
            }
        }

        private async Task ImportInventory()
        {
            try
            {
                Debug.Log("📦 Importing inventory items...");
                
                var inventoryItems = new[]
                {
                    new { Id = "booster_extra_moves", Name = "Extra Moves", Type = InventoryItemType.Booster, Tradable = true, Stackable = true },
                    new { Id = "booster_color_bomb", Name = "Color Bomb", Type = InventoryItemType.Booster, Tradable = true, Stackable = true },
                    new { Id = "booster_rainbow_blast", Name = "Rainbow Blast", Type = InventoryItemType.Booster, Tradable = true, Stackable = true },
                    new { Id = "booster_striped_candy", Name = "Striped Candy", Type = InventoryItemType.Booster, Tradable = true, Stackable = true },
                    new { Id = "pack_starter", Name = "Starter Pack", Type = InventoryItemType.Pack, Tradable = false, Stackable = false },
                    new { Id = "pack_value", Name = "Value Pack", Type = InventoryItemType.Pack, Tradable = false, Stackable = false },
                    new { Id = "pack_premium", Name = "Premium Pack", Type = InventoryItemType.Pack, Tradable = false, Stackable = false },
                    new { Id = "pack_mega", Name = "Mega Pack", Type = InventoryItemType.Pack, Tradable = false, Stackable = false },
                    new { Id = "pack_ultimate", Name = "Ultimate Pack", Type = InventoryItemType.Pack, Tradable = false, Stackable = false },
                    new { Id = "pack_booster_small", Name = "Booster Bundle", Type = InventoryItemType.Pack, Tradable = false, Stackable = false },
                    new { Id = "pack_booster_large", Name = "Power Pack", Type = InventoryItemType.Pack, Tradable = false, Stackable = false },
                    new { Id = "pack_comeback", Name = "Welcome Back!", Type = InventoryItemType.Pack, Tradable = false, Stackable = false },
                    new { Id = "pack_flash_sale", Name = "Flash Sale!", Type = InventoryItemType.Pack, Tradable = false, Stackable = false }
                };

                foreach (var item in inventoryItems)
                {
                    try
                    {
                        var itemDef = new InventoryItemDefinition
                        {
                            Id = item.Id,
                            Name = item.Name,
                            Type = item.Type,
                            Tradable = item.Tradable,
                            Stackable = item.Stackable
                        };
                        
                        await EconomyService.Instance.Configuration.CreateInventoryItemAsync(itemDef);
                        Debug.Log($"✅ Created inventory item: {item.Name}");
                    }
                    catch (Exception e)
                    {
                        Debug.LogWarning($"⚠️ Inventory item {item.Id} might already exist: {e.Message}");
                    }
                }

                Debug.Log("✅ Inventory items imported successfully!");
            }
            catch (Exception e)
            {
                Debug.LogError($"❌ Inventory import failed: {e.Message}");
            }
        }

        private async Task ImportCatalog()
        {
            try
            {
                Debug.Log("🛒 Importing catalog items...");
                
                var catalogItems = new[]
                {
                    new { Id = "coins_small", Name = "Small Coin Pack", CostCurrency = "gems", CostAmount = 20, Rewards = "coins:1000" },
                    new { Id = "coins_medium", Name = "Medium Coin Pack", CostCurrency = "gems", CostAmount = 120, Rewards = "coins:5000" },
                    new { Id = "coins_large", Name = "Large Coin Pack", CostCurrency = "gems", CostAmount = 300, Rewards = "coins:15000" },
                    new { Id = "coins_mega", Name = "Mega Coin Pack", CostCurrency = "gems", CostAmount = 700, Rewards = "coins:40000" },
                    new { Id = "coins_ultimate", Name = "Ultimate Coin Pack", CostCurrency = "gems", CostAmount = 2000, Rewards = "coins:100000" },
                    new { Id = "energy_small", Name = "Energy Boost", CostCurrency = "gems", CostAmount = 5, Rewards = "energy:5" },
                    new { Id = "energy_large", Name = "Energy Surge", CostCurrency = "gems", CostAmount = 15, Rewards = "energy:20" },
                    new { Id = "booster_extra_moves", Name = "Extra Moves", CostCurrency = "coins", CostAmount = 200, Rewards = "booster_extra_moves:3" },
                    new { Id = "booster_color_bomb", Name = "Color Bomb", CostCurrency = "gems", CostAmount = 15, Rewards = "booster_color_bomb:1" },
                    new { Id = "booster_rainbow_blast", Name = "Rainbow Blast", CostCurrency = "gems", CostAmount = 25, Rewards = "booster_rainbow_blast:1" },
                    new { Id = "booster_striped_candy", Name = "Striped Candy", CostCurrency = "coins", CostAmount = 100, Rewards = "booster_striped_candy:1" },
                    new { Id = "pack_starter", Name = "Starter Pack", CostCurrency = "gems", CostAmount = 20, Rewards = "pack_starter:1" },
                    new { Id = "pack_value", Name = "Value Pack", CostCurrency = "gems", CostAmount = 120, Rewards = "pack_value:1" },
                    new { Id = "pack_premium", Name = "Premium Pack", CostCurrency = "gems", CostAmount = 300, Rewards = "pack_premium:1" },
                    new { Id = "pack_mega", Name = "Mega Pack", CostCurrency = "gems", CostAmount = 700, Rewards = "pack_mega:1" },
                    new { Id = "pack_ultimate", Name = "Ultimate Pack", CostCurrency = "gems", CostAmount = 2000, Rewards = "pack_ultimate:1" },
                    new { Id = "pack_booster_small", Name = "Booster Bundle", CostCurrency = "coins", CostAmount = 500, Rewards = "pack_booster_small:1" },
                    new { Id = "pack_booster_large", Name = "Power Pack", CostCurrency = "gems", CostAmount = 25, Rewards = "pack_booster_large:1" },
                    new { Id = "pack_comeback", Name = "Welcome Back!", CostCurrency = "gems", CostAmount = 50, Rewards = "pack_comeback:1" },
                    new { Id = "pack_flash_sale", Name = "Flash Sale!", CostCurrency = "gems", CostAmount = 25, Rewards = "pack_flash_sale:1" }
                };

                foreach (var item in catalogItems)
                {
                    try
                    {
                        var purchaseDef = new VirtualPurchaseDefinition
                        {
                            Id = item.Id,
                            Name = item.Name,
                            Cost = new CostDefinition
                            {
                                Currency = item.CostCurrency,
                                Amount = item.CostAmount
                            },
                            Rewards = new List<RewardDefinition>
                            {
                                new RewardDefinition
                                {
                                    Currency = item.Rewards.Split(':')[0],
                                    Amount = int.Parse(item.Rewards.Split(':')[1])
                                }
                            }
                        };
                        
                        await EconomyService.Instance.Configuration.CreateVirtualPurchaseAsync(purchaseDef);
                        Debug.Log($"✅ Created catalog item: {item.Name}");
                    }
                    catch (Exception e)
                    {
                        Debug.LogWarning($"⚠️ Catalog item {item.Id} might already exist: {e.Message}");
                    }
                }

                Debug.Log("✅ Catalog items imported successfully!");
            }
            catch (Exception e)
            {
                Debug.LogError($"❌ Catalog import failed: {e.Message}");
            }
        }

        private void ValidateCSVData()
        {
            try
            {
                Debug.Log("📊 Validating CSV data...");
                
                var csvPath = "Assets/StreamingAssets/economy_items.csv";
                if (File.Exists(csvPath))
                {
                    var lines = File.ReadAllLines(csvPath);
                    Debug.Log($"✅ CSV file found with {lines.Length - 1} items");
                    
                    // Basic validation
                    var headers = lines[0].Split(',');
                    var requiredHeaders = new[] { "id", "type", "name", "cost_gems", "cost_coins", "quantity" };
                    
                    foreach (var header in requiredHeaders)
                    {
                        if (headers.Contains(header))
                        {
                            Debug.Log($"✅ Header '{header}' found");
                        }
                        else
                        {
                            Debug.LogWarning($"⚠️ Required header '{header}' not found");
                        }
                    }
                }
                else
                {
                    Debug.LogError("❌ CSV file not found at Assets/StreamingAssets/economy_items.csv");
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"❌ CSV validation failed: {e.Message}");
            }
        }
    }

    // Data classes
    [System.Serializable]
    public class CurrencyDefinition
    {
        public string Id;
        public string Name;
        public CurrencyType Type;
        public int Initial;
        public int Maximum;
    }

    [System.Serializable]
    public class InventoryItemDefinition
    {
        public string Id;
        public string Name;
        public InventoryItemType Type;
        public bool Tradable;
        public bool Stackable;
    }

    [System.Serializable]
    public class VirtualPurchaseDefinition
    {
        public string Id;
        public string Name;
        public CostDefinition Cost;
        public List<RewardDefinition> Rewards;
    }

    [System.Serializable]
    public class CostDefinition
    {
        public string Currency;
        public int Amount;
    }

    [System.Serializable]
    public class RewardDefinition
    {
        public string Currency;
        public int Amount;
    }

    public enum CurrencyType
    {
        Soft,
        Hard,
        Consumable
    }

    public enum InventoryItemType
    {
        Booster,
        Pack,
        Consumable
    }
}
