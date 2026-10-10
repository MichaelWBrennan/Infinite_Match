/**
 * Weather for procedural boards only. Native fetch, no accounts/API keys, no
 * synthesized observations and no player-location database. MET Norway is the
 * public-data default; a self-hosted Open-Meteo-compatible endpoint is optional.
 */
import { TIME_ZONE_WEATHER_POINTS } from './time-zone-weather-points.js';
import { TIME_ZONE_REGIONS } from './time-zone-regions.js';
import { WEATHER_CONDITIONS, temperatureBand } from './environment.js';

const zoneAreas = new Map();
const countryAreas = new Map();
for (const [zone, [latitude, longitude]] of Object.entries(TIME_ZONE_WEATHER_POINTS)) {
  const area = { latitude, longitude, label: `${zone} representative area`, key: `${latitude},${longitude}`, country: TIME_ZONE_REGIONS[zone]?.country, source: 'time_zone_estimate' };
  zoneAreas.set(zone, area);
  const country = TIME_ZONE_REGIONS[zone]?.country;
  if (country && !countryAreas.has(country)) countryAreas.set(country, { ...area, source: 'country_estimate' });
  try {
    const canonical = new Intl.DateTimeFormat('en', { timeZone: zone }).resolvedOptions().timeZone;
    if (!zoneAreas.has(canonical)) zoneAreas.set(canonical, area);
  } catch { /* A newer tzdb alias may not be understood by this runtime. */ }
}

// Prefer familiar mainland reference areas over the first offshore/Antarctic
// entry when the player supplies a country but no usable time-zone estimate.
for (const [country, zone] of Object.entries({ AU: 'Australia/Sydney', BR: 'America/Sao_Paulo',
  CA: 'America/Toronto', US: 'America/New_York', RU: 'Europe/Moscow', CN: 'Asia/Shanghai',
  MX: 'America/Mexico_City', IN: 'Asia/Kolkata', JP: 'Asia/Tokyo', NZ: 'Pacific/Auckland' })) {
  if (zoneAreas.has(zone)) countryAreas.set(country, { ...zoneAreas.get(zone), source: 'country_estimate' });
}

export function weatherArea(location) {
  if (Number.isFinite(location.weatherLatitude) && Number.isFinite(location.weatherLongitude)) {
    const latitude = Math.round(location.weatherLatitude);
    const longitude = Math.round(location.weatherLongitude);
    return { latitude, longitude, key: `${latitude},${longitude}`, label: `Approximate area ${latitude}°, ${longitude}°`, source: 'player_grid' };
  }
  const estimate = zoneAreas.get(location.timeZone);
  // A manual holiday country may differ from the selected time zone. Do not
  // silently describe New York's forecast as Japanese regional weather.
  if (estimate && (!location.country || estimate.country === location.country)) return { ...estimate };
  return countryAreas.has(location.country) ? { ...countryAreas.get(location.country) } : null;
}

export function unavailableWeather(area = null, reason = 'unavailable', expiresAt = null) {
  return { available: false, condition: 'unknown', temperatureC: null, temperatureBand: 'unknown',
    windBand: 'calm', source: 'unavailable', area, forecastAt: null, expiresAt, reason, attribution: null };
}

const ATTRIBUTIONS = {
  metno: { name: 'MET Norway', sourceUrl: 'https://api.met.no/weatherapi/locationforecast/2.0/',
    license: 'CC-BY-4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/', noticeUrl: '/licenses/weather.txt' },
  'open-meteo': { name: 'Open-Meteo', sourceUrl: 'https://open-meteo.com/',
    license: 'CC-BY-4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/', noticeUrl: '/licenses/weather.txt' },
};

export function metCondition(symbol) {
  if (typeof symbol !== 'string') return 'unknown';
  const value = symbol.replace(/_(day|night|polartwilight)$/, '');
  const simple = ({ clearsky: 'clear', fair: 'partly_cloudy', partlycloudy: 'partly_cloudy', cloudy: 'cloudy', fog: 'fog' })[value];
  if (simple) return simple;
  if (!/^(light|heavy)?(rain|snow|sleet)(showers)?(andthunder)?$/.test(value)) return 'unknown';
  if (value.includes('thunder')) return 'storm';
  if (value.includes('sleet')) return 'sleet';
  if (value.includes('snow')) return 'snow';
  if (value.includes('rain')) return 'rain';
  return ({ clearsky: 'clear', fair: 'partly_cloudy', partlycloudy: 'partly_cloudy', cloudy: 'cloudy', fog: 'fog' })[value] || 'unknown';
}

