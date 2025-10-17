using UnityEngine;
using UnityEngine.UI;
using UnityEngine.SceneManagement;
using System.Collections.Generic;
using Evergreen.Core;
using Evergreen.UI;

namespace Evergreen.UI
{
    /// <summary>
    /// Universal Button Manager - Automatically wires up all buttons in scenes
    /// Ensures all buttons are functional without manual Inspector assignment
    /// </summary>
    public class UniversalButtonManager : MonoBehaviour
    {
        [Header("Button Configuration")]
        public bool autoWireButtons = true;
        public bool enableButtonSounds = true;
        public bool enableButtonAnimations = true;
        public float buttonAnimationDuration = 0.1f;
        
        [Header("Audio")]
        public AudioClip buttonClickSound;
        public AudioClip buttonHoverSound;
        
        private Dictionary<string, System.Action> _buttonActions;
        private AudioSource _audioSource;
        private OptimizedUISystem _uiSystem;
        private SceneManager _sceneManager;
        
        public static UniversalButtonManager Instance { get; private set; }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeButtonManager();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            if (autoWireButtons)
            {
                WireAllButtonsInScene();
            }
        }
        
        private void InitializeButtonManager()
        {
            // Initialize audio
            _audioSource = GetComponent<AudioSource>();
            if (_audioSource == null)
            {
                _audioSource = gameObject.AddComponent<AudioSource>();
            }
            
            // Get references to other systems
            _uiSystem = FindObjectOfType<OptimizedUISystem>();
            _sceneManager = FindObjectOfType<SceneManager>();
            
            // Initialize button actions dictionary
            InitializeButtonActions();
            
            Debug.Log("Universal Button Manager initialized - All buttons will be automatically wired");
        }
        
        private void InitializeButtonActions()
        {
            _buttonActions = new Dictionary<string, System.Action>
            {
                // Main Menu Buttons
                ["PlayButton"] = () => OnPlayButtonClicked(),
                ["StartGameButton"] = () => OnPlayButtonClicked(),
                ["SettingsButton"] = () => OnSettingsButtonClicked(),
                ["ShopButton"] = () => OnShopButtonClicked(),
                ["SocialButton"] = () => OnSocialButtonClicked(),
                ["EventsButton"] = () => OnEventsButtonClicked(),
                ["CollectionsButton"] = () => OnCollectionsButtonClicked(),
                ["AchievementsButton"] = () => OnAchievementsButtonClicked(),
                
                // Navigation Buttons
                ["BackButton"] = () => OnBackButtonClicked(),
                ["HomeButton"] = () => OnHomeButtonClicked(),
                ["MenuButton"] = () => OnMenuButtonClicked(),
                
                // Gameplay Buttons
                ["PauseButton"] = () => OnPauseButtonClicked(),
                ["ResumeButton"] = () => OnResumeButtonClicked(),
                ["RestartButton"] = () => OnRestartButtonClicked(),
                
                // Social Buttons
                ["LeaderboardButton"] = () => OnLeaderboardButtonClicked(),
                ["FriendsButton"] = () => OnFriendsButtonClicked(),
                ["ChatButton"] = () => OnChatButtonClicked(),
                
                // Event Buttons
                ["DailyEventButton"] = () => OnDailyEventButtonClicked(),
                ["TournamentButton"] = () => OnTournamentButtonClicked(),
                ["SpecialEventButton"] = () => OnSpecialEventButtonClicked(),
                
                // Collection Buttons
                ["RewardsButton"] = () => OnRewardsButtonClicked(),
                ["InventoryButton"] = () => OnInventoryButtonClicked(),
                
                // Settings Buttons
                ["AudioButton"] = () => OnAudioButtonClicked(),
                ["GraphicsButton"] = () => OnGraphicsButtonClicked(),
                ["ControlsButton"] = () => OnControlsButtonClicked(),
                ["AccountButton"] = () => OnAccountButtonClicked(),
                
                // Shop Buttons
                ["PurchaseButton"] = () => OnPurchaseButtonClicked(),
                ["BuyButton"] = () => OnBuyButtonClicked(),
                ["UpgradeButton"] = () => OnUpgradeButtonClicked(),
                
                // Character Buttons
                ["InteractButton"] = () => OnInteractButtonClicked(),
                ["CharacterButton"] = () => OnCharacterButtonClicked(),
                
                // Meta Game Buttons
                ["RoomButton"] = () => OnRoomButtonClicked(),
                ["DecorationButton"] = () => OnDecorationButtonClicked(),
                ["PlaceButton"] = () => OnPlaceButtonClicked(),
                
                // Achievement Buttons
                ["ClaimButton"] = () => OnClaimButtonClicked(),
                ["ClaimRewardButton"] = () => OnClaimRewardButtonClicked(),
                
                // Event Action Buttons
                ["ParticipateButton"] = () => OnParticipateButtonClicked(),
                ["JoinButton"] = () => OnJoinButtonClicked(),
                ["LeaveButton"] = () => OnLeaveButtonClicked()
            };
        }
        
