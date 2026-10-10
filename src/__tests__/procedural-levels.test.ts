import { describe, expect, test } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { generateLevel, matchingCells, legalSwaps, certifyLevel, simulateLevelMove, levelActions } from '../services/levels/generator.js';
import { localLevelContext, normalizeLocation, nextLocalMidnight, locationCatalog } from '../services/levels/location-context.js';
import { generatedLevel } from '../services/levels/level-service.js';
import levelsRoutes from '../routes/levels.js';

const instant = (s: string) => Date.parse(s);
const north = { timeZone: 'America/New_York', country: 'US', region: 'PA' };
const halloween = localLevelContext(north, instant('2026-10-31T12:00:00Z'));

function assertValid(definition: any) {
  expect(definition.targetScore).toBeGreaterThanOrEqual(100);
  expect(definition.targetScore).toBeLessThanOrEqual(2400);
  expect(definition.boardSize).toBeGreaterThanOrEqual(6);
  expect(definition.boardSize).toBeLessThanOrEqual(8);
  expect(definition.gemTypes.length).toBeGreaterThanOrEqual(4);
  expect(definition.gemTypes.length).toBeLessThanOrEqual(6);
  expect(matchingCells(definition.board).size).toBe(0);
  expect(legalSwaps(definition.board).length).toBeGreaterThan(0);
  expect(definition.quality.verifiedScore).toBeGreaterThanOrEqual(definition.targetScore);
  for (const row of definition.board) for (const gem of row) expect(definition.gemTypes).toContain(gem);
}

describe('passive procedural generation', () => {
  test('same version, number, date and region give exactly the same definition', () => {
    expect(generateLevel(50, halloween)).toEqual(generateLevel(50, halloween));
  });

  test('every day has a new daily ID and seed, not a reused numbered level', () => {
    const ids = new Set();
    const seeds = new Set();
    for (let day = 0; day < 370; day++) {
      const context = localLevelContext({ timeZone: 'UTC' }, instant('2026-01-01T12:00:00Z') + day * 86400000);
      const definition = generateLevel(1, context, 'daily');
      ids.add(definition.id);
      seeds.add(definition.seed);
      assertValid(definition);
    }
    expect(ids.size).toBe(370);
    expect(seeds.size).toBe(370);
  }, 20000);

  test('daily is independent of campaign progress but changes with region', () => {
    expect(generateLevel(1, halloween, 'daily')).toEqual(generateLevel(5000, halloween, 'daily'));
    const australia = localLevelContext({ timeZone: 'Australia/Sydney', country: 'AU', region: 'NSW' }, instant('2026-10-31T12:00:00Z'));
    expect(generateLevel(1, australia, 'daily').seed).not.toBe(generateLevel(1, halloween, 'daily').seed);
  });

  test.each([1, 10, 9999, 10001, 100001, 10000000, Number.MAX_SAFE_INTEGER])('level %s needs no authored file and stays feasible', (number) => {
    const definition = generateLevel(number, halloween);
    assertValid(definition);
    expect(definition.level).toBe(number);
    expect(definition.moves).toBeGreaterThanOrEqual(20);
    expect(definition.moves).toBeLessThanOrEqual(30);
  });

  test('a witness wins without buying or using any booster', () => {
    for (let number = 1; number <= 40; number++) {
      const definition = generateLevel(number, halloween);
      const proof = certifyLevel(definition);
      let state: any = { board: definition.board, specials: definition.specials, refillState: definition.refillState };
      let score = 0;
      for (const cells of proof.witness) {
        const move = simulateLevelMove(definition, state, cells)!;
        state = move;
        score += move.score;
        expect(matchingCells(state.board).size).toBe(0);
        expect(levelActions(definition, state.board, state.specials).length).toBeGreaterThan(0);
      }
      expect(score).toBe(definition.quality.verifiedScore);
      expect(score).toBeGreaterThanOrEqual(definition.targetScore);
      expect(proof.witness.length).toBeLessThanOrEqual(definition.moves);
    }
  });

  test('the starting board, palettes, size and difficulty vary across the stream', () => {
    const definitions = Array.from({ length: 30 }, (_, i) => generateLevel(i + 1, halloween));
    expect(new Set(definitions.map((d) => JSON.stringify(d.board))).size).toBe(30);
    expect(new Set(definitions.map((d) => d.boardSize)).size).toBe(3);
    expect(new Set(definitions.map((d) => JSON.stringify(d.gemTypes))).size).toBeGreaterThan(10);
    expect(new Set(definitions.map((d) => d.difficulty)).size).toBe(4);
  });

  test('modes use the same certified core with appropriate clocks and move budgets', () => {
    expect(generateLevel(3, halloween, 'classic').timeLimit).toBe(0);
    expect(generateLevel(3, halloween, 'daily').timeLimit).toBe(0);
    expect(generateLevel(3, halloween, 'timed')).toMatchObject({ timeLimit: 60, moves: 999 });
    const endless = generateLevel(3, halloween, 'endless');
    expect(endless.timeLimit).toBe(0);
    expect(endless.moves).toBe(Number.MAX_SAFE_INTEGER);
    expect(endless.targetScore).toBeLessThan(2500); // Finite goal advances to a new stage.
  });

  test('browser bundle and server algorithm cannot drift', () => {
    const sandbox: any = {};
    vm.createContext(sandbox);
    vm.runInContext(readFileSync('public/js/procedural-levels.js', 'utf8'), sandbox);
    for (const number of [1, 10, 100001]) {
      expect(JSON.parse(JSON.stringify(sandbox.InfiniteLevels.generateLevel(number, halloween))))
        .toEqual(generateLevel(number, halloween));
    }
  });

  test('cached definitions are isolated from caller mutations', () => {
    const options = { level: 42, location: north };
    const first = generatedLevel(options, instant('2026-10-31T12:00:00Z'));
    first.board[0]![0] = 'forged';
    first.targetScore = 1;
    expect(generatedLevel(options, instant('2026-10-31T13:00:00Z')).targetScore).not.toBe(1);
    expect(generatedLevel(options, instant('2026-10-31T13:00:00Z')).board[0]![0]).not.toBe('forged');
  });

  test.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, NaN, Infinity])('rejects invalid level %s', (level) => {
    expect(() => generateLevel(level, halloween)).toThrow('invalid_level');
  });
});

