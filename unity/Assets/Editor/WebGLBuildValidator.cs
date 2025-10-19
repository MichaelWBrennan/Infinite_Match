using UnityEditor;
using UnityEngine;
using System.Collections.Generic;
using System.Linq;
using System.IO;
using Evergreen.Core;

namespace Evergreen.Editor
{
    /// <summary>
    /// WEBGL BUILD VALIDATOR
    /// Validates that the project is WebGL-compatible before building
    /// Checks for threading, file I/O, and other WebGL-incompatible patterns
    /// </summary>
    public static class WebGLBuildValidator
    {
        [MenuItem("Build/Validate WebGL Compatibility")]
        public static void ValidateWebGLCompatibility()
        {
            Debug.Log("🔍 Starting WebGL compatibility validation...");
            
            var issues = new List<WebGLCompatibilityIssue>();
            
            // Check for threading usage
            issues.AddRange(CheckThreadingUsage());
            
            // Check for file I/O usage
            issues.AddRange(CheckFileIOUsage());
            
            // Check for SIMD usage
            issues.AddRange(CheckSIMDUsage());
            
            // Check for blocking operations
            issues.AddRange(CheckBlockingOperations());
            
            // Check for deprecated APIs
            issues.AddRange(CheckDeprecatedAPIs());
            
            // Check scenes for missing references
            issues.AddRange(CheckSceneReferences());
            
            // Report results
            ReportValidationResults(issues);
        }
        
        private static List<WebGLCompatibilityIssue> CheckThreadingUsage()
        {
            var issues = new List<WebGLCompatibilityIssue>();
            
            // Check for System.Threading usage
            var threadingFiles = FindFilesWithPattern("System.Threading|Thread\\.|Task\\.Run|ThreadPool");
            foreach (var file in threadingFiles)
            {
                issues.Add(new WebGLCompatibilityIssue
                {
                    type = IssueType.Threading,
                    severity = IssueSeverity.High,
                    file = file,
                    message = "Threading usage detected - not compatible with WebGL",
                    suggestion = "Use coroutines or async/await instead"
                });
            }
            
            return issues;
        }
        
        private static List<WebGLCompatibilityIssue> CheckFileIOUsage()
        {
            var issues = new List<WebGLCompatibilityIssue>();
            
            // Check for System.IO usage
            var fileIOFiles = FindFilesWithPattern("System\\.IO\\.File|File\\.|Directory\\.|StreamReader|StreamWriter");
            foreach (var file in fileIOFiles)
            {
                issues.Add(new WebGLCompatibilityIssue
                {
                    type = IssueType.FileIO,
                    severity = IssueSeverity.High,
                    file = file,
                    message = "Direct file I/O usage detected - not compatible with WebGL",
                    suggestion = "Use UnityWebRequest or PlayerPrefs instead"
                });
            }
            
            return issues;
        }
        
        private static List<WebGLCompatibilityIssue> CheckSIMDUsage()
        {
            var issues = new List<WebGLCompatibilityIssue>();
            
            // Check for SIMD usage
            var simdFiles = FindFilesWithPattern("System\\.Runtime\\.Intrinsics|System\\.Numerics|Vector128|Vector256");
            foreach (var file in simdFiles)
            {
                issues.Add(new WebGLCompatibilityIssue
                {
                    type = IssueType.SIMD,
                    severity = IssueSeverity.Medium,
                    file = file,
                    message = "SIMD usage detected - not available in WebGL",
                    suggestion = "Use platform-specific compilation or fallback implementations"
                });
            }
            
            return issues;
        }
        
        private static List<WebGLCompatibilityIssue> CheckBlockingOperations()
        {
            var issues = new List<WebGLCompatibilityIssue>();
            
            // Check for blocking operations
            var blockingFiles = FindFilesWithPattern("Thread\\.Sleep|Task\\.Wait|WaitForSeconds\\(0\\)");
            foreach (var file in blockingFiles)
            {
                issues.Add(new WebGLCompatibilityIssue
                {
                    type = IssueType.Blocking,
                    severity = IssueSeverity.High,
                    file = file,
                    message = "Blocking operation detected - can cause WebGL to freeze",
                    suggestion = "Use async/await or coroutines instead"
                });
            }
            
            return issues;
        }
        
        private static List<WebGLCompatibilityIssue> CheckDeprecatedAPIs()
        {
            var issues = new List<WebGLCompatibilityIssue>();
            
            // Check for deprecated APIs
            var deprecatedFiles = FindFilesWithPattern("WWW|Application\\.dataPath|Application\\.persistentDataPath");
            foreach (var file in deprecatedFiles)
            {
                issues.Add(new WebGLCompatibilityIssue
                {
                    type = IssueType.DeprecatedAPI,
                    severity = IssueSeverity.Medium,
                    file = file,
                    message = "Deprecated API usage detected",
                    suggestion = "Use UnityWebRequest or Application.streamingAssetsPath instead"
                });
            }
            
            return issues;
        }
        
