using UnityEngine;

namespace Evergreen.Social
{
    public class TeamGifting : MonoBehaviour
    {
        public static TeamGifting Instance { get; private set; }
        private void Awake(){ if (Instance != null){ Destroy(gameObject); return;} Instance=this; DontDestroyOnLoad(gameObject);}    
        public bool SendEnergy(string toPlayerId, int amount = 1)
        {
            Evergreen.Game.GameState.AddCoins(0); // placeholder side effect
            Evergreen.Game.AnalyticsAdapter.CustomEvent("team_gift_energy", amount);
            return true;
        }
    }
}
