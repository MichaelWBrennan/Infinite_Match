extends Resource
class_name ThemeProvider

const Types := preload("res://scripts/match3/Types.gd")

var name: String = "default"
var color_textures: Array = [] # index -> Texture2D
var chosen_set_dir: String = ""

func _init(theme_name: String = "default", preferred_set_dir: String = "") -> void:
    name = theme_name
    var ok := false
    # If a preferred set dir is provided, try that first
    if preferred_set_dir != "":
        if _load_color_series_from_dir(preferred_set_dir):
            chosen_set_dir = preferred_set_dir
            ok = true
    if not ok:
        ok = _load_theme_images(theme_name)
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
    var theme_dir := "res://assets/match3/%s" % theme_name
    if DirAccess.dir_exists_absolute(theme_dir):
        # Prefer a subfolder set if available (set_*/any folder with color_*.png)
        var set_dir := _pick_set_dir(theme_dir)
        if set_dir != "":
            if _load_color_series_from_dir(set_dir):
                chosen_set_dir = set_dir
                return true
        # Fallback to root files color_*.png
        if _load_color_series_from_dir(theme_dir):
            chosen_set_dir = theme_dir
            return true
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

func _load_color_series_from_dir(dir_path: String) -> bool:
    color_textures.clear()
    for i in range(5):
        var p := "%s/color_%d.png" % [dir_path, i]
        if FileAccess.file_exists(p):
            var tex: Texture2D = load(p)
            if tex:
                color_textures.append(tex)
    return color_textures.size() >= 3

func _pick_set_dir(theme_dir: String) -> String:
    var dirs: Array[String] = []
    var da := DirAccess.open(theme_dir)
    if da:
        da.list_dir_begin()
        while true:
            var item := da.get_next()
            if item == "":
                break
            if da.current_is_dir() and not item.begins_with("."):
                var candidate := "%s/%s" % [theme_dir, item]
                # Check it has at least color_0.png
                if FileAccess.file_exists("%s/color_0.png" % candidate):
                    dirs.append(candidate)
        da.list_dir_end()
    if dirs.is_empty():
        return ""
    # Deterministic daily selection
    var day_seed := int(Time.get_unix_time_from_system() / 86400)
    var idx := abs(int(hash([theme_dir, day_seed])) % dirs.size())
    return dirs[idx]

func get_texture_for_piece(piece: Dictionary) -> Texture2D:
	if piece == null:
		return _make_clear_texture()
	if Types.is_color_bomb(piece):
		return _make_color_bomb_texture()
	if Types.is_ingredient(piece):
		return _make_ingredient_texture()
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

func _make_ingredient_texture() -> Texture2D:
    var img := Image.create(96, 96, false, Image.FORMAT_RGBA8)
    img.fill(Color(0.95, 0.95, 0.95, 1))
    # Draw a simple down arrow to hint drop objective
    var arrow_color := Color(0.1, 0.1, 0.1, 1)
    for y in range(30, 80):
        var width := int((y - 30) / 3)
        for x in range(48 - width, 48 + width):
            img.set_pixel(x, y, arrow_color)
    for y in range(65, 90):
        for x in range(40, 56):
            img.set_pixel(x, y, arrow_color)
    return ImageTexture.create_from_image(img)
