extends Node

class_name Notifications

func schedule_lapsed_return(days: int) -> void:
    # Placeholder hook: integrate native notifications per platform
    ByteBrewBridge.custom_event("notif_schedule_lapsed_days", days)

func schedule_event_reminder(name: String, in_seconds: int) -> void:
    ByteBrewBridge.custom_event("notif_schedule_event", name + ":" + str(in_seconds))
