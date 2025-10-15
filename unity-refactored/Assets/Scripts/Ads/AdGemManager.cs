using UnityEngine;

public class AdGemManager : MonoBehaviour
{
    [SerializeField] private string appIdAndroid = "";
    [SerializeField] private string appIdIOS = "";

    void Awake()
    {
        DontDestroyOnLoad(gameObject);
        // TODO: Integrate AdGem SDK initialization and offerwall open
        Debug.Log("[Stub] AdGem init");
    }

    public void OpenOfferwall()
    {
        Debug.Log("[Stub] Open AdGem offerwall");
    }
}
