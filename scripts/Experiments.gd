extends Node

class_name Experiments

var _assignments: Dictionary = {}
var _save_path := "user://exp.json"

func _ready() -> void:
    _load()

func get_variant(name: String, variants: Array[String]) -> String:
    if _assignments.has(name):
        return String(_assignments[name])
    var seed := hash(name + str(GameState.first_install_day))
    var idx := abs(seed) % max(1, variants.size())
    var v := variants[idx]
    _assignments[name] = v
    _save()
    return v

func _load() -> void:
    var f := FileAccess.open(_save_path, FileAccess.READ)
    if f:
        var d = JSON.parse_string(f.get_as_text())
        f.close()
        if typeof(d) == TYPE_DICTIONARY:
            _assignments = d

func _save() -> void:
    var f := FileAccess.open(_save_path, FileAccess.WRITE)
    if f:
        f.store_string(JSON.stringify(_assignments))
        f.close()
