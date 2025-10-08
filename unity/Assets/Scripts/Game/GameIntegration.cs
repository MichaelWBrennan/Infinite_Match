using UnityEngine;
using Evergreen.MetaGame;
using Evergreen.Social;
using Evergreen.LiveOps;
using Evergreen.Collections;
using Evergreen.Character;
using Evergreen.UI;
using Evergreen.Effects;

namespace Evergreen.Game
{
    public class GameIntegration : MonoBehaviour
    {
        [Header("Systems")]
        public DecorationSystem decorationSystem;
        public LeaderboardSystem leaderboardSystem;
        public EventSystem eventSystem;
        public AchievementSystem achievementSystem;
        public CharacterSystem characterSystem;
        public MatchEffects matchEffects;
        
        [Header("UI")]
        public EnhancedMainMenuUI mainMenuUI;
        
        public static GameIntegration Instance { get; private set; }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeSystems();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            ConnectSystems();
            StartGameLoop();
        }
        
        private void InitializeSystems()
        {
            // Initialize all systems
            if (decorationSystem == null)
                decorationSystem = FindObjectOfType<DecorationSystem>();
            
            if (leaderboardSystem == null)
                leaderboardSystem = FindObjectOfType<LeaderboardSystem>();
            
            if (eventSystem == null)
                eventSystem = FindObjectOfType<EventSystem>();
            
            if (achievementSystem == null)
                achievementSystem = FindObjectOfType<AchievementSystem>();
            
            if (characterSystem == null)
                characterSystem = FindObjectOfType<CharacterSystem>();
            
            if (matchEffects == null)
                matchEffects = FindObjectOfType<MatchEffects>();
            
            if (mainMenuUI == null)
                mainMenuUI = FindObjectOfType<EnhancedMainMenuUI>();
        }
        
        private void ConnectSystems()
        {
            // Connect achievement system to game events
            ConnectAchievementsystemSafe();
            
            // Connect event system to game progress
            ConnectEventsystemSafe();
            
            // Connect character system to game interactions
            ConnectCharactersystemSafe();
            
            // Connect decoration system to rewards
            ConnectDecorationsystemSafe();
            
            // Connect leaderboard system to scoring
            ConnectLeaderboardsystemSafe();
        }
        
        private void ConnectAchievementsystemSafe()
        {
            // Connect to level completion
            // This would be called when a level is completed
            // AchievementSystem.Instance.UpdateProgress("levels_completed", 1);
            
            // Connect to match making
            // This would be called when matches are made
            // AchievementSystem.Instance.UpdateProgress("matches_made", matchCount);
        }
        
        private void ConnectEventsystemSafe()
        {
            // Connect to level completion for event progress
            // This would be called when a level is completed
            // EventSystem.Instance.UpdateEventProgress("daily_challenge", "levels_completed", 1);
        }
        
        private void ConnectCharactersystemSafe()
        {
            // Connect to level completion for character interactions
            // This would be called when a level is completed
            // CharacterSystem.Instance.AddCharacterExperience("mascot_sparky", 10);
        }
        
        private void ConnectDecorationsystemSafe()
        {
            // Connect to level completion for decoration rewards
            // This would be called when a level is completed
            // DecorationSystem.Instance.EarnRewards(coins, gems);
        }
        
        private void ConnectLeaderboardsystemSafe()
        {
            // Connect to level completion for leaderboard updates
            // This would be called when a level is completed
            // LeaderboardSystem.Instance.SubmitScore("weekly_score", score, level);
        }
        
        private void StartGameLoop()
        {
            // Start the main game loop
            InvokeRepeating(nameof(UpdateGameSystems), 1f, 1f);
        }
        
        private void UpdateGameSystems()
        {
            // Update all systems every second
            UpdateEnergysystemSafe();
            UpdateEventsystemSafe();
            UpdateCharactersystemSafe();
        }
        
        private void UpdateEnergysystemSafe()
        {
            // Update energy regeneration
            GameState.TickEnergyRefill();
            
            // Update UI if main menu is active
            if (mainMenuUI != null)
            {
                mainMenuUI.OnCurrencyChanged();
            }
        }
        
        private void UpdateEventsystemSafe()
        {
            // Event system updates are handled internally
            // This is just a placeholder for any additional updates needed
        }
        
        private void UpdateCharactersystemSafe()
        {
            // Character system updates are handled internally
            // This is just a placeholder for any additional updates needed
        }
        
        // Public methods to be called by game events
        public void OnLevelCompleted(int level, int score, int stars)
        {
            // Update all systems when a level is completed
            UpdateAchievementsOnLevelComplete(level, score, stars);
            UpdateEventsOnLevelComplete(level, score, stars);
            UpdateCharacterOnLevelComplete(level, score, stars);
            UpdateDecorationOnLevelComplete(level, score, stars);
            UpdateLeaderboardOnLevelComplete(level, score, stars);
        }
        
        public void OnLevelFailed(int level, int score)
        {
            // Update systems when a level is failed
            UpdateCharacterOnLevelFailed(level, score);
        }
        
