extends Control
class_name CMPModal

@onready var deny_btn: Button = $Panel/VBox/Buttons/Deny
@onready var grant_btn: Button = $Panel/VBox/Buttons/Grant

func _ready() -> void:
    deny_btn.pressed.connect(func():
        CMP.set_consent("denied")
        queue_free()
    )
    grant_btn.pressed.connect(func():
        CMP.set_consent("granted")
        queue_free()
    )
