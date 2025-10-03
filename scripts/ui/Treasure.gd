extends Control
class_name TreasureUI

@onready var progress_label: Label = $Panel/VBox/Progress
@onready var claim_btn: Button = $Panel/VBox/Claim
@onready var close_btn: Button = $Panel/VBox/Close

func _ready() -> void:
    _refresh()
    claim_btn.pressed.connect(func():
        var r := Treasure.claim()
        _refresh()
    )
    close_btn.pressed.connect(func(): queue_free())

func _refresh() -> void:
    progress_label.text = "%d/%d" % [Treasure.steps_done, Treasure.steps_total]
    claim_btn.disabled = not Treasure.can_claim()
