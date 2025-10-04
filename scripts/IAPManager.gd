extends Node

class_name IAPManager

signal purchase_completed(sku, success)

var _prices := {
    "remove_ads": 2.99,
    "cosmetic_pack_basic": 0.99,
    "cosmetic_pack_deluxe": 4.99,
    "starter_pack_small": 1.99,
    "starter_pack_large": 9.99,
    # Consumables
    "coins_small": 0.99,
    "coins_medium": 4.99,
    "coins_large": 9.99,
    "coins_huge": 19.99,
    "energy_refill": 0.99,
    "booster_bundle": 2.99,
    # Piggy bank open (consumable)
    "piggy_bank_open": 2.99,
    # Comeback bundle
    "comeback_bundle": 1.99,
    # Season pass premium unlock
    "season_pass_premium": 4.99,
    # Gem packs (hard currency)
    "gems_small": 0.99,
    "gems_medium": 4.99,
    "gems_large": 9.99,
    "gems_huge": 19.99,
    # Subscriptions
    "vip_sub_monthly": 4.99,
    # Rescue bundle (continue offer)
    "rescue_bundle": 0.99,
}

func _ready() -> void:
    _init_platform()

func get_price_usd(sku: String) -> float:
    return _prices.get(sku, 0.0)

# Returns a localized price string from the store if available; falls back to formatted USD.
func get_price_string(sku: String) -> String:
    if OS.get_name() == "Android" and Engine.has_singleton("IAPBridge"):
        var iap = Engine.get_singleton("IAPBridge")
        if iap and iap.has_method("getPriceString"):
            var s = str(iap.getPriceString(sku))
            if s != "":
                return s
    if OS.get_name() == "iOS" and Engine.has_singleton("IOSPriceBridge"):
        var ios = Engine.get_singleton("IOSPriceBridge")
        if ios and ios.has_method("getPriceString"):
            var sp = str(ios.getPriceString(sku))
            if sp != "":
                return sp
    if OS.get_name() == "iOS":
        # Fallback to remote-config provided localized price if present
        var key := "price_ios_" + sku
        var rc := RemoteConfig.get_string(key, "")
        if rc != "":
            return rc
    var usd := get_price_usd(sku)
    if usd > 0.0:
        return "$%.2f" % usd
    return ""

func purchase_item(sku: String) -> void:
    if OS.get_name() == "Android" and Engine.has_singleton("IAPBridge"):
        var iap = Engine.get_singleton("IAPBridge")
        if iap and iap.has_method("purchase"):
            _connect_iap_signals(iap)
            iap.purchase(sku)
            return
    Analytics.custom_event("iap_fallback_purchase", sku)
    # iOS or editor fallback: simulate purchase
    await get_tree().create_timer(0.2).timeout
    await _verify_and_grant(sku, "simulated")

func restore_purchases() -> void:
    if OS.get_name() == "Android" and Engine.has_singleton("IAPBridge"):
        var iap = Engine.get_singleton("IAPBridge")
        if iap and iap.has_method("restore"):
            _connect_iap_signals(iap)
            iap.restore()
            return
    # iOS/editor: no-op

func _connect_iap_signals(iap) -> void:
    if not iap.is_connected("purchase_success", Callable(self, "_on_iap_success")):
        iap.connect("purchase_success", Callable(self, "_on_iap_success"))
    if not iap.is_connected("purchase_failed", Callable(self, "_on_iap_failed")):
        iap.connect("purchase_failed", Callable(self, "_on_iap_failed"))

func _on_iap_success(sku: String, order_id: String) -> void:
    await _verify_and_grant(sku, order_id)

func _on_iap_failed(reason: String) -> void:
    purchase_completed.emit("", false)

