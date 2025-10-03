extends Node
class_name Treasure

var active: bool = false
var steps_total: int = 10
var steps_done: int = 0
var reward_per_step: int = 50
var _save_path := "user://treasure.json"

func _ready() -> void:
    active = RemoteConfig.get_int("treasure_active", 0) == 1
    steps_total = RemoteConfig.get_int("treasure_steps", 10)
    reward_per_step = RemoteConfig.get_int("treasure_reward_per_step", 50)
    _load()

func progress(amount: int) -> void:
    if not active:
        return
    steps_done = min(steps_total, steps_done + amount)
    _save()

func can_claim() -> bool:
    return active and steps_done > 0

func claim() -> int:
    if not can_claim():
        return 0
    var reward := steps_done * reward_per_step
    steps_done = 0
    GameState.add_coins(reward)
    _save()
    return reward

func _load() -> void:
    var f := FileAccess.open(_save_path, FileAccess.READ)
    if f:
        var d = JSON.parse_string(f.get_as_text())
        f.close()
        if typeof(d) == TYPE_DICTIONARY:
            steps_done = int(d.get("steps_done", 0))

func _save() -> void:
    var d := {"steps_done": steps_done}
    var f := FileAccess.open(_save_path, FileAccess.WRITE)
    if f:
        f.store_string(JSON.stringify(d))
        f.close()
