using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System;

namespace Evergreen.Tutorial
{
    [System.Serializable]
    public class TutorialStep
    {
        public string stepId;
        public string title;
        public string description;
        public TutorialStepType type;
        public Vector2 position;
        public float duration;
        public bool isCompleted;
        public List<string> prerequisites = new List<string>();
        public Dictionary<string, object> parameters = new Dictionary<string, object>();
    }
    
    public enum TutorialStepType
    {
        Click,
        Drag,
        Swipe,
        Wait,
        ShowPopup,
        Highlight,
        Animate,
        PlaySound,
        ShowTip
    }
    
    [System.Serializable]
    public class TutorialSequence
    {
        public string sequenceId;
        public string name;
        public string description;
        public List<TutorialStep> steps = new List<TutorialStep>();
        public bool isCompleted;
        public bool isActive;
        public int currentStepIndex;
        public string triggerCondition;
    }
    
    public class TutorialSystem : MonoBehaviour
    {
        [Header("Tutorial UI")]
        public GameObject tutorialOverlay;
        public GameObject tutorialPopup;
        public TextMeshProUGUI tutorialTitle;
        public TextMeshProUGUI tutorialDescription;
        public Button tutorialNextButton;
        public Button tutorialSkipButton;
        public Button tutorialCloseButton;
        public Image tutorialArrow;
        public GameObject tutorialHighlight;
        
        [Header("Tutorial Settings")]
        public bool enableTutorials = true;
        public bool skipCompletedTutorials = true;
        public float stepDelay = 0.5f;
        public float highlightDuration = 2f;
        
        [Header("Tutorial Sequences")]
        public List<TutorialSequence> sequences = new List<TutorialSequence>();
        
        public static TutorialSystem Instance { get; private set; }
        
        private TutorialSequence currentSequence;
        private TutorialStep currentStep;
        private bool isTutorialActive = false;
        private Coroutine currentTutorialCoroutine;
        private Dictionary<string, bool> completedTutorials = new Dictionary<string, bool>();
        
        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeTutorials();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            LoadTutorialProgress();
            SetupTutorialUI();
            CheckForTutorialTriggers();
        }
        
        private void InitializeTutorials()
        {
            // Initialize default tutorial sequences
            CreateDefaultTutorials();
        }
        
