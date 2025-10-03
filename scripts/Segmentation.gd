extends Node
class_name Segmentation

func payer_state() -> String:
    return "payer" if GameState.ever_purchased else "nonpayer"

func skill_tier() -> String:
    var streak := GameState.best_win_streak
    if streak >= 10:
        return "expert"
    if streak >= 4:
        return "intermediate"
    return "newbie"

func ad_engagement() -> String:
    var thr := RemoteConfig.get_int("rv_engaged_threshold_today", 3)
    var seen := 0
    if Analytics.has_method("rewarded_watched_today"):
        seen = Analytics.rewarded_watched_today()
    return "engaged" if seen >= thr else "casual"

func region() -> String:
    return Geo.region_code

func best_value_sku() -> String:
    var base := RemoteConfig.get_string("best_value_sku", "gems_huge")
    if payer_state() == "nonpayer" and skill_tier() == "newbie":
        return "starter_pack_small"
    if region() in ["IN","BR","ID","PH","VN"]:
        return "gems_medium"
    return base

func most_popular_sku() -> String:
    var base := RemoteConfig.get_string("most_popular_sku", "gems_medium")
    if payer_state() == "nonpayer" and ad_engagement() == "engaged":
        return "coins_medium"
    return base

func fetch_and_apply_overrides() -> void:
    if not Engine.has_singleton("Backend"):
        return
    var profile := {
        "payer": payer_state(),
        "skill": skill_tier(),
        "ad": ad_engagement(),
        "region": region()
    }
    var segs := await Backend.get_segments(profile)
    for k in segs.keys():
        RemoteConfig.set_override(String(k), segs[k])
