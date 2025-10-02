extends Control

@onready var start_button: Button = $VBox/StartButton
@onready var daily_button: Button = $VBox/DailyButton
@onready var offerwall_button: Button = $VBox/OfferwallButton
@onready var shop_button: Button = $VBox/ShopButton
@onready var coins_label: Label = $VBox/CoinsLabel
@onready var level_label: Label = $VBox/LevelLabel
@onready var leaderboard_button: Button = $VBox/LeaderboardButton
@onready var refer_button: Button = $VBox/ReferButton
@onready var banner_spacer: Control = $BannerSpacer

func _ready() -> void:
    start_button.pressed.connect(_on_start)
    daily_button.pressed.connect(_on_daily)
    offerwall_button.pressed.connect(_on_offerwall)
    shop_button.pressed.connect(_on_shop)
    GameState.currency_changed.connect(func(new_balance): _update_coins())
    _update_coins()
    _update_level()
    _apply_banner_padding()
    AdManager.show_banner("bottom")
    leaderboard_button.pressed.connect(_on_leaderboard)
    refer_button.pressed.connect(_on_refer)
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
    coins_label.text = "Coins: %d" % GameState.coins

func _update_level() -> void:
    level_label.text = "Level: %d (Stars: %d)" % [GameState.get_current_level(), GameState.get_level_stars(GameState.get_current_level())]

func _on_start() -> void:
    get_tree().change_scene_to_file("res://scenes/Gameplay.tscn")

func _on_daily() -> void:
    get_tree().change_scene_to_file("res://scenes/DailyChallenges.tscn")

func _on_offerwall() -> void:
    AdManager.open_offerwall()

func _on_shop() -> void:
    get_tree().change_scene_to_file("res://scenes/Shop.tscn")

func _on_leaderboard() -> void:
    Social.open_leaderboard()

func _on_refer() -> void:
    var code := Social.get_referral_code()
    Social.share("Play Evergreen Puzzler with me! Code: " + code)

func _check_offers() -> void:
    if Engine.has_singleton("Offers"):
        # Offers autoload will emit if eligible during _ready
        pass

func _show_offer_modal(kind, sku: String) -> void:
    # Minimal modal using OS.alert to avoid new scenes
    var info := Offers.describe_offer(int(kind))
    var title := String(info.get("title", "Special Offer"))
    var body := "Get more value now!"
    OS.alert(body, title)
    # Auto-accept starter for demo purposes; replace with real modal buttons
    Offers.accept_offer(int(kind))
