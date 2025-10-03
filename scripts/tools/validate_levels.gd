extends SceneTree

# Run with: godot --headless --script res://scripts/tools/validate_levels.gd
# Validates config/levels/*.json for required fields and basic solvability attempts.

const LevelManager := preload("res://scripts/LevelManager.gd")
const LevelGenerator := preload("res://scripts/match3/LevelGenerator.gd")

var errors: Array[String] = []

func _initialize() -> void:
    _validate_all()
    if errors.is_empty():
        print("LEVEL VALIDATION OK")
        quit(0)
    else:
        for e in errors: print(e)
        quit(1)

func _validate_all() -> void:
    var dir := DirAccess.open("res://config/levels")
    if dir == null:
        errors.append("Missing config/levels directory")
        return
    dir.list_dir_begin()
    while true:
        var f := dir.get_next()
        if f == "": break
        if f.ends_with(".json"):
            _validate_level("res://config/levels/" + f)
    dir.list_dir_end()

func _validate_level(path: String) -> void:
    var fa := FileAccess.open(path, FileAccess.READ)
    if fa == null:
        errors.append("Cannot open: " + path)
        return
    var d = JSON.parse_string(fa.get_as_text())
    fa.close()
    if typeof(d) != TYPE_DICTIONARY:
        errors.append("Invalid JSON object: " + path)
        return
    for key in ["id","size","num_colors","move_limit","goals"]:
        if not d.has(key):
            errors.append("Missing key %s in %s" % [key, path])
    if typeof(d.get("size", [])) != TYPE_ARRAY or d.get("size", []).size() < 2:
        errors.append("Bad size in %s" % path)
    # Try generate and apply to ensure no crashes
    var lm := LevelManager.new()
    lm.level_config = d
    lm._board_params_from_config()
    var board := LevelGenerator.generate(lm.board_size, lm.num_colors, 12345)
    lm.apply_level_to_board(board)
    # Quick solvability probe
    var has_move := board.has_valid_move()
    if not has_move:
        errors.append("No valid move at start for %s (seed=12345)" % path)
