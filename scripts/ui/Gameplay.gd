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
var _hint_timer := 0.0
var _hint_interval := 6.0
var _last_hint_positions: Array[Vector2i] = []
var _soften_steps_applied: int = 0
var _ftue_step: int = 0
var _ftue_overlay: Control
var _ftue_pair: Array[Vector2i] = []

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
    set_process(true)
    _maybe_start_ftue()

func _process(delta: float) -> void:
    _hint_timer += delta
    if _hint_timer >= _hint_interval:
        _hint_timer = 0.0
        _show_hint()

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
    _apply_dynamic_difficulty_softeners()
    tile_view = TileView.new()
    add_child(tile_view)
    tile_view.setup(grid, board, theme_provider, func(pos: Vector2i): _on_cell_pressed(pos))
    _refresh_goals_text()
    _apply_prelevel_boosters()

func _on_cell_pressed(pos: Vector2i) -> void:
    _hint_timer = 0.0
    _clear_hint()
    if _ftue_block_input_except(pos):
        return
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
            if int(res.get("cleared", 0)) >= 10:
                Haptics.medium()
            elif int(res.get("cleared", 0)) >= 3:
                Haptics.light()
            GameState.add_tournament_points(int(res.get("cleared", 0)))
            if Engine.has_singleton("Bingo"):
                Bingo.progress("clear_tiles", int(res.get("cleared", 0)))
            if Engine.has_singleton("Treasure") and Treasure.active:
                Treasure.progress(int(res.get("cleared", 0)))
            if Engine.has_singleton("Teams"):
                Teams.add_points(int(res.get("cleared", 0)))
            if Engine.has_singleton("PiggyBank"):
                PiggyBank.on_tiles_cleared(int(res.get("cleared", 0)))
            if Engine.has_singleton("SeasonPass"):
                SeasonPass.add_xp(int(res.get("cleared", 0)))
            tile_view._update_all_textures()
            _update_ui()
            _refresh_goals_text()
            if not board.has_valid_move():
                board.shuffle_random()
                tile_view._update_all_textures()
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
    _advance_ftue_if_needed(pos)

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
    if not board.has_valid_move():
        board.shuffle_random()
        tile_view._update_all_textures()

func _apply_gravity_and_fill() -> void:
    # handled in board
    pass

func _refresh_button(p: Vector2i) -> void:
    tile_view.update_cell(p)

func _refresh_all_buttons() -> void:
    tile_view._update_all_textures()

func _on_bomb() -> void:
    if not _confirm_booster_if_needed("Bomb"):
        return
    if GameState.booster_consume("bomb", 1) or GameState.spend_coins(Economy.booster_cost("bomb")):
        GameState.record_booster_use("bomb")
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
    if not _confirm_booster_if_needed("Hammer"):
        return
    if GameState.booster_consume("hammer", 1) or GameState.spend_coins(Economy.booster_cost("hammer")):
        GameState.record_booster_use("hammer")
        var p := Vector2i(rng.randi_range(0, GRID_SIZE.x - 1), rng.randi_range(0, GRID_SIZE.y - 1))
        board.set_piece(p, null)
        var res := board.resolve_board()
        LevelManager.on_resolve_result(res)
        GameState.add_coins(int(res.get("cleared", 0)))
        tile_view._update_all_textures()

func _on_shuffle() -> void:
    if not _confirm_booster_if_needed("Shuffle"):
        return
    if GameState.booster_consume("shuffle", 1) or GameState.spend_coins(Economy.booster_cost("shuffle")):
        GameState.record_booster_use("shuffle")
        board.shuffle_random()
        tile_view._update_all_textures()

