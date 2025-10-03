extends Control
class_name DecorUI

@onready var list: VBoxContainer = $Panel/VBox/List
@onready var close_btn: Button = $Panel/VBox/Close

var items := [
    {"id":"decor_plant","name":"Potted Plant","cost":200},
    {"id":"decor_rug","name":"Cozy Rug","cost":300},
    {"id":"decor_lamp","name":"Floor Lamp","cost":400}
]

func _ready() -> void:
    _render_items()
    close_btn.pressed.connect(func(): queue_free())

func _render_items() -> void:
    list.queue_free_children()
    for it in items:
        var hb := HBoxContainer.new()
        var label := Label.new()
        label.text = "%s - %d" % [String(it.name), int(it.cost)]
        hb.add_child(label)
        var btn := Button.new()
        btn.text = _owned_text(it.id) if _owned(it.id) else "Buy"
        btn.disabled = _owned(it.id)
        btn.pressed.connect(func(): _buy(it))
        hb.add_child(btn)
        list.add_child(hb)

func _owned(id: String) -> bool:
    return GameState.owned_cosmetics.has(id)

func _owned_text(id: String) -> String:
    return "Owned"

func _buy(it: Dictionary) -> void:
    var cost := int(it.cost)
    if GameState.spend_coins(cost):
        GameState.own_cosmetic(String(it.id))
        _render_items()
