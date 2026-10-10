/**
 * Coarse, opt-out location/date context. No GPS, IP lookup, geocoding API or
 * player-location database. Time zones are estimates, not proof of residence.
 * Holiday calculations use date-holidays (ISC code / CC-BY-SA-3.0 calendar data).
 */
import Holidays from 'date-holidays';
import { TIME_ZONE_REGIONS } from './time-zone-regions.js';

export class LevelInputError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

const catalog = new Holidays();
const holidayCountries = catalog.getCountries();
const validCountries = new Set([...Object.keys(holidayCountries), ...Object.values(TIME_ZONE_REGIONS).map((v) => v.country)]);
const zoneEstimates = new Map(Object.entries(TIME_ZONE_REGIONS));
const countryHemisphere = new Map();
for (const [zone, value] of Object.entries(TIME_ZONE_REGIONS)) {
  if (!countryHemisphere.has(value.country)) countryHemisphere.set(value.country, value.hemisphere);
  try {
    const canonical = new Intl.DateTimeFormat('en', { timeZone: zone }).resolvedOptions().timeZone;
    if (!zoneEstimates.has(canonical)) zoneEstimates.set(canonical, value);
  } catch { /* tzdb may know a zone newer than the current ICU runtime. */ }
}
const formatters = new Map();
const holidayCache = new Map();

function remember(cache, key, value, max = 64) {
  if (cache.size >= max) cache.delete(cache.keys().next().value);
  cache.set(key, value);
  return value;
}

function dateFormatter(timeZone) {
  return formatters.get(timeZone) || remember(formatters, timeZone,
    new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', calendar: 'gregory', numberingSystem: 'latn' }));
}

export function civilDate(nowMs, timeZone) {
  const parts = Object.fromEntries(dateFormatter(timeZone).formatToParts(new Date(nowMs)).map((p) => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

/** First instant of tomorrow locally, including 23/25-hour DST days and half-hour offsets. */
export function nextLocalMidnight(nowMs, timeZone) {
  const day = civilDate(nowMs, timeZone);
  let low = Math.floor(nowMs / 1000);
  let high = low + 27 * 3600;
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2);
    if (civilDate(middle * 1000, timeZone) === day) low = middle;
    else high = middle;
  }
  return new Date(high * 1000).toISOString();
}

function text(value, code, limit = 80) {
  if (typeof value !== 'string' || value.length > limit) throw new LevelInputError(code);
  return value.trim();
}

function boolean(value) {
  if (value === undefined || value === '' || value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  throw new LevelInputError('invalid_holiday_themes');
}

export function normalizeLocation(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new LevelInputError('invalid_location');
  const requestedZone = text(input.timeZone ?? input.timezone ?? 'UTC', 'invalid_time_zone');
  let timeZone;
  try {
    timeZone = new Intl.DateTimeFormat('en', { timeZone: requestedZone }).resolvedOptions().timeZone;
  } catch {
    throw new LevelInputError('invalid_time_zone');
  }
  const estimate = zoneEstimates.get(requestedZone) || zoneEstimates.get(timeZone);
  const requestedCountry = input.country === undefined ? '' : text(input.country, 'invalid_country', 2).toUpperCase();
  if (requestedCountry && !validCountries.has(requestedCountry)) throw new LevelInputError('invalid_country');
  const country = requestedCountry || estimate?.country || null;
  const region = input.region === undefined ? '' : text(input.region, 'invalid_region', 12).toUpperCase();
  if (region && (!country || !Object.hasOwn(catalog.getStates(country) || {}, region))) throw new LevelInputError('invalid_region');
  const hemisphere = input.hemisphere === undefined ? '' : text(input.hemisphere, 'invalid_hemisphere', 5);
  if (hemisphere && !['north', 'south'].includes(hemisphere)) throw new LevelInputError('invalid_hemisphere');
  return {
    timeZone,
    country,
    region: region || null,
    hemisphere: hemisphere || (requestedCountry && requestedCountry !== estimate?.country
      ? countryHemisphere.get(country) : estimate?.hemisphere) || 'north',
    locationSource: requestedCountry ? 'player_setting' : estimate ? 'time_zone_estimate' : 'unknown',
    holidayThemes: boolean(input.holidayThemes),
  };
}

function annualHolidays(location, year) {
  if (!Object.hasOwn(holidayCountries, location.country)) return [];
  const key = [location.country, location.region, location.timeZone, year].join('|');
  if (holidayCache.has(key)) return holidayCache.get(key);
  const calendar = new Holidays(location.country, location.region || undefined);
  calendar.setTimezone(location.timeZone);
  calendar.setLanguages('en');
  const dates = calendar.getHolidays(year)
    .filter((holiday) => ['public', 'observance'].includes(holiday.type))
    .map((holiday) => ({
      name: holiday.name,
      type: holiday.type,
      startDate: holiday.date.slice(0, 10),
      endDate: civilDate(holiday.end.getTime() - 1, location.timeZone),
    }));
  return remember(holidayCache, key, dates);
}

export function localLevelContext(input = {}, nowMs = Date.now()) {
  const location = normalizeLocation(input);
  const localDate = civilDate(nowMs, location.timeZone);
  const [year, month, day] = localDate.split('-').map(Number);
  const northSeason = ['winter', 'spring', 'summer', 'autumn'][Math.floor((month % 12) / 3)];
  const opposites = { winter: 'summer', spring: 'autumn', summer: 'winter', autumn: 'spring' };
  const candidates = location.holidayThemes && location.country
    ? [...annualHolidays(location, year - 1), ...annualHolidays(location, year)] : [];
  // Whole local-day themes, even when an observance starts in the evening (Halloween).
  // Theme/seed never changes halfway through a daily challenge.
  const holidays = candidates.filter((h) => h.startDate <= localDate && h.endDate >= localDate)
    .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name, 'en') : a.type === 'public' ? -1 : 1));
  const unique = [...new Map(holidays.map((h) => [h.name, { name: h.name, type: h.type }])).values()];
  return {
    ...location,
    localDate,
    year,
    month,
    day,
    season: location.hemisphere === 'south' ? opposites[northSeason] : northSeason,
    holidays: unique,
    holidayCoverage: Object.hasOwn(holidayCountries, location.country),
    refreshAt: nextLocalMidnight(nowMs, location.timeZone),
  };
}

export function locationCatalog(country) {
  if (country !== undefined && (typeof country !== 'string' || !validCountries.has(country.toUpperCase()))) {
    throw new LevelInputError('invalid_country');
  }
  const display = new Intl.DisplayNames(['en'], { type: 'region' });
  return {
    countries: [...validCountries].map((code) => ({ code, name: display.of(code) || holidayCountries[code] || code }))
      .sort((a, b) => a.name.localeCompare(b.name, 'en')),
    regions: Object.entries(country ? catalog.getStates(country.toUpperCase()) || {} : {})
      .map(([code, name]) => ({ code, name })),
  };
}
