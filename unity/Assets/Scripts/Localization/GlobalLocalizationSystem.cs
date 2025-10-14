using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Globalization;
using System.Threading.Tasks;

namespace Evergreen.Localization
{
    /// <summary>
    /// Global localization system with smart language detection based on regions
    /// </summary>
    public class GlobalLocalizationSystem : MonoBehaviour
    {
        [Header("Localization Settings")]
        [SerializeField] private bool enableAutoDetection = true;
        [SerializeField] private bool enableRegionBasedLanguage = true;
        [SerializeField] private bool enableFallbackLanguage = true;
        [SerializeField] private string fallbackLanguage = "en";
        
        [Header("Supported Languages")]
        [SerializeField] private List<LanguageConfig> supportedLanguages = new List<LanguageConfig>();
        
        [Header("Region Settings")]
        [SerializeField] private bool enableRegionDetection = true;
        [SerializeField] private bool enableCurrencyLocalization = true;
        [SerializeField] private bool enableDateFormatting = true;
        [SerializeField] private bool enableNumberFormatting = true;
        
        private Dictionary<string, LanguageConfig> _languageMap = new Dictionary<string, LanguageConfig>();
        private Dictionary<string, RegionConfig> _regionMap = new Dictionary<string, RegionConfig>();
        private string _currentLanguage = "en";
        private string _currentRegion = "US";
        private bool _isInitialized = false;
        
        // Events
        public System.Action<string> OnLanguageChanged;
        public System.Action<string> OnRegionChanged;
        public System.Action<LanguageConfig> OnLanguageConfigLoaded;
        
        void Start()
        {
            InitializeLocalizationSystem();
        }
        
        private void InitializeLocalizationSystem()
        {
            Debug.Log("🌍 Initializing Global Localization System...");
            
            // Initialize default languages
            InitializeDefaultLanguages();
            
            // Initialize regions
            InitializeRegions();
            
            // Detect current language and region
            if (enableAutoDetection)
            {
                DetectLanguageAndRegion();
            }
            
            // Load language data
            LoadLanguageData();
            
            _isInitialized = true;
            Debug.Log($"🌍 Localization system initialized: {_currentLanguage} ({_currentRegion})");
        }
        
