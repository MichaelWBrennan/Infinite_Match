import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import request from 'supertest';
import vm from 'node:vm';
import { parseHTML } from 'linkedom';
import authRoutes from '../routes/auth.js';
import economyRoutes from '../routes/account-economy.js';
import liveOpsRoutes from '../routes/live-ops.js';
import { accountEconomy } from '../services/economy/AccountEconomyService.js';
import { loadLiveOps, validateLiveOps } from '../services/live-ops/live-ops.js';
import { activeWeeklyEvent, claimWeeklyMilestone, recordWeeklyWin, validateWeeklyCalendar, validateWeeklyEvents, validateWeeklyRotation, visibleWeeklyEvent, weeklyView } from '../services/live-ops/weekly-event.js';
import { certifyLevel, simulateLevelMove } from '../services/levels/generator.js';
import { initialObjectiveProgress, objectiveStatus } from '../services/levels/objective-rules.js';

const DAY = 86400000;
function currentMonday(now: number) {
  const d = new Date(now);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
}
const schedule = (start: number) => ({ id: 'lanterns_week1', name: 'Hall Lanterns', description: 'A free weekly challenge.',
  start: new Date(start).toISOString(), end: new Date(start + 7 * DAY).toISOString(),
  milestones: [{ wins: 1, coins: 10 }, { wins: 2, coins: 20 }] });

