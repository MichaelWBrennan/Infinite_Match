extends Node
class_name Haptics

func light() -> void:
    if OS.get_name() == "Android" and Engine.has_singleton("AdsBridge"):
        # Use AdsBridge vibration if available; placeholder
        ByteBrewBridge.custom_event("haptic_light")

func medium() -> void:
    ByteBrewBridge.custom_event("haptic_medium")

func heavy() -> void:
    ByteBrewBridge.custom_event("haptic_heavy")
