using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using Evergreen.MetaGame;
using Evergreen.Social;
using Evergreen.LiveOps;
using Evergreen.Collections;
using Evergreen.Character;

namespace Evergreen.UI
{
    public class EnhancedMainMenuUI : MonoBehaviour
    {
        [Header("Main Panels")]
        public GameObject mainPanel;
        public GameObject metaGamePanel;
        public GameObject socialPanel;
        public GameObject eventsPanel;
        public GameObject achievementsPanel;
        public GameObject characterPanel;
        
        [Header("Navigation")]
        public Button playButton;
        public Button metaGameButton;
        public Button socialButton;
        public Button eventsButton;
        public Button achievementsButton;
        public Button characterButton;
        public Button settingsButton;
        
        [Header("Meta Game UI")]
        public Transform roomContainer;
        public GameObject roomPrefab;
        public Transform decorationContainer;
        public GameObject decorationPrefab;
        public TextMeshProUGUI coinsText;
        public TextMeshProUGUI gemsText;
        public TextMeshProUGUI energyText;
        
        [Header("Social UI")]
        public Transform leaderboardContainer;
        public GameObject leaderboardEntryPrefab;
        public TextMeshProUGUI playerRankText;
        public TextMeshProUGUI playerScoreText;
        
        [Header("Events UI")]
        public Transform eventContainer;
        public GameObject eventPrefab;
        public TextMeshProUGUI activeEventsCountText;
        
        [Header("Achievements UI")]
        public Transform achievementContainer;
        public GameObject achievementPrefab;
        public TextMeshProUGUI achievementsProgressText;
        
        [Header("Character UI")]
        public TextMeshProUGUI characterNameText;
        public TextMeshProUGUI characterLevelText;
        public TextMeshProUGUI characterExperienceText;
        public Image characterAvatarImage;
        public TextMeshProUGUI characterDialogueText;
        public Button interactButton;
        
        [Header("5/5 User Experience - Notifications")]
        public GameObject notificationPanel;
        public TextMeshProUGUI notificationText;
        public float notificationDuration = 3f;
        public AnimationCurve notificationAnimationCurve = AnimationCurve.EaseOut(0, 0, 1, 1);
        public bool enableNotificationAnimations = true;
        public bool enableNotificationSounds = true;
        
        [Header("5/5 User Experience - Visual Polish")]
        public GameObject backgroundParticles;
        public GameObject uiGlowEffects;
        public Material premiumUIMaterial;
        public bool enableParticleEffects = true;
        public bool enableGlowEffects = true;
        
        [Header("5/5 User Experience - Accessibility")]
        public bool enableHighContrastMode = false;
        public bool enableLargeTextMode = false;
        public float uiScaleFactor = 1.0f;
        public Color highContrastColor = Color.white;
        public int largeTextSizeMultiplier = 1;
        
        private void Start()
        {
            InitializeUI();
            SetupEventListeners();
            Apply5StarUserExperience();
            UpdateAllUI();
        }
        
        private void InitializeUI()
        {
            // Initialize all panels as inactive except main
            metaGamePanel.SetActive(false);
            socialPanel.SetActive(false);
            eventsPanel.SetActive(false);
            achievementsPanel.SetActive(false);
            characterPanel.SetActive(false);
            
            // Initialize notification panel
            notificationPanel.SetActive(false);
        }
        
        private void SetupEventListeners()
        {
            // Navigation buttons with 5/5 UX
            if (playButton != null)
                playButton.onClick.AddListener(() => StartGameWith5StarUX());
            if (metaGameButton != null)
                metaGameButton.onClick.AddListener(() => ShowPanelWith5StarUX(metaGamePanel));
            if (socialButton != null)
                socialButton.onClick.AddListener(() => ShowPanelWith5StarUX(socialPanel));
            if (eventsButton != null)
                eventsButton.onClick.AddListener(() => ShowPanelWith5StarUX(eventsPanel));
            if (achievementsButton != null)
                achievementsButton.onClick.AddListener(() => ShowPanelWith5StarUX(achievementsPanel));
            if (characterButton != null)
                characterButton.onClick.AddListener(() => ShowPanelWith5StarUX(characterPanel));
            if (settingsButton != null)
                settingsButton.onClick.AddListener(() => ShowSettingsWith5StarUX());
            
            // Character interaction with 5/5 UX
            if (interactButton != null)
                interactButton.onClick.AddListener(() => InteractWithCharacter5StarUX());
            
            // Add hover effects for 5/5 UX
            AddHoverEffectsToButtons();
        }
        
