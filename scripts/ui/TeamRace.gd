extends Control
class_name TeamRaceUI

@onready var progress_label: Label = $Panel/VBox/Progress
@onready var close_btn: Button = $Panel/VBox/Close

func _ready() -> void:
    _populate()
    close_btn.pressed.connect(func(): queue_free())

func _populate() -> void:
    # Show our weekly points and a mock leaderboard with nearby competitors
    var ours := GameState.weekly_points
    progress_label.text = "This Week: %d" % ours
    # Build a simple leaderboard
    var rivals := [max(0, ours + 200), max(0, ours + 50), max(0, ours - 25), max(0, ours - 120), max(0, ours - 300)]
    var names := ["Falcons", "Owls", "Wolves", "Bears", "Lions"]
    var pairs: Array = []
    for i in range(rivals.size()):
        pairs.append({"name": names[i], "pts": rivals[i]})
    pairs.append({"name": "Your Team", "pts": ours})
    pairs.sort_custom(func(a, b): return int(a["pts"]) > int(b["pts"]))
    # Render under the progress label
    var root := $Panel/VBox
    # Remove old rows beyond Progress/Close
    while root.get_child_count() > 2:
        var c := root.get_child(1) # after Progress
        if c == close_btn:
            break
        c.queue_free()
        await get_tree().process_frame
    for idx in range(min(6, pairs.size())):
        var row := HBoxContainer.new()
        var n := Label.new()
        var pts := Label.new()
        var p := pairs[idx]
        n.text = "%d. %s" % [idx + 1, String(p.get("name", "Team"))]
        pts.text = "%d" % int(p.get("pts", 0))
        row.add_child(n)
        row.add_child(pts)
        root.add_child(row)
