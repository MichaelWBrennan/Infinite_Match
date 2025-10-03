extends Node

func _ready() -> void:
    Analytics.track_session_start()
    RemoteConfig.fetch_and_apply()
    if Engine.has_singleton("CloudSave"):
        CloudSave.load_completed.connect(func(ok):
            if ok:
                pass
        )
        CloudSave.load_profile()
    # Lightweight experiment-driven overrides
    var cell1 := Experiments.get_variant_and_track("pricing_badges", ["control", "best_anchor", "decoy"])
    match cell1:
        "best_anchor":
            RemoteConfig.set_override("best_value_sku", "gems_huge")
        "decoy":
            RemoteConfig.set_override("most_popular_sku", "gems_large")
        _:
            pass
    var cell2 := Experiments.get_variant_and_track("interstitial_pct", ["66", "50", "80"]) # strings to int
    RemoteConfig.set_override("interstitial_on_gameover_pct", int(cell2.to_int()))
    var cell3 := Experiments.get_variant_and_track("rv_prelevel_booster", ["1", "0"]) # enable/disable
    RemoteConfig.set_override("rv_prelevel_booster_enabled", int(cell3.to_int()))
    AdManager.preload_all()
    _apply_performance_mode()
    Segmentation.fetch_and_apply_overrides()
    ATT.request_if_enabled()
    get_tree().change_scene_to_file("res://scenes/MainMenu.tscn")

func _apply_performance_mode() -> void:
    if RemoteConfig.get_int("lightweight_mode_enabled", 0) == 1:
        ProjectSettings.set_setting("rendering/quality/filters/msaa", 0)
        ProjectSettings.set_setting("rendering/textures/default_filters/anisotropic_filtering_level", 0)
    if RemoteConfig.get_int("lazy_textures_enabled", 0) == 1:
        # Placeholder: toggle any texture loading strategy if used
        pass
    if RemoteConfig.get_int("streaming_enabled", 0) == 1:
        # Placeholder: enable streaming; requires asset pipeline
        pass
