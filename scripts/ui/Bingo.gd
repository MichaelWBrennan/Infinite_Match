extends Control
class_name BingoUI

@onready var grid: GridContainer = $Panel/VBox/Grid
@onready var claim_btn: Button = $Panel/VBox/Claim
@onready var close_btn: Button = $Panel/VBox/Close

func _ready() -> void:
    _populate()
    claim_btn.pressed.connect(func():
        var r := Bingo.claim_rewards()
        _populate()
    )
    close_btn.pressed.connect(func(): queue_free())

func _populate() -> void:
    for c in grid.get_children():
        c.queue_free()
    if not Bingo.active:
        var lab := Label.new()
        lab.text = "Bingo inactive"
        grid.add_child(lab)
        return
    for y in range(Bingo.size):
        for x in range(Bingo.size):
            var cell := Label.new()
            var g: Dictionary = Bingo.goals[y][x]
            cell.text = "%d/%d" % [int(g.get("progress",0)), int(g.get("target",0))]
            grid.add_child(cell)
