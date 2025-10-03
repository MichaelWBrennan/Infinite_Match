extends Node

class_name LevelManager

const Types := preload("res://scripts/match3/Types.gd")
const Match3Solver := preload("res://scripts/match3/Solver.gd")

signal goals_updated(progress: Dictionary)
signal level_loaded(level_id: int)

var current_level_id: int = 1
var level_config: Dictionary = {}
var goals_progress: Dictionary = {}
var move_limit: int = 20
var board_size: Vector2i = Vector2i(8, 8)
var num_colors: int = 5
var score_star_thresholds: Array[int] = [500, 1500, 3000]
var difficulty_score: float = 0.0
var drop_mode: bool = false
var drop_ingredient_target: int = 0
var boss_hp_total: int = 0
var escape_seconds: int = 0
var vines_present: bool = false
var portals_present: bool = false
var conveyors_present: bool = false

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
    difficulty_score = float(level_config.get("difficulty", -1.0))
	_init_goals_progress()
	level_loaded.emit(current_level_id)

func _board_params_from_config() -> void:
	board_size = Vector2i(8, 8)
	num_colors = 5
    move_limit = 20
	score_star_thresholds = [500, 1500, 3000]
    drop_mode = false
    drop_ingredient_target = 0
    boss_hp_total = 0
    escape_seconds = 0
    vines_present = false
    portals_present = false
    conveyors_present = false
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
            "clear_vines":
                goals_progress["clear_vines"] = 0
            "clear_licorice":
                goals_progress["clear_licorice"] = 0
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
    if level_config.has("honey"):
        for hn in level_config.get("honey", []):
            if typeof(hn) == TYPE_ARRAY and hn.size() >= 3:
                board.honey_hp[int(hn[1])][int(hn[0])] = max(0, int(hn[2]))
    if level_config.has("locks"):
        for lk in level_config.get("locks", []):
            if typeof(lk) == TYPE_ARRAY and lk.size() >= 2:
                board.set_lock(Vector2i(int(lk[0]), int(lk[1])), true)
    if level_config.has("chocolate"):
        for ch in level_config.get("chocolate", []):
            if typeof(ch) == TYPE_ARRAY and ch.size() >= 2:
                board.set_chocolate(Vector2i(int(ch[0]), int(ch[1])), true)
    if level_config.has("licorice"):
        for li in level_config.get("licorice", []):
            if typeof(li) == TYPE_ARRAY and li.size() >= 3:
                board.set_licorice(Vector2i(int(li[0]), int(li[1])), int(li[2]))
    if level_config.has("vines"):
        var vs: Array = level_config.get("vines", [])
        for v in vs:
            if typeof(v) == TYPE_ARRAY and v.size() >= 2:
                board.set_vine(Vector2i(int(v[0]), int(v[1])), true)
        vines_present = not vs.is_empty()
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
    # Boss and Escape configs
    if level_config.has("boss"):
        var bcfg: Dictionary = level_config.get("boss", {})
        boss_hp_total = int(bcfg.get("hp", 0))
    if level_config.has("escape"):
        var ecfg: Dictionary = level_config.get("escape", {})
        escape_seconds = int(ecfg.get("seconds", 0))
    # Portals config: array of mappings [[ex,ey,tx,ty], ...]
    if level_config.has("portals"):
        var pts: Array = level_config.get("portals", [])
        for p in pts:
            if typeof(p) == TYPE_ARRAY and p.size() >= 4:
                var entry := Vector2i(int(p[0]), int(p[1]))
                var exit := Vector2i(int(p[2]), int(p[3]))
                board.set_portal(entry, exit)
        portals_present = not pts.is_empty()
    # Conveyors config: array of mappings [[sx,sy,nx,ny], ...]
    if level_config.has("conveyors"):
        var cvs: Array = level_config.get("conveyors", [])
        for c in cvs:
            if typeof(c) == TYPE_ARRAY and c.size() >= 4:
                var src := Vector2i(int(c[0]), int(c[1]))
                var nxt := Vector2i(int(c[2]), int(c[3]))
                board.conveyors[str(src.x)+","+str(src.y)] = nxt
        conveyors_present = not cvs.is_empty()
    # Dynamic difficulty estimation when not tagged
    if difficulty_score < 0.0:
        difficulty_score = Match3Solver.estimate_difficulty(board, move_limit, 10)

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
            "clear_vines":
                var target_v := int(g.get("amount", 0))
                var have_v := int(goals_progress.get("clear_vines", 0))
                parts.append("Clear vines: %d/%d" % [have_v, target_v])
			"clear_licorice":
				var target_l := int(g.get("amount", 0))
				var have_l := int(goals_progress.get("clear_licorice", 0))
				parts.append("Clear licorice: %d/%d" % [have_l, target_l])
			"clear_honey":
				var target_h := int(g.get("amount", 0))
				var have_h := int(goals_progress.get("clear_honey", 0))
				parts.append("Clear honey: %d/%d" % [have_h, target_h])
            "clear_licorice":
                var target_l := int(g.get("amount", 0))
                var have_l := int(goals_progress.get("clear_licorice", 0))
                parts.append("Clear licorice: %d/%d" % [have_l, target_l])
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
			# Event progress hooks
			if Engine.has_singleton("Bingo") and add_j > 0:
				Bingo.progress("clear_jelly", add_j)
        elif str(g.get("type", "")) == "clear_vines":
            # Count vines broken from blockers_cleared
            var bc: Dictionary = result.get("blockers_cleared", {})
            var add_v := int(bc.get("vines", 0))
            var have_key := "clear_vines"
            goals_progress[have_key] = int(goals_progress.get(have_key, 0)) + add_v
        elif str(g.get("type", "")) == "clear_licorice":
            var bc2: Dictionary = result.get("blockers_cleared", {})
            var add_l := int(bc2.get("licorice", 0))
            goals_progress["clear_licorice"] = int(goals_progress.get("clear_licorice", 0)) + add_l
		elif str(g.get("type", "")) == "deliver_ingredients":
            var add_i := int(result.get("ingredients_delivered", 0))
            goals_progress["deliver_ingredients"] = int(goals_progress.get("deliver_ingredients", 0)) + add_i
			if Engine.has_singleton("Bingo") and add_i > 0:
				Bingo.progress("deliver_ingredients", add_i)
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
            "clear_vines":
                var amountv := int(g.get("amount", 0))
                if int(goals_progress.get("clear_vines", 0)) < amountv:
                    return false
            "clear_licorice":
                var amountl := int(g.get("amount", 0))
                if int(goals_progress.get("clear_licorice", 0)) < amountl:
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
    var next := next_level_id()
    if _is_gate_blocked(next):
        # Emit loaded for same level to refresh UI elsewhere; gate UI handled at menu
        level_loaded.emit(current_level_id)
        return
    load_level(next)

func _is_gate_blocked(level_id: int) -> bool:
    if RemoteConfig.get_int("gate_enabled", 1) != 1:
        return false
    var every := max(1, RemoteConfig.get_int("gate_every_levels", 50))
    if level_id % every != 0:
        return false
    var need := RemoteConfig.get_int("gate_stars_per_gate", 75)
    return GameState.total_stars() < need

func is_next_gate_blocked() -> bool:
    return _is_gate_blocked(next_level_id())

func _goal_key_collect_color(color: int) -> String:
	return "collect_color_%d" % color
