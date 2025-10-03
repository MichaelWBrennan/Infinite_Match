extends Node

class_name SeasonPass

signal xp_changed(xp, level)
signal premium_unlocked()

var xp: int = 0
var level: int = 0
var premium: bool = false
var claimed_free: Dictionary = {}
var claimed_premium: Dictionary = {}
var _save_path := "user://seasonpass.json"

const XP_PER_LEVEL := 100

func _ready() -> void:
    _load()

func add_xp(amount: int) -> void:
    var add := max(0, amount)
    xp += add
    var new_level := xp / XP_PER_LEVEL
    if new_level != level:
        level = new_level
    xp_changed.emit(xp, level)
    _save()

func can_claim_free(level_idx: int) -> bool:
    return level >= level_idx and not bool(claimed_free.get(str(level_idx), false))

func can_claim_premium(level_idx: int) -> bool:
    return premium and level >= level_idx and not bool(claimed_premium.get(str(level_idx), false))

func claim_free(level_idx: int) -> int:
    if not can_claim_free(level_idx):
        return 0
    var base := RemoteConfig.get_int("season_free_coin_base", 50)
    var amount := base + level_idx * 5
    GameState.add_coins(amount)
    claimed_free[str(level_idx)] = true
    _save()
    return amount

func claim_premium(level_idx: int) -> int:
    if not can_claim_premium(level_idx):
        return 0
    var base := RemoteConfig.get_int("season_premium_coin_base", 100)
    var amount := base + level_idx * 10
    GameState.add_coins(amount)
    claimed_premium[str(level_idx)] = true
    _save()
    return amount

func unlock_premium() -> void:
    if not premium:
        premium = true
        premium_unlocked.emit()
        _save()

func is_premium() -> bool:
    return premium

func _load() -> void:
    var f := FileAccess.open(_save_path, FileAccess.READ)
    if f:
        var d = JSON.parse_string(f.get_as_text())
        f.close()
        if typeof(d) == TYPE_DICTIONARY:
            xp = int(d.get("xp", 0))
            level = int(d.get("level", xp / XP_PER_LEVEL))
            premium = bool(d.get("premium", false))
            claimed_free = d.get("claimed_free", {})
            claimed_premium = d.get("claimed_premium", {})

func _save() -> void:
    var d := {"xp": xp, "level": level, "premium": premium, "claimed_free": claimed_free, "claimed_premium": claimed_premium}
    var f := FileAccess.open(_save_path, FileAccess.WRITE)
    if f:
        f.store_string(JSON.stringify(d))
        f.close()
