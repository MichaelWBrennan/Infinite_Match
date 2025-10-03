extends Control
class_name WeeklyChestUI

@onready var progress_label: Label = $Panel/VBox/Progress
@onready var claim_btn: Button = $Panel/VBox/Claim
@onready var close_btn: Button = $Panel/VBox/Close

func _ready() -> void:
    _refresh()
    claim_btn.pressed.connect(func():
        var r := GameState.claim_weekly_chest()
        _refresh()
    )
    close_btn.pressed.connect(func(): queue_free())

func _refresh() -> void:
    progress_label.text = "%d/%d" % [GameState.weekly_points, GameState.weekly_points_needed()]
    claim_btn.disabled = not GameState.can_claim_weekly_chest()
