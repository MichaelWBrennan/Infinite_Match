extends Node
class_name MetaManager

signal updated()

var _save_path := "user://meta.json"
var rooms: Array = [] # [{id,name,tasks:[{id,desc,cost,done}]}]

func _ready() -> void:
    _load()
    if rooms.is_empty():
        rooms = [
            {"id":"room_1","name":"Hall","tasks":[
                {"id":"paint","desc":"Paint walls","cost":300,"done":false},
                {"id":"sofa","desc":"Buy sofa","cost":500,"done":false},
                {"id":"table","desc":"Place coffee table","cost":400,"done":false}
            ]}
        ]
        _save()

func list_rooms() -> Array:
    return rooms

func complete_task(room_id: String, task_id: String) -> bool:
    for r in rooms:
        if r.get("id",
        "") == room_id:
            for t in r.get("tasks", []):
                if t.get("id",
                "") == task_id and not bool(t.get("done", false)):
                    var cost := int(t.get("cost", 0))
                    if GameState.spend_coins(cost):
                        t["done"] = true
                        _save()
                        updated.emit()
                        return true
    return false

func _load() -> void:
    var f := FileAccess.open(_save_path, FileAccess.READ)
    if f:
        var d = JSON.parse_string(f.get_as_text())
        f.close()
        if typeof(d) == TYPE_DICTIONARY:
            rooms = d.get("rooms", [])

func _save() -> void:
    var d := {"rooms": rooms}
    var f := FileAccess.open(_save_path, FileAccess.WRITE)
    if f:
        f.store_string(JSON.stringify(d))
        f.close()
