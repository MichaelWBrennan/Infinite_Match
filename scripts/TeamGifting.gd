extends Node
class_name TeamGifting

signal gift_sent(to: String, amount: int)

func send_energy(to_player_id: String, amount: int = 1) -> bool:
    # Stub: locally grant to self for demo; backend would route
    GameState.add_gems(0) # noop placeholder to keep side effects minimal
    gift_sent.emit(to_player_id, amount)
    Analytics.custom_event("team_gift_energy", amount)
    return true
