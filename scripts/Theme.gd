extends Resource
class_name ThemeProvider

const Types := preload("res://scripts/match3/Types.gd")

var name: String = "default"
var color_textures: Array = [] # index -> Texture2D

func _init(theme_name: String = "default") -> void:
	name = theme_name
	# Attempt to load theme config; otherwise, generate colored squares
	var ok := _load_theme_images(theme_name)
	if not ok:
		_generate_color_textures()

func _generate_color_textures(colors: int = 8) -> void:
	color_textures.clear()
	var palette := [
		Color8(231, 76, 60), Color8(52, 152, 219), Color8(46, 204, 113),
		Color8(155, 89, 182), Color8(241, 196, 15), Color8(230, 126, 34),
		Color8(26, 188, 156), Color8(149, 165, 166)
	]
	for i in range(colors):
		var img := Image.create(96, 96, false, Image.FORMAT_RGBA8)
		img.fill(palette[i % palette.size()])
		var tex := ImageTexture.create_from_image(img)
		color_textures.append(tex)

func _load_theme_images(theme_name: String) -> bool:
	var cfg_path := "res://config/themes/%s.json" % theme_name
	if not FileAccess.file_exists(cfg_path):
		return false
	var f := FileAccess.open(cfg_path, FileAccess.READ)
	if not f:
		return false
	var data = JSON.parse_string(f.get_as_text())
	f.close()
	if typeof(data) != TYPE_DICTIONARY:
		return false
	var paths: Array = data.get("colors", [])
	color_textures.clear()
	for p in paths:
		var tex: Texture2D = load(p)
		if tex:
			color_textures.append(tex)
		else:
			return false
	return true

func get_texture_for_piece(piece: Dictionary) -> Texture2D:
	if piece == null:
		return _make_clear_texture()
	if Types.is_color_bomb(piece):
		return _make_color_bomb_texture()
	var color_index := int(piece.get("color", 0))
	if color_index >= 0 and color_index < color_textures.size():
		return color_textures[color_index]
	return color_textures[0] if color_textures.size() > 0 else _make_clear_texture()

func _make_clear_texture() -> Texture2D:
	var img := Image.create(96, 96, false, Image.FORMAT_RGBA8)
	img.fill(Color(0, 0, 0, 0))
	return ImageTexture.create_from_image(img)

func _make_color_bomb_texture() -> Texture2D:
	var img := Image.create(96, 96, false, Image.FORMAT_RGBA8)
	img.fill(Color(0.1, 0.1, 0.1, 1))
	for i in range(6):
		var c := Color.from_hsv(float(i) / 6.0, 0.8, 0.9)
		for y in range(16 * i, min(96, 16 * (i + 1))):
			for x in range(0, 96):
				img.set_pixel(x, y, c)
	return ImageTexture.create_from_image(img)
