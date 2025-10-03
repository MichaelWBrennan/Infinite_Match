extends Node
class_name Bingo

var active: bool = false
var size: int = 5
var goals: Array = []
var _save_path := "user://bingo.json"

func _ready() -> void:
    active = RemoteConfig.get_int("bingo_active", 0) == 1
    if active:
        _load()
        if goals.is_empty():
            _generate_board()

func _generate_board() -> void:
    goals.clear()
    for y in range(size):
        var row := []
        for x in range(size):
            row.append({"kind":"clear_tiles","target":50})
        goals.append(row)
    _save()

func progress(kind: String, amount: int) -> void:
    if not active:
        return
    for y in range(size):
        for x in range(size):
            var g: Dictionary = goals[y][x]
            if String(g.get("kind","")) == kind:
                g["progress"] = int(g.get("progress",0)) + amount
                goals[y][x] = g
    _save()

func completed_lines() -> int:
    var lines := 0
    # Rows
    for y in range(size):
        var ok := true
        for x in range(size):
            var g: Dictionary = goals[y][x]
            if int(g.get("progress",0)) < int(g.get("target",0)):
                ok = false
                break
        if ok: lines += 1
    # Cols
    for x in range(size):
        var ok2 := true
        for y in range(size):
            var g2: Dictionary = goals[y][x]
            if int(g2.get("progress",0)) < int(g2.get("target",0)):
                ok2 = false
                break
        if ok2: lines += 1
    return lines

func claim_rewards() -> int:
    var lines := completed_lines()
    var reward := lines * RemoteConfig.get_int("bingo_reward_per_line", 100)
    if reward > 0:
        GameState.add_coins(reward)
    return reward

func _load() -> void:
    var f := FileAccess.open(_save_path, FileAccess.READ)
    if f:
        var d = JSON.parse_string(f.get_as_text())
        f.close()
        if typeof(d) == TYPE_DICTIONARY:
            goals = d.get("goals", [])

func _save() -> void:
    var d := {"goals": goals}
    var f := FileAccess.open(_save_path, FileAccess.WRITE)
    if f:
        f.store_string(JSON.stringify(d))
        f.close()