        private void InitializeDefaultLanguages()
        {
            Debug.Log("🌍 Initializing default languages...");
            
            // Add comprehensive language support
            var defaultLanguages = new List<LanguageConfig>
            {
                // Major Languages (Global)
                new LanguageConfig { code = "en", name = "English", nativeName = "English", region = "US", priority = 1 },
                new LanguageConfig { code = "zh", name = "Chinese", nativeName = "中文", region = "CN", priority = 1 },
                new LanguageConfig { code = "es", name = "Spanish", nativeName = "Español", region = "ES", priority = 1 },
                new LanguageConfig { code = "hi", name = "Hindi", nativeName = "हिन्दी", region = "IN", priority = 1 },
                new LanguageConfig { code = "ar", name = "Arabic", nativeName = "العربية", region = "SA", priority = 1 },
                new LanguageConfig { code = "pt", name = "Portuguese", nativeName = "Português", region = "BR", priority = 1 },
                new LanguageConfig { code = "bn", name = "Bengali", nativeName = "বাংলা", region = "BD", priority = 1 },
                new LanguageConfig { code = "ru", name = "Russian", nativeName = "Русский", region = "RU", priority = 1 },
                new LanguageConfig { code = "ja", name = "Japanese", nativeName = "日本語", region = "JP", priority = 1 },
                new LanguageConfig { code = "pa", name = "Punjabi", nativeName = "ਪੰਜਾਬੀ", region = "IN", priority = 2 },
                
                // European Languages
                new LanguageConfig { code = "fr", name = "French", nativeName = "Français", region = "FR", priority = 1 },
                new LanguageConfig { code = "de", name = "German", nativeName = "Deutsch", region = "DE", priority = 1 },
                new LanguageConfig { code = "it", name = "Italian", nativeName = "Italiano", region = "IT", priority = 1 },
                new LanguageConfig { code = "nl", name = "Dutch", nativeName = "Nederlands", region = "NL", priority = 2 },
                new LanguageConfig { code = "sv", name = "Swedish", nativeName = "Svenska", region = "SE", priority = 2 },
                new LanguageConfig { code = "no", name = "Norwegian", nativeName = "Norsk", region = "NO", priority = 2 },
                new LanguageConfig { code = "da", name = "Danish", nativeName = "Dansk", region = "DK", priority = 2 },
                new LanguageConfig { code = "fi", name = "Finnish", nativeName = "Suomi", region = "FI", priority = 2 },
                new LanguageConfig { code = "pl", name = "Polish", nativeName = "Polski", region = "PL", priority = 2 },
                new LanguageConfig { code = "tr", name = "Turkish", nativeName = "Türkçe", region = "TR", priority = 2 },
                
                // Asian Languages
                new LanguageConfig { code = "ko", name = "Korean", nativeName = "한국어", region = "KR", priority = 1 },
                new LanguageConfig { code = "th", name = "Thai", nativeName = "ไทย", region = "TH", priority = 2 },
                new LanguageConfig { code = "vi", name = "Vietnamese", nativeName = "Tiếng Việt", region = "VN", priority = 2 },
                new LanguageConfig { code = "id", name = "Indonesian", nativeName = "Bahasa Indonesia", region = "ID", priority = 2 },
                new LanguageConfig { code = "ms", name = "Malay", nativeName = "Bahasa Melayu", region = "MY", priority = 2 },
                new LanguageConfig { code = "tl", name = "Filipino", nativeName = "Filipino", region = "PH", priority = 2 },
                
                // African Languages
                new LanguageConfig { code = "sw", name = "Swahili", nativeName = "Kiswahili", region = "KE", priority = 2 },
                new LanguageConfig { code = "am", name = "Amharic", nativeName = "አማርኛ", region = "ET", priority = 2 },
                new LanguageConfig { code = "yo", name = "Yoruba", nativeName = "Yorùbá", region = "NG", priority = 2 },
                new LanguageConfig { code = "ig", name = "Igbo", nativeName = "Igbo", region = "NG", priority = 2 },
                new LanguageConfig { code = "ha", name = "Hausa", nativeName = "Hausa", region = "NG", priority = 2 },
                
                // Latin American Languages
                new LanguageConfig { code = "es-MX", name = "Spanish (Mexico)", nativeName = "Español (México)", region = "MX", priority = 2 },
                new LanguageConfig { code = "es-AR", name = "Spanish (Argentina)", nativeName = "Español (Argentina)", region = "AR", priority = 2 },
                new LanguageConfig { code = "pt-BR", name = "Portuguese (Brazil)", nativeName = "Português (Brasil)", region = "BR", priority = 1 },
                
                // Regional Variants
                new LanguageConfig { code = "zh-CN", name = "Chinese (Simplified)", nativeName = "中文 (简体)", region = "CN", priority = 1 },
                new LanguageConfig { code = "zh-TW", name = "Chinese (Traditional)", nativeName = "中文 (繁體)", region = "TW", priority = 1 },
                new LanguageConfig { code = "zh-HK", name = "Chinese (Hong Kong)", nativeName = "中文 (香港)", region = "HK", priority = 2 },
                new LanguageConfig { code = "en-GB", name = "English (UK)", nativeName = "English (UK)", region = "GB", priority = 2 },
                new LanguageConfig { code = "en-AU", name = "English (Australia)", nativeName = "English (Australia)", region = "AU", priority = 2 },
                new LanguageConfig { code = "en-CA", name = "English (Canada)", nativeName = "English (Canada)", region = "CA", priority = 2 },
                new LanguageConfig { code = "fr-CA", name = "French (Canada)", nativeName = "Français (Canada)", region = "CA", priority = 2 },
                new LanguageConfig { code = "de-AT", name = "German (Austria)", nativeName = "Deutsch (Österreich)", region = "AT", priority = 2 },
                new LanguageConfig { code = "de-CH", name = "German (Switzerland)", nativeName = "Deutsch (Schweiz)", region = "CH", priority = 2 }
            };
            
            supportedLanguages = defaultLanguages;
            
            // Create language map
            foreach (var lang in supportedLanguages)
            {
                _languageMap[lang.code] = lang;
            }
            
            Debug.Log($"🌍 Initialized {supportedLanguages.Count} languages");
        }
        