describe('weekly calendar validation and pure rules', () => {
  const monday = Date.parse('2026-10-05T00:00:00Z');
  test('real calendar contains non-overlapping UTC weeks and modest free rewards', () => {
    const config = JSON.parse(fs.readFileSync('config/liveops.json', 'utf8'));
    const result = validateLiveOps(config);
    expect(result.errors).toEqual([]);
    expect(result.config?.weeklyEvents).toHaveLength(10);
    expect(activeWeeklyEvent(result.config, Date.parse('2026-10-10T12:00:00Z'))?.id).toBe('hall_lanterns_20261005');
    expect(activeWeeklyEvent(result.config, Date.parse('2026-10-12T00:00:00Z'))?.id).toBe('hall_lanterns_20261012');
    expect(activeWeeklyEvent(result.config, Date.parse('2026-10-26T00:00:00Z'))?.id).toBe('hall_lanterns_20261026');
    expect(activeWeeklyEvent(result.config, Date.parse('2026-11-02T00:00:00Z'))?.id).toBe('hall_lanterns_20261102');
    expect(activeWeeklyEvent(result.config, Date.parse('2026-11-09T00:00:00Z'))?.id).toBe('hall_lanterns_20261109');
    expect(activeWeeklyEvent(result.config, Date.parse('2026-11-16T00:00:00Z'))?.id).toBe('hall_lanterns_20261116');
    expect(activeWeeklyEvent(result.config, Date.parse('2026-12-14T00:00:00Z'))).toBeNull();
  });

  test('published weeks roll over continuously with frozen original rewards and no late new grant', () => {
    const raw = JSON.parse(fs.readFileSync('config/liveops.json', 'utf8'));
    const config = validateLiveOps(raw).config!;
    const starts = ['2026-10-05', '2026-10-12', '2026-10-19', '2026-10-26', '2026-11-02', '2026-11-09', '2026-11-16', '2026-11-23', '2026-11-30', '2026-12-07'];
    for (let i = 0; i < starts.length; i++) {
      const start = Date.parse(`${starts[i]}T00:00:00Z`);
      const id = `hall_lanterns_${starts[i].replace(/-/g, '')}`;
      expect(config.weeklyEvents[i]).toMatchObject({ id, startMs: start, endMs: start + 7 * DAY,
        milestones: [{ wins: 1, coins: 15 }, { wins: 3, coins: 25 }, { wins: 5, coins: 40 }] });
      expect(activeWeeklyEvent(config, start)?.id).toBe(id);
      expect(activeWeeklyEvent(config, start + 7 * DAY - 1)?.id).toBe(id);
      if (i > 0) expect(activeWeeklyEvent(config, start - 1)?.id).toBe(config.weeklyEvents[i - 1].id);
    }
    const oct26 = Date.parse('2026-10-26T00:00:00Z');
    const afterSchedule = Date.parse('2026-12-14T00:00:00Z');
    expect(visibleWeeklyEvent(config, oct26 - 1)?.id).toBe('hall_lanterns_20261019');
    expect(visibleWeeklyEvent(config, oct26)?.id).toBe('hall_lanterns_20261026');
    expect(visibleWeeklyEvent(config, afterSchedule)).toBeNull();
    const wallet: any = { currencies: { coins: { amount: 100, maxAmount: 999999, earned: 0 } } };
    expect(recordWeeklyWin(wallet, config, oct26 - 1)).toEqual({ eventId: 'hall_lanterns_20261019', wins: 1 });
    expect(claimWeeklyMilestone(wallet, config, 'hall_lanterns_20261019', 1, oct26 - 1).duplicate).toBe(false);
    expect(recordWeeklyWin(wallet, config, oct26)).toEqual({ eventId: 'hall_lanterns_20261026', wins: 1 });
    expect(wallet.weeklyEvents.hall_lanterns_20261019.wins).toBe(1);
    expect(wallet.weeklyEvents.hall_lanterns_20261026.wins).toBe(1);
    expect(claimWeeklyMilestone(wallet, config, 'hall_lanterns_20261019', 1, oct26).duplicate).toBe(true);
    expect(() => claimWeeklyMilestone(wallet, config, 'hall_lanterns_20261019', 3, oct26)).toThrow('weekly_event_closed');
    expect(claimWeeklyMilestone(wallet, config, 'hall_lanterns_20261026', 1, oct26)).toMatchObject({ duplicate: false, coins: 15 });
  });

  test('operator preview covers December, checks the publishing horizon, and protects prior definitions', () => {
    const run = (time: string, configFile = path.resolve('config/liveops.json'), previousFile = '', horizon = '0') => spawnSync(process.execPath, ['scripts/preview-weekly-event.mjs', time],
      { cwd: process.cwd(), encoding: 'utf8', env: { ...process.env, LIVE_OPS_CONFIG: configFile,
        WEEKLY_EVENT_PREVIOUS_CONFIG: previousFile, WEEKLY_EVENT_DISABLED: '', WEEKLY_EVENT_MIN_FUTURE_DAYS: horizon } });
    const rollover = run('2026-10-26T00:00:00Z');
    expect(rollover.status).toBe(0);
    expect(rollover.stdout).toContain('"id": "hall_lanterns_20261026"');
    const finalWeek = run('2026-11-09T00:00:00Z');
    expect(finalWeek.status).toBe(0);
    expect(finalWeek.stdout).toContain('"id": "hall_lanterns_20261109"');
    const next = run('2026-11-16T00:00:00Z');
    expect(next.status).toBe(0);
    expect(next.stdout).toContain('"id": "hall_lanterns_20261116"');
    expect(run('2026-11-30T00:00:00Z', path.resolve('config/liveops.json'), '', '14').status).toBe(0);
    const warning = run('2026-12-01T00:00:00Z', path.resolve('config/liveops.json'), '', '14');
    expect(warning.status).toBe(1);
    expect(warning.stderr).toContain('less than 14 full days remaining');
    const invalidHorizon = run('2026-11-16T00:00:00Z', path.resolve('config/liveops.json'), '', '85');
    expect(invalidHorizon.status).toBe(1);
    const deadline = run('2026-12-14T00:00:00Z');
    expect(deadline.status).toBe(1);
    expect(deadline.stderr).toContain('Publish future dates before the schedule runs out.');
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'weekly-preview-'));
    try {
      const file = path.join(tempDir, 'liveops.json');
      const raw = JSON.parse(fs.readFileSync('config/liveops.json', 'utf8'));
      raw.weeklyEventArchive = [{ ...schedule(currentMonday(Date.now()) + 7 * DAY), id: 'future_archive' }]; // cannot hide a future week as history
      fs.writeFileSync(file, JSON.stringify(raw));
      const invalid = run('2026-10-26T00:00:00Z', file);
      expect(invalid.status).toBe(1);
      expect(invalid.stderr).toContain('cannot archive a week before its UTC end');
      const deployedFile = path.join(tempDir, 'deployed.json');
      fs.writeFileSync(deployedFile, JSON.stringify({ weeklyEvents: JSON.parse(fs.readFileSync('config/liveops.json', 'utf8')).weeklyEvents.slice(0, 6), weeklyEventArchive: [] }));
      expect(run('2026-11-16T00:00:00Z', path.resolve('config/liveops.json'), deployedFile).status).toBe(0);
      const previousFile = path.join(tempDir, 'previous.json');
      const candidateFile = path.join(tempDir, 'candidate.json');
      const old = { ...schedule(currentMonday(Date.now()) - 7 * DAY), id: 'lanterns_previous' };
      const current = schedule(currentMonday(Date.now()));
      fs.writeFileSync(previousFile, JSON.stringify({ weeklyEvents: [old, current] }));
      fs.writeFileSync(candidateFile, JSON.stringify({ weeklyEvents: [current], weeklyEventArchive: [old] }));
      expect(run(new Date(currentMonday(Date.now())).toISOString(), candidateFile, previousFile).status).toBe(0);
      fs.writeFileSync(candidateFile, JSON.stringify({ weeklyEvents: [{ ...current, milestones: [{ wins: 1, coins: 99 }] }], weeklyEventArchive: [old] }));
      const edited = run(new Date(currentMonday(Date.now())).toISOString(), candidateFile, previousFile);
      expect(edited.status).toBe(1);
      expect(edited.stderr).toContain('published week definition changed');
    } finally { fs.rmSync(tempDir, { recursive: true, force: true }); }
  });

  test('retiring an expired week keeps paid claim retries but never permits another grant', () => {
    const old = { ...schedule(monday - 7 * DAY), id: 'lanterns_previous' };
    const current = schedule(monday);
    const first = validateLiveOps({ weeklyEvents: [old, current] }).config!;
    const start = Date.parse(old.start);
    const wallet: any = { currencies: { coins: { amount: 100, maxAmount: 1000, earned: 0 } } };
    expect(recordWeeklyWin(wallet, first, start)).toMatchObject({ eventId: old.id, wins: 1 });
    expect(claimWeeklyMilestone(wallet, first, old.id, 1, start)).toMatchObject({ duplicate: false, coins: 10 });
    const rotated = validateWeeklyCalendar([current], [old], monday);
    expect(rotated.errors).toEqual([]);
    const config = { weeklyEvents: rotated.events, weeklyEventArchive: rotated.archive };
    expect(activeWeeklyEvent(config, monday)?.id).toBe(current.id);
    expect(visibleWeeklyEvent(config, monday)?.id).toBe(current.id);
    expect(recordWeeklyWin(wallet, config, monday)).toMatchObject({ eventId: current.id, wins: 1 });
    expect(wallet.weeklyEvents[old.id].claimed).toEqual([1]);
    expect(claimWeeklyMilestone(wallet, config, old.id, 1, monday)).toMatchObject({ duplicate: true, coins: 10, balance: 110 });
    expect(() => claimWeeklyMilestone(wallet, config, old.id, 2, monday)).toThrow('weekly_event_closed');
    expect(wallet.currencies.coins).toMatchObject({ amount: 110, earned: 10 });
    process.env.WEEKLY_EVENT_DISABLED = '1';
    try {
      expect(claimWeeklyMilestone(wallet, config, old.id, 1, monday).duplicate).toBe(true);
      expect(() => claimWeeklyMilestone(wallet, config, old.id, 2, monday)).toThrow('weekly_event_closed');
    } finally { delete process.env.WEEKLY_EVENT_DISABLED; }
    // Only removing the archive definition ends retry acknowledgments; never pays again.
    const withoutArchive = { weeklyEvents: rotated.events, weeklyEventArchive: [] };
    expect(() => claimWeeklyMilestone(wallet, withoutArchive, old.id, 1, monday)).toThrow('weekly_event_not_found');
    recordWeeklyWin(wallet, withoutArchive, monday);
    expect(wallet.weeklyEvents[old.id]).toBeUndefined();
  });

  test('archive validation rejects premature retirement, overlap, reuse, oversized or malformed history', () => {
    const last = { ...schedule(monday - 7 * DAY), id: 'lanterns_previous' };
    const current = schedule(monday);
    expect(validateWeeklyCalendar([current], [last], monday).errors).toEqual([]);
    expect(validateWeeklyCalendar([current], [{ ...last, id: current.id }], monday).errors).toContain('weeklyEventArchive: ids cannot be reused');
    expect(validateWeeklyCalendar([last, current], [last], monday).errors).toContain('weeklyEventArchive: archived weeks must end before the published schedule starts');
    expect(validateWeeklyCalendar([current], [current], monday).errors.join(' ')).toContain('cannot archive a week before its UTC end');
    expect(validateWeeklyCalendar([current], {}, monday).errors).toContain('weeklyEventArchive must be an array');
    expect(validateWeeklyCalendar([current], Array.from({ length: 53 }, () => last), monday).errors.join(' ')).toContain('at most 52 weeks');
    expect(validateLiveOps({ weeklyEvents: [current], weeklyEventArchive: [current] }).config).toBeNull();
    const corrupt = { ...last, milestones: [{ wins: 1, coins: 101 }] };
    expect(validateWeeklyCalendar([current], [corrupt], monday).errors.join(' ')).toContain('1-100 coins');
  });

  test('operator rollover protects previously published definitions and a 35-day archive retry floor', () => {
    const retired = { ...schedule(monday - 7 * DAY), id: 'lanterns_previous' };
    const active = schedule(monday);
    const previous = validateWeeklyCalendar([retired, active], [], monday);
    const candidate = validateWeeklyCalendar([active], [retired], monday);
    expect(validateWeeklyRotation({ weeklyEvents: previous.events, weeklyEventArchive: previous.archive },
      { weeklyEvents: candidate.events, weeklyEventArchive: candidate.archive }, monday)).toEqual([]);
    const before = { weeklyEvents: previous.events, weeklyEventArchive: previous.archive };
    const after = { weeklyEvents: candidate.events, weeklyEventArchive: candidate.archive };
    expect(validateWeeklyRotation(before, { ...after, weeklyEvents: [] }, monday).join(' ')).toContain('must move into the archive');
    expect(validateWeeklyRotation(before, { ...after, weeklyEventArchive: [] }, monday).join(' ')).toContain('must move into the archive');
    expect(validateWeeklyRotation(before, { ...after, weeklyEvents: [{ ...after.weeklyEvents[0], milestones: [{ wins: 1, coins: 50 }] }] }, monday).join(' ')).toContain('definition changed');
    expect(validateWeeklyRotation(before, after, monday - 1).join(' ')).toContain('cannot retire a week before its UTC end');
    expect(validateWeeklyRotation(after, { weeklyEvents: after.weeklyEvents, weeklyEventArchive: [] }, monday + 34 * DAY).join(' ')).toContain('at least 35 days');
    expect(validateWeeklyRotation(after, { weeklyEvents: after.weeklyEvents, weeklyEventArchive: [] }, monday + 35 * DAY)).toEqual([]);
    expect(validateWeeklyRotation(after, { weeklyEvents: [retired, active], weeklyEventArchive: [] }, monday + 35 * DAY).join(' ')).toContain('cannot move an archived week back');
    expect(validateWeeklyRotation(after, { ...after, weeklyEventArchive: [{ ...retired, id: 'invented_archive' }] }, monday).join(' ')).toContain('cannot invent archived history');
  });

  test('bad dates, overlaps, duplicate ids, unsorted/excessive prizes and malformed lists fail closed', () => {
    const valid = schedule(monday);
    expect(validateWeeklyEvents('bad').errors.length).toBeGreaterThan(0);
    expect(validateLiveOps({ weeklyEvents: [{ ...valid, end: valid.start }] }).config).toBeNull();
    expect(validateWeeklyEvents([{ ...valid, start: '2026-10-06T00:00:00Z' }]).events).toHaveLength(0);
    expect(validateWeeklyEvents([{ ...valid, start: '2026-10-05T00:00:00.001Z', end: '2026-10-12T00:00:00.001Z' }]).errors.length).toBeGreaterThan(0);
    expect(validateWeeklyEvents([{ ...valid, start: '2026-02-30T00:00:00Z', end: '2026-03-09T00:00:00Z' }]).errors.length).toBeGreaterThan(0);
    expect(validateWeeklyEvents([{ ...valid, milestones: [{ wins: 2, coins: 10 }, { wins: 1, coins: 20 }] }]).errors.length).toBeGreaterThan(0);
    expect(validateWeeklyEvents([{ ...valid, milestones: [{ wins: 1, coins: 10000 }] }]).errors.length).toBeGreaterThan(0);
    expect(validateWeeklyEvents([valid, valid]).events).toHaveLength(0);
    expect(validateWeeklyEvents([valid, { ...valid, id: 'lanterns_week2', start: new Date(monday + 6 * DAY).toISOString(), end: new Date(monday + 13 * DAY).toISOString() }]).events).toHaveLength(0);
  });

  test('progress occurs only inside [start,end); milestones expire, duplicates never grant again', () => {
    const config = validateLiveOps({ weeklyEvents: [schedule(monday)] }).config!;
    const wallet: any = { currencies: { coins: { amount: 100, maxAmount: 999999, earned: 0 } } };
    expect(recordWeeklyWin(wallet, config, monday - 1)).toBeNull();
    expect(() => claimWeeklyMilestone(wallet, config, 'lanterns_week1', 1, monday - 1)).toThrow('weekly_event_closed');
    wallet.weeklyEvents = { expired_week: { wins: 4, claimed: [1] } };
    expect(recordWeeklyWin(wallet, config, monday)).toEqual({ eventId: 'lanterns_week1', wins: 1 });
    expect(wallet.weeklyEvents.expired_week).toBeUndefined();
    expect(weeklyView(config.weeklyEvents[0], wallet, monday)?.milestones[0].canClaim).toBe(true);
    expect(() => claimWeeklyMilestone(wallet, config, 'lanterns_week1', 2, monday)).toThrow('weekly_progress_required');
    wallet.currencies.coins.maxAmount = 105;
    expect(() => claimWeeklyMilestone(wallet, config, 'lanterns_week1', 1, monday)).toThrow('weekly_wallet_full');
    expect(wallet.weeklyEvents.lanterns_week1.claimed).toEqual([]);
    wallet.currencies.coins.maxAmount = 999999;
    expect(claimWeeklyMilestone(wallet, config, 'lanterns_week1', 1, monday)).toMatchObject({ duplicate: false, balance: 110 });
    expect(claimWeeklyMilestone(wallet, config, 'lanterns_week1', 1, monday + 7 * DAY)).toMatchObject({ duplicate: true, balance: 110 });
    expect(recordWeeklyWin(wallet, config, monday + 7 * DAY)).toBeNull();
    expect(() => claimWeeklyMilestone(wallet, config, 'lanterns_week1', 2, monday + 7 * DAY)).toThrow('weekly_event_closed');
    process.env.WEEKLY_EVENT_DISABLED = '1';
    try {
      expect(activeWeeklyEvent(config, monday)).toBeNull();
      expect(() => claimWeeklyMilestone(wallet, config, 'lanterns_week1', 2, monday)).toThrow('weekly_event_closed');
    } finally { delete process.env.WEEKLY_EVENT_DISABLED; }
  });
});

