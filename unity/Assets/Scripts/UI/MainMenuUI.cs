using UnityEngine;
using UnityEngine.SceneManagement;
using Evergreen.Game;
using Evergreen.Social;

public class MainMenuUI : MonoBehaviour
{
    public void OnStartGame()
    {
        if (!GameState.ConsumeEnergy(1))
        {
            FindObjectOfType<UnityAdsManager>()?.ShowRewarded(() => GameState.AddCoins(5));
            return;
        }
        SceneManager.LoadScene("Gameplay");
    }

    public static void Show()
    {
        SceneManager.LoadScene("MainMenu");
    }

    // Hook this to a UI Button to open Team Chat
    public void OnOpenChat()
    {
        TeamChatUIFactory.Show();
    }
}