describe('local calendar, hemisphere and recurring holidays', () => {
  test('players east and west of UTC get their own local civil day', () => {
    const now = instant('2026-01-01T01:00:00Z');
    expect(localLevelContext(north, now).localDate).toBe('2025-12-31');
    expect(localLevelContext({ timeZone: 'Asia/Tokyo' }, now)).toMatchObject({ localDate: '2026-01-01', country: 'JP' });
  });

  test('northern and southern seasons are opposite, not globally hardcoded', () => {
    const now = instant('2026-01-15T12:00:00Z');
    expect(localLevelContext(north, now).season).toBe('winter');
    expect(localLevelContext({ timeZone: 'Australia/Sydney' }, now)).toMatchObject({ country: 'AU', season: 'summer', hemisphere: 'south' });
  });

  test('month and season boundaries change the generated level', () => {
    const before = generatedLevel({ level: 50, location: north }, instant('2026-03-01T04:59:59Z'));
    const after = generatedLevel({ level: 50, location: north }, instant('2026-03-01T05:00:00Z'));
    expect(before.context).toMatchObject({ month: 2, season: 'winter' });
    expect(after.context).toMatchObject({ month: 3, season: 'spring' });
    expect(after.theme.id).not.toBe(before.theme.id);
    expect(after.board).not.toEqual(before.board);
  });

  test.each([
    ['2026-03-08T05:00:00Z', '2026-03-09T04:00:00.000Z'],
    ['2026-11-01T04:00:00Z', '2026-11-02T05:00:00.000Z'],
  ])('next local midnight handles DST on %s', (now, expected) => {
    expect(nextLocalMidnight(instant(now), 'America/New_York')).toBe(expected);
  });

  test('half-hour and quarter-hour time zones get correct midnight', () => {
    expect(nextLocalMidnight(instant('2026-10-09T12:00:00Z'), 'Asia/Kathmandu')).toBe('2026-10-09T18:15:00.000Z');
    expect(nextLocalMidnight(instant('2026-10-09T12:00:00Z'), 'Asia/Kolkata')).toBe('2026-10-09T18:30:00.000Z');
  });

  test('Halloween themes apply all local day, not just the evening', () => {
    const morning = generatedLevel({ mode: 'daily', location: north }, instant('2026-10-31T12:00:00Z'));
    const evening = generatedLevel({ mode: 'daily', location: north }, instant('2026-11-01T02:00:00Z'));
    expect(morning.theme.name).toBe('Halloween');
    expect(evening.context.localDate).toBe(morning.context.localDate);
    expect(evening.id).not.toBe(morning.id); // The chosen time/weather variants are now distinct.
    expect(morning.environmentKey).toContain('morning');
    expect(evening.environmentKey).toContain('night');
  });

  test.each([
    ['2026-11-26T17:00:00Z', true], ['2027-11-25T17:00:00Z', true], ['2027-11-26T17:00:00Z', false],
  ])('Thanksgiving is calculated anew each year (%s)', (now, expected) => {
    const names = localLevelContext(north, instant(now)).holidays.map((h: any) => h.name);
    expect(names.some((name: string) => name === 'Thanksgiving Day')).toBe(expected);
  });

  test('national holidays follow the selected region, not the server country', () => {
    const now = instant('2026-07-04T16:00:00Z');
    expect(localLevelContext(north, now).holidays.some((h: any) => /Independence/.test(h.name))).toBe(true);
    expect(localLevelContext({ timeZone: 'Europe/London', country: 'GB' }, now).holidays.some((h: any) => /Independence/.test(h.name))).toBe(false);
  });

  test('holiday opt-out preserves a seasonal board without holiday names', () => {
    const definition = generatedLevel({ mode: 'daily', location: { ...north, holidayThemes: false } }, instant('2026-10-31T12:00:00Z'));
    expect(definition.theme.holidayNames).toEqual([]);
    expect(definition.theme.name).toContain('October');
    expect(definition.context.season).toBe('autumn');
  });

  test('leap day has its own challenge and then rolls into the next month', () => {
    const definitions = ['2028-02-28', '2028-02-29', '2028-03-01'].map((date) =>
      generatedLevel({ mode: 'daily', location: { ...north, holidayThemes: false } }, instant(`${date}T17:00:00Z`)));
    expect(new Set(definitions.map((definition) => definition.id)).size).toBe(3);
    expect(definitions.map((definition) => definition.context.day)).toEqual([28, 29, 1]);
    expect(definitions.map((definition) => definition.context.month)).toEqual([2, 2, 3]);
    definitions.forEach(assertValid);
  });

  test('different months within one season change the favorite gem', () => {
    const definitions = ['2026-01-15', '2026-02-15'].map((date) =>
      generatedLevel({ mode: 'daily', location: { ...north, holidayThemes: false } }, instant(`${date}T17:00:00Z`)));
    expect(definitions[0].context.season).toBe('winter');
    expect(definitions[1].context.season).toBe('winter');
    expect(definitions[0].theme.favorite).not.toBe(definitions[1].theme.favorite);
    expect(definitions[0].board).not.toEqual(definitions[1].board);
  });

  test.each(['2026-04-05', '2027-03-28'])('moving Easter uses neutral naming in the southern hemisphere (%s)', (date) => {
    const definition = generatedLevel({ mode: 'daily', location: { timeZone: 'Australia/Sydney', country: 'AU', region: 'NSW' } }, instant(`${date}T01:00:00Z`));
    expect(definition.theme.name).toBe('Easter Celebration');
    expect(definition.context.season).toBe('autumn');
    assertValid(definition);
  });

  test('manual region and hemisphere corrections are respected', () => {
    expect(normalizeLocation({ timeZone: 'America/New_York', country: 'AU', region: 'NSW' })).toMatchObject({ country: 'AU', hemisphere: 'south', locationSource: 'player_setting' });
    expect(normalizeLocation({ timeZone: 'Australia/Sydney', hemisphere: 'north' }).hemisphere).toBe('north');
    expect(locationCatalog('US').regions.some((r: any) => r.code === 'PA')).toBe(true);
    expect(locationCatalog().countries.length).toBeGreaterThan(200);
  });
});

