extends Node

class_name Offers

signal offer_available(kind, sku)

enum OfferKind { STARTER, COMEBACK, FLASH }

var _last_flash_day: int = 0
var _save_path := "user://offers.json"
var _flash_offer_end_ts: int = 0

func _ready() -> void:
    _load()
    _check_initial_offers()

func _check_initial_offers() -> void:
    if _ladder_offer_available():
        offer_available.emit(OfferKind.STARTER, _next_ladder_sku())
    elif is_comeback_available():
        offer_available.emit(OfferKind.COMEBACK, "comeback_bundle")
    elif is_flash_available():
        offer_available.emit(OfferKind.FLASH, "coins_medium")

func is_starter_available() -> bool:
    if RemoteConfig.get_int("starter_enabled", 1) != 1:
        return false
    return not GameState.ever_purchased and GameState.session_count_total <= 5

func is_comeback_available() -> bool:
    if RemoteConfig.get_int("comeback_enabled", 1) != 1:
        return false
    var last_day := GameState.last_seen_day
    var today := int(Time.get_unix_time_from_system() / 86400)
    var days := RemoteConfig.get_int("comeback_days", 7)
    return (today - last_day) >= days

func is_flash_available() -> bool:
    var today := int(Time.get_unix_time_from_system() / 86400)
    if _last_flash_day == today:
        return false
    _last_flash_day = today
    var seconds := RemoteConfig.get_int("flash_offer_seconds", 3600)
    _flash_offer_end_ts = int(Time.get_unix_time_from_system()) + seconds
    _save()
    return true

func describe_offer(kind: int) -> Dictionary:
    match kind:
        OfferKind.STARTER:
            return {"title": "Starter Pack", "sku": _next_ladder_sku(), "bonus": RemoteConfig.get_int("starter_discount_pct", 50)}
        OfferKind.COMEBACK:
            return {"title": "Welcome Back Bundle", "sku": "comeback_bundle", "coins": RemoteConfig.get_int("comeback_bonus_coins", 800)}
        OfferKind.FLASH:
            return {"title": "Flash Deal", "sku": "coins_medium", "bonus": 20, "ends_at": _flash_offer_end_ts}
        _:
            return {}

func accept_offer(kind: int) -> void:
    var info := describe_offer(kind)
    if info.has("sku"):
        IAPManager.purchase_item(String(info["sku"]))

func _ladder_enabled() -> bool:
    return RemoteConfig.get_int("ladder_enabled", 1) == 1

func _next_ladder_sku() -> String:
    if not _ladder_enabled():
        return "starter_pack_small"
    # Simple 2-stage ladder based on purchase state
    if not GameState.ever_purchased:
        return RemoteConfig.get_string("ladder_stage1_sku", "starter_pack_small")
    return RemoteConfig.get_string("ladder_stage2_sku", "starter_pack_large")

func _ladder_offer_available() -> bool:
    if not _ladder_enabled():
        return is_starter_available()
    # Stage 1: show if not purchased
    if not GameState.ever_purchased:
        return is_starter_available()
    # Stage 2: small delay after first purchase
    return GameState.session_count_total >= 3

func _load() -> void:
    var f := FileAccess.open(_save_path, FileAccess.READ)
    if f:
        var d = JSON.parse_string(f.get_as_text())
        f.close()
        if typeof(d) == TYPE_DICTIONARY:
            _last_flash_day = int(d.get("last_flash_day", 0))
            _flash_offer_end_ts = int(d.get("flash_offer_end_ts", 0))

func _save() -> void:
    var d := {"last_flash_day": _last_flash_day, "flash_offer_end_ts": _flash_offer_end_ts}
    var f := FileAccess.open(_save_path, FileAccess.WRITE)
    if f:
        f.store_string(JSON.stringify(d))
        f.close()
