using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System;
using UnityEngine.Windows.Speech;

namespace Evergreen.Voice
{
    /// <summary>
    /// Advanced Voice Command System for hands-free gameplay
    /// Implements industry-leading voice recognition for maximum accessibility
    /// </summary>
    public class VoiceCommandSystem : MonoBehaviour
    {
        [Header("Voice Configuration")]
        [SerializeField] private bool enableVoiceCommands = true;
        [SerializeField] private bool enableContinuousListening = true;
        [SerializeField] private bool enableWakeWord = true;
        [SerializeField] private bool enableNoiseCancellation = true;
        [SerializeField] private bool enableEchoCancellation = true;
        [SerializeField] private bool enableVoiceActivityDetection = true;
        [SerializeField] private bool enableSpeakerIdentification = true;
        [SerializeField] private bool enableEmotionRecognition = true;
        
        [Header("Voice Settings")]
        [SerializeField] private float confidenceThreshold = 0.7f;
        [SerializeField] private float timeoutDuration = 5.0f;
        [SerializeField] private float silenceThreshold = 0.1f;
        [SerializeField] private float voiceThreshold = 0.5f;
        [SerializeField] private int maxAlternatives = 5;
        [SerializeField] private bool enablePartialResults = true;
        [SerializeField] private bool enableInterimResults = true;
        [SerializeField] private bool enablePunctuation = true;
        
        [Header("Language Support")]
        [SerializeField] private string primaryLanguage = "en-US";
        [SerializeField] private string[] supportedLanguages = { "en-US", "es-ES", "fr-FR", "de-DE", "ja-JP", "ko-KR", "zh-CN" };
        [SerializeField] private bool enableMultiLanguage = true;
        [SerializeField] private bool enableLanguageDetection = true;
        [SerializeField] private bool enableLanguageSwitching = true;
        [SerializeField] private bool enableAccentAdaptation = true;
        
        [Header("Voice Commands")]
        [SerializeField] private VoiceCommand[] voiceCommands;
        [SerializeField] private VoiceCommandCategory[] commandCategories;
        [SerializeField] private VoiceCommandAlias[] commandAliases;
        [SerializeField] private VoiceCommandContext[] commandContexts;
        
        [Header("Audio Processing")]
        [SerializeField] private bool enableAudioPreprocessing = true;
        [SerializeField] private bool enableAudioEnhancement = true;
        [SerializeField] private bool enableAudioCompression = true;
        [SerializeField] private bool enableAudioNormalization = true;
        [SerializeField] private bool enableAudioFiltering = true;
        [SerializeField] private bool enableAudioEchoCancellation = true;
        [SerializeField] private bool enableAudioNoiseReduction = true;
        
        private Dictionary<string, VoiceCommand> _voiceCommands = new Dictionary<string, VoiceCommand>();
        private Dictionary<string, VoiceCommandCategory> _commandCategories = new Dictionary<string, VoiceCommandCategory>();
        private Dictionary<string, VoiceCommandAlias> _commandAliases = new Dictionary<string, VoiceCommandAlias>();
        private Dictionary<string, VoiceCommandContext> _commandContexts = new Dictionary<string, VoiceCommandContext>();
        
        private Dictionary<string, VoiceRecognitionResult> _recognitionResults = new Dictionary<string, VoiceRecognitionResult>();
        private Dictionary<string, VoiceSpeaker> _voiceSpeakers = new Dictionary<string, VoiceSpeaker>();
        private Dictionary<string, VoiceEmotion> _voiceEmotions = new Dictionary<string, VoiceEmotion>();
        
        private VoiceRecognizer _voiceRecognizer;
        private VoiceProcessor _voiceProcessor;
        private VoiceAnalyzer _voiceAnalyzer;
        private VoiceSynthesizer _voiceSynthesizer;
        private VoiceTranslator _voiceTranslator;
        private VoiceContextManager _voiceContextManager;
        
        public static VoiceCommandSystem Instance { get; private set; }
        