        private static List<WebGLCompatibilityIssue> CheckSceneReferences()
        {
            var issues = new List<WebGLCompatibilityIssue>();
            
            // Check all scenes for missing references
            var sceneFiles = Directory.GetFiles("Assets/Scenes", "*.unity", SearchOption.AllDirectories);
            foreach (var sceneFile in sceneFiles)
            {
                var content = File.ReadAllText(sceneFile);
                if (content.Contains("guid: 0000000000000000e000000000000000"))
                {
                    issues.Add(new WebGLCompatibilityIssue
                    {
                        type = IssueType.MissingReference,
                        severity = IssueSeverity.High,
                        file = sceneFile,
                        message = "Missing script reference detected in scene",
                        suggestion = "Fix missing script references in Unity Editor"
                    });
                }
            }
            
            return issues;
        }
        
        private static List<string> FindFilesWithPattern(string pattern)
        {
            var files = new List<string>();
            var scriptFiles = Directory.GetFiles("Assets/Scripts", "*.cs", SearchOption.AllDirectories);
            
            foreach (var file in scriptFiles)
            {
                var content = File.ReadAllText(file);
                if (System.Text.RegularExpressions.Regex.IsMatch(content, pattern))
                {
                    files.Add(file);
                }
            }
            
            return files;
        }
        
        private static void ReportValidationResults(List<WebGLCompatibilityIssue> issues)
        {
            Debug.Log($"🔍 WebGL Compatibility Validation Complete");
            Debug.Log($"📊 Found {issues.Count} issues");
            
            if (issues.Count == 0)
            {
                Debug.Log("✅ No WebGL compatibility issues found! Project is ready for WebGL build.");
                return;
            }
            
            // Group issues by severity
            var highIssues = issues.Where(i => i.severity == IssueSeverity.High).ToList();
            var mediumIssues = issues.Where(i => i.severity == IssueSeverity.Medium).ToList();
            var lowIssues = issues.Where(i => i.severity == IssueSeverity.Low).ToList();
            
            if (highIssues.Count > 0)
            {
                Debug.LogError($"❌ {highIssues.Count} HIGH severity issues found:");
                foreach (var issue in highIssues)
                {
                    Debug.LogError($"  - {issue.file}: {issue.message}");
                    Debug.LogError($"    Suggestion: {issue.suggestion}");
                }
            }
            
            if (mediumIssues.Count > 0)
            {
                Debug.LogWarning($"⚠️ {mediumIssues.Count} MEDIUM severity issues found:");
                foreach (var issue in mediumIssues)
                {
                    Debug.LogWarning($"  - {issue.file}: {issue.message}");
                    Debug.LogWarning($"    Suggestion: {issue.suggestion}");
                }
            }
            
            if (lowIssues.Count > 0)
            {
                Debug.Log($"ℹ️ {lowIssues.Count} LOW severity issues found:");
                foreach (var issue in lowIssues)
                {
                    Debug.Log($"  - {issue.file}: {issue.message}");
                    Debug.Log($"    Suggestion: {issue.suggestion}");
                }
            }
            
            // Summary
            if (highIssues.Count > 0)
            {
                Debug.LogError("❌ WebGL build will likely fail due to high severity issues. Please fix these before building.");
            }
            else if (mediumIssues.Count > 0)
            {
                Debug.LogWarning("⚠️ WebGL build may have issues. Consider fixing medium severity issues for better compatibility.");
            }
            else
            {
                Debug.Log("✅ WebGL build should work, but consider fixing low severity issues for optimal performance.");
            }
        }
        
        [MenuItem("Build/Fix WebGL Compatibility Issues")]
        public static void FixWebGLCompatibilityIssues()
        {
            Debug.Log("🔧 Attempting to fix WebGL compatibility issues...");
            
            // This would implement automatic fixes for common issues
            // For now, just provide guidance
            
            Debug.Log("📋 Manual fixes required:");
            Debug.Log("1. Replace System.Threading with coroutines or async/await");
            Debug.Log("2. Replace System.IO with UnityWebRequest or PlayerPrefs");
            Debug.Log("3. Remove SIMD usage or add platform-specific compilation");
            Debug.Log("4. Replace blocking operations with async alternatives");
            Debug.Log("5. Fix missing script references in scenes");
            Debug.Log("6. Use WebGLCompatibilityLayer for platform-specific code");
        }
    }
    
    // Data classes
    public class WebGLCompatibilityIssue
    {
        public IssueType type;
        public IssueSeverity severity;
        public string file;
        public string message;
        public string suggestion;
    }
    
    public enum IssueType
    {
        Threading,
        FileIO,
        SIMD,
        Blocking,
        DeprecatedAPI,
        MissingReference
    }
    
    public enum IssueSeverity
    {
        Low,
        Medium,
        High
    }
}
