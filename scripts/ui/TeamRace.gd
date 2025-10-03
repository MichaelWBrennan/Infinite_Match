extends Control
class_name TeamRaceUI

@onready var progress_label: Label = $Panel/VBox/Progress
@onready var close_btn: Button = $Panel/VBox/Close

func _ready() -> void:
    progress_label.text = "This Week: %d" % GameState.weekly_points
    close_btn.pressed.connect(func(): queue_free())
