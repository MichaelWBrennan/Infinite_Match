using UnityEngine;
using Evergreen.Core;
using Evergreen.Game;
using Evergreen.MetaGame;
using Evergreen.Character;
using Evergreen.Effects;
using Evergreen.Audio;
using Evergreen.UI;

namespace Evergreen.Core
{
    /// <summary>
    /// Central integration manager that coordinates all game systems
    /// </summary>
    public class GameIntegrationManager : MonoBehaviour
    {
        [Header("System References")]
        public CastleRenovationSystem castleSystem;
        public EnergySystem energySystem;
        public CharacterSystem characterSystem;
        public EnhancedMatchEffects matchEffects;
        public EnhancedAudioManager audioManager;
        public EnhancedUIManager uiManager;
        
        [Header("Integration Settings")]
        public bool enableSystemIntegration = true;
        public bool enableAudioIntegration = true;
        public bool enableVisualIntegration = true;
        public bool enableUIIntegration = true;
        
        public static GameIntegrationManager Instance { get; private set; }
        
        private bool _isInitialized = false;
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            if (enableSystemIntegration)
            {
                InitializeIntegration();
            }
        }
        
        private void InitializeIntegration()
        {
            if (_isInitialized) return;
            
            Debug.Log("Initializing game system integration...");
            
            // Get system references
            castleSystem = ServiceLocator.Get<CastleRenovationSystem>();
            energySystem = ServiceLocator.Get<EnergySystem>();
            characterSystem = ServiceLocator.Get<CharacterSystem>();
            matchEffects = ServiceLocator.Get<EnhancedMatchEffects>();
            audioManager = ServiceLocator.Get<EnhancedAudioManager>();
            uiManager = ServiceLocator.Get<EnhancedUIManager>();
            
            // Setup system integrations
            SetupCastleIntegration();
            SetupEnergyIntegration();
            SetupCharacterIntegration();
            SetupAudioIntegration();
            SetupVisualIntegration();
            SetupUIIntegration();
            
            _isInitialized = true;
            Debug.Log("Game system integration completed");
        }
        
        private void SetupCastleIntegration()
        {
            if (castleSystem == null) return;
            
            // Castle system events
            castleSystem.OnRoomUnlocked += OnRoomUnlocked;
            castleSystem.OnRoomCompleted += OnRoomCompleted;
            castleSystem.OnTaskCompleted += OnTaskCompleted;
            castleSystem.OnRewardEarned += OnRewardEarned;
            castleSystem.OnDecorationPurchased += OnDecorationPurchased;
        }
        
        private void SetupEnergyIntegration()
        {
            if (energySystem == null) return;
            
            // Energy system events
            energySystem.OnEnergyChanged += OnEnergyChanged;
            energySystem.OnEnergyRefilled += OnEnergyRefilled;
            energySystem.OnEnergyDepleted += OnEnergyDepleted;
        }
        
        private void SetupCharacterIntegration()
        {
            if (characterSystem == null) return;
            
            // Character system events
            characterSystem.OnCharacterUnlocked += OnCharacterUnlocked;
            characterSystem.OnCharacterLevelUp += OnCharacterLevelUp;
            characterSystem.OnAbilityUnlocked += OnAbilityUnlocked;
        }
        
        private void SetupAudioIntegration()
        {
            if (audioManager == null) return;
            
            // Audio integration will be handled by individual systems
            Debug.Log("Audio integration setup completed");
        }
        
        private void SetupVisualIntegration()
        {
            if (matchEffects == null) return;
            
            // Visual effects integration will be handled by individual systems
            Debug.Log("Visual integration setup completed");
        }
        
        private void SetupUIIntegration()
        {
            if (uiManager == null) return;
            
            // UI integration will be handled by individual systems
            Debug.Log("UI integration setup completed");
        }
        
        // Castle System Event Handlers
        private void OnRoomUnlocked(Room room)
        {
            Debug.Log($"Room unlocked: {room.name}");
            
            if (enableAudioIntegration && audioManager != null)
            {
                audioManager.PlaySFX("room_unlocked");
            }
            
            if (enableVisualIntegration && matchEffects != null)
            {
                matchEffects.PlayCustomEffect(Vector3.zero, null, null, 0);
            }
            
            if (enableUIIntegration && uiManager != null)
            {
                uiManager.ShowNotification($"New room unlocked: {room.name}!");
            }
        }
        
