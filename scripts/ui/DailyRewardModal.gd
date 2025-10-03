extends Control

class_name DailyRewardModal

@onready var title_label: Label = $Panel/VBox/Title
@onready var reward_label: Label = $Panel/VBox/Reward
@onready var claim_btn: Button = $Panel/VBox/Claim
@onready var close_btn: Button = $Panel/VBox/Close

func _ready() -> void:
    var amount := GameState.grant_daily_reward()
    title_label.text = Localize.t("modal.daily.title", "Daily Reward")
    reward_label.text = Localize.tf("shop.coins", "+%d Coins" % amount, {"amount": amount})
    claim_btn.pressed.connect(func(): queue_free())
    close_btn.pressed.connect(func(): queue_free())
