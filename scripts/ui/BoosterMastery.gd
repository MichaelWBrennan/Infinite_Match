extends Control
class_name BoosterMasteryUI

@onready var list: VBoxContainer = $Panel/VBox/List
@onready var close_btn: Button = $Panel/VBox/Close

var boosters := ["hammer","bomb","shuffle","rocket"]

func _ready() -> void:
    _populate()
    close_btn.pressed.connect(func(): queue_free())

func _populate() -> void:
    for c in list.get_children():
        c.queue_free()
    for b in boosters:
        var row := HBoxContainer.new()
        var lab := Label.new()
        var use_count := int(GameState.booster_usage_counts.get(b, 0))
        var lvl := int(GameState.booster_upgrade_level.get(b, 0))
        lab.text = "%s  Uses:%d  Level:%d" % [b.capitalize(), use_count, lvl]
        row.add_child(lab)
        var up := Button.new()
        up.text = "Upgrade (%d)" % RemoteConfig.get_int("booster_mastery_upgrade_cost", 1000)
        up.pressed.connect(func():
            if GameState.booster_upgrade(b):
                var bonus := RemoteConfig.get_int("booster_mastery_bonus_coins", 10)
                GameState.add_coins(bonus)
                _populate()
        )
        row.add_child(up)
        list.add_child(row)
