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
var fail_streak_by_level: Dictionary = {} # level_id -> consecutive fails
var wins_since_review: int = 0
var last_review_day: int = 0
var review_prompted: bool = false
var color_blind_mode: bool = false
var star_chests_claimed: int = 0
var tournament_week_seed: int = 0
var tournament_score: int = 0
var vip_days_remaining: int = 0
var weekly_points: int = 0
var weekly_week_seed: int = 0
var win_streak: int = 0
var best_win_streak: int = 0
var booster_usage_counts: Dictionary = {}
var booster_upgrade_level: Dictionary = {}

var _save_path := "user://state.json"

func _ready() -> void:
    energy_max = RemoteConfig.get_int("energy_max", 5)
    _load()
    _track_session()
    _tick_energy_refill()
    # Show banner on menu by default
    AdManager.show_banner("bottom")
    _ensure_tournament_week()

func add_coins(amount: int) -> void:
    coins += max(0, amount)
    currency_changed.emit(coins)
    _save()
    ByteBrewBridge.custom_event("coins_added", amount)
    ByteBrewBridge.custom_event("coins_balance", coins)
    EconomyTelemetry.record("income", "coins", max(0, amount))

func spend_coins(amount: int) -> bool:
    if coins >= amount:
        coins -= amount
        currency_changed.emit(coins)
        _save()
        ByteBrewBridge.custom_event("coins_spent", amount)
        ByteBrewBridge.custom_event("coins_balance", coins)
        EconomyTelemetry.record("spend", "coins", max(0, amount))
        return true
    return false

func add_gems(amount: int) -> void:
    gems += max(0, amount)
    gems_changed.emit(gems)
    _save()
    ByteBrewBridge.custom_event("gems_added", amount)
    ByteBrewBridge.custom_event("gems_balance", gems)
    EconomyTelemetry.record("income", "gems", max(0, amount))

func spend_gems(amount: int) -> bool:
    if gems >= amount:
        gems -= amount
        gems_changed.emit(gems)
        _save()
        ByteBrewBridge.custom_event("gems_spent", amount)
        ByteBrewBridge.custom_event("gems_balance", gems)
        EconomyTelemetry.record("spend", "gems", max(0, amount))
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
        ByteBrewBridge.custom_event("energy_spent", cost)
        ByteBrewBridge.custom_event("energy_balance", energy_current)
        return true
    return false

func refill_energy() -> void:
    energy_current = energy_max
    energy_changed.emit(energy_current, energy_max)
    _save()
    ByteBrewBridge.custom_event("energy_refill", energy_max)
    ByteBrewBridge.custom_event("energy_balance", energy_current)

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
    data["fail_streak_by_level"] = fail_streak_by_level
    data["wins_since_review"] = wins_since_review
    data["last_review_day"] = last_review_day
    data["review_prompted"] = review_prompted
    data["color_blind_mode"] = color_blind_mode
    data["star_chests_claimed"] = star_chests_claimed
    data["tournament_week_seed"] = tournament_week_seed
    data["tournament_score"] = tournament_score
    data["vip_days_remaining"] = vip_days_remaining
    data["weekly_points"] = weekly_points
    data["weekly_week_seed"] = weekly_week_seed
    data["win_streak"] = win_streak
    data["best_win_streak"] = best_win_streak
    data["booster_usage_counts"] = booster_usage_counts
    data["booster_upgrade_level"] = booster_upgrade_level
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
    fail_streak_by_level = data.get("fail_streak_by_level", {})
    wins_since_review = int(data.get("wins_since_review", 0))
    last_review_day = int(data.get("last_review_day", 0))
    review_prompted = bool(data.get("review_prompted", false))
    color_blind_mode = bool(data.get("color_blind_mode", false))
    star_chests_claimed = int(data.get("star_chests_claimed", 0))
    tournament_week_seed = int(data.get("tournament_week_seed", 0))
    tournament_score = int(data.get("tournament_score", 0))
    vip_days_remaining = int(data.get("vip_days_remaining", 0))
    weekly_points = int(data.get("weekly_points", 0))
    weekly_week_seed = int(data.get("weekly_week_seed", 0))
    win_streak = int(data.get("win_streak", 0))
    best_win_streak = int(data.get("best_win_streak", 0))
    booster_usage_counts = data.get("booster_usage_counts", {})
    booster_upgrade_level = data.get("booster_upgrade_level", {})
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

