extends Node

class_name IAPManager

signal purchase_completed(sku, success)

var _prices := {
    "remove_ads": 2.99,
    "cosmetic_pack_basic": 0.99,
    "cosmetic_pack_deluxe": 4.99,
    "starter_pack_small": 1.99,
    "starter_pack_large": 9.99,
}

func _ready() -> void:
    _init_platform()

func get_price_usd(sku: String) -> float:
    return _prices.get(sku, 0.0)

func purchase_item(sku: String) -> void:
    if OS.get_name() == "Android" and Engine.has_singleton("IAPBridge"):
        var iap = Engine.get_singleton("IAPBridge")
        if iap:
            _connect_iap_signals(iap)
            iap.purchase(sku)
            return
    # iOS or editor fallback: simulate purchase
    await get_tree().create_timer(0.2).timeout
    _handle_purchase_success(sku, "simulated")

func restore_purchases() -> void:
    if OS.get_name() == "Android" and Engine.has_singleton("IAPBridge"):
        var iap = Engine.get_singleton("IAPBridge")
        if iap:
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
    _handle_purchase_success(sku, order_id)

func _on_iap_failed(reason: String) -> void:
    purchase_completed.emit("", false)

func _handle_purchase_success(sku: String, order_id: String) -> void:
    var category := "consumable"
    if sku == "remove_ads":
        GameState.purchase_remove_ads()
        category = "non_consumable"
    elif sku.begins_with("cosmetic"):
        GameState.own_cosmetic(sku)
        category = "cosmetic"
    elif sku.begins_with("starter_pack"):
        GameState.add_coins(500)
        category = "bundle"
    Analytics.track_purchase(_store_name(), "USD", get_price_usd(sku), sku, category)
    purchase_completed.emit(sku, true)

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
