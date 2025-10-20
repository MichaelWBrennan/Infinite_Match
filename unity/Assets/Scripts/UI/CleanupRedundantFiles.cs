using UnityEngine;
using System.Collections.Generic;
using System.IO;

namespace Evergreen.UI
{
    /// <summary>
    /// Cleanup Redundant Files
    /// Removes files that have been merged into the Master UI System
    /// </summary>
    public class CleanupRedundantFiles : MonoBehaviour
    {
        [Header("🗑️ Files to Remove")]
        [SerializeField] private bool removeUIManagers = true;
        [SerializeField] private bool removeSetupScripts = true;
        [SerializeField] private bool removeLegacyIntegration = true;
        [SerializeField] private bool createBackup = true;
        [SerializeField] private bool showConfirmation = true;
        
        [Header("📁 File Paths")]
        [SerializeField] private string uiScriptsPath = "Assets/Scripts/UI/";
        [SerializeField] private string backupPath = "Assets/Scripts/UI/Backup/";
        
        // Files to remove (merged into MasterUISystem.cs)
        private readonly List<string> uiManagerFiles = new List<string>
        {
            "Match3UISystem.cs",
            "RoyalMatchUIManager.cs",
            "IndustryStandardUIManager.cs",
            "OptimizedUISystem.cs",
            "PremiumUIManager.cs",
            "UnifiedMatch3UISystem.cs"
        };
        
        // Files to remove (merged into MasterUISetup.cs)
        private readonly List<string> setupScriptFiles = new List<string>
        {
            "CompleteUnifiedUISetup.cs",
            "CompleteMatch3UISetup.cs",
            "RoyalMatchSceneSetup.cs",
            "OneClickRoyalMatchSetup.cs",
            "RoyalMatchUISetup.cs",
            "Match3UIBootstrap.cs"
        };
        
        // Files to remove (functionality integrated into MasterUISystem.cs)
        private readonly List<string> legacyIntegrationFiles = new List<string>
        {
            "OptimizedMainMenuUI.cs",
            "GameplayUI.cs"
        };
        
        [ContextMenu("Cleanup Redundant Files")]
        public void CleanupRedundantFilesManual()
        {
            if (showConfirmation)
            {
                Debug.Log("⚠️ This will remove redundant UI files that have been merged into the Master UI System.");
                Debug.Log("📋 Files to be removed:");
                
                if (removeUIManagers)
                {
                    Debug.Log("🎮 UI Managers:");
                    foreach (var file in uiManagerFiles)
                    {
                        Debug.Log($"  - {file}");
                    }
                }
                
                if (removeSetupScripts)
                {
                    Debug.Log("🔧 Setup Scripts:");
                    foreach (var file in setupScriptFiles)
                    {
                        Debug.Log($"  - {file}");
                    }
                }
                
                if (removeLegacyIntegration)
                {
                    Debug.Log("🔗 Legacy Integration:");
                    foreach (var file in legacyIntegrationFiles)
                    {
                        Debug.Log($"  - {file}");
                    }
                }
                
                Debug.Log("✅ Run the cleanup again to proceed with removal.");
                return;
            }
            
            StartCoroutine(CleanupFiles());
        }
        
        [ContextMenu("Cleanup Redundant Files (No Confirmation)")]
        public void CleanupRedundantFilesNoConfirmation()
        {
            showConfirmation = false;
            CleanupRedundantFilesManual();
        }
        
        private System.Collections.IEnumerator CleanupFiles()
        {
            Debug.Log("🗑️ Starting cleanup of redundant files...");
            
            // Create backup directory if needed
            if (createBackup)
            {
                yield return StartCoroutine(CreateBackupDirectory());
            }
            
            // Remove UI Manager files
            if (removeUIManagers)
            {
                yield return StartCoroutine(RemoveFiles(uiManagerFiles, "UI Managers"));
            }
            
            // Remove Setup Script files
            if (removeSetupScripts)
            {
                yield return StartCoroutine(RemoveFiles(setupScriptFiles, "Setup Scripts"));
            }
            
            // Remove Legacy Integration files
            if (removeLegacyIntegration)
            {
                yield return StartCoroutine(RemoveFiles(legacyIntegrationFiles, "Legacy Integration"));
            }
            
            Debug.Log("✅ Cleanup completed successfully!");
        }
        
        private System.Collections.IEnumerator CreateBackupDirectory()
        {
            if (createBackup)
            {
                string fullBackupPath = Path.Combine(Application.dataPath, backupPath.TrimStart("Assets/".ToCharArray()));
                
                if (!Directory.Exists(fullBackupPath))
                {
                    Directory.CreateDirectory(fullBackupPath);
                    Debug.Log($"📁 Created backup directory: {backupPath}");
                }
                
                yield return new WaitForEndOfFrame();
            }
        }
        
