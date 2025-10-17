using UnityEngine;
using UnityEngine.UI;
using TMPro;
using Evergreen.Social;

namespace Evergreen.UI
{
    public class LeaderboardEntryUI : MonoBehaviour
    {
        [Header("UI Elements")]
        public TextMeshProUGUI rankText;
        public TextMeshProUGUI playerNameText;
        public TextMeshProUGUI scoreText;
        public Image avatarImage;
        public Image backgroundImage;
        public GameObject highlightObject;
        
        [Header("Colors")]
        public Color playerColor = Color.yellow;
        public Color top3Color = Color.cyan;
        public Color normalColor = Color.white;
        
        private LeaderboardEntry entryData;
        private bool isPlayerEntry = false;
        
        public void SetupEntry(LeaderboardEntry entry)
        {
            entryData = entry;
            isPlayerEntry = IsPlayerEntry(entry);
            UpdateUI();
        }
        
        private bool IsPlayerEntry(LeaderboardEntry entry)
        {
            // Check if this is the current player's entry
            var playerId = PlayerPrefs.GetString("PlayerId", "");
            return entry.playerId == playerId;
        }
        
        private void UpdateUI()
        {
            if (entryData == null) return;
            
            rankText.text = $"#{entryData.rank}";
            playerNameText.text = entryData.playerName;
            scoreText.text = FormatScore(entryData.score);
            
            // Set background color based on rank and player
            if (isPlayerEntry)
            {
                backgroundImage.color = playerColor;
                if (highlightObject != null)
                    highlightObject.SetActive(true);
            }
            else if (entryData.rank <= 3)
            {
                backgroundImage.color = top3Color;
                if (highlightObject != null)
                    highlightObject.SetActive(false);
            }
            else
            {
                backgroundImage.color = normalColor;
                if (highlightObject != null)
                    highlightObject.SetActive(false);
            }
            
            // Load avatar image (placeholder for now)
            if (avatarImage != null)
            {
                // In a real implementation, you would load the avatar from a URL or asset
                avatarImage.sprite = GetDefaultAvatar();
            }
        }
        
        private string FormatScore(int score)
        {
            if (score >= 1000000)
                return $"{score / 1000000f:F1}M";
            else if (score >= 1000)
                return $"{score / 1000f:F1}K";
            else
                return score.ToString("N0");
        }
        
        private Sprite GetDefaultAvatar()
        {
            // Load default avatar from Resources
            var defaultAvatar = Resources.Load<Sprite>("UI/Avatars/DefaultAvatar");
            if (defaultAvatar != null)
            {
                return defaultAvatar;
            }
            
            // Fallback: create a simple colored circle sprite
            var texture = new Texture2D(64, 64);
            var colors = new Color[64 * 64];
            for (int i = 0; i < colors.Length; i++)
            {
                colors[i] = Color.gray;
            }
            texture.SetPixels(colors);
            texture.Apply();
            
            return Sprite.Create(texture, new Rect(0, 0, 64, 64), new Vector2(0.5f, 0.5f));
        }
        
        public void OnEntryClicked()
        {
            if (entryData == null) return;
            
            // Show player profile or additional info
            Debug.Log($"Clicked on {entryData.playerName} (Rank #{entryData.rank})");
            ShowPlayerProfile();
        }
        
        private void ShowPlayerProfile()
        {
            // This would open a player profile popup
            Debug.Log($"Showing profile for {entryData.playerName}");
        }
    }
}