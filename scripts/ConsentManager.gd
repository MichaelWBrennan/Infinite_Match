extends Node

class_name ConsentManager

signal consent_updated()

var gdpr_consent: String = "unknown" # unknown / granted / denied
var age_group: String = "unknown" # child / teen / adult
var _save_path := "user://consent.json"

func _ready() -> void:
    _load()

func needs_consent() -> bool:
    return Geo.is_eu() and gdpr_consent == "unknown"

func set_consent(choice: String) -> void:
    gdpr_consent = choice
    _save()
    consent_updated.emit()

func set_age_group(group: String) -> void:
    age_group = group
    _save()
    consent_updated.emit()

func _load() -> void:
    var f := FileAccess.open(_save_path, FileAccess.READ)
    if f:
        var d = JSON.parse_string(f.get_as_text())
        f.close()
        if typeof(d) == TYPE_DICTIONARY:
            gdpr_consent = String(d.get("gdpr", gdpr_consent))
            age_group = String(d.get("age", age_group))

func _save() -> void:
    var d := {"gdpr": gdpr_consent, "age": age_group}
    var f := FileAccess.open(_save_path, FileAccess.WRITE)
    if f:
        f.store_string(JSON.stringify(d))
        f.close()
