using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using Evergreen.Platform;

namespace Evergreen.Platform
{
    /// <summary>
    /// Platform-specific IAP adapter that handles different billing systems based on target platform
    /// </summary>
    public class IAPPlatformAdapter : MonoBehaviour
    {
        [Header("IAP Configuration")]
        [SerializeField] private bool enableIAP = true;
        [SerializeField] private bool enableConsumableProducts = true;
        [SerializeField] private bool enableNonConsumableProducts = true;
        [SerializeField] private bool enableSubscriptions = true;
        
        [Header("IAP Settings")]
        [SerializeField] private float purchaseTimeout = 30f;
        [SerializeField] private int maxRetryAttempts = 3;
        [SerializeField] private bool enableReceiptValidation = true;
        
        private PlatformProfile _profile;
        private Dictionary<string, ProductInfo> _products = new Dictionary<string, ProductInfo>();
        private Dictionary<string, PurchaseInfo> _purchases = new Dictionary<string, PurchaseInfo>();
        private bool _isInitialized = false;
        
        // Events
        public System.Action<bool> OnIAPInitialized;
        public System.Action<string> OnPurchaseSuccess;
        public System.Action<string, string> OnPurchaseFailed;
        public System.Action<string> OnPurchaseRestored;
        public System.Action<string> OnSubscriptionUpdated;
        
        void Start()
        {
            if (enableIAP)
            {
                InitializeIAP();
            }
        }
        
        public void Initialize(PlatformProfile profile)
        {
            _profile = profile;
            Debug.Log($"💳 Initializing IAP Adapter for {profile.platform}");
            
            // Check if IAP is enabled for this platform
            if (!IsIAPEnabledForPlatform())
            {
                Debug.Log("💳 IAP disabled for this platform");
                return;
            }
            
            // Configure products based on platform
            ConfigureProducts();
            
            // Initialize platform-specific IAP SDK
            InitializePlatformIAP();
        }
        
        private bool IsIAPEnabledForPlatform()
        {
            if (_profile?.monetization?.iapEnabled == false)
            {
                return false;
            }
            
            switch (_profile.platform)
            {
                case "poki":
                    return false; // Poki doesn't support IAP
                case "googleplay":
                case "appstore":
                    return true;
                default:
                    return false;
            }
        }
        
        private void ConfigureProducts()
        {
            Debug.Log("🛍️ Configuring products...");
            
            // Add platform-specific products
            AddPlatformProducts();
        }
        
        private void AddPlatformProducts()
        {
            switch (_profile.platform)
            {
                case "googleplay":
                    AddGooglePlayProducts();
                    break;
                case "appstore":
                    AddAppStoreProducts();
                    break;
            }
        }
        
        private void AddGooglePlayProducts()
        {
            Debug.Log("🤖 Adding Google Play products...");
            
            // Add consumable products
            if (enableConsumableProducts)
            {
                AddProduct("coins_100", "100 Coins", "com.yourcompany.yourgame.coins100", 0.99f, ProductType.Consumable);
                AddProduct("coins_500", "500 Coins", "com.yourcompany.yourgame.coins500", 4.99f, ProductType.Consumable);
                AddProduct("coins_1000", "1000 Coins", "com.yourcompany.yourgame.coins1000", 9.99f, ProductType.Consumable);
            }
            
            // Add non-consumable products
            if (enableNonConsumableProducts)
            {
                AddProduct("remove_ads", "Remove Ads", "com.yourcompany.yourgame.remove_ads", 2.99f, ProductType.NonConsumable);
                AddProduct("premium_pack", "Premium Pack", "com.yourcompany.yourgame.premium_pack", 9.99f, ProductType.NonConsumable);
            }
            
            // Add subscriptions
            if (enableSubscriptions)
            {
                AddProduct("monthly_sub", "Monthly Subscription", "com.yourcompany.yourgame.monthly_sub", 4.99f, ProductType.Subscription);
                AddProduct("yearly_sub", "Yearly Subscription", "com.yourcompany.yourgame.yearly_sub", 49.99f, ProductType.Subscription);
            }
        }
        
