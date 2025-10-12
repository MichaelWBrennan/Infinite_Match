using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Purchasing;
using UnityEngine.Purchasing.Extension;
using Evergreen.Game;
using UnityEngine.Networking;

public class IAPManager : MonoBehaviour, IStoreListener
{
    private static IStoreController _controller;
    private static IExtensionProvider _extensions;

    private Dictionary<string, System.Action> _grants = new Dictionary<string, System.Action>();

    void Awake()
    {
        DontDestroyOnLoad(gameObject);
        var builder = ConfigurationBuilder.Instance(StandardPurchasingModule.Instance());
        // Add products - mirror your SKUs
        builder.AddProduct("remove_ads", ProductType.NonConsumable);
        builder.AddProduct("starter_pack_small", ProductType.Consumable);
        builder.AddProduct("starter_pack_large", ProductType.Consumable);
        builder.AddProduct("coins_small", ProductType.Consumable);
        builder.AddProduct("coins_medium", ProductType.Consumable);
        builder.AddProduct("coins_large", ProductType.Consumable);
        builder.AddProduct("coins_huge", ProductType.Consumable);
        builder.AddProduct("energy_refill", ProductType.Consumable);
        builder.AddProduct("booster_bundle", ProductType.Consumable);
        builder.AddProduct("comeback_bundle", ProductType.Consumable);
        builder.AddProduct("season_pass_premium", ProductType.NonConsumable);
        builder.AddProduct("gems_small", ProductType.Consumable);
        builder.AddProduct("gems_medium", ProductType.Consumable);
        builder.AddProduct("gems_large", ProductType.Consumable);
        builder.AddProduct("gems_huge", ProductType.Consumable);
        builder.AddProduct("vip_sub_monthly", ProductType.Subscription);
        // High-value additions
        builder.AddProduct("gems_ultra", ProductType.Consumable); // $49.99 tier
        builder.AddProduct("gems_ultimate", ProductType.Consumable); // $99.99 tier
        builder.AddProduct("vip_sub_annual", ProductType.Subscription); // Annual VIP
        InitializeGrants();
        UnityPurchasing.Initialize(this, builder);
    }

    private void InitializeGrants()
    {
        _grants["remove_ads"] = () => { /* set flag */ };
        _grants["starter_pack_small"] = () => GameState.AddCoins(500);
        _grants["starter_pack_large"] = () => GameState.AddCoins(5000);
        _grants["coins_small"] = () => GameState.AddCoins(500);
        _grants["coins_medium"] = () => GameState.AddCoins(3000);
        _grants["coins_large"] = () => GameState.AddCoins(7500);
        _grants["coins_huge"] = () => GameState.AddCoins(20000);
        _grants["energy_refill"] = () => GameState.RefillEnergy();
        _grants["booster_bundle"] = () => GameState.AddCoins(1000);
        _grants["comeback_bundle"] = () => GameState.AddCoins(800);
        _grants["season_pass_premium"] = () => { /* unlock premium */ };
        _grants["gems_small"] = () => GameState.AddGems(20);
        _grants["gems_medium"] = () => GameState.AddGems(120);
        _grants["gems_large"] = () => GameState.AddGems(300);
        _grants["gems_huge"] = () => GameState.AddGems(700);
        _grants["vip_sub_monthly"] = () => { /* VIP flags */ };
        _grants["gems_ultra"] = () => GameState.AddGems(1600);
        _grants["gems_ultimate"] = () => GameState.AddGems(3500);
        _grants["vip_sub_annual"] = () => { /* VIP flags annual */ };
    }

    public void Purchase(string sku)
    {
        if (_controller == null) return;
        _controller.InitiatePurchase(sku);
    }

    // IStoreListener
    public void OnInitialized(IStoreController controller, IExtensionProvider extensions)
    {
        _controller = controller;
        _extensions = extensions;
    }

    public void OnInitializeFailed(InitializationFailureReason error) {
        Debug.LogError($"IAP init failed: {error}");
    }
    public void OnInitializeFailed(InitializationFailureReason error, string message) {
        Debug.LogError($"IAP init failed: {error} {message}");
    }

    public PurchaseProcessingResult ProcessPurchase(PurchaseEventArgs e)
    {
        var sku = e.purchasedProduct.definition.id;
        // Verify receipt with backend before granting
        var receipt = e.purchasedProduct.receipt;
        StartCoroutine(VerifyAndGrant(sku, receipt));
        return PurchaseProcessingResult.Pending;
    }

    public void OnPurchaseFailed(Product product, PurchaseFailureReason failureReason)
    {
        Debug.LogWarning($"Purchase failed {product.definition.id}: {failureReason}");
    }

    private System.Collections.IEnumerator VerifyAndGrant(string sku, string receipt)
    {
        var url = Evergreen.Game.RemoteConfigService.Get("receipt_validation_url", "http://localhost:3030/verify_receipt");
        var body = new System.Collections.Generic.Dictionary<string, object>{
            {"sku", sku}, {"receipt", receipt}, {"platform", Application.platform.ToString()}, {"locale", Application.systemLanguage.ToString()}, {"version", Application.version}
        };
        var json = Evergreen.Game.MiniJSON.Json.Serialize(body);
        using (var req = new UnityWebRequest(url, UnityWebRequest.kHttpVerbPOST))
        {
            var bytes = System.Text.Encoding.UTF8.GetBytes(json);
            req.uploadHandler = new UploadHandlerRaw(bytes);
            req.downloadHandler = new DownloadHandlerBuffer();
            req.SetRequestHeader("Content-Type", "application/json");
            yield return req.SendWebRequest();
            var ok = req.result == UnityEngine.Networking.UnityWebRequest.Result.Success;
            if (ok && req.downloadHandler.text.Contains("valid"))
            {
                if (_grants.TryGetValue(sku, out var grant)) grant.Invoke();
                Evergreen.Game.AnalyticsAdapter.CustomEvent("purchase", sku);
                Evergreen.Game.CloudSavePlayFab.Instance?.Save();
                _controller.ConfirmPendingPurchase(_controller.products.WithID(sku));
            }
            else
            {
                Debug.LogWarning($"Receipt validation failed for {sku}: {req.error}");
                _controller.ConfirmPendingPurchase(_controller.products.WithID(sku));
            }
        }
    }
}
