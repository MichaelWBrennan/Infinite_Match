export class AdConfigService {
    constructor(remoteConfigPath?: string);
    remoteConfigPath: string;
    loadRemoteConfig(): Promise<any>;
    getAdConfigForPlayer(profile?: {}): Promise<{
        enabled: boolean;
        rewarded: {
            enabled: boolean;
            maxPerSession: number;
            minIntervalSeconds: number;
        };
        interstitial: {
            enabled: boolean;
            maxPerSession: number;
            minIntervalSeconds: number;
            onGameoverPct: number;
        };
        contentRatingMax: any;
        nonPersonalizedAdsForKids: boolean;
        mediation: {
            provider: any;
            waterfalls: {
                default: string[];
                tier2: string[];
            };
            A_B: {
                experiment: string;
                variants: {
                    key: string;
                    rewarded_interval: any;
                    interstitial_interval: any;
                }[];
            };
        };
        updatedAt: string;
    }>;
}
export default AdConfigService;
//# sourceMappingURL=AdConfigService.d.ts.map