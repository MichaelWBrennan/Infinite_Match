package com.evergreen.adsbridge;

import android.app.Activity;
import android.util.Log;

import androidx.annotation.NonNull;

import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.OnUserEarnedRewardListener;
import com.google.android.gms.ads.OnPaidEventListener;
import com.google.android.gms.ads.AdValue;
import com.google.android.gms.ads.initialization.InitializationStatus;
import com.google.android.gms.ads.initialization.OnInitializationCompleteListener;
import com.google.android.gms.ads.interstitial.InterstitialAd;
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback;
import com.google.android.gms.ads.rewarded.RewardItem;
import com.google.android.gms.ads.rewarded.RewardedAd;
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback;

import org.godotengine.godot.Godot;
import org.godotengine.godot.plugin.GodotPlugin;
import org.godotengine.godot.plugin.SignalInfo;

import java.util.Arrays;
import java.util.List;

public class AdsBridge extends GodotPlugin {
    private static final String TAG = "AdsBridge";

    private RewardedAd rewardedAd;
    private InterstitialAd interstitialAd;

    private String rewardedUnitId = "ca-app-pub-3940256099942544/5224354917"; // TEST
    private String interstitialUnitId = "ca-app-pub-3940256099942544/1033173712"; // TEST

    private String lastRewardLocation = "unknown";
    private String lastInterstitialLocation = "unknown";

    public AdsBridge(Godot godot) {
        super(godot);
        Activity activity = getActivity();
        MobileAds.initialize(activity, new OnInitializationCompleteListener() {
            @Override
            public void onInitializationComplete(@NonNull InitializationStatus initializationStatus) {
                Log.d(TAG, "MobileAds initialized");
            }
        });
    }

    @NonNull
    @Override
    public String getPluginName() {
        return "AdsBridge";
    }

    @NonNull
    @Override
    public List<String> getPluginMethods() {
        return Arrays.asList(
                "setRewardedUnitId",
                "setInterstitialUnitId",
                "loadRewarded",
                "showRewarded",
                "showRewarded", // overload with (String unitId, String location)
                "loadInterstitial",
                "showInterstitial",
                "showInterstitial" // overload with (String unitId, String location)
        );
    }

    @NonNull
    @Override
    public List<SignalInfo> getPluginSignals() {
        return Arrays.asList(
                new SignalInfo("rewarded_loaded"),
                new SignalInfo("rewarded_failed", String.class),
                new SignalInfo("rewarded_earned", int.class),
                new SignalInfo("interstitial_loaded"),
                new SignalInfo("interstitial_closed"),
                new SignalInfo("ad_paid", String.class, String.class, String.class, String.class, long.class) // provider, adUnit, placementType, location, currency, valueMicros
        );
    }

    public void setRewardedUnitId(String unitId) {
        if (unitId != null && !unitId.isEmpty()) {
            rewardedUnitId = unitId;
        }
    }

    public void setInterstitialUnitId(String unitId) {
        if (unitId != null && !unitId.isEmpty()) {
            interstitialUnitId = unitId;
        }
    }

    public void loadRewarded(String unitId) {
        if (unitId != null && !unitId.isEmpty()) rewardedUnitId = unitId;
        Activity activity = getActivity();
        AdRequest request = new AdRequest.Builder().build();
        RewardedAd.load(activity, rewardedUnitId, request, new RewardedAdLoadCallback() {
            @Override
            public void onAdLoaded(@NonNull RewardedAd ad) {
                rewardedAd = ad;
                emitSignal("rewarded_loaded");
            }

            @Override
            public void onAdFailedToLoad(@NonNull com.google.android.gms.ads.LoadAdError loadAdError) {
                rewardedAd = null;
                emitSignal("rewarded_failed", loadAdError.getMessage());
            }
        });
    }

    public void showRewarded(String unitId) {
        if (unitId != null && !unitId.isEmpty()) rewardedUnitId = unitId;
        final Activity activity = getActivity();
        if (rewardedAd == null) {
            loadRewarded(rewardedUnitId);
            return;
        }
        lastRewardLocation = "unknown";
        rewardedAd.setFullScreenContentCallback(new FullScreenContentCallback() {
            @Override
            public void onAdDismissedFullScreenContent() {
                // Preload next
                rewardedAd = null;
                loadRewarded(rewardedUnitId);
            }

            @Override
            public void onAdFailedToShowFullScreenContent(AdError adError) {
                rewardedAd = null;
            }
        });
        rewardedAd.setOnPaidEventListener(new OnPaidEventListener() {
            @Override
            public void onPaidEvent(@NonNull AdValue adValue) {
                emitSignal("ad_paid", "AdMob", rewardedUnitId, "Reward", lastRewardLocation, adValue.getCurrencyCode(), adValue.getValueMicros());
            }
        });
        rewardedAd.show(activity, new OnUserEarnedRewardListener() {
            @Override
            public void onUserEarnedReward(@NonNull RewardItem rewardItem) {
                int amount = rewardItem.getAmount();
                if (amount <= 0) amount = 1;
                emitSignal("rewarded_earned", amount);
            }
        });
    }

    // Overload with location for better analytics mapping
    public void showRewarded(String unitId, String location) {
        lastRewardLocation = (location != null ? location : "unknown");
        showRewarded(unitId);
    }

    public void loadInterstitial(String unitId) {
        if (unitId != null && !unitId.isEmpty()) interstitialUnitId = unitId;
        Activity activity = getActivity();
        AdRequest request = new AdRequest.Builder().build();
        InterstitialAd.load(activity, interstitialUnitId, request, new InterstitialAdLoadCallback() {
            @Override
            public void onAdLoaded(@NonNull InterstitialAd ad) {
                interstitialAd = ad;
                emitSignal("interstitial_loaded");
            }

            @Override
            public void onAdFailedToLoad(@NonNull com.google.android.gms.ads.LoadAdError loadAdError) {
                interstitialAd = null;
            }
        });
    }

    public void showInterstitial(String unitId) {
        if (unitId != null && !unitId.isEmpty()) interstitialUnitId = unitId;
        final Activity activity = getActivity();
        if (interstitialAd == null) {
            loadInterstitial(interstitialUnitId);
            return;
        }
        lastInterstitialLocation = "unknown";
        interstitialAd.setFullScreenContentCallback(new FullScreenContentCallback() {
            @Override
            public void onAdDismissedFullScreenContent() {
                emitSignal("interstitial_closed");
                interstitialAd = null;
                loadInterstitial(interstitialUnitId);
            }

            @Override
            public void onAdFailedToShowFullScreenContent(AdError adError) {
                interstitialAd = null;
            }
        });
        interstitialAd.setOnPaidEventListener(new OnPaidEventListener() {
            @Override
            public void onPaidEvent(@NonNull AdValue adValue) {
                emitSignal("ad_paid", "AdMob", interstitialUnitId, "Interstitial", lastInterstitialLocation, adValue.getCurrencyCode(), adValue.getValueMicros());
            }
        });
        interstitialAd.show(activity);
    }

    // Overload with location for better analytics mapping
    public void showInterstitial(String unitId, String location) {
        lastInterstitialLocation = (location != null ? location : "unknown");
        showInterstitial(unitId);
    }
}
