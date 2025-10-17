#!/usr/bin/env python3
"""
Update Path References Script
Updates all import statements and references to use the new optimized systems
"""

import os
import re
import glob
from pathlib import Path

class PathReferenceUpdater:
    def __init__(self, unity_scripts_path):
        self.unity_scripts_path = Path(unity_scripts_path)
        self.updated_files = []
        self.errors = []
        
        # Define the mapping of old files to new optimized systems
        self.file_mappings = {
            # Core system mappings
            'GameManager': 'OptimizedCoreSystem',
            'ServiceLocator': 'OptimizedCoreSystem', 
            'AdvancedServiceLocator': 'OptimizedCoreSystem',
            'Logger': 'OptimizedCoreSystem',
            'AdvancedLogger': 'OptimizedCoreSystem',
            'MemoryOptimizer': 'OptimizedCoreSystem',
            'AdvancedMemoryOptimizer': 'OptimizedCoreSystem',
            'AdvancedEventBus': 'OptimizedCoreSystem',
            
            # UI system mappings
            'EnhancedUIManager': 'OptimizedUISystem',
            'AdvancedUISystem': 'OptimizedUISystem',
            'UIOptimizer': 'OptimizedUISystem',
            'UltraUIOptimizer': 'OptimizedUISystem',
            'UIComponentCache': 'OptimizedUISystem',
            'UIElementPool': 'OptimizedUISystem',
            
            # Game system mappings
            'Board': 'OptimizedGameSystem',
            'LevelManager': 'OptimizedGameSystem',
            'OptimizedLevelManager': 'OptimizedGameSystem',
            'EnergySystem': 'OptimizedGameSystem',
            'GameState': 'OptimizedGameSystem',
            'GameIntegration': 'OptimizedGameSystem',
        }
        
        # Define namespace mappings
        self.namespace_mappings = {
            'Evergreen.Core.GameManager': 'Evergreen.Core.OptimizedCoreSystem',
            'Evergreen.Core.ServiceLocator': 'Evergreen.Core.OptimizedCoreSystem',
            'Evergreen.Architecture.AdvancedServiceLocator': 'Evergreen.Core.OptimizedCoreSystem',
            'Evergreen.UI.EnhancedUIManager': 'Evergreen.UI.OptimizedUISystem',
            'Evergreen.UI.AdvancedUISystem': 'Evergreen.UI.OptimizedUISystem',
            'Evergreen.Game.Board': 'Evergreen.Game.OptimizedGameSystem',
            'Evergreen.Game.LevelManager': 'Evergreen.Game.OptimizedGameSystem',
        }

    def update_all_references(self):
        """Update all path references in the Unity scripts directory"""
        print("🔄 Starting path reference updates...")
        
        # Find all C# files
        cs_files = list(self.unity_scripts_path.rglob("*.cs"))
        print(f"Found {len(cs_files)} C# files to process")
        
        for file_path in cs_files:
            try:
                self.update_file_references(file_path)
            except Exception as e:
                error_msg = f"Error processing {file_path}: {str(e)}"
                self.errors.append(error_msg)
                print(f"❌ {error_msg}")
        
        self.print_summary()

    def update_file_references(self, file_path):
        """Update references in a single file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            updated = False
            
            # Update using statements
            content = self.update_using_statements(content)
            
            # Update class references
            content = self.update_class_references(content)
            
            # Update namespace references
            content = self.update_namespace_references(content)
            
            # Update singleton access patterns
            content = self.update_singleton_access(content)
            
            # Update method calls
            content = self.update_method_calls(content)
            
            if content != original_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                self.updated_files.append(str(file_path))
                updated = True
            
            if updated:
                print(f"✅ Updated: {file_path.relative_to(self.unity_scripts_path)}")
                
        except Exception as e:
            raise Exception(f"Failed to process file: {str(e)}")

    def update_using_statements(self, content):
        """Update using statements to reference new systems"""
        # Update core system using statements
        content = re.sub(
            r'using\s+Evergreen\.Core\.GameManager;',
            'using Evergreen.Core;',
            content
        )
        
        content = re.sub(
            r'using\s+Evergreen\.Core\.ServiceLocator;',
            'using Evergreen.Core;',
            content
        )
        
        content = re.sub(
            r'using\s+Evergreen\.Architecture;',
            'using Evergreen.Core;',
            content
        )
        
        # Update UI system using statements
        content = re.sub(
            r'using\s+Evergreen\.UI\.EnhancedUIManager;',
            'using Evergreen.UI;',
            content
        )
        
        content = re.sub(
            r'using\s+Evergreen\.UI\.AdvancedUIManager;',
            'using Evergreen.UI;',
            content
        )
        
        # Update game system using statements
        content = re.sub(
            r'using\s+Evergreen\.Game\.Board;',
            'using Evergreen.Game;',
            content
        )
        
        content = re.sub(
            r'using\s+Evergreen\.Game\.LevelManager;',
            'using Evergreen.Game;',
            content
        )
        
        return content

    def update_class_references(self, content):
        """Update class references to use new optimized systems"""
        # Update core system references
        content = re.sub(
            r'\bGameManager\.Instance\b',
            'OptimizedCoreSystem.Instance',
            content
        )
        
        content = re.sub(
            r'\bServiceLocator\.Get<',
            'OptimizedCoreSystem.Instance.Resolve<',
            content
        )
        
        content = re.sub(
            r'\bAdvancedServiceLocator\.Instance\b',
            'OptimizedCoreSystem.Instance',
            content
        )
        
        # Update UI system references
        content = re.sub(
            r'\bEnhancedUIManager\.Instance\b',
            'OptimizedUISystem.Instance',
            content
        )
        
        content = re.sub(
            r'\bAdvancedUISystem\.Instance\b',
            'OptimizedUISystem.Instance',
            content
        )
        
        # Update game system references
        content = re.sub(
            r'\bBoard\.Instance\b',
            'OptimizedGameSystem.Instance',
            content
        )
        
        content = re.sub(
            r'\bLevelManager\.Instance\b',
            'OptimizedGameSystem.Instance',
            content
        )
        
        content = re.sub(
            r'\bOptimizedLevelManager\.Instance\b',
            'OptimizedGameSystem.Instance',
            content
        )
        
        content = re.sub(
            r'\bEnergySystem\.Instance\b',
            'OptimizedGameSystem.Instance',
            content
        )
        
        return content

    def update_namespace_references(self, content):
        """Update namespace references"""
        for old_namespace, new_namespace in self.namespace_mappings.items():
            content = content.replace(old_namespace, new_namespace)
        
        return content

    def update_singleton_access(self, content):
        """Update singleton access patterns"""
        # Update common singleton patterns
        patterns = [
            (r'FindObjectOfType<GameManager>\(\)', 'OptimizedCoreSystem.Instance'),
            (r'FindObjectOfType<EnhancedUIManager>\(\)', 'OptimizedUISystem.Instance'),
            (r'FindObjectOfType<Board>\(\)', 'OptimizedGameSystem.Instance'),
            (r'FindObjectOfType<LevelManager>\(\)', 'OptimizedGameSystem.Instance'),
        ]
        
        for pattern, replacement in patterns:
            content = re.sub(pattern, replacement, content)
        
        return content

    def update_method_calls(self, content):
        """Update method calls to use new system APIs"""
        # Update core system method calls
        content = re.sub(
            r'GameManager\.Instance\.SetGameState\(',
            'OptimizedCoreSystem.Instance.SetGameState(',
            content
        )
        
        content = re.sub(
            r'GameManager\.Instance\.AddScore\(',
            'OptimizedCoreSystem.Instance.AddScore(',
            content
        )
        
        content = re.sub(
            r'GameManager\.Instance\.AddCoins\(',
            'OptimizedCoreSystem.Instance.AddCoins(',
            content
        )
        
        # Update UI system method calls
        content = re.sub(
            r'EnhancedUIManager\.Instance\.ShowPanel\(',
            'OptimizedUISystem.Instance.ShowPanel(',
            content
        )
        
        content = re.sub(
            r'EnhancedUIManager\.Instance\.ShowNotification\(',
            'OptimizedUISystem.Instance.ShowNotification(',
            content
        )
        
        # Update game system method calls
        content = re.sub(
            r'Board\.Instance\.StartNewLevel\(',
            'OptimizedGameSystem.Instance.StartNewLevel(',
            content
        )
        
        content = re.sub(
            r'LevelManager\.Instance\.StartNewLevel\(',
            'OptimizedGameSystem.Instance.StartNewLevel(',
            content
        )
        
        return content

    def print_summary(self):
        """Print update summary"""
        print("\n" + "="*60)
        print("📊 PATH REFERENCE UPDATE SUMMARY")
        print("="*60)
        
        print(f"✅ Files updated: {len(self.updated_files)}")
        print(f"❌ Errors encountered: {len(self.errors)}")
        
        if self.updated_files:
            print("\n📁 Updated files:")
            for file_path in self.updated_files[:10]:  # Show first 10
                print(f"  • {file_path}")
            if len(self.updated_files) > 10:
                print(f"  ... and {len(self.updated_files) - 10} more")
        
        if self.errors:
            print("\n❌ Errors:")
            for error in self.errors[:5]:  # Show first 5
                print(f"  • {error}")
            if len(self.errors) > 5:
                print(f"  ... and {len(self.errors) - 5} more")
        
        print("\n🎉 Path reference updates complete!")
        print("="*60)

def main():
    """Main function"""
    # Get the Unity scripts path
    unity_scripts_path = "unity/Assets/Scripts"
    
    if not os.path.exists(unity_scripts_path):
        print(f"❌ Unity scripts path not found: {unity_scripts_path}")
        return
    
    # Create updater and run
    updater = PathReferenceUpdater(unity_scripts_path)
    updater.update_all_references()

if __name__ == "__main__":
    main()