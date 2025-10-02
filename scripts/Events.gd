extends Node
class_name EventScheduler

# Date-based theme selection via config/events.json.

func get_current_theme_name() -> String:
    var configured := _get_theme_from_config()
    if configured != "":
        return configured
    return "default"

func get_daily_event_set_dir(theme_name: String) -> String:
    # Choose a rotating set directory under assets/match3/<theme>/set_xxx
    var rotation := _load_rotation()
    var count := 0
    if typeof(rotation) == TYPE_DICTIONARY:
        var daily_sets := rotation.get("daily_event_sets", {})
        count = int(daily_sets.get(theme_name, daily_sets.get("default", 0)))
    if count <= 0:
        return ""
    var day_index := int(Time.get_unix_time_from_system() / 86400) % count
    var dir := "res://assets/match3/%s/set_%03d" % [theme_name, day_index]
    return dir

func _load_rotation() -> Dictionary:
    var path := "res://config/rotation.json"
    if not FileAccess.file_exists(path):
        return {}
    var f := FileAccess.open(path, FileAccess.READ)
    if not f:
        return {}
    var data = JSON.parse_string(f.get_as_text())
    f.close()
    if typeof(data) == TYPE_DICTIONARY:
        return data
    return {}

func _get_theme_from_config() -> String:
    var path := "res://config/events.json"
    if not FileAccess.file_exists(path):
        return ""
    var f := FileAccess.open(path, FileAccess.READ)
    if not f:
        return ""
    var data = JSON.parse_string(f.get_as_text())
    f.close()
    if typeof(data) != TYPE_DICTIONARY:
        return ""
    var events: Array = data.get("events", [])
    var today := Time.get_datetime_dict_from_system()
    var md := _fmt_md(today)
    for e in events:
        var name := String(e.get("name", ""))
        var start := String(e.get("start", ""))
        var end := String(e.get("end", ""))
        if name == "" or start == "" or end == "":
            continue
        if _md_in_range(md, start, end):
            return name
    return ""

func _fmt_md(dt: Dictionary) -> String:
    var m := int(dt.get("month", 1))
    var d := int(dt.get("day", 1))
    return "%02d-%02d" % [m, d]

func _md_in_range(md: String, start: String, end: String) -> bool:
    # Handles ranges that wrap around year end (e.g., 12-20 to 01-05)
    if start <= end:
        return md >= start and md <= end
    # wrap
    return md >= start or md <= end
