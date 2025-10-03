extends Resource
class_name Match3Board

const Types := preload("res://scripts/match3/Types.gd")

var size: Vector2i
var num_colors: int
var rng := RandomNumberGenerator.new()
var grid: Array = [] # grid[y][x] -> piece dict
var jelly_layers: Array = [] # jelly_layers[y][x] -> int (0 = none)
var holes: Array = [] # holes[y][x] -> bool (true means no tile exists ever)
var crate_hp: Array = [] # crate_hp[y][x] -> int (0 = none)
var ice_hp: Array = [] # ice_hp[y][x] -> int (0 = none)
var locked: Array = [] # locked[y][x] -> bool (true means locked until cleared)
var chocolate: Array = [] # chocolate[y][x] -> int presence (1 means chocolate on cell)
var vines: Array = [] # vines[y][x] -> int presence (1 means vine on cell)
var portals: Dictionary = {} # "x,y" -> Vector2i exit cell
var licorice_hp: Array = [] # licorice_hp[y][x] -> int (0 = none)
var conveyors: Dictionary = {} # "x,y" -> Vector2i next cell
var honey_hp: Array = [] # honey_hp[y][x] -> int (0 = none)
var spawn_weights: Dictionary = {} # color(int) -> weight(int)
var drop_mode_enabled: bool = false
var drop_exit_rows: Array[int] = [] # rows at bottom that count as exits
var ingredient_spawn_cols: Array[int] = [] # columns to spawn ingredients from top
var ingredients_remaining: int = 0

func _init(board_size: Vector2i = Vector2i(8, 8), colors: int = 5, seed: int = -1) -> void:
    size = board_size
    num_colors = colors
    if seed >= 0:
        rng.seed = seed
    else:
        rng.randomize()
    grid.resize(size.y)
    jelly_layers.resize(size.y)
    holes.resize(size.y)
    crate_hp.resize(size.y)
    ice_hp.resize(size.y)
    locked.resize(size.y)
    chocolate.resize(size.y)
    vines.resize(size.y)
    licorice_hp.resize(size.y)
    honey_hp.resize(size.y)
    for y in range(size.y):
        grid[y] = []
        jelly_layers[y] = []
        holes[y] = []
        crate_hp[y] = []
        ice_hp[y] = []
        locked[y] = []
        chocolate[y] = []
        vines[y] = []
        licorice_hp[y] = []
        honey_hp[y] = []
        for x in range(size.x):
            holes[y].append(false)
            crate_hp[y].append(0)
            ice_hp[y].append(0)
            locked[y].append(false)
            chocolate[y].append(0)
            vines[y].append(0)
            licorice_hp[y].append(0)
            honey_hp[y].append(0)
            grid[y].append(Types.make_normal(rng.randi_range(0, num_colors - 1)))
            jelly_layers[y].append(0)
	_resolve_initial()

func swap(a: Vector2i, b: Vector2i) -> void:
    if _is_hole(a) or _is_hole(b):
        return
    if _is_locked(a) or _is_locked(b):
        return
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
    # Returns { cleared:int, cascades:int, color_counts:Dictionary<int,int>, jelly_cleared:int, blockers_cleared:Dictionary, ingredients_delivered:int }
    var total_cleared := 0
    var cascades := 0
    var total_color_counts := {}
    var total_jelly_cleared := 0
    var total_blockers_cleared := {"crate":0, "ice":0, "lock":0, "chocolate":0, "vines":0, "honey":0, "licorice":0}
    var total_ingredients := 0
    while true:
        var matches := _find_matches()
        if matches.is_empty():
            break
        var result := _clear_matches_and_generate_specials(matches)
        total_cleared += int(result.get("cleared", 0))
        var cc: Dictionary = result.get("color_counts", {})
        for k in cc.keys():
            total_color_counts[k] = int(total_color_counts.get(k, 0)) + int(cc[k])
        total_jelly_cleared += int(result.get("jelly_cleared", 0))
        # blockers summary partials may be present
        var bc: Dictionary = result.get("blockers_cleared", {})
        for bk in bc.keys():
            total_blockers_cleared[bk] = int(total_blockers_cleared.get(bk, 0)) + int(bc[bk])
        _apply_gravity_and_fill()
        if drop_mode_enabled:
            total_ingredients += _process_ingredient_delivery_and_spawn()
        _spread_chocolate()
        _spread_honey()
        _spread_vines()
        cascades += 1
    return { "cleared": total_cleared, "cascades": cascades, "color_counts": total_color_counts, "jelly_cleared": total_jelly_cleared, "blockers_cleared": total_blockers_cleared, "ingredients_delivered": total_ingredients }

