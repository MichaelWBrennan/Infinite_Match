extends Node
class_name TileView

const Types := preload("res://scripts/match3/Types.gd")

var grid_container: GridContainer
var board
var theme
var buttons: Array = [] # 2D Buttons with icon textures
var on_cell_pressed: Callable = func(_pos: Vector2i): pass
var jelly_overlays: Array = [] # 2D TextureRects

func setup(container: GridContainer, match3_board, theme_provider, pressed_cb: Callable) -> void:
	grid_container = container
	board = match3_board
	theme = theme_provider
	on_cell_pressed = pressed_cb
	_render_all()

func _render_all() -> void:
	buttons.resize(board.size.y)
    jelly_overlays.resize(board.size.y)
    grid_container.columns = board.size.x
    for child in grid_container.get_children():
        child.queue_free()
	for y in range(board.size.y):
		buttons[y] = []
        jelly_overlays[y] = []
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
	_update_all_textures()

func update_cell(p: Vector2i) -> void:
	var btn: Button = buttons[p.y][p.x]
	btn.icon = theme.get_texture_for_piece(board.get_piece(p))
    _update_jelly_overlay(p)

func _update_all_textures() -> void:
	for y in range(board.size.y):
		for x in range(board.size.x):
			update_cell(Vector2i(x, y))

func highlight(p: Vector2i, on: bool) -> void:
	var btn: Button = buttons[p.y][p.x]
	btn.modulate = Color(1, 1, 0.6) if on else Color(1, 1, 1)

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