        private void CreateDefaultTutorials()
        {
            // First Time User Tutorial
            var firstTimeSequence = new TutorialSequence
            {
                sequenceId = "first_time_user",
                name = "Welcome to Evergreen!",
                description = "Learn the basics of the game",
                triggerCondition = "first_launch",
                steps = new List<TutorialStep>
                {
                    new TutorialStep
                    {
                        stepId = "welcome_popup",
                        title = "Welcome!",
                        description = "Welcome to Evergreen! Let's learn how to play this magical match-3 game.",
                        type = TutorialStepType.ShowPopup,
                        duration = 3f
                    },
                    new TutorialStep
                    {
                        stepId = "explain_matching",
                        title = "Matching Gems",
                        description = "Match 3 or more gems of the same color to clear them from the board.",
                        type = TutorialStepType.ShowTip,
                        duration = 4f
                    },
                    new TutorialStep
                    {
                        stepId = "explain_swipe",
                        title = "How to Play",
                        description = "Swipe to swap adjacent gems and create matches.",
                        type = TutorialStepType.ShowTip,
                        duration = 4f
                    },
                    new TutorialStep
                    {
                        stepId = "explain_specials",
                        title = "Special Pieces",
                        description = "Match 4 gems to create a rocket, match 5 to create a bomb!",
                        type = TutorialStepType.ShowTip,
                        duration = 5f
                    },
                    new TutorialStep
                    {
                        stepId = "explain_goals",
                        title = "Level Goals",
                        description = "Complete the level goals to progress. Watch your moves!",
                        type = TutorialStepType.ShowTip,
                        duration = 4f
                    }
                }
            };
            
            // Meta Game Tutorial
            var metaGameSequence = new TutorialSequence
            {
                sequenceId = "meta_game_intro",
                name = "Decorate Your Home",
                description = "Learn about the decoration system",
                triggerCondition = "meta_game_unlocked",
                steps = new List<TutorialStep>
                {
                    new TutorialStep
                    {
                        stepId = "explain_rooms",
                        title = "Your Home",
                        description = "Decorate different rooms in your home with furniture and decorations.",
                        type = TutorialStepType.ShowTip,
                        duration = 4f
                    },
                    new TutorialStep
                    {
                        stepId = "explain_currency",
                        title = "Earning Rewards",
                        description = "Complete levels to earn coins and gems for decorations.",
                        type = TutorialStepType.ShowTip,
                        duration = 4f
                    },
                    new TutorialStep
                    {
                        stepId = "explain_purchasing",
                        title = "Buying Items",
                        description = "Use coins and gems to purchase new decorations.",
                        type = TutorialStepType.ShowTip,
                        duration = 4f
                    }
                }
            };
            
            // Social Features Tutorial
            var socialSequence = new TutorialSequence
            {
                sequenceId = "social_features",
                name = "Social Features",
                description = "Learn about leaderboards and friends",
                triggerCondition = "social_unlocked",
                steps = new List<TutorialStep>
                {
                    new TutorialStep
                    {
                        stepId = "explain_leaderboards",
                        title = "Leaderboards",
                        description = "Compete with other players on the leaderboards!",
                        type = TutorialStepType.ShowTip,
                        duration = 4f
                    },
                    new TutorialStep
                    {
                        stepId = "explain_friends",
                        title = "Friends",
                        description = "Add friends to see their progress and compete together.",
                        type = TutorialStepType.ShowTip,
                        duration = 4f
                    }
                }
            };
            
            // Events Tutorial
            var eventsSequence = new TutorialSequence
            {
                sequenceId = "events_intro",
                name = "Special Events",
                description = "Learn about daily events and tournaments",
                triggerCondition = "events_unlocked",
                steps = new List<TutorialStep>
                {
                    new TutorialStep
                    {
                        stepId = "explain_daily_events",
                        title = "Daily Events",
                        description = "Complete daily challenges for bonus rewards!",
                        type = TutorialStepType.ShowTip,
                        duration = 4f
                    },
                    new TutorialStep
                    {
                        stepId = "explain_tournaments",
                        title = "Tournaments",
                        description = "Compete in weekly tournaments for exclusive prizes.",
                        type = TutorialStepType.ShowTip,
                        duration = 4f
                    }
                }
            };
            
            sequences.Add(firstTimeSequence);
            sequences.Add(metaGameSequence);
            sequences.Add(socialSequence);
            sequences.Add(eventsSequence);
        }
        
        private void SetupTutorialUI()
        {
            if (tutorialOverlay != null)
                tutorialOverlay.SetActive(false);
            
            if (tutorialPopup != null)
                tutorialPopup.SetActive(false);
            
            if (tutorialNextButton != null)
                tutorialNextButton.onClick.AddListener(NextStep);
            
            if (tutorialSkipButton != null)
                tutorialSkipButton.onClick.AddListener(SkipTutorial);
            
            if (tutorialCloseButton != null)
                tutorialCloseButton.onClick.AddListener(CloseTutorial);
        }
        
        public void StartTutorial(string sequenceId)
        {
            if (!enableTutorials) return;
            
            var sequence = sequences.Find(s => s.sequenceId == sequenceId);
            if (sequence == null)
            {
                Debug.LogWarning($"Tutorial sequence '{sequenceId}' not found!");
                return;
            }
            
            if (skipCompletedTutorials && completedTutorials.ContainsKey(sequenceId) && completedTutorials[sequenceId])
            {
                Debug.Log($"Tutorial sequence '{sequenceId}' already completed, skipping.");
                return;
            }
            
            currentSequence = sequence;
            currentSequence.isActive = true;
            currentSequence.currentStepIndex = 0;
            isTutorialActive = true;
            
            if (currentTutorialCoroutine != null)
            {
                StopCoroutine(currentTutorialCoroutine);
            }
            
            currentTutorialCoroutine = StartCoroutine(RunTutorialSequence());
        }
        