func shuffle_random() -> void:
    # Randomly shuffles normal pieces' colors (keeps dimensions)
    var colors: Array = []
    for y in range(size.y):
        for x in range(size.x):
            var p = grid[y][x]
            if p == null:
                continue
            if _is_hole(Vector2i(x,y)):
                continue
            colors.append(p.get("color"))
    colors.shuffle()
    var i := 0
    for y in range(size.y):
        for x in range(size.x):
            var p = grid[y][x]
            if p == null:
                if not _is_hole(Vector2i(x,y)):
                    grid[y][x] = Types.make_normal(_choose_spawn_color())
            else:
                var c := colors[i]
                i += 1
                grid[y][x] = Types.make_normal(c)

func get_piece(p: Vector2i) -> Dictionary:
	return grid[p.y][p.x]

func set_piece(p: Vector2i, piece: Dictionary) -> void:
    if _is_hole(p):
        return
    grid[p.y][p.x] = piece

func set_jelly(p: Vector2i, layers: int) -> void:
    if _in_bounds(p):
        jelly_layers[p.y][p.x] = max(0, layers)

func get_jelly(p: Vector2i) -> int:
    if _in_bounds(p):
        return int(jelly_layers[p.y][p.x])
    return 0

func count_jelly_remaining() -> int:
    var total := 0
    for y in range(size.y):
        for x in range(size.x):
            total += int(jelly_layers[y][x]) > 0 ? 1 : 0
    return total

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
    if pa == null or pb == null:
        return false
    if _is_hole(a) or _is_hole(b):
        return false
	if Types.is_color_bomb(pa) or Types.is_color_bomb(pb):
		return false
	return pa.get("color") == pb.get("color")

func _clear_matches_and_generate_specials(groups: Array) -> Dictionary:
    var cleared := 0
    var color_counts := {}
    var jelly_cleared := 0
    var blockers_cleared := {"crate":0, "ice":0, "lock":0, "chocolate":0, "vines":0, "honey":0, "licorice":0}
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
            var is_line := _is_same_y(group) or _is_same_x(group)
            if is_line:
                grid[anchor2.y][anchor2.x] = Types.make_color_bomb()
            else:
                # L/T shape -> bomb
                var piece2 := grid[anchor2.y][anchor2.x]
                var color2 := piece2.get("color")
                grid[anchor2.y][anchor2.x] = Types.make_bomb(color2)
            created_special = true
        for p in group:
            if created_special and p == group[0]:
                continue
            var piece_before = grid[p.y][p.x]
            if piece_before != null:
                var c := piece_before.get("color")
                if c != null:
                    color_counts[c] = int(color_counts.get(c, 0)) + 1
            if not _damage_blockers_or_clear_at(p, blockers_cleared):
                grid[p.y][p.x] = null
            cleared += 1
            jelly_cleared += _hit_jelly_at(p)
    # Special effects: compute positions and colors, then clear
    var to_clear := _compute_specials_to_clear()
    for p in to_clear:
        var piece2 = grid[p.y][p.x]
        if piece2 != null:
            var c2 := piece2.get("color")
            if c2 != null:
                color_counts[c2] = int(color_counts.get(c2, 0)) + 1
        if not _damage_blockers_or_clear_at(p, blockers_cleared):
            grid[p.y][p.x] = null
        cleared += 1
        jelly_cleared += _hit_jelly_at(p)
    return { "cleared": cleared, "color_counts": color_counts, "jelly_cleared": jelly_cleared, "blockers_cleared": blockers_cleared }

func _is_same_y(group: Array) -> bool:
	if group.is_empty():
		return false
	var y0 := group[0].y
	for p in group:
		if p.y != y0:
			return false
	return true

