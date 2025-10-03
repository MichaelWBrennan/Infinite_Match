using UnityEngine;
using UnityEngine.SceneManagement;
using Evergreen.Game;

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
}