describe('public procedural level API', () => {
  const app = express();
  app.use('/api/levels', levelsRoutes);

  test('a guest gets a complete, playable daily board and refresh metadata', async () => {
    const res = await request(app).get('/api/levels/daily').query(north);
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('private, no-store');
    expect(res.body.level.mode).toBe('daily');
    expect(res.body.level.context.refreshAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    assertValid(res.body.level);
  });

  test('untagged previews retain v2 while explicit v3 previews include earned-special state', async () => {
    const legacy = await request(app).get('/api/levels/daily').query(north);
    const explicitOld = await request(app).get('/api/levels/daily').query({ ...north, rulesVersion: 2 });
    const modern = await request(app).get('/api/levels/daily').query({ ...north, rulesVersion: 3 });
    expect(legacy.body.level.generatorVersion).toBe(2);
    expect(explicitOld.body.level.id).toBe(legacy.body.level.id);
    expect(legacy.body.level.specials).toBeUndefined();
    expect(modern.status).toBe(200);
    expect(modern.body.level.generatorVersion).toBe(3);
    expect(modern.body.level.specials.flat().every((type: any) => type === null)).toBe(true);
    expect(modern.body.level.id).not.toBe(legacy.body.level.id);
    assertValid(modern.body.level);
  });

  test.each(['1', '5', 'invalid', '', ['2', '3']])('unsupported preview rules %j are refused', async (rulesVersion) => {
    const res = await request(app).get('/api/levels/1').query({ ...north, rulesVersion });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('unsupported_rules_version');
  });

  test('levels beyond the old 10,000 limit are accessible', async () => {
    const res = await request(app).get('/api/levels/100001').query(north);
    expect(res.status).toBe(200);
    expect(res.body.level.level).toBe(100001);
    assertValid(res.body.level);
  });

  test.each([
    ['/api/levels/0', {}], ['/api/levels/1.5', {}], ['/api/levels/9007199254740992', {}],
    ['/api/levels/1', { mode: 'invented' }], ['/api/levels/daily', { timeZone: 'Not/AZone' }],
    ['/api/levels/daily', { country: 'XX' }], ['/api/levels/daily', { country: 'US', region: 'FAKE' }],
    ['/api/levels/daily', { hemisphere: 'east' }], ['/api/levels/daily', { timeZone: ['UTC', 'Asia/Tokyo'] }],
  ])('invalid input is a 400, not a server error (%s %j)', async (path, query) => {
    const res = await request(app).get(path).query(query);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('client date overrides are ignored; the server chooses the current local day', async () => {
    const res = await request(app).get('/api/levels/daily').query({ timeZone: 'UTC', date: '2040-01-01' });
    expect(res.body.level.context.localDate).toBe(new Date().toISOString().slice(0, 10));
  });
});
