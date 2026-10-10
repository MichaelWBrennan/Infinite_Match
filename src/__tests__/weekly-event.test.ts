import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
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
import { loadLiveOps, validateLiveOps } from '../services/live-ops/live-ops.js';
import { activeWeeklyEvent, claimWeeklyMilestone, recordWeeklyWin, validateWeeklyEvents, weeklyView } from '../services/live-ops/weekly-event.js';
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
    expect(result.config?.weeklyEvents).toHaveLength(3);
    expect(activeWeeklyEvent(result.config, Date.parse('2026-10-10T12:00:00Z'))?.id).toBe('hall_lanterns_20261005');
    expect(activeWeeklyEvent(result.config, Date.parse('2026-10-12T00:00:00Z'))?.id).toBe('hall_lanterns_20261012');
    expect(activeWeeklyEvent(result.config, Date.parse('2026-10-26T00:00:00Z'))).toBeNull();
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
let token: string; let dir: string; let eventId: string;
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
  const playerId = `week_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
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
    expect(replay.status).toBe(400);
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
});