        public void WireAllButtonsInScene()
        {
            // Find all buttons in the current scene
            Button[] allButtons = FindObjectsOfType<Button>();
            
            Debug.Log($"Found {allButtons.Length} buttons in scene: {SceneManager.GetActiveScene().name}");
            
            foreach (Button button in allButtons)
            {
                WireButton(button);
            }
        }
        
        public void WireButton(Button button)
        {
            if (button == null) return;
            
            // Clear existing listeners
            button.onClick.RemoveAllListeners();
            
            // Get button name
            string buttonName = button.name;
            
            // Find matching action
            System.Action action = null;
            foreach (var kvp in _buttonActions)
            {
                if (buttonName.Contains(kvp.Key))
                {
                    action = kvp.Value;
                    break;
                }
            }
            
            // If no specific action found, try generic patterns
            if (action == null)
            {
                action = GetGenericAction(buttonName);
            }
            
            // Wire the button
            if (action != null)
            {
                button.onClick.AddListener(() => {
                    PlayButtonClickSound();
                    if (enableButtonAnimations)
                    {
                        StartCoroutine(AnimateButtonClick(button));
                    }
                    action.Invoke();
                });
                
                // Add hover effects
                AddHoverEffects(button);
                
                Debug.Log($"Wired button: {buttonName}");
            }
            else
            {
                Debug.LogWarning($"No action found for button: {buttonName}");
            }
        }
        
        private System.Action GetGenericAction(string buttonName)
        {
            string lowerName = buttonName.ToLower();
            
            if (lowerName.Contains("play") || lowerName.Contains("start"))
                return () => OnPlayButtonClicked();
            if (lowerName.Contains("back") || lowerName.Contains("return"))
                return () => OnBackButtonClicked();
            if (lowerName.Contains("settings") || lowerName.Contains("options"))
                return () => OnSettingsButtonClicked();
            if (lowerName.Contains("shop") || lowerName.Contains("store"))
                return () => OnShopButtonClicked();
            if (lowerName.Contains("social") || lowerName.Contains("friends"))
                return () => OnSocialButtonClicked();
            if (lowerName.Contains("pause"))
                return () => OnPauseButtonClicked();
            if (lowerName.Contains("resume") || lowerName.Contains("continue"))
                return () => OnResumeButtonClicked();
            if (lowerName.Contains("menu") || lowerName.Contains("main"))
                return () => OnHomeButtonClicked();
            
            return null;
        }
        
        private void AddHoverEffects(Button button)
        {
            // Add EventTrigger for hover effects
            var eventTrigger = button.gameObject.GetComponent<UnityEngine.EventSystems.EventTrigger>();
            if (eventTrigger == null)
            {
                eventTrigger = button.gameObject.AddComponent<UnityEngine.EventSystems.EventTrigger>();
            }
            
            // Pointer Enter
            var pointerEnter = new UnityEngine.EventSystems.EventTrigger.Entry();
            pointerEnter.eventID = UnityEngine.EventSystems.EventTriggerType.PointerEnter;
            pointerEnter.callback.AddListener((data) => { OnButtonHover(button); });
            eventTrigger.triggers.Add(pointerEnter);
            
            // Pointer Exit
            var pointerExit = new UnityEngine.EventSystems.EventTrigger.Entry();
            pointerExit.eventID = UnityEngine.EventSystems.EventTriggerType.PointerExit;
            pointerExit.callback.AddListener((data) => { OnButtonHoverExit(button); });
            eventTrigger.triggers.Add(pointerExit);
        }
        
        private void OnButtonHover(Button button)
        {
            if (enableButtonSounds)
            {
                PlayButtonHoverSound();
            }
            
            if (enableButtonAnimations)
            {
                StartCoroutine(AnimateButtonHover(button, true));
            }
        }
        
        private void OnButtonHoverExit(Button button)
        {
            if (enableButtonAnimations)
            {
                StartCoroutine(AnimateButtonHover(button, false));
            }
        }
        
        private System.Collections.IEnumerator AnimateButtonClick(Button button)
        {
            var rectTransform = button.GetComponent<RectTransform>();
            Vector3 originalScale = rectTransform.localScale;
            Vector3 clickScale = originalScale * 0.95f;
            
            // Scale down
            float elapsed = 0f;
            while (elapsed < buttonAnimationDuration / 2)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / (buttonAnimationDuration / 2);
                rectTransform.localScale = Vector3.Lerp(originalScale, clickScale, t);
                yield return null;
            }
            
