extends Node

func _ready() -> void:
    Analytics.track_session_start()
    RemoteConfig.fetch_and_apply()
    var cs = null
    if Engine.has_singleton("CloudSave"):
        cs = CloudSave
    else:
        if ResourceLoader.exists("res://scripts/CloudSave.gd"):
            cs = load("res://scripts/CloudSave.gd").new()
            add_child(cs)
    if cs != null:
        cs.load_completed.connect(func(_ok): pass)
        cs.load_profile()

    # Ensure auxiliary systems exist even if not autoloaded
    _ensure_singleton_or_node("Leagues", "res://scripts/Leagues.gd")
    _ensure_singleton_or_node("MetaManager", "res://scripts/MetaManager.gd")
    _ensure_singleton_or_node("AnalyticsRouter", "res://scripts/AnalyticsRouter.gd")
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

func _ensure_singleton_or_node(name: String, path: String) -> void:
    if Engine.has_singleton(name):
        return
    if ResourceLoader.exists(path):
        var inst = load(path).new()
        add_child(inst)
