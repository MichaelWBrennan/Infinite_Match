using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;
using System.Text;
using Evergreen.Core;

namespace Evergreen.Social
{
    /// <summary>
    /// Key-Free Social Manager
    /// Uses native browser APIs and open services for social sharing without API keys
    /// </summary>
    public class KeyFreeSocialManager : MonoBehaviour
    {
        [Header("Social Configuration")]
        [SerializeField] private bool enableSocialSharing = true;
        [SerializeField] private bool enableNativeSharing = true;
        [SerializeField] private bool enableQRSharing = true;
        [SerializeField] private bool enableP2PSharing = true;
        
        [Header("Sharing Settings")]
        [SerializeField] private string gameTitle = "Evergreen Match";
        [SerializeField] private string gameUrl = "https://yourgame.com";
        [SerializeField] private string shareMessage = "Check out my amazing score in Evergreen Match!";
        
        [Header("QR Code Settings")]
        [SerializeField] private int qrCodeSize = 200;
        [SerializeField] private string qrCodeProvider = "qrserver.com";
        
        // Singleton
        public static KeyFreeSocialManager Instance { get; private set; }
        
        // Services
        private GameAnalyticsManager analyticsManager;
        
        // Social data
        private Dictionary<string, object> socialStats = new Dictionary<string, object>();
        private List<ShareRecord> shareHistory = new List<ShareRecord>();
        
        // Events
        public System.Action<string> OnShareSuccess;
        public System.Action<string> OnShareError;
        public System.Action<ShareRecord> OnShareCompleted;
        public System.Action<string> OnQRCodeGenerated;
        
        [System.Serializable]
        public class ShareRecord
        {
            public string id;
            public string platform;
            public string content;
            public DateTime timestamp;
            public bool success;
            public string error;
        }
        
        [System.Serializable]
        public class QRCodeData
        {
            public string url;
            public string data;
            public int size;
            public string provider;
        }
        
        public enum SharePlatform
        {
            Native,     // Browser's native share API
            QR,        // QR code generation
            P2P,       // Peer-to-peer sharing
            Clipboard, // Copy to clipboard
            Email,     // Email sharing
            SMS        // SMS sharing
        }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeSocialManager();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            if (enableSocialSharing)
            {
                InitializeSocialSystem();
            }
        }
        
        private void InitializeSocialManager()
        {
            analyticsManager = GameAnalyticsManager.Instance;
            socialStats["totalShares"] = 0;
            socialStats["successfulShares"] = 0;
            socialStats["failedShares"] = 0;
        }
        
        private void InitializeSocialSystem()
        {
            Debug.Log("Initializing Key-Free Social System");
            
            // Check for native sharing support
            CheckNativeSharingSupport();
            
            Debug.Log("Key-Free Social System initialized successfully");
        }
        
        private void CheckNativeSharingSupport()
        {
            if (Application.platform == RuntimePlatform.WebGLPlayer)
            {
                string jsCode = @"
                    if (navigator.share) {
                        SendMessage('KeyFreeSocialManager', 'OnNativeSharingSupported', 'true');
                    } else {
                        SendMessage('KeyFreeSocialManager', 'OnNativeSharingSupported', 'false');
                    }
                ";
                
                Application.ExternalEval(jsCode);
            }
        }
        
        public void OnNativeSharingSupported(string supported)
        {
            bool isSupported = supported == "true";
            Debug.Log($"Native sharing supported: {isSupported}");
            
            if (!isSupported)
            {
                // Fallback to clipboard sharing
                Debug.Log("Native sharing not supported, using clipboard fallback");
            }
        }
        
        /// <summary>
        /// Share game score using native sharing
        /// </summary>
        public void ShareScore(int score, string additionalMessage = "")
        {
            string content = $"{shareMessage}\n\nScore: {score}\n{additionalMessage}\n\nPlay now: {gameUrl}";
            ShareContent(content, SharePlatform.Native);
        }
        
