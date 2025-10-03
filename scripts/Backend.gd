extends Node
class_name Backend

func base_url() -> String:
    return RemoteConfig.get_string("backend_base_url", "")

func verify_receipt(sku: String, order_id: String, platform: String, device_id: String, locale: String, app_version: String) -> bool:
    var url := base_url() + "/verify_receipt"
    if base_url() == "":
        return true
    var payload := {
        "sku": sku,
        "order_id": order_id,
        "platform": platform,
        "device_id": device_id,
        "locale": locale,
        "version": app_version
    }
    var resp := await _post_json(url, payload)
    if not bool(resp.get("ok", false)):
        return false
    var body := String(resp.get("body", ""))
    var parsed = JSON.parse_string(body)
    if typeof(parsed) == TYPE_DICTIONARY:
        return bool(parsed.get("valid", false))
    return false

func get_segments(profile: Dictionary) -> Dictionary:
    var url := base_url() + "/segments"
    if base_url() == "":
        return {}
    var resp := await _post_json(url, profile)
    if not bool(resp.get("ok", false)):
        return {}
    var body := String(resp.get("body", ""))
    var parsed = JSON.parse_string(body)
    if typeof(parsed) == TYPE_DICTIONARY:
        return parsed
    return {}

func schedule_push(event: String, context: String) -> void:
    var url := base_url() + "/push"
    if base_url() == "":
        return
    await _post_json(url, {"event": event, "context": context})

func log_event(name: String, payload: Dictionary = {}) -> void:
    var url := base_url() + "/log"
    if base_url() == "":
        return
    await _post_json(url, {"name": name, "payload": payload})

func _post_json(url: String, payload: Dictionary) -> Dictionary:
    var req := HTTPRequest.new()
    add_child(req)
    var headers := ["Content-Type: application/json"]
    var body := JSON.stringify(payload)
    var err := req.request(url, headers, HTTPClient.METHOD_POST, body)
    if err != OK:
        return {"ok": false, "status": 0, "body": ""}
    var result = await req.request_completed
    var code := int(result[1])
    var raw: PackedByteArray = result[3]
    var text := raw.get_string_from_utf8()
    return {"ok": (code >= 200 and code < 300), "status": code, "body": text}