        private void InitializeRegions()
        {
            Debug.Log("🌍 Initializing regions...");
            
            var regions = new List<RegionConfig>
            {
                // Major Regions
                new RegionConfig { code = "US", name = "United States", currency = "USD", timezone = "America/New_York", language = "en" },
                new RegionConfig { code = "CN", name = "China", currency = "CNY", timezone = "Asia/Shanghai", language = "zh-CN" },
                new RegionConfig { code = "IN", name = "India", currency = "INR", timezone = "Asia/Kolkata", language = "hi" },
                new RegionConfig { code = "BR", name = "Brazil", currency = "BRL", timezone = "America/Sao_Paulo", language = "pt-BR" },
                new RegionConfig { code = "RU", name = "Russia", currency = "RUB", timezone = "Europe/Moscow", language = "ru" },
                new RegionConfig { code = "JP", name = "Japan", currency = "JPY", timezone = "Asia/Tokyo", language = "ja" },
                new RegionConfig { code = "DE", name = "Germany", currency = "EUR", timezone = "Europe/Berlin", language = "de" },
                new RegionConfig { code = "FR", name = "France", currency = "EUR", timezone = "Europe/Paris", language = "fr" },
                new RegionConfig { code = "GB", name = "United Kingdom", currency = "GBP", timezone = "Europe/London", language = "en-GB" },
                new RegionConfig { code = "KR", name = "South Korea", currency = "KRW", timezone = "Asia/Seoul", language = "ko" },
                
                // European Regions
                new RegionConfig { code = "ES", name = "Spain", currency = "EUR", timezone = "Europe/Madrid", language = "es" },
                new RegionConfig { code = "IT", name = "Italy", currency = "EUR", timezone = "Europe/Rome", language = "it" },
                new RegionConfig { code = "NL", name = "Netherlands", currency = "EUR", timezone = "Europe/Amsterdam", language = "nl" },
                new RegionConfig { code = "SE", name = "Sweden", currency = "SEK", timezone = "Europe/Stockholm", language = "sv" },
                new RegionConfig { code = "NO", name = "Norway", currency = "NOK", timezone = "Europe/Oslo", language = "no" },
                new RegionConfig { code = "DK", name = "Denmark", currency = "DKK", timezone = "Europe/Copenhagen", language = "da" },
                new RegionConfig { code = "FI", name = "Finland", currency = "EUR", timezone = "Europe/Helsinki", language = "fi" },
                new RegionConfig { code = "PL", name = "Poland", currency = "PLN", timezone = "Europe/Warsaw", language = "pl" },
                new RegionConfig { code = "TR", name = "Turkey", currency = "TRY", timezone = "Europe/Istanbul", language = "tr" },
                
                // Asian Regions
                new RegionConfig { code = "TH", name = "Thailand", currency = "THB", timezone = "Asia/Bangkok", language = "th" },
                new RegionConfig { code = "VN", name = "Vietnam", currency = "VND", timezone = "Asia/Ho_Chi_Minh", language = "vi" },
                new RegionConfig { code = "ID", name = "Indonesia", currency = "IDR", timezone = "Asia/Jakarta", language = "id" },
                new RegionConfig { code = "MY", name = "Malaysia", currency = "MYR", timezone = "Asia/Kuala_Lumpur", language = "ms" },
                new RegionConfig { code = "PH", name = "Philippines", currency = "PHP", timezone = "Asia/Manila", language = "tl" },
                new RegionConfig { code = "TW", name = "Taiwan", currency = "TWD", timezone = "Asia/Taipei", language = "zh-TW" },
                new RegionConfig { code = "HK", name = "Hong Kong", currency = "HKD", timezone = "Asia/Hong_Kong", language = "zh-HK" },
                new RegionConfig { code = "SG", name = "Singapore", currency = "SGD", timezone = "Asia/Singapore", language = "en" },
                
                // African Regions
                new RegionConfig { code = "NG", name = "Nigeria", currency = "NGN", timezone = "Africa/Lagos", language = "en" },
                new RegionConfig { code = "KE", name = "Kenya", currency = "KES", timezone = "Africa/Nairobi", language = "sw" },
                new RegionConfig { code = "ET", name = "Ethiopia", currency = "ETB", timezone = "Africa/Addis_Ababa", language = "am" },
                new RegionConfig { code = "ZA", name = "South Africa", currency = "ZAR", timezone = "Africa/Johannesburg", language = "en" },
                new RegionConfig { code = "EG", name = "Egypt", currency = "EGP", timezone = "Africa/Cairo", language = "ar" },
                
                // Latin American Regions
                new RegionConfig { code = "MX", name = "Mexico", currency = "MXN", timezone = "America/Mexico_City", language = "es-MX" },
                new RegionConfig { code = "AR", name = "Argentina", currency = "ARS", timezone = "America/Argentina/Buenos_Aires", language = "es-AR" },
                new RegionConfig { code = "CO", name = "Colombia", currency = "COP", timezone = "America/Bogota", language = "es" },
                new RegionConfig { code = "PE", name = "Peru", currency = "PEN", timezone = "America/Lima", language = "es" },
                new RegionConfig { code = "CL", name = "Chile", currency = "CLP", timezone = "America/Santiago", language = "es" },
                
                // Middle Eastern Regions
                new RegionConfig { code = "SA", name = "Saudi Arabia", currency = "SAR", timezone = "Asia/Riyadh", language = "ar" },
                new RegionConfig { code = "AE", name = "United Arab Emirates", currency = "AED", timezone = "Asia/Dubai", language = "ar" },
                new RegionConfig { code = "IL", name = "Israel", currency = "ILS", timezone = "Asia/Jerusalem", language = "he" },
                new RegionConfig { code = "IR", name = "Iran", currency = "IRR", timezone = "Asia/Tehran", language = "fa" },
                
                // Oceanic Regions
                new RegionConfig { code = "AU", name = "Australia", currency = "AUD", timezone = "Australia/Sydney", language = "en-AU" },
                new RegionConfig { code = "NZ", name = "New Zealand", currency = "NZD", timezone = "Pacific/Auckland", language = "en" },
                new RegionConfig { code = "CA", name = "Canada", currency = "CAD", timezone = "America/Toronto", language = "en-CA" }
            };
            
            // Create region map
            foreach (var region in regions)
            {
                _regionMap[region.code] = region;
            }
            
            Debug.Log($"🌍 Initialized {regions.Count} regions");
        }
        