func _is_same_x(group: Array) -> bool:
    if group.is_empty():
        return false
    var x0 := group[0].x
    for p in group:
        if p.x != x0:
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
                        if xx == x:
                            continue
                        # Licorice absorbs horizontal beams; skip cell if licorice present
                        if int(licorice_hp[y][xx]) > 0:
                            continue
                        to_clear.append(Vector2i(xx, y))
                elif piece.get("kind") == Types.PieceKind.ROCKET_V:
                    for yy in range(size.y):
                        if yy == y:
                            continue
                        if int(licorice_hp[yy][x]) > 0:
                            continue
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
            if _is_hole(Vector2i(x, y)):
                continue
            if grid[y][x] != null:
                var dest := Vector2i(x, write_y)
                var moved := false
                # Portals: redirect to exit if available
                var exit := _portal_exit_if_any(dest)
                if exit != null and _in_bounds(exit) and not _is_hole(exit) and grid[exit.y][exit.x] == null:
                    grid[exit.y][exit.x] = grid[y][x]
                    if y != exit.y or x != exit.x:
                        grid[y][x] = null
                    moved = true
                # Conveyors: advance piece along conveyor chain if configured
                if not moved:
                    var next := _conveyor_next_if_any(dest)
                    if next != null and _in_bounds(next) and not _is_hole(next) and grid[next.y][next.x] == null:
                        grid[next.y][next.x] = grid[y][x]
                        if y != next.y or x != next.x:
                            grid[y][x] = null
                        moved = true
                if not moved:
                    grid[write_y][x] = grid[y][x]
                    if write_y != y:
                        grid[y][x] = null
                write_y -= 1
        while write_y >= 0:
            if _is_hole(Vector2i(x, write_y)):
                write_y -= 1
                continue
            var dest2 := Vector2i(x, write_y)
            var exit2 := _portal_exit_if_any(dest2)
            var piece
            if drop_mode_enabled and ingredient_spawn_cols.has(x) and rng.randi_range(0, 99) < 10 and not _column_has_ingredient(x):
                piece = Types.make_ingredient()
            else:
                piece = Types.make_normal(_choose_spawn_color())
            var placed := false
            if exit2 != null and _in_bounds(exit2) and not _is_hole(exit2) and grid[exit2.y][exit2.x] == null:
                grid[exit2.y][exit2.x] = piece
                placed = true
            if not placed:
                var next2 := _conveyor_next_if_any(dest2)
                if next2 != null and _in_bounds(next2) and not _is_hole(next2) and grid[next2.y][next2.x] == null:
                    grid[next2.y][next2.x] = piece
                    placed = true
            if not placed:
                grid[write_y][x] = piece
            write_y -= 1

func _in_bounds(p: Vector2i) -> bool:
    return p.x >= 0 and p.x < size.x and p.y >= 0 and p.y < size.y

func _is_hole(p: Vector2i) -> bool:
    if not _in_bounds(p):
        return true
    return bool(holes[p.y][p.x])

func _is_locked(p: Vector2i) -> bool:
    if not _in_bounds(p):
        return false
    return bool(locked[p.y][p.x]) or int(vines[p.y][p.x]) > 0

func _hit_jelly_at(p: Vector2i) -> int:
    if not _in_bounds(p):
        return 0
    var layers: int = int(jelly_layers[p.y][p.x])
    if layers > 0:
        jelly_layers[p.y][p.x] = layers - 1
        return 1
    return 0

