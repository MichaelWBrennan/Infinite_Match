extends Node

class_name AdManager

signal rewarded_granted(amount)

# Monetization knobs (editable):
# - Interstitial cooldown in seconds (min/max randomized between)
var _interstitial_cooldown_min_s := 120
var _interstitial_cooldown_max_s := 180

# Whether ads are disabled due to purchase
var _remove_ads := false

var _rewarded_ready := false
var _interstitial_ready := false
var _interstitials_shown_this_session: int = 0
var _interstitials_shown_last_10min: Array[int] = [] # timestamps (ms)

var _banner_visible := false
var _banner_unit_id := ""

var _default_reward := 5

var _rewarded_unit_id := "" # populated by remote config / config file
var _interstitial_unit_id := ""
var _last_interstitial_time_ms: int = 0
var _next_allowed_interstitial_time_ms: int = 0

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
        if provider.has_signal("interstitial_closed"):
            provider.connect("interstitial_closed", Callable(self, "_on_interstitial_closed"))

func preload_all() -> void:
    _rewarded_unit_id = _get_remote_ad_unit("rewarded")
    _interstitial_unit_id = _get_remote_ad_unit("interstitial")
    _banner_unit_id = _get_remote_ad_unit("banner")
    _load_remove_ads_flag()
    _configure_cooldown_from_remote()
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
    var providers := _ad_providers()
    if _rewarded_unit_id != "":
        for provider in providers:
            if provider == null:
                continue
            Analytics.track_ad("Reward", location)
            if provider.has_method("show_rewarded"):
                provider.show_rewarded(_rewarded_unit_id, func():
                    var reward_amount := _get_dynamic_reward(location)
                    on_reward.call(reward_amount)
                    rewarded_granted.emit(reward_amount)
                )
                return
            elif provider.has_method("showRewarded"):
                _pending_reward_callback = on_reward
                _pending_reward_location = location
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

# Wrapper with requested API name
func show_rewarded_ad(location: String = "default", on_complete: Callable = Callable()) -> void:
    var cb := on_complete
    if not cb.is_valid():
        cb = Callable()
    show_rewarded(location, cb)

func show_interstitial(location: String) -> void:
    if _remove_ads:
        return
    if not _interstitial_cooldown_elapsed():
        return
    if not _interstitial_caps_allow(location):
        return
    var providers := _ad_providers()
    if _interstitial_unit_id != "":
        for provider in providers:
            if provider == null:
                continue
            if not (provider.has_method("show_interstitial") or provider.has_method("showInterstitial")):
                continue
            Analytics.track_ad("Interstitial", location)
            if provider.has_method("show_interstitial"):
                provider.show_interstitial(_interstitial_unit_id)
                _mark_interstitial_shown()
                return
            elif provider.has_method("showInterstitial"):
                provider.showInterstitial(_interstitial_unit_id, location)
                _mark_interstitial_shown()
                return
    # Fallback simulation
    if _interstitial_ready:
        _interstitial_ready = false
        Analytics.track_ad("Interstitial", location)
        await get_tree().create_timer(0.1).timeout
        _interstitial_ready = true
        Analytics.custom_event("interstitial_simulated", location)

# Wrapper with requested API name
func show_interstitial_ad(location: String = "break") -> void:
    show_interstitial(location)

func _get_dynamic_reward(location: String) -> int:
    var remote_value := RemoteConfig.get_int("reward_" + location, _default_reward)
    return max(1, remote_value)

func _ad_provider():
    # Try common plugin singletons by name
    var names = [
        "AdsBridge", # bundled Java bridge for Android (AdMob)
        "UnityAdsBridge", # optional Unity Ads bridge
        "GodotGoogleMobileAds", # popular GMA plugin
        "AdMob",
        "GoogleMobileAds",
        "GMA"
    ]
    for n in names:
        if Engine.has_singleton(n):
            return Engine.get_singleton(n)
    return null

func _ad_providers() -> Array:
    var out: Array = []
    var names = [
        "AdsBridge",
        "GodotGoogleMobileAds",
        "UnityAdsBridge",
        "AdMob",
        "GoogleMobileAds",
        "GMA"
    ]
    for n in names:
        if Engine.has_singleton(n):
            out.append(Engine.get_singleton(n))
    return out

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

func _on_interstitial_closed() -> void:
    Analytics.mark_interstitial_closed()

