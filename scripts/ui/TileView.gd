extends Node
class_name TileView

const Types := preload("res://scripts/match3/Types.gd")

var grid_container: GridContainer
var board
var theme
var buttons: Array = [] # 2D Buttons with icon textures
var on_cell_pressed: Callable = func(_pos: Vector2i): pass

func setup(container: GridContainer, match3_board, theme_provider, pressed_cb: Callable) -> void:
	grid_container = container
	board = match3_board
	theme = theme_provider
	on_cell_pressed = pressed_cb
	_render_all()

func _render_all() -> void:
	buttons.resize(board.size.y)
    grid_container.columns = board.size.x
    for child in grid_container.get_children():
        child.queue_free()
	for y in range(board.size.y):
		buttons[y] = []
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
	_update_all_textures()

func update_cell(p: Vector2i) -> void:
	var btn: Button = buttons[p.y][p.x]
	btn.icon = theme.get_texture_for_piece(board.get_piece(p))

func _update_all_textures() -> void:
	for y in range(board.size.y):
		for x in range(board.size.x):
			update_cell(Vector2i(x, y))

func highlight(p: Vector2i, on: bool) -> void:
	var btn: Button = buttons[p.y][p.x]
	btn.modulate = Color(1, 1, 0.6) if on else Color(1, 1, 1)
