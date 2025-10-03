extends Control
class_name TeamLivesUI

@onready var list: VBoxContainer = $Panel/VBox/List
@onready var request_btn: Button = $Panel/VBox/Request
@onready var close_btn: Button = $Panel/VBox/Close

func _ready() -> void:
    Teams.life_requested.connect(func(pid): _populate())
    Teams.life_granted.connect(func(pid): _populate())
    request_btn.pressed.connect(func():
        Teams.request_life("me")
        _populate()
    )
    close_btn.pressed.connect(func(): queue_free())
    _populate()

func _populate() -> void:
    for c in list.get_children():
        c.queue_free()
    for pid in Teams.lives_requests:
        var row := HBoxContainer.new()
        var lab := Label.new()
        lab.text = "Request from: %s" % String(pid)
        row.add_child(lab)
        var btn := Button.new()
        btn.text = "Grant"
        var id := String(pid)
        btn.pressed.connect(func():
            Teams.grant_life(id)
            _populate()
        )
        row.add_child(btn)
        list.add_child(row)