        [System.Serializable]
        public class VoiceCommand
        {
            public string id;
            public string name;
            public string description;
            public string[] phrases;
            public string[] keywords;
            public VoiceCommandType type;
            public VoiceCommandCategory category;
            public VoiceCommandContext context;
            public VoiceCommandAction action;
            public VoiceCommandParameters parameters;
            public bool isActive;
            public bool isEnabled;
            public float confidence;
            public float priority;
            public string[] aliases;
            public string[] alternatives;
            public Dictionary<string, object> metadata;
        }
        
        [System.Serializable]
        public class VoiceCommandCategory
        {
            public string id;
            public string name;
            public string description;
            public VoiceCommandType[] supportedTypes;
            public bool isActive;
            public float priority;
            public Dictionary<string, object> properties;
        }
        
        [System.Serializable]
        public class VoiceCommandAlias
        {
            public string id;
            public string name;
            public string[] aliases;
            public string targetCommandId;
            public bool isActive;
            public float confidence;
            public Dictionary<string, object> properties;
        }
        
        [System.Serializable]
        public class VoiceCommandContext
        {
            public string id;
            public string name;
            public string description;
            public VoiceContextType type;
            public string[] requiredStates;
            public string[] excludedStates;
            public bool isActive;
            public float priority;
            public Dictionary<string, object> properties;
        }
        
        [System.Serializable]
        public class VoiceCommandAction
        {
            public string id;
            public string name;
            public VoiceActionType type;
            public string[] parameters;
            public bool isAsync;
            public bool isReversible;
            public float timeout;
            public Dictionary<string, object> properties;
        }
        
        [System.Serializable]
        public class VoiceCommandParameters
        {
            public string[] required;
            public string[] optional;
            public Dictionary<string, object> defaults;
            public Dictionary<string, object> constraints;
            public bool allowPartial;
            public bool allowMultiple;
            public Dictionary<string, object> properties;
        }
        
        [System.Serializable]
        public class VoiceRecognitionResult
        {
            public string id;
            public string text;
            public float confidence;
            public string language;
            public string[] alternatives;
            public bool isFinal;
            public bool isPartial;
            public DateTime timestamp;
            public VoiceSpeaker speaker;
            public VoiceEmotion emotion;
            public Dictionary<string, object> metadata;
        }
        
        [System.Serializable]
        public class VoiceSpeaker
        {
            public string id;
            public string name;
            public VoiceSpeakerProfile profile;
            public bool isIdentified;
            public float confidence;
            public DateTime lastSeen;
            public Dictionary<string, object> properties;
        }
        
        [System.Serializable]
        public class VoiceSpeakerProfile
        {
            public string id;
            public string name;
            public VoiceSpeakerCharacteristics characteristics;
            public VoiceSpeakerPreferences preferences;
            public VoiceSpeakerHistory history;
            public bool isActive;
            public DateTime createdTime;
            public DateTime lastUpdated;
        }
        
        [System.Serializable]
        public class VoiceSpeakerCharacteristics
        {
            public float pitch;
            public float rate;
            public float volume;
            public float clarity;
            public string accent;
            public string gender;
            public int age;
            public Dictionary<string, object> properties;
        }
        
        [System.Serializable]
        public class VoiceSpeakerPreferences
        {
            public string preferredLanguage;
            public string[] preferredCommands;
            public float preferredConfidence;
            public bool enableNotifications;
            public bool enableFeedback;
            public Dictionary<string, object> properties;
        }
        
        [System.Serializable]
        public class VoiceSpeakerHistory
        {
            public int totalCommands;
            public int successfulCommands;
            public int failedCommands;
            public float successRate;
            public DateTime lastCommand;
            public Dictionary<string, int> commandCounts;
            public Dictionary<string, object> properties;
        }
        
        [System.Serializable]
        public class VoiceEmotion
        {
            public string id;
            public string name;
            public VoiceEmotionType type;
            public float intensity;
            public float confidence;
            public DateTime timestamp;
            public Dictionary<string, object> properties;
        }
        
        [System.Serializable]
        public class VoiceRecognizer
        {
            public bool isInitialized;
            public bool isListening;
            public bool isProcessing;
            public string currentLanguage;
            public float currentConfidence;
            public int currentAlternatives;
            public Dictionary<string, object> settings;
        }
        