        private void OnRoomCompleted(Room room)
        {
            Debug.Log($"Room completed: {room.name}");
            
            if (enableAudioIntegration && audioManager != null)
            {
                audioManager.PlaySFX("room_completed");
            }
            
            if (enableVisualIntegration && matchEffects != null)
            {
                matchEffects.PlayLevelCompleteEffect(Vector3.zero);
            }
            
            if (enableUIIntegration && uiManager != null)
            {
                uiManager.ShowNotification($"Room completed: {room.name}!");
            }
        }
        
        private void OnTaskCompleted(Task task)
        {
            Debug.Log($"Task completed: {task.description}");
            
            if (enableAudioIntegration && audioManager != null)
            {
                audioManager.PlaySFX("task_completed");
            }
            
            if (enableUIIntegration && uiManager != null)
            {
                uiManager.ShowNotification($"Task completed: {task.description}!");
            }
        }
        
        private void OnRewardEarned(Reward reward)
        {
            Debug.Log($"Reward earned: {reward.amount} {reward.type}");
            
            if (enableAudioIntegration && audioManager != null)
            {
                if (reward.type == "coins")
                {
                    audioManager.PlaySFX("coin_collect");
                }
                else if (reward.type == "gems")
                {
                    audioManager.PlaySFX("gem_collect");
                }
            }
            
            if (enableVisualIntegration && matchEffects != null)
            {
                if (reward.type == "coins")
                {
                    matchEffects.PlayCoinCollectEffect(Vector3.zero, reward.amount);
                }
                else if (reward.type == "gems")
                {
                    matchEffects.PlayGemCollectEffect(Vector3.zero, reward.amount);
                }
            }
            
            if (enableUIIntegration && uiManager != null)
            {
                uiManager.ShowRewardPopup("Reward Earned", reward.type, null, reward.amount);
            }
        }
        
        private void OnDecorationPurchased(Decoration decoration)
        {
            Debug.Log($"Decoration purchased: {decoration.name}");
            
            if (enableAudioIntegration && audioManager != null)
            {
                audioManager.PlaySFX("decoration_purchased");
            }
            
            if (enableUIIntegration && uiManager != null)
            {
                uiManager.ShowNotification($"Decoration purchased: {decoration.name}!");
            }
        }
        
        // Energy System Event Handlers
        private void OnEnergyChanged(int current, int max)
        {
            Debug.Log($"Energy changed: {current}/{max}");
            
            if (enableUIIntegration && uiManager != null)
            {
                // Update energy UI
                uiManager.ShowNotification($"Energy: {current}/{max}");
            }
        }
        
        private void OnEnergyRefilled()
        {
            Debug.Log("Energy refilled");
            
            if (enableAudioIntegration && audioManager != null)
            {
                audioManager.PlaySFX("energy_refilled");
            }
            
            if (enableUIIntegration && uiManager != null)
            {
                uiManager.ShowNotification("Energy refilled!");
            }
        }
        
        private void OnEnergyDepleted()
        {
            Debug.Log("Energy depleted");
            
            if (enableAudioIntegration && audioManager != null)
            {
                audioManager.PlaySFX("energy_depleted");
            }
            
            if (enableUIIntegration && uiManager != null)
            {
                uiManager.ShowNotification("Energy depleted! Wait or refill to continue.");
            }
        }
        
        // Character System Event Handlers
        private void OnCharacterUnlocked(Character character)
        {
            Debug.Log($"Character unlocked: {character.name}");
            
            if (enableAudioIntegration && audioManager != null)
            {
                audioManager.PlaySFX("character_unlocked");
            }
            
            if (enableUIIntegration && uiManager != null)
            {
                uiManager.ShowNotification($"New character unlocked: {character.name}!");
            }
        }
        
        private void OnCharacterLevelUp(Character character)
        {
            Debug.Log($"Character level up: {character.name} to level {character.level}");
            
            if (enableAudioIntegration && audioManager != null)
            {
                audioManager.PlaySFX("character_level_up");
            }
            
            if (enableVisualIntegration && matchEffects != null)
            {
                matchEffects.PlayLevelCompleteEffect(Vector3.zero);
            }
            
            if (enableUIIntegration && uiManager != null)
            {
                uiManager.ShowNotification($"{character.name} reached level {character.level}!");
            }
        }
        
        private void OnAbilityUnlocked(CharacterAbility ability)
        {
            Debug.Log($"Ability unlocked: {ability.name}");
            
            if (enableAudioIntegration && audioManager != null)
            {
                audioManager.PlaySFX("ability_unlocked");
            }
            
            if (enableUIIntegration && uiManager != null)
            {
                uiManager.ShowNotification($"New ability unlocked: {ability.name}!");
            }
        }
        
