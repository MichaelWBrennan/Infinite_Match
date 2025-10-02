extends Node

class_name RemoteConfig

var _cache: Dictionary = {}
var _overrides_path := "user://overrides.json"
var _loaded := false

func _ready() -> void:
    fetch_and_apply()

func fetch_and_apply() -> void:
    if _loaded:
        return
    _loaded = true
    _load_overrides()
    var defaults := {
        # Rewards and ads
        "reward_boost": 5,
        "reward_energy": 5,
        "reward_continue": 5,
        "reward_level_win": 10,
        "reward_shop_get_more": 10,
        "interstitial_interval": 45,
        "interstitial_cooldown_min_s": 120,
        "interstitial_cooldown_max_s": 180,
        "interstitial_on_gameover_pct": 66,
        "interstitial_cap_game_over_per_session": 2,
        "interstitial_cap_per_10min": 3,
        # Segmentation
        "seg_payer_interstitial_pct": 25,
        "rv_engaged_threshold_today": 3,
        "seg_rv_engaged_interstitial_pct": 33,
        "disable_banners_for_payers": 1,
        "banner_height_dp": 50,
        # Ad units (replace remotely on prod)
        "ad_rewarded_android": "ca-app-pub-3940256099942544/5224354917",
        "ad_interstitial_android": "ca-app-pub-3940256099942544/1033173712",
        "ad_banner_android": "ca-app-pub-3940256099942544/6300978111",
        "ad_rewarded_ios": "TEST_REWARDED_IOS",
        "ad_interstitial_ios": "TEST_INTERSTITIAL_IOS",
        "ad_banner_ios": "TEST_BANNER_IOS",
        # Offerwall
        "offerwall_url": "",
        # Economy
        "energy_max": 5,
        "energy_refill_minutes": 20,
        "daily_reward_base": 50,
        # Piggy bank
        "piggy_enabled": 1,
        "piggy_max": 5000,
        "piggy_fill_per_clear": 1,
        "piggy_unlock_price": 2.99,
        # Starter/comeback offers
        "starter_enabled": 1,
        "starter_pack_small_coins": 500,
        "starter_pack_large_coins": 5000,
        "starter_discount_pct": 50,
        "comeback_enabled": 1,
        "comeback_days": 7,
        "comeback_bonus_coins": 800,
        "comeback_price": 1.99,
        # Coin pack grants
        "coins_small_amount": 500,
        "coins_medium_amount": 3000,
        "coins_large_amount": 7500,
        "coins_huge_amount": 20000,
        # Booster bundle
        "booster_bundle_coins": 1000,
        # Piggy fallback
        "piggy_open_fallback_coins": 1000,
        # Season pass config
        "season_levels": 30,
        "season_free_coin_base": 50,
        "season_premium_coin_base": 100
    }
    _cache.merge(defaults, true)
    if Engine.has_singleton("ByteBrew"):
        # Attempt to load remote configs via native plugin if methods are exposed
        var bb = Engine.get_singleton("ByteBrew")
        if bb and bb.has_method("LoadRemoteConfigs"):
            # Use ByteBrewEntry callback bridge
            ByteBrewEntry.on_finish_loading_configs = func(status):
                # After remote configs loaded, attempt to read our keys
                for key in defaults.keys():
                    var value = _bb_get_string(key, str(defaults[key]))
                    _try_merge_string_value(key, value)
                _save_overrides() # persist last known values for offline use
            # Call into native to load
            bb.LoadRemoteConfigs()
        else:
            # No method exposed; keep defaults/overrides
            pass
    else:
        # Simulate small delay and continue with defaults/overrides
        await get_tree().create_timer(0.05).timeout

func get_int(key: String, default_value: int) -> int:
    return int(_cache.get(key, default_value))

func get_string(key: String, default_value: String) -> String:
    return str(_cache.get(key, default_value))

func get_float(key: String, default_value: float) -> float:
    var v = _cache.get(key, default_value)
    if typeof(v) == TYPE_FLOAT:
        return v
    if typeof(v) == TYPE_INT:
        return float(v)
    return default_value

func set_override(key: String, value) -> void:
    _cache[key] = value
    _save_overrides()

func _load_overrides() -> void:
    var f := FileAccess.open(_overrides_path, FileAccess.READ)
    if f:
        var txt := f.get_as_text()
        f.close()
        var d = JSON.parse_string(txt)
        if typeof(d) == TYPE_DICTIONARY:
            _cache.merge(d, true)

func _save_overrides() -> void:
    var f := FileAccess.open(_overrides_path, FileAccess.WRITE)
    if f:
        f.store_string(JSON.stringify(_cache))
        f.close()

func _bb_get_string(key: String, default_value: String) -> String:
    var bb = Engine.get_singleton("ByteBrew")
    if bb and bb.has_method("RetrieveRemoteConfigs"):
        return str(bb.RetrieveRemoteConfigs(key, default_value))
    return default_value

func _try_merge_string_value(key: String, val: String) -> void:
    if key.ends_with("_interval"):
        var n = int(val.to_int())
        _cache[key] = n
    elif key.begins_with("reward_"):
        _cache[key] = int(val.to_int())
    else:
        _cache[key] = val
