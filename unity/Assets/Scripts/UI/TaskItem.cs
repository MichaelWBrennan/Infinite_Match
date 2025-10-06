using UnityEngine;
using UnityEngine.UI;
using TMPro;
using Evergreen.MetaGame;

namespace Evergreen.UI
{
    public class TaskItem : MonoBehaviour
    {
        [Header("UI References")]
        public TextMeshProUGUI taskDescriptionText;
        public Slider progressSlider;
        public TextMeshProUGUI progressText;
        public Image rewardIcon;
        public TextMeshProUGUI rewardText;
        public GameObject completedOverlay;
        public Image backgroundImage;
        
        private Task _task;
        
        public void Setup(Task task)
        {
            _task = task;
            RefreshUI();
        }
        
        private void RefreshUI()
        {
            if (_task == null) return;
            
            taskDescriptionText.text = _task.description;
            
            float progress = (float)_task.currentValue / _task.targetValue;
            progressSlider.value = Mathf.Clamp01(progress);
            progressText.text = $"{_task.currentValue}/{_task.targetValue}";
            
            // Update reward display
            rewardText.text = $"{_task.reward.amount} {_task.reward.type}";
            
            // Update visual states
            completedOverlay.SetActive(_task.isCompleted);
            
            // Update background color based on completion
            if (_task.isCompleted)
            {
                backgroundImage.color = new Color(0.2f, 0.8f, 0.2f, 0.3f); // Green tint
            }
            else if (progress > 0.8f)
            {
                backgroundImage.color = new Color(0.8f, 0.8f, 0.2f, 0.3f); // Yellow tint
            }
            else
            {
                backgroundImage.color = new Color(0.2f, 0.2f, 0.8f, 0.3f); // Blue tint
            }
        }
    }
}