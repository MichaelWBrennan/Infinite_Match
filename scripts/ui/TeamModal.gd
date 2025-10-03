extends Control
class_name TeamModal

@onready var progress_label: Label = $Panel/VBox/Progress
@onready var claim_btn: Button = $Panel/VBox/Claim
@onready var close_btn: Button = $Panel/VBox/Close

func _ready() -> void:
    Teams.team_chest_progress.connect(func(p, t):
        progress_label.text = "Progress: %d/%d" % [p, t]
    )
    progress_label.text = "Progress: %d/%d" % [Teams.team_points, RemoteConfig.get_int("team_chest_threshold", 1000)]
    claim_btn.pressed.connect(func():
        if Teams.claim_team_chest():
            progress_label.text = "Progress: %d/%d" % [Teams.team_points, RemoteConfig.get_int("team_chest_threshold", 1000)]
    )
    close_btn.pressed.connect(func(): queue_free())
