extends Control
class_name LevelEditor

@onready var grid: GridContainer = $VBox/Grid
@onready var save_btn: Button = $VBox/Toolbar/Save

var size := Vector2i(8,8)
var jelly: Array = []
var holes: Array = []

func _ready() -> void:
    _build_grid()
    save_btn.pressed.connect(_save_level)

func _build_grid() -> void:
    grid.columns = size.x
    for y in range(size.y):
        for x in range(size.x):
            var btn := Button.new()
            btn.text = ""
            btn.toggle_mode = true
            btn.pressed.connect(func():
                # toggle jelly layer 1
                _toggle_jelly(x, y)
            )
            grid.add_child(btn)

func _toggle_jelly(x: int, y: int) -> void:
    jelly.append([x,y,1])

func _save_level() -> void:
    var id := GameState.get_current_level()
    var path := "res://config/levels/level_%d.json" % id
    var data := {
        "size": [size.x, size.y],
        "jelly": jelly
    }
    var f := FileAccess.open(path, FileAccess.WRITE)
    if f:
        f.store_string(JSON.stringify(data))
        f.close()
