extends Node
class_name Tournament

var active: bool = false
var week_seed: int = 0

func _ready() -> void:
    active = RemoteConfig.get_int("tournament_active", 1) == 1
    week_seed = int(Time.get_unix_time_from_system() / (7 * 86400))

func get_rewards() -> Dictionary:
    return {
        "1": RemoteConfig.get_int("tournament_reward_first", 500),
        "2": RemoteConfig.get_int("tournament_reward_second", 300),
        "3": RemoteConfig.get_int("tournament_reward_third", 200)
    }
