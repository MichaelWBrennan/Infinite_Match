import { beforeAll, describe, expect, test } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { parseHTML } from 'linkedom';
import authRoutes from '../routes/auth.js';
import kingdomRoutes from '../routes/kingdom.js';
import { initialKingdom, kingdomView, KINGDOM_ROOMS } from '../services/meta/kingdom.js';
import { DECOR_CATALOG, decorView, ensureDecor, planChooseDecor } from '../services/meta/kingdom-decor.js';

const view = (rooms: Record<string, number>, coins: number, placed: Record<string, string> = {}, owned: Record<string, number> = {}) => {
  const kingdom = initialKingdom();
  Object.assign(kingdom.rooms, rooms);
  const decor = ensureDecor(kingdom);
  decor.placed = placed; decor.owned = owned;
  return { success: true, coins, coinBonus: 0.01,
    kingdom: kingdomView({ kingdom, coins, lifetimeStars: 0 }), decor: decorView(decor) };
};

function scene() {
  const sandbox: any = {};
  vm.createContext(sandbox);
  vm.runInContext(readFileSync('public/js/kingdom-scene.js', 'utf8'), sandbox);
  return sandbox.InfiniteKingdomScene;
}

describe('first authored kingdom room', () => {
  test('the responsive dialog renders three accessible choices and a skippable story', () => {
    const { document, window } = parseHTML('<html><body><div id="host"></div></body></html>');
    const sandbox: any = { document };
    vm.createContext(sandbox);
    vm.runInContext(readFileSync('public/js/kingdom-scene.js', 'utf8'), sandbox);
    vm.runInContext(readFileSync('public/js/player-experience.js', 'utf8'), sandbox);
    const game: any = { score: 0, targetScore: 500, settings: { sfx: false },
      getSoundStatus: () => ({ enabled: false, supported: false, state: 'off', volume: 0.5 }),
      canInteractWithBoard: () => false, animationsReduced: () => false, isGameRunning: false };
    const ui = sandbox.InfinitePlayerExperience.mount(game, document.getElementById('host'));
    const dialog: any = ui.shell.querySelector('dialog');
    dialog.showModal = () => { dialog.open = true; };
    dialog.close = () => { dialog.open = false; };
    const chosen: string[] = [];
    ui.openOverlay('Kingdom');
    ui.renderKingdomScene(view({ throne: 1 }, 800), { close: () => {}, choose: (id: string) => chosen.push(id) });
    expect(dialog.classList.contains('kingdom-room-dialog')).toBe(true);
    expect(dialog.querySelector('.kingdom-room-art svg')).toBeTruthy();
    const buttons: any[] = [...dialog.querySelectorAll('.kingdom-room-choice')];
    expect(buttons.map((button) => button.dataset.decorId)).toEqual(['tapestry', 'mosaic', 'sconces']);
    expect(buttons.every((button) => !button.disabled)).toBe(true);
    expect(buttons.map((button) => button.textContent)).toEqual(expect.arrayContaining([
      expect.stringContaining('Sun Mosaic'), expect.stringContaining('Tapestry'), expect.stringContaining('Starlight Sconces'),
    ]));
    buttons[1].dispatchEvent(new window.Event('click'));
    expect(chosen).toEqual(['mosaic']);
    const skip: any = [...dialog.querySelectorAll('button')].find((button: any) => button.textContent === 'Skip story');
    skip.dispatchEvent(new window.Event('click'));
    expect(dialog.querySelector('.kingdom-room-story')).toBeNull();
    ui.renderKingdomScene(view({ throne: 1 }, 660, { throne: 'mosaic' }, { mosaic: 1 }), {});
    expect(dialog.querySelector('.kingdom-room-story')).toBeNull();
    expect(dialog.querySelector('[data-decor-id="mosaic"]').getAttribute('aria-pressed')).toBe('true');
    ui.openOverlay('Another screen');
    expect(dialog.classList.contains('kingdom-room-dialog')).toBe(false);
    ui.closeOverlay();
  });
  test('the server keeps three distinct level-one looks with real prices', () => {
    expect(DECOR_CATALOG.tapestry.requiresRoomLevel).toBe(1);
    expect(DECOR_CATALOG.mosaic.requiresRoomLevel).toBe(1);
    expect(DECOR_CATALOG.sconces.requiresRoomLevel).toBe(1);
    expect(new Set(['tapestry', 'mosaic', 'sconces'].map((id) => DECOR_CATALOG[id].priceCoins)).size).toBe(3);
    expect(KINGDOM_ROOMS[0].id).toBe('throne');
  });

  test('pure planning validates the room, gate, price, reuse and already displayed item', () => {
    const kingdom = initialKingdom(); const decor = ensureDecor(kingdom);
    expect(() => planChooseDecor(kingdom, decor, 'throne', 'mosaic', 1000)).toThrow('room_level_too_low');
    kingdom.rooms.throne = 1;
    expect(() => planChooseDecor(kingdom, decor, 'missing', 'mosaic', 1000)).toThrow('unknown_room');
    expect(() => planChooseDecor(kingdom, decor, 'throne', '__proto__', 1000)).toThrow('unknown_decor');
    expect(() => planChooseDecor(kingdom, decor, 'throne', 'mosaic', 0)).toThrow('insufficient_coins');
    expect(planChooseDecor(kingdom, decor, 'throne', 'mosaic', 140)).toMatchObject({ buy: true, costCoins: 140 });
    decor.owned.mosaic = 1;
    expect(planChooseDecor(kingdom, decor, 'throne', 'mosaic', 0)).toMatchObject({ buy: false, costCoins: 0, unchanged: false });
    decor.placed.throne = 'mosaic';
    expect(planChooseDecor(kingdom, decor, 'throne', 'mosaic', 0)).toMatchObject({ buy: false, costCoins: 0, unchanged: true });
  });

  test('guest previews cannot buy; first repair unlocks three choices and selected look persists', () => {
    const api = scene();
    const guest = api.roomView({ guest: true });
    expect(guest.choices).toHaveLength(3);
    expect(guest.choices.every((choice: any) => !choice.eligible)).toBe(true);
    const locked = api.roomView(view({}, 1000));
    expect(locked.choices.every((choice: any) => !choice.eligible)).toBe(true);
    const repaired = api.roomView(view({ throne: 1 }, 660));
    expect(repaired.choices.map((choice: any) => choice.id)).toEqual(['tapestry', 'mosaic', 'sconces']);
    expect(repaired.choices.every((choice: any) => choice.eligible)).toBe(true);
    const chosen = api.roomView(view({ throne: 1 }, 0, { throne: 'mosaic' }, { mosaic: 1 }));
    expect(chosen.selected).toBe('mosaic');
    expect(chosen.choices.find((choice: any) => choice.id === 'mosaic')).toMatchObject({ selected: true, costCoins: 0 });
    expect(chosen.narrative).toContain('Sunlight set in stone');
  });

  test('room artwork has distinct decoration geometry and never injects unknown ids', () => {
    const api = scene();
    const images = ['tapestry', 'mosaic', 'sconces'].map((id) => api.artwork(1, id));
    expect(new Set(images).size).toBe(3);
    for (const markup of images) {
      const { document } = parseHTML(markup);
      expect(document.querySelector('svg')).toBeTruthy();
      expect(document.querySelector('script')).toBeNull();
    }
    expect(api.artwork(1, '<script>alert(1)</script>')).not.toContain('<script>');
    expect(api.artwork(0, 'mosaic')).not.toBe(api.artwork(1, 'mosaic'));
  });
});

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/kingdom', kingdomRoutes);
let token = '';
const auth = () => ({ Authorization: `Bearer ${token}` });
const choose = (roomId: string, decorId: string) => request(app).post('/api/kingdom/decor/choose').set(auth()).send({ roomId, decorId });

