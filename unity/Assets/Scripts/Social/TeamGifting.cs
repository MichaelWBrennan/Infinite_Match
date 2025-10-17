using UnityEngine;

namespace Evergreen.Social
{
    public class TeamGifting : MonoBehaviour
    {
        public static TeamGifting Instance { get; private set; }
        private void Awake(){ if (Instance != null){ Destroy(gameObject); return;} Instance=this; DontDestroyOnLoad(gameObject);}    
        public bool SendEnergy(string toPlayerId, int amount = 1)
        {
            // Get the energy system from the core system
            var energySystem = Evergreen.Core.OptimizedCoreSystem.Instance?.GetService<Evergreen.Economy.EnergySystem>();
            if (energySystem != null)
            {
                energySystem.AddEnergy(amount);
            }
            
            // Track the gift in analytics
            Evergreen.Game.AnalyticsAdapter.CustomEvent("team_gift_energy", amount);
            
            // Log the gift action
            Evergreen.Core.Logger.Info($"Sent {amount} energy to player {toPlayerId}", "TeamGifting");
            
            return true;
        }
    }
}
