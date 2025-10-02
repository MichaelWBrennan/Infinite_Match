extends Node
class_name EventScheduler

# Simple date-based theme selection. Can be overridden by RemoteConfig.

func get_current_theme_name() -> String:
	var now := Time.get_datetime_dict_from_system()
	var month := int(now["month"])
	var day := int(now["day"])
	# Halloween: Oct 15 - Nov 2
	if (month == 10 and day >= 15) or (month == 11 and day <= 2):
		return "halloween"
	# Christmas/Winter: Dec 1 - Jan 5
	if (month == 12 and day >= 1) or (month == 1 and day <= 5):
		return "christmas"
	# Valentine's: Feb 7 - Feb 15
	if (month == 2 and day >= 7 and day <= 15):
		return "valentines"
	# St. Patrick's: Mar 15 - Mar 21
	if (month == 3 and day >= 15 and day <= 21):
		return "st_patrick"
	return "default"