# --- Blockers helpers ---
func _damage_blockers_or_clear_at(p: Vector2i, out_counts: Dictionary) -> bool:
    # Returns true if blockers consumed the hit and tile should not be cleared
    if not _in_bounds(p) or _is_hole(p):
        return false
    # Lock breaks on first hit
    if bool(locked[p.y][p.x]):
        locked[p.y][p.x] = false
        out_counts["lock"] = int(out_counts.get("lock", 0)) + 1
        return true
    # Vines break on first hit
    if int(vines[p.y][p.x]) > 0:
        vines[p.y][p.x] = 0
        out_counts["vines"] = int(out_counts.get("vines", 0)) + 1
        return true
    # Ice HP decrements and may prevent tile clear until 0
    if int(ice_hp[p.y][p.x]) > 0:
        ice_hp[p.y][p.x] = max(0, int(ice_hp[p.y][p.x]) - 1)
        if ice_hp[p.y][p.x] == 0:
            out_counts["ice"] = int(out_counts.get("ice", 0)) + 1
        return true
    # Crate HP blocks cell content; decremented on hit
    if int(crate_hp[p.y][p.x]) > 0:
        crate_hp[p.y][p.x] = max(0, int(crate_hp[p.y][p.x]) - 1)
        if crate_hp[p.y][p.x] == 0:
            out_counts["crate"] = int(out_counts.get("crate", 0)) + 1
        return true
    # Chocolate is consumed when hit
    if int(chocolate[p.y][p.x]) > 0:
        chocolate[p.y][p.x] = 0
        out_counts["chocolate"] = int(out_counts.get("chocolate", 0)) + 1
        return true
    # Honey HP decrements; blocks clears until 0
    if int(honey_hp[p.y][p.x]) > 0:
        honey_hp[p.y][p.x] = max(0, int(honey_hp[p.y][p.x]) - 1)
        if honey_hp[p.y][p.x] == 0:
            out_counts["honey"] = int(out_counts.get("honey", 0)) + 1
        return true
    # Licorice decrements when hit and absorbs stripes/rockets without letting them pass
    if int(licorice_hp[p.y][p.x]) > 0:
        licorice_hp[p.y][p.x] = max(0, int(licorice_hp[p.y][p.x]) - 1)
        if licorice_hp[p.y][p.x] == 0:
            out_counts["licorice"] = int(out_counts.get("licorice", 0)) + 1
        return true
    return false

func _spread_chocolate() -> void:
    # Simple spread: each existing chocolate attempts to fill one adjacent normal empty cell
    var sources: Array[Vector2i] = []
    for y in range(size.y):
        for x in range(size.x):
            if int(chocolate[y][x]) > 0:
                sources.append(Vector2i(x, y))
    sources.shuffle()
    for src in sources:
        var dirs = [Vector2i(1,0), Vector2i(-1,0), Vector2i(0,1), Vector2i(0,-1)]
        dirs.shuffle()
        for d in dirs:
            var np := src + d
            if not _in_bounds(np) or _is_hole(np):
                continue
            if grid[np.y][np.x] != null:
                continue
            chocolate[np.y][np.x] = 1
            break

func _spread_honey() -> void:
    # Honey attempts to grow to adjacent occupied tiles if HP > 0
    var sources: Array[Vector2i] = []
    for y in range(size.y):
        for x in range(size.x):
            if int(honey_hp[y][x]) > 0:
                sources.append(Vector2i(x, y))
    sources.shuffle()
    for src in sources:
        var dirs = [Vector2i(1,0), Vector2i(-1,0), Vector2i(0,1), Vector2i(0,-1)]
        dirs.shuffle()
        for d in dirs:
            var np := src + d
            if not _in_bounds(np) or _is_hole(np):
                continue
            if grid[np.y][np.x] == null:
                continue
            if int(honey_hp[np.y][np.x]) > 0:
                continue
            honey_hp[np.y][np.x] = 1
            break

# Vines spread to adjacent occupied cells after cascades
func _spread_vines() -> void:
    var sources: Array[Vector2i] = []
    for y in range(size.y):
        for x in range(size.x):
            if int(vines[y][x]) > 0:
                sources.append(Vector2i(x, y))
    sources.shuffle()
    for src in sources:
        var dirs = [Vector2i(1,0), Vector2i(-1,0), Vector2i(0,1), Vector2i(0,-1)]
        dirs.shuffle()
        for d in dirs:
            var np := src + d
            if not _in_bounds(np) or _is_hole(np):
                continue
            if grid[np.y][np.x] == null:
                continue
            if int(vines[np.y][np.x]) > 0:
                continue
            vines[np.y][np.x] = 1
            break

func _choose_spawn_color() -> int:
    if spawn_weights.is_empty():
        return rng.randi_range(0, num_colors - 1)
    var total := 0
    for k in spawn_weights.keys():
        total += int(spawn_weights[k])
    if total <= 0:
        return rng.randi_range(0, num_colors - 1)
    var r := rng.randi_range(1, total)
    var acc := 0
    for k in spawn_weights.keys():
        acc += int(spawn_weights[k])
        if r <= acc:
            return int(k)
    return rng.randi_range(0, num_colors - 1)

