extends Node

class_name GameState

signal currency_changed(new_balance)
signal energy_changed(current, max)
signal cosmetics_changed()

var coins: int = 0
signal gems_changed(new_balance)
var gems: int = 0
var energy_current: int = 0
var energy_max: int = 5
var last_energy_ts: int = 0
var remove_ads: bool = false
var owned_cosmetics: Array[String] = []
var ever_purchased: bool = false
var first_install_day: int = 0
var last_seen_day: int = 0
var session_count_total: int = 0
var sessions_today: int = 0
var current_level: int = 1
var level_stars: Dictionary = {} # level_id -> stars (0-3)
var level_best_score: Dictionary = {} # level_id -> best score
var booster_inventory: Dictionary = {"pre_bomb": 0, "pre_rocket": 0, "pre_color_bomb": 0, "hammer": 0, "shuffle": 0, "bomb": 0, "rocket": 0}

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

func add_gems(amount: int) -> void:
    gems += max(0, amount)
    gems_changed.emit(gems)
    _save()

func spend_gems(amount: int) -> bool:
    if gems >= amount:
        gems -= amount
        gems_changed.emit(gems)
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

func refill_energy() -> void:
    energy_current = energy_max
    energy_changed.emit(energy_current, energy_max)
    _save()

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

func mark_purchased() -> void:
    ever_purchased = true
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
    data["gems"] = gems
    data["energy_current"] = energy_current
    data["energy_max"] = energy_max
    data["last_energy_ts"] = last_energy_ts
    data["remove_ads"] = remove_ads
    data["owned_cosmetics"] = owned_cosmetics
    data["ever_purchased"] = ever_purchased
    data["first_install_day"] = first_install_day
    data["last_seen_day"] = last_seen_day
    data["session_count_total"] = session_count_total
    data["sessions_today"] = sessions_today
    data["current_level"] = current_level
    data["level_stars"] = level_stars
    data["level_best_score"] = level_best_score
    data["booster_inventory"] = booster_inventory
    _store_json(data)

func _load() -> void:
    var data := _load_json()
    coins = int(data.get("coins", 0))
    gems = int(data.get("gems", 0))
    energy_current = int(data.get("energy_current", energy_max))
    energy_max = int(data.get("energy_max", energy_max))
    last_energy_ts = int(data.get("last_energy_ts", 0))
    remove_ads = bool(data.get("remove_ads", false))
    owned_cosmetics = data.get("owned_cosmetics", [])
    ever_purchased = bool(data.get("ever_purchased", false))
    first_install_day = int(data.get("first_install_day", 0))
    last_seen_day = int(data.get("last_seen_day", 0))
    session_count_total = int(data.get("session_count_total", 0))
    sessions_today = int(data.get("sessions_today", 0))
    current_level = int(data.get("current_level", 1))
    level_stars = data.get("level_stars", {})
    level_best_score = data.get("level_best_score", {})
    booster_inventory = data.get("booster_inventory", booster_inventory)
    if remove_ads:
        AdManager.set_remove_ads(true)

func booster_add(name: String, count: int = 1) -> void:
    booster_inventory[name] = int(booster_inventory.get(name, 0)) + max(0, count)
    _save()

func booster_has(name: String, count: int = 1) -> bool:
    return int(booster_inventory.get(name, 0)) >= count

func booster_consume(name: String, count: int = 1) -> bool:
    if booster_has(name, count):
        booster_inventory[name] = int(booster_inventory.get(name, 0)) - count
        _save()
        return true
    return false

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

# Return whether to show interstitial on game over this session, based on remote percentage
func start_game_round() -> bool:
    var pct := clamp(RemoteConfig.get_int("interstitial_on_gameover_pct", 66), 0, 100)
    var r := randi() % 100
    return r < pct

# Progression helpers
func get_current_level() -> int:
    return max(1, current_level)

func get_level_stars(level_id: int) -> int:
    return int(level_stars.get(str(level_id), 0))

func get_level_best_score(level_id: int) -> int:
    return int(level_best_score.get(str(level_id), 0))

func complete_level(level_id: int, score: int, stars: int) -> void:
    var key := str(level_id)
    var prev_stars := int(level_stars.get(key, 0))
    if stars > prev_stars:
        level_stars[key] = stars
    var prev_score := int(level_best_score.get(key, 0))
    if score > prev_score:
        level_best_score[key] = score
    current_level = max(current_level, level_id + 1)
    _save()

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