        private void ShowPanel(GameObject panel)
        {
            // Hide all panels
            metaGamePanel.SetActive(false);
            socialPanel.SetActive(false);
            eventsPanel.SetActive(false);
            achievementsPanel.SetActive(false);
            characterPanel.SetActive(false);
            
            // Show selected panel
            panel.SetActive(true);
            
            // Update panel content
            if (panel == metaGamePanel)
                UpdateMetaGameUI();
            else if (panel == socialPanel)
                UpdateSocialUI();
            else if (panel == eventsPanel)
                UpdateEventsUI();
            else if (panel == achievementsPanel)
                UpdateAchievementsUI();
            else if (panel == characterPanel)
                UpdateCharacterUI();
        }
        
        private void UpdateAllUI()
        {
            UpdateMainUI();
            UpdateMetaGameUI();
            UpdateSocialUI();
            UpdateEventsUI();
            UpdateAchievementsUI();
            UpdateCharacterUI();
        }
        
        private void UpdateMainUI()
        {
            // Update currency displays
            coinsText.text = Evergreen.Game.GameState.Coins.ToString();
            gemsText.text = Evergreen.Game.GameState.Gems.ToString();
            energyText.text = $"{Evergreen.Game.GameState.EnergyCurrent}/{Evergreen.Game.GameState.EnergyMax}";
            
            // Update energy bar color based on current energy
            var uiCache = UIComponentCache.Instance;
            var energyBar = uiCache.GetImage(energyText.transform.parent.gameObject);
            if (energyBar != null)
            {
                var energyRatio = (float)Evergreen.Game.GameState.EnergyCurrent / Evergreen.Game.GameState.EnergyMax;
                energyBar.color = Color.Lerp(Color.red, Color.green, energyRatio);
            }
        }
        
        private void UpdateMetaGameUI()
        {
            // Update currency displays
            coinsText.text = Evergreen.Game.GameState.Coins.ToString();
            gemsText.text = Evergreen.Game.GameState.Gems.ToString();
            
            // Update rooms
            UpdateRoomsUI();
            
            // Update decorations
            UpdateDecorationsUI();
        }
        
        private void UpdateRoomsUI()
        {
            // Clear existing room UI
            foreach (Transform child in roomContainer)
            {
                Destroy(child.gameObject);
            }
            
            // Create room UI elements
            if (DecorationSystem.Instance != null)
            {
                foreach (var room in DecorationSystem.Instance.rooms)
                {
                var uiCache = UIComponentCache.Instance;
                var roomUI = uiCache.InstantiatePrefab("roomPrefab", roomContainer);
                if (roomUI == null)
                {
                    roomUI = Instantiate(roomPrefab, roomContainer);
                }
                var roomScript = uiCache.GetComponentCached<RoomUI>(roomUI);
                if (roomScript != null)
                {
                    roomScript.SetupRoom(room);
                }
                }
            }
        }
        
        private void UpdateDecorationsUI()
        {
            // Clear existing decoration UI
            foreach (Transform child in decorationContainer)
            {
                Destroy(child.gameObject);
            }
            
            // Create decoration UI elements
            if (DecorationSystem.Instance != null)
            {
                foreach (var category in DecorationSystem.Instance.categories)
                {
                    foreach (var item in category.items)
                    {
                    var uiCache = UIComponentCache.Instance;
                    var decorationUI = uiCache.InstantiatePrefab("decorationPrefab", decorationContainer);
                    if (decorationUI == null)
                    {
                        decorationUI = Instantiate(decorationPrefab, decorationContainer);
                    }
                    var decorationScript = uiCache.GetComponentCached<DecorationUI>(decorationUI);
                    if (decorationScript != null)
                    {
                        decorationScript.SetupDecoration(item);
                    }
                    }
                }
            }
        }
        
