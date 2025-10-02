extends Control

class_name SeasonPassModal

@onready var title_label: Label = $Panel/VBox/Title
@onready var level_label: Label = $Panel/VBox/Level
@onready var buy_btn: Button = $Panel/VBox/Buy
@onready var close_btn: Button = $Panel/VBox/Close
@onready var track_root: VBoxContainer = $Panel/VBox/Track

func _ready() -> void:
    _refresh()
    SeasonPass.xp_changed.connect(func(_xp, _lvl): _refresh())
    SeasonPass.premium_unlocked.connect(func(): _refresh())
    buy_btn.pressed.connect(_on_buy)
    close_btn.pressed.connect(func(): queue_free())
    _build_track()

func _refresh() -> void:
    title_label.text = SeasonPass.is_premium() ? "Season Pass (Premium)" : "Season Pass"
    level_label.text = "Level %d  XP %d" % [SeasonPass.level, SeasonPass.xp]
    buy_btn.disabled = SeasonPass.is_premium()
    if not SeasonPass.is_premium():
        var price := IAPManager.get_price_string("season_pass_premium")
        if price == "":
            price = "$4.99"
        buy_btn.text = "Buy Premium (%s)" % price

func _build_track() -> void:
    track_root.queue_free_children()
    var levels := RemoteConfig.get_int("season_levels", 30)
    for i in range(1, levels + 1):
        var row := HBoxContainer.new()
        var lab := Label.new()
        lab.text = "Lv %d" % i
        row.add_child(lab)
        var free_btn := Button.new()
        free_btn.text = "Free"
        free_btn.disabled = not SeasonPass.can_claim_free(i)
        var idx := i
        free_btn.pressed.connect(func():
            if SeasonPass.claim_free(idx) > 0:
                _build_track()
        )
        row.add_child(free_btn)
        var prem_btn := Button.new()
        prem_btn.text = "Premium"
        prem_btn.disabled = not SeasonPass.can_claim_premium(i)
        prem_btn.pressed.connect(func():
            if SeasonPass.claim_premium(idx) > 0:
                _build_track()
        )
        row.add_child(prem_btn)
        track_root.add_child(row)

func _on_buy() -> void:
    IAPManager.purchase_item("season_pass_premium")
    queue_free()
