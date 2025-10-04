extends Control
class_name MetaUI

@onready var list: VBoxContainer = $Panel/VBox/List
@onready var close_btn: Button = $Panel/VBox/Close

func _ready() -> void:
    _render()
    close_btn.pressed.connect(func(): queue_free())

func _render() -> void:
    list.queue_free_children()
    var rooms := []
    if Engine.has_singleton("MetaManager"):
        rooms = MetaManager.list_rooms()
    for r in rooms:
        var title := Label.new()
        title.text = String(r.get("name", "Room"))
        list.add_child(title)
        for t in r.get("tasks", []):
            var hb := HBoxContainer.new()
            var lb := Label.new()
            lb.text = "%s - %d" % [String(t.get("desc","")), int(t.get("cost",0))]
            hb.add_child(lb)
            var btn := Button.new()
            btn.text = bool(t.get("done", false)) ? "Done" : "Complete"
            btn.disabled = bool(t.get("done", false))
            var rid := String(r.get("id",""))
            var tid := String(t.get("id",""))
            btn.pressed.connect(func(): _buy(rid, tid))
            hb.add_child(btn)
            list.add_child(hb)

func _buy(rid: String, tid: String) -> void:
    if Engine.has_singleton("MetaManager" ):
        if MetaManager.complete_task(rid, tid):
            _render()
