extends Node

class_name Analytics

var _engine_version := "godot_4.3"
var _build_version := "1.0.0"
var _initialized := false

func _ready() -> void:
    _try_init()

func _try_init() -> void:
    if _initialized:
        return
    if Engine.has_singleton("ByteBrew"):
        _initialized = true
    # iOS ByteBrew entry autoload will call into native once configured by export settings.

static func track_session_start() -> void:
    if Engine.has_singleton("ByteBrew"):
        # Native SDK auto-tracks sessions; ensure remote configs load
        ByteBrewBridge.load_remote_configs(func(status):
            # no-op; ensure initialization
            pass)

static func track_progression(stage: String, value: String = "") -> void:
    if Engine.has_singleton("ByteBrew"):
        # Bridge via native; plugin exposes progression events on mobile
        pass

static func track_ad(placement_type: String, location: String, ad_unit: String = "", provider: String = "", revenue: float = 0.0) -> void:
    if Engine.has_singleton("ByteBrew"):
        ByteBrewBridge.track_ad(placement_type, location, ad_unit, provider, revenue)

static func track_purchase(store: String, currency: String, amount: float, item_id: String, category: String) -> void:
    if Engine.has_singleton("ByteBrew"):
        ByteBrewBridge.track_purchase(store, currency, amount, item_id, category)
