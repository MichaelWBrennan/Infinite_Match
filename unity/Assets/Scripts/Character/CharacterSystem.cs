using UnityEngine;
using System.Collections.Generic;
using System;
using Evergreen.Core;

namespace Evergreen.Character
{
    [System.Serializable]
    public class Character
    {
        public string id;
        public string name;
        public string description;
        public int level;
        public int experience;
        public int experienceToNextLevel;
        public List<string> unlockedAbilities = new List<string>();
        public Dictionary<string, int> stats = new Dictionary<string, int>();
        public bool isUnlocked;
        public int unlockLevel;
        public Sprite portrait;
        public Sprite fullBodySprite;
        public string voiceActor;
        public List<string> dialogueLines = new List<string>();
    }
    
    [System.Serializable]
    public class CharacterAbility
    {
        public string id;
        public string name;
        public string description;
        public int level;
        public int maxLevel;
        public int cost;
        public string currencyType;
        public bool isUnlocked;
        public bool isActive;
        public float cooldown;
        public float duration;
        public int power;
    }
    
    [System.Serializable]
    public class CharacterDialogue
    {
        public string id;
        public string characterId;
        public string context; // "level_start", "level_complete", "level_fail", "shop", "castle", etc.
        public string text;
        public string emotion; // "happy", "sad", "excited", "worried", etc.
        public bool isUnlocked;
        public int unlockLevel;
    }
    
    public class CharacterSystem : MonoBehaviour
    {
        [Header("Character Settings")]
        public List<Character> characters = new List<Character>();
        public List<CharacterAbility> abilities = new List<CharacterAbility>();
        public List<CharacterDialogue> dialogues = new List<CharacterDialogue>();
        
        [Header("Experience Settings")]
        public int baseExperiencePerLevel = 100;
        public float experienceMultiplier = 1.5f;
        public int maxLevel = 50;
        
        [Header("UI References")]
        public GameObject characterSelectPanel;
        public GameObject characterDetailPanel;
        public GameObject abilityTreePanel;
        
        private Character _currentCharacter;
        private Dictionary<string, Character> _characterLookup = new Dictionary<string, Character>();
        private Dictionary<string, CharacterAbility> _abilityLookup = new Dictionary<string, CharacterAbility>();
        private Dictionary<string, List<CharacterDialogue>> _dialogueLookup = new Dictionary<string, List<CharacterDialogue>>();
        
        // Events
        public System.Action<Character> OnCharacterUnlocked;
        public System.Action<Character> OnCharacterLevelUp;
        public System.Action<CharacterAbility> OnAbilityUnlocked;
        public System.Action<CharacterDialogue> OnDialogueUnlocked;
        
        public static CharacterSystem Instance { get; private set; }
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeCharactersystemSafe();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            LoadCharacterProgress();
            CreateDefaultCharacters();
            BuildLookupTables();
        }
        
        private void InitializeCharactersystemSafe()
        {
            // Initialize default character
            _currentCharacter = null;
        }
        
        private void CreateDefaultCharacters()
        {
            if (characters.Count == 0)
            {
                // King Robert - Main character
                var kingRobert = new Character
                {
                    id = "king_robert",
                    name = "King Robert",
                    description = "The wise and noble king of the kingdom",
                    level = 1,
                    experience = 0,
                    experienceToNextLevel = baseExperiencePerLevel,
                    isUnlocked = true,
                    unlockLevel = 1,
                    stats = new Dictionary<string, int>
                    {
                        {"power", 10},
                        {"wisdom", 15},
                        {"charisma", 12},
                        {"luck", 8}
                    },
                    dialogueLines = new List<string>
                    {
                        "Welcome to my kingdom!",
                        "Let's restore this castle to its former glory!",
                        "Excellent work, my friend!",
                        "We're making great progress!",
                        "The kingdom is proud of your efforts!"
                    }
                };
                characters.Add(kingRobert);
                
                // Queen Isabella - Unlock at level 10
                var queenIsabella = new Character
                {
                    id = "queen_isabella",
                    name = "Queen Isabella",
                    description = "The graceful queen with magical abilities",
                    level = 1,
                    experience = 0,
                    experienceToNextLevel = baseExperiencePerLevel,
                    isUnlocked = false,
                    unlockLevel = 10,
                    stats = new Dictionary<string, int>
                    {
                        {"power", 8},
                        {"wisdom", 18},
                        {"charisma", 16},
                        {"luck", 10}
                    },
                    dialogueLines = new List<string>
                    {
                        "The castle needs your help!",
                        "Your magic is growing stronger!",
                        "What a beautiful match!",
                        "The kingdom is blessed to have you!",
                        "Let's make this place magnificent!"
                    }
                };
                characters.Add(queenIsabella);
                
                // Prince Alexander - Unlock at level 25
                var princeAlexander = new Character
                {
                    id = "prince_alexander",
                    name = "Prince Alexander",
                    description = "The brave prince with combat skills",
                    level = 1,
                    experience = 0,
                    experienceToNextLevel = baseExperiencePerLevel,
                    isUnlocked = false,
                    unlockLevel = 25,
                    stats = new Dictionary<string, int>
                    {
                        {"power", 16},
                        {"wisdom", 10},
                        {"charisma", 14},
                        {"luck", 12}
                    },
                    dialogueLines = new List<string>
                    {
                        "Ready for battle!",
                        "That was an amazing combo!",
                        "The kingdom needs heroes like you!",
                        "Let's show them our strength!",
                        "Victory is ours!"
                    }
                };
                characters.Add(princeAlexander);
            }
            
            CreateDefaultAbilities();
            CreateDefaultDialogues();
        }
        
