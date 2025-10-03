extends Node
class_name TileView

const Types := preload("res://scripts/match3/Types.gd")

var grid_container: GridContainer
var board
var theme
var buttons: Array = [] # 2D Buttons with icon textures
var on_cell_pressed: Callable = func(_pos: Vector2i): pass
var jelly_overlays: Array = [] # 2D TextureRects
var blocker_overlays: Array = [] # crate/ice/lock/chocolate overlays
var vine_overlays: Array = [] # vines overlays
var licorice_overlays: Array = [] # licorice overlays
var conveyor_overlays: Array = [] # arrows
var color_blind_symbols: Array[Texture2D] = []

func setup(container: GridContainer, match3_board, theme_provider, pressed_cb: Callable) -> void:
	grid_container = container
	board = match3_board
	theme = theme_provider
	on_cell_pressed = pressed_cb
	_ensure_color_blind_symbols(board.num_colors)
	_render_all()

func _render_all() -> void:
	buttons.resize(board.size.y)
    jelly_overlays.resize(board.size.y)
    blocker_overlays.resize(board.size.y)
    vine_overlays.resize(board.size.y)
    licorice_overlays.resize(board.size.y)
    conveyor_overlays.resize(board.size.y)
    grid_container.columns = board.size.x
    for child in grid_container.get_children():
        child.queue_free()
	for y in range(board.size.y):
		buttons[y] = []
        jelly_overlays[y] = []
        blocker_overlays[y] = []
        vine_overlays[y] = []
        licorice_overlays[y] = []
        conveyor_overlays[y] = []
		for x in range(board.size.x):
			var btn := Button.new()
			btn.focus_mode = Control.FOCUS_NONE
            btn.text = ""
			btn.expand_icon = true
			btn.icon_alignment = HORIZONTAL_ALIGNMENT_CENTER
			var pos := Vector2i(x, y)
            btn.pressed.connect(func(): on_cell_pressed.call(pos))
            buttons[y].append(btn)
			grid_container.add_child(btn)
            # Jelly overlay as a child control stacked above the button
            var overlay := ColorRect.new()
            overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
            overlay.color = Color(0.2, 0.8, 1.0, 0.25)
            overlay.size_flags_horizontal = Control.SIZE_FILL
            overlay.size_flags_vertical = Control.SIZE_FILL
            overlay.visible = false
            jelly_overlays[y].append(overlay)
            btn.add_child(overlay)
            # Blocker overlay
            var bo := ColorRect.new()
            bo.mouse_filter = Control.MOUSE_FILTER_IGNORE
            bo.color = Color(0.4, 0.25, 0.1, 0.3) # default crate tint
            bo.size_flags_horizontal = Control.SIZE_FILL
            bo.size_flags_vertical = Control.SIZE_FILL
            bo.visible = false
            blocker_overlays[y].append(bo)
            btn.add_child(bo)
            # Vine overlay (green tint)
            var vo := ColorRect.new()
            vo.mouse_filter = Control.MOUSE_FILTER_IGNORE
            vo.color = Color(0.1, 0.6, 0.2, 0.35)
            vo.size_flags_horizontal = Control.SIZE_FILL
            vo.size_flags_vertical = Control.SIZE_FILL
            vo.visible = false
            vine_overlays[y].append(vo)
            btn.add_child(vo)
            # Licorice overlay (dark grid)
            var lo := ColorRect.new()
            lo.mouse_filter = Control.MOUSE_FILTER_IGNORE
            lo.color = Color(0.05, 0.05, 0.05, 0.6)
            lo.size_flags_horizontal = Control.SIZE_FILL
            lo.size_flags_vertical = Control.SIZE_FILL
            lo.visible = false
            licorice_overlays[y].append(lo)
            btn.add_child(lo)
            # Conveyor overlay arrow
            var co := Label.new()
            co.mouse_filter = Control.MOUSE_FILTER_IGNORE
            co.text = "➤"
            co.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
            co.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
            co.visible = false
            conveyor_overlays[y].append(co)
            btn.add_child(co)
	_update_all_textures()