beforeAll(async () => {
  const playerId = `room_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const registered = await request(app).post('/api/auth/register').send({ playerId, email: `${playerId}@example.com`, password: 'secret123' });
  expect(registered.status).toBe(200);
  token = registered.body.token;
});

describe('atomic room choice API', () => {
  test('requires a session; a locked room or unknown item cannot spend coins', async () => {
    expect((await request(app).post('/api/kingdom/decor/choose').send({ roomId: 'throne', decorId: 'mosaic' })).status).toBe(401);
    const locked = await choose('throne', 'mosaic');
    expect(locked.status).toBe(400); expect(locked.body.error).toBe('room_level_too_low');
    const unknown = await choose('throne', 'bad');
    expect(unknown.status).toBe(400); expect(unknown.body.error).toBe('unknown_decor');
    const state = await request(app).get('/api/kingdom').set(auth());
    expect(state.body.coins).toBe(1000);
    expect(state.body.decor.owned).toEqual({});
  });

  test('a repair followed by one choice buys and places once; switching back reuses owned decor', async () => {
    const repair = await request(app).post('/api/kingdom/renovate').set(auth()).send({ roomId: 'throne' });
    expect(repair.status).toBe(200); expect(repair.body.result).toMatchObject({ level: 1, coins: 800 });
    const first = await choose('throne', 'mosaic');
    expect(first.status).toBe(200); expect(first.body.result).toMatchObject({ buy: true, costCoins: 140, coins: 660 });
    const repeat = await choose('throne', 'mosaic');
    expect(repeat.status).toBe(200); expect(repeat.body.result).toMatchObject({ unchanged: true, costCoins: 0, coins: 660 });
    const second = await choose('throne', 'tapestry');
    expect(second.status).toBe(200); expect(second.body.result).toMatchObject({ buy: true, costCoins: 200, coins: 460 });
    const reuse = await choose('throne', 'mosaic');
    expect(reuse.status).toBe(200); expect(reuse.body.result).toMatchObject({ buy: false, costCoins: 0, coins: 460 });
    const state = await request(app).get('/api/kingdom').set(auth());
    expect(state.body.decor.owned).toMatchObject({ mosaic: 1, tapestry: 1 });
    expect(state.body.decor.placed.throne).toBe('mosaic');
  });

  test('concurrent repeated choices charge once and retain one placed item', async () => {
    const [one, two] = await Promise.all([choose('throne', 'sconces'), choose('throne', 'sconces')]);
    expect(one.status).toBe(200); expect(two.status).toBe(200);
    expect([one.body.result.buy, two.body.result.buy].filter(Boolean)).toHaveLength(1);
    const state = await request(app).get('/api/kingdom').set(auth());
    expect(state.body.coins).toBe(280);
    expect(state.body.decor.owned.sconces).toBe(1);
    expect(state.body.decor.placed.throne).toBe('sconces');
    const tooHigh = await choose('throne', 'statue');
    expect(tooHigh.status).toBe(400); expect(tooHigh.body.error).toBe('room_level_too_low');
    expect((await request(app).get('/api/kingdom').set(auth())).body.coins).toBe(280);
  });
});
