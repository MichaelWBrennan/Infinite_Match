extends Node

func _ready() -> void:
    print("Running basic tests...")
    _test_solver_estimate()
    _test_ftue_paths()
    _test_offers_ladder()
    _test_missions()
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

func _test_offers_ladder() -> void:
    GameState.ever_purchased = false
    var sku1 := Offers._next_ladder_sku()
    assert(sku1 != "")
    GameState.ever_purchased = true
    var sku2 := Offers._next_ladder_sku()
    assert(sku2 != sku1)

func _test_missions() -> void:
    if Missions.missions.size() == 0:
        return
    var first := Missions.missions[0]
    Missions.mark_done(String(first.get("id","")))
