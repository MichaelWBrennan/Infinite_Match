extends Control

@onready var coins_label: Label = $VBox/Coins
@onready var remove_ads_btn: Button = $VBox/RemoveAds
@onready var cosmetic_btn: Button = $VBox/Cosmetic
@onready var starter_btn: Button = $VBox/Starter
@onready var get_more_btn: Button = $VBox/GetMore
@onready var back_btn: Button = $VBox/Back
var _catalog_loaded := false

func _ready() -> void:
    _update_coins()
    GameState.currency_changed.connect(func(_b): _update_coins())
    remove_ads_btn.pressed.connect(func(): IAPManager.purchase_item("remove_ads"))
    cosmetic_btn.pressed.connect(func(): IAPManager.purchase_item("cosmetic_pack_basic"))
    starter_btn.pressed.connect(func(): IAPManager.purchase_item("starter_pack_small"))
    get_more_btn.pressed.connect(_on_get_more)
    back_btn.pressed.connect(func(): get_tree().change_scene_to_file("res://scenes/MainMenu.tscn"))
    _apply_price_strings()

func _update_coins() -> void:
    coins_label.text = "Coins: %d" % GameState.coins

func _apply_price_strings() -> void:
    if _catalog_loaded:
        return
    _catalog_loaded = true
    # Update button texts with localized price strings when available
    var remove_price := IAPManager.get_price_string("remove_ads")
    if remove_price != "":
        remove_ads_btn.text = "Remove Ads (%s)" % remove_price
    var starter_price := IAPManager.get_price_string("starter_pack_small")
    if starter_price != "":
        starter_btn.text = "Starter Pack (%s)" % starter_price
    # Cosmetic pack price range stays textual unless querying individual SKUs

func _on_get_more() -> void:
    # Offer rewarded ad first, fallback to offerwall
    AdManager.show_rewarded_ad("shop_get_more", func(amount: int):
        GameState.add_coins(amount)
    )
