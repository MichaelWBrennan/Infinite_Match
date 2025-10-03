extends Control

class_name SettingsModal

@onready var lang_box: OptionButton = $Panel/VBox/Lang
@onready var privacy_btn: Button = $Panel/VBox/Privacy
@onready var close_btn: Button = $Panel/VBox/Close

var _langs := ["en","es","pt","fr","de","ru","ja","ko","zh","ar"]

func _ready() -> void:
    lang_box.clear()
    for i in range(_langs.size()):
        lang_box.add_item(_langs[i], i)
    privacy_btn.text = Localize.t("modal.close", "Privacy Policy")
    privacy_btn.pressed.connect(func(): OS.shell_open("https://example.com/privacy"))
    close_btn.text = Localize.t("modal.close", "Close")
    close_btn.pressed.connect(func(): queue_free())
    lang_box.item_selected.connect(func(idx):
        var code := _langs[idx]
        Localize.load_lang(code)
    )
