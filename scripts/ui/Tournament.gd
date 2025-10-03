extends Control
class_name TournamentModal

@onready var score_label: Label = $Panel/VBox/Score
@onready var rewards_label: Label = $Panel/VBox/Rewards
@onready var close_btn: Button = $Panel/VBox/Close

func _ready() -> void:
    score_label.text = "Your Score: %d" % GameState.tournament_score
    var r := Tournament.get_rewards()
    rewards_label.text = "Rewards: 1st %d, 2nd %d, 3rd %d" % [int(r.get("1",0)), int(r.get("2",0)), int(r.get("3",0))]
    close_btn.pressed.connect(func(): queue_free())