export function wmoCondition(code) {
  if (code === 0) return 'clear';
  if ([1, 2].includes(code)) return 'partly_cloudy';
  if (code === 3) return 'cloudy';
  if ([45, 48].includes(code)) return 'fog';
  if ([56, 57, 66, 67].includes(code)) return 'sleet';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snow';
  if ([95, 96, 99].includes(code)) return 'storm';
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return 'rain';
  return 'unknown';
}

/** Never treat unknown/malformed data as sunny weather or a current observation. */
export function normalizeForecast(body, provider, area, nowMs, cacheExpiresAt) {
  let condition, temperatureC, wind, forecastAt, validUntil;
  if (provider === 'metno') {
    const units = body?.properties?.meta?.units;
    if ((units?.air_temperature && units.air_temperature !== 'celsius') || (units?.wind_speed && units.wind_speed !== 'm/s')) throw new Error('invalid_units');
    const rows = body?.properties?.timeseries;
    if (!Array.isArray(rows) || rows.length > 512) throw new Error('invalid_forecast');
    const sorted = rows.map((row) => ({ row, time: Date.parse(row?.time) }))
      .filter((entry) => Number.isFinite(entry.time)).sort((a, b) => a.time - b.time);
    const past = sorted.filter((entry) => entry.time <= nowMs);
    const entry = past.at(-1) || sorted[0];
    if (!entry || Math.abs(entry.time - nowMs) > 90 * 60000) throw new Error('stale_forecast');
    const data = entry.row.data;
    const summary = data?.next_1_hours?.summary || data?.next_6_hours?.summary || data?.next_12_hours?.summary;
    condition = metCondition(summary?.symbol_code);
    temperatureC = data?.instant?.details?.air_temperature;
    wind = data?.instant?.details?.wind_speed ?? 0;
    forecastAt = new Date(entry.time).toISOString();
    const next = sorted.find((item) => item.time > entry.time);
    validUntil = Math.min(next?.time || entry.time + 3600000, entry.time + 90 * 60000);
  } else {
    const units = body?.current_units;
    if ((units?.temperature_2m && units.temperature_2m !== '°C') || (units?.wind_speed_10m && units.wind_speed_10m !== 'm/s')) throw new Error('invalid_units');
    const current = body?.current;
    const time = typeof current?.time === 'number' ? current.time * 1000 : NaN;
    if (!Number.isFinite(time) || Math.abs(time - nowMs) > 90 * 60000) throw new Error('stale_forecast');
    condition = wmoCondition(current.weather_code);
    temperatureC = current.temperature_2m;
    wind = current.wind_speed_10m ?? 0;
    forecastAt = new Date(time).toISOString();
    validUntil = time + Math.min(3600, Math.max(900, Number(current.interval) || 900)) * 1000;
  }
  if (!WEATHER_CONDITIONS.includes(condition) || !Number.isFinite(temperatureC) || temperatureC < -100 || temperatureC > 65
      || !Number.isFinite(wind) || wind < 0 || wind > 110 || validUntil <= nowMs) throw new Error('invalid_forecast');
  return { available: true, source: provider, condition, temperatureC: Math.round(temperatureC * 10) / 10,
    temperatureBand: temperatureBand(temperatureC), windBand: wind >= 8 ? 'windy' : 'calm',
    area, forecastAt, expiresAt: new Date(Math.min(cacheExpiresAt, validUntil)).toISOString(),
    attribution: { ...ATTRIBUTIONS[provider] } };
}

