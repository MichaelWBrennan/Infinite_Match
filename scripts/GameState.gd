extends Node

class_name GameState

signal currency_changed(new_balance)
signal energy_changed(current, max)
signal cosmetics_changed()

var coins: int = 0
var energy_current: int = 0
var energy_max: int = 5
var last_energy_ts: int = 0
var remove_ads: bool = false
var owned_cosmetics: Array[String] = []
var first_install_day: int = 0
var last_seen_day: int = 0
var session_count_total: int = 0
var sessions_today: int = 0

var _save_path := "user://state.json"

func _ready() -> void:
    energy_max = RemoteConfig.get_int("energy_max", 5)
    _load()
    _track_session()
    _tick_energy_refill()
    # Show banner on menu by default
    AdManager.show_banner("bottom")

func add_coins(amount: int) -> void:
    coins += max(0, amount)
    currency_changed.emit(coins)
    _save()

func spend_coins(amount: int) -> bool:
    if coins >= amount:
        coins -= amount
        currency_changed.emit(coins)
        _save()
        return true
    return false

func get_energy() -> int:
    _tick_energy_refill()
    return energy_current

func consume_energy(cost: int = 1) -> bool:
    _tick_energy_refill()
    if energy_current >= cost:
        energy_current -= cost
        energy_changed.emit(energy_current, energy_max)
        _save()
        return true
    return false

func _tick_energy_refill() -> void:
    var refill_minutes := RemoteConfig.get_int("energy_refill_minutes", 20)
    if energy_current >= energy_max:
        return
    var now := Time.get_unix_time_from_system()
    if last_energy_ts <= 0:
        last_energy_ts = int(now)
    var seconds_passed := int(now) - last_energy_ts
    var per := refill_minutes * 60
    if seconds_passed >= per:
        var gained := seconds_passed / per
        energy_current = min(energy_max, energy_current + gained)
        last_energy_ts += gained * per
        energy_changed.emit(energy_current, energy_max)
        _save()

func grant_daily_reward() -> int:
    var base := RemoteConfig.get_int("daily_reward_base", 50)
    var streak := _get_streak()
    var reward := base + int(base * min(7, streak) * 0.1)
    add_coins(reward)
    _mark_daily_claimed()
    return reward

func purchase_remove_ads() -> void:
    remove_ads = true
    AdManager.set_remove_ads(true)
    _save()

func own_cosmetic(id: String) -> void:
    if not owned_cosmetics.has(id):
        owned_cosmetics.append(id)
        cosmetics_changed.emit()
        _save()

func _get_streak() -> int:
    var data := _load_json()
    var streak: int = int(data.get("streak", 0))
    var last_day: int = int(data.get("last_login_day", 0))
    var today: int = int(Time.get_unix_time_from_system() / 86400)
    if last_day == today:
        return streak
    if last_day == today - 1:
        return streak + 1
    return 1

func _mark_daily_claimed() -> void:
    var data := _load_json()
    data["streak"] = _get_streak()
    data["last_login_day"] = int(Time.get_unix_time_from_system() / 86400)
    _store_json(data)

func _save() -> void:
    var data := _load_json()
    data["coins"] = coins
    data["energy_current"] = energy_current
    data["energy_max"] = energy_max
    data["last_energy_ts"] = last_energy_ts
    data["remove_ads"] = remove_ads
    data["owned_cosmetics"] = owned_cosmetics
    data["first_install_day"] = first_install_day
    data["last_seen_day"] = last_seen_day
    data["session_count_total"] = session_count_total
    data["sessions_today"] = sessions_today
    _store_json(data)

func _load() -> void:
    var data := _load_json()
    coins = int(data.get("coins", 0))
    energy_current = int(data.get("energy_current", energy_max))
    energy_max = int(data.get("energy_max", energy_max))
    last_energy_ts = int(data.get("last_energy_ts", 0))
    remove_ads = bool(data.get("remove_ads", false))
    owned_cosmetics = data.get("owned_cosmetics", [])
    first_install_day = int(data.get("first_install_day", 0))
    last_seen_day = int(data.get("last_seen_day", 0))
    session_count_total = int(data.get("session_count_total", 0))
    sessions_today = int(data.get("sessions_today", 0))
    if remove_ads:
        AdManager.set_remove_ads(true)

func _track_session() -> void:
    var today := int(Time.get_unix_time_from_system() / 86400)
    if first_install_day == 0:
        first_install_day = today
    if last_seen_day != today:
        sessions_today = 0
        last_seen_day = today
    sessions_today += 1
    session_count_total += 1
    _save()

# Return whether to show interstitial on game over this session (every 2-3 sessions)
func start_game_round() -> bool:
    var should := ((sessions_today % 2) == 0)
    return should

func _load_json() -> Dictionary:
    var f := FileAccess.open(_save_path, FileAccess.READ)
    if f:
        var txt := f.get_as_text()
        f.close()
        var d = JSON.parse_string(txt)
        if typeof(d) == TYPE_DICTIONARY:
            return d
    return {}

func _store_json(d: Dictionary) -> void:
    var f := FileAccess.open(_save_path, FileAccess.WRITE)
    if f:
        f.store_string(JSON.stringify(d))
        f.close()