        private IEnumerator RunTutorialSequence()
        {
            while (currentSequence.currentStepIndex < currentSequence.steps.Count)
            {
                currentStep = currentSequence.steps[currentSequence.currentStepIndex];
                yield return StartCoroutine(ExecuteTutorialStep(currentStep));
                
                currentSequence.currentStepIndex++;
                yield return new WaitForSeconds(stepDelay);
            }
            
            CompleteTutorialSequence();
        }
        
        private IEnumerator ExecuteTutorialStep(TutorialStep step)
        {
            Debug.Log($"Executing tutorial step: {step.stepId}");
            
            switch (step.type)
            {
                case TutorialStepType.ShowPopup:
                    yield return StartCoroutine(ShowTutorialPopup(step));
                    break;
                    
                case TutorialStepType.ShowTip:
                    yield return StartCoroutine(ShowTutorialTip(step));
                    break;
                    
                case TutorialStepType.Highlight:
                    yield return StartCoroutine(HighlightElement(step));
                    break;
                    
                case TutorialStepType.Animate:
                    yield return StartCoroutine(AnimateElement(step));
                    break;
                    
                case TutorialStepType.PlaySound:
                    yield return StartCoroutine(PlayTutorialSound(step));
                    break;
                    
                case TutorialStepType.Wait:
                    yield return new WaitForSeconds(step.duration);
                    break;
                    
                default:
                    yield return new WaitForSeconds(step.duration);
                    break;
            }
            
            step.isCompleted = true;
        }
        
        private IEnumerator ShowTutorialPopup(TutorialStep step)
        {
            if (tutorialPopup != null)
            {
                tutorialPopup.SetActive(true);
                tutorialTitle.text = step.title;
                tutorialDescription.text = step.description;
                
                // Wait for user to click next or auto-advance after duration
                float elapsedTime = 0f;
                bool userClicked = false;
                
                tutorialNextButton.onClick.RemoveAllListeners();
                tutorialNextButton.onClick.AddListener(() => userClicked = true);
                
                while (elapsedTime < step.duration && !userClicked)
                {
                    elapsedTime += Time.deltaTime;
                    yield return null;
                }
                
                tutorialPopup.SetActive(false);
            }
        }
        
        private IEnumerator ShowTutorialTip(TutorialStep step)
        {
            if (tutorialOverlay != null)
            {
                tutorialOverlay.SetActive(true);
                tutorialTitle.text = step.title;
                tutorialDescription.text = step.description;
                
                // Position the tip
                if (step.position != Vector2.zero)
                {
                    var rectTransform = tutorialOverlay.GetComponent<RectTransform>();
                    if (rectTransform != null)
                    {
                        rectTransform.anchoredPosition = step.position;
                    }
                }
                
                yield return new WaitForSeconds(step.duration);
                tutorialOverlay.SetActive(false);
            }
        }
        
        private IEnumerator HighlightElement(TutorialStep step)
        {
            if (tutorialHighlight != null)
            {
                tutorialHighlight.SetActive(true);
                
                // Position highlight over the target element
                if (step.position != Vector2.zero)
                {
                    var rectTransform = tutorialHighlight.GetComponent<RectTransform>();
                    if (rectTransform != null)
                    {
                        rectTransform.anchoredPosition = step.position;
                    }
                }
                
                yield return new WaitForSeconds(step.duration);
                tutorialHighlight.SetActive(false);
            }
        }
        
