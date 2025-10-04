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
        
        [Header("Notifications")]
        public GameObject notificationPanel;
        public TextMeshProUGUI notificationText;
        public float notificationDuration = 3f;
        
        private void Start()
        {
            InitializeUI();
            SetupEventListeners();
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
            // Navigation buttons
            playButton.onClick.AddListener(() => StartGame());
            metaGameButton.onClick.AddListener(() => ShowPanel(metaGamePanel));
            socialButton.onClick.AddListener(() => ShowPanel(socialPanel));
            eventsButton.onClick.AddListener(() => ShowPanel(eventsPanel));
            achievementsButton.onClick.AddListener(() => ShowPanel(achievementsPanel));
            characterButton.onClick.AddListener(() => ShowPanel(characterPanel));
            settingsButton.onClick.AddListener(() => ShowSettings());
            
            // Character interaction
            interactButton.onClick.AddListener(() => InteractWithCharacter());
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
            var energyBar = energyText.transform.parent.GetComponent<Image>();
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
                    var roomUI = Instantiate(roomPrefab, roomContainer);
                    var roomScript = roomUI.GetComponent<RoomUI>();
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
                        var decorationUI = Instantiate(decorationPrefab, decorationContainer);
                        var decorationScript = decorationUI.GetComponent<DecorationUI>();
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
    }
}