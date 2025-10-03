package com.evergreen.iapbridge;

import android.app.Activity;
import android.util.Log;

import androidx.annotation.NonNull;

import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.AcknowledgePurchaseResponseListener;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.ProductDetailsParams;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;

import org.godotengine.godot.Godot;
import org.godotengine.godot.plugin.GodotPlugin;
import org.godotengine.godot.plugin.SignalInfo;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class IAPBridge extends GodotPlugin implements PurchasesUpdatedListener {
    private static final String TAG = "IAPBridge";

    private BillingClient billingClient;
    private Map<String, ProductDetails> skuToDetails = new HashMap<>();

    public IAPBridge(Godot godot) {
        super(godot);
        Activity activity = getActivity();
        billingClient = BillingClient.newBuilder(activity)
                .setListener(this)
                .enablePendingPurchases()
                .build();
        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(@NonNull BillingResult billingResult) {
                Log.d(TAG, "Billing setup: " + billingResult.getResponseCode());
            }

            @Override
            public void onBillingServiceDisconnected() {
                Log.w(TAG, "Billing disconnected");
            }
        });
    }

    @NonNull
    @Override
    public String getPluginName() {
        return "IAPBridge";
    }

    @NonNull
    @Override
    public List<String> getPluginMethods() {
        return Arrays.asList(
                "querySkus",
                "purchase",
                "restore",
                "getPriceString"
        );
    }

    @NonNull
    @Override
    public List<SignalInfo> getPluginSignals() {
        return Arrays.asList(
                new SignalInfo("purchase_success", String.class, String.class), // sku, orderId
                new SignalInfo("purchase_failed", String.class),
                new SignalInfo("restore_complete")
        );
    }

    public void querySkus(String[] skus) {
        final Activity activity = getActivity();
        activity.runOnUiThread(() -> {
            List<ProductDetailsParams.Product> products = new ArrayList<>();
            for (String sku : skus) {
                products.add(ProductDetailsParams.Product.newBuilder()
                        .setProductId(sku)
                        .setProductType(BillingClient.ProductType.INAPP)
                        .build());
            }
            ProductDetailsParams params = ProductDetailsParams.newBuilder()
                    .setProductList(products)
                    .build();
            billingClient.queryProductDetailsAsync(params, (billingResult, productDetailsList) -> {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK && productDetailsList != null) {
                    for (ProductDetails pd : productDetailsList) {
                        skuToDetails.put(pd.getProductId(), pd);
                    }
                }
            });
        });
    }

    public void purchase(String sku) {
        final Activity activity = getActivity();
        activity.runOnUiThread(() -> {
            ProductDetails details = skuToDetails.get(sku);
            if (details == null) {
                querySkus(new String[]{sku});
                details = skuToDetails.get(sku);
                if (details == null) {
                    Log.w(TAG, "ProductDetails missing for " + sku);
                    return;
                }
            }
            List<ProductDetails.ProductOfferDetails> offers = details.getOneTimePurchaseOfferDetailsList();
            if (offers == null || offers.isEmpty()) {
                Log.w(TAG, "No offer details for " + sku);
                return;
            }
            BillingFlowParams.ProductDetailsParams p = BillingFlowParams.ProductDetailsParams.newBuilder()
                    .setProductDetails(details)
                    .build();
            List<BillingFlowParams.ProductDetailsParams> list = new ArrayList<>();
            list.add(p);
            BillingFlowParams flowParams = BillingFlowParams.newBuilder()
                    .setProductDetailsParamsList(list)
                    .build();
            billingClient.launchBillingFlow(activity, flowParams);
        });
    }

    public void restore() {
        // Google Play auto-restores non-consumables via queryPurchasesAsync
        billingClient.queryPurchasesAsync(BillingClient.ProductType.INAPP, (billingResult, purchasesList) -> {
            if (purchasesList != null) {
                for (Purchase purchase : purchasesList) {
                    handlePurchase(purchase);
                }
            }
            emitSignal("restore_complete");
        });
    }

    public String getPriceString(String sku) {
        ProductDetails details = skuToDetails.get(sku);
        if (details == null) {
            return "";
        }
        List<ProductDetails.ProductOfferDetails> offers = details.getOneTimePurchaseOfferDetailsList();
        if (offers == null || offers.isEmpty()) {
            return "";
        }
        ProductDetails.ProductOfferDetails offer = offers.get(0);
        ProductDetails.OneTimePurchaseOfferDetails price = offer.getOneTimePurchaseOfferDetails();
        if (price != null) {
            return price.getFormattedPrice();
        }
        return "";
    }

    @Override
    public void onPurchasesUpdated(@NonNull BillingResult billingResult, List<Purchase> purchases) {
        if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK && purchases != null) {
            for (Purchase purchase : purchases) {
                handlePurchase(purchase);
            }
        } else {
            emitSignal("purchase_failed", String.valueOf(billingResult.getResponseCode()));
        }
    }

    private void handlePurchase(Purchase purchase) {
        for (String sku : purchase.getProducts()) {
            emitSignal("purchase_success", sku, purchase.getOrderId());
        }
        if (!purchase.isAcknowledged()) {
            AcknowledgePurchaseParams params = AcknowledgePurchaseParams.newBuilder()
                    .setPurchaseToken(purchase.getPurchaseToken())
                    .build();
            billingClient.acknowledgePurchase(params, new AcknowledgePurchaseResponseListener() {
                @Override
                public void onAcknowledgePurchaseResponse(@NonNull BillingResult billingResult) {
                    Log.d(TAG, "Acknowledged: " + billingResult.getResponseCode());
                }
            });
        }
    }
}
