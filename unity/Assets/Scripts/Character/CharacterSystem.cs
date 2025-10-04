using System.Collections.Generic;
using UnityEngine;
using System;

namespace Evergreen.Character
{
    [Serializable]
    public class CharacterData
    {
        public string characterId;
        public string name;
        public CharacterType type;
        public int level;
        public int experience;
        public int experienceToNext;
        public Dictionary<string, object> stats = new Dictionary<string, object>();
        public Dictionary<string, object> personality = new Dictionary<string, object>();
        public List<string> unlockedEmotions = new List<string>();
        public string currentEmotion;
        public bool isUnlocked;
        public long lastInteraction;
    }
    
    public enum CharacterType
    {
        Mascot,
        Helper,
        Villain,
        Shopkeeper,
        Guide
    }
    
    [Serializable]
    public class CharacterDialogue
    {
        public string dialogueId;
        public string characterId;
        public string emotion;
        public string text;
        public List<string> responses = new List<string>();
        public Dictionary<string, object> conditions = new Dictionary<string, object>();
        public bool isRepeatable;
        public int priority;
    }
    
    [Serializable]
    public class CharacterAnimation
    {
        public string animationId;
        public string characterId;
        public string trigger;
        public float duration;
        public bool loop;
        public Dictionary<string, object> parameters = new Dictionary<string, object>();
    }
    
    public class CharacterSystem : MonoBehaviour
    {
        [Header("Characters")]
        public List<CharacterData> characters = new List<CharacterData>();
        public List<CharacterDialogue> dialogues = new List<CharacterDialogue>();
        public List<CharacterAnimation> animations = new List<CharacterAnimation>();
        
        [Header("Settings")]
        public float interactionCooldown = 30f; // 30 seconds between interactions
        public int maxDialoguePerSession = 5;
        
        public static CharacterSystem Instance { get; private set; }
        
        private Dictionary<string, int> dialogueCounts = new Dictionary<string, int>();
        private Dictionary<string, float> lastInteractionTimes = new Dictionary<string, float>();
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeCharacters();
                InitializeDialogues();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            LoadCharacterData();
        }
        
        private void InitializeCharacters()
        {
            characters = new List<CharacterData>
            {
                new CharacterData
                {
                    characterId = "mascot_sparky",
                    name = "Sparky",
                    type = CharacterType.Mascot,
                    level = 1,
                    experience = 0,
                    experienceToNext = 100,
                    stats = new Dictionary<string, object>
                    {
                        {"happiness", 50},
                        {"energy", 100},
                        {"friendliness", 75},
                        {"helpfulness", 80}
                    },
                    personality = new Dictionary<string, object>
                    {
                        {"cheerful", true},
                        {"encouraging", true},
                        {"playful", true},
                        {"supportive", true}
                    },
                    unlockedEmotions = new List<string> { "happy", "excited", "encouraging" },
                    currentEmotion = "happy",
                    isUnlocked = true,
                    lastInteraction = 0
                },
                new CharacterData
                {
                    characterId = "helper_wisdom",
                    name = "Wisdom",
                    type = CharacterType.Helper,
                    level = 1,
                    experience = 0,
                    experienceToNext = 150,
                    stats = new Dictionary<string, object>
                    {
                        {"wisdom", 90},
                        {"patience", 85},
                        {"knowledge", 95},
                        {"guidance", 88}
                    },
                    personality = new Dictionary<string, object>
                    {
                        {"wise", true},
                        {"patient", true},
                        {"knowledgeable", true},
                        {"helpful", true}
                    },
                    unlockedEmotions = new List<string> { "wise", "thoughtful", "encouraging" },
                    currentEmotion = "wise",
                    isUnlocked = false,
                    lastInteraction = 0
                }
            };
        }
        
