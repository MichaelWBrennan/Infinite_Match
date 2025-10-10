using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CloudCode.Utils;

namespace CloudCode.Tests
{
    public class FunctionTests
    {
        public static async Task TestAddCurrency()
        {
            Console.WriteLine("🧪 Testing AddCurrency function...");
            
            var request = new CloudCodeRequest
            {
                Parameters = new Dictionary<string, object>
                {
                    ["currencyId"] = "coins",
                    ["amount"] = 100
                }
            };

            var function = new AddCurrency();
            try
            {
                var result = await function.ExecuteAsync(request);
                Console.WriteLine($"✅ AddCurrency test passed: {result}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ AddCurrency test failed: {ex.Message}");
            }
        }

        public static async Task TestSpendCurrency()
        {
            Console.WriteLine("🧪 Testing SpendCurrency function...");
            
            var request = new CloudCodeRequest
            {
                Parameters = new Dictionary<string, object>
                {
                    ["currencyId"] = "coins",
                    ["amount"] = 50
                }
            };

            var function = new SpendCurrency();
            try
            {
                var result = await function.ExecuteAsync(request);
                Console.WriteLine($"✅ SpendCurrency test passed: {result}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ SpendCurrency test failed: {ex.Message}");
            }
        }

        public static async Task TestAddInventoryItem()
        {
            Console.WriteLine("🧪 Testing AddInventoryItem function...");
            
            var request = new CloudCodeRequest
            {
                Parameters = new Dictionary<string, object>
                {
                    ["itemId"] = "booster_extra_moves",
                    ["quantity"] = 3
                }
            };

            var function = new AddInventoryItem();
            try
            {
                var result = await function.ExecuteAsync(request);
                Console.WriteLine($"✅ AddInventoryItem test passed: {result}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ AddInventoryItem test failed: {ex.Message}");
            }
        }

        public static async Task TestUseInventoryItem()
        {
            Console.WriteLine("🧪 Testing UseInventoryItem function...");
            
            var request = new CloudCodeRequest
            {
                Parameters = new Dictionary<string, object>
                {
                    ["itemId"] = "booster_extra_moves",
                    ["quantity"] = 1
                }
            };

            var function = new UseInventoryItem();
            try
            {
                var result = await function.ExecuteAsync(request);
                Console.WriteLine($"✅ UseInventoryItem test passed: {result}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ UseInventoryItem test failed: {ex.Message}");
            }
        }

        public static void TestValidationUtils()
        {
            Console.WriteLine("🧪 Testing ValidationUtils...");
            
            var parameters = new Dictionary<string, object>
            {
                ["currencyId"] = "coins",
                ["amount"] = 100
            };

            var requiredFields = new[] { "currencyId", "amount" };
            var validators = new Dictionary<string, Func<object, bool>>
            {
                ["currencyId"] = ValidationUtils.IsValidCurrencyId,
                ["amount"] = ValidationUtils.IsPositiveInteger
            };

            var result = ValidationUtils.ValidateParameters(parameters, requiredFields, validators);
            
            if (result.IsValid)
            {
                Console.WriteLine("✅ ValidationUtils test passed");
            }
            else
            {
                Console.WriteLine($"❌ ValidationUtils test failed: {string.Join(", ", result.Errors)}");
            }
        }

        public static async Task RunAllTests()
        {
            Console.WriteLine("🚀 Running Cloud Code Function Tests");
            Console.WriteLine("====================================");
            
            TestValidationUtils();
            await TestAddCurrency();
            await TestSpendCurrency();
            await TestAddInventoryItem();
            await TestUseInventoryItem();
            
            Console.WriteLine("\n🎉 All tests completed!");
        }
    }

    // Mock classes for testing
    public class CloudCodeRequest
    {
        public Dictionary<string, object> Parameters { get; set; } = new();
        
        public T GetParameter<T>(string name, T defaultValue = default)
        {
            if (Parameters.TryGetValue(name, out var value) && value is T typedValue)
                return typedValue;
            return defaultValue;
        }
    }

    public abstract class CloudCodeFunction
    {
        public abstract Task<object> ExecuteAsync(CloudCodeRequest request);
    }

    public static class Logger
    {
        public static void LogInfo(string message) => Console.WriteLine($"INFO: {message}");
        public static void LogError(string message) => Console.WriteLine($"ERROR: {message}");
    }
}