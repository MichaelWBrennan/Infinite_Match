#!/usr/bin/env python3
"""
Comprehensive Redundancy Cleanup Script
Identifies and removes redundant files across the entire repository
"""

import os
import shutil
from pathlib import Path
import hashlib
import json
from datetime import datetime

class RedundancyCleanup:
    def __init__(self):
        self.repo_root = Path(".")
        self.backup_dir = Path("redundancy_cleanup_backup")
        self.cleanup_log = []
        
    def log_action(self, action, file_path, reason=""):
        """Log cleanup actions"""
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "action": action,
            "file": str(file_path),
            "reason": reason
        }
        self.cleanup_log.append(log_entry)
        print(f"{action.upper()}: {file_path} - {reason}")

    def create_backup(self, file_path):
        """Create backup before deletion"""
        if not self.backup_dir.exists():
            self.backup_dir.mkdir(parents=True)
        
        backup_path = self.backup_dir / file_path
        backup_path.parent.mkdir(parents=True, exist_ok=True)
        
        if file_path.exists():
            shutil.copy2(file_path, backup_path)
            return backup_path
        return None

    def remove_duplicate_cloud_code(self):
        """Remove duplicate Cloud Code files"""
        print("\n=== CLEANING DUPLICATE CLOUD CODE FILES ===")
        
        # Keep the ones in cloud-code/ directory, remove from unity/Assets/CloudCode/
        cloud_code_dir = Path("cloud-code")
        unity_cloud_code_dir = Path("unity/Assets/CloudCode")
        
        if cloud_code_dir.exists() and unity_cloud_code_dir.exists():
            for file in unity_cloud_code_dir.glob("*.js"):
                if (cloud_code_dir / file.name).exists():
                    backup = self.create_backup(file)
                    file.unlink()
                    self.log_action("REMOVED", file, f"Duplicate of {cloud_code_dir / file.name}")

    def remove_redundant_unity_scripts(self):
        """Remove redundant Unity automation scripts"""
        print("\n=== CLEANING REDUNDANT UNITY SCRIPTS ===")
        
        # Keep the main ones, remove redundant ones
        redundant_patterns = [
            "scripts/unity/unity_mock_api.py",
            "scripts/unity/unity_webhook_automation.py", 
            "scripts/unity/unity_ai_automation.py",
            "scripts/unity/unity_automation_main.py",
            "scripts/unity/unity_cli_automation_working.sh",
            "scripts/run_headless_unity_cloud.sh",
            "scripts/validation/zero_unity_editor_validation.py",
            "unity_cloud_population.sh"
        ]
        
        for pattern in redundant_patterns:
            file_path = Path(pattern)
            if file_path.exists():
                backup = self.create_backup(file_path)
                file_path.unlink()
                self.log_action("REMOVED", file_path, "Redundant Unity automation script")

    def remove_redundant_documentation(self):
        """Remove redundant documentation files"""
        print("\n=== CLEANING REDUNDANT DOCUMENTATION ===")
        
        # Keep the main ones in docs/, remove duplicates
        redundant_docs = [
            "scripts/setup_and_trigger_unity_cloud.md",
            "scripts/unity_credentials_guide.md", 
            "scripts/UNITY_SERVICES_SETUP.md",
            "UNITY_CLOUD_POPULATION_SUMMARY.md",
            "UNITY_CREDENTIALS_SETUP.md",
            "UNITY_DASHBOARD_SETUP_INSTRUCTIONS.md",
            "UNITY_ECONOMY_SETUP_INSTRUCTIONS.md",
            "UNITY_AUTOMATION_INDUSTRY_COMPARISON.md",
            "UNITY-WORKFLOW-GAPS-ANALYSIS.md"
        ]
        
        for doc in redundant_docs:
            file_path = Path(doc)
            if file_path.exists():
                backup = self.create_backup(file_path)
                file_path.unlink()
                self.log_action("REMOVED", file_path, "Redundant documentation")

    def remove_redundant_economy_scripts(self):
        """Remove redundant economy processing scripts"""
        print("\n=== CLEANING REDUNDANT ECONOMY SCRIPTS ===")
        
        # Keep the main unified processor, remove duplicates
        redundant_economy = [
            "scripts/automation/automated_economy_generator.py",
            "scripts/utilities/convert_economy_csv.py",
            "scripts/utilities/convert_economy.sh"
        ]
        
        for script in redundant_economy:
            file_path = Path(script)
            if file_path.exists():
                backup = self.create_backup(file_path)
                file_path.unlink()
                self.log_action("REMOVED", file_path, "Redundant economy processing script")

    def remove_redundant_summary_files(self):
        """Remove redundant summary and report files"""
        print("\n=== CLEANING REDUNDANT SUMMARY FILES ===")
        
        redundant_summaries = [
            "ADDED_MISSING_FEATURES.md",
            "AUTOMATION_ALIGNMENT_ANALYSIS.md",
            "CHECK_OPTIMIZATION_SUMMARY.md",
            "FILLED_GAPS_SUMMARY.md",
            "FINAL_INDUSTRY_COMPARISON.md",
            "FULLY_AUTOMATED_SETUP.md",
            "MATCH3-COMPLETE-AUTOMATION-SUMMARY.md",
            "PUSH_AND_FORGET_GUIDE.md",
            "PUSH_AND_FORGET_SUMMARY.md",
            "REDUNDANCY_CLEANUP_SUMMARY.md",
            "REDUNDANCY_REDUCTION_COMPLETE.md",
            "REDUNDANCY_REDUCTION_SUMMARY.md",
            "REFACTORING_COMPLETE_SUMMARY.md",
            "REFACTORING_SUMMARY.md",
            "REPOSITORY_CHECKS_SUMMARY.md",
            "SECURITY_IMPLEMENTATION.md",
            "SECURITY_INTEGRATION_SUMMARY.md"
        ]
        
        for summary in redundant_summaries:
            file_path = Path(summary)
            if file_path.exists():
                backup = self.create_backup(file_path)
                file_path.unlink()
                self.log_action("REMOVED", file_path, "Redundant summary/report file")

    def remove_redundant_scripts(self):
        """Remove redundant automation and utility scripts"""
        print("\n=== CLEANING REDUNDANT SCRIPTS ===")
        
        redundant_scripts = [
            "scripts/automation.js",
            "scripts/refactored-automation.js",
            "scripts/refactored-health-check.js",
            "scripts/health-check.js",
            "scripts/health-monitor.js",
            "scripts/performance-monitor.js",
            "scripts/security-scanner.js",
            "scripts/status-check.js",
            "scripts/notification-system.js",
            "scripts/error-recovery.js",
            "scripts/deploy-advanced-systems.js",
            "scripts/deployment-dashboard.js",
            "scripts/database-migration.js",
            "scripts/validate-headless-setup.py"
        ]
        
        for script in redundant_scripts:
            file_path = Path(script)
            if file_path.exists():
                backup = self.create_backup(file_path)
                file_path.unlink()
                self.log_action("REMOVED", file_path, "Redundant automation script")

    def consolidate_duplicate_files(self):
        """Consolidate files with similar content"""
        print("\n=== CONSOLIDATING DUPLICATE FILES ===")
        
        # Check for duplicate content using file hashes
        file_hashes = {}
        duplicates = []
        
        for file_path in self.repo_root.rglob("*"):
            if (file_path.is_file() and 
                file_path.suffix in ['.js', '.py', '.md', '.sh'] and
                'node_modules' not in str(file_path) and
                '.git' not in str(file_path)):
                
                try:
                    with open(file_path, 'rb') as f:
                        file_hash = hashlib.md5(f.read()).hexdigest()
                    
                    if file_hash in file_hashes:
                        duplicates.append((file_path, file_hashes[file_hash]))
                    else:
                        file_hashes[file_hash] = file_path
                except:
                    continue
        
        # Remove duplicates (keep the first occurrence)
        for duplicate, original in duplicates:
            if duplicate.exists():
                backup = self.create_backup(duplicate)
                duplicate.unlink()
                self.log_action("REMOVED", duplicate, f"Duplicate content of {original}")

    def clean_empty_directories(self):
        """Remove empty directories"""
        print("\n=== CLEANING EMPTY DIRECTORIES ===")
        
        for root, dirs, files in os.walk(self.repo_root, topdown=False):
            for dir_name in dirs:
                dir_path = Path(root) / dir_name
                try:
                    if not any(dir_path.iterdir()):
                        dir_path.rmdir()
                        self.log_action("REMOVED", dir_path, "Empty directory")
                except:
                    continue

    def generate_cleanup_report(self):
        """Generate cleanup report"""
        report = {
            "cleanup_timestamp": datetime.now().isoformat(),
            "total_actions": len(self.cleanup_log),
            "actions_by_type": {},
            "files_removed": [],
            "backup_location": str(self.backup_dir)
        }
        
        # Count actions by type
        for action in self.cleanup_log:
            action_type = action["action"]
            if action_type not in report["actions_by_type"]:
                report["actions_by_type"][action_type] = 0
            report["actions_by_type"][action_type] += 1
            
            if action_type == "REMOVED":
                report["files_removed"].append(action["file"])
        
        # Save report
        with open("redundancy_cleanup_report.json", "w") as f:
            json.dump(report, f, indent=2)
        
        print(f"\n=== CLEANUP REPORT ===")
        print(f"Total actions: {report['total_actions']}")
        print(f"Files removed: {len(report['files_removed'])}")
        print(f"Backup location: {report['backup_location']}")
        print(f"Report saved: redundancy_cleanup_report.json")

    def run_cleanup(self):
        """Run complete redundancy cleanup"""
        print("🧹 Starting Comprehensive Redundancy Cleanup")
        print("=" * 50)
        
        # Create backup directory
        if not self.backup_dir.exists():
            self.backup_dir.mkdir(parents=True)
        
        # Run cleanup steps
        self.remove_duplicate_cloud_code()
        self.remove_redundant_unity_scripts()
        self.remove_redundant_documentation()
        self.remove_redundant_economy_scripts()
        self.remove_redundant_summary_files()
        self.remove_redundant_scripts()
        self.consolidate_duplicate_files()
        self.clean_empty_directories()
        
        # Generate report
        self.generate_cleanup_report()
        
        print("\n🎉 Redundancy cleanup completed!")
        print(f"📁 Backup created at: {self.backup_dir}")
        print("📊 Check redundancy_cleanup_report.json for details")

if __name__ == "__main__":
    cleanup = RedundancyCleanup()
    cleanup.run_cleanup()