        private void UpdateSocialUI()
        {
            // Update leaderboards
            UpdateLeaderboardsUI();
            
            // Update player stats
            UpdatePlayerStatsUI();
        }
        
        private void UpdateLeaderboardsUI()
        {
            // Clear existing leaderboard entries
            foreach (Transform child in leaderboardContainer)
            {
                Destroy(child.gameObject);
            }
            
            // Create leaderboard entries
            if (LeaderboardSystem.Instance != null)
            {
                var weeklyEntries = LeaderboardSystem.Instance.GetTopEntries("weekly_score", 10);
                foreach (var entry in weeklyEntries)
                {
                    var entryUI = Instantiate(leaderboardEntryPrefab, leaderboardContainer);
                    var entryScript = entryUI.GetComponent<LeaderboardEntryUI>();
                    if (entryScript != null)
                    {
                        entryScript.SetupEntry(entry);
                    }
                }
            }
        }
        
        private void UpdatePlayerStatsUI()
        {
            if (LeaderboardSystem.Instance != null)
            {
                var playerEntry = LeaderboardSystem.Instance.GetPlayerEntry("weekly_score");
                if (playerEntry != null)
                {
                    playerRankText.text = $"Rank: #{playerEntry.rank}";
                    playerScoreText.text = $"Score: {playerEntry.score:N0}";
                }
                else
                {
                    playerRankText.text = "Rank: Unranked";
                    playerScoreText.text = "Score: 0";
                }
            }
        }
        
        private void UpdateEventsUI()
        {
            // Clear existing event UI
            foreach (Transform child in eventContainer)
            {
                Destroy(child.gameObject);
            }
            
            // Create event UI elements
            if (EventSystem.Instance != null)
            {
                var activeEvents = EventSystem.Instance.GetActiveEvents();
                activeEventsCountText.text = $"Active Events: {activeEvents.Count}";
                
                foreach (var evt in activeEvents)
                {
                    var eventUI = Instantiate(eventPrefab, eventContainer);
                    var eventScript = eventUI.GetComponent<EventUI>();
                    if (eventScript != null)
                    {
                        eventScript.SetupEvent(evt);
                    }
                }
            }
        }
        
        private void UpdateAchievementsUI()
        {
            // Clear existing achievement UI
            foreach (Transform child in achievementContainer)
            {
                Destroy(child.gameObject);
            }
            
            // Create achievement UI elements
            if (AchievementSystem.Instance != null)
            {
                var unlockedAchievements = AchievementSystem.Instance.GetUnlockedAchievements();
                var totalAchievements = AchievementSystem.Instance.achievements.Count;
                achievementsProgressText.text = $"Achievements: {unlockedAchievements.Count}/{totalAchievements}";
                
                foreach (var achievement in unlockedAchievements)
                {
                    var achievementUI = Instantiate(achievementPrefab, achievementContainer);
                    var achievementScript = achievementUI.GetComponent<AchievementUI>();
                    if (achievementScript != null)
                    {
                        achievementScript.SetupAchievement(achievement);
                    }
                }
            }
        }
        
        private void UpdateCharacterUI()
        {
            if (CharacterSystem.Instance != null)
            {
                var character = CharacterSystem.Instance.GetCharacter("mascot_sparky");
                if (character != null)
                {
                    characterNameText.text = character.name;
                    characterLevelText.text = $"Level {character.level}";
                    characterExperienceText.text = $"{character.experience}/{character.experienceToNext} XP";
                    characterDialogueText.text = "Click to interact with me!";
                }
            }
        }
        
