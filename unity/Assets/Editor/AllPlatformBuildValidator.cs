using UnityEditor;
using UnityEngine;
using System.Collections.Generic;
using System.Linq;
using System.IO;
using Evergreen.Core;

namespace Evergreen.Editor
{
    /// <summary>
    /// ALL PLATFORM BUILD VALIDATOR
    /// Validates that the project works on all platforms (WebGL, iOS, Android, Desktop)
    /// Comprehensive testing and validation system
    /// </summary>
    public static class AllPlatformBuildValidator
    {
        [MenuItem("Build/Validate All Platforms")]
        public static void ValidateAllPlatforms()
        {
            Debug.Log("🔍 Starting All Platform Validation...");
            
            var results = new Dictionary<string, PlatformValidationResult>();
            
            // Validate WebGL
            results["WebGL"] = ValidateWebGL();
            
            // Validate iOS
            results["iOS"] = ValidateIOS();
            
            // Validate Android
            results["Android"] = ValidateAndroid();
            
            // Validate Desktop
            results["Desktop"] = ValidateDesktop();
            
            // Generate comprehensive report
            GenerateAllPlatformReport(results);
        }

        private static PlatformValidationResult ValidateWebGL()
        {
            Debug.Log("🌐 Validating WebGL compatibility...");
            
            var result = new PlatformValidationResult
            {
                platform = "WebGL",
                startTime = System.DateTime.Now
            };

            try
            {
                var issues = new List<ValidationIssue>();
                
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
                
                // Check WebGL-specific settings
                issues.AddRange(CheckWebGLSettings());
                
                result.issues = issues;
                result.success = issues.Count(i => i.severity == IssueSeverity.High) == 0;
                result.message = result.success ? "WebGL validation passed" : "WebGL validation failed";
            }
            catch (System.Exception e)
            {
                result.success = false;
                result.message = $"WebGL validation error: {e.Message}";
                result.error = e.ToString();
            }

            result.endTime = System.DateTime.Now;
            result.duration = (result.endTime - result.startTime).TotalSeconds;
            
            return result;
        }

        private static PlatformValidationResult ValidateIOS()
        {
            Debug.Log("🍎 Validating iOS compatibility...");
            
            var result = new PlatformValidationResult
            {
                platform = "iOS",
                startTime = System.DateTime.Now
            };

            try
            {
                var issues = new List<ValidationIssue>();
                
                // Check for iOS-specific issues
                issues.AddRange(CheckIOSSettings());
                
                // Check for battery optimization
                issues.AddRange(CheckBatteryOptimization());
                
                // Check for thermal optimization
                issues.AddRange(CheckThermalOptimization());
                
                // Check for memory optimization
                issues.AddRange(CheckMemoryOptimization());
                
                // Check for Metal optimization
                issues.AddRange(CheckMetalOptimization());
                
                result.issues = issues;
                result.success = issues.Count(i => i.severity == IssueSeverity.High) == 0;
                result.message = result.success ? "iOS validation passed" : "iOS validation failed";
            }
            catch (System.Exception e)
            {
                result.success = false;
                result.message = $"iOS validation error: {e.Message}";
                result.error = e.ToString();
            }

            result.endTime = System.DateTime.Now;
            result.duration = (result.endTime - result.startTime).TotalSeconds;
            
            return result;
        }

        private static PlatformValidationResult ValidateAndroid()
        {
            Debug.Log("🤖 Validating Android compatibility...");
            
            var result = new PlatformValidationResult
            {
                platform = "Android",
                startTime = System.DateTime.Now
            };

            try
            {
                var issues = new List<ValidationIssue>();
                
                // Check for Android-specific issues
                issues.AddRange(CheckAndroidSettings());
                
                // Check for battery optimization
                issues.AddRange(CheckBatteryOptimization());
                
                // Check for thermal optimization
                issues.AddRange(CheckThermalOptimization());
                
                // Check for memory optimization
                issues.AddRange(CheckMemoryOptimization());
                
                // Check for Vulkan optimization
                issues.AddRange(CheckVulkanOptimization());
                
                result.issues = issues;
                result.success = issues.Count(i => i.severity == IssueSeverity.High) == 0;
                result.message = result.success ? "Android validation passed" : "Android validation failed";
            }
            catch (System.Exception e)
            {
                result.success = false;
                result.message = $"Android validation error: {e.Message}";
                result.error = e.ToString();
            }

            result.endTime = System.DateTime.Now;
            result.duration = (result.endTime - result.startTime).TotalSeconds;
            
            return result;
        }

