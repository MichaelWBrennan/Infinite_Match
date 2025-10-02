extends Node

class_name Analytics

var _engine_version := "godot_4.3"
var _build_version := "1.0.0"
var _initialized := false
var _interstitials_shown_today := 0
var _last_interstitial_close_time_ms: int = 0

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
        ByteBrewBridge.custom_event("progression_" + stage, value)

static func track_ad(placement_type: String, location: String, ad_unit: String = "", provider: String = "", revenue: float = 0.0) -> void:
    if Engine.has_singleton("ByteBrew"):
        ByteBrewBridge.track_ad(placement_type, location, ad_unit, provider, revenue)

static func track_purchase(store: String, currency: String, amount: float, item_id: String, category: String) -> void:
    if Engine.has_singleton("ByteBrew"):
        ByteBrewBridge.track_purchase(store, currency, amount, item_id, category)

static func mark_interstitial_shown() -> void:
    _interstitials_shown_today += 1
    ByteBrewBridge.custom_event("interstitial_shown_count", _interstitials_shown_today)

static func mark_interstitial_closed() -> void:
    _last_interstitial_close_time_ms = Time.get_ticks_msec()
    ByteBrewBridge.custom_event("interstitial_closed_ts", float(_last_interstitial_close_time_ms) / 1000.0)

static func track_arpdau(arpdau_usd: float) -> void:
    ByteBrewBridge.custom_event("arpdau_usd", arpdau_usd)
