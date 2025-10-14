import { readFile } from 'fs/promises';
import { Logger } from '../../core/logger/index.js';

const logger = new Logger('AdConfigService');

export class AdConfigService {
  constructor(remoteConfigPath = 'remote-config/remote-config.json') {
    this.remoteConfigPath = remoteConfigPath;
  }

  async loadRemoteConfig() {
    try {
      const content = await readFile(this.remoteConfigPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      logger.warn('Failed to load remote-config, using defaults', { error: error.message });
      return {
        game_settings: {
          ads_enabled: true,
          ads_interstitial_enabled: true,
          ads_rewarded_enabled: true,
          ads_interstitial_max_per_session: 4,
          ads_rewarded_max_per_session: 6,
          ads_interstitial_min_interval_seconds: 120,
          ads_rewarded_min_interval_seconds: 45,
          ad_content_rating_max: 'G',
          use_npa_for_kids: true,
          interstitial_on_gameover_pct: 50,
        },
      };
    }
  }

  async getAdConfigForPlayer(profile = {}) {
    const rc = await this.loadRemoteConfig();
    const gs = rc.game_settings || {};

    // Placeholder: recommend mediation settings (to be consumed by client)
    const country = (profile.country || profile.region || 'US').toUpperCase();
    const providerByGeo = {
      US: 'MAX',
      CA: 'MAX',
      GB: 'MAX',
      DE: 'LEVELPLAY',
      FR: 'LEVELPLAY',
      JP: 'LEVELPLAY',
      KR: 'MAX',
      IN: 'MAX',
      BR: 'LEVELPLAY',
      DEFAULT: 'MAX',
    };
    const provider = providerByGeo[country] || providerByGeo.DEFAULT;
    const mediation = {
      provider,
      waterfalls: {
        default: provider === 'MAX'
          ? ['applovin', 'admob', 'unityads', 'meta_audience']
          : ['ironsource', 'admob', 'applovin', 'unityads'],
        tier2: provider === 'MAX'
          ? ['admob', 'applovin', 'ironsource', 'chartboost']
          : ['admob', 'ironsource', 'applovin', 'chartboost'],
      },
      A_B: {
        experiment: 'ad_freq_v1',
        variants: [
          { key: 'A', rewarded_interval: gs.ads_rewarded_min_interval_seconds, interstitial_interval: gs.ads_interstitial_min_interval_seconds },
          { key: 'B', rewarded_interval: Math.max(30, gs.ads_rewarded_min_interval_seconds - 15), interstitial_interval: Math.max(60, gs.ads_interstitial_min_interval_seconds - 60) },
        ],
      },
    };

    return {
      enabled: Boolean(gs.ads_enabled),
      rewarded: {
        enabled: Boolean(gs.ads_rewarded_enabled),
        maxPerSession: Number(gs.ads_rewarded_max_per_session || 6),
        minIntervalSeconds: Number(gs.ads_rewarded_min_interval_seconds || 45),
      },
      interstitial: {
        enabled: Boolean(gs.ads_interstitial_enabled),
        maxPerSession: Number(gs.ads_interstitial_max_per_session || 4),
        minIntervalSeconds: Number(gs.ads_interstitial_min_interval_seconds || 120),
        onGameoverPct: Number(gs.interstitial_on_gameover_pct || 50),
      },
      contentRatingMax: gs.ad_content_rating_max || 'G',
      nonPersonalizedAdsForKids: Boolean(gs.use_npa_for_kids),
      mediation,
      updatedAt: new Date().toISOString(),
    };
  }
}

export default AdConfigService;