# --- Difficulty and review utilities ---
func register_level_win(level_id: int) -> void:
    var key := str(level_id)
    fail_streak_by_level[key] = 0
    wins_since_review += 1
    _inc_win_streak()
    _add_weekly_points(100) # base; tuned via remote if needed
    _save()

func register_level_fail(level_id: int) -> void:
    var key := str(level_id)
    fail_streak_by_level[key] = int(fail_streak_by_level.get(key, 0)) + 1
    win_streak = 0
    _save()

func get_fail_streak(level_id: int) -> int:
    return int(fail_streak_by_level.get(str(level_id), 0))

func maybe_prompt_review_after_win() -> void:
    if review_prompted:
        return
    var min_wins := RemoteConfig.get_int("review_prompt_min_wins", 3)
    if wins_since_review < min_wins:
        return
    var cool_days := RemoteConfig.get_int("review_prompt_cooldown_days", 30)
    var today := int(Time.get_unix_time_from_system() / 86400)
    if last_review_day > 0 and (today - last_review_day) < cool_days:
        return
    var url := RemoteConfig.get_string("store_review_url", "")
    if url == "":
        return
    OS.shell_open(url)
    last_review_day = today
    review_prompted = true
    wins_since_review = 0
    _save()

func set_color_blind_mode(on: bool) -> void:
    color_blind_mode = on
    _save()

# --- World map star chest ---
func total_stars() -> int:
    var total := 0
    for k in level_stars.keys():
        total += int(level_stars[k])
    return total

func can_claim_star_chest() -> bool:
    var step := RemoteConfig.get_int("world_map_chest_star_step", 25)
    var next_idx := star_chests_claimed + 1
    return total_stars() >= step * next_idx

func claim_star_chest() -> Dictionary:
    if not can_claim_star_chest():
        return {}
    star_chests_claimed += 1
    var coins := RemoteConfig.get_int("world_map_chest_coin_reward", 200)
    var gems_r := RemoteConfig.get_int("world_map_chest_gem_reward", 5)
    add_coins(coins)
    add_gems(gems_r)
    Analytics.custom_event("star_chest_claim", coins)
    _save()
    return {"coins": coins, "gems": gems_r}

# --- Tournament ---
func _current_week_seed() -> int:
    return int(Time.get_unix_time_from_system() / (7 * 86400))

func _ensure_tournament_week() -> void:
    var seed := _current_week_seed()
    if tournament_week_seed != seed:
        tournament_week_seed = seed
        tournament_score = 0
        _save()

func add_tournament_points(points: int) -> void:
    _ensure_tournament_week()
    tournament_score += max(0, points)
    _save()

func set_vip_days(days: int) -> void:
    vip_days_remaining = max(0, days)
    _save()

func is_vip() -> bool:
    return vip_days_remaining > 0

func _current_week_seed_generic() -> int:
    return int(Time.get_unix_time_from_system() / (7 * 86400))

func _ensure_weekly() -> void:
    var seed := _current_week_seed_generic()
    if weekly_week_seed != seed:
        weekly_week_seed = seed
        weekly_points = 0
        _save()

func _add_weekly_points(points: int) -> void:
    _ensure_weekly()
    weekly_points += max(0, points)
    _save()

func weekly_points_needed() -> int:
    var step := RemoteConfig.get_int("weekly_chest_points_step", 1000)
    return step

func can_claim_weekly_chest() -> bool:
    _ensure_weekly()
    return weekly_points >= weekly_points_needed()

func claim_weekly_chest() -> int:
    if not can_claim_weekly_chest():
        return 0
    weekly_points -= weekly_points_needed()
    var reward := RemoteConfig.get_int("weekly_chest_coin_reward", 500)
    add_coins(reward)
    return reward

func _inc_win_streak() -> void:
    win_streak += 1
    if win_streak > best_win_streak:
        best_win_streak = win_streak
    var bonus_per := RemoteConfig.get_int("win_streak_coin_bonus_per", 2)
    if bonus_per > 0:
        add_coins(win_streak * bonus_per)

func record_booster_use(name: String) -> void:
    booster_usage_counts[name] = int(booster_usage_counts.get(name, 0)) + 1
    _save()

func booster_upgrade(name: String) -> bool:
    var cost := RemoteConfig.get_int("booster_mastery_upgrade_cost", 1000)
    if spend_coins(cost):
        var lvl := int(booster_upgrade_level.get(name, 0)) + 1
        booster_upgrade_level[name] = lvl
        _save()
        return true
    return false

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
