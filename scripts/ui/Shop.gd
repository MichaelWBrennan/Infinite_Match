extends Control

@onready var coins_label: Label = $VBox/Coins
@onready var remove_ads_btn: Button = $VBox/RemoveAds
@onready var cosmetic_btn: Button = $VBox/Cosmetic
@onready var starter_btn: Button = $VBox/Starter
@onready var coins_small_btn: Button = $VBox/CoinsSmall
@onready var coins_medium_btn: Button = $VBox/CoinsMedium
@onready var coins_large_btn: Button = $VBox/CoinsLarge
@onready var coins_huge_btn: Button = $VBox/CoinsHuge
@onready var energy_refill_btn: Button = $VBox/EnergyRefill
@onready var booster_bundle_btn: Button = $VBox/BoosterBundle
@onready var gems_small_btn: Button = $VBox/GemsSmall
@onready var gems_medium_btn: Button = $VBox/GemsMedium
@onready var gems_large_btn: Button = $VBox/GemsLarge
@onready var gems_huge_btn: Button = $VBox/GemsHuge
@onready var get_more_btn: Button = $VBox/GetMore
@onready var back_btn: Button = $VBox/Back
@onready var limited_banner: Button = $VBox/LimitedBanner
@onready var badge_gems_medium: Label = $VBox/BadgeGemsMedium
@onready var badge_gems_huge: Label = $VBox/BadgeGemsHuge
var _catalog_loaded := false

func _ready() -> void:
    Analytics.track_shop("view")
    _update_coins()
    GameState.currency_changed.connect(func(_b): _update_coins())
    remove_ads_btn.pressed.connect(func(): _buy("remove_ads"))
    cosmetic_btn.pressed.connect(func(): _buy("cosmetic_pack_basic"))
    starter_btn.pressed.connect(func(): _buy("starter_pack_small"))
    coins_small_btn.pressed.connect(func(): _buy("coins_small"))
    coins_medium_btn.pressed.connect(func(): _buy("coins_medium"))
    coins_large_btn.pressed.connect(func(): _buy("coins_large"))
    coins_huge_btn.pressed.connect(func(): _buy("coins_huge"))
    energy_refill_btn.pressed.connect(func(): _buy("energy_refill"))
    booster_bundle_btn.pressed.connect(func(): _buy("booster_bundle"))
    gems_small_btn.pressed.connect(func(): _buy("gems_small"))
    gems_medium_btn.pressed.connect(func(): _buy("gems_medium"))
    gems_large_btn.pressed.connect(func(): _buy("gems_large"))
    gems_huge_btn.pressed.connect(func(): _buy("gems_huge"))
    get_more_btn.pressed.connect(_on_get_more)
    back_btn.pressed.connect(func(): get_tree().change_scene_to_file("res://scenes/MainMenu.tscn"))
    limited_banner.pressed.connect(_on_limited)
    _apply_price_strings()
    _apply_badges()

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
    var cs := IAPManager.get_price_string("coins_small")
    if cs != "":
        coins_small_btn.text = "+%d Coins (%s)" % [RemoteConfig.get_int("coins_small_amount", 500), cs]
    var cm := IAPManager.get_price_string("coins_medium")
    if cm != "":
        coins_medium_btn.text = "+%d Coins (%s)" % [RemoteConfig.get_int("coins_medium_amount", 3000), cm]
    var cl := IAPManager.get_price_string("coins_large")
    if cl != "":
        coins_large_btn.text = "+%d Coins (%s)" % [RemoteConfig.get_int("coins_large_amount", 7500), cl]
    var ch := IAPManager.get_price_string("coins_huge")
    if ch != "":
        coins_huge_btn.text = "+%d Coins (%s)" % [RemoteConfig.get_int("coins_huge_amount", 20000), ch]
    var er := IAPManager.get_price_string("energy_refill")
    if er != "":
        energy_refill_btn.text = "Refill Energy (%s)" % er
    var bb := IAPManager.get_price_string("booster_bundle")
    if bb != "":
        booster_bundle_btn.text = "Booster Bundle (%s)" % bb
    var gs := IAPManager.get_price_string("gems_small")
    if gs != "":
        gems_small_btn.text = "+%d Gems (%s)" % [RemoteConfig.get_int("gems_small_amount", 20), gs]
    var gm := IAPManager.get_price_string("gems_medium")
    if gm != "":
        gems_medium_btn.text = "+%d Gems (%s)" % [RemoteConfig.get_int("gems_medium_amount", 120), gm]
    var gl := IAPManager.get_price_string("gems_large")
    if gl != "":
        gems_large_btn.text = "+%d Gems (%s)" % [RemoteConfig.get_int("gems_large_amount", 300), gl]
    var gh := IAPManager.get_price_string("gems_huge")
    if gh != "":
        gems_huge_btn.text = "+%d Gems (%s)" % [RemoteConfig.get_int("gems_huge_amount", 700), gh]
    # Cosmetic pack price range stays textual unless querying individual SKUs

func _apply_badges() -> void:
    var best := RemoteConfig.get_string("best_value_sku", "gems_huge")
    var popular := RemoteConfig.get_string("most_popular_sku", "gems_medium")
    if badge_gems_huge:
        badge_gems_huge.visible = (best == "gems_huge") or (popular == "gems_huge")
        badge_gems_huge.text = (best == "gems_huge") ? "Best Value" : (popular == "gems_huge") ? "Most Popular" : ""
    if badge_gems_medium:
        badge_gems_medium.visible = (best == "gems_medium") or (popular == "gems_medium")
        badge_gems_medium.text = (best == "gems_medium") ? "Best Value" : (popular == "gems_medium") ? "Most Popular" : ""

func _buy(sku: String) -> void:
    Analytics.track_shop("click", sku)
    IAPManager.purchase_item(sku)

func _on_get_more() -> void:
    # Offer rewarded ad first, fallback to offerwall
    AdManager.show_rewarded_ad("shop_get_more", func(amount: int):
        GameState.add_coins(amount)
    )

func _on_limited() -> void:
    # Open flash offer via Offers
    Offers.accept_offer(Offers.OfferKind.FLASH)