        private System.Collections.IEnumerator RemoveFiles(List<string> files, string category)
        {
            Debug.Log($"🗑️ Removing {category}...");
            
            foreach (var fileName in files)
            {
                string filePath = Path.Combine(uiScriptsPath, fileName);
                string fullPath = Path.Combine(Application.dataPath, filePath.TrimStart("Assets/".ToCharArray()));
                
                if (File.Exists(fullPath))
                {
                    // Create backup if requested
                    if (createBackup)
                    {
                        string backupFilePath = Path.Combine(backupPath, fileName);
                        string fullBackupPath = Path.Combine(Application.dataPath, backupFilePath.TrimStart("Assets/".ToCharArray()));
                        
                        try
                        {
                            File.Copy(fullPath, fullBackupPath, true);
                            Debug.Log($"💾 Backed up: {fileName}");
                        }
                        catch (System.Exception e)
                        {
                            Debug.LogWarning($"⚠️ Failed to backup {fileName}: {e.Message}");
                        }
                    }
                    
                    // Remove the file
                    try
                    {
                        File.Delete(fullPath);
                        Debug.Log($"✅ Removed: {fileName}");
                    }
                    catch (System.Exception e)
                    {
                        Debug.LogError($"❌ Failed to remove {fileName}: {e.Message}");
                    }
                }
                else
                {
                    Debug.Log($"ℹ️ File not found: {fileName}");
                }
                
                yield return new WaitForEndOfFrame();
            }
        }
        
        [ContextMenu("List Redundant Files")]
        public void ListRedundantFiles()
        {
            Debug.Log("📋 Redundant Files List:");
            
            Debug.Log("🎮 UI Managers (merged into MasterUISystem.cs):");
            foreach (var file in uiManagerFiles)
            {
                string filePath = Path.Combine(uiScriptsPath, file);
                string fullPath = Path.Combine(Application.dataPath, filePath.TrimStart("Assets/".ToCharArray()));
                bool exists = File.Exists(fullPath);
                Debug.Log($"  {(exists ? "✅" : "❌")} {file}");
            }
            
            Debug.Log("🔧 Setup Scripts (merged into MasterUISetup.cs):");
            foreach (var file in setupScriptFiles)
            {
                string filePath = Path.Combine(uiScriptsPath, file);
                string fullPath = Path.Combine(Application.dataPath, filePath.TrimStart("Assets/".ToCharArray()));
                bool exists = File.Exists(fullPath);
                Debug.Log($"  {(exists ? "✅" : "❌")} {file}");
            }
            
            Debug.Log("🔗 Legacy Integration (functionality integrated into MasterUISystem.cs):");
            foreach (var file in legacyIntegrationFiles)
            {
                string filePath = Path.Combine(uiScriptsPath, file);
                string fullPath = Path.Combine(Application.dataPath, filePath.TrimStart("Assets/".ToCharArray()));
                bool exists = File.Exists(fullPath);
                Debug.Log($"  {(exists ? "✅" : "❌")} {file}");
            }
        }
        
        [ContextMenu("Check Master UI System")]
        public void CheckMasterUISystem()
        {
            Debug.Log("🔍 Checking Master UI System...");
            
            // Check if MasterUISystem exists
            string masterUIPath = Path.Combine(uiScriptsPath, "MasterUISystem.cs");
            string fullMasterUIPath = Path.Combine(Application.dataPath, masterUIPath.TrimStart("Assets/".ToCharArray()));
            bool masterUIExists = File.Exists(fullMasterUIPath);
            Debug.Log($"{(masterUIExists ? "✅" : "❌")} MasterUISystem.cs");
            
            // Check if MasterUISetup exists
            string masterSetupPath = Path.Combine(uiScriptsPath, "MasterUISetup.cs");
            string fullMasterSetupPath = Path.Combine(Application.dataPath, masterSetupPath.TrimStart("Assets/".ToCharArray()));
            bool masterSetupExists = File.Exists(fullMasterSetupPath);
            Debug.Log($"{(masterSetupExists ? "✅" : "❌")} MasterUISetup.cs");
            
            if (masterUIExists && masterSetupExists)
            {
                Debug.Log("✅ Master UI System is ready!");
            }
            else
            {
                Debug.Log("❌ Master UI System is not complete. Please ensure both files exist.");
            }
        }
        
        [ContextMenu("Restore from Backup")]
        public void RestoreFromBackup()
        {
            if (!createBackup)
            {
                Debug.Log("❌ No backup was created. Cannot restore files.");
                return;
            }
            
            Debug.Log("🔄 Restoring files from backup...");
            
            string fullBackupPath = Path.Combine(Application.dataPath, backupPath.TrimStart("Assets/".ToCharArray()));
            
            if (!Directory.Exists(fullBackupPath))
            {
                Debug.Log("❌ Backup directory not found.");
                return;
            }
            
            // Restore all files
            var allFiles = new List<string>();
            allFiles.AddRange(uiManagerFiles);
            allFiles.AddRange(setupScriptFiles);
            allFiles.AddRange(legacyIntegrationFiles);
            
            foreach (var fileName in allFiles)
            {
                string backupFilePath = Path.Combine(backupPath, fileName);
                string fullBackupFilePath = Path.Combine(Application.dataPath, backupFilePath.TrimStart("Assets/".ToCharArray()));
                string targetFilePath = Path.Combine(uiScriptsPath, fileName);
                string fullTargetPath = Path.Combine(Application.dataPath, targetFilePath.TrimStart("Assets/".ToCharArray()));
                
                if (File.Exists(fullBackupFilePath))
                {
                    try
                    {
                        File.Copy(fullBackupFilePath, fullTargetPath, true);
                        Debug.Log($"✅ Restored: {fileName}");
                    }
                    catch (System.Exception e)
                    {
                        Debug.LogError($"❌ Failed to restore {fileName}: {e.Message}");
                    }
                }
            }
            
            Debug.Log("✅ Restore completed!");
        }
    }
}