        // Public methods for external systems
        public void OnLevelCompleted(int levelNumber, int score, int movesUsed)
        {
            if (castleSystem != null)
            {
                castleSystem.OnLevelCompleted(levelNumber, score, movesUsed);
            }
            
            if (characterSystem != null)
            {
                characterSystem.AddExperience(CalculateExperienceReward(score, movesUsed));
            }
            
            if (enableAudioIntegration && audioManager != null)
            {
                audioManager.PlaySFX("level_complete");
            }
            
            if (enableVisualIntegration && matchEffects != null)
            {
                matchEffects.PlayLevelCompleteEffect(Vector3.zero);
            }
        }
        
        public void OnLevelFailed()
        {
            if (castleSystem != null)
            {
                castleSystem.OnLevelFailed();
            }
            
            if (energySystem != null)
            {
                energySystem.OnLevelFailed();
            }
            
            if (enableAudioIntegration && audioManager != null)
            {
                audioManager.PlaySFX("level_failed");
            }
        }
        
        public void OnMatchMade(int matchCount, bool isSpecial)
        {
            if (enableAudioIntegration && audioManager != null)
            {
                if (isSpecial)
                {
                    audioManager.PlaySFX("special_match");
                }
                else
                {
                    audioManager.PlaySFX("normal_match");
                }
            }
            
            if (enableVisualIntegration && matchEffects != null)
            {
                matchEffects.PlayMatchEffect(Vector3.zero, matchCount, isSpecial);
            }
        }
        
        public void OnComboCreated(int comboSize)
        {
            if (castleSystem != null)
            {
                castleSystem.OnComboCreated(comboSize);
            }
            
            if (enableAudioIntegration && audioManager != null)
            {
                audioManager.PlaySFX("combo_created");
            }
            
            if (enableVisualIntegration && matchEffects != null)
            {
                matchEffects.PlayComboEffect(Vector3.zero, comboSize);
            }
        }
        
        public void OnSpecialPieceUsed(string pieceType)
        {
            if (castleSystem != null)
            {
                castleSystem.OnSpecialPieceUsed(pieceType);
            }
            
            if (enableAudioIntegration && audioManager != null)
            {
                audioManager.PlaySFX("special_piece_used");
            }
        }
        
        public void OnCurrencyEarned(string currencyType, int amount)
        {
            if (enableAudioIntegration && audioManager != null)
            {
                if (currencyType == "coins")
                {
                    audioManager.PlaySFX("coin_earned");
                }
                else if (currencyType == "gems")
                {
                    audioManager.PlaySFX("gem_earned");
                }
            }
            
            if (enableVisualIntegration && matchEffects != null)
            {
                if (currencyType == "coins")
                {
                    matchEffects.PlayCoinCollectEffect(Vector3.zero, amount);
                }
                else if (currencyType == "gems")
                {
                    matchEffects.PlayGemCollectEffect(Vector3.zero, amount);
                }
            }
        }
        
        private int CalculateExperienceReward(int score, int movesUsed)
        {
            int baseExp = Mathf.FloorToInt(score / 100f);
            int efficiencyBonus = Mathf.Max(0, 20 - movesUsed) * 2;
            return baseExp + efficiencyBonus;
        }
        
        public void SetAudioEnabled(bool enabled)
        {
            enableAudioIntegration = enabled;
            if (audioManager != null)
            {
                audioManager.SetMasterVolume(enabled ? 1.0f : 0.0f);
            }
        }
        
        public void SetVisualEffectsEnabled(bool enabled)
        {
            enableVisualIntegration = enabled;
        }
        
        public void SetUIEnabled(bool enabled)
        {
            enableUIIntegration = enabled;
        }
        
        void OnDestroy()
        {
            // Unsubscribe from events
            if (castleSystem != null)
            {
                castleSystem.OnRoomUnlocked -= OnRoomUnlocked;
                castleSystem.OnRoomCompleted -= OnRoomCompleted;
                castleSystem.OnTaskCompleted -= OnTaskCompleted;
                castleSystem.OnRewardEarned -= OnRewardEarned;
                castleSystem.OnDecorationPurchased -= OnDecorationPurchased;
            }
            
            if (energySystem != null)
            {
                energySystem.OnEnergyChanged -= OnEnergyChanged;
                energySystem.OnEnergyRefilled -= OnEnergyRefilled;
                energySystem.OnEnergyDepleted -= OnEnergyDepleted;
            }
            
            if (characterSystem != null)
            {
                characterSystem.OnCharacterUnlocked -= OnCharacterUnlocked;
                characterSystem.OnCharacterLevelUp -= OnCharacterLevelUp;
                characterSystem.OnAbilityUnlocked -= OnAbilityUnlocked;
            }
        }
    }
}