        private static PlatformValidationResult ValidateDesktop()
        {
            Debug.Log("🖥️ Validating Desktop compatibility...");
            
            var result = new PlatformValidationResult
            {
                platform = "Desktop",
                startTime = System.DateTime.Now
            };

            try
            {
                var issues = new List<ValidationIssue>();
                
                // Check for desktop-specific issues
                issues.AddRange(CheckDesktopSettings());
                
                // Check for threading optimization
                issues.AddRange(CheckThreadingOptimization());
                
                // Check for SIMD optimization
                issues.AddRange(CheckSIMDOptimization());
                
                // Check for graphics optimization
                issues.AddRange(CheckGraphicsOptimization());
                
                result.issues = issues;
                result.success = issues.Count(i => i.severity == IssueSeverity.High) == 0;
                result.message = result.success ? "Desktop validation passed" : "Desktop validation failed";
            }
            catch (System.Exception e)
            {
                result.success = false;
                result.message = $"Desktop validation error: {e.Message}";
                result.error = e.ToString();
            }

            result.endTime = System.DateTime.Now;
            result.duration = (result.endTime - result.startTime).TotalSeconds;
            
            return result;
        }

        // Validation methods

        private static List<ValidationIssue> CheckThreadingUsage()
        {
            var issues = new List<ValidationIssue>();
            var threadingFiles = FindFilesWithPattern("System.Threading|Thread\\.|Task\\.Run|ThreadPool");
            
            foreach (var file in threadingFiles)
            {
                issues.Add(new ValidationIssue
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

        private static List<ValidationIssue> CheckFileIOUsage()
        {
            var issues = new List<ValidationIssue>();
            var fileIOFiles = FindFilesWithPattern("System\\.IO\\.File|File\\.|Directory\\.|StreamReader|StreamWriter");
            
            foreach (var file in fileIOFiles)
            {
                issues.Add(new ValidationIssue
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

        private static List<ValidationIssue> CheckSIMDUsage()
        {
            var issues = new List<ValidationIssue>();
            var simdFiles = FindFilesWithPattern("System\\.Runtime\\.Intrinsics|System\\.Numerics|Vector128|Vector256");
            
            foreach (var file in simdFiles)
            {
                issues.Add(new ValidationIssue
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

        private static List<ValidationIssue> CheckBlockingOperations()
        {
            var issues = new List<ValidationIssue>();
            var blockingFiles = FindFilesWithPattern("Thread\\.Sleep|Task\\.Wait|WaitForSeconds\\(0\\)");
            
            foreach (var file in blockingFiles)
            {
                issues.Add(new ValidationIssue
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

        private static List<ValidationIssue> CheckDeprecatedAPIs()
        {
            var issues = new List<ValidationIssue>();
            var deprecatedFiles = FindFilesWithPattern("WWW|Application\\.dataPath|Application\\.persistentDataPath");
            
            foreach (var file in deprecatedFiles)
            {
                issues.Add(new ValidationIssue
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

        private static List<ValidationIssue> CheckSceneReferences()
        {
            var issues = new List<ValidationIssue>();
            var sceneFiles = Directory.GetFiles("Assets/Scenes", "*.unity", SearchOption.AllDirectories);
            
            foreach (var sceneFile in sceneFiles)
            {
                var content = File.ReadAllText(sceneFile);
                if (content.Contains("guid: 0000000000000000e000000000000000"))
                {
                    issues.Add(new ValidationIssue
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

        private static List<ValidationIssue> CheckWebGLSettings()
        {
            var issues = new List<ValidationIssue>();
            
            // Check WebGL-specific settings
            var webGLSettings = PlayerSettings.GetGraphicsAPIs(BuildTarget.WebGL);
            if (webGLSettings.Length == 0 || webGLSettings[0] != GraphicsDeviceType.OpenGLES3)
            {
                issues.Add(new ValidationIssue
                {
                    type = IssueType.WebGLSettings,
                    severity = IssueSeverity.Medium,
                    file = "PlayerSettings",
                    message = "WebGL graphics API not properly configured",
                    suggestion = "Set WebGL graphics API to OpenGLES3"
                });
            }
            
            return issues;
        }

        private static List<ValidationIssue> CheckIOSSettings()
        {
            var issues = new List<ValidationIssue>();
            
            // Check iOS-specific settings
            if (PlayerSettings.iOS.targetOSVersionString != "14.0")
            {
                issues.Add(new ValidationIssue
                {
                    type = IssueType.IOSSettings,
                    severity = IssueSeverity.Medium,
                    file = "PlayerSettings",
                    message = "iOS target OS version not optimized",
                    suggestion = "Set iOS target OS version to 14.0 or higher"
                });
            }
            
            return issues;
        }

        private static List<ValidationIssue> CheckAndroidSettings()
        {
            var issues = new List<ValidationIssue>();
            
            // Check Android-specific settings
            if (PlayerSettings.Android.minSdkVersion < AndroidSdkVersions.AndroidApiLevel23)
            {
                issues.Add(new ValidationIssue
                {
                    type = IssueType.AndroidSettings,
                    severity = IssueSeverity.Medium,
                    file = "PlayerSettings",
                    message = "Android min SDK version too low",
                    suggestion = "Set Android min SDK version to 23 or higher"
                });
            }
            
            return issues;
        }

        private static List<ValidationIssue> CheckDesktopSettings()
        {
            var issues = new List<ValidationIssue>();
            
            // Check desktop-specific settings
            if (PlayerSettings.GetGraphicsAPIs(BuildTarget.StandaloneWindows).Length == 0)
            {
                issues.Add(new ValidationIssue
                {
                    type = IssueType.DesktopSettings,
                    severity = IssueSeverity.Medium,
                    file = "PlayerSettings",
                    message = "Desktop graphics API not configured",
                    suggestion = "Set desktop graphics API to Direct3D11 or Vulkan"
                });
            }
            
            return issues;
        }

        private static List<ValidationIssue> CheckBatteryOptimization()
        {
            var issues = new List<ValidationIssue>();
            
            // Check for battery optimization features
            var batteryOptimizer = FindObjectOfType<PlatformSpecificOptimizer>();
            if (batteryOptimizer == null)
            {
                issues.Add(new ValidationIssue
                {
                    type = IssueType.BatteryOptimization,
                    severity = IssueSeverity.Low,
                    file = "Scene",
                    message = "Battery optimization not configured",
                    suggestion = "Add PlatformSpecificOptimizer to scene for battery optimization"
                });
            }
            
            return issues;
        }

        private static List<ValidationIssue> CheckThermalOptimization()
        {
            var issues = new List<ValidationIssue>();
            
            // Check for thermal optimization features
            var thermalOptimizer = FindObjectOfType<PlatformSpecificOptimizer>();
            if (thermalOptimizer == null)
            {
                issues.Add(new ValidationIssue
                {
                    type = IssueType.ThermalOptimization,
                    severity = IssueSeverity.Low,
                    file = "Scene",
                    message = "Thermal optimization not configured",
                    suggestion = "Add PlatformSpecificOptimizer to scene for thermal optimization"
                });
            }
            
            return issues;
        }

        private static List<ValidationIssue> CheckMemoryOptimization()
        {
            var issues = new List<ValidationIssue>();
            
            // Check for memory optimization features
            var memoryOptimizer = FindObjectOfType<PlatformSpecificOptimizer>();
            if (memoryOptimizer == null)
            {
                issues.Add(new ValidationIssue
                {
                    type = IssueType.MemoryOptimization,
                    severity = IssueSeverity.Low,
                    file = "Scene",
                    message = "Memory optimization not configured",
                    suggestion = "Add PlatformSpecificOptimizer to scene for memory optimization"
                });
            }
            
            return issues;
        }

        private static List<ValidationIssue> CheckMetalOptimization()
        {
            var issues = new List<ValidationIssue>();
            
            // Check for Metal optimization features
            var metalOptimizer = FindObjectOfType<PlatformSpecificOptimizer>();
            if (metalOptimizer == null)
            {
                issues.Add(new ValidationIssue
                {
                    type = IssueType.MetalOptimization,
                    severity = IssueSeverity.Low,
                    file = "Scene",
                    message = "Metal optimization not configured",
                    suggestion = "Add PlatformSpecificOptimizer to scene for Metal optimization"
                });
            }
            
            return issues;
        }

        private static List<ValidationIssue> CheckVulkanOptimization()
        {
            var issues = new List<ValidationIssue>();
            
            // Check for Vulkan optimization features
            var vulkanOptimizer = FindObjectOfType<PlatformSpecificOptimizer>();
            if (vulkanOptimizer == null)
            {
                issues.Add(new ValidationIssue
                {
                    type = IssueType.VulkanOptimization,
                    severity = IssueSeverity.Low,
                    file = "Scene",
                    message = "Vulkan optimization not configured",
                    suggestion = "Add PlatformSpecificOptimizer to scene for Vulkan optimization"
                });
            }
            
            return issues;
        }

        private static List<ValidationIssue> CheckThreadingOptimization()
        {
            var issues = new List<ValidationIssue>();
            
            // Check for threading optimization features
            var threadingOptimizer = FindObjectOfType<PlatformAwareCPUOptimizer>();
            if (threadingOptimizer == null)
            {
                issues.Add(new ValidationIssue
                {
                    type = IssueType.ThreadingOptimization,
                    severity = IssueSeverity.Low,
                    file = "Scene",
                    message = "Threading optimization not configured",
                    suggestion = "Add PlatformAwareCPUOptimizer to scene for threading optimization"
                });
            }
            
            return issues;
        }

        private static List<ValidationIssue> CheckSIMDOptimization()
        {
            var issues = new List<ValidationIssue>();
            
            // Check for SIMD optimization features
            var simdOptimizer = FindObjectOfType<PlatformAwareCPUOptimizer>();
            if (simdOptimizer == null)
            {
                issues.Add(new ValidationIssue
                {
                    type = IssueType.SIMDOptimization,
                    severity = IssueSeverity.Low,
                    file = "Scene",
                    message = "SIMD optimization not configured",
                    suggestion = "Add PlatformAwareCPUOptimizer to scene for SIMD optimization"
                });
            }
            
            return issues;
        }

        private static List<ValidationIssue> CheckGraphicsOptimization()
        {
            var issues = new List<ValidationIssue>();
            
            // Check for graphics optimization features
            var graphicsOptimizer = FindObjectOfType<PlatformSpecificOptimizer>();
            if (graphicsOptimizer == null)
            {
                issues.Add(new ValidationIssue
                {
                    type = IssueType.GraphicsOptimization,
                    severity = IssueSeverity.Low,
                    file = "Scene",
                    message = "Graphics optimization not configured",
                    suggestion = "Add PlatformSpecificOptimizer to scene for graphics optimization"
                });
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

        private static void GenerateAllPlatformReport(Dictionary<string, PlatformValidationResult> results)
        {
            Debug.Log("📊 Generating All Platform Validation Report...");
            
            var totalPlatforms = results.Count;
            var passedPlatforms = results.Count(r => r.Value.success);
            var failedPlatforms = results.Count(r => !r.Value.success);
            
            Debug.Log($"📈 Platform Validation Summary:");
            Debug.Log($"  Total Platforms: {totalPlatforms}");
            Debug.Log($"  Passed: {passedPlatforms}");
            Debug.Log($"  Failed: {failedPlatforms}");
            Debug.Log($"  Success Rate: {(float)passedPlatforms / totalPlatforms * 100:F1}%");
            
            foreach (var kvp in results)
            {
                var platform = kvp.Key;
                var result = kvp.Value;
                var status = result.success ? "✅ PASS" : "❌ FAIL";
                
                Debug.Log($"  {status} {platform} ({result.duration:F2}s)");
                Debug.Log($"    Message: {result.message}");
                
                if (result.issues.Count > 0)
                {
                    var highIssues = result.issues.Count(i => i.severity == IssueSeverity.High);
                    var mediumIssues = result.issues.Count(i => i.severity == IssueSeverity.Medium);
                    var lowIssues = result.issues.Count(i => i.severity == IssueSeverity.Low);
                    
                    Debug.Log($"    Issues: {highIssues} High, {mediumIssues} Medium, {lowIssues} Low");
                    
                    foreach (var issue in result.issues.Where(i => i.severity == IssueSeverity.High))
                    {
                        Debug.LogError($"      ❌ {issue.message}");
                        Debug.LogError($"         Suggestion: {issue.suggestion}");
                    }
                }
            }
            
            if (failedPlatforms > 0)
            {
                Debug.LogError("❌ Some platforms failed validation. Check the details above for more information.");
            }
            else
            {
                Debug.Log("✅ All platforms passed validation!");
            }
        }

        [MenuItem("Build/Fix All Platform Issues")]
        public static void FixAllPlatformIssues()
        {
            Debug.Log("🔧 Attempting to fix all platform issues...");
            
            // This would implement automatic fixes for common issues
            // For now, just provide guidance
            
            Debug.Log("📋 Manual fixes required:");
            Debug.Log("1. Replace System.Threading with coroutines or async/await");
            Debug.Log("2. Replace System.IO with UnityWebRequest or PlayerPrefs");
            Debug.Log("3. Remove SIMD usage or add platform-specific compilation");
            Debug.Log("4. Replace blocking operations with async alternatives");
            Debug.Log("5. Fix missing script references in scenes");
            Debug.Log("6. Use WebGLCompatibilityLayer for platform-specific code");
            Debug.Log("7. Add PlatformSpecificOptimizer to scenes for optimization");
            Debug.Log("8. Configure platform-specific settings in PlayerSettings");
        }
    }

    // Data classes
    public class PlatformValidationResult
    {
        public string platform;
        public bool success;
        public string message;
        public string error;
        public System.DateTime startTime;
        public System.DateTime endTime;
        public double duration;
        public List<ValidationIssue> issues = new List<ValidationIssue>();
    }

    public class ValidationIssue
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
        MissingReference,
        WebGLSettings,
        IOSSettings,
        AndroidSettings,
        DesktopSettings,
        BatteryOptimization,
        ThermalOptimization,
        MemoryOptimization,
        MetalOptimization,
        VulkanOptimization,
        ThreadingOptimization,
        SIMDOptimization,
        GraphicsOptimization
    }

    public enum IssueSeverity
    {
        Low,
        Medium,
        High
    }
}
