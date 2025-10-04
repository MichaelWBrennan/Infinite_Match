extends Node
class_name TeamChat

signal message_received(msg: Dictionary)

var messages: Array = []

func send_message(text: String) -> void:
    var msg := {"from": OS.get_unique_id().substr(0,6), "text": text, "ts": Time.get_unix_time_from_system()}
    messages.append(msg)
    message_received.emit(msg)
    Analytics.custom_event("team_chat", text)

func list_messages() -> Array:
    return messages