        private void CreateDefaultAbilities()
        {
            if (abilities.Count == 0)
            {
                // King Robert's abilities
                abilities.Add(new CharacterAbility
                {
                    id = "royal_blessing",
                    name = "Royal Blessing",
                    description = "Increases coin rewards by 20%",
                    level = 1,
                    maxLevel = 5,
                    cost = 100,
                    currencyType = "coins",
                    isUnlocked = true,
                    isActive = true,
                    cooldown = 0,
                    duration = 0,
                    power = 20
                });
                
                abilities.Add(new CharacterAbility
                {
                    id = "kingly_wisdom",
                    name = "Kingly Wisdom",
                    description = "Reduces move cost by 1 for difficult levels",
                    level = 1,
                    maxLevel = 3,
                    cost = 500,
                    currencyType = "gems",
                    isUnlocked = false,
                    isActive = false,
                    cooldown = 0,
                    duration = 0,
                    power = 1
                });
                
                // Queen Isabella's abilities
                abilities.Add(new CharacterAbility
                {
                    id = "magical_boost",
                    name = "Magical Boost",
                    description = "Creates special pieces more often",
                    level = 1,
                    maxLevel = 5,
                    cost = 200,
                    currencyType = "coins",
                    isUnlocked = false,
                    isActive = false,
                    cooldown = 0,
                    duration = 0,
                    power = 15
                });
                
                // Prince Alexander's abilities
                abilities.Add(new CharacterAbility
                {
                    id = "warrior_strength",
                    name = "Warrior Strength",
                    description = "Increases damage to blockers",
                    level = 1,
                    maxLevel = 5,
                    cost = 300,
                    currencyType = "coins",
                    isUnlocked = false,
                    isActive = false,
                    cooldown = 0,
                    duration = 0,
                    power = 25
                });
            }
        }
        
        private void CreateDefaultDialogues()
        {
            if (dialogues.Count == 0)
            {
                // King Robert dialogues
                dialogues.Add(new CharacterDialogue
                {
                    id = "king_level_start",
                    characterId = "king_robert",
                    context = "level_start",
                    text = "Let's see what this level has in store for us!",
                    emotion = "excited",
                    isUnlocked = true,
                    unlockLevel = 1
                });
                
                dialogues.Add(new CharacterDialogue
                {
                    id = "king_level_complete",
                    characterId = "king_robert",
                    context = "level_complete",
                    text = "Magnificent work! The kingdom is proud!",
                    emotion = "happy",
                    isUnlocked = true,
                    unlockLevel = 1
                });
                
                dialogues.Add(new CharacterDialogue
                {
                    id = "king_level_fail",
                    characterId = "king_robert",
                    context = "level_fail",
                    text = "Don't worry, even kings face setbacks. Try again!",
                    emotion = "encouraging",
                    isUnlocked = true,
                    unlockLevel = 1
                });
                
                dialogues.Add(new CharacterDialogue
                {
                    id = "king_shop",
                    characterId = "king_robert",
                    context = "shop",
                    text = "The royal treasury has many treasures to offer!",
                    emotion = "happy",
                    isUnlocked = true,
                    unlockLevel = 1
                });
                
                dialogues.Add(new CharacterDialogue
                {
                    id = "king_castle",
                    characterId = "king_robert",
                    context = "castle",
                    text = "Welcome to your kingdom! Let's make it magnificent!",
                    emotion = "proud",
                    isUnlocked = true,
                    unlockLevel = 1
                });
            }
        }
        
        private void BuildLookupTables()
        {
            _characterLookup.Clear();
            _abilityLookup.Clear();
            _dialogueLookup.Clear();
            
            foreach (var character in characters)
            {
                _characterLookup[character.id] = character;
            }
            
            foreach (var ability in abilities)
            {
                _abilityLookup[ability.id] = ability;
            }
            
            foreach (var dialogue in dialogues)
            {
                if (!_dialogueLookup.ContainsKey(dialogue.characterId))
                {
                    _dialogueLookup[dialogue.characterId] = new List<CharacterDialogue>();
                }
                _dialogueLookup[dialogue.characterId].Add(dialogue);
            }
        }
        
        public void SetCurrentCharacter(string characterId)
        {
            if (_characterLookup.ContainsKey(characterId))
            {
                _currentCharacter = _characterLookup[characterId];
            }
        }
        
        public Character GetCurrentCharacter()
        {
            return _currentCharacter;
        }
        
