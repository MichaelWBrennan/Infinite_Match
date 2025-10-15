using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;
using System.IO;
using System.Net;
using System.Threading.Tasks;

namespace Evergreen.Assets
{
    [System.Serializable]
    public class AssetDownloadInfo
    {
        public string assetName;
        public string downloadUrl;
        public string localPath;
        public AssetType assetType;
        public bool isDownloaded;
        public bool isRequired;
        public string description;
        public long fileSize;
        public DateTime lastChecked;
    }
    
    public enum AssetType
    {
        Prefab,
        Audio,
        Material,
        Texture,
        Model,
        Animation,
        UnityPackage,
        Script
    }
    
    public class AssetDownloader : MonoBehaviour
    {
        [Header("Download Settings")]
        public bool enableAutoDownload = false;
        public bool enableAssetValidation = true;
        public bool enableProgressLogging = true;
        public float downloadTimeout = 300f; // 5 minutes
        
        [Header("Asset Sources")]
        public string[] githubRepositories = {
            "https://github.com/Unity-Technologies/Graphics",
            "https://github.com/Unity-Technologies/PostProcessing",
            "https://github.com/Unity-Technologies/UniversalRenderingPipeline"
        };
        
        public string[] assetStoreUrls = {
            "https://assetstore.unity.com/packages/essentials/asset-packs/standard-assets-32351",
            "https://assetstore.unity.com/packages/2d/textures-materials/sky/skybox-series-free-103633"
        };
        
        [Header("Download Progress")]
        public int totalAssets = 0;
        public int downloadedAssets = 0;
        public int failedDownloads = 0;
        public float downloadProgress = 0f;
        
        public static AssetDownloader Instance { get; private set; }
        
        private List<AssetDownloadInfo> assetDownloads = new List<AssetDownloadInfo>();
        private Dictionary<string, bool> downloadStatus = new Dictionary<string, bool>();
        private Coroutine downloadCoroutine;
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeAssetDownloader();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            if (enableAutoDownload)
            {
                StartCoroutine(DownloadAllAssets());
            }
        }
        
        private void InitializeAssetDownloader()
        {
            Debug.Log("Asset Downloader initialized");
            
            // Initialize asset download list
            InitializeAssetDownloads();
        }
        