        private IEnumerator AnimateElement(TutorialStep step)
        {
            // Find the target element and animate it
            var targetName = step.parameters.GetValueOrDefault("target", "").ToString();
            var target = GameObject.Find(targetName);
            
            if (target != null)
            {
                var animationType = step.parameters.GetValueOrDefault("animation", "pulse").ToString();
                
                switch (animationType)
                {
                    case "pulse":
                        yield return StartCoroutine(PulseAnimation(target));
                        break;
                    case "shake":
                        yield return StartCoroutine(ShakeAnimation(target));
                        break;
                    case "glow":
                        yield return StartCoroutine(GlowAnimation(target));
                        break;
                }
            }
        }
        
        private IEnumerator PlayTutorialSound(TutorialStep step)
        {
            var soundName = step.parameters.GetValueOrDefault("sound", "tutorial_beep").ToString();
            
            if (Evergreen.Audio.AudioManager.Instance != null)
            {
                Evergreen.Audio.AudioManager.Instance.PlayUISound(soundName);
            }
            
            yield return new WaitForSeconds(step.duration);
        }
        
        private IEnumerator PulseAnimation(GameObject target)
        {
            var originalScale = target.transform.localScale;
            var pulseScale = originalScale * 1.2f;
            var duration = 0.5f;
            var elapsedTime = 0f;
            
            while (elapsedTime < duration)
            {
                elapsedTime += Time.deltaTime;
                var t = Mathf.PingPong(elapsedTime * 2f, 1f);
                target.transform.localScale = Vector3.Lerp(originalScale, pulseScale, t);
                yield return null;
            }
            
            target.transform.localScale = originalScale;
        }
        
        private IEnumerator ShakeAnimation(GameObject target)
        {
            var originalPosition = target.transform.position;
            var duration = 0.5f;
            var elapsedTime = 0f;
            
            while (elapsedTime < duration)
            {
                elapsedTime += Time.deltaTime;
                var shakeAmount = 0.1f * (1f - elapsedTime / duration);
                var randomOffset = new Vector3(
                    UnityEngine.Random.Range(-shakeAmount, shakeAmount),
                    UnityEngine.Random.Range(-shakeAmount, shakeAmount),
                    0f
                );
                target.transform.position = originalPosition + randomOffset;
                yield return null;
            }
            
            target.transform.position = originalPosition;
        }
        
        private IEnumerator GlowAnimation(GameObject target)
        {
            var renderer = target.GetComponent<Renderer>();
            if (renderer != null)
            {
                var originalColor = renderer.material.color;
                var glowColor = Color.yellow;
                var duration = 1f;
                var elapsedTime = 0f;
                
                while (elapsedTime < duration)
                {
                    elapsedTime += Time.deltaTime;
                    var t = Mathf.PingPong(elapsedTime * 2f, 1f);
                    renderer.material.color = Color.Lerp(originalColor, glowColor, t);
                    yield return null;
                }
                
                renderer.material.color = originalColor;
            }
        }
        
        public void NextStep()
        {
            if (currentTutorialCoroutine != null)
            {
                StopCoroutine(currentTutorialCoroutine);
            }
            
            if (currentSequence != null && currentSequence.currentStepIndex < currentSequence.steps.Count - 1)
            {
                currentSequence.currentStepIndex++;
                currentTutorialCoroutine = StartCoroutine(RunTutorialSequence());
            }
            else
            {
                CompleteTutorialSequence();
            }
        }
        
        public void SkipTutorial()
        {
            if (currentTutorialCoroutine != null)
            {
                StopCoroutine(currentTutorialCoroutine);
            }
            
            CompleteTutorialSequence();
        }
        
        public void CloseTutorial()
        {
            if (currentTutorialCoroutine != null)
            {
                StopCoroutine(currentTutorialCoroutine);
            }
            
            isTutorialActive = false;
            currentSequence = null;
            currentStep = null;
            
            if (tutorialOverlay != null)
                tutorialOverlay.SetActive(false);
            
            if (tutorialPopup != null)
                tutorialPopup.SetActive(false);
        }
        