describe('web event tab', () => {
  function browser(authenticated: boolean) {
    const { document, window } = parseHTML('<html><head></head><body><section id="community-body"></section></body></html>');
    const sandbox: any = { document, window: { addEventListener() {} }, console: { log() {}, warn() {}, error() {} },
      PerformanceObserver: class { observe() {} } };
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync('script.js', 'utf8'), sandbox);
    const ui: any = vm.runInContext('Object.create(InfiniteMatchGame.prototype)', sandbox);
    ui.communityTab = 'events';
    ui.getAuthToken = () => authenticated ? 'session' : null;
    const body = document.getElementById('community-body')!;
    const show = (nodes: any[]) => body.replaceChildren(...nodes);
    return { ui, body, show, window };
  }

  test('guest can see the schedule without a claim button; data is inserted as text', async () => {
    const { ui, body, show } = browser(false);
    const calls: string[] = [];
    ui.communityRequest = async (url: string) => {
      calls.push(url);
      return { ok: true, data: { event: { id: 'lanterns_week1', status: 'active', name: '<img src=x>',
        description: 'Finish a puzzle', startsAt: '2026-10-05T00:00:00Z', endsAt: '2026-10-12T00:00:00Z',
        wins: 0, milestones: [{ wins: 1, coins: 10, canClaim: false }] } } };
    };
    await ui.loadCommunityEvents(show);
    expect(calls).toEqual(['/api/live-ops/weekly/preview']);
    expect(body.textContent).toContain('Guest puzzles remain playable');
    expect(body.querySelector('img')).toBeNull();
    expect(body.querySelector('button')).toBeNull();
  });

  test('a signed-in player sees server progress and a claim action with only event id and tier', async () => {
    const { ui, body, show, window } = browser(true);
    const actions: any[] = [];
    ui.communityRequest = async (url: string) => url === '/api/live-ops/weekly'
      ? { ok: true, data: { event: { id: 'lanterns_week1', status: 'active', name: 'Hall Lanterns',
        description: 'Finish a puzzle', startsAt: '2026-10-05T00:00:00Z', endsAt: '2026-10-12T00:00:00Z',
        wins: 1, milestones: [{ wins: 1, coins: 10, canClaim: true, claimed: false },
          { wins: 2, coins: 20, canClaim: false, claimed: false }] } } }
      : { ok: true, data: { tournaments: [], challenges: [], deals: [] } };
    ui.claimWeekly = (...args: any[]) => { actions.push(args); };
    await ui.loadCommunityEvents(show);
    const meter: any = body.querySelector('progress');
    expect(meter.value).toBe(1);
    expect(meter.getAttribute('aria-label')).toContain('1 verified wins');
    const buttons = [...body.querySelectorAll('button')];
    expect(buttons).toHaveLength(1);
    buttons[0].dispatchEvent(new window.Event('click'));
    expect(actions).toEqual([['lanterns_week1', 1]]);
    expect(body.textContent).toContain('Claim before it ends');
  });

  test('the claim shows a confirmed grant or safe lost-response message', async () => {
    const { ui } = browser(true);
    const refreshes: string[] = [];
    ui.showCommunityTab = (tab: string) => refreshes.push(tab);
    ui.communityRequest = async () => ({ ok: true, data: { result: { coins: 10, balance: 1010, duplicate: false } } });
    await ui.claimWeekly('lanterns_week1', 1);
    expect(ui.communityFlash).toContain('+10 free coins');
    expect(refreshes).toEqual(['events']);
    ui.communityRequest = async () => { throw new Error('connection lost'); };
    await ui.claimWeekly('lanterns_week1', 1);
    expect(ui.communityFlash).toContain('check it before retrying');
  });
});

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/account-economy', economyRoutes);
app.use('/api/live-ops', liveOpsRoutes);
let token: string; let dir: string; let eventId: string; let playerId: string;
const auth = () => ({ Authorization: `Bearer ${token}` });
const getWeekly = () => request(app).get('/api/live-ops/weekly').set(auth());
const claim = (wins: number) => request(app).post('/api/live-ops/weekly/claim').set(auth()).send({ eventId, wins });