func _on_rocket() -> void:
    if not _confirm_booster_if_needed("Rocket"):
        return
    if GameState.booster_consume("rocket", 1) or GameState.spend_coins(Economy.booster_cost("rocket")):
        GameState.record_booster_use("rocket")
        var Types = preload("res://scripts/match3/Types.gd")
        var p := Vector2i(rng.randi_range(0, GRID_SIZE.x - 1), rng.randi_range(0, GRID_SIZE.y - 1))
        var horiz := rng.randi_range(0, 1) == 0
        var color := int(board.get_piece(p).get("color"))
        board.set_piece(p, horiz ? Types.make_rocket_h(color) : Types.make_rocket_v(color))
        var res := board.resolve_board()
        LevelManager.on_resolve_result(res)
        GameState.add_coins(int(res.get("cleared", 0)))
        tile_view._update_all_textures()

func _confirm_booster_if_needed(name: String) -> bool:
    if RemoteConfig.get_int("booster_confirm_enabled", 1) != 1:
        return true
    var dlg := ConfirmationDialog.new()
    dlg.title = Localize.t("booster.confirm.title", "Use Booster?")
    dlg.dialog_text = Localize.t("booster.confirm.desc", "Use %s now?" % name)
    add_child(dlg)
    var result := false
    dlg.confirmed.connect(func(): result = true)
    dlg.popup_centered()
    await dlg.tree_exited # Wait close
    return result

func _apply_prelevel_boosters() -> void:
    # Optionally place pre-level boosters
    var Types = preload("res://scripts/match3/Types.gd")
    if GameState.booster_consume("pre_bomb", 1):
        var p := Vector2i(rng.randi_range(1, GRID_SIZE.x - 2), rng.randi_range(1, GRID_SIZE.y - 2))
        var color := int(board.get_piece(p).get("color"))
        board.set_piece(p, Types.make_bomb(color))
    if GameState.booster_consume("pre_rocket", 1):
        var p2 := Vector2i(rng.randi_range(0, GRID_SIZE.x - 1), rng.randi_range(0, GRID_SIZE.y - 1))
        var horiz := rng.randi_range(0, 1) == 0
        var color2 := int(board.get_piece(p2).get("color"))
        board.set_piece(p2, horiz ? Types.make_rocket_h(color2) : Types.make_rocket_v(color2))
    if GameState.booster_consume("pre_color_bomb", 1):
        var p3 := Vector2i(rng.randi_range(0, GRID_SIZE.x - 1), rng.randi_range(0, GRID_SIZE.y - 1))
        board.set_piece(p3, Types.make_color_bomb())
    tile_view._update_all_textures()

func _on_rewarded() -> void:
    AdManager.show_rewarded_ad("extra_moves", func(amount: int):
        moves_left += 3
        _update_ui()
    )

func _on_game_over() -> void:
    if show_interstitial_on_gameover:
        AdManager.show_interstitial_ad("game_over")
    GameState.register_level_fail(LevelManager.current_level_id)
    var modal := load("res://scenes/ContinueModal.tscn").instantiate()
    add_child(modal)