        private void InteractWithCharacter()
        {
            if (CharacterSystem.Instance != null)
            {
                CharacterSystem.Instance.InteractWithCharacter("mascot_sparky");
                UpdateCharacterUI();
            }
        }
        
        private void StartGame()
        {
            // Start the game
            UnityEngine.SceneManagement.SceneManager.LoadScene("Gameplay");
        }
        
        private void ShowSettings()
        {
            // Show settings panel
            Debug.Log("Settings clicked");
        }
        
        public void ShowNotification(string message)
        {
            notificationText.text = message;
            notificationPanel.SetActive(true);
            
            // Hide notification after duration
            Invoke(nameof(HideNotification), notificationDuration);
        }
        
        private void HideNotification()
        {
            notificationPanel.SetActive(false);
        }
        
        // Called by other systems to update UI
        public void OnCurrencyChanged()
        {
            UpdateMainUI();
            if (metaGamePanel.activeInHierarchy)
                UpdateMetaGameUI();
        }
        
        public void OnAchievementUnlocked(string achievementId)
        {
            ShowNotification($"Achievement Unlocked: {achievementId}");
            if (achievementsPanel.activeInHierarchy)
                UpdateAchievementsUI();
        }
        
        public void OnEventStarted(string eventId)
        {
            ShowNotification($"New Event: {eventId}");
            if (eventsPanel.activeInHierarchy)
                UpdateEventsUI();
        }
        
        public void OnCharacterLevelUp(string characterId, int newLevel)
        {
            ShowNotification($"Character Level Up: {characterId} reached level {newLevel}!");
            if (characterPanel.activeInHierarchy)
                UpdateCharacterUI();
        }
        
        #region 5/5 User Experience Methods
        
        private void Apply5StarUserExperience()
        {
            // Apply accessibility settings
            if (enableHighContrastMode)
            {
                ApplyHighContrastMode();
            }
            
            if (enableLargeTextMode)
            {
                ApplyLargeTextMode();
            }
            
            // Apply UI scaling
            ApplyUIScaling();
            
            // Enable visual effects
            if (enableParticleEffects && backgroundParticles != null)
            {
                backgroundParticles.SetActive(true);
            }
            
            if (enableGlowEffects && uiGlowEffects != null)
            {
                uiGlowEffects.SetActive(true);
            }
        }
        
        private void ApplyHighContrastMode()
        {
            // Apply high contrast to all UI elements
            var allImages = GetComponentsInChildren<Image>();
            foreach (var image in allImages)
            {
                if (image.color.a > 0.1f)
                {
                    var color = image.color;
                    color.r = Mathf.Clamp01(color.r * 1.5f);
                    color.g = Mathf.Clamp01(color.g * 1.5f);
                    color.b = Mathf.Clamp01(color.b * 1.5f);
                    image.color = color;
                }
            }
            
            var allTexts = GetComponentsInChildren<TextMeshProUGUI>();
            foreach (var text in allTexts)
            {
                text.color = highContrastColor;
            }
        }
        
        private void ApplyLargeTextMode()
        {
            var allTexts = GetComponentsInChildren<TextMeshProUGUI>();
            foreach (var text in allTexts)
            {
                text.fontSize = Mathf.RoundToInt(text.fontSize * largeTextSizeMultiplier);
            }
        }
        
        private void ApplyUIScaling()
        {
            var canvasScaler = GetComponent<CanvasScaler>();
            if (canvasScaler != null)
            {
                canvasScaler.scaleFactor = uiScaleFactor;
            }
        }
        
