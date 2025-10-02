extends Node

func _ready() -> void:
    Analytics.track_session_start()
    RemoteConfig.fetch_and_apply()
    AdManager.preload_all()
    get_tree().change_scene_to_file("res://scenes/MainMenu.tscn")