func _grant_items_for_sku(sku: String) -> void:
    var category := "consumable"
    if sku == "remove_ads":
        GameState.purchase_remove_ads()
        category = "non_consumable"
    elif sku.begins_with("cosmetic"):
        GameState.own_cosmetic(sku)
        category = "cosmetic"
    elif sku.begins_with("starter_pack"):
        var key := sku + "_coins"
        var grant := RemoteConfig.get_int(key, sku.ends_with("large") ? 5000 : 500)
        GameState.add_coins(grant)
        category = "bundle"
    elif sku == "coins_small":
        GameState.add_coins(RemoteConfig.get_int("coins_small_amount", 500))
    elif sku == "coins_medium":
        GameState.add_coins(RemoteConfig.get_int("coins_medium_amount", 3000))
    elif sku == "coins_large":
        GameState.add_coins(RemoteConfig.get_int("coins_large_amount", 7500))
    elif sku == "coins_huge":
        GameState.add_coins(RemoteConfig.get_int("coins_huge_amount", 20000))
    elif sku == "energy_refill":
        GameState.refill_energy()
    elif sku == "rescue_bundle":
        # Grant extra moves and a booster for the current session
        if get_tree().current_scene and get_tree().current_scene.has_method("_grant_rescue_bundle"):
            get_tree().current_scene._grant_rescue_bundle()
    elif sku == "booster_bundle":
        # Grant as coins equivalent until dedicated booster inventory exists
        GameState.add_coins(RemoteConfig.get_int("booster_bundle_coins", 1000))
    elif sku == "piggy_bank_open":
        # Open piggy and collect its balance
        PiggyBank.open_and_collect()
    elif sku == "comeback_bundle":
        GameState.add_coins(RemoteConfig.get_int("comeback_bonus_coins", 800))
    elif sku == "season_pass_premium":
        SeasonPass.unlock_premium()
        category = "subscription"
    elif sku == "vip_sub_monthly":
        GameState.set_vip_days(30)
        GameState.purchase_remove_ads()
        category = "subscription"
    elif sku == "gems_small":
        GameState.add_gems(RemoteConfig.get_int("gems_small_amount", 20))
    elif sku == "gems_medium":
        GameState.add_gems(RemoteConfig.get_int("gems_medium_amount", 120))
    elif sku == "gems_large":
        GameState.add_gems(RemoteConfig.get_int("gems_large_amount", 300))
    elif sku == "gems_huge":
        GameState.add_gems(RemoteConfig.get_int("gems_huge_amount", 700))
    # Mark player as purchaser for segmentation
    if GameState.has_method("mark_purchased"):
        GameState.mark_purchased()
    Analytics.track_purchase(_store_name(), "USD", get_price_usd(sku), sku, category)
    purchase_completed.emit(sku, true)
    if Engine.has_singleton("CloudSave"):
        CloudSave.save_profile()

func _should_validate_receipts() -> bool:
    return RemoteConfig.get_int("enable_receipt_validation", 0) == 1 and RemoteConfig.get_string("receipt_validation_url", "") != ""

func _validation_url() -> String:
    return RemoteConfig.get_string("receipt_validation_url", "")

func _device_id() -> String:
    return OS.get_unique_id()

func _platform_name() -> String:
    return _store_name()

func _make_receipt_payload(sku: String, order_id: String) -> Dictionary:
    return {
        "sku": sku,
        "order_id": order_id,
        "platform": _platform_name(),
        "device_id": _device_id(),
        "locale": OS.get_locale(),
        "version": Engine.get_version_info().get("string", "")
    }

func _http_post_json(url: String, payload: Dictionary) -> Dictionary:
    var req := HTTPRequest.new()
    add_child(req)
    var headers := ["Content-Type: application/json"]
    var body := JSON.stringify(payload)
    var err := req.request(url, headers, HTTPClient.METHOD_POST, body)
    if err != OK:
        return {"ok": false, "status": 0, "body": ""}
    var result = await req.request_completed
    # result: [result, response_code, headers, body]
    var code := int(result[1])
    var raw: PackedByteArray = result[3]
    var text := raw.get_string_from_utf8()
    return {"ok": (code >= 200 and code < 300), "status": code, "body": text}

func _validate_receipt(sku: String, order_id: String) -> bool:
    if Engine.has_singleton("Backend") and Backend.base_url() != "":
        return await Backend.verify_receipt(sku, order_id, _platform_name(), _device_id(), OS.get_locale(), Engine.get_version_info().get("string", ""))
    var url := _validation_url()
    if url == "":
        return true
    var resp := await _http_post_json(url, _make_receipt_payload(sku, order_id))
    if not bool(resp.get("ok", false)):
        return false
    var body := String(resp.get("body", ""))
    var parsed = JSON.parse_string(body)
    if typeof(parsed) == TYPE_DICTIONARY:
        if bool(parsed.get("valid", false)):
            return true
    return false

func _verify_and_grant(sku: String, order_id: String) -> void:
    var ok := true
    if _should_validate_receipts():
        ok = await _validate_receipt(sku, order_id)
    if not ok:
        purchase_completed.emit(sku, false)
        Analytics.custom_event("iap_validation_failed", sku)
        return
    _grant_items_for_sku(sku)

func _store_name() -> String:
    if OS.get_name() == "iOS":
        return "apple"
    elif OS.get_name() == "Android":
        return "google"
    return "mock_store"

func _init_platform() -> void:
    if OS.get_name() == "Android" and Engine.has_singleton("IAPBridge"):
        var iap = Engine.get_singleton("IAPBridge")
        if iap and iap.has_method("querySkus"):
            var keys = PackedStringArray(_prices.keys())
            iap.querySkus(keys)

func show_shop(callback: Callable) -> void:
    # Demo helper: attempt purchase of starter pack small
    var sku := "starter_pack_small"
    purchase_item(sku)
    purchase_completed.connect(func(s, ok):
        callback.call(ok, s)
    , CONNECT_ONE_SHOT)