        [System.Serializable]
        public class VoiceProcessor
        {
            public bool isEnabled;
            public bool enablePreprocessing;
            public bool enableEnhancement;
            public bool enableCompression;
            public bool enableNormalization;
            public bool enableFiltering;
            public bool enableEchoCancellation;
            public bool enableNoiseReduction;
            public Dictionary<string, object> settings;
        }
        
        [System.Serializable]
        public class VoiceAnalyzer
        {
            public bool isEnabled;
            public bool enableSpeakerIdentification;
            public bool enableEmotionRecognition;
            public bool enableLanguageDetection;
            public bool enableAccentDetection;
            public bool enableGenderDetection;
            public bool enableAgeDetection;
            public Dictionary<string, object> settings;
        }
        
        [System.Serializable]
        public class VoiceSynthesizer
        {
            public bool isEnabled;
            public bool enableTextToSpeech;
            public bool enableVoiceCloning;
            public bool enableVoiceModulation;
            public bool enableVoiceEffects;
            public string currentVoice;
            public float currentRate;
            public float currentPitch;
            public float currentVolume;
            public Dictionary<string, object> settings;
        }
        
        [System.Serializable]
        public class VoiceTranslator
        {
            public bool isEnabled;
            public bool enableRealTimeTranslation;
            public bool enableOfflineTranslation;
            public bool enableContextAwareTranslation;
            public string sourceLanguage;
            public string targetLanguage;
            public Dictionary<string, object> settings;
        }
        
        [System.Serializable]
        public class VoiceContextManager
        {
            public bool isEnabled;
            public string currentContext;
            public Dictionary<string, bool> contextStates;
            public Dictionary<string, object> contextData;
            public Dictionary<string, object> settings;
        }
        
        public enum VoiceCommandType
        {
            Navigation,
            Interaction,
            Control,
            Communication,
            Information,
            Entertainment,
            Accessibility,
            Custom
        }
        
        public enum VoiceContextType
        {
            Gameplay,
            Menu,
            Settings,
            Social,
            Shop,
            Inventory,
            Map,
            Battle,
            Custom
        }
        
        public enum VoiceActionType
        {
            Execute,
            Navigate,
            Interact,
            Control,
            Communicate,
            Inform,
            Entertain,
            Access,
            Custom
        }
        
        public enum VoiceEmotionType
        {
            Happy,
            Sad,
            Angry,
            Excited,
            Calm,
            Frustrated,
            Confused,
            Surprised,
            Neutral,
            Custom
        }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeVoiceCommandsystemSafe();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            SetupVoiceCommands();
            SetupVoiceCategories();
            SetupVoiceAliases();
            SetupVoiceContexts();
            SetupVoiceRecognizer();
            SetupVoiceProcessor();
            SetupVoiceAnalyzer();
            SetupVoiceSynthesizer();
            SetupVoiceTranslator();
            SetupVoiceContextManager();
            StartCoroutine(UpdateVoiceCommandsystemSafe());
        }
        
        private void InitializeVoiceCommandsystemSafe()
        {
            // Initialize voice command system components
            InitializeVoiceCommands();
            InitializeVoiceCategories();
            InitializeVoiceAliases();
            InitializeVoiceContexts();
            InitializeVoiceRecognizer();
            InitializeVoiceProcessor();
            InitializeVoiceAnalyzer();
            InitializeVoiceSynthesizer();
            InitializeVoiceTranslator();
            InitializeVoiceContextManager();
        }
        
