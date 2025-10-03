extends Control
class_name WorldMap

@onready var stars_label: Label = $Panel/VBox/Stars
@onready var claim_btn: Button = $Panel/VBox/ClaimChest
@onready var close_btn: Button = $Panel/VBox/Close

func _ready() -> void:
    _refresh()
    claim_btn.pressed.connect(_on_claim)
    close_btn.pressed.connect(func(): queue_free())

func _refresh() -> void:
    stars_label.text = "Stars: %d" % GameState.total_stars()
    claim_btn.disabled = not GameState.can_claim_star_chest()

func _on_claim() -> void:
    var r := GameState.claim_star_chest()
    if not r.is_empty():
        _refresh()
