extends Control

@onready var start_button: Button = $VBox/StartButton
@onready var daily_button: Button = $VBox/DailyButton
@onready var quests_button: Button = $VBox/QuestsButton
@onready var missions_button: Button = $VBox/MissionsButton
@onready var offerwall_button: Button = $VBox/OfferwallButton
@onready var shop_button: Button = $VBox/ShopButton
@onready var coins_label: Label = $VBox/CoinsLabel
@onready var level_label: Label = $VBox/LevelLabel
@onready var streak_label: Label = $VBox/StreakLabel
@onready var leaderboard_button: Button = $VBox/LeaderboardButton
@onready var refer_button: Button = $VBox/ReferButton
@onready var piggy_button: Button = $VBox/PiggyButton
@onready var season_button: Button = $VBox/SeasonPassButton
@onready var events_button: Button = $VBox/EventsButton
@onready var settings_button: Button = $VBox/SettingsButton
@onready var inbox_button: Button = $VBox/InboxButton
@onready var map_button: Button = $VBox/MapButton
@onready var team_button: Button = $VBox/TeamButton
@onready var tournament_button: Button = $VBox/TournamentButton
@onready var editor_button: Button = $VBox/EditorButton
@onready var weekly_button: Button = $VBox/WeeklyChestButton
@onready var treasure_button: Button = $VBox/TreasureButton
@onready var banner_spacer: Control = $BannerSpacer

func _ready() -> void:
    start_button.pressed.connect(_on_start)
    daily_button.pressed.connect(_on_daily)
    quests_button.pressed.connect(_on_quests)
    missions_button.pressed.connect(_on_missions)
    offerwall_button.pressed.connect(_on_offerwall)
    shop_button.pressed.connect(_on_shop)
    GameState.currency_changed.connect(func(new_balance): _update_coins())
    _update_coins()
    _update_level()
    _update_streak()
    _apply_banner_padding()
    AdManager.show_banner("bottom")
    if ConsentManager.needs_consent():
        if CMP.should_show_cmp():
            var cpm := load("res://scenes/CMPModal.tscn").instantiate()
            add_child(cpm)
        else:
            var cm := load("res://scenes/ConsentModal.tscn").instantiate()
            add_child(cm)
    leaderboard_button.pressed.connect(_on_leaderboard)
    refer_button.pressed.connect(_on_refer)
    piggy_button.pressed.connect(_on_piggy)
    season_button.pressed.connect(_on_season)
    events_button.pressed.connect(_on_events)
    settings_button.pressed.connect(_on_settings)
    inbox_button.pressed.connect(_on_inbox)
    if map_button:
        map_button.pressed.connect(_on_map)
    if team_button:
        team_button.pressed.connect(_on_team)
    if tournament_button:
        tournament_button.pressed.connect(_on_tournament)
    if editor_button:
        editor_button.visible = RemoteConfig.get_int("dev_enable_editor", 0) == 1
        editor_button.pressed.connect(_on_editor)
    if weekly_button:
        weekly_button.pressed.connect(_on_weekly)
    if treasure_button:
        treasure_button.pressed.connect(_on_treasure)
    # Surface an offer if available at menu open
    if Engine.has_singleton("Offers"):
        Offers.offer_available.connect(func(kind, sku):
            Analytics.track_offer("available", str(kind), sku)
            _show_offer_modal(kind, sku)
        , CONNECT_ONE_SHOT)
        # Trigger offer check on next idle frame
        call_deferred("_check_offers")

func _apply_banner_padding() -> void:
    var h := AdManager.get_banner_height_px()
    banner_spacer.custom_minimum_size.y = h

func _update_coins() -> void:
    coins_label.text = Localize.tf("shop.coins", "Coins: %d" % GameState.coins, {"amount": GameState.coins})

func _update_level() -> void:
    level_label.text = "Level: %d (Stars: %d)" % [GameState.get_current_level(), GameState.get_level_stars(GameState.get_current_level())]

func _update_streak() -> void:
    if streak_label:
        streak_label.text = "Streak: %d (Best: %d) Weekly: %d/%d" % [GameState.win_streak, GameState.best_win_streak, GameState.weekly_points, GameState.weekly_points_needed()]

func _on_start() -> void:
    # Optional pre-level RV booster offer
    if RemoteConfig.get_int("rv_prelevel_booster_enabled", 1) == 1:
        AdManager.show_rewarded_ad("prelevel_booster", func(amount: int):
            # grant a random pre-level booster into inventory
            var choices := ["pre_bomb", "pre_rocket", "pre_color_bomb"]
            var i := randi() % choices.size()
            GameState.booster_add(choices[i], 1)
            get_tree().change_scene_to_file("res://scenes/Gameplay.tscn")
        )
    else:
        get_tree().change_scene_to_file("res://scenes/Gameplay.tscn")
    # Schedule a gentle return notification
    Notifications.schedule_lapsed_return(3)

func _on_daily() -> void:
    var modal := load("res://scenes/DailyRewardModal.tscn").instantiate()
    add_child(modal)

func _on_offerwall() -> void:
    AdManager.open_offerwall()

func _on_shop() -> void:
    get_tree().change_scene_to_file("res://scenes/Shop.tscn")

func _on_leaderboard() -> void:
    Social.open_leaderboard()

func _on_refer() -> void:
    var code := Social.get_referral_code()
    Social.share("Play Evergreen Puzzler with me! Code: " + code)
func _on_quests() -> void:
    var modal := load("res://scenes/QuestsModal.tscn").instantiate()
    add_child(modal)

func _on_missions() -> void:
    var modal := load("res://scenes/Missions.tscn").instantiate()
    add_child(modal)


func _on_piggy() -> void:
    var amount := PiggyBank.amount_current
    var max := PiggyBank.amount_max
    var price := PiggyBank.get_unlock_price_string()
    var modal := load("res://scenes/OfferModal.tscn").instantiate()
    modal.kind = 999 # piggy pseudo-kind
    modal.sku = "piggy_bank_open"
    add_child(modal)
    Analytics.track_offer("view", "piggy")

func _check_offers() -> void:
    if Engine.has_singleton("Offers"):
        # Offers autoload will emit if eligible during _ready
        pass

func _show_offer_modal(kind, sku: String) -> void:
    var modal := load("res://scenes/OfferModal.tscn").instantiate()
    modal.kind = int(kind)
    modal.sku = sku
    add_child(modal)

func _on_season() -> void:
    var modal := load("res://scenes/SeasonPassModal.tscn").instantiate()
    add_child(modal)

func _on_events() -> void:
    var modal := load("res://scenes/EventsCalendar.tscn").instantiate()
    add_child(modal)

func _on_settings() -> void:
    var modal := load("res://scenes/SettingsModal.tscn").instantiate()
    add_child(modal)

func _on_inbox() -> void:
    var modal := load("res://scenes/Inbox.tscn").instantiate()
    add_child(modal)

func _on_map() -> void:
    var modal := load("res://scenes/WorldMap.tscn").instantiate()
    add_child(modal)

func _on_team() -> void:
    var modal := load("res://scenes/TeamModal.tscn").instantiate()
    add_child(modal)

func _on_tournament() -> void:
    var modal := load("res://scenes/Tournament.tscn").instantiate()
    add_child(modal)

func _on_editor() -> void:
    var modal := load("res://scenes/LevelEditor.tscn").instantiate()
    add_child(modal)

func _on_weekly() -> void:
    var modal := load("res://scenes/WeeklyChest.tscn").instantiate()
    add_child(modal)

func _on_treasure() -> void:
    var modal := load("res://scenes/Treasure.tscn").instantiate()
    add_child(modal)
