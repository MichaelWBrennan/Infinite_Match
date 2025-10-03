extends Node
class_name CMP

var consent_state: String = "unknown" # unknown/granted/denied
var _save_path := "user://cmp.json"

func _ready() -> void:
    _load()

func should_show_cmp() -> bool:
    return RemoteConfig.get_int("cmp_enabled", 1) == 1 and consent_state == "unknown" and ConsentManager.needs_consent()

func set_consent(state: String) -> void:
    consent_state = state
    _save()

func _load() -> void:
    var f := FileAccess.open(_save_path, FileAccess.READ)
    if f:
        var d = JSON.parse_string(f.get_as_text())
        f.close()
        if typeof(d) == TYPE_DICTIONARY:
            consent_state = String(d.get("consent_state", consent_state))

func _save() -> void:
    var d := {"consent_state": consent_state}
    var f := FileAccess.open(_save_path, FileAccess.WRITE)
    if f:
        f.store_string(JSON.stringify(d))
        f.close()
