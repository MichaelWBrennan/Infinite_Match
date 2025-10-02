extends Node

# This node demonstrates calls routed through the native ByteBrew plugin via autoloaded ByteBrewEntry.
# Methods are no-ops on desktop but active on mobile when the plugin is available.

class_name ByteBrewBridge

static func has_plugin() -> bool:
    return Engine.has_singleton("ByteBrew")

static func load_remote_configs(callback: Callable) -> void:
    if has_plugin():
        # The native plugin uses ByteBrewEntry callbacks
        if Engine.has_singleton("ByteBrew"):
            ByteBrewEntry.on_finish_loading_configs = callback
            # Attempt call into native to load
            var bb = Engine.get_singleton("ByteBrew")
            if bb and bb.has_method("LoadRemoteConfigs"):
                bb.LoadRemoteConfigs()
            # Native will trigger _finish_loading_remote_configs
    else:
        callback.call(true)

static func track_ad(placement_type: String, location: String, ad_id: String = "", provider: String = "", revenue: float = 0.0) -> void:
    if has_plugin():
        var bb = Engine.get_singleton("ByteBrew")
        if not bb:
            return
        # Prefer revenue-enabled call when provided
        if revenue > 0.0 and provider != "":
            if bb.has_method("NewTrackedAdEvent"):
                # (placementType, adProvider, adUnitName, adLocation, revenue)
                bb.NewTrackedAdEvent(placement_type, provider, ad_id, location, revenue)
                return
        # Fallback to simple call (placementType, adLocation)
        if bb.has_method("NewTrackedAdEvent"):
            bb.NewTrackedAdEvent(placement_type, location)

static func track_purchase(store: String, currency: String, amount: float, item_id: String, category: String) -> void:
    if has_plugin():
        var bb = Engine.get_singleton("ByteBrew")
        if not bb:
            return
        # Try generic purchase event
        if bb.has_method("AddTrackedInAppPurchaseEvent"):
            bb.AddTrackedInAppPurchaseEvent(store, currency, amount, item_id, category)