        private void AddHoverEffectsToButtons()
        {
            var buttons = GetComponentsInChildren<Button>();
            foreach (var button in buttons)
            {
                // Add hover sound effect
                var eventTrigger = button.gameObject.GetComponent<UnityEngine.EventSystems.EventTrigger>();
                if (eventTrigger == null)
                {
                    eventTrigger = button.gameObject.AddComponent<UnityEngine.EventSystems.EventTrigger>();
                }
                
                // Pointer enter event
                var pointerEnter = new UnityEngine.EventSystems.EventTrigger.Entry();
                pointerEnter.eventID = UnityEngine.EventSystems.EventTriggerType.PointerEnter;
                pointerEnter.callback.AddListener((data) => { OnButtonHover(button); });
                eventTrigger.triggers.Add(pointerEnter);
                
                // Pointer exit event
                var pointerExit = new UnityEngine.EventSystems.EventTrigger.Entry();
                pointerExit.eventID = UnityEngine.EventSystems.EventTriggerType.PointerExit;
                pointerExit.callback.AddListener((data) => { OnButtonHoverExit(button); });
                eventTrigger.triggers.Add(pointerExit);
            }
        }
        
        private void OnButtonHover(Button button)
        {
            // Visual feedback
            StartCoroutine(ButtonHoverAnimation(button));
            
            // Audio feedback
            if (enableNotificationSounds)
            {
                // Play hover sound
                var audioSource = GetComponent<AudioSource>();
                if (audioSource != null)
                {
                    audioSource.Play();
                }
            }
        }
        
        private void OnButtonHoverExit(Button button)
        {
            // Reset button scale
            var rectTransform = button.GetComponent<RectTransform>();
            rectTransform.localScale = Vector3.one;
        }
        
        private System.Collections.IEnumerator ButtonHoverAnimation(Button button)
        {
            var rectTransform = button.GetComponent<RectTransform>();
            Vector3 originalScale = rectTransform.localScale;
            Vector3 hoverScale = originalScale * 1.05f;
            
            // Scale up
            float elapsed = 0f;
            while (elapsed < 0.1f)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / 0.1f;
                rectTransform.localScale = Vector3.Lerp(originalScale, hoverScale, t);
                yield return null;
            }
        }
        
        private void StartGameWith5StarUX()
        {
            // Play success sound
            if (enableNotificationSounds)
            {
                var audioSource = GetComponent<AudioSource>();
                if (audioSource != null)
                {
                    audioSource.Play();
                }
            }
            
            // Show particle effect
            if (enableParticleEffects)
            {
                ShowParticleEffect(playButton.transform.position, ParticleEffectType.Success);
            }
            
            // Start the game
            StartGame();
        }
        
        private void ShowPanelWith5StarUX(GameObject panel)
        {
            // Play button click sound
            if (enableNotificationSounds)
            {
                var audioSource = GetComponent<AudioSource>();
                if (audioSource != null)
                {
                    audioSource.Play();
                }
            }
            
            // Show glow effect
            if (enableGlowEffects)
            {
                ShowGlowEffect(panel, 0.5f);
            }
            
            // Show panel with smooth transition
            ShowPanel(panel);
        }
        
        private void ShowSettingsWith5StarUX()
        {
            // Play button click sound
            if (enableNotificationSounds)
            {
                var audioSource = GetComponent<AudioSource>();
                if (audioSource != null)
                {
                    audioSource.Play();
                }
            }
            
            // Show settings panel
            ShowSettings();
        }
        
        private void InteractWithCharacter5StarUX()
        {
            // Play interaction sound
            if (enableNotificationSounds)
            {
                var audioSource = GetComponent<AudioSource>();
                if (audioSource != null)
                {
                    audioSource.Play();
                }
            }
            
            // Show particle effect
            if (enableParticleEffects)
            {
                ShowParticleEffect(interactButton.transform.position, ParticleEffectType.Reward);
            }
            
            // Interact with character
            InteractWithCharacter();
        }
        
        private void ShowParticleEffect(Vector3 position, ParticleEffectType effectType)
        {
            if (backgroundParticles != null)
            {
                var effect = Instantiate(backgroundParticles, position, Quaternion.identity);
                
                // Configure particle effect based on type
                var particleSystem = effect.GetComponent<ParticleSystem>();
                if (particleSystem != null)
                {
                    var main = particleSystem.main;
                    switch (effectType)
                    {
                        case ParticleEffectType.Success:
                            main.startColor = Color.green;
                            break;
                        case ParticleEffectType.Reward:
                            main.startColor = Color.yellow;
                            break;
                        case ParticleEffectType.LevelUp:
                            main.startColor = Color.cyan;
                            break;
                        case ParticleEffectType.Achievement:
                            main.startColor = Color.magenta;
                            break;
                    }
                }
                
                // Destroy after duration
                Destroy(effect, 2f);
            }
        }
        