        private void DetectLanguageAndRegion()
        {
            Debug.Log("🌍 Detecting language and region...");
            
            // Get system language
            var systemLanguage = Application.systemLanguage;
            var cultureInfo = CultureInfo.CurrentCulture;
            var regionInfo = RegionInfo.CurrentRegion;
            
            // Convert Unity system language to language code
            var detectedLanguage = ConvertSystemLanguageToCode(systemLanguage);
            var detectedRegion = regionInfo.TwoLetterISORegionName;
            
            // Smart language detection based on region
            if (enableRegionBasedLanguage)
            {
                var smartLanguage = GetSmartLanguageForRegion(detectedRegion, detectedLanguage);
                if (smartLanguage != null)
                {
                    detectedLanguage = smartLanguage;
                }
            }
            
            // Set current language and region
            SetLanguage(detectedLanguage);
            SetRegion(detectedRegion);
            
            Debug.Log($"🌍 Detected: {_currentLanguage} ({_currentRegion})");
        }
        
        private string ConvertSystemLanguageToCode(SystemLanguage systemLanguage)
        {
            switch (systemLanguage)
            {
                case SystemLanguage.English: return "en";
                case SystemLanguage.Chinese: return "zh-CN";
                case SystemLanguage.ChineseSimplified: return "zh-CN";
                case SystemLanguage.ChineseTraditional: return "zh-TW";
                case SystemLanguage.Spanish: return "es";
                case SystemLanguage.French: return "fr";
                case SystemLanguage.German: return "de";
                case SystemLanguage.Italian: return "it";
                case SystemLanguage.Japanese: return "ja";
                case SystemLanguage.Korean: return "ko";
                case SystemLanguage.Portuguese: return "pt";
                case SystemLanguage.Russian: return "ru";
                case SystemLanguage.Dutch: return "nl";
                case SystemLanguage.Swedish: return "sv";
                case SystemLanguage.Norwegian: return "no";
                case SystemLanguage.Danish: return "da";
                case SystemLanguage.Finnish: return "fi";
                case SystemLanguage.Polish: return "pl";
                case SystemLanguage.Turkish: return "tr";
                case SystemLanguage.Thai: return "th";
                case SystemLanguage.Vietnamese: return "vi";
                case SystemLanguage.Indonesian: return "id";
                case SystemLanguage.Malay: return "ms";
                case SystemLanguage.Filipino: return "tl";
                case SystemLanguage.Swahili: return "sw";
                case SystemLanguage.Amharic: return "am";
                case SystemLanguage.Arabic: return "ar";
                case SystemLanguage.Hebrew: return "he";
                case SystemLanguage.Persian: return "fa";
                case SystemLanguage.Hindi: return "hi";
                case SystemLanguage.Bengali: return "bn";
                case SystemLanguage.Punjabi: return "pa";
                default: return fallbackLanguage;
            }
        }
        
