extends Control

class_name PiggyHUD

@onready var bar: TextureProgressBar = $HBox/Bar
@onready var label: Label = $HBox/Label
@onready var button: Button = $HBox/Open

func _ready() -> void:
    _refresh()
    if Engine.has_singleton("PiggyBank"):
        PiggyBank.piggy_changed.connect(func(cur, max): _refresh())
    button.pressed.connect(_on_open)

func _refresh() -> void:
    if Engine.has_singleton("PiggyBank"):
        bar.max_value = max(1, PiggyBank.amount_max)
        bar.value = PiggyBank.amount_current
        label.text = "%d/%d" % [PiggyBank.amount_current, PiggyBank.amount_max]
    else:
        bar.max_value = 1
        bar.value = 0
        label.text = "0/0"

func _on_open() -> void:
    var modal := load("res://scenes/OfferModal.tscn").instantiate()
    modal.kind = 999
    modal.sku = "piggy_bank_open"
    get_tree().current_scene.add_child(modal)
