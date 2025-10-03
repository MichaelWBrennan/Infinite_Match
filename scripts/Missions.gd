extends Node
class_name Missions

var active: bool = false
var _save_path := "user://missions.json"
var missions: Array = []

func _ready() -> void:
    active = RemoteConfig.get_int("missions_enabled", 1) == 1
    _load()
    if missions.is_empty():
        missions = [
            {"id":"ftue_swap","desc":"Make your first swap","done":false},
            {"id":"use_booster","desc":"Use any booster","done":false},
            {"id":"watch_ad","desc":"Watch a rewarded ad","done":false}
        ]
        _save()

func mark_done(id: String) -> void:
    for m in missions:
        if String(m.get("id","")) == id:
            m["done"] = true
    _save()

func _load() -> void:
    var f := FileAccess.open(_save_path, FileAccess.READ)
    if f:
        var d = JSON.parse_string(f.get_as_text())
        f.close()
        if typeof(d) == TYPE_DICTIONARY:
            missions = d.get("missions", [])

func _save() -> void:
    var d := {"missions": missions}
    var f := FileAccess.open(_save_path, FileAccess.WRITE)
    if f:
        f.store_string(JSON.stringify(d))
        f.close()
