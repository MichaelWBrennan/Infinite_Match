extends Control
class_name LeaguesUI

@onready var info: Label = $Panel/VBox/Info
@onready var claim_btn: Button = $Panel/VBox/Claim

func _ready() -> void:
    if Engine.has_singleton("Leagues"):
        Leagues.updated.connect(_refresh)
        _refresh()
    claim_btn.pressed.connect(func(): _on_claim())

func _refresh() -> void:
    var div := "Bronze"
    var pts := 0
    var rk := 0
    if Engine.has_singleton("Leagues"):
        div = Leagues.division
        pts = Leagues.points
        rk = Leagues.rank
    info.text = "Division: %s  Rank: %d  Points: %d" % [div, rk, pts]

func _on_claim() -> void:
    if Engine.has_singleton("Leagues"):
        var r := Leagues.claim_weekly_rewards()
        info.text = info.text + "\nClaimed: "+str(r)
