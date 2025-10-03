extends Node

class_name Quests

signal quests_updated()

var _quests: Array = []
var _last_day: int = 0
var _save_path := "user://quests.json"

func _ready() -> void:
    _load()
    _ensure_daily()

func get_all() -> Array:
    return _quests.duplicate(true)

func add_progress(kind: String, amount: int) -> void:
    if amount <= 0:
        return
    _ensure_daily()
    var changed := false
    for q in _quests:
        if String(q.get("kind", "")) == kind and not bool(q.get("claimed", false)):
            q["progress"] = int(q.get("progress", 0)) + amount
            changed = true
    if changed:
        _save()
        quests_updated.emit()

func can_claim(id: String) -> bool:
    var q := _get(id)
    if q.is_empty():
        return false
    return not bool(q.get("claimed", false)) and int(q.get("progress", 0)) >= int(q.get("target", 0))

func claim(id: String) -> bool:
    if not can_claim(id):
        return false
    var q := _get(id)
    q["claimed"] = true
    var reward_type := String(q.get("reward_type", "coins"))
    var reward := int(q.get("reward", 0))
    if reward_type == "coins":
        GameState.add_coins(reward)
    elif reward_type == "gems":
        GameState.add_gems(reward)
    _save()
    quests_updated.emit()
    return true

func _get(id: String) -> Dictionary:
    for q in _quests:
        if String(q.get("id", "")) == id:
            return q
    return {}

func _ensure_daily() -> void:
    var today := int(Time.get_unix_time_from_system() / 86400)
    if _last_day == today and _quests.size() > 0:
        return
    _last_day = today
    _quests = [
        {"id": "clear_150", "kind": "clear_tiles", "desc": "Clear 150 tiles", "target": 150, "progress": 0, "reward_type": "coins", "reward": 200, "claimed": false},
        {"id": "win_3", "kind": "win_levels", "desc": "Win 3 levels", "target": 3, "progress": 0, "reward_type": "gems", "reward": 5, "claimed": false}
    ]
    _save()
    quests_updated.emit()

func _load() -> void:
    var f := FileAccess.open(_save_path, FileAccess.READ)
    if f:
        var d = JSON.parse_string(f.get_as_text())
        f.close()
        if typeof(d) == TYPE_DICTIONARY:
            _last_day = int(d.get("last_day", 0))
            _quests = d.get("quests", [])

func _save() -> void:
    var d := {"last_day": _last_day, "quests": _quests}
    var f := FileAccess.open(_save_path, FileAccess.WRITE)
    if f:
        f.store_string(JSON.stringify(d))
        f.close()
