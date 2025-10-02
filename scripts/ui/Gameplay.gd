extends Control

const GRID_SIZE := Vector2i(8, 8)
const NUM_COLORS := 5

@onready var grid: GridContainer = $Grid
@onready var energy_label: Label = $TopBar/EnergyLabel
@onready var moves_label: Label = $TopBar/MovesLabel
@onready var coins_label: Label = $TopBar/CoinsLabel
@onready var booster_bomb: Button = $BottomBar/BoosterBomb
@onready var booster_shuffle: Button = $BottomBar/BoosterShuffle
@onready var rewarded_button: Button = $BottomBar/RewardedButton
@onready var banner_spacer: Control = $BannerSpacer

var moves_left: int = 20
var rng := RandomNumberGenerator.new()
var tiles: Array = [] # 2D: tiles[y][x] stores color index
var buttons: Array = [] # 2D parallel of Buttons
var first_selected: Vector2i = Vector2i(-1, -1)
var show_interstitial_on_gameover := false

func _ready() -> void:
    rng.randomize()
    _apply_banner_padding()
    if not GameState.consume_energy(1):
        AdManager.show_rewarded_ad("energy", func(amount: int):
            GameState.add_coins(amount)
        )
    show_interstitial_on_gameover = GameState.start_game_round()
    _init_board()
    booster_bomb.pressed.connect(_on_bomb)
    booster_shuffle.pressed.connect(_on_shuffle)
    rewarded_button.pressed.connect(_on_rewarded)
    _update_ui()

func _apply_banner_padding() -> void:
    banner_spacer.custom_minimum_size.y = AdManager.get_banner_height_px()

func _init_board() -> void:
    tiles.resize(GRID_SIZE.y)
    buttons.resize(GRID_SIZE.y)
    grid.clear()
    for y in range(GRID_SIZE.y):
        tiles[y] = []
        buttons[y] = []
        for x in range(GRID_SIZE.x):
            var color := rng.randi_range(0, NUM_COLORS - 1)
            tiles[y].append(color)
            var b := Button.new()
            b.text = str(color)
            var pos := Vector2i(x, y)
            b.pressed.connect(func(): _on_cell_pressed(pos))
            buttons[y].append(b)
            grid.add_child(b)
    _resolve_board() # ensure no starting matches or resolve them for a fresh board

func _on_cell_pressed(pos: Vector2i) -> void:
    if first_selected == Vector2i(-1, -1):
        first_selected = pos
        _highlight(pos, true)
        return
    if pos == first_selected:
        _highlight(first_selected, false)
        first_selected = Vector2i(-1, -1)
        return
    if _is_adjacent(first_selected, pos):
        _swap(first_selected, pos)
        var any_matches := _has_matches()
        if any_matches:
            moves_left -= 1
            _resolve_board()
            _update_ui()
            if moves_left <= 0:
                _on_game_over()
        else:
            _swap(first_selected, pos) # swap back
        _highlight(first_selected, false)
        first_selected = Vector2i(-1, -1)
    else:
        _highlight(first_selected, false)
        first_selected = pos
        _highlight(first_selected, true)

func _swap(a: Vector2i, b: Vector2i) -> void:
    var tmp := tiles[a.y][a.x]
    tiles[a.y][a.x] = tiles[b.y][b.x]
    tiles[b.y][b.x] = tmp
    _refresh_button(a)
    _refresh_button(b)

func _highlight(p: Vector2i, on: bool) -> void:
    var btn: Button = buttons[p.y][p.x]
    btn.add_theme_color_override("font_color", on ? Color.YELLOW : Color.WHITE)

func _is_adjacent(a: Vector2i, b: Vector2i) -> bool:
    var d := abs(a.x - b.x) + abs(a.y - b.y)
    return d == 1

func _has_matches() -> bool:
    return _find_matches().size() > 0

