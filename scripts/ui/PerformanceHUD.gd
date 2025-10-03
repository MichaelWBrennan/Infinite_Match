extends Control
class_name PerformanceHUD

@onready var label: Label = $Label

func _process(_delta: float) -> void:
    var fps := Engine.get_frames_per_second()
    var mem := OS.get_static_memory_usage() / (1024 * 1024)
    var mem_budget := RemoteConfig.get_int("perf_memory_mb_budget", 512)
    var cold_budget := RemoteConfig.get_int("perf_cold_start_ms_budget", 3000)
    var mem_warn := mem > mem_budget
    label.text = "FPS: %d | Mem: %dMB%s" % [fps, int(mem), mem_warn ? " !" : ""]
