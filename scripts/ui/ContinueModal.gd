extends Control

class_name ContinueModal

@onready var title_label: Label = $Panel/VBox/Title
@onready var rv_btn: Button = $Panel/VBox/RV
@onready var gem_btn: Button = $Panel/VBox/Gems
@onready var bundle_btn: Button = $Panel/VBox/Bundle
@onready var quit_btn: Button = $Panel/VBox/Quit

func _ready() -> void:
    title_label.text = Localize.t("modal.continue.title", "Out of Moves")
    var gem_cost := RemoteConfig.get_int("continue_gem_cost", 10)
    gem_btn.text = Localize.tf("modal.continue.gems", "Spend %d Gems" % gem_cost, {"amount": gem_cost})
    var price := IAPManager.get_price_string("rescue_bundle")
    if price == "": price = "$%.2f" % 0.99
    bundle_btn.text = Localize.t("modal.continue.bundle", "Rescue Bundle (%s)" % price)
    rv_btn.text = Localize.t("modal.continue.rv", "Watch Ad")
    rv_btn.pressed.connect(_on_rv)
    gem_btn.pressed.connect(func(): _on_gems(gem_cost))
    bundle_btn.pressed.connect(_on_bundle)
    quit_btn.pressed.connect(func(): queue_free())

func _on_rv() -> void:
    AdManager.show_rewarded_ad("continue", func(_amount: int):
        _grant_continue()
        queue_free()
    )

func _on_gems(cost: int) -> void:
    if GameState.spend_gems(cost):
        _grant_continue()
        queue_free()

func _on_bundle() -> void:
    IAPManager.purchase_item("rescue_bundle")

func _grant_rescue_bundle() -> void:
    # Called by IAPManager grant path
    var moves := RemoteConfig.get_int("rescue_bundle_moves", 5)
    var give_booster := RemoteConfig.get_int("rescue_bundle_booster", 1) == 1
    var gp := get_tree().current_scene
    if gp and gp.has_method("_update_ui"):
        gp.moves_left += moves
        if give_booster:
            GameState.booster_add("rocket", 1)
        gp._update_ui()
    queue_free()

func _grant_continue() -> void:
    var gp := get_tree().current_scene
    if gp.has_method("_update_ui"):
        gp.moves_left = 5
        gp._update_ui()
