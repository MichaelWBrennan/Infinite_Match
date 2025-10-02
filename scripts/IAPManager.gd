extends Node

class_name IAPManager

var _prices := {
    "cosmetic_pack_1": 0.99,
    "cosmetic_pack_2": 2.99,
    "convenience_pack_1": 4.99,
    "convenience_pack_2": 9.99,
    "mega_bundle": 19.99,
}

func show_shop(callback: Callable) -> void:
    # Placeholder: immediately simulate purchase of cheapest pack for demo
    await get_tree().create_timer(0.2).timeout
    var sku := "cosmetic_pack_1"
    Analytics.track_purchase("mock_store", "USD", get_price_usd(sku), sku, "cosmetic")
    callback.call(true, sku)

func get_price_usd(sku: String) -> float:
    return _prices.get(sku, 0.0)
