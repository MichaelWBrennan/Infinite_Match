extends Resource
class_name Match3Solver

const Match3Board := preload("res://scripts/match3/Board.gd")

static func clone_board(src: Match3Board) -> Match3Board:
	var b := Match3Board.new(src.size, src.num_colors)
	# Deep copy core arrays
	b.grid = []
	b.jelly_layers = []
	b.holes = []
	b.crate_hp = []
	b.ice_hp = []
	b.locked = []
	b.chocolate = []
	b.vines = []
	for y in range(src.size.y):
		b.grid.append([])
		b.jelly_layers.append([])
		b.holes.append([])
		b.crate_hp.append([])
		b.ice_hp.append([])
		b.locked.append([])
		b.chocolate.append([])
		b.vines.append([])
		for x in range(src.size.x):
			var p = src.grid[y][x]
			b.grid[y].append(p if p == null else p.duplicate(true))
			b.jelly_layers[y].append(src.jelly_layers[y][x])
			b.holes[y].append(src.holes[y][x])
			b.crate_hp[y].append(src.crate_hp[y][x])
			b.ice_hp[y].append(src.ice_hp[y][x])
			b.locked[y].append(src.locked[y][x])
			b.chocolate[y].append(src.chocolate[y][x])
			b.vines[y].append(src.vines[y][x])
	b.spawn_weights = src.spawn_weights.duplicate()
	b.drop_mode_enabled = src.drop_mode_enabled
	b.drop_exit_rows = src.drop_exit_rows.duplicate()
	b.ingredient_spawn_cols = src.ingredient_spawn_cols.duplicate()
	b.ingredients_remaining = src.ingredients_remaining
	b.portals = src.portals.duplicate()
	return b

static func _find_any_move(board: Match3Board) -> Array[Vector2i]:
	for y in range(board.size.y):
		for x in range(board.size.x):
			var a := Vector2i(x, y)
			var neighbors := [Vector2i(x + 1, y), Vector2i(x, y + 1)]
			for b in neighbors:
				if b.x >= board.size.x or b.y >= board.size.y:
					continue
				# simulate swap
				board.swap(a, b)
				var valid := board.has_matches()
				board.swap(a, b)
				if valid:
					return [a, b]
	return []

# Returns difficulty score in [0,1] where higher is harder
static func estimate_difficulty(board: Match3Board, move_limit: int, sims: int = 20) -> float:
	var total_progress := 0.0
	var dead_starts := 0
	for i in range(sims):
		var b := clone_board(board)
		var progress := 0
		for m in range(min(move_limit, 30)):
			var mv := _find_any_move(b)
			if mv.size() != 2:
				dead_starts += 1
				break
			b.swap(mv[0], mv[1])
			var res := b.resolve_board()
			progress += int(res.get("cleared", 0))
		total_progress += float(progress)
	# Heuristic: more progress -> easier
	var avg_progress := total_progress / float(max(1, sims))
	var base := clamp(1.0 - (avg_progress / 150.0), 0.0, 1.0)
	var dead_penalty := clamp(float(dead_starts) / float(max(1, sims)) * 0.3, 0.0, 0.3)
	return clamp(base + dead_penalty, 0.0, 1.0)
