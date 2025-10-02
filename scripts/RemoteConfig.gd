extends Node

class_name RemoteConfig

var _cache: Dictionary = {}
var _overrides_path := "user://overrides.json"
var _loaded := false

func _ready() -> void:
    fetch_and_apply()

func fetch_and_apply() -> void:
    if _loaded:
        return
    _loaded = true
    _load_overrides()
    var defaults := {
        "reward_boost": 5,
        "interstitial_interval": 45,
    }
    _cache.merge(defaults, true)
    if Engine.has_singleton("ByteBrew"):
        # Attempt to load remote configs via native plugin if methods are exposed
        var bb = Engine.get_singleton("ByteBrew")
        if bb and bb.has_method("LoadRemoteConfigs"):
            # Use ByteBrewEntry callback bridge
            ByteBrewEntry.on_finish_loading_configs = func(status):
                # After remote configs loaded, attempt to read our keys
                for key in defaults.keys():
                    var value = _bb_get_string(key, str(defaults[key]))
                    _try_merge_string_value(key, value)
                _save_overrides() # persist last known values for offline use
            # Call into native to load
            bb.LoadRemoteConfigs()
        else:
            # No method exposed; keep defaults/overrides
            pass
    else:
        # Simulate small delay and continue with defaults/overrides
        await get_tree().create_timer(0.05).timeout

func get_int(key: String, default_value: int) -> int:
    return int(_cache.get(key, default_value))

func get_string(key: String, default_value: String) -> String:
    return str(_cache.get(key, default_value))

func get_float(key: String, default_value: float) -> float:
    var v = _cache.get(key, default_value)
    if typeof(v) == TYPE_FLOAT:
        return v
    if typeof(v) == TYPE_INT:
        return float(v)
    return default_value

func set_override(key: String, value) -> void:
    _cache[key] = value
    _save_overrides()

func _load_overrides() -> void:
    var f := FileAccess.open(_overrides_path, FileAccess.READ)
    if f:
        var txt := f.get_as_text()
        f.close()
        var d = JSON.parse_string(txt)
        if typeof(d) == TYPE_DICTIONARY:
            _cache.merge(d, true)

func _save_overrides() -> void:
    var f := FileAccess.open(_overrides_path, FileAccess.WRITE)
    if f:
        f.store_string(JSON.stringify(_cache))
        f.close()

func _bb_get_string(key: String, default_value: String) -> String:
    var bb = Engine.get_singleton("ByteBrew")
    if bb and bb.has_method("RetrieveRemoteConfigs"):
        return str(bb.RetrieveRemoteConfigs(key, default_value))
    return default_value

func _try_merge_string_value(key: String, val: String) -> void:
    if key.ends_with("_interval"):
        var n = int(val.to_int())
        _cache[key] = n
    elif key.begins_with("reward_"):
        _cache[key] = int(val.to_int())
    else:
        _cache[key] = val
