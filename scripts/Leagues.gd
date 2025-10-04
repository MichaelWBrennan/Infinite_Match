extends Node
class_name Leagues

signal updated()

var _save_path := "user://leagues.json"
var week_seed: int = 0
var division: String = "Bronze" # Bronze, Silver, Gold, Diamond
var points: int = 0
var rank: int = 0
var members: Array = [] # local-only placeholder

func _ready() -> void:
    _ensure_week()
    _load()

func _current_week_seed() -> int:
    return int(Time.get_unix_time_from_system() / (7 * 86400))

func _ensure_week() -> void:
    var seed := _current_week_seed()
    if week_seed != seed:
        week_seed = seed
        points = 0
        rank = 0
        members = []
        _save()
        updated.emit()

func add_points(amt: int) -> void:
    _ensure_week()
    points += max(0, amt)
    rank = max(1, 100 - points / 100) # naive local rank heuristic
    _save()
    Analytics.custom_event("league_points", points)
    updated.emit()

func get_division_rewards() -> Dictionary:
    match division:
        "Bronze": return {"coins": 200, "gems": 0}
        "Silver": return {"coins": 400, "gems": 1}
        "Gold": return {"coins": 800, "gems": 2}
        "Diamond": return {"coins": 1500, "gems": 3}
        _: return {"coins": 0, "gems": 0}

func claim_weekly_rewards() -> Dictionary:
    _ensure_week()
    var r := get_division_rewards()
    if r.get("coins",0) > 0: GameState.add_coins(int(r["coins"]))
    if r.get("gems",0) > 0: GameState.add_gems(int(r["gems"]))
    _save()
    updated.emit()
    return r

func _load() -> void:
    var f := FileAccess.open(_save_path, FileAccess.READ)
    if f:
        var d = JSON.parse_string(f.get_as_text())
        f.close()
        if typeof(d) == TYPE_DICTIONARY:
            week_seed = int(d.get("week_seed", week_seed))
            division = String(d.get("division", division))
            points = int(d.get("points", points))
            rank = int(d.get("rank", rank))
            members = d.get("members", [])

func _save() -> void:
    var d := {
        "week_seed": week_seed,
        "division": division,
        "points": points,
        "rank": rank,
        "members": members
    }
    var f := FileAccess.open(_save_path, FileAccess.WRITE)
    if f:
        f.store_string(JSON.stringify(d))
        f.close()
