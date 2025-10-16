#!/usr/bin/env python3
"""
Monitor GitHub to Unity Cloud sync status
"""

import json
import time
from datetime import datetime

import requests


def monitor_sync_status():
    """Monitor sync status continuously"""
    print("📊 Monitoring GitHub-Unity Cloud sync status...")
    print("Press Ctrl+C to stop")

    try:
        while True:
            try:
                response = requests.get("http://localhost:5001/sync/status")
                if response.status_code == 200:
                    data = response.json()
                    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    print(f"[{timestamp}] Sync Status: {data.get('status', 'unknown')}")
                    print(f"   Total Events: {data.get('total_events', 0)}")
                    print(
                        f"   Unity Project: {data.get('unity_project_id', 'unknown')}"
                    )
                    print(
                        f"   Unity Environment: {data.get('unity_env_id', 'unknown')}"
                    )
                else:
                    print(f"❌ Status check failed: {response.status_code}")
            except Exception as e:
                print(f"❌ Monitoring error: {e}")

            time.sleep(30)  # Check every 30 seconds

    except KeyboardInterrupt:
        print("\n🛑 Monitoring stopped")


if __name__ == "__main__":
    monitor_sync_status()
