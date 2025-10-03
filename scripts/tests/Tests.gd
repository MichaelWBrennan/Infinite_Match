extends Node

func _ready() -> void:
    print("Running basic tests...")
    _test_solver_estimate()
    _test_ftue_paths()
    print("Tests finished.")

func _test_solver_estimate() -> void:
    var LevelGenerator := preload("res://scripts/match3/LevelGenerator.gd")
    var Board := preload("res://scripts/match3/Board.gd")
    var Solver := preload("res://scripts/match3/Solver.gd")
    var b := LevelGenerator.generate(Vector2i(8,8), 5, 12345)
    var diff := Solver.estimate_difficulty(b, 20, 5)
    assert(diff >= 0.0 and diff <= 1.0)

func _test_ftue_paths() -> void:
    # Basic check on RemoteConfig keys existence
    var keys := ["rv_prelevel_booster_enabled", "dda_fails_soften_threshold"]
    for k in keys:
        var _v := RemoteConfig.get_int(k, 0)