# Banner API
func show_banner(position: String = "bottom") -> void:
    if _remove_ads:
        return
    var provider = _ad_provider()
    # Respect remote config to disable banners for payers
    if GameState.ever_purchased and RemoteConfig.get_int("disable_banners_for_payers", 1) == 1:
        _banner_visible = false
        return
    if provider and _banner_unit_id != "":
        if provider.has_method("showBanner"):
            provider.showBanner(_banner_unit_id, position)
            _banner_visible = true
            return
        elif provider.has_method("create_banner"):
            provider.create_banner(_banner_unit_id, position)
            _banner_visible = true
            return
    _banner_visible = true # pretend visible in editor

func hide_banner() -> void:
    var provider = _ad_provider()
    if provider:
        if provider.has_method("hideBanner"):
            provider.hideBanner()
        elif provider.has_method("destroy_banner"):
            provider.destroy_banner()
    _banner_visible = false

func get_banner_height_px() -> int:
    # Typical 50dp banner height; adapt to screen density
    var dpi := float(DisplayServer.screen_get_dpi())
    if dpi <= 0.0:
        dpi = 160.0
    var dp := RemoteConfig.get_int("banner_height_dp", 50)
    var px := int(round((dpi / 160.0) * float(dp)))
    return max(32, px)

# Offerwall (optional via Tapjoy or external URL)
func open_offerwall() -> void:
    var url := RemoteConfig.get_string("offerwall_url", "")
    if url == "":
        # Fallback to a rewarded ad
        show_rewarded_ad("offerwall_fallback", func(amount: int):
            # Hook for game currency grant handled by listener
            pass)
        return
    var provider = _ad_provider()
    if provider and provider.has_method("openOfferwall"):
        provider.openOfferwall(url)
    else:
        OS.shell_open(url)

func set_remove_ads(enabled: bool) -> void:
    _remove_ads = enabled
    if enabled:
        hide_banner()

func _configure_cooldown_from_remote() -> void:
    var min_s := RemoteConfig.get_int("interstitial_cooldown_min_s", _interstitial_cooldown_min_s)
    var max_s := RemoteConfig.get_int("interstitial_cooldown_max_s", _interstitial_cooldown_max_s)
    if max_s < min_s:
        max_s = min_s
    _interstitial_cooldown_min_s = min_s
    _interstitial_cooldown_max_s = max_s

func _mark_interstitial_shown() -> void:
    _last_interstitial_time_ms = Time.get_ticks_msec()
    var cooldown_s := randi_range(_interstitial_cooldown_min_s, _interstitial_cooldown_max_s)
    _next_allowed_interstitial_time_ms = _last_interstitial_time_ms + int(cooldown_s) * 1000
    _interstitials_shown_this_session += 1
    _interstitials_shown_last_10min.append(_last_interstitial_time_ms)
    _prune_interstitial_window()
    Analytics.mark_interstitial_shown()

func _interstitial_cooldown_elapsed() -> bool:
    if _next_allowed_interstitial_time_ms == 0:
        return true
    return Time.get_ticks_msec() >= _next_allowed_interstitial_time_ms

func _interstitial_caps_allow(location: String) -> bool:
    # Cap per-session for game_over
    var per_session_cap := RemoteConfig.get_int("interstitial_cap_game_over_per_session", 2)
    if location == "game_over" and _interstitials_shown_this_session >= per_session_cap:
        return false
    # Cap over a rolling 10-minute window
    var per10 := RemoteConfig.get_int("interstitial_cap_per_10min", 3)
    _prune_interstitial_window()
    if _interstitials_shown_last_10min.size() >= per10:
        return false
    # Segmentation: payers see fewer interstitials
    if GameState.ever_purchased:
        var payer_pct := clamp(RemoteConfig.get_int("seg_payer_interstitial_pct", 25), 0, 100)
        if (randi() % 100) >= payer_pct:
            return false
    # Segmentation: RV engaged (watched >= N today) -> fewer interstitials
    var rv_threshold := RemoteConfig.get_int("rv_engaged_threshold_today", 3)
    if Analytics.has_method("rewarded_watched_today") and Analytics.rewarded_watched_today() >= rv_threshold:
        var engaged_pct := clamp(RemoteConfig.get_int("seg_rv_engaged_interstitial_pct", 33), 0, 100)
        if (randi() % 100) >= engaged_pct:
            return false
    return true

func _prune_interstitial_window() -> void:
    var now := Time.get_ticks_msec()
    var cutoff := now - 10 * 60 * 1000
    var filtered: Array[int] = []
    for ts in _interstitials_shown_last_10min:
        if ts >= cutoff:
            filtered.append(ts)
    _interstitials_shown_last_10min = filtered

func _load_remove_ads_flag() -> void:
    if Engine.has_singleton("GameState"):
        _remove_ads = GameState.remove_ads