func _process_ingredient_delivery_and_spawn() -> int:
    var delivered := 0
    # Deliver ingredients that reached exit rows (bottom rows typically)
    for x in range(size.x):
        for y in range(size.y):
            if grid[y][x] != null and Types.is_ingredient(grid[y][x]) and drop_exit_rows.has(y) and not _is_hole(Vector2i(x,y)):
                grid[y][x] = null
                delivered += 1
                if ingredients_remaining > 0:
                    ingredients_remaining -= 1
                break
    # Spawn ingredients at top in configured columns if any remaining
    if ingredients_remaining > 0:
        for col in ingredient_spawn_cols:
            var top := Vector2i(col, 0)
            if _in_bounds(top) and not _is_hole(top) and grid[top.y][top.x] == null:
                grid[top.y][top.x] = Types.make_ingredient()
    return delivered

func _column_has_ingredient(x: int) -> bool:
    for y in range(size.y):
        var p = grid[y][x]
        if p != null and Types.is_ingredient(p):
            return true
    return false

# Public setters used by LevelManager to apply advanced layout
func set_hole(p: Vector2i, is_hole: bool) -> void:
    if _in_bounds(p):
        holes[p.y][p.x] = is_hole
        if is_hole:
            grid[p.y][p.x] = null

func set_crate(p: Vector2i, hp: int) -> void:
    if _in_bounds(p):
        crate_hp[p.y][p.x] = max(0, hp)

func set_ice(p: Vector2i, hp: int) -> void:
    if _in_bounds(p):
        ice_hp[p.y][p.x] = max(0, hp)

func set_lock(p: Vector2i, locked_on: bool) -> void:
    if _in_bounds(p):
        locked[p.y][p.x] = locked_on

func set_chocolate(p: Vector2i, present: bool) -> void:
    if _in_bounds(p):
        chocolate[p.y][p.x] = present ? 1 : 0

func set_licorice(p: Vector2i, hp: int) -> void:
    if _in_bounds(p):
        licorice_hp[p.y][p.x] = max(0, hp)

func set_spawn_weights(weights: Dictionary) -> void:
    spawn_weights = weights.duplicate()

func configure_drop_mode(enabled: bool, exit_rows: Array[int], spawn_cols: Array[int], total_ingredients: int) -> void:
    drop_mode_enabled = enabled
    drop_exit_rows = exit_rows.duplicate()
    ingredient_spawn_cols = spawn_cols.duplicate()
    ingredients_remaining = max(0, total_ingredients)
    

# Special + Special combo activations (triggered explicitly from gameplay)
func activate_color_bomb_combo(a: Vector2i, b: Vector2i) -> Dictionary:
    var pa = grid[a.y][a.x]
    var pb = grid[b.y][b.x]
    var to_clear: Array[Vector2i] = []
    # CB + CB clears entire board
    if Types.is_color_bomb(pa) and Types.is_color_bomb(pb):
        for yy in range(size.y):
            for xx in range(size.x):
                to_clear.append(Vector2i(xx, yy))
    else:
        var other := Types.is_color_bomb(pa) ? pb : pa
        var target_color := other.get("color")
        if target_color == null:
            target_color = _most_common_color()
        if Types.is_rocket(other):
            # Clear rows and columns for each target-colored piece
            for yy in range(size.y):
                for xx in range(size.x):
                    var p2 = grid[yy][xx]
                    if p2 != null and not Types.is_color_bomb(p2) and p2.get("color") == target_color:
                        for ex in range(size.x):
                            to_clear.append(Vector2i(ex, yy))
                        for ey in range(size.y):
                            to_clear.append(Vector2i(xx, ey))
        elif Types.is_bomb(other):
            # 3x3 clears around each target-colored piece
            for yy in range(size.y):
                for xx in range(size.x):
                    var p3 = grid[yy][xx]
                    if p3 != null and not Types.is_color_bomb(p3) and p3.get("color") == target_color:
                        for by in range(max(0, yy - 1), min(size.y, yy + 2)):
                            for bx in range(max(0, xx - 1), min(size.x, xx + 2)):
                                to_clear.append(Vector2i(bx, by))
        else:
            # Default CB + normal: clear all of that color
            for yy in range(size.y):
                for xx in range(size.x):
                    var p4 = grid[yy][xx]
                    if p4 != null and not Types.is_color_bomb(p4) and p4.get("color") == target_color:
                        to_clear.append(Vector2i(xx, yy))
    # Also clear the color bomb tiles themselves
    to_clear.append(a)
    to_clear.append(b)
    var initial := _clear_positions_collect_counts(to_clear)
    _apply_gravity_and_fill()
    return initial