/** Isolated caches/transport make the real feed adapter testable without live internet. */
export function createLevelWeatherService({ fetchFn = (...args) => globalThis.fetch(...args), env = () => process.env,
  maxCache = 512, maxInFlight = 2, timeoutMs = 1800 } = {}) {
  const cache = new Map();
  const pending = new Map();
  let recentStarts = [];

  async function snapshot(location, nowMs = Date.now()) {
    if (location.weatherEnabled === false) return { ...unavailableWeather(null, 'player_disabled'), source: 'disabled', condition: 'disabled' };
    const area = weatherArea(location);
    if (!area) return unavailableWeather(null, 'no_regional_area');
    const settings = env();
    const capacity = Math.max(1, Math.min(4096, Number(settings.LEVEL_WEATHER_CACHE_AREAS) || maxCache));
    const provider = settings.LEVEL_WEATHER_PROVIDER || (settings.NODE_ENV === 'test' ? 'off' : 'metno');
    if (provider === 'off') return unavailableWeather(area, 'operator_disabled');
    if (!['metno', 'open-meteo'].includes(provider)) return unavailableWeather(area, 'invalid_provider');
    let url;
    try {
      url = provider === 'metno' ? new URL('https://api.met.no/weatherapi/locationforecast/2.0/compact')
        : new URL(settings.LEVEL_WEATHER_OPEN_METEO_URL);
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('invalid_endpoint');
      // Endpoint configuration is operator-only. No request/query/body can supply a URL.
      if (provider === 'metno') {
        url.searchParams.set('lat', String(area.latitude));
        url.searchParams.set('lon', String(area.longitude));
      } else {
        url.searchParams.set('latitude', String(area.latitude));
        url.searchParams.set('longitude', String(area.longitude));
        url.searchParams.set('current', 'temperature_2m,weather_code,wind_speed_10m');
        url.searchParams.set('temperature_unit', 'celsius');
        url.searchParams.set('wind_speed_unit', 'ms');
        url.searchParams.set('timeformat', 'unixtime');
        url.searchParams.set('timezone', 'UTC');
      }
    } catch { return unavailableWeather(area, 'not_configured'); }
    const key = `${provider}|${url.origin}${url.pathname}|${area.key}`;
    const existing = cache.get(key);
    let entry = existing;
    if (!entry || entry.expiresAt <= nowMs) {
      if (pending.has(key)) entry = await pending.get(key);
      else {
        // Expired entries may be removed; fresh provider data is never evicted and
        // re-requested before Expires. Full/busy caches degrade to neutral weather.
        if (!existing && cache.size + pending.size >= capacity) {
          for (const [oldKey, value] of cache) if (value.expiresAt <= nowMs) cache.delete(oldKey);
          if (cache.size + pending.size >= capacity) return unavailableWeather(area, 'capacity', new Date(nowMs + 60000).toISOString());
        }
        const instant = Date.now();
        recentStarts = recentStarts.filter((time) => instant - time < 1000);
        const rate = Math.max(1, Math.min(4, Number(settings.LEVEL_WEATHER_REQUESTS_PER_SECOND) || 4));
        if (pending.size >= maxInFlight || recentStarts.length >= rate) return unavailableWeather(area, 'busy', new Date(nowMs + 60000).toISOString());
        recentStarts.push(instant);
        const task = (async () => {
          try {
            const headers = { Accept: 'application/json',
              'User-Agent': settings.LEVEL_WEATHER_USER_AGENT || 'InfiniteMatch/2.0 github.com/MichaelWBrennan/Infinite_Match' };
            if (existing?.lastModified) headers['If-Modified-Since'] = existing.lastModified;
            const response = await fetchFn(url.toString(), { headers, signal: AbortSignal.timeout(timeoutMs), redirect: 'error' });
            if (!(response.ok || response.status === 304)) throw new Error('weather_unavailable');
            if (Number(response.headers.get('content-length')) > 1024 * 1024) throw new Error('weather_payload_too_large');
            const payload = response.status === 304 ? existing?.payload : await response.json();
            if (!payload) throw new Error('weather_unavailable');
            const expiry = Date.parse(response.headers.get('expires'));
            let expiresAt = Number.isFinite(expiry) && expiry > nowMs ? expiry : nowMs + (provider === 'metno' ? 3600000 : 300000);
            if (provider === 'open-meteo' && !Number.isFinite(expiry) && typeof payload.current?.time === 'number') {
              expiresAt = Math.min(expiresAt, payload.current.time * 1000 + Math.max(900, Number(payload.current.interval) || 900) * 1000);
            }
            normalizeForecast(payload, provider, area, nowMs, expiresAt); // Validate before caching as usable weather.
            return { payload, expiresAt, lastModified: response.headers.get('last-modified') || existing?.lastModified };
          } catch {
            return { payload: null, expiresAt: nowMs + 300000, reason: 'unavailable' };
          }
        })();
        pending.set(key, task);
        try { entry = await task; cache.set(key, entry); }
        finally { pending.delete(key); }
      }
    }
    if (!entry.payload) return unavailableWeather(area, entry.reason, new Date(entry.expiresAt).toISOString());
    try { return normalizeForecast(entry.payload, provider, area, nowMs, entry.expiresAt); }
    catch { return unavailableWeather(area, 'stale_forecast', new Date(entry.expiresAt).toISOString()); }
  }

  return Object.freeze({ snapshot });
}

export const levelWeatherService = createLevelWeatherService();