        private void InitializeDialogues()
        {
            dialogues = new List<CharacterDialogue>
            {
                new CharacterDialogue
                {
                    dialogueId = "sparky_welcome",
                    characterId = "mascot_sparky",
                    emotion = "happy",
                    text = "Welcome to the magical world of Evergreen! I'm Sparky, your cheerful companion!",
                    responses = new List<string> { "Nice to meet you!", "Tell me more!", "Thanks!" },
                    conditions = new Dictionary<string, object> { {"first_visit", true} },
                    isRepeatable = false,
                    priority = 10
                },
                new CharacterDialogue
                {
                    dialogueId = "sparky_encouragement",
                    characterId = "mascot_sparky",
                    emotion = "encouraging",
                    text = "You're doing great! Keep matching those gems and you'll master this game in no time!",
                    responses = new List<string> { "Thanks for the encouragement!", "I'll keep trying!", "You're the best!" },
                    conditions = new Dictionary<string, object> { {"level_completed", true} },
                    isRepeatable = true,
                    priority = 5
                },
                new CharacterDialogue
                {
                    dialogueId = "sparky_celebration",
                    characterId = "mascot_sparky",
                    emotion = "excited",
                    text = "Wow! That was an amazing match! You're getting better and better!",
                    responses = new List<string> { "I'm getting the hang of it!", "Thanks Sparky!", "This is fun!" },
                    conditions = new Dictionary<string, object> { {"special_match", true} },
                    isRepeatable = true,
                    priority = 7
                },
                new CharacterDialogue
                {
                    dialogueId = "wisdom_tip",
                    characterId = "helper_wisdom",
                    emotion = "wise",
                    text = "A wise player knows that patience and strategy often lead to the best results.",
                    responses = new List<string> { "That's helpful advice", "I'll remember that", "Thank you" },
                    conditions = new Dictionary<string, object> { {"level_failed", true} },
                    isRepeatable = true,
                    priority = 3
                }
            };
        }
        
        public CharacterData GetCharacter(string characterId)
        {
            return characters.Find(c => c.characterId == characterId);
        }
        
        public List<CharacterDialogue> GetAvailableDialogues(string characterId)
        {
            var character = GetCharacter(characterId);
            if (character == null || !character.isUnlocked) return new List<CharacterDialogue>();
            
            var available = new List<CharacterDialogue>();
            var currentTime = Time.time;
            var lastInteraction = lastInteractionTimes.GetValueOrDefault(characterId, 0f);
            
            // Check cooldown
            if (currentTime - lastInteraction < interactionCooldown) return available;
            
            // Check dialogue count limit
            var dialogueCount = dialogueCounts.GetValueOrDefault(characterId, 0);
            if (dialogueCount >= maxDialoguePerSession) return available;
            
            foreach (var dialogue in dialogues)
            {
                if (dialogue.characterId != characterId) continue;
                if (!dialogue.isRepeatable && HasSeenDialogue(dialogue.dialogueId)) continue;
                if (!CheckDialogueConditions(dialogue)) continue;
                
                available.Add(dialogue);
            }
            
            // Sort by priority (higher first)
            available.Sort((a, b) => b.priority.CompareTo(a.priority));
            
            return available;
        }
        
        public CharacterDialogue GetRandomDialogue(string characterId)
        {
            var available = GetAvailableDialogues(characterId);
            if (available.Count == 0) return null;
            
            // Weight by priority
            var totalWeight = 0;
            foreach (var dialogue in available)
            {
                totalWeight += dialogue.priority;
            }
            
            var randomWeight = UnityEngine.Random.Range(0, totalWeight);
            var currentWeight = 0;
            
            foreach (var dialogue in available)
            {
                currentWeight += dialogue.priority;
                if (randomWeight < currentWeight)
                {
                    return dialogue;
                }
            }
            
            return available[0]; // Fallback
        }
        
        public void InteractWithCharacter(string characterId)
        {
            var character = GetCharacter(characterId);
            if (character == null) return;
            
            var dialogue = GetRandomDialogue(characterId);
            if (dialogue == null) return;
            
            // Update interaction time
            lastInteractionTimes[characterId] = Time.time;
            
            // Increment dialogue count
            dialogueCounts[characterId] = dialogueCounts.GetValueOrDefault(characterId, 0) + 1;
            
            // Update character experience
            AddCharacterExperience(characterId, 10);
            
            // Update character emotion based on dialogue
            character.currentEmotion = dialogue.emotion;
            
            // Show dialogue (this would trigger UI)
            ShowDialogue(dialogue);
            
            // Analytics
            Evergreen.Game.AnalyticsAdapter.CustomEvent("character_interaction", new Dictionary<string, object>
            {
                {"character_id", characterId},
                {"dialogue_id", dialogue.dialogueId},
                {"emotion", dialogue.emotion}
            });
        }
        