        /// <summary>
        /// Share achievement using native sharing
        /// </summary>
        public void ShareAchievement(string achievementName, string description = "")
        {
            string content = $"I just unlocked '{achievementName}' in {gameTitle}!\n\n{description}\n\nPlay now: {gameUrl}";
            ShareContent(content, SharePlatform.Native);
        }
        
        /// <summary>
        /// Share custom content
        /// </summary>
        public void ShareContent(string content, SharePlatform platform = SharePlatform.Native)
        {
            if (!enableSocialSharing)
            {
                Debug.LogWarning("Social sharing is disabled");
                return;
            }
            
            StartCoroutine(ShareContentCoroutine(content, platform));
        }
        
        private IEnumerator ShareContentCoroutine(string content, SharePlatform platform)
        {
            var shareRecord = new ShareRecord
            {
                id = System.Guid.NewGuid().ToString(),
                platform = platform.ToString(),
                content = content,
                timestamp = DateTime.Now,
                success = false,
                error = ""
            };
            
            try
            {
                switch (platform)
                {
                    case SharePlatform.Native:
                        yield return StartCoroutine(ShareViaNativeAPI(content, shareRecord));
                        break;
                    
                    case SharePlatform.QR:
                        yield return StartCoroutine(ShareViaQRCode(content, shareRecord));
                        break;
                    
                    case SharePlatform.P2P:
                        yield return StartCoroutine(ShareViaP2P(content, shareRecord));
                        break;
                    
                    case SharePlatform.Clipboard:
                        yield return StartCoroutine(ShareViaClipboard(content, shareRecord));
                        break;
                    
                    case SharePlatform.Email:
                        yield return StartCoroutine(ShareViaEmail(content, shareRecord));
                        break;
                    
                    case SharePlatform.SMS:
                        yield return StartCoroutine(ShareViaSMS(content, shareRecord));
                        break;
                }
            }
            catch (Exception e)
            {
                shareRecord.success = false;
                shareRecord.error = e.Message;
                OnShareError?.Invoke(e.Message);
            }
            
            // Record the share attempt
            shareHistory.Add(shareRecord);
            UpdateSocialStats(shareRecord.success);
            
            // Notify listeners
            OnShareCompleted?.Invoke(shareRecord);
        }
        
        private IEnumerator ShareViaNativeAPI(string content, ShareRecord record)
        {
            if (Application.platform == RuntimePlatform.WebGLPlayer)
            {
                // Use browser's native share API
                string jsCode = $@"
                    if (navigator.share) {{
                        navigator.share({{
                            title: '{gameTitle}',
                            text: '{content}',
                            url: '{gameUrl}'
                        }}).then(function() {{
                            SendMessage('KeyFreeSocialManager', 'OnNativeShareSuccess', '');
                        }}).catch(function(error) {{
                            SendMessage('KeyFreeSocialManager', 'OnNativeShareError', error.message);
                        }});
                    }} else {{
                        // Fallback to clipboard
                        navigator.clipboard.writeText('{content}').then(function() {{
                            SendMessage('KeyFreeSocialManager', 'OnNativeShareSuccess', 'clipboard');
                        }}).catch(function(error) {{
                            SendMessage('KeyFreeSocialManager', 'OnNativeShareError', error.message);
                        }});
                    }}
                ";
                
                Application.ExternalEval(jsCode);
                
                // Wait for response
                float timeout = 10f;
                float elapsed = 0f;
                
                while (elapsed < timeout && !record.success && string.IsNullOrEmpty(record.error))
                {
                    yield return new WaitForSeconds(0.1f);
                    elapsed += 0.1f;
                }
            }
            else
            {
                // For non-WebGL platforms, use clipboard
                yield return StartCoroutine(ShareViaClipboard(content, record));
            }
        }
        
        public void OnNativeShareSuccess(string method)
        {
            Debug.Log($"Native share successful via {method}");
            var lastRecord = shareHistory[shareHistory.Count - 1];
            lastRecord.success = true;
            lastRecord.error = "";
            OnShareSuccess?.Invoke(method);
        }
        