        private void InitializeVoiceCommands()
        {
            // Initialize voice commands
            _voiceCommands["play_game"] = new VoiceCommand
            {
                id = "play_game",
                name = "Play Game",
                description = "Start playing the game",
                phrases = new string[] { "play game", "start game", "begin game", "let's play" },
                keywords = new string[] { "play", "start", "begin", "game" },
                type = VoiceCommandType.Control,
                category = new VoiceCommandCategory { id = "game_control", name = "Game Control" },
                context = new VoiceCommandContext { id = "menu", name = "Menu" },
                action = new VoiceCommandAction
                {
                    id = "execute_play_game",
                    name = "Execute Play Game",
                    type = VoiceActionType.Execute,
                    parameters = new string[0],
                    isAsync = false,
                    isReversible = true,
                    timeout = 5.0f
                },
                parameters = new VoiceCommandParameters
                {
                    required = new string[0],
                    optional = new string[0],
                    defaults = new Dictionary<string, object>(),
                    constraints = new Dictionary<string, object>(),
                    allowPartial = true,
                    allowMultiple = false
                },
                isActive = true,
                isEnabled = true,
                confidence = 0.8f,
                priority = 1.0f,
                aliases = new string[] { "play", "start", "begin" },
                alternatives = new string[] { "play match three", "start puzzle", "begin level" },
                metadata = new Dictionary<string, object>()
            };
            
            _voiceCommands["pause_game"] = new VoiceCommand
            {
                id = "pause_game",
                name = "Pause Game",
                description = "Pause the current game",
                phrases = new string[] { "pause game", "pause", "stop game", "halt game" },
                keywords = new string[] { "pause", "stop", "halt", "game" },
                type = VoiceCommandType.Control,
                category = new VoiceCommandCategory { id = "game_control", name = "Game Control" },
                context = new VoiceCommandContext { id = "gameplay", name = "Gameplay" },
                action = new VoiceCommandAction
                {
                    id = "execute_pause_game",
                    name = "Execute Pause Game",
                    type = VoiceActionType.Execute,
                    parameters = new string[0],
                    isAsync = false,
                    isReversible = true,
                    timeout = 5.0f
                },
                parameters = new VoiceCommandParameters
                {
                    required = new string[0],
                    optional = new string[0],
                    defaults = new Dictionary<string, object>(),
                    constraints = new Dictionary<string, object>(),
                    allowPartial = true,
                    allowMultiple = false
                },
                isActive = true,
                isEnabled = true,
                confidence = 0.8f,
                priority = 1.0f,
                aliases = new string[] { "pause", "stop", "halt" },
                alternatives = new string[] { "pause match three", "stop puzzle", "halt level" },
                metadata = new Dictionary<string, object>()
            };
        }
        
        private void InitializeVoiceCategories()
        {
            // Initialize voice command categories
            _commandCategories["game_control"] = new VoiceCommandCategory
            {
                id = "game_control",
                name = "Game Control",
                description = "Commands for controlling the game",
                supportedTypes = new VoiceCommandType[] { VoiceCommandType.Control, VoiceCommandType.Navigation },
                isActive = true,
                priority = 1.0f,
                properties = new Dictionary<string, object>()
            };
            
            _commandCategories["navigation"] = new VoiceCommandCategory
            {
                id = "navigation",
                name = "Navigation",
                description = "Commands for navigating the UI",
                supportedTypes = new VoiceCommandType[] { VoiceCommandType.Navigation, VoiceCommandType.Interaction },
                isActive = true,
                priority = 0.8f,
                properties = new Dictionary<string, object>()
            };
        }
        
        private void InitializeVoiceAliases()
        {
            // Initialize voice command aliases
            _commandAliases["play"] = new VoiceCommandAlias
            {
                id = "play",
                name = "Play",
                aliases = new string[] { "play", "start", "begin", "go" },
                targetCommandId = "play_game",
                isActive = true,
                confidence = 0.9f,
                properties = new Dictionary<string, object>()
            };
        }
        
        private void InitializeVoiceContexts()
        {
            // Initialize voice command contexts
            _commandContexts["menu"] = new VoiceCommandContext
            {
                id = "menu",
                name = "Menu",
                description = "Main menu context",
                type = VoiceContextType.Menu,
                requiredStates = new string[] { "menu_open" },
                excludedStates = new string[] { "gameplay_active" },
                isActive = true,
                priority = 1.0f,
                properties = new Dictionary<string, object>()
            };
            
            _commandContexts["gameplay"] = new VoiceCommandContext
            {
                id = "gameplay",
                name = "Gameplay",
                description = "Gameplay context",
                type = VoiceContextType.Gameplay,
                requiredStates = new string[] { "gameplay_active" },
                excludedStates = new string[] { "menu_open" },
                isActive = true,
                priority = 1.0f,
                properties = new Dictionary<string, object>()
            };
        }
        
