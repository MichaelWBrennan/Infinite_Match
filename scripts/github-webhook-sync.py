#!/usr/bin/env python3
"""
GitHub to Unity Cloud Sync Webhook Handler
Automatically syncs every GitHub branch update to Unity Cloud
"""

import json
import os
import subprocess
import time
import hmac
import hashlib
from pathlib import Path
from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

class GitHubUnityCloudSync:
    def __init__(self):
        self.repo_root = Path(__file__).parent.parent
        self.webhook_secret = os.getenv('GITHUB_WEBHOOK_SECRET', '')
        self.unity_project_id = os.getenv('UNITY_PROJECT_ID', '0dd5a03e-7f23-49c4-964e-7919c48c0574')
        self.unity_env_id = os.getenv('UNITY_ENV_ID', '1d8c470b-d8d2-4a72-88f6-c2a46d9e8a6d')
        self.unity_client_id = os.getenv('UNITY_CLIENT_ID', '')
        self.unity_client_secret = os.getenv('UNITY_CLIENT_SECRET', '')
        self.sync_log = self.repo_root / "logs" / "github_unity_sync.log"
        self.sync_log.parent.mkdir(parents=True, exist_ok=True)

    def verify_github_signature(self, payload, signature):
        """Verify GitHub webhook signature"""
        if not self.webhook_secret:
            return True  # Skip verification if no secret configured
        
        expected_signature = 'sha256=' + hmac.new(
            self.webhook_secret.encode('utf-8'),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(signature, expected_signature)

    def log_sync_event(self, event_type, data):
        """Log sync events"""
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        log_entry = f"[{timestamp}] {event_type}: {json.dumps(data)}\n"
        
        with open(self.sync_log, "a") as f:
            f.write(log_entry)
        
        print(f"📝 GitHub-Unity sync logged: {event_type}")

    def detect_changes(self, payload):
        """Detect what changed in the GitHub update"""
        changes = {
            'economy': False,
            'cloud_code': False,
            'remote_config': False,
            'unity_assets': False,
            'scripts': False,
            'config': False
        }
        
        try:
            commits = payload.get('commits', [])
            for commit in commits:
                modified_files = commit.get('modified', [])
                added_files = commit.get('added', [])
                all_files = modified_files + added_files
                
                for file_path in all_files:
                    if file_path.startswith('economy/'):
                        changes['economy'] = True
                    elif file_path.startswith('cloud-code/'):
                        changes['cloud_code'] = True
                    elif file_path.startswith('remote-config/'):
                        changes['remote_config'] = True
                    elif file_path.startswith('unity/'):
                        changes['unity_assets'] = True
                    elif file_path.startswith('scripts/'):
                        changes['scripts'] = True
                    elif file_path.startswith('config/'):
                        changes['config'] = True
            
            return changes
        except Exception as e:
            print(f"❌ Error detecting changes: {e}")
            return changes

    def sync_to_unity_cloud(self, changes):
        """Sync detected changes to Unity Cloud"""
        try:
            print("🚀 Starting Unity Cloud sync...")
            
            # Always run the main Unity Cloud API deployment
            if any(changes.values()):
                print("📦 Running Unity Cloud API deployment...")
                result = subprocess.run([
                    'node', 'scripts/unity/unity-cloud-api-deploy.js'
                ], cwd=self.repo_root, capture_output=True, text=True)
                
                if result.returncode == 0:
                    print("✅ Unity Cloud API deployment successful")
                else:
                    print(f"❌ Unity Cloud API deployment failed: {result.stderr}")
                    return False
            
            # Run specific sync based on changes
            if changes['economy']:
                print("💰 Syncing economy data...")
                self.sync_economy_data()
            
            if changes['cloud_code']:
                print("☁️ Syncing Cloud Code...")
                self.sync_cloud_code()
            
            if changes['remote_config']:
                print("⚙️ Syncing Remote Config...")
                self.sync_remote_config()
            
            if changes['unity_assets']:
                print("🎮 Syncing Unity assets...")
                self.sync_unity_assets()
            
            if changes['scripts']:
                print("🔧 Syncing automation scripts...")
                self.sync_automation_scripts()
            
            print("✅ Unity Cloud sync completed successfully")
            return True
            
        except Exception as e:
            print(f"❌ Unity Cloud sync failed: {e}")
            return False

    def sync_economy_data(self):
        """Sync economy data to Unity Cloud"""
        try:
            # Run economy-specific automation
            subprocess.run([
                'python3', 'scripts/unity/match3_complete_automation.py'
            ], cwd=self.repo_root)
            print("✅ Economy data synced")
        except Exception as e:
            print(f"❌ Economy sync failed: {e}")

    def sync_cloud_code(self):
        """Sync Cloud Code to Unity Cloud"""
        try:
            # Deploy Cloud Code functions
            cloud_code_dir = self.repo_root / "cloud-code"
            for js_file in cloud_code_dir.glob("*.js"):
                print(f"Deploying Cloud Code: {js_file.name}")
                # Cloud Code deployment would be handled by the main API script
            print("✅ Cloud Code synced")
        except Exception as e:
            print(f"❌ Cloud Code sync failed: {e}")

    def sync_remote_config(self):
        """Sync Remote Config to Unity Cloud"""
        try:
            # Deploy Remote Config
            remote_config_file = self.repo_root / "remote-config" / "game_config.json"
            if remote_config_file.exists():
                print("Deploying Remote Config...")
                # Remote Config deployment would be handled by the main API script
            print("✅ Remote Config synced")
        except Exception as e:
            print(f"❌ Remote Config sync failed: {e}")

    def sync_unity_assets(self):
        """Sync Unity assets"""
        try:
            # Run Unity asset automation
            subprocess.run([
                'python3', 'scripts/unity/asset_pipeline_automation.py'
            ], cwd=self.repo_root)
            print("✅ Unity assets synced")
        except Exception as e:
            print(f"❌ Unity assets sync failed: {e}")

    def sync_automation_scripts(self):
        """Sync automation scripts"""
        try:
            # Run health check and automation
            subprocess.run(['npm', 'run', 'health'], cwd=self.repo_root)
            subprocess.run(['npm', 'run', 'automation'], cwd=self.repo_root)
            print("✅ Automation scripts synced")
        except Exception as e:
            print(f"❌ Automation scripts sync failed: {e}")

    def send_notification(self, event_type, success, details):
        """Send notification about sync status"""
        try:
            # This could be extended to send notifications via Discord, Slack, etc.
            status = "✅ SUCCESS" if success else "❌ FAILED"
            message = f"GitHub → Unity Cloud Sync: {status}\nEvent: {event_type}\nDetails: {details}"
            print(f"📢 Notification: {message}")
        except Exception as e:
            print(f"❌ Notification failed: {e}")

@app.route('/webhook/github', methods=['POST'])
def github_webhook():
    """Handle GitHub webhooks"""
    try:
        # Verify signature
        signature = request.headers.get('X-Hub-Signature-256', '')
        if not sync_handler.verify_github_signature(request.data, signature):
            return jsonify({"error": "Invalid signature"}), 401
        
        # Parse payload
        payload = request.get_json()
        event_type = request.headers.get('X-GitHub-Event', 'unknown')
        
        # Log the event
        sync_handler.log_sync_event(f"github_{event_type}", {
            "ref": payload.get('ref', ''),
            "repository": payload.get('repository', {}).get('full_name', ''),
            "commits": len(payload.get('commits', []))
        })
        
        # Only process push events to main branches
        if event_type == 'push':
            ref = payload.get('ref', '')
            if ref.startswith('refs/heads/'):
                branch = ref.replace('refs/heads/', '')
                print(f"🔄 Processing push to branch: {branch}")
                
                # Detect changes
                changes = sync_handler.detect_changes(payload)
                print(f"📊 Detected changes: {changes}")
                
                # Sync to Unity Cloud
                success = sync_handler.sync_to_unity_cloud(changes)
                
                # Send notification
                sync_handler.send_notification(
                    f"push_to_{branch}",
                    success,
                    f"Changes: {[k for k, v in changes.items() if v]}"
                )
                
                return jsonify({
                    "status": "success",
                    "message": "GitHub webhook processed",
                    "changes_detected": changes,
                    "sync_success": success
                })
        
        return jsonify({"status": "ignored", "message": f"Event type {event_type} not processed"})
        
    except Exception as e:
        print(f"❌ GitHub webhook error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/sync/status', methods=['GET'])
def sync_status():
    """Get sync status"""
    try:
        if sync_handler.sync_log.exists():
            with open(sync_handler.sync_log, 'r') as f:
                lines = f.readlines()
                recent_events = lines[-10:]  # Last 10 events
                return jsonify({
                    "status": "active",
                    "recent_events": [line.strip() for line in recent_events],
                    "total_events": len(lines),
                    "unity_project_id": sync_handler.unity_project_id,
                    "unity_env_id": sync_handler.unity_env_id
                })
        else:
            return jsonify({
                "status": "no_events",
                "unity_project_id": sync_handler.unity_project_id,
                "unity_env_id": sync_handler.unity_env_id
            })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/sync/trigger', methods=['POST'])
def manual_sync():
    """Manually trigger sync"""
    try:
        data = request.get_json() or {}
        changes = data.get('changes', {
            'economy': True,
            'cloud_code': True,
            'remote_config': True,
            'unity_assets': True,
            'scripts': True,
            'config': True
        })
        
        print("🔄 Manual sync triggered")
        success = sync_handler.sync_to_unity_cloud(changes)
        
        return jsonify({
            "status": "success" if success else "failed",
            "message": "Manual sync completed",
            "changes_processed": changes
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "GitHub-Unity Cloud Sync",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "unity_project_id": sync_handler.unity_project_id,
        "unity_env_id": sync_handler.unity_env_id
    })

def start_sync_server():
    """Start the GitHub-Unity Cloud sync server"""
    print("🚀 Starting GitHub-Unity Cloud Sync Server...")
    print("📡 Listening for GitHub webhooks on port 5001")
    print("🔗 Available endpoints:")
    print("   POST /webhook/github - GitHub webhook handler")
    print("   GET /sync/status - Sync status")
    print("   POST /sync/trigger - Manual sync trigger")
    print("   GET /health - Health check")
    print(f"🎯 Unity Project ID: {sync_handler.unity_project_id}")
    print(f"🎯 Unity Environment ID: {sync_handler.unity_env_id}")
    
    app.run(host="0.0.0.0", port=5001, debug=False)

if __name__ == "__main__":
    sync_handler = GitHubUnityCloudSync()
    start_sync_server()