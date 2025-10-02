extends Node

class_name AdManager

signal rewarded_granted(amount)

var _rewarded_ready := false
var _interstitial_ready := false

var _default_reward := 5

var _rewarded_unit_id := "" # populated by remote config / config file
var _interstitial_unit_id := ""

var _pending_reward_callback: Callable = Callable()
var _pending_reward_location: String = ""

func _ready() -> void:
    preload_all()
    var provider = _ad_provider()
    if provider:
        if provider.has_signal("ad_paid"):
            provider.connect("ad_paid", Callable(self, "_on_ad_paid"))
        if provider.has_signal("rewarded_earned"):
            provider.connect("rewarded_earned", Callable(self, "_on_rewarded_earned"))

func preload_all() -> void:
    _rewarded_unit_id = _get_remote_ad_unit("rewarded")
    _interstitial_unit_id = _get_remote_ad_unit("interstitial")
    var provider = _ad_provider()
    if provider:
        # Try loading via common plugin APIs; fall back to simulated
        if provider.has_method("load_rewarded"):
            provider.load_rewarded(_rewarded_unit_id)
        elif provider.has_method("loadRewarded"):
            provider.loadRewarded(_rewarded_unit_id)
        if provider.has_method("load_interstitial"):
            provider.load_interstitial(_interstitial_unit_id)
        elif provider.has_method("loadInterstitial"):
            provider.loadInterstitial(_interstitial_unit_id)
        _rewarded_ready = true
        _interstitial_ready = true
    else:
        _rewarded_ready = true
        _interstitial_ready = true

func show_rewarded(location: String, on_reward: Callable) -> void:
    var provider = _ad_provider()
    if provider and _rewarded_unit_id != "":
        Analytics.track_ad("Reward", location)
        if provider.has_method("show_rewarded"):
            provider.show_rewarded(_rewarded_unit_id, func():
                var reward_amount := _get_dynamic_reward(location)
                on_reward.call(reward_amount)
                rewarded_granted.emit(reward_amount)
            )
            return
        elif provider.has_method("showRewarded"):
            # Use provider signal to confirm reward
            _pending_reward_callback = on_reward
            _pending_reward_location = location
            # Prefer overload with location if exists
            provider.showRewarded(_rewarded_unit_id, location)
            return
    # Fallback simulation
    if _rewarded_ready:
        _rewarded_ready = false
        Analytics.track_ad("Reward", location)
        await get_tree().create_timer(0.2).timeout
        var reward_amount3 := _get_dynamic_reward(location)
        on_reward.call(reward_amount3)
        rewarded_granted.emit(reward_amount3)
        _rewarded_ready = true

func show_interstitial(location: String) -> void:
    var provider = _ad_provider()
    if provider and _interstitial_unit_id != "":
        Analytics.track_ad("Interstitial", location)
        if provider.has_method("show_interstitial"):
            provider.show_interstitial(_interstitial_unit_id)
            return
        elif provider.has_method("showInterstitial"):
            provider.showInterstitial(_interstitial_unit_id, location)
            return
    # Fallback simulation
    if _interstitial_ready:
        _interstitial_ready = false
        Analytics.track_ad("Interstitial", location)
        await get_tree().create_timer(0.1).timeout
        _interstitial_ready = true

func _get_dynamic_reward(location: String) -> int:
    var remote_value := RemoteConfig.get_int("reward_" + location, _default_reward)
    return max(1, remote_value)

func _ad_provider():
    # Try common plugin singletons by name
    var names = [
        "AdsBridge", # bundled Java bridge for Android
        "GodotGoogleMobileAds", # popular GMA plugin
        "AdMob",
        "GoogleMobileAds",
        "GMA"
    ]
    for n in names:
        if Engine.has_singleton(n):
            return Engine.get_singleton(n)
    return null

func _get_remote_ad_unit(kind: String) -> String:
    var platform = "android" if OS.get_name() == "Android" else ("ios" if OS.get_name() == "iOS" else "editor")
    var key = "ad_%s_%s" % [kind, platform]
    return RemoteConfig.get_string(key, "")

func _on_rewarded_earned(amount: int) -> void:
    var location = _pending_reward_location
    var reward_amount := _get_dynamic_reward(location)
    if _pending_reward_callback.is_valid():
        _pending_reward_callback.call(reward_amount)
    rewarded_granted.emit(reward_amount)
    _pending_reward_callback = Callable()
    _pending_reward_location = ""

func _on_ad_paid(provider_name: String, ad_unit: String, placement_type: String, location: String, currency: String, value_micros: int) -> void:
    var revenue = float(value_micros) / 1000000.0
    Analytics.track_ad(placement_type, location, ad_unit, provider_name, revenue)
