extends Node
class_name EconomyTelemetry

var _save_path := "user://econ_telemetry.json"

func record(source: String, kind: String, amount: int) -> void:
    var d := _load()
    var day := str(int(Time.get_unix_time_from_system() / 86400))
    if not d.has(day): d[day] = {}
    var dayd: Dictionary = d[day]
    var key := source + ":" + kind
    dayd[key] = int(dayd.get(key, 0)) + amount
    d[day] = dayd
    _save(d)

func _load() -> Dictionary:
    var f := FileAccess.open(_save_path, FileAccess.READ)
    if f:
        var txt := f.get_as_text()
        f.close()
        var d = JSON.parse_string(txt)
        if typeof(d) == TYPE_DICTIONARY:
            return d
    return {}

func _save(d: Dictionary) -> void:
    var f := FileAccess.open(_save_path, FileAccess.WRITE)
    if f:
        f.store_string(JSON.stringify(d))
        f.close()