        private void InitializeVoiceRecognizer()
        {
            // Initialize voice recognizer
            _voiceRecognizer = new VoiceRecognizer
            {
                isInitialized = false,
                isListening = false,
                isProcessing = false,
                currentLanguage = primaryLanguage,
                currentConfidence = confidenceThreshold,
                currentAlternatives = maxAlternatives,
                settings = new Dictionary<string, object>()
            };
        }
        
        private void InitializeVoiceProcessor()
        {
            // Initialize voice processor
            _voiceProcessor = new VoiceProcessor
            {
                isEnabled = enableAudioPreprocessing,
                enablePreprocessing = enableAudioPreprocessing,
                enableEnhancement = enableAudioEnhancement,
                enableCompression = enableAudioCompression,
                enableNormalization = enableAudioNormalization,
                enableFiltering = enableAudioFiltering,
                enableEchoCancellation = enableAudioEchoCancellation,
                enableNoiseReduction = enableAudioNoiseReduction,
                settings = new Dictionary<string, object>()
            };
        }
        
        private void InitializeVoiceAnalyzer()
        {
            // Initialize voice analyzer
            _voiceAnalyzer = new VoiceAnalyzer
            {
                isEnabled = true,
                enableSpeakerIdentification = enableSpeakerIdentification,
                enableEmotionRecognition = enableEmotionRecognition,
                enableLanguageDetection = enableLanguageDetection,
                enableAccentDetection = enableAccentAdaptation,
                enableGenderDetection = true,
                enableAgeDetection = true,
                settings = new Dictionary<string, object>()
            };
        }
        
        private void InitializeVoiceSynthesizer()
        {
            // Initialize voice synthesizer
            _voiceSynthesizer = new VoiceSynthesizer
            {
                isEnabled = true,
                enableTextToSpeech = true,
                enableVoiceCloning = false,
                enableVoiceModulation = true,
                enableVoiceEffects = true,
                currentVoice = "default",
                currentRate = 1.0f,
                currentPitch = 1.0f,
                currentVolume = 1.0f,
                settings = new Dictionary<string, object>()
            };
        }
        
        private void InitializeVoiceTranslator()
        {
            // Initialize voice translator
            _voiceTranslator = new VoiceTranslator
            {
                isEnabled = enableMultiLanguage,
                enableRealTimeTranslation = true,
                enableOfflineTranslation = false,
                enableContextAwareTranslation = true,
                sourceLanguage = primaryLanguage,
                targetLanguage = primaryLanguage,
                settings = new Dictionary<string, object>()
            };
        }
        
        private void InitializeVoiceContextManager()
        {
            // Initialize voice context manager
            _voiceContextManager = new VoiceContextManager
            {
                isEnabled = true,
                currentContext = "menu",
                contextStates = new Dictionary<string, bool>
                {
                    { "menu_open", true },
                    { "gameplay_active", false }
                },
                contextData = new Dictionary<string, object>(),
                settings = new Dictionary<string, object>()
            };
        }
        
        private void SetupVoiceCommands()
        {
            // Setup voice commands
            foreach (var command in _voiceCommands.Values)
            {
                SetupVoiceCommand(command);
            }
        }
        
        private void SetupVoiceCommand(VoiceCommand command)
        {
            // Setup individual voice command
            // This would integrate with your voice recognition system
        }
        
        private void SetupVoiceCategories()
        {
            // Setup voice command categories
            foreach (var category in _commandCategories.Values)
            {
                SetupVoiceCategory(category);
            }
        }
        
        private void SetupVoiceCategory(VoiceCommandCategory category)
        {
            // Setup individual voice command category
            // This would integrate with your voice recognition system
        }
        
        private void SetupVoiceAliases()
        {
            // Setup voice command aliases
            foreach (var alias in _commandAliases.Values)
            {
                SetupVoiceAlias(alias);
            }
        }
        
        private void SetupVoiceAlias(VoiceCommandAlias alias)
        {
            // Setup individual voice command alias
            // This would integrate with your voice recognition system
        }
        
        private void SetupVoiceContexts()
        {
            // Setup voice command contexts
            foreach (var context in _commandContexts.Values)
            {
                SetupVoiceContext(context);
            }
        }
        
        private void SetupVoiceContext(VoiceCommandContext context)
        {
            // Setup individual voice command context
            // This would integrate with your voice recognition system
        }
        
