extends Node

class_name Social

func open_leaderboard() -> void:
    ByteBrewBridge.custom_event("leaderboard_open")

func submit_score(score: int) -> void:
    ByteBrewBridge.custom_event("leaderboard_submit", score)

func share(text: String, url: String = "") -> void:
    ByteBrewBridge.custom_event("share_triggered")
    var content := text
    if url != "":
        content += "\n" + url
    OS.set_clipboard(content)

func get_referral_code() -> String:
    var code := str("EVR-", int(Time.get_unix_time_from_system()) % 1000000)
    ByteBrewBridge.custom_event("referral_code_generated", code)
    return code
