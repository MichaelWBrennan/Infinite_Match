extends Node

class_name LevelManager

signal goals_updated(progress: Dictionary)
signal level_loaded(level_id: int)

var current_level_id: int = 1
var level_config: Dictionary = {}
var goals_progress: Dictionary = {}
var move_limit: int = 20
var board_size: Vector2i = Vector2i(8, 8)
var num_colors: int = 5
var score_star_thresholds: Array[int] = [500, 1500, 3000]

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