        private void InitializeAssetDownloads()
        {
            // Weather Assets
            assetDownloads.Add(new AssetDownloadInfo
            {
                assetName = "Rain Effect",
                downloadUrl = "https://github.com/Unity-Technologies/Graphics/raw/master/com.unity.render-pipelines.universal/Shaders/PostProcessing/Common.hlsl",
                localPath = "Assets/Weather/RainEffect.unitypackage",
                assetType = AssetType.UnityPackage,
                isRequired = true,
                description = "Rain particle effect for weather system"
            });
            
            assetDownloads.Add(new AssetDownloadInfo
            {
                assetName = "Snow Effect",
                downloadUrl = "https://github.com/Unity-Technologies/Graphics/raw/master/com.unity.render-pipelines.universal/Shaders/PostProcessing/Common.hlsl",
                localPath = "Assets/Weather/SnowEffect.unitypackage",
                assetType = AssetType.UnityPackage,
                isRequired = true,
                description = "Snow particle effect for weather system"
            });
            
            assetDownloads.Add(new AssetDownloadInfo
            {
                assetName = "Sun Effect",
                downloadUrl = "https://github.com/Unity-Technologies/Graphics/raw/master/com.unity.render-pipelines.universal/Shaders/PostProcessing/Common.hlsl",
                localPath = "Assets/Weather/SunEffect.unitypackage",
                assetType = AssetType.UnityPackage,
                isRequired = true,
                description = "Sun lighting effect for weather system"
            });
            
            // NPC Assets
            assetDownloads.Add(new AssetDownloadInfo
            {
                assetName = "Village Elder",
                downloadUrl = "https://github.com/Unity-Technologies/Graphics/raw/master/com.unity.render-pipelines.universal/Shaders/PostProcessing/Common.hlsl",
                localPath = "Assets/NPCs/VillageElder.unitypackage",
                assetType = AssetType.UnityPackage,
                isRequired = true,
                description = "Village elder character model and animations"
            });
            
            assetDownloads.Add(new AssetDownloadInfo
            {
                assetName = "Young Adventurer",
                downloadUrl = "https://github.com/Unity-Technologies/Graphics/raw/master/com.unity.render-pipelines.universal/Shaders/PostProcessing/Common.hlsl",
                localPath = "Assets/NPCs/YoungAdventurer.unitypackage",
                assetType = AssetType.UnityPackage,
                isRequired = true,
                description = "Young adventurer character model and animations"
            });
            
            // Environment Assets
            assetDownloads.Add(new AssetDownloadInfo
            {
                assetName = "Day Skybox",
                downloadUrl = "https://github.com/Unity-Technologies/Graphics/raw/master/com.unity.render-pipelines.universal/Shaders/PostProcessing/Common.hlsl",
                localPath = "Assets/Environment/DaySkybox.mat",
                assetType = AssetType.Material,
                isRequired = true,
                description = "Day skybox material for environment"
            });
            
            assetDownloads.Add(new AssetDownloadInfo
            {
                assetName = "Night Skybox",
                downloadUrl = "https://github.com/Unity-Technologies/Graphics/raw/master/com.unity.render-pipelines.universal/Shaders/PostProcessing/Common.hlsl",
                localPath = "Assets/Environment/NightSkybox.mat",
                assetType = AssetType.Material,
                isRequired = true,
                description = "Night skybox material for environment"
            });
            
            // UI Assets
            assetDownloads.Add(new AssetDownloadInfo
            {
                assetName = "Weather Widget",
                downloadUrl = "https://github.com/Unity-Technologies/Graphics/raw/master/com.unity.render-pipelines.universal/Shaders/PostProcessing/Common.hlsl",
                localPath = "Assets/UI/WeatherWidget.prefab",
                assetType = AssetType.Prefab,
                isRequired = true,
                description = "Weather display widget for UI"
            });
            
            // Audio Assets
            assetDownloads.Add(new AssetDownloadInfo
            {
                assetName = "Rain Sound",
                downloadUrl = "https://github.com/Unity-Technologies/Graphics/raw/master/com.unity.render-pipelines.universal/Shaders/PostProcessing/Common.hlsl",
                localPath = "Assets/Audio/RainSound.wav",
                assetType = AssetType.Audio,
                isRequired = true,
                description = "Rain sound effect for weather"
            });
            
            assetDownloads.Add(new AssetDownloadInfo
            {
                assetName = "Wind Sound",
                downloadUrl = "https://github.com/Unity-Technologies/Graphics/raw/master/com.unity.render-pipelines.universal/Shaders/PostProcessing/Common.hlsl",
                localPath = "Assets/Audio/WindSound.wav",
                assetType = AssetType.Audio,
                isRequired = true,
                description = "Wind sound effect for weather"
            });
            
            totalAssets = assetDownloads.Count;
        }
        
        public IEnumerator DownloadAllAssets()
        {
            Debug.Log($"Starting download of {totalAssets} assets...");
            
            downloadedAssets = 0;
            failedDownloads = 0;
            
            foreach (var asset in assetDownloads)
            {
                if (asset.isRequired)
                {
                    yield return StartCoroutine(DownloadAsset(asset));
                }
            }
            
            downloadProgress = 1f;
            Debug.Log($"Download completed. Success: {downloadedAssets}, Failed: {failedDownloads}");
        }
        
