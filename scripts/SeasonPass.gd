extends Node

class_name SeasonPass

signal xp_changed(xp, level)
signal premium_unlocked()

var xp: int = 0
var level: int = 0
var premium: bool = false
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

func _save() -> void:
    var d := {"xp": xp, "level": level, "premium": premium}
    var f := FileAccess.open(_save_path, FileAccess.WRITE)
    if f:
        f.store_string(JSON.stringify(d))
        f.close()