        private void CompleteTutorialSequence()
        {
            if (currentSequence != null)
            {
                currentSequence.isCompleted = true;
                completedTutorials[currentSequence.sequenceId] = true;
                SaveTutorialProgress();
                
                Debug.Log($"Tutorial sequence '{currentSequence.sequenceId}' completed!");
                
                // Analytics
                if (Evergreen.Analytics.EnhancedAnalytics.Instance != null)
                {
                    Evergreen.Analytics.EnhancedAnalytics.Instance.TrackCustomEvent("tutorial_completed", new Dictionary<string, object>
                    {
                        {"sequence_id", currentSequence.sequenceId},
                        {"steps_completed", currentSequence.steps.Count}
                    });
                }
            }
            
            CloseTutorial();
        }
        
        private void CheckForTutorialTriggers()
        {
            foreach (var sequence in sequences)
            {
                if (sequence.isCompleted || sequence.isActive) continue;
                
                if (CheckTriggerCondition(sequence.triggerCondition))
                {
                    StartTutorial(sequence.sequenceId);
                    break; // Only start one tutorial at a time
                }
            }
        }
        
        private bool CheckTriggerCondition(string condition)
        {
            switch (condition)
            {
                case "first_launch":
                    return PlayerPrefs.GetInt("FirstLaunch", 1) == 1;
                    
                case "meta_game_unlocked":
                    return Evergreen.Game.GameState.CurrentLevel >= 10;
                    
                case "social_unlocked":
                    return Evergreen.Game.GameState.CurrentLevel >= 5;
                    
                case "events_unlocked":
                    return Evergreen.Game.GameState.CurrentLevel >= 3;
                    
                default:
                    return false;
            }
        }
        
        public void MarkFirstLaunchComplete()
        {
            PlayerPrefs.SetInt("FirstLaunch", 0);
        }
        
        public void ResetTutorial(string sequenceId)
        {
            if (completedTutorials.ContainsKey(sequenceId))
            {
                completedTutorials[sequenceId] = false;
            }
            
            var sequence = sequences.Find(s => s.sequenceId == sequenceId);
            if (sequence != null)
            {
                sequence.isCompleted = false;
                sequence.isActive = false;
                sequence.currentStepIndex = 0;
                
                foreach (var step in sequence.steps)
                {
                    step.isCompleted = false;
                }
            }
            
            SaveTutorialProgress();
        }
        
        public void ResetAllTutorials()
        {
            completedTutorials.Clear();
            
            foreach (var sequence in sequences)
            {
                sequence.isCompleted = false;
                sequence.isActive = false;
                sequence.currentStepIndex = 0;
                
                foreach (var step in sequence.steps)
                {
                    step.isCompleted = false;
                }
            }
            
            SaveTutorialProgress();
        }
        
        private void LoadTutorialProgress()
        {
            var progressData = PlayerPrefs.GetString("TutorialProgress", "");
            if (!string.IsNullOrEmpty(progressData))
            {
                try
                {
                    var progress = JsonUtility.FromJson<TutorialProgressData>(progressData);
                    completedTutorials = new Dictionary<string, bool>(progress.completedTutorials);
                }
                catch (Exception e)
                {
                    Debug.LogError($"Failed to load tutorial progress: {e.Message}");
                }
            }
        }
        
        private void SaveTutorialProgress()
        {
            try
            {
                var progressData = new TutorialProgressData
                {
                    completedTutorials = new List<KeyValuePair<string, bool>>(completedTutorials)
                };
                
                var jsonData = JsonUtility.ToJson(progressData);
                PlayerPrefs.SetString("TutorialProgress", jsonData);
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to save tutorial progress: {e.Message}");
            }
        }
        
        [System.Serializable]
        private class TutorialProgressData
        {
            public List<KeyValuePair<string, bool>> completedTutorials = new List<KeyValuePair<string, bool>>();
        }
        
        public bool IsTutorialActive()
        {
            return isTutorialActive;
        }
        
        public bool IsTutorialCompleted(string sequenceId)
        {
            return completedTutorials.ContainsKey(sequenceId) && completedTutorials[sequenceId];
        }
    }
}