func activate_double_rocket(a: Vector2i, b: Vector2i) -> Dictionary:
    var to_clear: Array[Vector2i] = []
    # Clear rows and columns for both positions
    for xx in range(size.x):
        to_clear.append(Vector2i(xx, a.y))
        to_clear.append(Vector2i(xx, b.y))
    for yy in range(size.y):
        to_clear.append(Vector2i(a.x, yy))
        to_clear.append(Vector2i(b.x, yy))
    var initial := _clear_positions_collect_counts(to_clear)
    _apply_gravity_and_fill()
    return initial

func activate_bomb_rocket(a: Vector2i, b: Vector2i) -> Dictionary:
    var pa = grid[a.y][a.x]
    var pb = grid[b.y][b.x]
    var rocket_pos := Types.is_rocket(pa) ? a : b
    var rocket := grid[rocket_pos.y][rocket_pos.x]
    var to_clear: Array[Vector2i] = []
    if rocket.get("kind") == Types.PieceKind.ROCKET_H:
        for dy in range(-1, 2):
            var y := rocket_pos.y + dy
            if y < 0 or y >= size.y:
                continue
            for xx in range(size.x):
                to_clear.append(Vector2i(xx, y))
    else:
        for dx in range(-1, 2):
            var x := rocket_pos.x + dx
            if x < 0 or x >= size.x:
                continue
            for yy in range(size.y):
                to_clear.append(Vector2i(x, yy))
    # Include original positions
    to_clear.append(a)
    to_clear.append(b)
    var initial := _clear_positions_collect_counts(to_clear)
    _apply_gravity_and_fill()
    return initial

func activate_bomb_bomb(a: Vector2i, b: Vector2i) -> Dictionary:
    var to_clear: Array[Vector2i] = []
    for center in [a, b]:
        for yy in range(max(0, center.y - 2), min(size.y, center.y + 3)):
            for xx in range(max(0, center.x - 2), min(size.x, center.x + 3)):
                to_clear.append(Vector2i(xx, yy))
    var initial := _clear_positions_collect_counts(to_clear)
    _apply_gravity_and_fill()
    return initial

func _clear_positions_collect_counts(to_clear: Array[Vector2i]) -> Dictionary:
    var seen := {}
    var cleared := 0
    var jelly_cleared := 0
    var color_counts := {}
    for p in to_clear:
        var key := str(p.x) + "," + str(p.y)
        if seen.has(key):
            continue
        seen[key] = true
        if not _in_bounds(p):
            continue
        var piece = grid[p.y][p.x]
        if piece != null:
            var c := piece.get("color")
            if c != null:
                color_counts[c] = int(color_counts.get(c, 0)) + 1
            grid[p.y][p.x] = null
            cleared += 1
        jelly_cleared += _hit_jelly_at(p)
    return { "cleared": cleared, "color_counts": color_counts, "jelly_cleared": jelly_cleared }

# --- Portals configuration ---
func _portal_key(p: Vector2i) -> String:
    return str(p.x) + "," + str(p.y)

func _portal_exit_if_any(p: Vector2i) -> Vector2i:
    var key := _portal_key(p)
    if portals.has(key):
        return portals[key]
    return null

func _conveyor_key(p: Vector2i) -> String:
    return str(p.x) + "," + str(p.y)

func _conveyor_next_if_any(p: Vector2i) -> Vector2i:
    var key := _conveyor_key(p)
    if conveyors.has(key):
        return conveyors[key]
    return null

func set_vine(p: Vector2i, present: bool) -> void:
    if _in_bounds(p):
        vines[p.y][p.x] = present ? 1 : 0

func set_portal(entry: Vector2i, exit: Vector2i) -> void:
    portals[_portal_key(entry)] = exit
