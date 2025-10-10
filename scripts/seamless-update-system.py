#!/usr/bin/env python3
"""
Seamless Update System
User request → Branch creation → Auto-merge → Unity Cloud update
Zero manual steps required
"""

import os
import json
import subprocess
import time
from datetime import datetime
from pathlib import Path

class SeamlessUpdateSystem:
    def __init__(self):
        self.repo_root = Path(__file__).parent.parent
        self.branch_prefix = "auto-update"
        self.main_branch = "main"
        
    def create_update_branch(self, update_type, description):
        """Create a new branch for the update"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        branch_name = f"{self.branch_prefix}-{update_type}-{timestamp}"
        
        print(f"🌿 Creating branch: {branch_name}")
        
        # Create and checkout new branch
        subprocess.run(["git", "checkout", "-b", branch_name], cwd=self.repo_root)
        
        return branch_name
    
    def apply_economy_update(self, update_data):
        """Apply economy data updates"""
        print("💰 Applying economy updates...")
        
        # Update currencies
        if 'currencies' in update_data:
            self.update_csv_file('economy/currencies.csv', update_data['currencies'])
        
        # Update inventory
        if 'inventory' in update_data:
            self.update_csv_file('economy/inventory.csv', update_data['inventory'])
        
        # Update catalog
        if 'catalog' in update_data:
            self.update_csv_file('economy/catalog.csv', update_data['catalog'])
    
    def apply_remote_config_update(self, update_data):
        """Apply remote config updates"""
        print("⚙️ Applying remote config updates...")
        
        config_file = self.repo_root / "remote-config" / "game_config.json"
        if config_file.exists():
            with open(config_file, 'r') as f:
                config = json.load(f)
            
            # Merge updates
            config.update(update_data)
            
            with open(config_file, 'w') as f:
                json.dump(config, f, indent=2)
    
    def apply_cloud_code_update(self, update_data):
        """Apply Cloud Code updates"""
        print("☁️ Applying Cloud Code updates...")
        
        for function_name, code in update_data.items():
            function_file = self.repo_root / "cloud-code" / f"{function_name}.js"
            with open(function_file, 'w') as f:
                f.write(code)
    
    def update_csv_file(self, file_path, data):
        """Update CSV file with new data"""
        csv_file = self.repo_root / file_path
        
        if csv_file.exists():
            # Read existing data
            with open(csv_file, 'r') as f:
                lines = f.readlines()
            
            # Add new data
            for row in data:
                lines.append(','.join(str(v) for v in row) + '\n')
            
            # Write back
            with open(csv_file, 'w') as f:
                f.writelines(lines)
        else:
            # Create new file
            with open(csv_file, 'w') as f:
                f.writelines(data)
    
    def commit_and_push(self, branch_name, message):
        """Commit changes and push to branch"""
        print(f"📝 Committing changes: {message}")
        
        # Add all changes
        subprocess.run(["git", "add", "."], cwd=self.repo_root)
        
        # Commit
        subprocess.run(["git", "commit", "-m", message], cwd=self.repo_root)
        
        # Push branch
        subprocess.run(["git", "push", "-u", "origin", branch_name], cwd=self.repo_root)
    
    def create_pull_request(self, branch_name, title, description):
        """Create pull request (if GitHub CLI is available)"""
        try:
            pr_body = f"""
## 🤖 Automatic Update

**Type**: {title}
**Description**: {description}
**Branch**: {branch_name}
**Timestamp**: {datetime.now().isoformat()}

This update was automatically generated and will trigger Unity Cloud sync upon merge.

### Changes Made:
- Economy data updates
- Remote config updates  
- Cloud Code updates
- Unity assets updates

### Next Steps:
1. Review the changes
2. Merge this PR
3. Unity Cloud will be automatically updated
"""
            
            # Create PR using GitHub CLI
            result = subprocess.run([
                "gh", "pr", "create",
                "--title", title,
                "--body", pr_body,
                "--head", branch_name,
                "--base", self.main_branch
            ], cwd=self.repo_root, capture_output=True, text=True)
            
            if result.returncode == 0:
                print(f"✅ Pull request created: {result.stdout.strip()}")
                return result.stdout.strip()
            else:
                print(f"⚠️ Could not create PR automatically: {result.stderr}")
                return None
                
        except Exception as e:
            print(f"⚠️ PR creation failed: {e}")
            return None
    
    def auto_merge_and_deploy(self, branch_name):
        """Automatically merge branch and trigger Unity Cloud update"""
        print(f"🔄 Auto-merging branch: {branch_name}")
        
        # Switch to main branch
        subprocess.run(["git", "checkout", self.main_branch], cwd=self.repo_root)
        
        # Merge the update branch
        subprocess.run(["git", "merge", branch_name], cwd=self.repo_root)
        
        # Push to main
        subprocess.run(["git", "push", "origin", self.main_branch], cwd=self.repo_root)
        
        # Delete the update branch
        subprocess.run(["git", "branch", "-d", branch_name], cwd=self.repo_root)
        subprocess.run(["git", "push", "origin", "--delete", branch_name], cwd=self.repo_root)
        
        print("✅ Branch merged and Unity Cloud update triggered!")
    
    def process_update_request(self, update_type, update_data, description):
        """Process a complete update request"""
        print(f"🚀 Processing update request: {update_type}")
        print(f"📝 Description: {description}")
        
        try:
            # Step 1: Create branch
            branch_name = self.create_update_branch(update_type, description)
            
            # Step 2: Apply updates based on type
            if update_type == "economy":
                self.apply_economy_update(update_data)
            elif update_type == "remote_config":
                self.apply_remote_config_update(update_data)
            elif update_type == "cloud_code":
                self.apply_cloud_code_update(update_data)
            elif update_type == "all":
                self.apply_economy_update(update_data.get('economy', {}))
                self.apply_remote_config_update(update_data.get('remote_config', {}))
                self.apply_cloud_code_update(update_data.get('cloud_code', {}))
            
            # Step 3: Commit and push
            commit_message = f"🤖 Auto-update: {description}"
            self.commit_and_push(branch_name, commit_message)
            
            # Step 4: Create PR
            pr_title = f"🤖 Auto-update: {description}"
            pr_url = self.create_pull_request(branch_name, pr_title, description)
            
            # Step 5: Auto-merge and deploy
            self.auto_merge_and_deploy(branch_name)
            
            print("🎉 Update completed successfully!")
            print("✅ Unity Cloud will be automatically updated")
            
            return {
                "status": "success",
                "branch": branch_name,
                "pr_url": pr_url,
                "message": "Update completed and Unity Cloud sync triggered"
            }
            
        except Exception as e:
            print(f"❌ Update failed: {e}")
            return {
                "status": "error",
                "message": str(e)
            }

def main():
    """Main function for seamless updates"""
    system = SeamlessUpdateSystem()
    
    print("🤖 Seamless Update System")
    print("=" * 50)
    
    # Example usage - this would be called by the user interface
    if len(os.sys.argv) > 1:
        update_type = os.sys.argv[1]
        description = os.sys.argv[2] if len(os.sys.argv) > 2 else "Automatic update"
        
        # Example update data
        update_data = {
            "currencies": [
                ["new_currency", "Gold", "premium", "0", "999999"]
            ],
            "inventory": [
                ["new_item", "Magic Potion", "consumable", "true", "true"]
            ]
        }
        
        result = system.process_update_request(update_type, update_data, description)
        print(f"Result: {result}")
    else:
        print("Usage: python3 seamless-update-system.py <update_type> <description>")
        print("Update types: economy, remote_config, cloud_code, all")

if __name__ == "__main__":
    main()