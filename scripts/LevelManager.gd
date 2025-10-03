extends Node

class_name LevelManager

const Types := preload("res://scripts/match3/Types.gd")

signal goals_updated(progress: Dictionary)
signal level_loaded(level_id: int)

var current_level_id: int = 1
var level_config: Dictionary = {}
var goals_progress: Dictionary = {}
var move_limit: int = 20
var board_size: Vector2i = Vector2i(8, 8)
var num_colors: int = 5
var score_star_thresholds: Array[int] = [500, 1500, 3000]
var drop_mode: bool = false
var drop_ingredient_target: int = 0

func _ready() -> void:
	_load_or_init_current_level()

func _levels_dir() -> String:
	return "res://config/levels"

func _level_path(id: int) -> String:
	return "%s/level_%d.json" % [_levels_dir(), id]

func _load_or_init_current_level() -> void:
	if current_level_id <= 0:
		current_level_id = 1
	load_level(current_level_id)

func load_level(id: int) -> void:
	var path := _level_path(id)
	if not FileAccess.file_exists(path):
		# Fallback to level 1 if requested level missing
		id = 1
		path = _level_path(id)
	current_level_id = id
	var f := FileAccess.open(path, FileAccess.READ)
	if not f:
		level_config = {}
		return
	var data = JSON.parse_string(f.get_as_text())
	f.close()
	if typeof(data) != TYPE_DICTIONARY:
		level_config = {}
		return
	level_config = data
	_board_params_from_config()
	_init_goals_progress()
	level_loaded.emit(current_level_id)

func _board_params_from_config() -> void:
	board_size = Vector2i(8, 8)
	num_colors = 5
	move_limit = 20
	score_star_thresholds = [500, 1500, 3000]
    drop_mode = false
    drop_ingredient_target = 0
	if level_config.has("size"):
		var s: Array = level_config.get("size", [8,8])
		if s.size() >= 2:
			board_size = Vector2i(int(s[0]), int(s[1]))
	if level_config.has("num_colors"):
		num_colors = int(level_config.get("num_colors", 5))
	if level_config.has("move_limit"):
		move_limit = int(level_config.get("move_limit", 20))
	if level_config.has("score_stars"):
		var arr: Array = level_config.get("score_stars", [])
		if arr.size() >= 3:
			score_star_thresholds = [int(arr[0]), int(arr[1]), int(arr[2])]
    # Drop mode
    if level_config.has("drop_mode"):
        var dm: Dictionary = level_config.get("drop_mode", {})
        drop_mode = bool(dm.get("enabled", false))
        drop_ingredient_target = int(dm.get("target", 0))

func _init_goals_progress() -> void:
	goals_progress.clear()
	var goals: Array = level_config.get("goals", [])
	for g in goals:
		var t := str(g.get("type", ""))
		match t:
			"collect_color":
				var color := int(g.get("color", 0))
				var key := _goal_key_collect_color(color)
				goals_progress[key] = 0
			"clear_jelly":
				goals_progress["clear_jelly"] = 0
            "deliver_ingredients":
                goals_progress["deliver_ingredients"] = 0
			_:
				pass
	goals_updated.emit(goals_progress)

