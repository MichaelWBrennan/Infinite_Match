/**
 * Resource streaming configuration for Infinite Match.
 *
 * The playable game uses the original, local Celestial Facets artwork from
 * js/art-direction.js and the atlas built by js/texture-atlas.js. No remote tile
 * pack is allowed to override gem identity, silhouette, or accessibility marks.
 * Operators may still use ResourceStreamer for optional non-gameplay resources,
 * but the default theme/UI/audio maps are intentionally empty.
 */
export const RESOURCE_CONFIG = {
  baseUrl: '',
  themes: {},
  ui: {},
  audio: {},
  behavior: {
    maxConcurrentLaunch: 4,
    maxConcurrentPlay: 2,
    fetchTimeoutMs: 8000,
    cacheTtlMs: 0,
    maxRetries: 2,
    blockLaunchOnCritical: false,
    preloadDuringPlay: true,
  },
};

export function resolveThemeUrl(themeId, config = RESOURCE_CONFIG) {
  const theme = config.themes[themeId];
  if (!theme) return null;
  return config.baseUrl ? new URL(theme, config.baseUrl).href : theme;
}
export function resolveUiUrl(name, config = RESOURCE_CONFIG) {
  const url = config.ui[name];
  if (!url) return null;
  return config.baseUrl ? new URL(url, config.baseUrl).href : url;
}
export function resolveAudioUrl(name, config = RESOURCE_CONFIG) {
  const url = config.audio[name];
  if (!url) return null;
  return config.baseUrl ? new URL(url, config.baseUrl).href : url;
}
export function allThemeUrls(config = RESOURCE_CONFIG) {
  return Object.entries(config.themes).map(([themeId, url]) => ({ themeId, url: resolveThemeUrl(themeId, config) })).filter((entry) => entry.url);
}
export function allUiUrls(config = RESOURCE_CONFIG) {
  return Object.entries(config.ui).map(([name, url]) => ({ name, url: resolveUiUrl(name, config) })).filter((entry) => entry.url);
}
export function allAudioUrls(config = RESOURCE_CONFIG) {
  return Object.entries(config.audio).map(([name, url]) => ({ name, url: resolveAudioUrl(name, config) })).filter((entry) => entry.url);
}

if (typeof window !== 'undefined') {
  window.RESOURCE_CONFIG = RESOURCE_CONFIG;
  window.allThemeUrls = allThemeUrls;
  window.allUiUrls = allUiUrls;
  window.allAudioUrls = allAudioUrls;
  window.resolveThemeUrl = resolveThemeUrl;
  window.resolveUiUrl = resolveUiUrl;
  window.resolveAudioUrl = resolveAudioUrl;
}