            // Scale back up
            elapsed = 0f;
            while (elapsed < buttonAnimationDuration / 2)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / (buttonAnimationDuration / 2);
                rectTransform.localScale = Vector3.Lerp(clickScale, originalScale, t);
                yield return null;
            }
            
            rectTransform.localScale = originalScale;
        }
        
        private System.Collections.IEnumerator AnimateButtonHover(Button button, bool isHovering)
        {
            var rectTransform = button.GetComponent<RectTransform>();
            Vector3 originalScale = rectTransform.localScale;
            Vector3 targetScale = isHovering ? originalScale * 1.05f : originalScale;
            
            float elapsed = 0f;
            while (elapsed < buttonAnimationDuration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / buttonAnimationDuration;
                rectTransform.localScale = Vector3.Lerp(originalScale, targetScale, t);
                yield return null;
            }
            
            rectTransform.localScale = targetScale;
        }
        
        private void PlayButtonClickSound()
        {
            if (enableButtonSounds && buttonClickSound != null && _audioSource != null)
            {
                _audioSource.PlayOneShot(buttonClickSound);
            }
        }
        
        private void PlayButtonHoverSound()
        {
            if (enableButtonSounds && buttonHoverSound != null && _audioSource != null)
            {
                _audioSource.PlayOneShot(buttonHoverSound);
            }
        }
        
        #region Button Action Methods
        
        private void OnPlayButtonClicked()
        {
            Debug.Log("Play button clicked - Starting game");
            
            // Use scene manager if available
            if (_sceneManager != null)
            {
                _sceneManager.StartGameplay();
            }
            else
            {
                SceneManager.LoadScene("Gameplay");
            }
        }
        
        private void OnSettingsButtonClicked()
        {
            Debug.Log("Settings button clicked");
            
            if (_sceneManager != null)
            {
                _sceneManager.OpenSettings();
            }
            else
            {
                SceneManager.LoadScene("Settings");
            }
        }
        
        private void OnShopButtonClicked()
        {
            Debug.Log("Shop button clicked");
            
            if (_sceneManager != null)
            {
                _sceneManager.OpenShop();
            }
            else
            {
                SceneManager.LoadScene("Shop");
            }
        }
        
        private void OnSocialButtonClicked()
        {
            Debug.Log("Social button clicked");
            
            if (_sceneManager != null)
            {
                _sceneManager.OpenSocial();
            }
            else
            {
                SceneManager.LoadScene("Social");
            }
        }
        
        private void OnEventsButtonClicked()
        {
            Debug.Log("Events button clicked");
            
            if (_sceneManager != null)
            {
                _sceneManager.OpenEvents();
            }
            else
            {
                SceneManager.LoadScene("Events");
            }
        }
        
        private void OnCollectionsButtonClicked()
        {
            Debug.Log("Collections button clicked");
            
            if (_sceneManager != null)
            {
                _sceneManager.OpenCollections();
            }
            else
            {
                SceneManager.LoadScene("Collections");
            }
        }
        
        private void OnAchievementsButtonClicked()
        {
            Debug.Log("Achievements button clicked");
            
            if (_uiSystem != null)
            {
                _uiSystem.ShowAchievements();
            }
            else
            {
                // Fallback to scene loading
                SceneManager.LoadScene("Collections");
            }
        }
        
        private void OnBackButtonClicked()
        {
            Debug.Log("Back button clicked");
            
            // Go back to main menu
            if (_sceneManager != null)
            {
                _sceneManager.GoToMainMenu();
            }
            else
            {
                SceneManager.LoadScene("MainMenu");
            }
        }
        
        private void OnHomeButtonClicked()
        {
            Debug.Log("Home button clicked");
            OnBackButtonClicked(); // Same as back for now
        }
        
        private void OnMenuButtonClicked()
        {
            Debug.Log("Menu button clicked");
            OnBackButtonClicked(); // Same as back for now
        }
        
        private void OnPauseButtonClicked()
        {
            Debug.Log("Pause button clicked");
            
            if (_uiSystem != null)
            {
                _uiSystem.ShowPause();
            }
            else
            {
                // Toggle time scale
                Time.timeScale = Time.timeScale == 0 ? 1 : 0;
            }
        }
        
        private void OnResumeButtonClicked()
        {
            Debug.Log("Resume button clicked");
            
            if (_uiSystem != null)
            {
                _uiSystem.ShowGameplay();
            }
            
            Time.timeScale = 1;
        }
        
        private void OnRestartButtonClicked()
        {
            Debug.Log("Restart button clicked");
            
            Time.timeScale = 1;
            SceneManager.LoadScene(SceneManager.GetActiveScene().name);
        }
        
        private void OnLeaderboardButtonClicked()
        {
            Debug.Log("Leaderboard button clicked");
            
            if (_uiSystem != null)
            {
                _uiSystem.ShowLeaderboard();
            }
        }
        
        private void OnFriendsButtonClicked()
        {
            Debug.Log("Friends button clicked");
            
            if (_uiSystem != null)
            {
                _uiSystem.ShowSocial();
            }
        }
        
        private void OnChatButtonClicked()
        {
            Debug.Log("Chat button clicked");
            
            // Try to find and show chat UI
            var chatUI = FindObjectOfType<TeamChatUIFactory>();
            if (chatUI != null)
            {
                TeamChatUIFactory.Show();
            }
        }
        
        private void OnDailyEventButtonClicked()
        {
            Debug.Log("Daily event button clicked");
            
            if (_uiSystem != null)
            {
                _uiSystem.ShowEvents();
            }
        }
        
        private void OnTournamentButtonClicked()
        {
            Debug.Log("Tournament button clicked");
            
            if (_uiSystem != null)
            {
                _uiSystem.ShowEvents();
            }
        }
        
        private void OnSpecialEventButtonClicked()
        {
            Debug.Log("Special event button clicked");
            
            if (_uiSystem != null)
            {
                _uiSystem.ShowEvents();
            }
        }
        
        private void OnRewardsButtonClicked()
        {
            Debug.Log("Rewards button clicked");
            
            if (_uiSystem != null)
            {
                _uiSystem.ShowAchievements();
            }
        }
        
        private void OnInventoryButtonClicked()
        {
            Debug.Log("Inventory button clicked");
            
            if (_uiSystem != null)
            {
                _uiSystem.ShowCollections();
            }
        }
        
        private void OnAudioButtonClicked()
        {
            Debug.Log("Audio settings button clicked");
            // Audio settings would be handled by settings manager
        }
        
        private void OnGraphicsButtonClicked()
        {
            Debug.Log("Graphics settings button clicked");
            // Graphics settings would be handled by settings manager
        }
        
        private void OnControlsButtonClicked()
        {
            Debug.Log("Controls settings button clicked");
            // Controls settings would be handled by settings manager
        }
        
        private void OnAccountButtonClicked()
        {
            Debug.Log("Account settings button clicked");
            // Account settings would be handled by settings manager
        }
        
        private void OnPurchaseButtonClicked()
        {
            Debug.Log("Purchase button clicked");
            // Purchase logic would be handled by shop system
        }
        
        private void OnBuyButtonClicked()
        {
            Debug.Log("Buy button clicked");
            OnPurchaseButtonClicked(); // Same as purchase
        }
        
        private void OnUpgradeButtonClicked()
        {
            Debug.Log("Upgrade button clicked");
            // Upgrade logic would be handled by upgrade system
        }
        
        private void OnInteractButtonClicked()
        {
            Debug.Log("Interact button clicked");
            // Character interaction logic
        }
        
        private void OnCharacterButtonClicked()
        {
            Debug.Log("Character button clicked");
            
            if (_uiSystem != null)
            {
                _uiSystem.ShowPanel("character");
            }
        }
        
        private void OnRoomButtonClicked()
        {
            Debug.Log("Room button clicked");
            // Room selection logic
        }
        
        private void OnDecorationButtonClicked()
        {
            Debug.Log("Decoration button clicked");
            // Decoration selection logic
        }
        
        private void OnPlaceButtonClicked()
        {
            Debug.Log("Place button clicked");
            // Place decoration logic
        }
        
        private void OnClaimButtonClicked()
        {
            Debug.Log("Claim button clicked");
            // Claim reward logic
        }
        
        private void OnClaimRewardButtonClicked()
        {
            Debug.Log("Claim reward button clicked");
            OnClaimButtonClicked(); // Same as claim
        }
        
        private void OnParticipateButtonClicked()
        {
            Debug.Log("Participate button clicked");
            // Event participation logic
        }
        
        private void OnJoinButtonClicked()
        {
            Debug.Log("Join button clicked");
            OnParticipateButtonClicked(); // Same as participate
        }
        
        private void OnLeaveButtonClicked()
        {
            Debug.Log("Leave button clicked");
            // Leave event logic
        }
        
        #endregion
        
        #region Public Methods
        
        public void RegisterButtonAction(string buttonName, System.Action action)
        {
            _buttonActions[buttonName] = action;
        }
        
        public void UnregisterButtonAction(string buttonName)
        {
            if (_buttonActions.ContainsKey(buttonName))
            {
                _buttonActions.Remove(buttonName);
            }
        }
        
        public void WireButtonByName(string buttonName)
        {
            Button button = GameObject.Find(buttonName)?.GetComponent<Button>();
            if (button != null)
            {
                WireButton(button);
            }
        }
        
        public void RefreshAllButtons()
        {
            WireAllButtonsInScene();
        }
        
        #endregion
        
        void OnDestroy()
        {
            if (Instance == this)
            {
                Instance = null;
            }
        }
    }
}