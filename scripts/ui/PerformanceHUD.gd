extends Control
class_name PerformanceHUD

@onready var label: Label = $Label

func _process(_delta: float) -> void:
    var fps := Engine.get_frames_per_second()
    var mem := OS.get_static_memory_usage() / (1024 * 1024)
    label.text = "FPS: %d | Mem: %dMB" % [fps, int(mem)]
