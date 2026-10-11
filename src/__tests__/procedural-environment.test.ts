import { describe, expect, test, jest, afterEach } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { createServer } from 'node:http';
import { timeOfDayContext, environmentRules } from '../services/levels/environment.js';
import { normalizeLocation, localLevelContext } from '../services/levels/location-context.js';
import { generateLevel, matchingCells, legalSwaps, certifyLevel, simulateLevelMove } from '../services/levels/generator.js';
import { liveGeneratedLevel, liveLevelContext } from '../services/levels/level-service.js';
import { createLevelWeatherService, metCondition, wmoCondition, weatherArea } from '../services/levels/weather-context.js';
import levelsRoutes from '../routes/levels.js';
import AccountEconomyService from '../services/economy/AccountEconomyService.js';

const at = Date.parse('2026-10-31T15:59:00Z'); // New York 11:59, just before the afternoon variant.
const location = { timeZone: 'America/New_York', country: 'US', region: 'PA' };
const settings = () => ({ NODE_ENV: 'test', LEVEL_WEATHER_PROVIDER: 'metno' });

function metBody(now = at, symbol = 'rain', temperature = 15, wind = 3) {
  const hour = Math.floor(now / 3600000) * 3600000;
  return { properties: { timeseries: Array.from({ length: 30 }, (_, i) => ({
    time: new Date(hour + i * 3600000).toISOString(),
    data: { instant: { details: { air_temperature: temperature, wind_speed: wind } },
      next_1_hours: { summary: { symbol_code: `${symbol}_day` } } },
  })) } };
}

function reply(body: any, now = at, status = 200) {
  return new Response(status === 304 ? null : JSON.stringify(body), { status,
    headers: { 'content-type': 'application/json', expires: new Date(now + 3600000).toUTCString(), 'last-modified': new Date(now).toUTCString() } });
}

afterEach(() => jest.restoreAllMocks());

describe('player-local clock periods', () => {
  test.each([
    ['2026-10-31T09:59:59Z', 'night'], ['2026-10-31T10:00:00Z', 'morning'],
    ['2026-10-31T15:59:59Z', 'morning'], ['2026-10-31T16:00:00Z', 'afternoon'],
    ['2026-10-31T22:00:00Z', 'evening'], ['2026-11-01T02:00:00Z', 'night'],
  ])('%s belongs to %s in New York, not the server time zone', (instant, period) => {
    expect(timeOfDayContext(Date.parse(instant), location.timeZone).period).toBe(period);
  });

  test.each([
    ['2026-03-08T05:00:00Z', 'America/New_York', '2026-03-08T10:00:00.000Z'],
    ['2026-11-01T04:00:00Z', 'America/New_York', '2026-11-01T11:00:00.000Z'],
    ['2026-10-03T13:30:00Z', 'Australia/Lord_Howe', '2026-10-03T19:00:00.000Z'],
    ['2026-10-31T00:14:00Z', 'Asia/Kathmandu', '2026-10-31T00:15:00.000Z'],
    ['2026-10-31T23:30:00Z', 'UTC', '2026-11-01T00:00:00.000Z'],
  ])('next variant boundary handles DST, non-hour offsets and midnight (%s)', (instant, zone, next) => {
    expect(timeOfDayContext(Date.parse(instant), zone).nextChangeAt).toBe(next);
  });

  test('time effects can be turned off without losing the local date', () => {
    const context = localLevelContext({ ...location, timeOfDayEnabled: false }, at);
    expect(context.timeOfDay).toEqual({ period: 'off', label: 'Time effects off', nextChangeAt: null });
    expect(context.localDate).toBe('2026-10-31');
  });
});

