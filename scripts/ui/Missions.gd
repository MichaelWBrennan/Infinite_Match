extends Control
class_name MissionsUI

@onready var list: VBoxContainer = $Panel/VBox/List
@onready var close_btn: Button = $Panel/VBox/Close

func _ready() -> void:
    _populate()
    close_btn.pressed.connect(func(): queue_free())

func _populate() -> void:
    for c in list.get_children():
        c.queue_free()
    for m in Missions.missions:
        var row := HBoxContainer.new()
        var lab := Label.new()
        var done := bool(m.get("done", false))
        lab.text = (done ? "[Done] " : "") + String(m.get("desc", ""))
        row.add_child(lab)
        if not done:
            var btn := Button.new()
            btn.text = "Mark"
            var id := String(m.get("id",""))
            btn.pressed.connect(func():
                Missions.mark_done(id)
                _populate()
            )
            row.add_child(btn)
        list.add_child(row)
