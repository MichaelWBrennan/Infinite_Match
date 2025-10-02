extends Node

class_name Economy

var _data: Dictionary = {}

func _ready() -> void:
    _load()

func booster_cost(name: String) -> int:
    var boosters := _data.get("boosters", {})
    return int(boosters.get(name, 0))

func _load() -> void:
    var path := "res://config/economy.json"
    if not FileAccess.file_exists(path):
        _data = {"boosters": {"bomb": 50, "hammer": 30, "shuffle": 20, "rocket": 40}}
        return
    var f := FileAccess.open(path, FileAccess.READ)
    if f:
        var d = JSON.parse_string(f.get_as_text())
        f.close()
        if typeof(d) == TYPE_DICTIONARY:
            _data = d
        else:
            _data = {}