        public void OnMatchMade(int matchSize, bool isSpecial)
        {
            // Update systems when a match is made
            UpdateAchievementsOnMatchMade(matchSize, isSpecial);
            UpdateCharacterOnMatchMade(matchSize, isSpecial);
        }
        
        public void OnSpecialPieceCreated(string pieceType)
        {
            // Update systems when a special piece is created
            UpdateAchievementsOnSpecialPiece(pieceType);
            UpdateCharacterOnSpecialPiece(pieceType);
        }
        
        private void UpdateAchievementsOnLevelComplete(int level, int score, int stars)
        {
            if (achievementSystem != null)
            {
                achievementSystem.UpdateProgress("levels_completed", 1);
                
                if (stars == 3)
                {
                    achievementSystem.UpdateProgress("three_star_levels", 1);
                }
                
                if (score > 50000) // High score threshold
                {
                    achievementSystem.UpdateProgress("high_score", 1);
                }
            }
        }
        
        private void UpdateEventsOnLevelComplete(int level, int score, int stars)
        {
            if (eventSystem != null)
            {
                eventSystem.UpdateEventProgress("daily_challenge", "levels_completed", 1);
                eventSystem.UpdateEventProgress("weekly_tournament", "score_achieved", score);
            }
        }
        
        private void UpdateCharacterOnLevelComplete(int level, int score, int stars)
        {
            if (characterSystem != null)
            {
                characterSystem.AddCharacterExperience("mascot_sparky", 10);
                
                // Set flags for character dialogue
                PlayerPrefs.SetInt("level_just_completed", 1);
                Invoke(nameof(ClearLevelCompletedFlag), 1f);
            }
        }
        
        private void UpdateDecorationOnLevelComplete(int level, int score, int stars)
        {
            if (decorationSystem != null)
            {
                var coins = score / 100; // 1 coin per 100 points
                var gems = stars; // 1 gem per star
                
                decorationSystem.EarnRewards(coins, gems);
            }
        }
        
        private void UpdateLeaderboardOnLevelComplete(int level, int score, int stars)
        {
            if (leaderboardSystem != null)
            {
                leaderboardSystem.SubmitScore("weekly_score", score, level);
                leaderboardSystem.SubmitScore("level_progress", level, level);
            }
        }
        
        private void UpdateCharacterOnLevelFailed(int level, int score)
        {
            if (characterSystem != null)
            {
                // Set flag for character dialogue
                PlayerPrefs.SetInt("level_just_failed", 1);
                Invoke(nameof(ClearLevelFailedFlag), 1f);
            }
        }
        
        private void UpdateAchievementsOnMatchMade(int matchSize, bool isSpecial)
        {
            if (achievementSystem != null)
            {
                achievementSystem.UpdateProgress("matches_made", 1);
                
                if (isSpecial)
                {
                    achievementSystem.UpdateProgress("special_matches", 1);
                }
            }
        }
        
        private void UpdateCharacterOnMatchMade(int matchSize, bool isSpecial)
        {
            if (characterSystem != null)
            {
                // Set flag for character dialogue
                if (isSpecial)
                {
                    PlayerPrefs.SetInt("special_match_just_made", 1);
                    Invoke(nameof(ClearSpecialMatchFlag), 1f);
                }
            }
        }
        
        private void UpdateAchievementsOnSpecialPiece(string pieceType)
        {
            if (achievementSystem != null)
            {
                achievementSystem.UpdateProgress("special_pieces_created", 1);
            }
        }
        
        private void UpdateCharacterOnSpecialPiece(string pieceType)
        {
            if (characterSystem != null)
            {
                characterSystem.AddCharacterExperience("mascot_sparky", 5);
            }
        }
        
        private void ClearLevelCompletedFlag()
        {
            PlayerPrefs.SetInt("level_just_completed", 0);
        }
        
        private void ClearLevelFailedFlag()
        {
            PlayerPrefs.SetInt("level_just_failed", 0);
        }
        
        private void ClearSpecialMatchFlag()
        {
            PlayerPrefs.SetInt("special_match_just_made", 0);
        }
        
        // Method to be called when the game starts
        public void StartNewGame()
        {
            // Initialize game state
            GameState.Load();
            
            // Reset character dialogue counts
            if (characterSystem != null)
            {
                characterSystem.ResetDialogueCounts();
            }
            
            // Show main menu
            if (mainMenuUI != null)
            {
                mainMenuUI.gameObject.SetActive(true);
            }
        }
        
        // Method to be called when the game ends
        public void EndGame()
        {
            // Save all data
            GameState.Save();
            
            // Save system data
            if (decorationSystem != null)
            {
                // DecorationSystem saves automatically
            }
            
            if (leaderboardSystem != null)
            {
                // LeaderboardSystem saves automatically
            }
            
            if (eventSystem != null)
            {
                // EventSystem saves automatically
            }
            
            if (achievementSystem != null)
            {
                // AchievementSystem saves automatically
            }
            
            if (characterSystem != null)
            {
                // CharacterSystem saves automatically
            }
        }
    }
}