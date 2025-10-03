extends Node
class_name BulkLevels

const LevelGenerator := preload("res://scripts/match3/LevelGenerator.gd")
const Solver := preload("res://scripts/match3/Solver.gd")

func generate_and_tag(start_id: int, count: int, size: Vector2i = Vector2i(8,8), colors: int = 5) -> void:
    for i in range(count):
        var id := start_id + i
        var seed := int(hash([id, Time.get_unix_time_from_system()])) & 0x7fffffff
        var board := LevelGenerator.generate(size, colors, seed)
        var diff := Solver.estimate_difficulty(board, 20, 10)
        var path := "res://config/levels/level_%d.json" % id
        var data := {
            "size": [size.x, size.y],
            "num_colors": colors,
            "move_limit": 20,
            "difficulty": diff,
            "goals": [{"type":"collect_color","color":0,"amount":50}]
        }
        var f := FileAccess.open(path, FileAccess.WRITE)
        if f:
            f.store_string(JSON.stringify(data))
            f.close()