        public void OnNativeShareError(string error)
        {
            Debug.LogError($"Native share failed: {error}");
            var lastRecord = shareHistory[shareHistory.Count - 1];
            lastRecord.success = false;
            lastRecord.error = error;
            OnShareError?.Invoke(error);
        }
        
        private IEnumerator ShareViaQRCode(string content, ShareRecord record)
        {
            if (!enableQRSharing)
            {
                record.error = "QR sharing is disabled";
                yield break;
            }
            
            // Generate QR code data
            string qrData = $"{gameUrl}?share={System.Uri.EscapeDataString(content)}";
            
            // Use free QR code service
            string qrUrl = $"https://api.qrserver.com/v1/create-qr-code/?size={qrCodeSize}x{qrCodeSize}&data={System.Uri.EscapeDataString(qrData)}";
            
            // Load QR code image
            using (UnityEngine.Networking.UnityWebRequest request = UnityEngine.Networking.UnityWebRequestTexture.GetTexture(qrUrl))
            {
                yield return request.SendWebRequest();
                
                if (request.result == UnityEngine.Networking.UnityWebRequest.Result.Success)
                {
                    Texture2D qrTexture = UnityEngine.Networking.DownloadHandlerTexture.GetContent(request);
                    
                    // Display QR code in game
                    DisplayQRCode(qrTexture, content);
                    
                    record.success = true;
                    OnQRCodeGenerated?.Invoke(qrUrl);
                }
                else
                {
                    record.error = request.error;
                }
            }
        }
        
        private void DisplayQRCode(Texture2D qrTexture, string content)
        {
            // This would integrate with your UI system to display the QR code
            Debug.Log($"QR Code generated for: {content}");
            
            // You could create a UI panel to show the QR code
            // For now, just log the success
        }
        
        private IEnumerator ShareViaP2P(string content, ShareRecord record)
        {
            if (!enableP2PSharing)
            {
                record.error = "P2P sharing is disabled";
                yield break;
            }
            
            // Generate room code for P2P sharing
            string roomCode = GenerateRoomCode();
            
            // Store content in local storage with room code
            PlayerPrefs.SetString($"p2p_share_{roomCode}", content);
            PlayerPrefs.SetString($"p2p_share_{roomCode}_timestamp", DateTime.Now.ToString());
            
            // Display room code to user
            DisplayRoomCode(roomCode);
            
            record.success = true;
            Debug.Log($"P2P share room created: {roomCode}");
        }
        
        private string GenerateRoomCode()
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            var random = new System.Random();
            var result = new System.Text.StringBuilder(6);
            
            for (int i = 0; i < 6; i++)
            {
                result.Append(chars[random.Next(chars.Length)]);
            }
            
