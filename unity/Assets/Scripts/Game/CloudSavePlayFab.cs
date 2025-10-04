using UnityEngine;

namespace Evergreen.Game
{
    public class CloudSavePlayFab : MonoBehaviour
    {
        public static CloudSavePlayFab Instance { get; private set; }
        private void Awake(){ if (Instance!=null){ Destroy(gameObject); return;} Instance=this; DontDestroyOnLoad(gameObject);}        
        public void Load(){ Debug.Log("CloudSave Load (stub)"); }
        public void Save(){ Debug.Log("CloudSave Save (stub)"); }
    }
}
