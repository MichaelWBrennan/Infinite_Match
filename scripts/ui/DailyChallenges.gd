extends Control

@onready var claim_button: Button = $VBox/ClaimButton
@onready var challenge_button: Button = $VBox/ChallengeButton
@onready var back_button: Button = $VBox/Back

func _ready() -> void:
    claim_button.pressed.connect(_on_claim)
    challenge_button.pressed.connect(_on_challenge)
    back_button.pressed.connect(func(): get_tree().change_scene_to_file("res://scenes/MainMenu.tscn"))

func _on_claim() -> void:
    var amount := GameState.grant_daily_reward()
    Analytics.track_progression("daily_claim", str(amount))

func _on_challenge() -> void:
    get_tree().change_scene_to_file("res://scenes/Gameplay.tscn")
