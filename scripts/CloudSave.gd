extends Node
class_name CloudSave

# Minimal PlayFab-like bridge (can be swapped for Firebase/PlayFab official)
# Uses Backend.base_url() endpoints when configured; no-ops otherwise

signal load_completed(ok: bool)
signal save_completed(ok: bool)

func load_profile() -> void:
    if not Engine.has_singleton("Backend"):
        emit_signal("load_completed", false)
        return
    var url := Backend.base_url() + "/save/load"
    if Backend.base_url() == "":
        emit_signal("load_completed", false)
        return
    var resp := await Backend._post_json(url, {"device_id": OS.get_unique_id()})
    if bool(resp.get("ok", false)):
        var text := String(resp.get("body", "{}"))
        var d = JSON.parse_string(text)
        if typeof(d) == TYPE_DICTIONARY:
            _apply_profile(d)
            emit_signal("load_completed", true)
            return
    emit_signal("load_completed", false)

func save_profile() -> void:
    if not Engine.has_singleton("Backend"):
        emit_signal("save_completed", false)
        return
    var url := Backend.base_url() + "/save/store"
    if Backend.base_url() == "":
        emit_signal("save_completed", false)
        return
    var payload := GameState._load_json()
    payload["device_id"] = OS.get_unique_id()
    var resp := await Backend._post_json(url, payload)
    emit_signal("save_completed", bool(resp.get("ok", false)))

func _apply_profile(d: Dictionary) -> void:
    # Merge remote profile into local
    var keys := ["coins","gems","energy_current","energy_max","last_energy_ts","remove_ads","owned_cosmetics","ever_purchased","first_install_day","last_seen_day","session_count_total","sessions_today","current_level","level_stars","level_best_score","booster_inventory","fail_streak_by_level","wins_since_review","last_review_day","review_prompted","color_blind_mode","star_chests_claimed","tournament_week_seed","tournament_score","vip_days_remaining","weekly_points","weekly_week_seed","win_streak","best_win_streak","booster_usage_counts","booster_upgrade_level"]
    var local := GameState._load_json()
    for k in keys:
        if d.has(k):
            local[k] = d[k]
    GameState._store_json(local)
