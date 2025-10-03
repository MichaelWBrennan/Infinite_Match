extends Control
class_name PromoCodesUI

@onready var code_edit: LineEdit = $Panel/VBox/HBox/Code
@onready var redeem_btn: Button = $Panel/VBox/HBox/Redeem
@onready var close_btn: Button = $Panel/VBox/Close

func _ready() -> void:
    redeem_btn.pressed.connect(_on_redeem)
    close_btn.pressed.connect(func(): queue_free())

func _on_redeem() -> void:
    var code := code_edit.text.strip_edges()
    if code == "":
        return
    if Engine.has_singleton("Backend") and Backend.base_url() != "":
        var ok := await Backend._post_json(Backend.base_url() + "/promo", {"code": code})
        if bool(ok.get("ok", false)):
            GameState.add_coins(100)
    else:
        # Local fallback
        if code.to_upper() == "WELCOME":
            GameState.add_gems(20)
    queue_free()
