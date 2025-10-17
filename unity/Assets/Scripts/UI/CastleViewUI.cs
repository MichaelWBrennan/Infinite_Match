using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using Evergreen.MetaGame;

namespace Evergreen.UI
{
    public class CastleViewUI : MonoBehaviour
    {
        [Header("UI References")]
        public Transform roomContainer;
        public GameObject roomButtonPrefab;
        public GameObject decorationShopPanel;
        public GameObject roomDetailPanel;
        public TextMeshProUGUI coinsText;
        public TextMeshProUGUI gemsText;
        public TextMeshProUGUI levelText;
        public Button backButton;
        public Button shopButton;
        
        [Header("Room Detail UI")]
        public TextMeshProUGUI roomNameText;
        public TextMeshProUGUI roomDescriptionText;
        public Slider completionSlider;
        public TextMeshProUGUI completionText;
        public Transform taskContainer;
        public GameObject taskItemPrefab;
        public Transform decorationContainer;
        public GameObject decorationItemPrefab;
        
        [Header("Decoration Shop UI")]
        public Transform shopDecorationContainer;
        public GameObject shopDecorationItemPrefab;
        public TextMeshProUGUI shopCoinsText;
        public TextMeshProUGUI shopGemsText;
        public Button closeShopButton;
        
        private CastleRenovationSystem _castleSystem;
        private Room _selectedRoom;
        private List<GameObject> _roomButtons = new List<GameObject>();
        private List<GameObject> _taskItems = new List<GameObject>();
        private List<GameObject> _decorationItems = new List<GameObject>();
        private List<GameObject> _shopItems = new List<GameObject>();
        
        void Start()
        {
            _castleSystem = CastleRenovationSystem.Instance;
            if (_castleSystem == null)
            {
                Debug.LogError("CastleRenovationSystem not found!");
                return;
            }
            
            SetupUI();
            RefreshUI();
        }
        
        private void SetupUI()
        {
            // Setup button listeners
            backButton.onClick.AddListener(OnBackClicked);
            shopButton.onClick.AddListener(OnShopClicked);
            closeShopButton.onClick.AddListener(OnCloseShopClicked);
            
            // Subscribe to events
            _castleSystem.OnRoomUnlocked += OnRoomUnlocked;
            _castleSystem.OnRoomCompleted += OnRoomCompleted;
            _castleSystem.OnDecorationPurchased += OnDecorationPurchased;
            _castleSystem.OnTaskCompleted += OnTaskCompleted;
            _castleSystem.OnRewardEarned += OnRewardEarned;
        }
        
        private void RefreshUI()
        {
            RefreshCurrencyDisplay();
            RefreshRoomButtons();
            
            if (_selectedRoom != null)
            {
                RefreshRoomDetail();
            }
        }
        
        private void RefreshCurrencyDisplay()
        {
            var gameManager = OptimizedCoreSystem.Instance.Resolve<GameManager>();
            if (gameManager != null)
            {
                coinsText.text = gameManager.GetCurrency("coins").ToString();
                gemsText.text = gameManager.GetCurrency("gems").ToString();
                levelText.text = $"Level {_castleSystem.levelsCleared}";
            }
        }
        
        private void RefreshRoomButtons()
        {
            // Clear existing buttons
            foreach (var button in _roomButtons)
            {
                if (button != null) Destroy(button);
            }
            _roomButtons.Clear();
            
            // Create room buttons
            var unlockedRooms = _castleSystem.GetUnlockedRooms();
            foreach (var room in unlockedRooms)
            {
                var roomButton = Instantiate(roomButtonPrefab, roomContainer);
                var roomButtonComponent = roomButton.GetComponent<RoomButton>();
                if (roomButtonComponent != null)
                {
                    roomButtonComponent.Setup(room, OnRoomSelected);
                }
                _roomButtons.Add(roomButton);
            }
        }
        
        private void RefreshRoomDetail()
        {
            if (_selectedRoom == null) return;
            
            roomNameText.text = _selectedRoom.name;
            roomDescriptionText.text = _selectedRoom.description;
            completionSlider.value = _selectedRoom.completionPercentage;
            completionText.text = $"{Mathf.RoundToInt(_selectedRoom.completionPercentage * 100)}% Complete";
            
            RefreshTasks();
            RefreshDecorations();
        }
        
        private void RefreshTasks()
        {
            // Clear existing task items
            foreach (var item in _taskItems)
            {
                if (item != null) Destroy(item);
            }
            _taskItems.Clear();
            
            // Create task items
            foreach (var task in _selectedRoom.tasks)
            {
                var taskItem = Instantiate(taskItemPrefab, taskContainer);
                var taskItemComponent = taskItem.GetComponent<TaskItem>();
                if (taskItemComponent != null)
                {
                    taskItemComponent.Setup(task);
                }
                _taskItems.Add(taskItem);
            }
        }
        
        private void RefreshDecorations()
        {
            // Clear existing decoration items
            foreach (var item in _decorationItems)
            {
                if (item != null) Destroy(item);
            }
            _decorationItems.Clear();
            
            // Create decoration items
            foreach (var decoration in _selectedRoom.decorations)
            {
                var decorationItem = Instantiate(decorationItemPrefab, decorationContainer);
                var decorationItemComponent = decorationItem.GetComponent<DecorationItem>();
                if (decorationItemComponent != null)
                {
                    decorationItemComponent.Setup(decoration, OnDecorationClicked);
                }
                _decorationItems.Add(decorationItem);
            }
        }
        