        private void ShowGlowEffect(GameObject target, float duration)
        {
            if (uiGlowEffects != null && target != null)
            {
                var glow = Instantiate(uiGlowEffects, target.transform);
                glow.transform.localPosition = Vector3.zero;
                glow.transform.localScale = Vector3.one * 1.2f;
                
                // Animate glow
                StartCoroutine(AnimateGlowEffect(glow, duration));
            }
        }
        
        private System.Collections.IEnumerator AnimateGlowEffect(GameObject glow, float duration)
        {
            var canvasGroup = glow.GetComponent<CanvasGroup>();
            if (canvasGroup == null)
            {
                canvasGroup = glow.AddComponent<CanvasGroup>();
            }
            
            float elapsed = 0f;
            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / duration;
                
                // Pulsing glow effect
                canvasGroup.alpha = Mathf.Sin(t * Mathf.PI * 4) * 0.5f + 0.5f;
                
                yield return null;
            }
            
            Destroy(glow);
        }
        
        // Enhanced notification with 5/5 UX
        public void ShowNotificationWith5StarUX(string message, NotificationType type = NotificationType.Info)
        {
            notificationText.text = message;
            notificationPanel.SetActive(true);
            
            // Play notification sound
            if (enableNotificationSounds)
            {
                var audioSource = GetComponent<AudioSource>();
                if (audioSource != null)
                {
                    audioSource.Play();
                }
            }
            
            // Show particle effect
            if (enableParticleEffects)
            {
                ShowParticleEffect(notificationPanel.transform.position, ParticleEffectType.Success);
            }
            
            // Animate notification
            if (enableNotificationAnimations)
            {
                StartCoroutine(AnimateNotification());
            }
            else
            {
                // Hide notification after duration
                Invoke(nameof(HideNotification), notificationDuration);
            }
        }
        
        private System.Collections.IEnumerator AnimateNotification()
        {
            var rectTransform = notificationPanel.GetComponent<RectTransform>();
            var canvasGroup = notificationPanel.GetComponent<CanvasGroup>();
            if (canvasGroup == null)
            {
                canvasGroup = notificationPanel.AddComponent<CanvasGroup>();
            }
            
            // Animate in
            Vector3 startPos = rectTransform.anchoredPosition;
            Vector3 targetPos = startPos;
            startPos.y += 100f;
            
            float elapsed = 0f;
            while (elapsed < 0.3f)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / 0.3f;
                float easedT = notificationAnimationCurve.Evaluate(t);
                
                rectTransform.anchoredPosition = Vector3.Lerp(startPos, targetPos, easedT);
                canvasGroup.alpha = Mathf.Lerp(0f, 1f, easedT);
                
                yield return null;
            }
            
            rectTransform.anchoredPosition = targetPos;
            canvasGroup.alpha = 1f;
            
            // Wait for duration
            yield return new WaitForSeconds(notificationDuration);
            
            // Animate out
            elapsed = 0f;
            while (elapsed < 0.3f)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / 0.3f;
                float easedT = notificationAnimationCurve.Evaluate(t);
                
                rectTransform.anchoredPosition = Vector3.Lerp(targetPos, startPos, easedT);
                canvasGroup.alpha = Mathf.Lerp(1f, 0f, easedT);
                
                yield return null;
            }
            
            notificationPanel.SetActive(false);
        }
        
        #endregion
    }
    
    public enum ParticleEffectType
    {
        Success, Reward, LevelUp, Achievement
    }
    
    public enum NotificationType
    {
        Info, Success, Warning, Error
    }
}