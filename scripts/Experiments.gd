extends Node

class_name Experiments

var _assignments: Dictionary = {}
var _save_path := "user://exp.json"
var _guardrails := {"min_d1": 0.35, "min_d7": 0.12}

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

func get_variant_and_track(name: String, variants: Array[String]) -> String:
    var v := get_variant(name, variants)
    if Engine.has_singleton("Analytics"):
        Analytics.custom_event("exp_assign", name + ":" + v)
    return v

func should_stop_experiment(metrics: Dictionary) -> bool:
    # Simple local guardrail: if retention proxies drop below min thresholds
    var d1 := float(metrics.get("d1", 1.0))
    var d7 := float(metrics.get("d7", 1.0))
    return d1 < float(_guardrails.get("min_d1", 0.0)) or d7 < float(_guardrails.get("min_d7", 0.0))

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
