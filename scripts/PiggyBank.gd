extends Node

class_name PiggyBank

signal piggy_changed(current, max)

var amount_current: int = 0
var amount_max: int = 0
var unlocked_today: int = 0
var _save_path := "user://piggy.json"

func _ready() -> void:
    amount_max = RemoteConfig.get_int("piggy_max", 5000)
    _load()

func on_tiles_cleared(cleared: int) -> void:
    if RemoteConfig.get_int("piggy_enabled", 1) != 1:
        return
    var per := RemoteConfig.get_int("piggy_fill_per_clear", 1)
    var add := int(max(0, cleared)) * per
    amount_current = min(amount_max, amount_current + add)
    piggy_changed.emit(amount_current, amount_max)
    _save()
    Analytics.track_piggy(amount_current, amount_max)

func open_and_collect() -> int:
    if amount_current <= 0:
        return 0
    var coins := amount_current
    amount_current = 0
    piggy_changed.emit(amount_current, amount_max)
    _save()
    GameState.add_coins(coins)
    Analytics.track_offer("accepted", "piggy", "piggy_bank_open")
    return coins

func get_unlock_price_string() -> String:
    var p := RemoteConfig.get_float("piggy_unlock_price", 2.99)
    return "$%.2f" % p

func _load() -> void:
    var f := FileAccess.open(_save_path, FileAccess.READ)
    if f:
        var d = JSON.parse_string(f.get_as_text())
        f.close()
        if typeof(d) == TYPE_DICTIONARY:
            amount_current = int(d.get("amount_current", 0))
            amount_max = int(d.get("amount_max", amount_max))
            return

func _save() -> void:
    var d := {"amount_current": amount_current, "amount_max": amount_max}
    var f := FileAccess.open(_save_path, FileAccess.WRITE)
    if f:
        f.store_string(JSON.stringify(d))
        f.close()
