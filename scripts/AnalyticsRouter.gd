extends Node
class_name AnalyticsRouter

# Fans out Analytics events to available adapters (ByteBrew, Firebase, GA)

func custom_event(name: String, value: Variant = null) -> void:
    if Engine.has_singleton("ByteBrewBridge"):
        ByteBrewBridge.custom_event(name, value)
    if Engine.has_singleton("AnalyticsFirebase"):
        AnalyticsFirebase.log_event(name, {"value": value})
    if Engine.has_singleton("AnalyticsGameAnalytics"):
        AnalyticsGameAnalytics.new_design_event(name)