        public void AddExperience(int amount)
        {
            if (_currentCharacter == null) return;
            
            _currentCharacter.experience += amount;
            
            // Check for level up
            while (_currentCharacter.experience >= _currentCharacter.experienceToNextLevel && 
                   _currentCharacter.level < maxLevel)
            {
                LevelUpCharacter(_currentCharacter);
            }
        }
        
        private void LevelUpCharacter(Character character)
        {
            character.level++;
            character.experience -= character.experienceToNextLevel;
            character.experienceToNextLevel = Mathf.RoundToInt(character.experienceToNextLevel * experienceMultiplier);
            
            // Increase stats
            foreach (var stat in character.stats.Keys.ToArray())
            {
                character.stats[stat] += 1;
            }
            
            // Check for new abilities
            CheckForNewAbilities(character);
            
            OnCharacterLevelUp?.Invoke(character);
        }
        
        private void CheckForNewAbilities(Character character)
        {
            foreach (var ability in abilities)
            {
                if (!ability.isUnlocked && ability.level <= character.level)
                {
                    ability.isUnlocked = true;
                    OnAbilityUnlocked?.Invoke(ability);
                }
            }
        }
        
        public void UnlockCharacter(string characterId)
        {
            if (_characterLookup.ContainsKey(characterId))
            {
                var character = _characterLookup[characterId];
                if (!character.isUnlocked)
                {
                    character.isUnlocked = true;
                    OnCharacterUnlocked?.Invoke(character);
                }
            }
        }
        
        public void UnlockAbility(string abilityId)
        {
            if (_abilityLookup.ContainsKey(abilityId))
            {
                var ability = _abilityLookup[abilityId];
                if (!ability.isUnlocked)
                {
                    ability.isUnlocked = true;
                    OnAbilityUnlocked?.Invoke(ability);
                }
            }
        }
        
        public bool PurchaseAbility(string abilityId)
        {
            if (!_abilityLookup.ContainsKey(abilityId)) return false;
            
            var ability = _abilityLookup[abilityId];
            if (ability.isUnlocked) return false;
            
            var gameManager = ServiceLocator.Get<GameManager>();
            if (gameManager == null) return false;
            
            int currentAmount = gameManager.GetCurrency(ability.currencyType);
            if (currentAmount < ability.cost) return false;
            
            gameManager.SpendCurrency(ability.currencyType, ability.cost);
            ability.isUnlocked = true;
            OnAbilityUnlocked?.Invoke(ability);
            
            return true;
        }
        
        public string GetRandomDialogue(string characterId, string context)
        {
            if (!_dialogueLookup.ContainsKey(characterId)) return "";
            
            var availableDialogues = _dialogueLookup[characterId].FindAll(d => 
                d.context == context && d.isUnlocked);
            
            if (availableDialogues.Count == 0) return "";
            
            var randomDialogue = availableDialogues[UnityEngine.Random.Range(0, availableDialogues.Count)];
            return randomDialogue.text;
        }
        
        public List<Character> GetUnlockedCharacters()
        {
            return characters.FindAll(c => c.isUnlocked);
        }
        
        public List<CharacterAbility> GetCharacterAbilities(string characterId)
        {
            return abilities.FindAll(a => a.characterId == characterId);
        }
        
        public List<CharacterAbility> GetUnlockedAbilities()
        {
            return abilities.FindAll(a => a.isUnlocked);
        }
        
        private void LoadCharacterProgress()
        {
            string path = Application.persistentDataPath + "/character_progress.json";
            if (System.IO.File.Exists(path))
            {
                string json = System.IO.File.ReadAllText(path);
                var saveData = JsonUtility.FromJson<CharacterSaveData>(json);
                
                // Load character progress
                foreach (var savedCharacter in saveData.characters)
                {
                    if (_characterLookup.ContainsKey(savedCharacter.id))
                    {
                        var character = _characterLookup[savedCharacter.id];
                        character.level = savedCharacter.level;
                        character.experience = savedCharacter.experience;
                        character.experienceToNextLevel = savedCharacter.experienceToNextLevel;
                        character.isUnlocked = savedCharacter.isUnlocked;
                        character.stats = savedCharacter.stats;
                    }
                }
                
                // Load ability progress
                foreach (var savedAbility in saveData.abilities)
                {
                    if (_abilityLookup.ContainsKey(savedAbility.id))
                    {
                        var ability = _abilityLookup[savedAbility.id];
                        ability.level = savedAbility.level;
                        ability.isUnlocked = savedAbility.isUnlocked;
                        ability.isActive = savedAbility.isActive;
                    }
                }
            }
        }
        
        public void SaveCharacterProgress()
        {
            var saveData = new CharacterSaveData
            {
                characters = characters,
                abilities = abilities,
                currentCharacterId = _currentCharacter?.id
            };
            
            string json = JsonUtility.ToJson(saveData, true);
            System.IO.File.WriteAllText(Application.persistentDataPath + "/character_progress.json", json);
        }
        
        void OnDestroy()
        {
            SaveCharacterProgress();
        }
    }
    
    [System.Serializable]
    public class CharacterSaveData
    {
        public List<Character> characters;
        public List<CharacterAbility> abilities;
        public string currentCharacterId;
    }
}