        private void SetupVoiceRecognizer()
        {
            // Setup voice recognizer
            _voiceRecognizer.isInitialized = true;
        }
        
        private void SetupVoiceProcessor()
        {
            // Setup voice processor
            _voiceProcessor.isEnabled = true;
        }
        
        private void SetupVoiceAnalyzer()
        {
            // Setup voice analyzer
            _voiceAnalyzer.isEnabled = true;
        }
        
        private void SetupVoiceSynthesizer()
        {
            // Setup voice synthesizer
            _voiceSynthesizer.isEnabled = true;
        }
        
        private void SetupVoiceTranslator()
        {
            // Setup voice translator
            _voiceTranslator.isEnabled = true;
        }
        
        private void SetupVoiceContextManager()
        {
            // Setup voice context manager
            _voiceContextManager.isEnabled = true;
        }
        
        private IEnumerator UpdateVoiceCommandsystemSafe()
        {
            while (true)
            {
                // Update voice command system
                UpdateVoiceRecognizer();
                UpdateVoiceProcessor();
                UpdateVoiceAnalyzer();
                UpdateVoiceSynthesizer();
                UpdateVoiceTranslator();
                UpdateVoiceContextManager();
                
                yield return new WaitForSeconds(0.1f); // Update 10 times per second
            }
        }
        
        private void UpdateVoiceRecognizer()
        {
            // Update voice recognizer
            // This would integrate with your voice recognition system
        }
        
        private void UpdateVoiceProcessor()
        {
            // Update voice processor
            // This would integrate with your audio processing system
        }
        
        private void UpdateVoiceAnalyzer()
        {
            // Update voice analyzer
            // This would integrate with your voice analysis system
        }
        
        private void UpdateVoiceSynthesizer()
        {
            // Update voice synthesizer
            // This would integrate with your text-to-speech system
        }
        
        private void UpdateVoiceTranslator()
        {
            // Update voice translator
            // This would integrate with your translation system
        }
        
        private void UpdateVoiceContextManager()
        {
            // Update voice context manager
            // This would integrate with your context management system
        }
        
        /// <summary>
        /// Start voice recognition
        /// </summary>
        public void StartVoiceRecognition()
        {
            if (!enableVoiceCommands)
            {
                Debug.LogWarning("Voice commands are disabled");
                return;
            }
            
            _voiceRecognizer.isListening = true;
            _voiceRecognizer.isProcessing = true;
        }
        
        /// <summary>
        /// Stop voice recognition
        /// </summary>
        public void StopVoiceRecognition()
        {
            _voiceRecognizer.isListening = false;
            _voiceRecognizer.isProcessing = false;
        }
        
        /// <summary>
        /// Process voice input
        /// </summary>
        public void ProcessVoiceInput(string text, float confidence, string language = "")
        {
            if (string.IsNullOrEmpty(text))
            {
                return;
            }
            
            // Create recognition result
            string resultId = System.Guid.NewGuid().ToString();
            var result = new VoiceRecognitionResult
            {
                id = resultId,
                text = text,
                confidence = confidence,
                language = string.IsNullOrEmpty(language) ? primaryLanguage : language,
                alternatives = new string[0],
                isFinal = true,
                isPartial = false,
                timestamp = DateTime.Now,
                speaker = null,
                emotion = null,
                metadata = new Dictionary<string, object>()
            };
            
            _recognitionResults[resultId] = result;
            
            // Process recognition result
            ProcessRecognitionResult(result);
        }
        
        private void ProcessRecognitionResult(VoiceRecognitionResult result)
        {
            // Find matching voice command
            var matchingCommand = FindMatchingCommand(result);
            
            if (matchingCommand != null)
            {
                // Execute voice command
                ExecuteVoiceCommand(matchingCommand, result);
            }
            else
            {
                // Handle unknown command
                HandleUnknownCommand(result);
            }
        }
        
