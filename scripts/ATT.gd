extends Node
class_name ATT

var _save_path := "user://att.json"
var _prompted: bool = false

func _ready() -> void:
    _load()

func request_if_enabled() -> void:
    if OS.get_name() != "iOS":
        return
    if _prompted:
        return
    if RemoteConfig.get_int("att_prompt_enabled", 1) != 1:
        return
    _prompted = true
    _save()
    # Stub: fire analytics event to indicate ATT prompt would be shown here
    ByteBrewBridge.custom_event("att_prompt_shown", 1)

func _load() -> void:
    var f := FileAccess.open(_save_path, FileAccess.READ)
    if f:
        var d = JSON.parse_string(f.get_as_text())
        f.close()
        if typeof(d) == TYPE_DICTIONARY:
            _prompted = bool(d.get("prompted", false))

func _save() -> void:
    var d := {"prompted": _prompted}
    var f := FileAccess.open(_save_path, FileAccess.WRITE)
    if f:
        f.store_string(JSON.stringify(d))
        f.close()
