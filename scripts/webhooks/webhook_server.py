#!/usr/bin/env python3
"""
Webhook Server for Unity Cloud Console Integration
Handles real-time updates and automation triggers
"""

from flask import Flask, request, jsonify
import json
import os
import subprocess
from pathlib import Path
import threading
import time

app = Flask(__name__)

class WebhookServer:
    def __init__(self):
        self.repo_root = Path(__file__).parent.parent.parent
        self.webhook_log = self.repo_root / "logs" / "webhook.log"
        self.webhook_log.parent.mkdir(parents=True, exist_ok=True)
        
    def log_webhook(self, event_type, data):
        """Log webhook events"""
        timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
        log_entry = f"[{timestamp}] {event_type}: {json.dumps(data)}\n"
        
        with open(self.webhook_log, 'a') as f:
            f.write(log_entry)
        
        print(f"📝 Webhook logged: {event_type}")

@app.route('/webhook/unity-cloud', methods=['POST'])
def unity_cloud_webhook():
    """Handle Unity Cloud Console webhooks"""
    try:
        data = request.get_json()
        event_type = data.get('event', 'unknown')
        
        webhook_server.log_webhook('unity-cloud', data)
        
        # Process different event types
        if event_type == 'economy_updated':
            handle_economy_update(data)
        elif event_type == 'cloudcode_deployed':
            handle_cloudcode_deployment(data)
        elif event_type == 'remoteconfig_updated':
            handle_remoteconfig_update(data)
        elif event_type == 'analytics_event':
            handle_analytics_event(data)
        else:
            print(f"⚠️ Unknown Unity Cloud event: {event_type}")
        
        return jsonify({"status": "success", "message": "Webhook processed"})
        
    except Exception as e:
        print(f"❌ Unity Cloud webhook error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/webhook/storefront', methods=['POST'])
def storefront_webhook():
    """Handle storefront webhooks"""
    try:
        data = request.get_json()
        event_type = data.get('event', 'unknown')
        
        webhook_server.log_webhook('storefront', data)
        
        # Process different storefront events
        if event_type == 'google_play_updated':
            handle_google_play_update(data)
        elif event_type == 'app_store_updated':
            handle_app_store_update(data)
        elif event_type == 'steam_updated':
            handle_steam_update(data)
        elif event_type == 'itch_updated':
            handle_itch_update(data)
        else:
            print(f"⚠️ Unknown storefront event: {event_type}")
        
        return jsonify({"status": "success", "message": "Webhook processed"})
        
    except Exception as e:
        print(f"❌ Storefront webhook error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/webhook/build', methods=['POST'])
def build_webhook():
    """Handle build webhooks"""
    try:
        data = request.get_json()
        event_type = data.get('event', 'unknown')
        
        webhook_server.log_webhook('build', data)
        
        # Process build events
        if event_type == 'build_completed':
            handle_build_completion(data)
        elif event_type == 'build_failed':
            handle_build_failure(data)
        elif event_type == 'deployment_completed':
            handle_deployment_completion(data)
        else:
            print(f"⚠️ Unknown build event: {event_type}")
        
        return jsonify({"status": "success", "message": "Webhook processed"})
        
    except Exception as e:
        print(f"❌ Build webhook error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

def handle_economy_update(data):
    """Handle economy system updates"""
    print("💰 Processing economy update...")
    
    # Trigger economy sync
    try:
        subprocess.run([
            'python3', 'scripts/unity/setup_unity_economy.py'
        ], cwd=webhook_server.repo_root)
        print("✅ Economy sync completed")
    except Exception as e:
        print(f"❌ Economy sync failed: {e}")

def handle_cloudcode_deployment(data):
    """Handle Cloud Code deployment updates"""
    print("☁️ Processing Cloud Code deployment...")
    
    # Trigger Cloud Code sync
    try:
        subprocess.run([
            'python3', 'scripts/unity/unity_cloud_automation.py'
        ], cwd=webhook_server.repo_root)
        print("✅ Cloud Code sync completed")
    except Exception as e:
        print(f"❌ Cloud Code sync failed: {e}")

def handle_remoteconfig_update(data):
    """Handle Remote Config updates"""
    print("⚙️ Processing Remote Config update...")
    
    # Trigger Remote Config sync
    try:
        subprocess.run([
            'python3', 'scripts/unity/unity_cloud_automation.py'
        ], cwd=webhook_server.repo_root)
        print("✅ Remote Config sync completed")
    except Exception as e:
        print(f"❌ Remote Config sync failed: {e}")

def handle_analytics_event(data):
    """Handle analytics events"""
    print("📊 Processing analytics event...")
    
    # Log analytics event
    analytics_log = webhook_server.repo_root / "logs" / "analytics.log"
    with open(analytics_log, 'a') as f:
        f.write(f"{time.strftime('%Y-%m-%d %H:%M:%S')} - {json.dumps(data)}\n")
    
    print("✅ Analytics event logged")

def handle_google_play_update(data):
    """Handle Google Play Store updates"""
    print("📱 Processing Google Play update...")
    
    # Trigger storefront sync
    try:
        subprocess.run([
            'python3', 'scripts/storefront/storefront_automation.py'
        ], cwd=webhook_server.repo_root)
        print("✅ Google Play sync completed")
    except Exception as e:
        print(f"❌ Google Play sync failed: {e}")

def handle_app_store_update(data):
    """Handle App Store updates"""
    print("🍎 Processing App Store update...")
    
    # Trigger storefront sync
    try:
        subprocess.run([
            'python3', 'scripts/storefront/storefront_automation.py'
        ], cwd=webhook_server.repo_root)
        print("✅ App Store sync completed")
    except Exception as e:
        print(f"❌ App Store sync failed: {e}")

def handle_steam_update(data):
    """Handle Steam updates"""
    print("🎮 Processing Steam update...")
    
    # Trigger storefront sync
    try:
        subprocess.run([
            'python3', 'scripts/storefront/storefront_automation.py'
        ], cwd=webhook_server.repo_root)
        print("✅ Steam sync completed")
    except Exception as e:
        print(f"❌ Steam sync failed: {e}")

def handle_itch_update(data):
    """Handle Itch.io updates"""
    print("🎯 Processing Itch.io update...")
    
    # Trigger storefront sync
    try:
        subprocess.run([
            'python3', 'scripts/storefront/storefront_automation.py'
        ], cwd=webhook_server.repo_root)
        print("✅ Itch.io sync completed")
    except Exception as e:
        print(f"❌ Itch.io sync failed: {e}")

def handle_build_completion(data):
    """Handle build completion events"""
    print("🏗️ Processing build completion...")
    
    # Trigger deployment
    try:
        subprocess.run([
            'python3', 'scripts/storefront/storefront_automation.py'
        ], cwd=webhook_server.repo_root)
        print("✅ Deployment triggered")
    except Exception as e:
        print(f"❌ Deployment trigger failed: {e}")

def handle_build_failure(data):
    """Handle build failure events"""
    print("❌ Processing build failure...")
    
    # Log failure and send notification
    failure_log = webhook_server.repo_root / "logs" / "build_failures.log"
    with open(failure_log, 'a') as f:
        f.write(f"{time.strftime('%Y-%m-%d %H:%M:%S')} - {json.dumps(data)}\n")
    
    print("✅ Build failure logged")

def handle_deployment_completion(data):
    """Handle deployment completion events"""
    print("🚀 Processing deployment completion...")
    
    # Update deployment status
    deployment_log = webhook_server.repo_root / "logs" / "deployments.log"
    with open(deployment_log, 'a') as f:
        f.write(f"{time.strftime('%Y-%m-%d %H:%M:%S')} - {json.dumps(data)}\n")
    
    print("✅ Deployment completion logged")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": time.strftime('%Y-%m-%d %H:%M:%S'),
        "webhook_log_size": webhook_server.webhook_log.stat().st_size if webhook_server.webhook_log.exists() else 0
    })

@app.route('/webhooks', methods=['GET'])
def list_webhooks():
    """List recent webhook events"""
    try:
        if webhook_server.webhook_log.exists():
            with open(webhook_server.webhook_log, 'r') as f:
                lines = f.readlines()
                recent_events = lines[-10:]  # Last 10 events
                return jsonify({
                    "recent_events": [line.strip() for line in recent_events],
                    "total_events": len(lines)
                })
        else:
            return jsonify({"recent_events": [], "total_events": 0})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def start_webhook_server():
    """Start the webhook server"""
    print("🚀 Starting Webhook Server...")
    print("📡 Listening for webhooks on port 5000")
    print("🔗 Available endpoints:")
    print("   POST /webhook/unity-cloud - Unity Cloud Console events")
    print("   POST /webhook/storefront - Storefront events")
    print("   POST /webhook/build - Build events")
    print("   GET /health - Health check")
    print("   GET /webhooks - List recent events")
    
    app.run(host='0.0.0.0', port=5000, debug=False)

if __name__ == "__main__":
    webhook_server = WebhookServer()
    start_webhook_server()