        private VoiceCommand FindMatchingCommand(VoiceRecognitionResult result)
        {
            // Find best matching voice command
            VoiceCommand bestMatch = null;
            float bestScore = 0f;
            
            foreach (var command in _voiceCommands.Values)
            {
                if (!command.isActive || !command.isEnabled)
                {
                    continue;
                }
                
                // Check if command is available in current context
                if (!IsCommandAvailableInContext(command))
                {
                    continue;
                }
                
                // Calculate match score
                float score = CalculateMatchScore(command, result);
                
                if (score > bestScore && score >= command.confidence)
                {
                    bestScore = score;
                    bestMatch = command;
                }
            }
            
            return bestMatch;
        }
        
        private bool IsCommandAvailableInContext(VoiceCommand command)
        {
            // Check if command is available in current context
            if (command.context == null)
            {
                return true;
            }
            
            var context = _commandContexts.Values.FirstOrDefault(c => c.id == command.context.id);
            if (context == null)
            {
                return true;
            }
            
            // Check required states
            foreach (var requiredState in context.requiredStates)
            {
                if (!_voiceContextManager.contextStates.ContainsKey(requiredState) || 
                    !_voiceContextManager.contextStates[requiredState])
                {
                    return false;
                }
            }
            
            // Check excluded states
            foreach (var excludedState in context.excludedStates)
            {
                if (_voiceContextManager.contextStates.ContainsKey(excludedState) && 
                    _voiceContextManager.contextStates[excludedState])
                {
                    return false;
                }
            }
            
            return true;
        }
        
        private float CalculateMatchScore(VoiceCommand command, VoiceRecognitionResult result)
        {
            // Calculate match score based on text similarity and confidence
            float textScore = CalculateTextSimilarity(command, result);
            float confidenceScore = result.confidence;
            float contextScore = CalculateContextScore(command);
            
            return (textScore * 0.5f) + (confidenceScore * 0.3f) + (contextScore * 0.2f);
        }
        
        private float CalculateTextSimilarity(VoiceCommand command, VoiceRecognitionResult result)
        {
            // Calculate text similarity between command phrases and recognition result
            float bestSimilarity = 0f;
            
            foreach (var phrase in command.phrases)
            {
                float similarity = CalculateStringSimilarity(phrase.ToLower(), result.text.ToLower());
                if (similarity > bestSimilarity)
                {
                    bestSimilarity = similarity;
                }
            }
            
            return bestSimilarity;
        }
        
        private float CalculateStringSimilarity(string s1, string s2)
        {
            // Calculate string similarity using Levenshtein distance
            int maxLength = Math.Max(s1.Length, s2.Length);
            if (maxLength == 0)
            {
                return 1.0f;
            }
            
            int distance = LevenshteinDistance(s1, s2);
            return 1.0f - (float)distance / maxLength;
        }
        
        private int LevenshteinDistance(string s1, string s2)
        {
            int[,] d = new int[s1.Length + 1, s2.Length + 1];
            
            for (int i = 0; i <= s1.Length; i++)
            {
                d[i, 0] = i;
            }
            
            for (int j = 0; j <= s2.Length; j++)
            {
                d[0, j] = j;
            }
            
            for (int i = 1; i <= s1.Length; i++)
            {
                for (int j = 1; j <= s2.Length; j++)
                {
                    int cost = s1[i - 1] == s2[j - 1] ? 0 : 1;
                    d[i, j] = Math.Min(Math.Min(d[i - 1, j] + 1, d[i, j - 1] + 1), d[i - 1, j - 1] + cost);
                }
            }
            
            return d[s1.Length, s2.Length];
        }
        
        private float CalculateContextScore(VoiceCommand command)
        {
            // Calculate context score based on current context
            if (command.context == null)
            {
                return 1.0f;
            }
            
            var context = _commandContexts.Values.FirstOrDefault(c => c.id == command.context.id);
            if (context == null)
            {
                return 1.0f;
            }
            
            return context.priority;
        }
        
