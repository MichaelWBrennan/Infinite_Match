using UnityEngine;

public class TapjoyManager : MonoBehaviour
{
    [SerializeField] private string sdkKeyAndroid = "";
    [SerializeField] private string sdkKeyIOS = "";

    void Awake()
    {
        DontDestroyOnLoad(gameObject);
        // TODO: Integrate Tapjoy SDK initialization here
        Debug.Log("[Stub] Tapjoy init");
    }
}
