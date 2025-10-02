extends Control

class_name SeasonPassModal

@onready var title_label: Label = $Panel/VBox/Title
@onready var level_label: Label = $Panel/VBox/Level
@onready var buy_btn: Button = $Panel/VBox/Buy
@onready var close_btn: Button = $Panel/VBox/Close

func _ready() -> void:
    _refresh()
    SeasonPass.xp_changed.connect(func(_xp, _lvl): _refresh())
    SeasonPass.premium_unlocked.connect(func(): _refresh())
    buy_btn.pressed.connect(_on_buy)
    close_btn.pressed.connect(func(): queue_free())

func _refresh() -> void:
    title_label.text = SeasonPass.is_premium() ? "Season Pass (Premium)" : "Season Pass"
    level_label.text = "Level %d  XP %d" % [SeasonPass.level, SeasonPass.xp]
    buy_btn.disabled = SeasonPass.is_premium()
    if not SeasonPass.is_premium():
        var price := IAPManager.get_price_string("season_pass_premium")
        if price == "":
            price = "$4.99"
        buy_btn.text = "Buy Premium (%s)" % price

func _on_buy() -> void:
    IAPManager.purchase_item("season_pass_premium")
    queue_free()
