extends Control

class_name ContinueModal

@onready var title_label: Label = $Panel/VBox/Title
@onready var rv_btn: Button = $Panel/VBox/RV
@onready var gem_btn: Button = $Panel/VBox/Gems
@onready var quit_btn: Button = $Panel/VBox/Quit

func _ready() -> void:
    title_label.text = "Out of Moves"
    var gem_cost := RemoteConfig.get_int("continue_gem_cost", 10)
    gem_btn.text = "Spend %d Gems" % gem_cost
    rv_btn.pressed.connect(_on_rv)
    gem_btn.pressed.connect(func(): _on_gems(gem_cost))
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

func _grant_continue() -> void:
    var gp := get_tree().current_scene
    if gp.has_method("_update_ui"):
        gp.moves_left = 5
        gp._update_ui()
