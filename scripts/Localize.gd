extends Node

class_name Localize

var _lang := "en"
var _strings: Dictionary = {}

func _ready() -> void:
    load_lang(_lang)

func t(key: String, fallback: String = "") -> String:
    return String(_strings.get(key, fallback))

func tf(key: String, fallback: String = "", repl: Dictionary = {}) -> String:
    var s := t(key, fallback)
    for k in repl.keys():
        s = s.replace("{{%s}}" % k, str(repl[k]))
    return s

func load_lang(lang: String) -> void:
    _lang = lang
    var path := "res://i18n/%s.json" % lang
    if not FileAccess.file_exists(path):
        _strings = {}
        return
    var f := FileAccess.open(path, FileAccess.READ)
    if f:
        var d = JSON.parse_string(f.get_as_text())
        f.close()
        if typeof(d) == TYPE_DICTIONARY:
            _strings = d
        else:
            _strings = {}