        private void ExecuteVoiceCommand(VoiceCommand command, VoiceRecognitionResult result)
        {
            // Execute voice command
            Debug.Log($"Executing voice command: {command.name}");
            
            // This would integrate with your game systems
            switch (command.action.type)
            {
                case VoiceActionType.Execute:
                    ExecuteCommand(command, result);
                    break;
                case VoiceActionType.Navigate:
                    NavigateCommand(command, result);
                    break;
                case VoiceActionType.Interact:
                    InteractCommand(command, result);
                    break;
                case VoiceActionType.Control:
                    ControlCommand(command, result);
                    break;
                case VoiceActionType.Communicate:
                    CommunicateCommand(command, result);
                    break;
                case VoiceActionType.Inform:
                    InformCommand(command, result);
                    break;
                case VoiceActionType.Entertain:
                    EntertainCommand(command, result);
                    break;
                case VoiceActionType.Access:
                    AccessCommand(command, result);
                    break;
                default:
                    ExecuteCustomCommand(command, result);
                    break;
            }
        }
        
        private void ExecuteCommand(VoiceCommand command, VoiceRecognitionResult result)
        {
            // Execute command
            // This would integrate with your game systems
        }
        
        private void NavigateCommand(VoiceCommand command, VoiceRecognitionResult result)
        {
            // Navigate command
            // This would integrate with your navigation system
        }
        
        private void InteractCommand(VoiceCommand command, VoiceRecognitionResult result)
        {
            // Interact command
            // This would integrate with your interaction system
        }
        
        private void ControlCommand(VoiceCommand command, VoiceRecognitionResult result)
        {
            // Control command
            // This would integrate with your control system
        }
        
        private void CommunicateCommand(VoiceCommand command, VoiceRecognitionResult result)
        {
            // Communicate command
            // This would integrate with your communication system
        }
        
        private void InformCommand(VoiceCommand command, VoiceRecognitionResult result)
        {
            // Inform command
            // This would integrate with your information system
        }
        
        private void EntertainCommand(VoiceCommand command, VoiceRecognitionResult result)
        {
            // Entertain command
            // This would integrate with your entertainment system
        }
        
        private void AccessCommand(VoiceCommand command, VoiceRecognitionResult result)
        {
            // Access command
            // This would integrate with your accessibility system
        }
        
        private void ExecuteCustomCommand(VoiceCommand command, VoiceRecognitionResult result)
        {
            // Execute custom command
            // This would integrate with your custom command system
        }
        
        private void HandleUnknownCommand(VoiceRecognitionResult result)
        {
            // Handle unknown command
            Debug.Log($"Unknown voice command: {result.text}");
            
            // This would integrate with your help system
        }
        
        /// <summary>
        /// Get voice command system status
        /// </summary>
        public string GetVoiceCommandStatus()
        {
            System.Text.StringBuilder status = new System.Text.StringBuilder();
            status.AppendLine("=== VOICE COMMAND STATUS ===");
            status.AppendLine($"Timestamp: {DateTime.Now}");
            status.AppendLine();
            
            status.AppendLine($"Voice Commands: {(enableVoiceCommands ? "Enabled" : "Disabled")}");
            status.AppendLine($"Continuous Listening: {(enableContinuousListening ? "Enabled" : "Disabled")}");
            status.AppendLine($"Wake Word: {(enableWakeWord ? "Enabled" : "Disabled")}");
            status.AppendLine($"Noise Cancellation: {(enableNoiseCancellation ? "Enabled" : "Disabled")}");
            status.AppendLine();
            
            status.AppendLine($"Commands: {_voiceCommands.Count}");
            status.AppendLine($"Categories: {_commandCategories.Count}");
            status.AppendLine($"Aliases: {_commandAliases.Count}");
            status.AppendLine($"Contexts: {_commandContexts.Count}");
            status.AppendLine($"Recognition Results: {_recognitionResults.Count}");
            status.AppendLine();
            
            status.AppendLine($"Current Language: {primaryLanguage}");
            status.AppendLine($"Confidence Threshold: {confidenceThreshold}");
            status.AppendLine($"Current Context: {_voiceContextManager.currentContext}");
            
            return status.ToString();
        }
        
        /// <summary>
        /// Enable/disable voice command features
        /// </summary>
        public void SetVoiceCommandFeatures(bool voiceCommands, bool continuousListening, bool wakeWord, bool noiseCancellation)
        {
            enableVoiceCommands = voiceCommands;
            enableContinuousListening = continuousListening;
            enableWakeWord = wakeWord;
            enableNoiseCancellation = noiseCancellation;
        }
        
        void OnDestroy()
        {
            // Clean up voice command system
        }
    }
}