async function verifiedWin() {
  const spent = await request(app).post('/api/account-economy/energy/spend').set(auth()).send({
    level: 4, mode: 'classic', rulesVersion: 5,
    location: { timeZone: 'America/New_York', country: 'US', region: 'PA' },
  });
  expect(spent.status).toBe(200);
  const { generatedLevel: def, attemptId } = spent.body.result;
  let state: any = { board: def.board, specials: def.specials, shields: def.shields,
    refillState: def.refillState, objectiveProgress: initialObjectiveProgress(def) };
  const moves: number[][] = []; let score = 0;
  for (const cells of certifyLevel(def).witness) {
    const result = simulateLevelMove(def, state, cells)!;
    moves.push(cells); score += result.score;
    state = { board: result.board, specials: result.specials, shields: result.shields,
      refillState: result.refillState, objectiveProgress: result.objectiveProgress };
    if (objectiveStatus(def, score, state.objectiveProgress).complete) break;
  }
  const body = { level: 4, attemptId, score, objectiveProgress: state.objectiveProgress, moves };
  const before = (await getWeekly()).body.event.wins;
  const rejected = await request(app).post('/api/account-economy/level/complete').set(auth()).send({ ...body, score: score + 1 });
  expect(rejected.status).toBe(400); expect(rejected.body.error).toBe('replay_result_mismatch');
  expect((await getWeekly()).body.event.wins).toBe(before);
  const completed = await request(app).post('/api/account-economy/level/complete').set(auth()).send(body);
  expect(completed.status).toBe(200);
  expect(completed.body.result.verified).toBe(true);
  return body;
}