        private void RefreshShop()
        {
            // Clear existing shop items
            foreach (var item in _shopItems)
            {
                if (item != null) Destroy(item);
            }
            _shopItems.Clear();
            
            // Create shop items for all decorations
            foreach (var room in _castleSystem.rooms)
            {
                foreach (var decoration in room.decorations)
                {
                    if (!decoration.isPurchased)
                    {
                        var shopItem = Instantiate(shopDecorationItemPrefab, shopDecorationContainer);
                        var shopItemComponent = shopItem.GetComponent<ShopDecorationItem>();
                        if (shopItemComponent != null)
                        {
                            shopItemComponent.Setup(decoration, OnShopDecorationClicked);
                        }
                        _shopItems.Add(shopItem);
                    }
                }
            }
        }
        
        private void OnRoomSelected(Room room)
        {
            _selectedRoom = room;
            roomDetailPanel.SetActive(true);
            RefreshRoomDetail();
        }
        
        private void OnDecorationClicked(Decoration decoration)
        {
            if (decoration.isPurchased)
            {
                // Toggle placement
                decoration.isPlaced = !decoration.isPlaced;
                RefreshDecorations();
            }
            else
            {
                // Show purchase dialog
                ShowPurchaseDialog(decoration);
            }
        }
        
        private void OnShopDecorationClicked(Decoration decoration)
        {
            ShowPurchaseDialog(decoration);
        }
        
        private void ShowPurchaseDialog(Decoration decoration)
        {
            var gameManager = OptimizedCoreSystem.Instance.Resolve<GameManager>();
            if (gameManager == null) return;
            
            int currentAmount = gameManager.GetCurrency(decoration.currencyType);
            bool canAfford = currentAmount >= decoration.cost;
            
            string message = $"Purchase {decoration.name}?\n\n" +
                           $"Cost: {decoration.cost} {decoration.currencyType}\n" +
                           $"You have: {currentAmount} {decoration.currencyType}\n\n" +
                           $"{decoration.description}";
            
            if (canAfford)
            {
                // Show confirmation dialog
                ShowConfirmationDialog(message, () => {
                    if (_castleSystem.PurchaseDecoration(decoration.id))
                    {
                        RefreshUI();
                        ShowRewardMessage($"Purchased {decoration.name}!");
                    }
                });
            }
            else
            {
                // Show insufficient funds message
                ShowMessage($"Not enough {decoration.currencyType}!\nYou need {decoration.cost - currentAmount} more.");
            }
        }
        
        private void OnBackClicked()
        {
            if (roomDetailPanel.activeInHierarchy)
            {
                roomDetailPanel.SetActive(false);
                _selectedRoom = null;
            }
            else if (decorationShopPanel.activeInHierarchy)
            {
                decorationShopPanel.SetActive(false);
            }
            else
            {
                // Return to main menu
                gameObject.SetActive(false);
            }
        }
        
        private void OnShopClicked()
        {
            decorationShopPanel.SetActive(true);
            RefreshShop();
            RefreshCurrencyDisplay();
        }
        
        private void OnCloseShopClicked()
        {
            decorationShopPanel.SetActive(false);
        }
        
        private void OnRoomUnlocked(Room room)
        {
            RefreshRoomButtons();
            ShowRewardMessage($"New room unlocked: {room.name}!");
        }
        
        private void OnRoomCompleted(Room room)
        {
            RefreshUI();
            ShowRewardMessage($"Room completed: {room.name}!");
        }
        
        private void OnDecorationPurchased(Decoration decoration)
        {
            RefreshUI();
        }
        
        private void OnTaskCompleted(Task task)
        {
            RefreshUI();
            ShowRewardMessage($"Task completed: {task.description}!");
        }
        
        private void OnRewardEarned(Reward reward)
        {
            string message = $"Reward earned: {reward.amount} {reward.type}";
            if (!string.IsNullOrEmpty(reward.itemId))
            {
                message += $" ({reward.itemId})";
            }
            ShowRewardMessage(message);
        }
        
        private void ShowConfirmationDialog(string message, System.Action onConfirm)
        {
            // Simple confirmation dialog - in a real game, you'd use a proper dialog system
            if (Application.isEditor)
            {
                Debug.Log($"Confirmation: {message}");
                onConfirm?.Invoke();
            }
            else
            {
                // For now, just execute the action
                onConfirm?.Invoke();
            }
        }
        
        private void ShowMessage(string message)
        {
            Debug.Log($"Message: {message}");
            // In a real game, show a proper message dialog
        }
        
        private void ShowRewardMessage(string message)
        {
            Debug.Log($"Reward: {message}");
            // In a real game, show a proper reward popup with animations
        }
        
        void OnDestroy()
        {
            if (_castleSystem != null)
            {
                _castleSystem.OnRoomUnlocked -= OnRoomUnlocked;
                _castleSystem.OnRoomCompleted -= OnRoomCompleted;
                _castleSystem.OnDecorationPurchased -= OnDecorationPurchased;
                _castleSystem.OnTaskCompleted -= OnTaskCompleted;
                _castleSystem.OnRewardEarned -= OnRewardEarned;
            }
        }
    }
}