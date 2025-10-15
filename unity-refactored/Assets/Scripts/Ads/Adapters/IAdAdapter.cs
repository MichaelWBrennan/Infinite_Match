using System;
using System.Collections.Generic;

namespace Evergreen.Ads
{
    public interface IAdAdapter
    {
        void Initialize(Dictionary<string, object> config);
        void Preload(string placement);
        void ShowRewarded(string placement, Action onComplete = null);
        void ShowInterstitial(string placement);
    }
}
