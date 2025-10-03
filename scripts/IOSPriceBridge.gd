extends Node

class_name IOSPriceBridge

# Placeholder shim until native Obj-C bridge is added.
# Returns RemoteConfig price_ios_<sku> if present, else empty.

func getPriceString(sku: String) -> String:
    var key := "price_ios_" + sku
    var rc := RemoteConfig.get_string(key, "")
    return rc