        public void AddCharacterExperience(string characterId, int amount)
        {
            var character = GetCharacter(characterId);
            if (character == null) return;
            
            character.experience += amount;
            
            // Check for level up
            while (character.experience >= character.experienceToNext)
            {
                LevelUpCharacter(character);
            }
            
            SaveCharacterData();
        }
        
        private void LevelUpCharacter(CharacterData character)
        {
            character.experience -= character.experienceToNext;
            character.level++;
            character.experienceToNext = Mathf.RoundToInt(character.experienceToNext * 1.2f);
            
            // Unlock new emotions
            UnlockNewEmotions(character);
            
            // Show level up notification
            ShowLevelUpNotification(character);
            
            // Analytics
            Evergreen.Game.AnalyticsAdapter.CustomEvent("character_level_up", new Dictionary<string, object>
            {
                {"character_id", character.characterId},
                {"new_level", character.level}
            });
        }
        
        private void UnlockNewEmotions(CharacterData character)
        {
            var newEmotions = new Dictionary<int, string[]>
            {
                { 2, new[] { "proud", "confident" } },
                { 3, new[] { "cheerful", "energetic" } },
                { 5, new[] { "wise", "thoughtful" } },
                { 10, new[] { "mysterious", "intriguing" } }
            };
            
            if (newEmotions.ContainsKey(character.level))
            {
                foreach (var emotion in newEmotions[character.level])
                {
                    if (!character.unlockedEmotions.Contains(emotion))
                    {
                        character.unlockedEmotions.Add(emotion);
                    }
                }
            }
        }
        
        private bool CheckDialogueConditions(CharacterDialogue dialogue)
        {
            foreach (var condition in dialogue.conditions)
            {
                switch (condition.Key)
                {
                    case "first_visit":
                        if ((bool)condition.Value && !IsFirstVisit()) return false;
                        break;
                    case "level_completed":
                        if ((bool)condition.Value && !WasLevelJustCompleted()) return false;
                        break;
                    case "special_match":
                        if ((bool)condition.Value && !WasSpecialMatchJustMade()) return false;
                        break;
                    case "level_failed":
                        if ((bool)condition.Value && !WasLevelJustFailed()) return false;
                        break;
                }
            }
            return true;
        }
        
        private bool HasSeenDialogue(string dialogueId)
        {
            return PlayerPrefs.GetInt($"dialogue_seen_{dialogueId}", 0) == 1;
        }
        
        private bool IsFirstVisit()
        {
            return PlayerPrefs.GetInt("first_visit", 0) == 0;
        }
        
        private bool WasLevelJustCompleted()
        {
            // This would be set by the game when a level is completed
            return PlayerPrefs.GetInt("level_just_completed", 0) == 1;
        }
        
        private bool WasSpecialMatchJustMade()
        {
            // This would be set by the game when a special match is made
            return PlayerPrefs.GetInt("special_match_just_made", 0) == 1;
        }
        
        private bool WasLevelJustFailed()
        {
            // This would be set by the game when a level is failed
            return PlayerPrefs.GetInt("level_just_failed", 0) == 1;
        }
        
        private void ShowDialogue(CharacterDialogue dialogue)
        {
            // This would trigger the UI to show the dialogue
            Debug.Log($"[{dialogue.characterId}] {dialogue.text}");
            
            // Mark as seen
            PlayerPrefs.SetInt($"dialogue_seen_{dialogue.dialogueId}", 1);
        }
        
        private void ShowLevelUpNotification(CharacterData character)
        {
            // This would show a level up notification
            Debug.Log($"{character.name} leveled up to level {character.level}!");
        }
        
        public void ResetDialogueCounts()
        {
            dialogueCounts.Clear();
        }
        
        private void LoadCharacterData()
        {
            var data = PlayerPrefs.GetString("CharacterData", "");
            if (!string.IsNullOrEmpty(data))
            {
                try
                {
                    var characterData = JsonUtility.FromJson<CharacterData[]>(data);
                    if (characterData != null)
                    {
                        characters = new List<CharacterData>(characterData);
                    }
                }
                catch (Exception e)
                {
                    Debug.LogError($"Failed to load character data: {e.Message}");
                }
            }
        }
        
        private void SaveCharacterData()
        {
            try
            {
                var data = JsonUtility.ToJson(characters.ToArray());
                PlayerPrefs.SetString("CharacterData", data);
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to save character data: {e.Message}");
            }
        }
    }
}