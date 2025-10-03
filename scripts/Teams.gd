extends Node
class_name Teams

signal team_chest_progress(progress, threshold)
signal life_requested(player_id)
signal life_granted(player_id)

var team_points: int = 0
var _threshold: int = 0
var lives_requests: Array[String] = []

func _ready() -> void:
    _threshold = RemoteConfig.get_int("team_chest_threshold", 1000)

func add_points(amount: int) -> void:
    team_points += max(0, amount)
    team_chest_progress.emit(team_points, _threshold)

func can_claim_team_chest() -> bool:
    return team_points >= _threshold

func claim_team_chest() -> bool:
    if not can_claim_team_chest():
        return false
    team_points = 0
    var coins := RemoteConfig.get_int("team_chest_reward_coins", 500)
    GameState.add_coins(coins)
    Analytics.custom_event("team_chest_claim", coins)
    team_chest_progress.emit(team_points, _threshold)
    return true

func request_life(player_id: String) -> void:
    if not lives_requests.has(player_id):
        lives_requests.append(player_id)
        life_requested.emit(player_id)

func grant_life(player_id: String) -> bool:
    if lives_requests.has(player_id):
        lives_requests.erase(player_id)
        GameState.add_gems(1) # small token
        life_granted.emit(player_id)
        return true
    return false