describe('actual forecast adapter, privacy and bounded traffic', () => {
  test('representative areas are explicitly coarse; a manual country never uses the wrong country forecast', () => {
    expect(weatherArea(normalizeLocation(location))).toMatchObject({ source: 'time_zone_estimate', country: 'US' });
    expect(weatherArea(normalizeLocation({ timeZone: 'Asia/Calcutta' }))).toMatchObject({ country: 'IN' });
    expect(weatherArea(normalizeLocation({ timeZone: 'America/New_York', country: 'JP' }))).toMatchObject({ source: 'country_estimate', country: 'JP' });
    expect(weatherArea(normalizeLocation({ timeZone: 'UTC', country: 'AU' }))).toMatchObject({ country: 'AU', label: 'Australia/Sydney representative area' });
    expect(weatherArea(normalizeLocation({ timeZone: 'UTC' }))).toBeNull();
  });

  test('both browser-like and crafted precise coordinates are rounded before storage/querying; zero is valid', async () => {
    const calls: string[] = [];
    const weather = createLevelWeatherService({ env: settings, fetchFn: async (url: string) => { calls.push(url); return reply(metBody()); } });
    const context = await liveLevelContext({ ...location, weatherLatitude: '41.978532', weatherLongitude: '-76.517862' }, at, weather);
    expect(context).toMatchObject({ weatherLatitude: 42, weatherLongitude: -77 });
    expect(context.weather.area).toMatchObject({ latitude: 42, longitude: -77, source: 'player_grid' });
    expect(new URL(calls[0]!).searchParams.get('lat')).toBe('42');
    expect(new URL(calls[0]!).searchParams.get('lon')).toBe('-77');
    expect(JSON.stringify(context)).not.toMatch(/41\.978532|76\.517862/);
    expect(normalizeLocation({ ...location, weatherLatitude: 0, weatherLongitude: 0 })).toMatchObject({ weatherLatitude: 0, weatherLongitude: 0 });
  });

  test.each([
    { weatherLatitude: 91, weatherLongitude: 0 }, { weatherLatitude: 0, weatherLongitude: 181 },
    { weatherLatitude: 40 }, { weatherLatitude: 'nope', weatherLongitude: 4 },
    { weatherLatitude: [40], weatherLongitude: 4 }, { weatherEnabled: 'yes' }, { timeOfDayEnabled: 'yes' },
  ])('invalid environment preferences fail before a feed call (%j)', async (preferences) => {
    let calls = 0;
    const weather = createLevelWeatherService({ env: settings, fetchFn: async () => { calls++; return reply(metBody()); } });
    await expect(liveLevelContext({ ...location, ...preferences }, at, weather)).rejects.toThrow();
    expect(calls).toBe(0);
  });

  test('only the server-selected forecast is used, with identification, attribution and normalized bands', async () => {
    let sent: any;
    const weather = createLevelWeatherService({ env: settings, fetchFn: async (url: string, options: any) => {
      sent = { url, ...options }; return reply(metBody(at, 'heavyrainshowersandthunder', -2, 12));
    } });
    const context = await liveLevelContext({ ...location, weather: { condition: 'clear', temperatureC: 25 }, weatherUrl: 'http://private.invalid/' }, at, weather);
    expect(sent.url).toMatch(/^https:\/\/api\.met\.no\/weatherapi\/locationforecast\/2\.0\/compact\?/);
    expect(sent.headers['User-Agent']).toContain('InfiniteMatch');
    expect(sent.redirect).toBe('error');
    expect(context.weather).toMatchObject({ available: true, source: 'metno', condition: 'storm', temperatureBand: 'cold', windBand: 'windy' });
    expect(context.weather.attribution).toMatchObject({ name: 'MET Norway', license: 'CC-BY-4.0' });
    expect(context.environmentRefreshAt).toBe('2026-10-31T16:00:00.000Z');
  });

  test('coalesces requests and reuses forecasts until provider Expires, then conditionally revalidates', async () => {
    let calls = 0;
    let headers: any;
    const weather = createLevelWeatherService({ env: settings, fetchFn: async (_url: string, options: any) => {
      calls++; headers = options.headers; return reply(metBody(), calls === 1 ? at : at + 3600001, calls === 1 ? 200 : 304);
    } });
    const normalized = normalizeLocation(location);
    const results = await Promise.all(Array.from({ length: 10 }, () => weather.snapshot(normalized, at)));
    expect(results.every((result) => result.available)).toBe(true);
    expect(calls).toBe(1);
    await weather.snapshot(normalized, at + 600000);
    expect(calls).toBe(1);
    expect((await weather.snapshot(normalized, at + 3600001)).available).toBe(true);
    expect(calls).toBe(2);
    expect(headers['If-Modified-Since']).toBe(new Date(at).toUTCString());
  });

  test('a full cache never evicts unexpired forecasts just to repeat remote requests', async () => {
    let calls = 0;
    const weather = createLevelWeatherService({ env: settings, maxCache: 1, fetchFn: async () => { calls++; return reply(metBody()); } });
    const first = normalizeLocation({ ...location, weatherLatitude: 40, weatherLongitude: -74 });
    expect((await weather.snapshot(first, at)).available).toBe(true);
    expect((await weather.snapshot(normalizeLocation({ ...location, weatherLatitude: 50, weatherLongitude: 10 }), at)).reason).toBe('capacity');
    expect((await weather.snapshot(first, at + 1000)).available).toBe(true);
    expect(calls).toBe(1);
  });

  test.each(['network', 'malformed', 'unknown_code', 'stale', 'http_error'])('degrades safely without fabricating weather (%s)', async (failure) => {
    let calls = 0;
    const weather = createLevelWeatherService({ env: settings, fetchFn: async () => {
      calls++;
      if (failure === 'network') throw new Error('offline');
      if (failure === 'http_error') return new Response('', { status: 503 });
      return reply(failure === 'malformed' ? {} : metBody(failure === 'stale' ? at - 40 * 3600000 : at, failure === 'unknown_code' ? 'future_space_rainbows' : 'rain'));
    } });
    const definition = await liveGeneratedLevel({ mode: 'daily', location }, at, weather);
    expect(definition.context.weather).toMatchObject({ available: false, source: 'unavailable', condition: 'unknown' });
    expect(definition.context.timeOfDay.period).toBe('morning');
    expect(legalSwaps(definition.board).length).toBeGreaterThan(0);
    expect(definition.quality.verifiedScore).toBeGreaterThanOrEqual(definition.targetScore);
    await weather.snapshot(normalizeLocation(location), at + 1000);
    expect(calls).toBe(1); // Failed requests back off too.
  });

  test('per-process throttling and inflight limits keep level starts responsive during a burst', async () => {
    // eslint-disable-next-line no-unused-vars -- A type-level callback argument, not an unused runtime variable.
    let release!: (value: Response) => void;
    let calls = 0;
    const weather = createLevelWeatherService({ env: settings, maxInFlight: 1, fetchFn: async () => {
      calls++; return new Promise<Response>((resolve) => { release = resolve; });
    } });
    const first = weather.snapshot(normalizeLocation(location), at);
    const busy = await weather.snapshot(normalizeLocation({ ...location, weatherLatitude: 0, weatherLongitude: 0 }), at);
    expect(busy.reason).toBe('busy'); expect(calls).toBe(1);
    release(reply(metBody())); await first;
    const throttled = createLevelWeatherService({ env: () => ({ ...settings(), LEVEL_WEATHER_REQUESTS_PER_SECOND: '1' }),
      fetchFn: async () => reply(metBody()) });
    jest.spyOn(Date, 'now').mockReturnValue(at);
    await throttled.snapshot(normalizeLocation(location), at);
    expect((await throttled.snapshot(normalizeLocation({ ...location, weatherLatitude: 0, weatherLongitude: 0 }), at)).reason).toBe('busy');
  });

  test('a hanging real feed times out instead of preventing passive level generation', async () => {
    const server = createServer(() => {});
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    try {
      const port = (server.address() as any).port;
      const weather = createLevelWeatherService({ timeoutMs: 80, env: () => ({ LEVEL_WEATHER_PROVIDER: 'open-meteo', LEVEL_WEATHER_OPEN_METEO_URL: `http://127.0.0.1:${port}/forecast` }) });
      const started = Date.now();
      const definition = await liveGeneratedLevel({ mode: 'daily', location }, at, weather);
      expect(Date.now() - started).toBeLessThan(2000);
      expect(definition.context.weather.available).toBe(false);
      expect(definition.quality.verifiedScore).toBeGreaterThanOrEqual(definition.targetScore);
    } finally { server.closeAllConnections(); await new Promise<void>((resolve) => server.close(() => resolve())); }
  });

  test('disabled weather makes no provider request', async () => {
    let calls = 0;
    const weather = createLevelWeatherService({ env: settings, fetchFn: async () => { calls++; return reply(metBody()); } });
    const context = await liveLevelContext({ ...location, weatherEnabled: false }, at, weather);
    expect(context.weather.source).toBe('disabled'); expect(calls).toBe(0);
    expect(environmentRules(context).condition).toBe('disabled');
  });

  test('the optional self-hosted Open-Meteo adapter works with actual HTTP transport', async () => {
    const server = createServer((req, res) => {
      const url = new URL(req.url!, 'http://test');
      expect(url.searchParams.get('latitude')).toBe('0');
      expect(url.searchParams.get('timeformat')).toBe('unixtime');
      expect(url.searchParams.get('wind_speed_unit')).toBe('ms');
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ current: { time: Math.floor(at / 1000), interval: 900, temperature_2m: 31, weather_code: 95, wind_speed_10m: 10 } }));
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    try {
      const port = (server.address() as any).port;
      const weather = createLevelWeatherService({ env: () => ({ LEVEL_WEATHER_PROVIDER: 'open-meteo', LEVEL_WEATHER_OPEN_METEO_URL: `http://127.0.0.1:${port}/v1/forecast` }) });
      const context = await liveLevelContext({ ...location, weatherLatitude: 0, weatherLongitude: 0 }, at, weather);
      expect(context.weather).toMatchObject({ available: true, source: 'open-meteo', condition: 'storm', temperatureBand: 'hot', windBand: 'windy' });
    } finally { await new Promise<void>((resolve) => server.close(() => resolve())); }
  });

  test.each([['clearsky_night', 'clear'], ['lightsleet_day', 'sleet'], ['heavysnowshowersandthunder_polartwilight', 'storm'], ['rainbow', 'unknown']])('MET symbol %s maps to %s', (code, condition) => {
    expect(metCondition(code)).toBe(condition);
  });
  test.each([[0, 'clear'], [48, 'fog'], [67, 'sleet'], [85, 'snow'], [96, 'storm'], [999, 'unknown']])('WMO code %s maps to %s', (code, condition) => {
    expect(wmoCondition(Number(code))).toBe(condition);
  });
});