func _find_matches() -> Array[Vector2i]:
    var matched: Array[Vector2i] = []
    # Rows
    for y in range(GRID_SIZE.y):
        var run_len := 1
        for x in range(1, GRID_SIZE.x + 1):
            var same := (x < GRID_SIZE.x and tiles[y][x] == tiles[y][x - 1])
            if same:
                run_len += 1
            else:
                if run_len >= 3:
                    for k in range(run_len):
                        matched.append(Vector2i(x - 1 - k, y))
                run_len = 1
    # Columns
    for x in range(GRID_SIZE.x):
        var run_len2 := 1
        for y in range(1, GRID_SIZE.y + 1):
            var same2 := (y < GRID_SIZE.y and tiles[y][x] == tiles[y - 1][x])
            if same2:
                run_len2 += 1
            else:
                if run_len2 >= 3:
                    for k in range(run_len2):
                        matched.append(Vector2i(x, y - 1 - k))
                run_len2 = 1
    # Deduplicate
    var set := {}
    var unique: Array[Vector2i] = []
    for p in matched:
        var key := str(p.x, ",", p.y)
        if not set.has(key):
            set[key] = true
            unique.append(p)
    return unique

func _resolve_board() -> void:
    while true:
        var matches := _find_matches()
        if matches.is_empty():
            break
        # Reward coins and clear
        GameState.add_coins(matches.size())
        for p in matches:
            tiles[p.y][p.x] = -1
        _apply_gravity_and_fill()
        _refresh_all_buttons()

func _apply_gravity_and_fill() -> void:
    for x in range(GRID_SIZE.x):
        var write_y := GRID_SIZE.y - 1
        for y in range(GRID_SIZE.y - 1, -1, -1):
            if tiles[y][x] != -1:
                tiles[write_y][x] = tiles[y][x]
                write_y -= 1
        while write_y >= 0:
            tiles[write_y][x] = rng.randi_range(0, NUM_COLORS - 1)
            write_y -= 1

func _refresh_button(p: Vector2i) -> void:
    var b: Button = buttons[p.y][p.x]
    b.text = str(tiles[p.y][p.x])

func _refresh_all_buttons() -> void:
    for y in range(GRID_SIZE.y):
        for x in range(GRID_SIZE.x):
            _refresh_button(Vector2i(x, y))

func _on_bomb() -> void:
    if GameState.spend_coins(50):
        var cx := rng.randi_range(1, GRID_SIZE.x - 2)
        var cy := rng.randi_range(1, GRID_SIZE.y - 2)
        for y in range(cy - 1, cy + 2):
            for x in range(cx - 1, cx + 2):
                tiles[y][x] = -1
        _apply_gravity_and_fill()
        _refresh_all_buttons()

func _on_shuffle() -> void:
    if GameState.spend_coins(20):
        var flat: Array = []
        for y in range(GRID_SIZE.y):
            for x in range(GRID_SIZE.x):
                flat.append(tiles[y][x])
        flat.shuffle()
        var i := 0
        for y in range(GRID_SIZE.y):
            for x in range(GRID_SIZE.x):
                tiles[y][x] = flat[i]
                i += 1
        _refresh_all_buttons()

func _on_rewarded() -> void:
    AdManager.show_rewarded_ad("extra_moves", func(amount: int):
        moves_left += 3
        _update_ui()
    )

func _on_game_over() -> void:
    if show_interstitial_on_gameover:
        AdManager.show_interstitial_ad("game_over")
    var ask_continue := true
    if ask_continue:
        AdManager.show_rewarded_ad("continue", func(amount: int):
            moves_left = 5
            _update_ui()
        )
    else:
        get_tree().change_scene_to_file("res://scenes/MainMenu.tscn")

func _update_ui() -> void:
    energy_label.text = "Energy: %d/%d" % [GameState.get_energy(), GameState.energy_max]
    moves_label.text = "Moves: %d" % moves_left
    coins_label.text = "Coins: %d" % GameState.coins
