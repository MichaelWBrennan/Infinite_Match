extends Control

const GRID_SIZE := Vector2i(8, 8)
const NUM_COLORS := 5
const Match3Board := preload("res://scripts/match3/Board.gd")
const LevelGenerator := preload("res://scripts/match3/LevelGenerator.gd")
const TileView := preload("res://scripts/ui/TileView.gd")
const ThemeProvider := preload("res://scripts/Theme.gd")
const EventScheduler := preload("res://scripts/Events.gd")
const LevelManager := preload("res://scripts/LevelManager.gd")

@onready var grid: GridContainer = $Grid
@onready var energy_label: Label = $TopBar/LeftCluster/EnergyValue
@onready var moves_label: Label = $TopBar/LeftCluster/MovesValue
@onready var coins_label: Label = $TopBar/RightCluster/CoinValue
@onready var goals_label: Label = $TopBar/RightCluster/GoalsLabel
@onready var booster_bomb: Button = $BottomBar/BoosterBomb
@onready var booster_shuffle: Button = $BottomBar/BoosterShuffle
@onready var booster_hammer: Button = $BottomBar/BoosterHammer
@onready var booster_rocket: Button = $BottomBar/BoosterRocket
@onready var banner_spacer: Control = $BannerSpacer

var moves_left: int = 20
var rng := RandomNumberGenerator.new()
var first_selected: Vector2i = Vector2i(-1, -1)
var board: Match3Board
var tile_view: TileView
var theme_provider: ThemeProvider
var show_interstitial_on_gameover := false

func _ready() -> void:
    rng.randomize()
    _apply_banner_padding()
    if not GameState.consume_energy(1):
        AdManager.show_rewarded_ad("energy", func(amount: int):
            GameState.add_coins(amount)
        )
    show_interstitial_on_gameover = GameState.start_game_round()
    _init_board_and_level()
    LevelManager.level_loaded.connect(func(_id): _refresh_goals_text())
    LevelManager.goals_updated.connect(func(_p): _refresh_goals_text())
    booster_bomb.pressed.connect(_on_bomb)
    booster_shuffle.pressed.connect(_on_shuffle)
    booster_hammer.pressed.connect(_on_hammer)
    booster_rocket.pressed.connect(_on_rocket)
    _update_ui()

func _apply_banner_padding() -> void:
    banner_spacer.custom_minimum_size.y = AdManager.get_banner_height_px()

func _init_board_and_level() -> void:
    var scheduler := EventScheduler.new()
    var theme_name := scheduler.get_current_theme_name()
    var set_dir := scheduler.get_daily_event_set_dir(theme_name)
    theme_provider = ThemeProvider.new(theme_name, set_dir)
    # Generate board based on level config
    var level_id := GameState.get_current_level()
    LevelManager.load_level(level_id)
    moves_left = LevelManager.move_limit
    var day_seed := int(Time.get_unix_time_from_system() / 86400)
    var seed := int(hash([day_seed, GameState.session_count_total, randi()])) & 0x7fffffff
    board = LevelGenerator.generate(LevelManager.board_size, LevelManager.num_colors, seed)
    LevelManager.apply_level_to_board(board)
    tile_view = TileView.new()
    add_child(tile_view)
    tile_view.setup(grid, board, theme_provider, func(pos: Vector2i): _on_cell_pressed(pos))
    _refresh_goals_text()

func _on_cell_pressed(pos: Vector2i) -> void:
    if first_selected == Vector2i(-1, -1):
        first_selected = pos
        _highlight(pos, true)
        return
    if pos == first_selected:
        _highlight(first_selected, false)
        first_selected = Vector2i(-1, -1)
        return
    if board.is_adjacent(first_selected, pos):
        board.swap(first_selected, pos)
        var any_matches := board.has_matches()
        if any_matches:
            moves_left -= 1
            var res := _resolve_after_swap_or_combo(first_selected, pos)
            GameState.add_coins(int(res.get("cleared", 0)))
            if Engine.has_singleton("PiggyBank"):
                PiggyBank.on_tiles_cleared(int(res.get("cleared", 0)))
            if Engine.has_singleton("SeasonPass"):
                SeasonPass.add_xp(int(res.get("cleared", 0)))
            tile_view._update_all_textures()
            _update_ui()
            _refresh_goals_text()
            if LevelManager.goals_completed():
                _on_level_won()
            if moves_left <= 0:
                _on_game_over()
        else:
            board.swap(first_selected, pos) # swap back
        _highlight(first_selected, false)
        first_selected = Vector2i(-1, -1)
    else:
        _highlight(first_selected, false)
        first_selected = pos
        _highlight(first_selected, true)

func _swap(a: Vector2i, b: Vector2i) -> void:
    board.swap(a, b)
    tile_view.update_cell(a)
    tile_view.update_cell(b)

func _highlight(p: Vector2i, on: bool) -> void:
    if tile_view:
        tile_view.highlight(p, on)

func _is_adjacent(a: Vector2i, b: Vector2i) -> bool:
    return board.is_adjacent(a, b)