func apply_level_to_board(board) -> void:
	# Place blockers like jelly from config
	if level_config.has("jelly"):
		var jelly: Array = level_config.get("jelly", [])
		for entry in jelly:
			if typeof(entry) == TYPE_ARRAY and entry.size() >= 2:
				var x := int(entry[0])
				var y := int(entry[1])
				var layers := 1
				if entry.size() >= 3:
					layers = int(entry[2])
				board.set_jelly(Vector2i(x, y), max(0, layers))
    # Holes
    if level_config.has("holes"):
        var holes: Array = level_config.get("holes", [])
        for h in holes:
            if typeof(h) == TYPE_ARRAY and h.size() >= 2:
                board.set_hole(Vector2i(int(h[0]), int(h[1])), true)
    # Blockers
    if level_config.has("crates"):
        for c in level_config.get("crates", []):
            if typeof(c) == TYPE_ARRAY and c.size() >= 3:
                board.set_crate(Vector2i(int(c[0]), int(c[1])), int(c[2]))
    if level_config.has("ice"):
        for ic in level_config.get("ice", []):
            if typeof(ic) == TYPE_ARRAY and ic.size() >= 3:
                board.set_ice(Vector2i(int(ic[0]), int(ic[1])), int(ic[2]))
    if level_config.has("locks"):
        for lk in level_config.get("locks", []):
            if typeof(lk) == TYPE_ARRAY and lk.size() >= 2:
                board.set_lock(Vector2i(int(lk[0]), int(lk[1])), true)
    if level_config.has("chocolate"):
        for ch in level_config.get("chocolate", []):
            if typeof(ch) == TYPE_ARRAY and ch.size() >= 2:
                board.set_chocolate(Vector2i(int(ch[0]), int(ch[1])), true)
    # Spawn weights
    if level_config.has("spawn_weights"):
        var weights := level_config.get("spawn_weights", {})
        if typeof(weights) == TYPE_DICTIONARY:
            board.set_spawn_weights(weights)
    # Pre-placed specials
    if level_config.has("preplaced"):
        for sp in level_config.get("preplaced", []):
            # [x,y,kind,color]
            if typeof(sp) == TYPE_ARRAY and sp.size() >= 3:
                var pos := Vector2i(int(sp[0]), int(sp[1]))
                var kind := String(sp[2])
                var color := null
                if sp.size() >= 4:
                    color = sp[3]
                match kind:
                    "rocket_h":
                        board.set_piece(pos, Types.make_rocket_h(int(color)))
                    "rocket_v":
                        board.set_piece(pos, Types.make_rocket_v(int(color)))
                    "bomb":
                        board.set_piece(pos, Types.make_bomb(int(color)))
                    "color_bomb":
                        board.set_piece(pos, Types.make_color_bomb())
                    _:
                        pass
    # Drop mode config
    if level_config.has("drop_mode"):
        var dm2: Dictionary = level_config.get("drop_mode", {})
        if typeof(dm2) == TYPE_DICTIONARY:
            var enabled := bool(dm2.get("enabled", false))
            var exits: Array[int] = []
            var spawn_cols: Array[int] = []
            var target := int(dm2.get("target", 0))
            if dm2.has("exit_rows"):
                exits = dm2.get("exit_rows", [])
            if dm2.has("spawn_cols"):
                spawn_cols = dm2.get("spawn_cols", [])
            board.configure_drop_mode(enabled, exits, spawn_cols, target)

func current_goals() -> Array:
	return level_config.get("goals", [])

func describe_goals() -> String:
	var parts: Array[String] = []
	for g in current_goals():
		var t := str(g.get("type", ""))
		match t:
			"collect_color":
				var color := int(g.get("color", 0))
				var amount := int(g.get("amount", 0))
				var key := _goal_key_collect_color(color)
				parts.append("Collect color %d: %d/%d" % [color, int(goals_progress.get(key, 0)), amount])
			"clear_jelly":
				var target := int(g.get("amount", 0))
				var have := int(goals_progress.get("clear_jelly", 0))
				parts.append("Clear jelly: %d/%d" % [have, target])
            "deliver_ingredients":
                var target_i := int(g.get("amount", 0))
                var have_i := int(goals_progress.get("deliver_ingredients", 0))
                parts.append("Deliver: %d/%d" % [have_i, target_i])
			_:
				pass
	return " | ".join(parts)

func on_resolve_result(result: Dictionary) -> void:
	# Update goals by cleared colors and jelly counts
	var color_counts: Dictionary = result.get("color_counts", {})
	for g in current_goals():
		if str(g.get("type", "")) == "collect_color":
			var color := int(g.get("color", 0))
			var key := _goal_key_collect_color(color)
			var add := int(color_counts.get(color, 0))
			goals_progress[key] = int(goals_progress.get(key, 0)) + add
		elif str(g.get("type", "")) == "clear_jelly":
			var add_j := int(result.get("jelly_cleared", 0))
			goals_progress["clear_jelly"] = int(goals_progress.get("clear_jelly", 0)) + add_j
        elif str(g.get("type", "")) == "deliver_ingredients":
            var add_i := int(result.get("ingredients_delivered", 0))
            goals_progress["deliver_ingredients"] = int(goals_progress.get("deliver_ingredients", 0)) + add_i
	goals_updated.emit(goals_progress)

func goals_completed() -> bool:
	for g in current_goals():
		var t := str(g.get("type", ""))
		match t:
			"collect_color":
				var color := int(g.get("color", 0))
				var amount := int(g.get("amount", 0))
				var key := _goal_key_collect_color(color)
				if int(goals_progress.get(key, 0)) < amount:
					return false
			"clear_jelly":
				var amount2 := int(g.get("amount", 0))
				if int(goals_progress.get("clear_jelly", 0)) < amount2:
					return false
            "deliver_ingredients":
                var amount3 := int(g.get("amount", 0))
                if int(goals_progress.get("deliver_ingredients", 0)) < amount3:
                    return false
			_:
				pass
	return true

func stars_for_score(score: int) -> int:
	var s := 0
	for th in score_star_thresholds:
		if score >= th:
			s += 1
	return clamp(s, 0, 3)

func next_level_id() -> int:
	return current_level_id + 1

func advance_to_next_level() -> void:
	load_level(next_level_id())

func _goal_key_collect_color(color: int) -> String:
	return "collect_color_%d" % color
