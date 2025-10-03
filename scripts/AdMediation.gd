extends Node
class_name AdMediation

var _ecpm_by_placement: Dictionary = {} # placement -> moving avg ecpm USD
var _alpha := 0.3 # smoothing factor

func _ready() -> void:
    _ecpm_by_placement.clear()

func record_ilrd(placement_type: String, location: String, provider: String, ad_unit: String, revenue: float) -> void:
    var key := placement_type + ":" + location
    var prev := float(_ecpm_by_placement.get(key, 0.0))
    var new_val := prev * (1.0 - _alpha) + revenue * _alpha
    _ecpm_by_placement[key] = new_val
    Analytics.custom_event("ilrd_" + placement_type, new_val)

func get_floor_cpm(placement_type: String) -> float:
    var r := Geo.region_code
    var key := (placement_type == "Reward" ? "floor_rewarded_usd_" : "floor_interstitial_usd_") + r
    var def := placement_type == "Reward" ? RemoteConfig.get_float("floor_rewarded_usd", 0.0) : RemoteConfig.get_float("floor_interstitial_usd", 0.0)
    var specific := RemoteConfig.get_float(key, -1.0)
    return def if specific < 0.0 else specific

func get_avg_ecpm(placement_type: String, location: String) -> float:
    return float(_ecpm_by_placement.get(placement_type + ":" + location, 0.0))