func _has_matches() -> bool:
    return board.has_matches()

func _find_matches() -> Array[Vector2i]:
    return [] # Board handles match finding now

func _resolve_board() -> void:
    var result := board.resolve_board()
    LevelManager.on_resolve_result(result)
    GameState.add_coins(int(result.get("cleared", 0)))
    if Engine.has_singleton("PiggyBank"):
        PiggyBank.on_tiles_cleared(int(result.get("cleared", 0)))
    if Engine.has_singleton("SeasonPass"):
        SeasonPass.add_xp(int(result.get("cleared", 0)))
    tile_view._update_all_textures()

func _apply_gravity_and_fill() -> void:
    # handled in board
    pass

func _refresh_button(p: Vector2i) -> void:
    tile_view.update_cell(p)

func _refresh_all_buttons() -> void:
    tile_view._update_all_textures()

func _on_bomb() -> void:
    if GameState.spend_coins(Economy.booster_cost("bomb")):
        # Convert random normal cell into a bomb, then resolve
        var cx := rng.randi_range(1, GRID_SIZE.x - 2)
        var cy := rng.randi_range(1, GRID_SIZE.y - 2)
        var Types = preload("res://scripts/match3/Types.gd")
        var p := Vector2i(cx, cy)
        var piece := board.get_piece(p)
        var color := piece.get("color")
        board.set_piece(p, Types.make_bomb(color))
        var res := board.resolve_board()
        LevelManager.on_resolve_result(res)
        GameState.add_coins(int(res.get("cleared", 0)))
        tile_view._update_all_textures()

func _on_hammer() -> void:
    if GameState.spend_coins(Economy.booster_cost("hammer")):
        # remove a random tile
        var p := Vector2i(rng.randi_range(0, GRID_SIZE.x - 1), rng.randi_range(0, GRID_SIZE.y - 1))
        board.set_piece(p, null)
        var res := board.resolve_board()
        LevelManager.on_resolve_result(res)
        GameState.add_coins(int(res.get("cleared", 0)))
        tile_view._update_all_textures()

func _on_shuffle() -> void:
    if GameState.spend_coins(Economy.booster_cost("shuffle")):
        board.shuffle_random()
        tile_view._update_all_textures()

func _on_rocket() -> void:
    if GameState.spend_coins(Economy.booster_cost("rocket")):
        var Types = preload("res://scripts/match3/Types.gd")
        var p := Vector2i(rng.randi_range(0, GRID_SIZE.x - 1), rng.randi_range(0, GRID_SIZE.y - 1))
        var horiz := rng.randi_range(0, 1) == 0
        var color := int(board.get_piece(p).get("color"))
        board.set_piece(p, horiz ? Types.make_rocket_h(color) : Types.make_rocket_v(color))
        var res := board.resolve_board()
        LevelManager.on_resolve_result(res)
        GameState.add_coins(int(res.get("cleared", 0)))
        tile_view._update_all_textures()

func _on_rewarded() -> void:
    AdManager.show_rewarded_ad("extra_moves", func(amount: int):
        moves_left += 3
        _update_ui()
    )

func _on_game_over() -> void:
    if show_interstitial_on_gameover:
        AdManager.show_interstitial_ad("game_over")
    var modal := load("res://scenes/ContinueModal.tscn").instantiate()
    add_child(modal)

func _on_level_won() -> void:
    var score := GameState.coins # simplistic: use coins as session score proxy
    var stars := LevelManager.stars_for_score(score)
    GameState.complete_level(LevelManager.current_level_id, score, stars)
    AdManager.show_rewarded_ad("level_win", func(_amount: int):
        LevelManager.advance_to_next_level()
        get_tree().change_scene_to_file("res://scenes/Gameplay.tscn")
    )

func _refresh_goals_text() -> void:
    if goals_label:
        goals_label.text = LevelManager.describe_goals()

func _resolve_after_swap_or_combo(a: Vector2i, b: Vector2i) -> Dictionary:
    var pa := board.get_piece(a)
    var pb := board.get_piece(b)
    var result := {}
    var Types = preload("res://scripts/match3/Types.gd")
    if Types.is_color_bomb(pa) or Types.is_color_bomb(pb):
        result = board.activate_color_bomb_combo(a, b)
    elif Types.is_rocket(pa) and Types.is_rocket(pb):
        result = board.activate_double_rocket(a, b)
    elif (Types.is_bomb(pa) and Types.is_rocket(pb)) or (Types.is_bomb(pb) and Types.is_rocket(pa)):
        result = board.activate_bomb_rocket(a, b)
    elif Types.is_bomb(pa) and Types.is_bomb(pb):
        result = board.activate_bomb_bomb(a, b)
    else:
        result = board.resolve_board()
    LevelManager.on_resolve_result(result)
    return result

func _update_ui() -> void:
    energy_label.text = "Energy: %d/%d" % [GameState.get_energy(), GameState.energy_max]
    moves_label.text = "Moves: %d" % moves_left
    coins_label.text = "Coins: %d" % GameState.coins
