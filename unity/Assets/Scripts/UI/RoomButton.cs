using UnityEngine;
using UnityEngine.UI;
using TMPro;
using Evergreen.MetaGame;

namespace Evergreen.UI
{
    public class RoomButton : MonoBehaviour
    {
        [Header("UI References")]
        public Image roomIcon;
        public TextMeshProUGUI roomNameText;
        public TextMeshProUGUI roomDescriptionText;
        public Slider completionSlider;
        public TextMeshProUGUI completionText;
        public Button button;
        public GameObject lockedOverlay;
        public GameObject completedOverlay;
        
        private Room _room;
        private System.Action<Room> _onRoomSelected;
        
        public void Setup(Room room, System.Action<Room> onRoomSelected)
        {
            _room = room;
            _onRoomSelected = onRoomSelected;
            
            RefreshUI();
            
            button.onClick.RemoveAllListeners();
            button.onClick.AddListener(OnButtonClicked);
        }
        
        private void RefreshUI()
        {
            if (_room == null) return;
            
            roomNameText.text = _room.name;
            roomDescriptionText.text = _room.description;
            completionSlider.value = _room.completionPercentage;
            completionText.text = $"{Mathf.RoundToInt(_room.completionPercentage * 100)}%";
            
            // Update visual states
            lockedOverlay.SetActive(!_room.isUnlocked);
            completedOverlay.SetActive(_room.isCompleted);
            
            // Update button interactability
            button.interactable = _room.isUnlocked;
            
            // Update colors based on completion
            if (_room.isCompleted)
            {
                roomIcon.color = Color.green;
            }
            else if (_room.isUnlocked)
            {
                roomIcon.color = Color.white;
            }
            else
            {
                roomIcon.color = Color.gray;
            }
        }
        
        private void OnButtonClicked()
        {
            if (_room != null && _room.isUnlocked)
            {
                _onRoomSelected?.Invoke(_room);
            }
        }
    }
}