func _on_level_won() -> void:
    var score := GameState.coins # simplistic: use coins as session score proxy
    var stars := LevelManager.stars_for_score(score)
    GameState.complete_level(LevelManager.current_level_id, score, stars)
    GameState.register_level_win(LevelManager.current_level_id)
    GameState.maybe_prompt_review_after_win()
    # Offer RV double-win if enabled
    var allow_double := RemoteConfig.get_int("rv_double_win_enabled", 1) == 1
    if allow_double:
        AdManager.show_rewarded_ad("level_win_double", func(_amount: int):
            # grant small coin bonus, then continue
            GameState.add_coins(RemoteConfig.get_int("reward_level_win", 10))
            LevelManager.advance_to_next_level()
            get_tree().change_scene_to_file("res://scenes/Gameplay.tscn")
        )
    else:
        AdManager.show_rewarded_ad("level_win", func(_amount2: int):
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
    coins_label.text = Localize.tf("shop.coins", "Coins: %d" % GameState.coins, {"amount": GameState.coins})

func _maybe_start_ftue() -> void:
    if GameState.session_count_total <= 2 and GameState.get_level_stars(1) == 0:
        _ftue_step = 1
        # Use a real hint pair if possible
        var hint := _find_any_hint()
        if hint.size() == 2:
            _ftue_pair = hint
            _highlight(hint[0], true)
            _highlight(hint[1], true)
        _show_ftue_overlay("Swap highlighted tiles to match 3!")

func _ftue_block_input_except(pos: Vector2i) -> bool:
    if _ftue_step == 0:
        return false
    # On step 1, allow only a specific pair
    if _ftue_step == 1:
        if _ftue_pair.size() == 2:
            var a := _ftue_pair[0]
            var b := _ftue_pair[1]
            if first_selected == Vector2i(-1,-1):
                return pos != a
            else:
                return not (pos == b and board.is_adjacent(first_selected, pos))
    return false

func _advance_ftue_if_needed(pos: Vector2i) -> void:
    if _ftue_step == 1 and first_selected == Vector2i(-1,-1):
        # After successful swap, advance tutorial
        _ftue_step = 2
        _show_ftue_overlay("Great! Use boosters to help when stuck.")
        await get_tree().create_timer(1.2).timeout
        _hide_ftue_overlay()
        if _ftue_pair.size() == 2:
            _highlight(_ftue_pair[0], false)
            _highlight(_ftue_pair[1], false)
            _ftue_pair.clear()
        _ftue_step = 0

func _show_ftue_overlay(text: String) -> void:
    if _ftue_overlay:
        _ftue_overlay.queue_free()
    var panel := Panel.new()
    panel.modulate = Color(0,0,0,0.2)
    panel.anchor_left = 0.0
    panel.anchor_top = 0.0
    panel.anchor_right = 1.0
    panel.anchor_bottom = 1.0
    var label := Label.new()
    label.text = text
    label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
    label.anchor_left = 0.0
    label.anchor_top = 0.0
    label.anchor_right = 1.0
    label.anchor_bottom = 1.0
    panel.add_child(label)
    add_child(panel)
    _ftue_overlay = panel

func _hide_ftue_overlay() -> void:
    if _ftue_overlay:
        _ftue_overlay.queue_free()
        _ftue_overlay = null

func _apply_dynamic_difficulty_softeners() -> void:
    _soften_steps_applied = 0
    var fails := GameState.get_fail_streak(LevelManager.current_level_id)
    var threshold := RemoteConfig.get_int("dda_fails_soften_threshold", 2)
    if fails < threshold:
        return
    var max_steps := RemoteConfig.get_int("dda_max_soften_steps", 3)
    var steps := clamp(fails - threshold + 1, 1, max_steps)
    # Apply moves bonus
    var bonus_per := RemoteConfig.get_int("dda_moves_bonus_per_step", 3)
    moves_left += steps * bonus_per
    # Optionally reduce colors
    var reduce_colors := RemoteConfig.get_int("dda_reduce_colors_per_step", 0)
    if reduce_colors > 0:
        var new_colors := max(3, LevelManager.num_colors - steps * reduce_colors)
        board.num_colors = new_colors
    # Pity prelevel booster chance
    var pct := clamp(RemoteConfig.get_int("pity_prelevel_booster_chance_pct", 30), 0, 100)
    if (randi() % 100) < pct:
        GameState.booster_add("pre_color_bomb", 1)
    _soften_steps_applied = steps

func _find_any_hint() -> Array[Vector2i]:
    # Try all adjacent swaps and return first that yields a match
    for y in range(board.size.y):
        for x in range(board.size.x):
            var a := Vector2i(x, y)
            var neighbors := [Vector2i(x + 1, y), Vector2i(x, y + 1)]
            for b in neighbors:
                if b.x >= board.size.x or b.y >= board.size.y:
                    continue
                if board._creates_match_after_swap(a, b):
                    return [a, b]
    return []

func _show_hint() -> void:
    if first_selected != Vector2i(-1, -1):
        return
    var hint := _find_any_hint()
    if hint.size() == 2:
        _last_hint_positions = hint
        _highlight(hint[0], true)
        _highlight(hint[1], true)

func _clear_hint() -> void:
    if _last_hint_positions.size() == 2:
        _highlight(_last_hint_positions[0], false)
        _highlight(_last_hint_positions[1], false)
        _last_hint_positions.clear()