        private string GetSmartLanguageForRegion(string regionCode, string detectedLanguage)
        {
            if (_regionMap.ContainsKey(regionCode))
            {
                var region = _regionMap[regionCode];
                var preferredLanguage = region.language;
                
                // Check if preferred language is supported
                if (_languageMap.ContainsKey(preferredLanguage))
                {
                    return preferredLanguage;
                }
                
                // Check for language variants
                var baseLanguage = preferredLanguage.Split('-')[0];
                var variants = _languageMap.Keys.Where(k => k.StartsWith(baseLanguage + "-")).ToList();
                if (variants.Count > 0)
                {
                    return variants[0];
                }
            }
            
            return detectedLanguage;
        }
        
        private void LoadLanguageData()
        {
            Debug.Log("🌍 Loading language data...");
            
            // Load language-specific data
            if (_languageMap.ContainsKey(_currentLanguage))
            {
                var languageConfig = _languageMap[_currentLanguage];
                OnLanguageConfigLoaded?.Invoke(languageConfig);
            }
        }
        
        public void SetLanguage(string languageCode)
        {
            if (_languageMap.ContainsKey(languageCode))
            {
                _currentLanguage = languageCode;
                OnLanguageChanged?.Invoke(_currentLanguage);
                Debug.Log($"🌍 Language changed to: {_currentLanguage}");
            }
            else
            {
                Debug.LogWarning($"⚠️ Language not supported: {languageCode}");
            }
        }
        
        public void SetRegion(string regionCode)
        {
            if (_regionMap.ContainsKey(regionCode))
            {
                _currentRegion = regionCode;
                OnRegionChanged?.Invoke(_currentRegion);
                Debug.Log($"🌍 Region changed to: {_currentRegion}");
            }
            else
            {
                Debug.LogWarning($"⚠️ Region not supported: {regionCode}");
            }
        }
        
        public string GetLocalizedText(string key, params object[] args)
        {
            // This would typically load from a localization file
            // For now, return the key as placeholder
            return key;
        }
        
        public string GetLocalizedCurrency(float amount)
        {
            if (_regionMap.ContainsKey(_currentRegion))
            {
                var region = _regionMap[_currentRegion];
                return $"{amount:C} {region.currency}";
            }
            return $"{amount:C}";
        }
        
        public string GetLocalizedDate(System.DateTime date)
        {
            if (_regionMap.ContainsKey(_currentRegion))
            {
                var region = _regionMap[_currentRegion];
                var culture = new CultureInfo(_currentLanguage);
                return date.ToString("d", culture);
            }
            return date.ToString("d");
        }
        
        public string GetLocalizedNumber(float number)
        {
            if (_regionMap.ContainsKey(_currentRegion))
            {
                var region = _regionMap[_currentRegion];
                var culture = new CultureInfo(_currentLanguage);
                return number.ToString("N", culture);
            }
            return number.ToString("N");
        }
        
        public LanguageConfig GetCurrentLanguageConfig()
        {
            return _languageMap.ContainsKey(_currentLanguage) ? _languageMap[_currentLanguage] : null;
        }
        
        public RegionConfig GetCurrentRegionConfig()
        {
            return _regionMap.ContainsKey(_currentRegion) ? _regionMap[_currentRegion] : null;
        }
        
        public List<LanguageConfig> GetSupportedLanguages()
        {
            return supportedLanguages;
        }
        
        public List<RegionConfig> GetSupportedRegions()
        {
            return _regionMap.Values.ToList();
        }
        
        public bool IsLanguageSupported(string languageCode)
        {
            return _languageMap.ContainsKey(languageCode);
        }
        
        public bool IsRegionSupported(string regionCode)
        {
            return _regionMap.ContainsKey(regionCode);
        }
    }
    
    // Data Classes
    
    [System.Serializable]
    public class LanguageConfig
    {
        public string code;
        public string name;
        public string nativeName;
        public string region;
        public int priority;
        public bool isRTL = false;
        public string fontFamily = "Arial";
        public float fontSizeMultiplier = 1.0f;
    }
    
    [System.Serializable]
    public class RegionConfig
    {
        public string code;
        public string name;
        public string currency;
        public string timezone;
        public string language;
        public string dateFormat = "MM/dd/yyyy";
        public string timeFormat = "HH:mm";
        public string numberFormat = "N2";
        public string currencyFormat = "C2";
    }
}