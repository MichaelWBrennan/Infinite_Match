extends Control

class_name SeasonPassModal

@onready var title_label: Label = $Panel/VBox/Title
@onready var level_label: Label = $Panel/VBox/Level
@onready var ends_label: Label = $Panel/VBox/EndsIn
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
    _start_end_timer()

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
    for c in track_root.get_children():
        c.queue_free()
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

func _start_end_timer() -> void:
    var end_ts := RemoteConfig.get_int("season_end_epoch", 0)
    if end_ts <= 0:
        ends_label.text = ""
        return
    _update_end_timer(end_ts)
    var t := Timer.new()
    t.wait_time = 1.0
    t.autostart = true
    t.one_shot = false
    add_child(t)
    t.timeout.connect(func(): _update_end_timer(end_ts))

func _update_end_timer(end_ts: int) -> void:
    var now := int(Time.get_unix_time_from_system())
    var remain := max(0, end_ts - now)
    var d := remain / 86400
    var h := (remain % 86400) / 3600
    var m := (remain % 3600) / 60
    var s := remain % 60
    ends_label.text = "Ends in %dd %02d:%02d:%02d" % [d, h, m, s]

func _on_buy() -> void:
    IAPManager.purchase_item("season_pass_premium")
    queue_free()
