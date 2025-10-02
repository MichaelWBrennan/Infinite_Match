extends Resource
class_name Match3Board

const Types := preload("res://scripts/match3/Types.gd")

var size: Vector2i
var num_colors: int
var rng := RandomNumberGenerator.new()
var grid: Array = [] # grid[y][x] -> piece dict

func _init(board_size: Vector2i = Vector2i(8, 8), colors: int = 5, seed: int = -1) -> void:
    size = board_size
    num_colors = colors
    if seed >= 0:
        rng.seed = seed
    else:
        rng.randomize()
	grid.resize(size.y)
	for y in range(size.y):
		grid[y] = []
		for x in range(size.x):
			grid[y].append(Types.make_normal(rng.randi_range(0, num_colors - 1)))
	_resolve_initial()

func swap(a: Vector2i, b: Vector2i) -> void:
	var tmp := grid[a.y][a.x]
	grid[a.y][a.x] = grid[b.y][b.x]
	grid[b.y][b.x] = tmp

func is_adjacent(a: Vector2i, b: Vector2i) -> bool:
	return abs(a.x - b.x) + abs(a.y - b.y) == 1

func has_matches() -> bool:
	return not _find_matches().is_empty()

func has_valid_move() -> bool:
    # Checks if any adjacent swap creates a match
    for y in range(size.y):
        for x in range(size.x):
            var a := Vector2i(x, y)
            var neighbors := [Vector2i(x + 1, y), Vector2i(x, y + 1)]
            for b in neighbors:
                if b.x >= size.x or b.y >= size.y:
                    continue
                if _creates_match_after_swap(a, b):
                    return true
    return false

func resolve_board() -> Dictionary:
    # Returns { cleared:int, cascades:int, color_counts:Dictionary<int,int> }
    var total_cleared := 0
    var cascades := 0
    var total_color_counts := {}
    while true:
        var matches := _find_matches()
        if matches.is_empty():
            break
        var result := _clear_matches_and_generate_specials(matches)
        total_cleared += int(result.get("cleared", 0))
        var cc: Dictionary = result.get("color_counts", {})
        for k in cc.keys():
            total_color_counts[k] = int(total_color_counts.get(k, 0)) + int(cc[k])
        _apply_gravity_and_fill()
        cascades += 1
    return { "cleared": total_cleared, "cascades": cascades, "color_counts": total_color_counts }

func shuffle_random() -> void:
    # Randomly shuffles normal pieces' colors (keeps dimensions)
    var colors: Array = []
    for y in range(size.y):
        for x in range(size.x):
            var p = grid[y][x]
            if p == null:
                continue
            colors.append(p.get("color"))
    colors.shuffle()
    var i := 0
    for y in range(size.y):
        for x in range(size.x):
            var p = grid[y][x]
            if p == null:
                grid[y][x] = Types.make_normal(rng.randi_range(0, num_colors - 1))
            else:
                var c := colors[i]
                i += 1
                grid[y][x] = Types.make_normal(c)

func get_piece(p: Vector2i) -> Dictionary:
	return grid[p.y][p.x]

func set_piece(p: Vector2i, piece: Dictionary) -> void:
	grid[p.y][p.x] = piece

func to_color_grid() -> Array:
	var out: Array = []
	out.resize(size.y)
	for y in range(size.y):
		out[y] = []
		for x in range(size.x):
			out[y].append(grid[y][x].get("color"))
	return out

func _resolve_initial() -> void:
	# Ensure no initial matches persist by resolving
	while true:
		var matches := _find_matches()
		if matches.is_empty():
			break
		_clear_matches_and_generate_specials(matches)
		_apply_gravity_and_fill()

func _find_matches() -> Array:
	# Returns array of arrays; each inner array contains Vector2i positions of a single group
	var groups: Array = []
	# Horizontal
	for y in range(size.y):
		var run: Array = [Vector2i(0, y)]
		for x in range(1, size.x + 1):
			var cont := x < size.x and _same_color(Vector2i(x, y), Vector2i(x - 1, y))
			if cont:
				run.append(Vector2i(x, y))
			else:
				if run.size() >= 3:
					groups.append(run.duplicate())
				run = [Vector2i(x, y)] if x < size.x else []
	# Vertical
	for x in range(size.x):
		var run2: Array = [Vector2i(x, 0)]
		for y in range(1, size.y + 1):
			var cont2 := y < size.y and _same_color(Vector2i(x, y), Vector2i(x, y - 1))
			if cont2:
				run2.append(Vector2i(x, y))
			else:
				if run2.size() >= 3:
					groups.append(run2.duplicate())
				run2 = [Vector2i(x, y)] if y < size.y else []
	# Merge overlapping groups into unique sets
	return _merge_overlapping(groups)

func _creates_match_after_swap(a: Vector2i, b: Vector2i) -> bool:
    if not is_adjacent(a, b):
        return false
    swap(a, b)
    var result := has_matches()
    swap(a, b)
    return result

