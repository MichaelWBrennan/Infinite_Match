extends Control

class_name OfferModal

@export var kind: int = 0
@export var sku: String = ""

@onready var title_label: Label = $Panel/VBox/Title
@onready var desc_label: Label = $Panel/VBox/Desc
@onready var price_btn: Button = $Panel/VBox/CTA
@onready var close_btn: Button = $Panel/VBox/Close
@onready var timer_label: Label = $Panel/VBox/Timer

func _ready() -> void:
    var info := Offers.describe_offer(kind)
    var title_key := "offer.title.starter"
    if kind == Offers.OfferKind.FLASH:
        title_key = "offer.title.flash"
    elif kind == Offers.OfferKind.COMEBACK:
        title_key = "offer.title.comeback"
    title_label.text = Localize.t(title_key, String(info.get("title", "Special Offer")))
    var price_text := IAPManager.get_price_string(sku)
    if price_text == "":
        price_text = "$" + str(IAPManager.get_price_usd(sku))
    desc_label.text = Localize.t("modal.daily.title", "Limited time offer!")
    price_btn.text = "%s %s" % [Localize.t("modal.buy", "Buy"), price_text]
    if info.has("ends_at"):
        _start_timer(int(info["ends_at"]))
    price_btn.pressed.connect(func():
        Analytics.track_offer("cta", str(kind), sku)
        IAPManager.purchase_item(sku)
        queue_free()
    )
    close_btn.pressed.connect(func():
        Analytics.track_offer("dismiss", str(kind), sku)
        queue_free()
    )

func _start_timer(end_ts: int) -> void:
    _update_timer(end_ts)
    var t := Timer.new()
    t.wait_time = 1.0
    t.autostart = true
    t.one_shot = false
    add_child(t)
    t.timeout.connect(func(): _update_timer(end_ts))

func _update_timer(end_ts: int) -> void:
    var now := int(Time.get_unix_time_from_system())
    var remain := max(0, end_ts - now)
    var h := remain / 3600
    var m := (remain % 3600) / 60
    var s := remain % 60
    timer_label.text = "%02d:%02d:%02d" % [h, m, s]