        private void AddAppStoreProducts()
        {
            Debug.Log("🍎 Adding App Store products...");
            
            // Add consumable products
            if (enableConsumableProducts)
            {
                AddProduct("coins_100", "100 Coins", "com.yourcompany.yourgame.coins100", 0.99f, ProductType.Consumable);
                AddProduct("coins_500", "500 Coins", "com.yourcompany.yourgame.coins500", 4.99f, ProductType.Consumable);
                AddProduct("coins_1000", "1000 Coins", "com.yourcompany.yourgame.coins1000", 9.99f, ProductType.Consumable);
            }
            
            // Add non-consumable products
            if (enableNonConsumableProducts)
            {
                AddProduct("remove_ads", "Remove Ads", "com.yourcompany.yourgame.remove_ads", 2.99f, ProductType.NonConsumable);
                AddProduct("premium_pack", "Premium Pack", "com.yourcompany.yourgame.premium_pack", 9.99f, ProductType.NonConsumable);
            }
            
            // Add subscriptions
            if (enableSubscriptions)
            {
                AddProduct("monthly_sub", "Monthly Subscription", "com.yourcompany.yourgame.monthly_sub", 4.99f, ProductType.Subscription);
                AddProduct("yearly_sub", "Yearly Subscription", "com.yourcompany.yourgame.yearly_sub", 49.99f, ProductType.Subscription);
            }
        }
        
        private void AddProduct(string productId, string displayName, string storeId, float price, ProductType type)
        {
            var product = new ProductInfo
            {
                productId = productId,
                displayName = displayName,
                storeId = storeId,
                price = price,
                type = type,
                isAvailable = false
            };
            
            _products[productId] = product;
            Debug.Log($"🛍️ Added product: {displayName} (${price:F2})");
        }
        
        private void InitializePlatformIAP()
        {
            switch (_profile.platform)
            {
                case "googleplay":
                    InitializeGooglePlayIAP();
                    break;
                case "appstore":
                    InitializeAppStoreIAP();
                    break;
                default:
                    Debug.LogWarning($"⚠️ IAP not supported for platform: {_profile.platform}");
                    break;
            }
        }
        
        private void InitializeGooglePlayIAP()
        {
            Debug.Log("🤖 Initializing Google Play IAP...");
            
#if UNITY_ANDROID && GOOGLE_PLAY_PLATFORM
            // Initialize Google Play Billing
            InitializeGooglePlayBilling();
#else
            Debug.LogWarning("⚠️ Google Play platform not detected, using fallback IAP");
            InitializeFallbackIAP();
#endif
        }
        
        private void InitializeAppStoreIAP()
        {
            Debug.Log("🍎 Initializing App Store IAP...");
            
#if UNITY_IOS && APP_STORE_PLATFORM
            // Initialize StoreKit
            InitializeStoreKit();
#else
            Debug.LogWarning("⚠️ App Store platform not detected, using fallback IAP");
            InitializeFallbackIAP();
#endif
        }
        
        private void InitializeFallbackIAP()
        {
            Debug.Log("🔄 Initializing fallback IAP...");
            
            // Use Unity IAP as fallback
            InitializeUnityIAP();
        }
        
#if UNITY_ANDROID && GOOGLE_PLAY_PLATFORM
        private void InitializeGooglePlayBilling()
        {
            Debug.Log("💳 Initializing Google Play Billing...");
            
            // Google Play Billing initialization would go here
            // This is a placeholder for the actual Google Play Billing integration
            
            _isInitialized = true;
            OnIAPInitialized?.Invoke(true);
        }
#endif
        
#if UNITY_IOS && APP_STORE_PLATFORM
        private void InitializeStoreKit()
        {
            Debug.Log("🛒 Initializing StoreKit...");
            
            // StoreKit initialization would go here
            // This is a placeholder for the actual StoreKit integration
            
            _isInitialized = true;
            OnIAPInitialized?.Invoke(true);
        }
#endif
        
        private void InitializeUnityIAP()
        {
            Debug.Log("🛍️ Initializing Unity IAP...");
            
            // Unity IAP initialization would go here
            // This is a placeholder for the actual Unity IAP integration
            
            _isInitialized = true;
            OnIAPInitialized?.Invoke(true);
        }
        
        // Public API Methods
        
        public void PurchaseProduct(string productId)
        {
            if (!_isInitialized)
            {
                Debug.LogError("❌ IAP not initialized");
                OnPurchaseFailed?.Invoke(productId, "IAP not initialized");
                return;
            }
            
            if (!_products.ContainsKey(productId))
            {
                Debug.LogError($"❌ Product not found: {productId}");
                OnPurchaseFailed?.Invoke(productId, "Product not found");
                return;
            }
            
            var product = _products[productId];
            if (!product.isAvailable)
            {
                Debug.LogError($"❌ Product not available: {productId}");
                OnPurchaseFailed?.Invoke(productId, "Product not available");
                return;
            }
            
            Debug.Log($"💳 Purchasing product: {product.displayName}");
            
            switch (_profile.platform)
            {
                case "googleplay":
                    PurchaseGooglePlayProduct(product);
                    break;
                case "appstore":
                    PurchaseAppStoreProduct(product);
                    break;
                default:
                    PurchaseFallbackProduct(product);
                    break;
            }
        }
        
