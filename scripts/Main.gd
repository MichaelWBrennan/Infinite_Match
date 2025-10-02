extends Node2D

@onready var coins_label: Label = $UI/VBox/CoinsLabel
@onready var tap_button: Button = $UI/VBox/TapButton
@onready var rewarded_button: Button = $UI/VBox/RewardedButton
@onready var interstitial_button: Button = $UI/VBox/InterstitialButton
@onready var shop_button: Button = $UI/VBox/ShopButton

var coins: int = 0
var _taps_since_interstitial: int = 0

func _ready() -> void:
    tap_button.pressed.connect(_on_tap)
    rewarded_button.pressed.connect(_on_rewarded)
    interstitial_button.pressed.connect(_on_interstitial)
    shop_button.pressed.connect(_on_shop)
    Analytics.track_session_start()
    RemoteConfig.fetch_and_apply()
    AdManager.preload_all()

func _on_tap() -> void:
    coins += 1
    _taps_since_interstitial += 1
    _update_ui()
    Analytics.track_progression("tap", str(coins))
    var interval := RemoteConfig.get_int("interstitial_interval", 30)
    if _taps_since_interstitial >= interval:
        _taps_since_interstitial = 0
        AdManager.show_interstitial("auto_interval")

func _on_rewarded() -> void:
    AdManager.show_rewarded("boost", func(reward_amount: int):
        coins += reward_amount
        _update_ui()
    )

func _on_interstitial() -> void:
    AdManager.show_interstitial("checkpoint")

func _on_shop() -> void:
    IAPManager.show_shop(function(purchased: bool, sku: String):
        if purchased:
            Analytics.track_purchase("store", "USD", IAPManager.get_price_usd(sku), sku, "cosmetic")
    )

func _update_ui() -> void:
    coins_label.text = "Coins: %d" % coins