            return result.ToString();
        }
        
        private void DisplayRoomCode(string roomCode)
        {
            // This would integrate with your UI system
            Debug.Log($"Share room code: {roomCode}");
        }
        
        private IEnumerator ShareViaClipboard(string content, ShareRecord record)
        {
            if (Application.platform == RuntimePlatform.WebGLPlayer)
            {
                string jsCode = $@"
                    navigator.clipboard.writeText('{content}').then(function() {{
                        SendMessage('KeyFreeSocialManager', 'OnClipboardSuccess', '');
                    }}).catch(function(error) {{
                        SendMessage('KeyFreeSocialManager', 'OnClipboardError', error.message);
                    }});
                ";
                
                Application.ExternalEval(jsCode);
                
                // Wait for response
                float timeout = 5f;
                float elapsed = 0f;
                
                while (elapsed < timeout && !record.success && string.IsNullOrEmpty(record.error))
                {
                    yield return new WaitForSeconds(0.1f);
                    elapsed += 0.1f;
                }
            }
            else
            {
                // For non-WebGL platforms, use Unity's text editor
                GUIUtility.systemCopyBuffer = content;
                record.success = true;
            }
        }
        
        public void OnClipboardSuccess(string data)
        {
            Debug.Log("Content copied to clipboard");
            var lastRecord = shareHistory[shareHistory.Count - 1];
            lastRecord.success = true;
            OnShareSuccess?.Invoke("clipboard");
        }
        
        public void OnClipboardError(string error)
        {
            Debug.LogError($"Clipboard copy failed: {error}");
            var lastRecord = shareHistory[shareHistory.Count - 1];
            lastRecord.success = false;
            lastRecord.error = error;
            OnShareError?.Invoke(error);
        }
        
        private IEnumerator ShareViaEmail(string content, ShareRecord record)
        {
            string subject = $"{gameTitle} - Check out my score!";
            string body = $"{content}\n\nPlay now: {gameUrl}";
            string mailtoUrl = $"mailto:?subject={System.Uri.EscapeDataString(subject)}&body={System.Uri.EscapeDataString(body)}";
            
            if (Application.platform == RuntimePlatform.WebGLPlayer)
            {
                string jsCode = $@"
                    window.open('{mailtoUrl}', '_blank');
                    SendMessage('KeyFreeSocialManager', 'OnEmailSuccess', '');
                ";
                
                Application.ExternalEval(jsCode);
            }
            else
            {
                Application.OpenURL(mailtoUrl);
            }
            
            record.success = true;
            yield return null;
        }
        
        private IEnumerator ShareViaSMS(string content, ShareRecord record)
        {
            string smsUrl = $"sms:?body={System.Uri.EscapeDataString(content)}";
            
            if (Application.platform == RuntimePlatform.WebGLPlayer)
            {
                string jsCode = $@"
                    window.open('{smsUrl}', '_blank');
                    SendMessage('KeyFreeSocialManager', 'OnSMSSuccess', '');
                ";
                
                Application.ExternalEval(jsCode);
            }
            else
            {
                Application.OpenURL(smsUrl);
            }
            
            record.success = true;
            yield return null;
        }
        
        private void UpdateSocialStats(bool success)
        {
            socialStats["totalShares"] = (int)socialStats["totalShares"] + 1;
            
            if (success)
            {
                socialStats["successfulShares"] = (int)socialStats["successfulShares"] + 1;
            }
            else
            {
                socialStats["failedShares"] = (int)socialStats["failedShares"] + 1;
            }
        }
        
        /// <summary>
        /// Get social sharing statistics
        /// </summary>
        public Dictionary<string, object> GetSocialStats()
        {
            return new Dictionary<string, object>(socialStats);
        }
        
        /// <summary>
        /// Get share history
        /// </summary>
        public List<ShareRecord> GetShareHistory()
        {
            return new List<ShareRecord>(shareHistory);
        }
        
        /// <summary>
        /// Clear share history
        /// </summary>
        public void ClearShareHistory()
        {
            shareHistory.Clear();
        }
        
        /// <summary>
        /// Set game information for sharing
        /// </summary>
        public void SetGameInfo(string title, string url, string message)
        {
            gameTitle = title;
            gameUrl = url;
            shareMessage = message;
        }
        
        /// <summary>
        /// Enable/disable social sharing
        /// </summary>
        public void SetSocialSharingEnabled(bool enabled)
        {
            enableSocialSharing = enabled;
        }
        
        /// <summary>
        /// Enable/disable specific sharing methods
        /// </summary>
        public void SetSharingMethodEnabled(SharePlatform platform, bool enabled)
        {
            switch (platform)
            {
                case SharePlatform.Native:
                    enableNativeSharing = enabled;
                    break;
                case SharePlatform.QR:
                    enableQRSharing = enabled;
                    break;
                case SharePlatform.P2P:
                    enableP2PSharing = enabled;
                    break;
            }
        }
        
        void OnDestroy()
        {
            // Clean up
        }
    }
}