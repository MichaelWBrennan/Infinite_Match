#!/usr/bin/env python3
"""
Health Check Script
Monitors the health of the automated systems and alerts on issues
"""

import json
import os
import subprocess
from datetime import datetime, timedelta
from pathlib import Path

class HealthChecker:
    def __init__(self):
        self.repo_root = Path(__file__).parent.parent
        self.health_status = {
            "timestamp": datetime.now().isoformat(),
            "overall_health": "healthy",
            "checks": {}
        }
    
    def check_economy_data(self):
        """Check economy data health"""
        print("Checking economy data...")
        
        csv_path = self.repo_root / "unity" / "Assets" / "StreamingAssets" / "economy_items.csv"
        json_path = self.repo_root / "unity" / "Assets" / "StreamingAssets" / "economy_data.json"
        
        status = {
            "csv_exists": csv_path.exists(),
            "json_exists": json_path.exists(),
            "csv_valid": False,
            "json_valid": False,
            "item_count": 0
        }
        
        if csv_path.exists():
            try:
                import csv
                with open(csv_path, 'r') as f:
                    reader = csv.DictReader(f)
                    items = list(reader)
                    status["item_count"] = len(items)
                    status["csv_valid"] = len(items) > 0
            except Exception as e:
                status["csv_error"] = str(e)
        
        if json_path.exists():
            try:
                with open(json_path, 'r') as f:
                    data = json.load(f)
                    status["json_valid"] = "items" in data
            except Exception as e:
                status["json_error"] = str(e)
        
        self.health_status["checks"]["economy_data"] = status
        return status["csv_valid"] and status["json_valid"]
    
    def check_unity_services_config(self):
        """Check Unity Services configuration"""
        print("Checking Unity Services configuration...")
        
        config_path = self.repo_root / "unity" / "Assets" / "StreamingAssets" / "unity_services_config.json"
        
        status = {
            "config_exists": config_path.exists(),
            "config_valid": False,
            "project_id_configured": False,
            "environment_id_configured": False
        }
        
        if config_path.exists():
            try:
                with open(config_path, 'r') as f:
                    config = json.load(f)
                    status["config_valid"] = True
                    status["project_id_configured"] = bool(config.get("projectId"))
                    status["environment_id_configured"] = bool(config.get("environmentId"))
            except Exception as e:
                status["config_error"] = str(e)
        
        self.health_status["checks"]["unity_services"] = status
        return status["config_valid"] and status["project_id_configured"]
    
    def check_github_workflows(self):
        """Check GitHub workflows health"""
        print("Checking GitHub workflows...")
        
        workflows_dir = self.repo_root / ".github" / "workflows"
        
        status = {
            "workflows_exist": workflows_dir.exists(),
            "workflow_count": 0,
            "recent_failures": 0
        }
        
        if workflows_dir.exists():
            workflow_files = list(workflows_dir.glob("*.yml")) + list(workflows_dir.glob("*.yaml"))
            status["workflow_count"] = len(workflow_files)
            
            # Check for essential workflows
            essential_workflows = ["unity-cloud-build.yml", "daily-maintenance.yml"]
            for workflow in essential_workflows:
                if not (workflows_dir / workflow).exists():
                    status[f"missing_{workflow}"] = True
        
        self.health_status["checks"]["github_workflows"] = status
        return status["workflow_count"] > 0
    
    def check_scripts_health(self):
        """Check automation scripts health"""
        print("Checking automation scripts...")
        
        scripts_dir = self.repo_root / "scripts"
        
        status = {
            "scripts_exist": scripts_dir.exists(),
            "script_count": 0,
            "executable_scripts": 0
        }
        
        if scripts_dir.exists():
            script_files = list(scripts_dir.glob("*.py"))
            status["script_count"] = len(script_files)
            
            # Check if scripts are executable
            for script in script_files:
                if os.access(script, os.X_OK):
                    status["executable_scripts"] += 1
        
        self.health_status["checks"]["scripts"] = status
        return status["script_count"] > 0
    
    def check_dependencies(self):
        """Check system dependencies"""
        print("Checking system dependencies...")
        
        status = {
            "python_available": False,
            "node_available": False,
            "git_available": False,
            "unity_available": False
        }
        
        # Check Python
        try:
            result = subprocess.run(["python3", "--version"], capture_output=True, text=True)
            status["python_available"] = result.returncode == 0
        except:
            pass
        
        # Check Node.js
        try:
            result = subprocess.run(["node", "--version"], capture_output=True, text=True)
            status["node_available"] = result.returncode == 0
        except:
            pass
        
        # Check Git
        try:
            result = subprocess.run(["git", "--version"], capture_output=True, text=True)
            status["git_available"] = result.returncode == 0
        except:
            pass
        
        # Check Unity (simplified)
        status["unity_available"] = True  # Assume available in CI
        
        self.health_status["checks"]["dependencies"] = status
        return all([status["python_available"], status["git_available"]])
    
    def check_recent_activity(self):
        """Check recent activity and builds"""
        print("Checking recent activity...")
        
        status = {
            "recent_commits": 0,
            "recent_builds": 0,
            "last_activity": None
        }
        
        try:
            # Check recent commits
            result = subprocess.run(
                ["git", "log", "--since=7 days ago", "--oneline"],
                capture_output=True, text=True, cwd=self.repo_root
            )
            if result.returncode == 0:
                status["recent_commits"] = len(result.stdout.strip().split('\n'))
        except:
            pass
        
        # Check for recent build artifacts
        artifacts_dir = self.repo_root / "artifacts"
        if artifacts_dir.exists():
            recent_artifacts = [
                f for f in artifacts_dir.iterdir()
                if f.is_file() and (datetime.now() - datetime.fromtimestamp(f.stat().st_mtime)).days < 7
            ]
            status["recent_builds"] = len(recent_artifacts)
        
        self.health_status["checks"]["activity"] = status
        return status["recent_commits"] > 0 or status["recent_builds"] > 0
    
    def calculate_overall_health(self):
        """Calculate overall system health"""
        checks = self.health_status["checks"]
        
        # Weight different checks
        weights = {
            "economy_data": 0.25,
            "unity_services": 0.20,
            "github_workflows": 0.20,
            "scripts": 0.15,
            "dependencies": 0.15,
            "activity": 0.05
        }
        
        health_score = 0
        total_weight = 0
        
        for check_name, weight in weights.items():
            if check_name in checks:
                check_status = checks[check_name]
                
                # Calculate individual check score
                if check_name == "economy_data":
                    score = 1 if check_status.get("csv_valid", False) and check_status.get("json_valid", False) else 0
                elif check_name == "unity_services":
                    score = 1 if check_status.get("config_valid", False) and check_status.get("project_id_configured", False) else 0
                elif check_name == "github_workflows":
                    score = 1 if check_status.get("workflow_count", 0) > 0 else 0
                elif check_name == "scripts":
                    score = 1 if check_status.get("script_count", 0) > 0 else 0
                elif check_name == "dependencies":
                    score = 1 if check_status.get("python_available", False) and check_status.get("git_available", False) else 0
                elif check_name == "activity":
                    score = 1 if check_status.get("recent_commits", 0) > 0 or check_status.get("recent_builds", 0) > 0 else 0
                else:
                    score = 0
                
                health_score += score * weight
                total_weight += weight
        
        if total_weight > 0:
            health_score = health_score / total_weight
        
        # Determine overall health
        if health_score >= 0.9:
            self.health_status["overall_health"] = "excellent"
        elif health_score >= 0.7:
            self.health_status["overall_health"] = "healthy"
        elif health_score >= 0.5:
            self.health_status["overall_health"] = "warning"
        else:
            self.health_status["overall_health"] = "critical"
        
        self.health_status["health_score"] = health_score
        return health_score
    
    def generate_health_report(self):
        """Generate comprehensive health report"""
        print("Generating health report...")
        
        # Run all health checks
        self.check_economy_data()
        self.check_unity_services_config()
        self.check_github_workflows()
        self.check_scripts_health()
        self.check_dependencies()
        self.check_recent_activity()
        
        # Calculate overall health
        health_score = self.calculate_overall_health()
        
        # Add recommendations
        recommendations = []
        
        if not self.health_status["checks"].get("economy_data", {}).get("csv_valid", False):
            recommendations.append("Fix economy CSV data - check format and content")
        
        if not self.health_status["checks"].get("unity_services", {}).get("project_id_configured", False):
            recommendations.append("Configure Unity Services - update project ID and environment ID")
        
        if self.health_status["checks"].get("scripts", {}).get("script_count", 0) == 0:
            recommendations.append("Add automation scripts to maintain system health")
        
        if self.health_status["checks"].get("activity", {}).get("recent_commits", 0) == 0:
            recommendations.append("No recent activity - consider running maintenance tasks")
        
        self.health_status["recommendations"] = recommendations
        
        # Save health report
        reports_dir = self.repo_root / "reports"
        reports_dir.mkdir(exist_ok=True)
        
        report_path = reports_dir / f"health_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_path, 'w') as f:
            json.dump(self.health_status, f, indent=2)
        
        print(f"Health report saved: {report_path}")
        return self.health_status
    
    def run_health_check(self):
        """Run complete health check"""
        print("Starting health check...")
        
        report = self.generate_health_report()
        
        print(f"\nHealth Check Results:")
        print(f"Overall Health: {report['overall_health'].upper()}")
        print(f"Health Score: {report.get('health_score', 0):.2f}")
        
        if report.get("recommendations"):
            print(f"\nRecommendations:")
            for i, rec in enumerate(report["recommendations"], 1):
                print(f"  {i}. {rec}")
        
        return report["overall_health"] in ["excellent", "healthy"]

def main():
    checker = HealthChecker()
    is_healthy = checker.run_health_check()
    
    if not is_healthy:
        print("\n⚠️  System health issues detected!")
        return 1
    else:
        print("\n✅ System is healthy!")
        return 0

if __name__ == "__main__":
    exit(main())