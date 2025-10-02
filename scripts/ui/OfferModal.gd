extends Control

class_name OfferModal

@export var kind: int = 0
@export var sku: String = ""

@onready var title_label: Label = $Panel/VBox/Title
@onready var desc_label: Label = $Panel/VBox/Desc
@onready var price_btn: Button = $Panel/VBox/CTA
@onready var close_btn: Button = $Panel/VBox/Close

func _ready() -> void:
    var info := Offers.describe_offer(kind)
    title_label.text = String(info.get("title", "Special Offer"))
    var price_text := IAPManager.get_price_string(sku)
    if price_text == "":
        price_text = "$" + str(IAPManager.get_price_usd(sku))
    desc_label.text = "Limited time offer!"
    price_btn.text = "Buy %s" % price_text
    price_btn.pressed.connect(func():
        Analytics.track_offer("cta", str(kind), sku)
        IAPManager.purchase_item(sku)
        queue_free()
    )
    close_btn.pressed.connect(func():
        Analytics.track_offer("dismiss", str(kind), sku)
        queue_free()
    )