func update_cell(p: Vector2i) -> void:
	var btn: Button = buttons[p.y][p.x]
    var tex := theme.get_texture_for_piece(board.get_piece(p))
    if GameState.color_blind_mode and board.get_piece(p) != null:
        # Overlay a simple symbol image for color-blind accessibility
        var color := int(board.get_piece(p).get("color", -1))
        if color >= 0 and color < color_blind_symbols.size() and color_blind_symbols[color] != null:
            # Compose by setting the Button icon to the base texture; symbol could be drawn via a child
            btn.icon = tex
            # Ensure a symbol child exists
            var sym: TextureRect = btn.get_node_or_null("CBIcon")
            if sym == null:
                sym = TextureRect.new()
                sym.name = "CBIcon"
                sym.mouse_filter = Control.MOUSE_FILTER_IGNORE
                sym.stretch_mode = TextureRect.STRETCH_SCALE
                sym.size_flags_horizontal = Control.SIZE_FILL
                sym.size_flags_vertical = Control.SIZE_FILL
                btn.add_child(sym)
            sym.texture = color_blind_symbols[color]
            sym.visible = true
        else:
            btn.icon = tex
            var sym2: TextureRect = btn.get_node_or_null("CBIcon")
            if sym2:
                sym2.visible = false
    else:
        btn.icon = tex
        var sym3: TextureRect = btn.get_node_or_null("CBIcon")
        if sym3:
            sym3.visible = false
    _update_jelly_overlay(p)
    _update_blocker_overlay(p)
    _update_vine_overlay(p)
    _update_licorice_overlay(p)
    _update_conveyor_overlay(p)

func _ensure_color_blind_symbols(count: int) -> void:
    if color_blind_symbols.size() >= count:
        return
    color_blind_symbols.resize(count)
    for i in range(count):
        color_blind_symbols[i] = _make_symbol_texture(i)

func _make_symbol_texture(index: int) -> Texture2D:
    var size := 96
    var img := Image.create(size, size, false, Image.FORMAT_RGBA8)
    img.fill(Color(0,0,0,0))
    var cx := size / 2
    var cy := size / 2
    var r := size / 4
    # Draw black border then white fill for contrast
    func set_px(x: int, y: int, c: Color) -> void:
        if x >= 0 and x < size and y >= 0 and y < size:
            img.set_pixel(x, y, c)
    match index % 6:
        0:
            # Circle
            for y in range(size):
                for x in range(size):
                    var dx := x - cx
                    var dy := y - cy
                    var d2 := dx*dx + dy*dy
                    if d2 <= (r*r):
                        set_px(x, y, Color(1,1,1,0.9))
                    elif d2 <= ((r+1)*(r+1)):
                        set_px(x, y, Color(0,0,0,1))
        1:
            # Square
            for y in range(cy - r, cy + r):
                for x in range(cx - r, cx + r):
                    set_px(x, y, Color(1,1,1,0.9))
            for x in range(cx - r - 1, cx + r + 1):
                set_px(x, cy - r - 1, Color(0,0,0,1))
                set_px(x, cy + r, Color(0,0,0,1))
            for y in range(cy - r - 1, cy + r + 1):
                set_px(cx - r - 1, y, Color(0,0,0,1))
                set_px(cx + r, y, Color(0,0,0,1))
        2:
            # Triangle (up)
            for y in range(cy - r, cy + r):
                var span := int(float(y - (cy - r)) / float(2*r) * (2*r))
                for x in range(cx - span/2, cx + span/2):
                    set_px(x, y, Color(1,1,1,0.9))
        3:
            # Diamond
            for y in range(size):
                for x in range(size):
                    var d := abs(x - cx) + abs(y - cy)
                    if d <= r:
                        set_px(x, y, Color(1,1,1,0.9))
        4:
            # Plus
            var w := r / 2
            for y in range(cy - w, cy + w):
                for x in range(cx - r, cx + r): set_px(x, y, Color(1,1,1,0.9))
            for y2 in range(cy - r, cy + r):
                for x2 in range(cx - w, cx + w): set_px(x2, y2, Color(1,1,1,0.9))
        _:
            # Cross
            for t in range(-r, r):
                set_px(cx + t, cy + t, Color(1,1,1,0.9))
                set_px(cx + t, cy - t, Color(1,1,1,0.9))
    return ImageTexture.create_from_image(img)

