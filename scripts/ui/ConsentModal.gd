extends Control

class_name ConsentModal

@onready var title_label: Label = $Panel/VBox/Title
@onready var gdpr_label: Label = $Panel/VBox/GDPR
@onready var grant_btn: Button = $Panel/VBox/Grant
@onready var deny_btn: Button = $Panel/VBox/Deny
@onready var age_box: OptionButton = $Panel/VBox/Age
@onready var save_btn: Button = $Panel/VBox/Save

func _ready() -> void:
    title_label.text = "Privacy & Consent"
    gdpr_label.text = "We use data to personalize ads."
    age_box.clear()
    age_box.add_item("Child (<13)")
    age_box.add_item("Teen (13-17)")
    age_box.add_item("Adult (18+)")
    grant_btn.pressed.connect(func(): ConsentManager.set_consent("granted"))
    deny_btn.pressed.connect(func(): ConsentManager.set_consent("denied"))
    save_btn.pressed.connect(func():
        var idx := age_box.get_selected_id()
        var group := idx == 0 ? "child" : (idx == 1 ? "teen" : "adult")
        ConsentManager.set_age_group(group)
        queue_free()
    )