        public void RestorePurchases()
        {
            if (!_isInitialized)
            {
                Debug.LogError("❌ IAP not initialized");
                return;
            }
            
            Debug.Log("🔄 Restoring purchases...");
            
            switch (_profile.platform)
            {
                case "googleplay":
                    RestoreGooglePlayPurchases();
                    break;
                case "appstore":
                    RestoreAppStorePurchases();
                    break;
                default:
                    RestoreFallbackPurchases();
                    break;
            }
        }
        
        public bool IsProductAvailable(string productId)
        {
            return _products.ContainsKey(productId) && _products[productId].isAvailable;
        }
        
        public ProductInfo GetProductInfo(string productId)
        {
            return _products.ContainsKey(productId) ? _products[productId] : null;
        }
        
        public List<ProductInfo> GetAllProducts()
        {
            return new List<ProductInfo>(_products.Values);
        }
        
        public bool HasPurchased(string productId)
        {
            return _purchases.ContainsKey(productId);
        }
        
        public PurchaseInfo GetPurchaseInfo(string productId)
        {
            return _purchases.ContainsKey(productId) ? _purchases[productId] : null;
        }
        
        // Platform-specific purchase implementations
        
        private void PurchaseGooglePlayProduct(ProductInfo product)
        {
#if UNITY_ANDROID && GOOGLE_PLAY_PLATFORM
            Debug.Log($"🤖 Purchasing Google Play product: {product.displayName}");
            // Google Play Billing purchase implementation
            OnPurchaseSuccess?.Invoke(product.productId);
#else
            PurchaseFallbackProduct(product);
#endif
        }
        
        private void PurchaseAppStoreProduct(ProductInfo product)
        {
#if UNITY_IOS && APP_STORE_PLATFORM
            Debug.Log($"🍎 Purchasing App Store product: {product.displayName}");
            // StoreKit purchase implementation
            OnPurchaseSuccess?.Invoke(product.productId);
#else
            PurchaseFallbackProduct(product);
#endif
        }
        
        private void PurchaseFallbackProduct(ProductInfo product)
        {
            Debug.Log($"🔄 Purchasing fallback product: {product.displayName}");
            // Fallback purchase implementation
            OnPurchaseSuccess?.Invoke(product.productId);
        }
        
        private void RestoreGooglePlayPurchases()
        {
#if UNITY_ANDROID && GOOGLE_PLAY_PLATFORM
            Debug.Log("🤖 Restoring Google Play purchases...");
            // Google Play Billing restore implementation
#else
            RestoreFallbackPurchases();
#endif
        }
        
        private void RestoreAppStorePurchases()
        {
#if UNITY_IOS && APP_STORE_PLATFORM
            Debug.Log("🍎 Restoring App Store purchases...");
            // StoreKit restore implementation
#else
            RestoreFallbackPurchases();
#endif
        }
        
        private void RestoreFallbackPurchases()
        {
            Debug.Log("🔄 Restoring fallback purchases...");
            // Fallback restore implementation
        }
        
        // Utility Methods
        
        public void ConsumeProduct(string productId)
        {
            if (_products.ContainsKey(productId) && _products[productId].type == ProductType.Consumable)
            {
                _purchases.Remove(productId);
                Debug.Log($"🔄 Consumed product: {productId}");
            }
        }
        
        public void RefreshProducts()
        {
            Debug.Log("🔄 Refreshing products...");
            
            // Refresh product availability
            foreach (var product in _products.Values)
            {
                product.isAvailable = true; // Placeholder
            }
        }
        
        public bool IsIAPSupported()
        {
            return _isInitialized && IsIAPEnabledForPlatform();
        }
        
        public string GetPlatformName()
        {
            return _profile?.platform ?? "unknown";
        }
    }
    
    // Data Classes
    
    [System.Serializable]
    public class ProductInfo
    {
        public string productId;
        public string displayName;
        public string storeId;
        public float price;
        public ProductType type;
        public bool isAvailable;
    }
    
    [System.Serializable]
    public class PurchaseInfo
    {
        public string productId;
        public string transactionId;
        public System.DateTime purchaseTime;
        public string receipt;
        public bool isConsumed;
    }
    
    public enum ProductType
    {
        Consumable,
        NonConsumable,
        Subscription
    }
}