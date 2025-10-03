extends Control

class_name EventsCalendar

@onready var list: VBoxContainer = $Panel/VBox/List
@onready var close_btn: Button = $Panel/VBox/Close

func _ready() -> void:
    _populate()
    close_btn.pressed.connect(func(): queue_free())

func _populate() -> void:
    for c in list.get_children():
        c.queue_free()
    var rotation := EventScheduler._load_rotation()
    var events := []
    if typeof(rotation) == TYPE_DICTIONARY:
        events = rotation.get("events", [])
    for e in events:
        var name := String(e.get("name", ""))
        var start := String(e.get("start", ""))
        var end := String(e.get("end", ""))
        var label := Label.new()
        label.text = "%s (%s - %s)" % [name, start, end]
        list.add_child(label)
