extends Node

class_name LiveOps

func is_season_active() -> bool:
    return RemoteConfig.get_string("season_active", "0") == "1"

func current_season_name() -> String:
    return RemoteConfig.get_string("season_name", "")

func daily_challenges_enabled() -> bool:
    return true

func challenge_modifier() -> String:
    return RemoteConfig.get_string("challenge_modifier", "")
