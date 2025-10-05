using UnityEngine;
using UnityEngine.UI;
using TMPro;
using Evergreen.MetaGame;

namespace Evergreen.UI
{
    public class RoomUI : MonoBehaviour
    {
        [Header("UI Elements")]
        public TextMeshProUGUI roomNameText;
        public TextMeshProUGUI roomDescriptionText;
        public TextMeshProUGUI unlockLevelText;
        public TextMeshProUGUI costText;
        public Button unlockButton;
        public Button enterButton;
        public Image roomPreviewImage;
        public GameObject lockedOverlay;
        public GameObject unlockedOverlay;
        
        private Room roomData;
        
        public void SetupRoom(Room room)
        {
            roomData = room;
            UpdateUI();
        }
        
        private void UpdateUI()
        {
            if (roomData == null) return;
            
            roomNameText.text = roomData.name;
            roomDescriptionText.text = roomData.description;
            
            if (roomData.isUnlocked)
            {
                lockedOverlay.SetActive(false);
                unlockedOverlay.SetActive(true);
                unlockButton.gameObject.SetActive(false);
                enterButton.gameObject.SetActive(true);
                unlockLevelText.gameObject.SetActive(false);
                costText.gameObject.SetActive(false);
            }
            else
            {
                lockedOverlay.SetActive(true);
                unlockedOverlay.SetActive(false);
                unlockButton.gameObject.SetActive(true);
                enterButton.gameObject.SetActive(false);
                unlockLevelText.gameObject.SetActive(true);
                costText.gameObject.SetActive(true);
                
                unlockLevelText.text = $"Unlock at Level {roomData.unlockLevel}";
                
                string costString = "";
                if (roomData.coinsRequired > 0)
                    costString += $"{roomData.coinsRequired} Coins";
                if (roomData.gemsRequired > 0)
                {
                    if (costString.Length > 0) costString += " + ";
                    costString += $"{roomData.gemsRequired} Gems";
                }
                costText.text = costString;
                
                // Check if can unlock
                bool canUnlock = DecorationSystem.Instance.CanUnlockRoom(roomData.id);
                unlockButton.interactable = canUnlock;
                
                var uiCache = UIComponentCache.Instance;
                var buttonText = uiCache.GetText(unlockButton.gameObject);
                if (buttonText == null)
                {
                    buttonText = unlockButton.GetComponentInChildren<TextMeshProUGUI>();
                }
                
                if (!canUnlock)
                {
                    if (buttonText != null)
                    {
                        if (Evergreen.Game.GameState.CurrentLevel < roomData.unlockLevel)
                            buttonText.text = "Level Required";
                        else if (Evergreen.Game.GameState.Coins < roomData.coinsRequired)
                            buttonText.text = "Need Coins";
                        else if (Evergreen.Game.GameState.Gems < roomData.gemsRequired)
                            buttonText.text = "Need Gems";
                    }
                }
                else
                {
                    if (buttonText != null)
                        buttonText.text = "Unlock";
                }
            }
        }
        
        public void OnUnlockButtonClicked()
        {
            if (roomData == null) return;
            
            if (DecorationSystem.Instance.UnlockRoom(roomData.id))
            {
                UpdateUI();
                ShowNotification($"Room unlocked: {roomData.name}!");
            }
        }
        
        public void OnEnterButtonClicked()
        {
            if (roomData == null) return;
            
            // Enter the room (this would load the room decoration scene)
            Debug.Log($"Entering room: {roomData.name}");
            // SceneManager.LoadScene("RoomDecoration");
        }
        
        private void ShowNotification(string message)
        {
            var uiCache = UIComponentCache.Instance;
            var notificationUI = uiCache.GetComponentCached<EnhancedMainMenuUI>(uiCache.MainCanvas?.gameObject);
            if (notificationUI == null)
            {
                notificationUI = FindObjectOfType<EnhancedMainMenuUI>();
            }
            if (notificationUI != null)
            {
                notificationUI.ShowNotification(message);
            }
        }
    }
}