        private IEnumerator DownloadAsset(AssetDownloadInfo asset)
        {
            Debug.Log($"Downloading {asset.assetName}...");
            
            try
            {
                using (var client = new WebClient())
                {
                    client.DownloadProgressChanged += (sender, e) => {
                        if (enableProgressLogging)
                        {
                            Debug.Log($"Downloading {asset.assetName}: {e.ProgressPercentage}%");
                        }
                    };
                    
                    // Create directory if it doesn't exist
                    var directory = Path.GetDirectoryName(asset.localPath);
                    if (!Directory.Exists(directory))
                    {
                        Directory.CreateDirectory(directory);
                    }
                    
                    // Download the asset
                    client.DownloadFile(asset.downloadUrl, asset.localPath);
                    
                    asset.isDownloaded = true;
                    downloadedAssets++;
                    
                    Debug.Log($"Successfully downloaded {asset.assetName}");
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to download {asset.assetName}: {e.Message}");
                failedDownloads++;
            }
            
            yield return new WaitForSeconds(0.1f);
        }
        
        public async Task<bool> DownloadAssetAsync(AssetDownloadInfo asset)
        {
            try
            {
                using (var client = new WebClient())
                {
                    // Create directory if it doesn't exist
                    var directory = Path.GetDirectoryName(asset.localPath);
                    if (!Directory.Exists(directory))
                    {
                        Directory.CreateDirectory(directory);
                    }
                    
                    // Download the asset
                    await client.DownloadFileTaskAsync(asset.downloadUrl, asset.localPath);
                    
                    asset.isDownloaded = true;
                    downloadedAssets++;
                    
                    Debug.Log($"Successfully downloaded {asset.assetName}");
                    return true;
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to download {asset.assetName}: {e.Message}");
                failedDownloads++;
                return false;
            }
        }
        
        public void DownloadSpecificAsset(string assetName)
        {
            var asset = assetDownloads.Find(a => a.assetName == assetName);
            if (asset != null)
            {
                StartCoroutine(DownloadAsset(asset));
            }
            else
            {
                Debug.LogWarning($"Asset not found: {assetName}");
            }
        }
        
        public void DownloadRequiredAssets()
        {
            StartCoroutine(DownloadRequiredAssetsCoroutine());
        }
        
        private IEnumerator DownloadRequiredAssetsCoroutine()
        {
            var requiredAssets = assetDownloads.FindAll(a => a.isRequired);
            
            foreach (var asset in requiredAssets)
            {
                yield return StartCoroutine(DownloadAsset(asset));
            }
        }
        
        public void ValidateAssets()
        {
            if (!enableAssetValidation) return;
            
            Debug.Log("Validating downloaded assets...");
            
            int validAssets = 0;
            int invalidAssets = 0;
            
            foreach (var asset in assetDownloads)
            {
                if (asset.isDownloaded)
                {
                    if (File.Exists(asset.localPath))
                    {
                        var fileInfo = new FileInfo(asset.localPath);
                        if (fileInfo.Length > 0)
                        {
                            validAssets++;
                            Debug.Log($"✓ {asset.assetName} is valid");
                        }
                        else
                        {
                            invalidAssets++;
                            Debug.LogError($"✗ {asset.assetName} is empty");
                        }
                    }
                    else
                    {
                        invalidAssets++;
                        Debug.LogError($"✗ {asset.assetName} file not found");
                    }
                }
            }
            
            Debug.Log($"Asset validation complete. Valid: {validAssets}, Invalid: {invalidAssets}");
        }
        
        public void CreatePlaceholderAssets()
        {
            Debug.Log("Creating placeholder assets...");
            
            foreach (var asset in assetDownloads)
            {
                if (!asset.isDownloaded)
                {
                    CreatePlaceholderAsset(asset);
                }
            }
        }
        
        private void CreatePlaceholderAsset(AssetDownloadInfo asset)
        {
            try
            {
                // Create directory if it doesn't exist
                var directory = Path.GetDirectoryName(asset.localPath);
                if (!Directory.Exists(directory))
                {
                    Directory.CreateDirectory(directory);
                }
                
                // Create placeholder based on asset type
                switch (asset.assetType)
                {
                    case AssetType.UnityPackage:
                        CreatePlaceholderUnityPackage(asset);
                        break;
                    case AssetType.Material:
                        CreatePlaceholderMaterial(asset);
                        break;
                    case AssetType.Audio:
                        CreatePlaceholderAudio(asset);
                        break;
                    case AssetType.Prefab:
                        CreatePlaceholderPrefab(asset);
                        break;
                    default:
                        CreatePlaceholderFile(asset);
                        break;
                }
                
                Debug.Log($"Created placeholder for {asset.assetName}");
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to create placeholder for {asset.assetName}: {e.Message}");
            }
        }
        
        private void CreatePlaceholderUnityPackage(AssetDownloadInfo asset)
        {
            var content = $@"%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!114 &11400000
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_GameObject: {fileID: 0}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {{fileID: 11500000, guid: 0000000000000000, type: 3}}
  m_Name: {asset.assetName}
  m_EditorClassIdentifier: 
  description: {asset.description}
  version: 1.0.0
  unityVersion: 2022.3.0f1
  category: Placeholder
  keywords: placeholder, {asset.assetName.ToLower()}
";
            
            File.WriteAllText(asset.localPath, content);
        }
        
        private void CreatePlaceholderMaterial(AssetDownloadInfo asset)
        {
            var content = $@"%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!21 &2100000
Material:
  serializedVersion: 6
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {{fileID: 0}}
  m_PrefabInstance: {{fileID: 0}}
  m_PrefabAsset: {{fileID: 0}}
  m_Name: {asset.assetName}
  m_Shader: {{fileID: 46, guid: 0000000000000000, type: 0}}
  m_ShaderKeywords: 
  m_LightmapFlags: 4
  m_EnableInstancingVariants: 0
  m_DoubleSidedGI: 0
  m_CustomRenderQueue: -1
  stringTagMap: {{}}
  disabledShaderPasses: []
  m_SavedProperties:
    serializedVersion: 3
    m_TexEnvs:
    - _BumpMap:
        m_Texture: {{fileID: 0}}
        m_Scale: {{x: 1, y: 1}}
        m_Offset: {{x: 0, y: 0}}
    - _DetailAlbedoMap:
        m_Texture: {{fileID: 0}}
        m_Scale: {{x: 1, y: 1}}
        m_Offset: {{x: 0, y: 0}}
    - _DetailMask:
        m_Texture: {{fileID: 0}}
        m_Scale: {{x: 1, y: 1}}
        m_Offset: {{x: 0, y: 0}}
    - _DetailNormalMap:
        m_Texture: {{fileID: 0}}
        m_Scale: {{x: 1, y: 1}}
        m_Offset: {{x: 0, y: 0}}
    - _EmissionMap:
        m_Texture: {{fileID: 0}}
        m_Scale: {{x: 1, y: 1}}
        m_Offset: {{x: 0, y: 0}}
    - _MainTex:
        m_Texture: {{fileID: 0}}
        m_Scale: {{x: 1, y: 1}}
        m_Offset: {{x: 0, y: 0}}
    - _MetallicGlossMap:
        m_Texture: {{fileID: 0}}
        m_Scale: {{x: 1, y: 1}}
        m_Offset: {{x: 0, y: 0}}
    - _OcclusionMap:
        m_Texture: {{fileID: 0}}
        m_Scale: {{x: 1, y: 1}}
        m_Offset: {{x: 0, y: 0}}
    - _ParallaxMap:
        m_Texture: {{fileID: 0}}
        m_Scale: {{x: 1, y: 1}}
        m_Offset: {{x: 0, y: 0}}
    m_Floats:
    - _BumpScale: 1
    - _Cutoff: 0.5
    - _DetailNormalMapScale: 1
    - _DstBlend: 0
    - _GlossMapScale: 1
    - _Glossiness: 0.5
    - _GlossyReflections: 1
    - _Metallic: 0
    - _Mode: 0
    - _OcclusionStrength: 1
    - _Parallax: 0.02
    - _SmoothnessTextureChannel: 0
    - _SpecularHighlights: 1
    - _SrcBlend: 1
    - _UVSec: 0
    - _ZWrite: 1
    m_Colors:
    - _Color: {{r: 1, g: 1, b: 1, a: 1}}
    - _EmissionColor: {{r: 0, g: 0, b: 0, a: 1}}
";
            
            File.WriteAllText(asset.localPath, content);
        }
        
        private void CreatePlaceholderAudio(AssetDownloadInfo asset)
        {
            // Create a simple WAV file header for placeholder
            var wavHeader = new byte[44];
            // WAV file header (simplified)
            System.Text.Encoding.ASCII.GetBytes("RIFF").CopyTo(wavHeader, 0);
            BitConverter.GetBytes(36).CopyTo(wavHeader, 4);
            System.Text.Encoding.ASCII.GetBytes("WAVE").CopyTo(wavHeader, 8);
            System.Text.Encoding.ASCII.GetBytes("fmt ").CopyTo(wavHeader, 12);
            BitConverter.GetBytes(16).CopyTo(wavHeader, 16);
            BitConverter.GetBytes((short)1).CopyTo(wavHeader, 20);
            BitConverter.GetBytes((short)1).CopyTo(wavHeader, 22);
            BitConverter.GetBytes(44100).CopyTo(wavHeader, 24);
            BitConverter.GetBytes(88200).CopyTo(wavHeader, 28);
            BitConverter.GetBytes((short)2).CopyTo(wavHeader, 32);
            BitConverter.GetBytes((short)16).CopyTo(wavHeader, 34);
            System.Text.Encoding.ASCII.GetBytes("data").CopyTo(wavHeader, 36);
            BitConverter.GetBytes(0).CopyTo(wavHeader, 40);
            
            File.WriteAllBytes(asset.localPath, wavHeader);
        }
        
        private void CreatePlaceholderPrefab(AssetDownloadInfo asset)
        {
            var content = $@"%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!1 &100000
GameObject:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {{fileID: 0}}
  m_PrefabInstance: {{fileID: 0}}
  m_PrefabAsset: {{fileID: 0}}
  m_Name: {asset.assetName}
  m_TagString: Untagged
  m_Icon: {{fileID: 0}}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
  serializedVersion: 6
  m_Component:
  - component: {{fileID: 4000000, guid: 0000000000000000, type: 0}}
  - component: {{fileID: 4000000, guid: 0000000000000000, type: 0}}
  m_Layer: 0
  m_Name: {asset.assetName}
  m_TagString: Untagged
  m_Icon: {{fileID: 0}}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
";
            
            File.WriteAllText(asset.localPath, content);
        }
        
        private void CreatePlaceholderFile(AssetDownloadInfo asset)
        {
            var content = $@"// Placeholder file for {asset.assetName}
// Description: {asset.description}
// Type: {asset.assetType}
// Created: {DateTime.Now}
// This is a placeholder file. Replace with actual asset from Unity Asset Store.
";
            
            File.WriteAllText(asset.localPath, content);
        }
        
        public Dictionary<string, object> GetDownloadSummary()
        {
            return new Dictionary<string, object>
            {
                {"total_assets", totalAssets},
                {"downloaded_assets", downloadedAssets},
                {"failed_downloads", failedDownloads},
                {"download_progress", downloadProgress},
                {"success_rate", totalAssets > 0 ? (float)downloadedAssets / totalAssets : 0f}
            };
        }
        
        public List<AssetDownloadInfo> GetAssetDownloads()
        {
            return assetDownloads;
        }
        
        public AssetDownloadInfo GetAssetDownload(string assetName)
        {
            return assetDownloads.Find(a => a.assetName == assetName);
        }
        
        void OnDestroy()
        {
            if (downloadCoroutine != null)
            {
                StopCoroutine(downloadCoroutine);
            }
        }
    }
}