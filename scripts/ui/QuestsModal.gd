extends Control

class_name QuestsModal

@onready var list: VBoxContainer = $Panel/VBox/List
@onready var close_btn: Button = $Panel/VBox/Close

func _ready() -> void:
    _populate()
    Quests.quests_updated.connect(_populate)
    close_btn.pressed.connect(func(): queue_free())

func _populate() -> void:
    list.queue_free_children()
    for q in Quests.get_all():
        var h := HBoxContainer.new()
        var desc := Label.new()
        desc.text = "%s (%d/%d)" % [String(q.get("desc", "")), int(q.get("progress", 0)), int(q.get("target", 0))]
        h.add_child(desc)
        var btn := Button.new()
        var id := String(q.get("id", ""))
        btn.text = "Claim"
        btn.disabled = not Quests.can_claim(id)
        btn.pressed.connect(func():
            if Quests.claim(id):
                _populate()
        )
        h.add_child(btn)
        list.add_child(h)
