/**
 * Resource streaming configuration for Infinite Match.
 *
 * Maps tile-set IDs (from src/services/levels/tile-sets.js) to remote asset URLs.
 * All URLs are optional — if a URL is missing or unreachable, the game falls
 * back to programmatic canvas rendering (the existing behavior).
 *
 * Operators can add their own CDN URLs here. The game never hardcodes external
 * asset hosts; every remote URL is configured here and can be overridden per
 * deployment.
 */
export const RESOURCE_CONFIG = {
  /** Base URL for all remote assets. Relative URLs resolve against this. */
  baseUrl: '',

  /** Per-theme texture URLs. Keys match tile-set IDs from tile-sets.js. */
  themes: {
    standard: 'textures/gems/standard.png',
    winter: 'textures/gems/winter.png',
    spring: 'textures/gems/spring.png',
    summer: 'textures/gems/summer.png',
    autumn: 'textures/gems/autumn.png',
    christmas_2026: 'textures/gems/christmas.png',
    halloween_oct: 'textures/gems/halloween.png',
    valentine_event_feb: 'textures/gems/valentines.png',
    st_patrick_mar: 'textures/gems/stpatrick.png',
    easter_mar: 'textures/gems/easter.png',
    diwali_2026: 'textures/gems/diwali.png',
    lunar_new_year_2027: 'textures/gems/lunar.png',
    womens_day_mar: 'textures/gems/womensday.png',
  },

  /** UI texture URLs. */
  ui: {
    powerup_bomb: 'textures/ui/powerup_bomb.png',
    powerup_rainbow: 'textures/ui/powerup_rainbow.png',
    powerup_lightning: 'textures/ui/powerup_lightning.png',
    powerup_diamond: 'textures/ui/powerup_diamond.png',
    powerup_target: 'textures/ui/powerup_target.png',
    powerup_star: 'textures/ui/powerup_star.png',
  },

  /** Audio URL placeholders (best-effort; game works silently without them). */
  audio: {
    match: 'audio/match.ogg',
    burst: 'audio/burst.ogg',
    prism: 'audio/prism.ogg',
    beam: 'audio/beam.ogg',
    stage: 'audio/stage.ogg',
    win: 'audio/win.ogg',
    loss: 'audio/loss.ogg',
    invalid: 'audio/invalid.ogg',
    gem_select: 'audio/select.ogg',
  },

  /** Streaming behavior. */
  behavior: {
    /** Maximum concurrent fetches during initial load. */
    maxConcurrentLaunch: 4,
    /** Maximum concurrent fetches during play (background). */
    maxConcurrentPlay: 2,
    /** Timeout in ms for each resource fetch. */
    fetchTimeoutMs: 8000,
    /** How long to cache a fetched resource (ms). 0 = forever while page is open. */
    cacheTtlMs: 0,
    /** Retry failed fetches this many times before giving up. */
    maxRetries: 2,
    /** If true, stream critical launch resources before showing the title. */
    blockLaunchOnCritical: false,
    /** If true, preload likely-needed themes during idle time in play. */
    preloadDuringPlay: true,
  },
};

/**
 * Resolve a theme URL against the base URL.
 */
export function resolveThemeUrl(themeId, config = RESOURCE_CONFIG) {
  const theme = config.themes[themeId];
  if (!theme) return null;
  return config.baseUrl ? new URL(theme, config.baseUrl).href : theme;
}

/**
 * Resolve a UI texture URL.
 */
export function resolveUiUrl(name, config = RESOURCE_CONFIG) {
  const url = config.ui[name];
  if (!url) return null;
  return config.baseUrl ? new URL(url, config.baseUrl).href : url;
}

/**
 * Resolve an audio URL.
 */
export function resolveAudioUrl(name, config = RESOURCE_CONFIG) {
  const url = config.audio[name];
  if (!url) return null;
  return config.baseUrl ? new URL(url, config.baseUrl).href : url;
}

// Attach to window for use by non-module scripts (phaser3-game.js in VM sandbox).
if (typeof window !== 'undefined') {
  window.RESOURCE_CONFIG = RESOURCE_CONFIG;
  window.allThemeUrls = allThemeUrls;
  window.allUiUrls = allUiUrls;
  window.allAudioUrls = allAudioUrls;
  window.resolveThemeUrl = resolveThemeUrl;
  window.resolveUiUrl = resolveUiUrl;
  window.resolveAudioUrl = resolveAudioUrl;
}

/**
 * Return all configured theme URLs as { themeId, url } pairs.
 */
export function allThemeUrls(config = RESOURCE_CONFIG) {
  return Object.entries(config.themes)
    .map(([themeId, url]) => ({ themeId, url: resolveThemeUrl(themeId, config) }))
    .filter((entry) => entry.url);
}

/**
 * Return all configured UI URLs as { name, url } pairs.
 */
export function allUiUrls(config = RESOURCE_CONFIG) {
  return Object.entries(config.ui)
    .map(([name, url]) => ({ name, url: resolveUiUrl(name, config) }))
    .filter((entry) => entry.url);
}

/**
 * Return all configured audio URLs as { name, url } pairs.
 */
export function allAudioUrls(config = RESOURCE_CONFIG) {
  return Object.entries(config.audio)
    .map(([name, url]) => ({ name, url: resolveAudioUrl(name, config) }))
    .filter((entry) => entry.url);
}