func _merge_overlapping(groups: Array) -> Array:
	var merged: Array = []
	for g in groups:
		var added := false
		for mg in merged:
			if _groups_overlap(mg, g):
				for p in g:
					if not _array_has_vec(mg, p):
						mg.append(p)
				added = true
				break
		if not added:
			merged.append(g.duplicate())
	return merged

func _groups_overlap(a: Array, b: Array) -> bool:
	for p in a:
		if _array_has_vec(b, p):
			return true
	return false

func _array_has_vec(arr: Array, v: Vector2i) -> bool:
	for p in arr:
		if p == v:
			return true
	return false

func _same_color(a: Vector2i, b: Vector2i) -> bool:
	var pa := grid[a.y][a.x]
	var pb := grid[b.y][b.x]
	if Types.is_color_bomb(pa) or Types.is_color_bomb(pb):
		return false
	return pa.get("color") == pb.get("color")

func _clear_matches_and_generate_specials(groups: Array) -> Dictionary:
    var cleared := 0
    var color_counts := {}
    # primary clears and special creation
    for group in groups:
        var created_special := false
        if group.size() == 4:
            var anchor := group[0]
            var is_horiz := _is_same_y(group)
            var piece := grid[anchor.y][anchor.x]
            var color := piece.get("color")
            var special := Types.make_rocket_h(color) if is_horiz else Types.make_rocket_v(color)
            grid[anchor.y][anchor.x] = special
            created_special = true
        elif group.size() >= 5:
            var anchor2 := group[0]
            grid[anchor2.y][anchor2.x] = Types.make_color_bomb()
            created_special = true
        for p in group:
            if created_special and p == group[0]:
                continue
            var piece_before = grid[p.y][p.x]
            if piece_before != null:
                var c := piece_before.get("color")
                if c != null:
                    color_counts[c] = int(color_counts.get(c, 0)) + 1
            grid[p.y][p.x] = null
            cleared += 1
    # Special effects: compute positions and colors, then clear
    var to_clear := _compute_specials_to_clear()
    for p in to_clear:
        var piece2 = grid[p.y][p.x]
        if piece2 != null:
            var c2 := piece2.get("color")
            if c2 != null:
                color_counts[c2] = int(color_counts.get(c2, 0)) + 1
        grid[p.y][p.x] = null
        cleared += 1
    return { "cleared": cleared, "color_counts": color_counts }

func _is_same_y(group: Array) -> bool:
	if group.is_empty():
		return false
	var y0 := group[0].y
	for p in group:
		if p.y != y0:
			return false
	return true

func _compute_specials_to_clear() -> Array[Vector2i]:
    # Determine cells to clear due to specials
    var to_clear: Array[Vector2i] = []
    for y in range(size.y):
        for x in range(size.x):
            var piece = grid[y][x]
            if piece == null:
                continue
            if Types.is_rocket(piece):
                if piece.get("kind") == Types.PieceKind.ROCKET_H:
                    for xx in range(size.x):
                        if not (xx == x):
                            to_clear.append(Vector2i(xx, y))
                elif piece.get("kind") == Types.PieceKind.ROCKET_V:
                    for yy in range(size.y):
                        if not (yy == y):
                            to_clear.append(Vector2i(x, yy))
                to_clear.append(Vector2i(x, y))
            elif Types.is_bomb(piece):
                for yy in range(max(0, y - 1), min(size.y, y + 2)):
                    for xx in range(max(0, x - 1), min(size.x, x + 2)):
                        to_clear.append(Vector2i(xx, yy))
                to_clear.append(Vector2i(x, y))
            elif Types.is_color_bomb(piece):
                var target := _most_common_color()
                for yy in range(size.y):
                    for xx in range(size.x):
                        var p2 = grid[yy][xx]
                        if p2 != null and not Types.is_color_bomb(p2) and p2.get("color") == target:
                            to_clear.append(Vector2i(xx, yy))
                to_clear.append(Vector2i(x, y))
    return to_clear

func _most_common_color() -> int:
	var counts := {}
	for y in range(size.y):
		for x in range(size.x):
			var piece = grid[y][x]
			if piece == null:
				continue
			var c := piece.get("color")
			if c == null:
				continue
			counts[c] = int(counts.get(c, 0)) + 1
	var best_c := 0
	var best_n := -1
	for c in counts.keys():
		if counts[c] > best_n:
			best_n = counts[c]
			best_c = c
	return best_c

func _apply_gravity_and_fill() -> void:
	for x in range(size.x):
		var write_y := size.y - 1
		for y in range(size.y - 1, -1, -1):
			if grid[y][x] != null:
				grid[write_y][x] = grid[y][x]
				write_y -= 1
		while write_y >= 0:
			grid[write_y][x] = Types.make_normal(rng.randi_range(0, num_colors - 1))
			write_y -= 1