func _update_all_textures() -> void:
	for y in range(board.size.y):
		for x in range(board.size.x):
			update_cell(Vector2i(x, y))
	# Ensure overlays reflect latest blockers after cascades
	for y2 in range(board.size.y):
		for x2 in range(board.size.x):
			_update_blocker_overlay(Vector2i(x2, y2))
			_update_vine_overlay(Vector2i(x2, y2))
			_update_licorice_overlay(Vector2i(x2, y2))
			_update_conveyor_overlay(Vector2i(x2, y2))

func highlight(p: Vector2i, on: bool) -> void:
	var btn: Button = buttons[p.y][p.x]
	btn.modulate = Color(1, 1, 0.6) if on else Color(1, 1, 1)

func _update_blocker_overlay(p: Vector2i) -> void:
    var overlay: Control = blocker_overlays[p.y][p.x]
    var visible := false
    # Show different tints for different blockers if present; reflect simple HP with alpha
    var hp := int(board.crate_hp[p.y][p.x])
    if hp > 0:
        overlay.color = Color(0.5, 0.35, 0.2, 0.25 + min(0.5, 0.1 * hp))
        visible = true
    var ihp := int(board.ice_hp[p.y][p.x])
    if ihp > 0:
        overlay.color = Color(0.6, 0.8, 1.0, 0.2 + min(0.5, 0.08 * ihp))
        visible = true
    if bool(board.locked[p.y][p.x]):
        overlay.color = Color(0.8, 0.8, 0.2, 0.35)
        visible = true
    if int(board.chocolate[p.y][p.x]) > 0:
        overlay.color = Color(0.25, 0.12, 0.05, 0.45)
        visible = true
    # If vines present, show vine overlay instead of blocker overlay tint
    if not vine_overlays.is_empty() and board.vines.size() == board.size.y and int(board.vines[p.y][p.x]) > 0:
        visible = false
    # If licorice present, show its overlay instead
    if not licorice_overlays.is_empty() and board.licorice_hp.size() == board.size.y and int(board.licorice_hp[p.y][p.x]) > 0:
        visible = false
    # If honey present, tint blocker overlay amber
    if board.honey_hp.size() == board.size.y and int(board.honey_hp[p.y][p.x]) > 0:
        overlay.color = Color(0.95, 0.7, 0.2, 0.35)
        visible = true
    overlay.visible = visible

func _update_vine_overlay(p: Vector2i) -> void:
    if vine_overlays.is_empty():
        return
    var vo: Control = vine_overlays[p.y][p.x]
    var on := 0
    # Board.vines is an array; guard for presence and dimensions
    if board != null and board.has_method("to_color_grid") and board.vines.size() == board.size.y:
        on = int(board.vines[p.y][p.x])
    vo.visible = on > 0

func _update_licorice_overlay(p: Vector2i) -> void:
    if licorice_overlays.is_empty():
        return
    var lo: Control = licorice_overlays[p.y][p.x]
    var hp := 0
    if board != null and board.licorice_hp.size() == board.size.y:
        hp = int(board.licorice_hp[p.y][p.x])
    lo.visible = hp > 0

func _update_conveyor_overlay(p: Vector2i) -> void:
    if conveyor_overlays.is_empty():
        return
    var lab: Label = conveyor_overlays[p.y][p.x]
    lab.visible = false
    if board != null and board.conveyors.has(str(p.x)+","+str(p.y)):
        var next: Vector2i = board.conveyors[str(p.x)+","+str(p.y)]
        var dx := next.x - p.x
        var dy := next.y - p.y
        if abs(dx) + abs(dy) == 1:
            if dx == 1: lab.rotation_degrees = 0
            elif dx == -1: lab.rotation_degrees = 180
            elif dy == 1: lab.rotation_degrees = 90
            elif dy == -1: lab.rotation_degrees = 270
            lab.visible = true

func _update_jelly_overlay(p: Vector2i) -> void:
    var overlay: Control = jelly_overlays[p.y][p.x]
    var layers := 0
    if board.has_method("get_jelly"):
        layers = int(board.get_jelly(p))
    overlay.visible = layers > 0
    if layers == 1:
        overlay.color = Color(0.2, 0.8, 1.0, 0.25)
    elif layers >= 2:
        overlay.color = Color(0.1, 0.5, 1.0, 0.35)
