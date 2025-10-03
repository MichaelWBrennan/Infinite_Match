extends Control
class_name WorldMap

@onready var stars_label: Label = $Panel/VBox/Stars
@onready var claim_btn: Button = $Panel/VBox/ClaimChest
@onready var close_btn: Button = $Panel/VBox/Close
@onready var claim_btn: Button = $Panel/VBox/ClaimChest
var gate_label: Label

func _ready() -> void:
    _refresh()
    if GameState.can_claim_star_chest():
        claim_btn.disabled = false
    else:
        claim_btn.disabled = true
    claim_btn.pressed.connect(_on_claim)
    close_btn.pressed.connect(func(): queue_free())
    # Gate info
    gate_label = Label.new()
    $Panel/VBox.add_child(gate_label)
    _update_gate()

func _refresh() -> void:
    stars_label.text = "Stars: %d" % GameState.total_stars()
    claim_btn.disabled = not GameState.can_claim_star_chest()

func _on_claim() -> void:
    var r := GameState.claim_star_chest()
    if not r.is_empty():
        _refresh()

func _update_gate() -> void:
    var blocked := LevelManager.is_next_gate_blocked()
    if blocked:
        var need := RemoteConfig.get_int("gate_stars_per_gate", 75)
        gate_label.text = "Gate ahead: Need %d stars" % need
    else:
        gate_label.text = "No gate ahead"
