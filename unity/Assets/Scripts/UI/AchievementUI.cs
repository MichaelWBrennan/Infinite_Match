using UnityEngine;
using UnityEngine.UI;
using TMPro;
using Evergreen.Collections;

namespace Evergreen.UI
{
    public class AchievementUI : MonoBehaviour
    {
        [Header("UI Elements")]
        public Image achievementIcon;
        public TextMeshProUGUI achievementNameText;
        public TextMeshProUGUI achievementDescriptionText;
        public TextMeshProUGUI progressText;
        public Image progressBar;
        public Button claimButton;
        public GameObject unlockedIndicator;
        public GameObject claimedIndicator;
        public Image rarityBorder;
        
        [Header("Rarity Colors")]
        public Color commonColor = Color.white;
        public Color uncommonColor = Color.green;
        public Color rareColor = Color.blue;
        public Color epicColor = Color.magenta;
        public Color legendaryColor = Color.yellow;
        
        [Header("Achievement Type Icons")]
        public Sprite progressionIcon;
        public Sprite skillIcon;
        public Sprite collectionIcon;
        public Sprite socialIcon;
        public Sprite specialIcon;
        public Sprite timeBasedIcon;
        
        private Achievement achievementData;
        
        public void SetupAchievement(Achievement achievement)
        {
            achievementData = achievement;
            UpdateUI();
        }
        
        private void UpdateUI()
        {
            if (achievementData == null) return;
            
            achievementNameText.text = achievementData.name;
            achievementDescriptionText.text = achievementData.description;
            
            // Set rarity border color
            if (rarityBorder != null)
            {
                rarityBorder.color = GetRarityColor(achievementData.rarity);
            }
            
            // Set achievement type icon
            if (achievementIcon != null)
            {
                achievementIcon.sprite = GetAchievementTypeIcon(achievementData.type);
            }
            
            // Update status indicators
            unlockedIndicator.SetActive(achievementData.isUnlocked);
            claimedIndicator.SetActive(achievementData.isClaimed);
            
            // Update progress
            UpdateProgress();
            
            // Update claim button
            UpdateClaimButton();
        }
        
        private Color GetRarityColor(AchievementRarity rarity)
        {
            switch (rarity)
            {
                case AchievementRarity.Common: return commonColor;
                case AchievementRarity.Uncommon: return uncommonColor;
                case AchievementRarity.Rare: return rareColor;
                case AchievementRarity.Epic: return epicColor;
                case AchievementRarity.Legendary: return legendaryColor;
                default: return commonColor;
            }
        }
        
        private Sprite GetAchievementTypeIcon(AchievementType type)
        {
            switch (type)
            {
                case AchievementType.Progression: return progressionIcon;
                case AchievementType.Skill: return skillIcon;
                case AchievementType.Collection: return collectionIcon;
                case AchievementType.Social: return socialIcon;
                case AchievementType.Special: return specialIcon;
                case AchievementType.TimeBased: return timeBasedIcon;
                default: return progressionIcon;
            }
        }
        
        private void UpdateProgress()
        {
            if (!achievementData.isUnlocked)
            {
                progressText.gameObject.SetActive(true);
                progressBar.gameObject.SetActive(true);
                
                float progressRatio = (float)achievementData.progress / achievementData.target;
                progressBar.fillAmount = progressRatio;
                progressText.text = $"{achievementData.progress}/{achievementData.target}";
            }
            else
            {
                progressText.gameObject.SetActive(false);
                progressBar.gameObject.SetActive(false);
            }
        }
        
        private void UpdateClaimButton()
        {
            if (achievementData.isUnlocked && !achievementData.isClaimed)
            {
                claimButton.gameObject.SetActive(true);
                claimButton.interactable = true;
                
                var buttonText = claimButton.GetComponentInChildren<TextMeshProUGUI>();
                if (buttonText != null)
                    buttonText.text = "Claim";
            }
            else if (achievementData.isClaimed)
            {
                claimButton.gameObject.SetActive(true);
                claimButton.interactable = false;
                
                var buttonText = claimButton.GetComponentInChildren<TextMeshProUGUI>();
                if (buttonText != null)
                    buttonText.text = "Claimed";
            }
            else
            {
                claimButton.gameObject.SetActive(false);
            }
        }
        
        public void OnClaimButtonClicked()
        {
            if (achievementData == null) return;
            
            if (AchievementSystem.Instance != null)
            {
                AchievementSystem.Instance.ClaimAchievement(achievementData.achievementId);
                UpdateUI();
                ShowNotification($"Achievement claimed: {achievementData.name}!");
            }
        }
        
        public void OnAchievementClicked()
        {
            if (achievementData == null) return;
            
            // Show achievement details
            Debug.Log($"Clicked on achievement: {achievementData.name}");
            ShowAchievementDetails();
        }
        
        private void ShowAchievementDetails()
        {
            // This would open a detailed achievement popup
            Debug.Log($"Showing details for achievement: {achievementData.name}");
        }
        
        private void ShowNotification(string message)
        {
            var notificationUI = FindObjectOfType<EnhancedMainMenuUI>();
            if (notificationUI != null)
            {
                notificationUI.ShowNotification(message);
            }
        }
    }
}