describe('time/weather genuinely affect certified daily variants and endless boards', () => {
  test('time and weather change IDs, gem mixes, boards and rule budgets, not only labels', () => {
    const context = localLevelContext(location, at);
    const clear = { available: true, condition: 'clear', temperatureBand: 'mild', windBand: 'calm', area: { key: '42,-77' } };
    const morning = generateLevel(1, { ...context, weather: clear }, 'daily');
    const night = generateLevel(1, { ...context, timeOfDay: { period: 'night' }, weather: clear }, 'daily');
    const storm = generateLevel(1, { ...context, weather: { ...clear, condition: 'storm' } }, 'daily');
    expect(new Set([morning.id, night.id, storm.id]).size).toBe(3);
    expect(morning.board).not.toEqual(night.board);
    expect(morning.gemWeights).not.toEqual(night.gemWeights);
    expect(storm.gemTypes.length).toBe(6);
    expect(morning.theme.name).toBe('Halloween'); // Time/weather layer with, not replace, holiday identity.
    expect(storm.theme.environmentLabel).toContain('Storm');
  });

  test('all period/weather combinations still have replayable winning paths without boosters', () => {
    const context = localLevelContext(location, at);
    for (const period of ['morning', 'afternoon', 'evening', 'night']) {
      for (const condition of ['clear', 'partly_cloudy', 'cloudy', 'rain', 'snow', 'sleet', 'storm', 'fog']) {
        for (const level of [1, 10, 100001]) {
          const definition = generateLevel(level, { ...context, timeOfDay: { period }, weather: {
            available: true, condition, temperatureBand: condition === 'snow' ? 'cold' : 'hot', windBand: 'windy',
          } });
          expect(matchingCells(definition.board).size).toBe(0);
          expect(legalSwaps(definition.board).length).toBeGreaterThan(0);
          const proof = certifyLevel(definition);
          let state: any = { board: definition.board, specials: definition.specials, shields: definition.shields, refillState: definition.refillState, score: 0 };
          let total = 0;
          for (const cells of proof.witness) {
            state = simulateLevelMove(definition, state, cells)!;
            total += state.score;
          }
          expect(total).toBeGreaterThanOrEqual(definition.targetScore);
          expect(definition.moves).toBeGreaterThanOrEqual(20); expect(definition.moves).toBeLessThanOrEqual(30);
        }
      }
    }
  }, 20000);

  test('time/weather opt-outs restore a day-stable calendar puzzle and ignore weather area', () => {
    const preferences = { ...location, timeOfDayEnabled: false, weatherEnabled: false };
    const first = generateLevel(1, localLevelContext(preferences, at), 'daily');
    const second = generateLevel(1, { ...localLevelContext(preferences, at + 3 * 3600000),
      weatherLatitude: 0, weatherLongitude: 0, weather: { available: true, condition: 'storm', temperatureBand: 'hot' } }, 'daily');
    expect(second.id).toBe(first.id); expect(second.board).toEqual(first.board);
    expect(second.environmentKey).toBe('off-disabled-unknown-calm');
  });

  test('minor forecast changes in the same bands keep the same puzzle identity', () => {
    const base = { ...localLevelContext(location, at), weather: { available: true, condition: 'rain', temperatureBand: 'mild', windBand: 'calm', area: { key: '42,-77' }, temperatureC: 16 } };
    const first = generateLevel(1, base, 'daily');
    const second = generateLevel(1, { ...base, evaluatedAt: new Date(at + 1000).toISOString(), weather: { ...base.weather, temperatureC: 17 } }, 'daily');
    expect(second.id).toBe(first.id); expect(second.board).toEqual(first.board); expect(second.gemWeights).toEqual(first.gemWeights);
  });

  test('a paid daily target stays pinned when a new afternoon/storm variant appears', async () => {
    const body = metBody(at, 'clearsky');
    body.properties.timeseries[1]!.data.next_1_hours.summary.symbol_code = 'heavyrainandthunder_day';
    const weather = createLevelWeatherService({ env: settings, fetchFn: async () => reply(body) });
    const old = await liveGeneratedLevel({ mode: 'daily', location }, at, weather);
    const later = at + 120000;
    const next = await liveGeneratedLevel({ mode: 'daily', location }, later, weather);
    expect(next.context.timeOfDay.period).toBe('afternoon'); expect(next.context.weather.condition).toBe('storm');
    expect(next.id).not.toBe(old.id);
    const service = new AccountEconomyService();
    const player = `environment_${Date.now()}`;
    await service.initializePlayerEconomy(player, 'test');
    const attempt = await service.spendAttemptEnergy(player, 1, at, old);
    const target = old.targetScore;
    old.targetScore = 1;
    const win = await service.consumeAttempt(player, attempt.attemptId, 1, later, { mode: 'level', score: target, legacyTarget: 1000000, objectiveProgress: { collected: old.quality.verifiedCollected, shieldsCleared: old.quality.verifiedShields } });
    expect(win.stars).toBe(1);
  });

  test('public daily variants use server-local clock, not client-authored hours/weather', async () => {
    const app = express(); app.use('/api/levels', levelsRoutes);
    const clock = jest.spyOn(Date, 'now').mockReturnValue(at);
    const first = await request(app).get('/api/levels/daily').query({ ...location, weatherEnabled: false, timeOfDay: 'night', localDate: '2099-01-01' });
    expect(first.body.level.context.timeOfDay.period).toBe('morning');
    expect(first.body.level.context.localDate).toBe('2026-10-31');
    clock.mockReturnValue(at + 120000);
    const next = await request(app).get('/api/levels/daily').query({ ...location, weatherEnabled: false });
    expect(next.body.level.id).not.toBe(first.body.level.id);
    expect(next.headers['cache-control']).toBe('private, no-store');
  });
});
