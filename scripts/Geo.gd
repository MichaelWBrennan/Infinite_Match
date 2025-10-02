extends Node

class_name Geo

var region_code := "US"

func _ready() -> void:
    # Placeholder: infer region; in production, resolve via SDK/server
    region_code = OS.get_locale().substr(3, 2).to_upper()

func is_eu() -> bool:
    var eu = ["AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE"]
    return eu.has(region_code)
