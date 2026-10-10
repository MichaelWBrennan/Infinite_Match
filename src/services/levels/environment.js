/** Pure, shared clock/weather rules. No network, GPS, random weather or player data. */
export const DAY_PERIODS = ['morning', 'afternoon', 'evening', 'night'];
export const WEATHER_CONDITIONS = ['clear', 'partly_cloudy', 'cloudy', 'rain', 'snow', 'sleet', 'storm', 'fog'];
const clockFormatters = new Map();

export function periodForHour(hour) {
  if (hour < 6 || hour >= 22) return 'night';
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

function clockParts(nowMs, timeZone) {
  let formatter = clockFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-CA', { timeZone, calendar: 'gregory', numberingSystem: 'latn',
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' });
    if (clockFormatters.size >= 64) clockFormatters.delete(clockFormatters.keys().next().value);
    clockFormatters.set(timeZone, formatter);
  }
  const parts = Object.fromEntries(formatter.formatToParts(new Date(nowMs)).map((part) => [part.type, part.value]));
  const hour = Number(parts.hour) % 24;
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hour, period: periodForHour(hour) };
}

/** Fixed local clock periods, not astronomical sunrise/sunset. DST uses native tzdb. */
export function timeOfDayContext(nowMs, timeZone, enabled = true) {
  const current = clockParts(nowMs, timeZone);
  if (!enabled) return { period: 'off', label: 'Time effects off', nextChangeAt: null };
  const key = `${current.date}|${current.period}`;
  let low = Math.floor(nowMs / 1000);
  let high = low + 27 * 3600;
  while (high - low > 1) {
    const mid = Math.floor((high + low) / 2);
    const value = clockParts(mid * 1000, timeZone);
    if (`${value.date}|${value.period}` === key) low = mid;
    else high = mid;
  }
  return { period: current.period, label: current.period[0].toUpperCase() + current.period.slice(1),
    nextChangeAt: new Date(high * 1000).toISOString() };
}

export function temperatureBand(temperatureC) {
  if (!Number.isFinite(temperatureC)) return 'unknown';
  if (temperatureC <= 0) return 'cold';
  if (temperatureC < 10) return 'cool';
  if (temperatureC >= 28) return 'hot';
  return 'mild';
}

/** Only normalized, coarse bands affect mechanics: tiny forecast revisions cannot flicker the seed. */
export function environmentRules(context) {
  const period = context.timeOfDayEnabled !== false && DAY_PERIODS.includes(context.timeOfDay?.period)
    ? context.timeOfDay.period : 'off';
  const enabled = context.weatherEnabled !== false;
  const weather = context.weather || {};
  const condition = !enabled ? 'disabled' : weather.available && WEATHER_CONDITIONS.includes(weather.condition)
    ? weather.condition : 'unknown';
  const known = WEATHER_CONDITIONS.includes(condition);
  const temperature = known && ['cold', 'cool', 'mild', 'hot'].includes(weather.temperatureBand)
    ? weather.temperatureBand : 'unknown';
  const windy = known && weather.windBand === 'windy';
  const clocks = {
    off: { label: 'Time effects off', favorite: null, tint: null, moves: 0, colors: 4, bonuses: {} },
    morning: { label: 'Morning', favorite: 'yellow', tint: '#554424', moves: 0, colors: 4, bonuses: { yellow: 0.25, green: 0.1 } },
    afternoon: { label: 'Afternoon', favorite: 'orange', tint: '#294a54', moves: 0, colors: 4, bonuses: { orange: 0.2, yellow: 0.1 } },
    evening: { label: 'Evening', favorite: 'red', tint: '#462842', moves: 1, colors: 4, bonuses: { red: 0.2, purple: 0.1 } },
    night: { label: 'Night', favorite: 'purple', tint: '#0e162e', moves: 1, colors: 5, bonuses: { purple: 0.3, blue: 0.15 } },
  };
  const skies = {
    disabled: { label: 'Weather effects off', favorite: null, bonuses: {}, moves: 0 },
    unknown: { label: 'Weather unavailable', favorite: null, bonuses: {}, moves: 0 },
    clear: { label: 'Clear', favorite: 'yellow', bonuses: { yellow: 0.3, orange: 0.1 }, moves: 0, accent: '#ffe082' },
    partly_cloudy: { label: 'Partly cloudy', favorite: 'green', bonuses: { green: 0.2, blue: 0.1 }, moves: 0, accent: '#b8dfdb' },
    cloudy: { label: 'Cloudy', favorite: 'blue', bonuses: { blue: 0.2, purple: 0.1 }, moves: 0, accent: '#a9cce9' },
    rain: { label: 'Rain', favorite: 'blue', bonuses: { blue: 0.4, green: 0.1 }, moves: 1, accent: '#83c9ff' },
    snow: { label: 'Snow', favorite: 'blue', bonuses: { blue: 0.35, purple: 0.2 }, moves: 2, accent: '#dcefff' },
    sleet: { label: 'Sleet', favorite: 'blue', bonuses: { blue: 0.35, green: 0.15 }, moves: 2, accent: '#b1e7f2' },
    storm: { label: 'Storm', favorite: 'purple', bonuses: { purple: 0.35, yellow: 0.25 }, moves: 2, accent: '#dcc0ff' },
    fog: { label: 'Fog', favorite: 'orange', bonuses: { orange: 0.25, yellow: 0.2 }, moves: 1, accent: '#f4dcb0' },
  };
  const clock = clocks[period];
  const sky = skies[condition];
  const bonuses = { ...clock.bonuses };
  for (const [color, amount] of Object.entries(sky.bonuses)) bonuses[color] = (bonuses[color] || 0) + amount;
  if (temperature === 'cold') bonuses.blue = (bonuses.blue || 0) + 0.15;
  if (temperature === 'hot') bonuses.orange = (bonuses.orange || 0) + 0.2;
  if (windy) bonuses.green = (bonuses.green || 0) + 0.2;
  const labels = [clock.label, sky.label];
  if (temperature === 'cold' || temperature === 'hot') labels.push(temperature === 'cold' ? 'Cold' : 'Hot');
  if (windy) labels.push('Windy');
  return {
    key: [period, condition, temperature, windy ? 'windy' : 'calm'].join('-'),
    period, condition, temperatureBand: temperature, windBand: windy ? 'windy' : 'calm',
    priorities: [clock.favorite, sky.favorite].filter(Boolean), gemBonuses: bonuses,
    minimumColors: condition === 'storm' ? 6 : clock.colors,
    moveBonus: clock.moves + sky.moves,
    tint: clock.tint, accent: sky.accent || null, label: labels.join(' · '),
  };
}

export function blendHex(first, second, amount = 0.45) {
  if (!second) return first;
  const left = Number.parseInt(first.slice(1), 16);
  const right = Number.parseInt(second.slice(1), 16);
  let result = 0;
  for (const shift of [16, 8, 0]) {
    const channel = Math.round(((left >> shift) & 255) * (1 - amount) + ((right >> shift) & 255) * amount);
    result |= channel << shift;
  }
  return `#${result.toString(16).padStart(6, '0')}`;
}