beforeAll(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'weekly-'));
  const current = schedule(currentMonday(Date.now()));
  eventId = current.id;
  process.env.LIVE_OPS_CONFIG = path.join(dir, 'liveops.json');
  fs.writeFileSync(process.env.LIVE_OPS_CONFIG, JSON.stringify({ events: [], deals: [], weeklyEvents: [current] }));
  loadLiveOps({ path: process.env.LIVE_OPS_CONFIG, reload: true });
  playerId = `week_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const registered = await request(app).post('/api/auth/register').send({ playerId, email: `${playerId}@example.com`, password: 'secret123' });
  expect(registered.status).toBe(200); token = registered.body.token;
});

afterAll(() => {
  delete process.env.LIVE_OPS_CONFIG;
  delete process.env.WEEKLY_EVENT_DISABLED;
  loadLiveOps({ reload: true });
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('weekly event route and locked claim', () => {
  test('guests can preview but cannot claim or read a player’s progress', async () => {
    const preview = await request(app).get('/api/live-ops/weekly/preview');
    expect(preview.status).toBe(200);
    expect(preview.body.event).toMatchObject({ id: eventId, status: 'active', wins: 0 });
    expect((await request(app).get('/api/live-ops/weekly')).status).toBe(401);
    expect((await request(app).post('/api/live-ops/weekly/claim').send({ eventId, wins: 1 })).status).toBe(401);
    expect((await claim(1)).body.error).toBe('weekly_progress_required');
  });

  test('legacy unverified payout cannot advance the event; exact replay counts once', async () => {
    const spend = await request(app).post('/api/account-economy/energy/spend').set(auth()).send({ level: 1 });
    expect(spend.status).toBe(200);
    const legacy = await request(app).post('/api/account-economy/level/complete').set(auth()).send({
      level: 1, score: 900, attemptId: spend.body.result.attemptId,
    });
    expect(legacy.status).toBe(200); expect(legacy.body.result.verified).toBe(false);
    expect((await getWeekly()).body.event.wins).toBe(0);
    const body = await verifiedWin();
    expect((await getWeekly()).body.event.wins).toBe(1);
    const replay = await request(app).post('/api/account-economy/level/complete').set(auth()).send(body);
    expect(replay.status).toBe(200); expect(replay.body.result.duplicate).toBe(true);
    expect((await getWeekly()).body.event.wins).toBe(1);
  });

  test('two simultaneous claims grant one reward, and reconnect/retry shows it claimed', async () => {
    const [first, second] = await Promise.all([claim(1), claim(1)]);
    expect(first.status).toBe(200); expect(second.status).toBe(200);
    expect([first.body.result.duplicate, second.body.result.duplicate].sort()).toEqual([false, true]);
    expect(first.body.result.balance).toBe(second.body.result.balance);
    const status = await getWeekly();
    expect(status.body.event.milestones[0]).toMatchObject({ claimed: true, canClaim: false });
    expect(status.body.event.milestones[1]).toMatchObject({ claimed: false, canClaim: false });
    expect((await claim(2)).body.error).toBe('weekly_progress_required');
  });

  test('kill switch stops new grants and visibility; restarting the loop preserves saved progress', async () => {
    await verifiedWin();
    process.env.WEEKLY_EVENT_DISABLED = '1';
    try {
      const preview = await request(app).get('/api/live-ops/weekly/preview');
      expect(preview.body).toMatchObject({ disabled: true, event: null });
      const refused = await claim(2);
      expect(refused.status).toBe(409); expect(refused.body.error).toBe('weekly_event_closed');
    } finally { delete process.env.WEEKLY_EVENT_DISABLED; }
    expect((await getWeekly()).body.event.wins).toBe(2);
    const won = await claim(2);
    expect(won.status).toBe(200); expect(won.body.result).toMatchObject({ duplicate: false, coins: 20 });
    expect((await claim(2)).body.result.duplicate).toBe(true);
  });

  test('a rotated archived claim is read-only across a later verified win and config reload', async () => {
    const previous = { ...schedule(currentMonday(Date.now()) - 7 * DAY), id: 'lanterns_previous' };
    const current = schedule(currentMonday(Date.now()));
    const economy = await accountEconomy.getPlayerEconomy(playerId);
    economy.weeklyEvents ??= {};
    economy.weeklyEvents[previous.id] = { wins: 1, claimed: [1] }; // a previously saved payout
    await accountEconomy.updatePlayerEconomyCache(playerId, economy);
    const balance = economy.currencies.coins.amount;
    fs.writeFileSync(process.env.LIVE_OPS_CONFIG!, JSON.stringify({ events: [], deals: [], weeklyEvents: [current], weeklyEventArchive: [previous] }));
    loadLiveOps({ reload: true });
    try {
      const preview = await request(app).get('/api/live-ops/weekly/preview');
      expect(preview.body.event.id).toBe(eventId); // history never becomes guest-visible
      const retry = await request(app).post('/api/live-ops/weekly/claim').set(auth()).send({ eventId: previous.id, wins: 1 });
      expect(retry.status).toBe(200);
      expect(retry.body.result).toMatchObject({ duplicate: true, coins: 10, balance });
      const late = await request(app).post('/api/live-ops/weekly/claim').set(auth()).send({ eventId: previous.id, wins: 2 });
      expect(late.status).toBe(409); expect(late.body.error).toBe('weekly_event_closed');
      await verifiedWin();
      const after = await request(app).post('/api/live-ops/weekly/claim').set(auth()).send({ eventId: previous.id, wins: 1 });
      expect(after.status).toBe(200); expect(after.body.result.duplicate).toBe(true);
      expect((await accountEconomy.getPlayerEconomy(playerId)).weeklyEvents[previous.id].claimed).toEqual([1]);
    } finally {
      fs.writeFileSync(process.env.LIVE_OPS_CONFIG!, JSON.stringify({ events: [], deals: [], weeklyEvents: [current] }));
      loadLiveOps({ reload: true });
    }
  });
});
