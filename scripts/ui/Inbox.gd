extends Control
class_name Inbox

@onready var list: VBoxContainer = $Panel/VBox/List
@onready var close_btn: Button = $Panel/VBox/Close

func _ready() -> void:
    _populate()
    close_btn.pressed.connect(func(): queue_free())

func _populate() -> void:
    for c in list.get_children():
        c.queue_free()
    # Placeholder: display remote-config driven announcements and deep links
    var entries: Array = [
        {"title": "Weekend Sale!", "action": "shop"},
        {"title": "Team Chest Starts Friday", "action": "events"}
    ]
    for e in entries:
        var row := HBoxContainer.new()
        var lab := Label.new()
        lab.text = String(e.get("title", ""))
        row.add_child(lab)
        var btn := Button.new()
        btn.text = "Open"
        var action := String(e.get("action", ""))
        btn.pressed.connect(func():
            match action:
                "shop": get_tree().change_scene_to_file("res://scenes/Shop.tscn")
                "events":
                    var modal := load("res://scenes/EventsCalendar.tscn").instantiate()
                    add_child(modal)
                _:
                    pass
            queue_free()
        )
        row.add_child(btn)
        list.add_child(row)
