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

describe('authored kingdom scenes', () => {
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
  test('library navigation presents its own story, art, gate, price and room-bound actions', () => {
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
    dialog.showModal = () => { dialog.open = true; }; dialog.close = () => { dialog.open = false; };
    ui.openOverlay('Kingdom');
    const actions: string[] = [];
    const state = view({ throne: 1 }, 800);
    const callbacks = (roomId: string) => ({ roomId, selectRoom: (id: string) => actions.push(`visit:${id}`),
      renovate: (id: string) => actions.push(`repair:${id}`),
      choose: (id: string, room: string) => actions.push(`choose:${room}:${id}`) });
    ui.renderKingdomScene(state, callbacks('throne'));
    const hallArt = dialog.querySelector('.kingdom-room-art svg').outerHTML;
    const nav: any[] = [...dialog.querySelectorAll('.kingdom-room-nav button')];
    expect(nav.map((button) => button.textContent)).toEqual(KINGDOM_ROOMS.map((room) => room.name));
    nav[1].dispatchEvent(new window.Event('click'));
    expect(actions).toEqual(['visit:library']);
    ui.renderKingdomScene(state, callbacks('library'));
    expect(dialog.querySelector('h2').textContent).toBe('The Library of Lanterns');
    expect(dialog.querySelector('[data-room-id="library"]').getAttribute('aria-pressed')).toBe('true');
    expect(dialog.querySelector('.kingdom-room-art svg').outerHTML).not.toBe(hallArt);
    expect(dialog.querySelector('.kingdom-room-art').getAttribute('aria-label')).toContain('Royal Library');
    expect(dialog.querySelector('.kingdom-room-story').textContent).toContain('stories back into the light');
    expect(dialog.querySelector('.kingdom-room-renovate button').textContent).toContain('Repair library · 200 coins');
    expect(dialog.querySelectorAll('.kingdom-room-choice:disabled')).toHaveLength(3);
    dialog.querySelector('.kingdom-room-renovate button').dispatchEvent(new window.Event('click'));
    expect(actions.at(-1)).toBe('repair:library');
    ui.renderKingdomScene(view({ throne: 1, library: 1 }, 600, { throne: 'mosaic' }, { mosaic: 1 }), callbacks('library'));
    expect(dialog.querySelector('[data-decor-id="mosaic"] .kingdom-room-price').textContent).toContain('140 coins'); // the copy placed in the hall is not free
    expect(dialog.querySelector('[data-decor-id="tapestry"] .kingdom-room-price').textContent).toContain('200 coins');
    dialog.querySelector('[data-decor-id="tapestry"]').dispatchEvent(new window.Event('click'));
    expect(actions.at(-1)).toBe('choose:library:tapestry');
    ui.renderKingdomScene(view({ throne: 1, library: 1 }, 400, { library: 'tapestry' }, { tapestry: 1 }), callbacks('library'));
    expect(dialog.querySelector('[data-decor-id="tapestry"]').getAttribute('aria-pressed')).toBe('true');
    expect(dialog.querySelector('.kingdom-room-art').getAttribute('aria-label')).toContain('Tapestry');
    expect(dialog.querySelector('.kingdom-room-story').textContent).toContain('A map for every journey');
    dialog.querySelector('[data-room-id="throne"]').dispatchEvent(new window.Event('click'));
    expect(actions.at(-1)).toBe('visit:throne');
    ui.renderKingdomScene({ guest: true }, callbacks('library'));
    expect(dialog.querySelector('.kingdom-room-renovate button').textContent).toBe('Sign in to save your library');
    expect(dialog.querySelectorAll('.kingdom-room-choice:disabled')).toHaveLength(3);
  });

  test('all six room scenes use the server room list, independent stock and authored art', () => {
    const api = scene();
    expect([...api.ROOM_IDS]).toEqual(KINGDOM_ROOMS.map((room) => room.id));
    const works = new Set<string>();
    for (const room of KINGDOM_ROOMS) {
      expect(api.ROOM_NAMES[room.id]).toBe(room.name);
      const locked = api.roomView(view({}, 1000), room.id);
      expect(locked.choices.every((choice: any) => !choice.eligible)).toBe(true);
      const initial = api.artwork(0, null, room.id);
      const repaired = api.artwork(1, null, room.id);
      expect(initial).not.toBe(repaired);
      expect(initial).not.toContain('<script');
      works.add(repaired);
      const active = api.roomView(view({ [room.id]: 1 }, 500, { [room.id]: 'mosaic' }, { mosaic: 1 }), room.id);
      expect(active.choices.map((choice: any) => choice.id)).toEqual(['tapestry', 'mosaic', 'sconces']);
      expect(active.selected).toBe('mosaic');
      expect(active.choices.find((choice: any) => choice.id === 'mosaic').costCoins).toBe(0);
      expect(active.choices.find((choice: any) => choice.id === 'tapestry').costCoins).toBe(200);
      expect(active.narrative).toContain(active.choices.find((choice: any) => choice.id === 'mosaic').caption);
      expect(api.artwork(1, '<script>alert(1)</script>', room.id)).not.toContain('<script');
    }
    expect(works.size).toBe(6);
    expect(api.roomView({ guest: true }, '__proto__').id).toBe('throne');
    expect(api.artwork(1, '<script>', 'garden')).not.toContain('<script');
  });

  test('garden tab preserves room-specific prices and repair actions', () => {
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
    dialog.showModal = () => { dialog.open = true; }; dialog.close = () => { dialog.open = false; };
    const actions: string[] = [];
    ui.openOverlay('Kingdom');
    ui.renderKingdomScene(view({}, 500), { roomId: 'throne', selectRoom: (id: string) => actions.push(id) });
    dialog.querySelector('[data-room-id="garden"]').dispatchEvent(new window.Event('click'));
    expect(actions).toEqual(['garden']);
    ui.renderKingdomScene(view({}, 500), { roomId: 'garden', renovate: (id: string) => actions.push(`repair:${id}`) });
    expect(dialog.querySelector('h2').textContent).toBe('The Garden of Seasons');
    expect(dialog.querySelector('.kingdom-room-renovate button').textContent).toContain('150 coins');
    expect(dialog.querySelector('.kingdom-room-story').textContent).toContain('grown wild');
    expect(dialog.querySelector('.kingdom-room-art').getAttribute('aria-label')).toContain('Royal Garden');
    dialog.querySelector('.kingdom-room-renovate button').dispatchEvent(new window.Event('click'));
    expect(actions.at(-1)).toBe('repair:garden');
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

  test('library guest and library stock are independent of the hall; art is fixed authored markup', () => {
    const api = scene();
    const guest = api.roomView({ guest: true }, 'library');
    expect(guest.name).toBe('Royal Library');
    expect(guest.choices.every((item: any) => !item.eligible)).toBe(true);
    const state = view({ throne: 1, library: 1 }, 0, { throne: 'mosaic' }, { mosaic: 1, tapestry: 1 });
    const library = api.roomView(state, 'library');
    expect(library.selected).toBeNull();
    expect(library.choices.find((item: any) => item.id === 'mosaic').costCoins).toBe(140);
    expect(library.choices.find((item: any) => item.id === 'tapestry')).toMatchObject({ eligible: true, costCoins: 0 });
    const variants = ['tapestry', 'mosaic', 'sconces'].map((id) => api.artwork(1, id, 'library'));
    expect(new Set(variants).size).toBe(3);
    expect(api.artwork(0, null, 'library')).not.toBe(api.artwork(1, null, 'library'));
    expect(api.artwork(1, 'tapestry', 'library')).not.toBe(api.artwork(1, 'tapestry', 'throne'));
    expect(api.artwork(1, '<script>alert(1)</script>', 'library')).not.toContain('<script>');
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
  test('a second room repairs independently and can use an unplaced owned look without paying twice', async () => {
    const locked = await choose('library', 'tapestry');
    expect(locked.status).toBe(400); expect(locked.body.error).toBe('room_level_too_low');
    const repair = await request(app).post('/api/kingdom/renovate').set(auth()).send({ roomId: 'library' });
    expect(repair.status).toBe(200); expect(repair.body.result.coins).toBe(80);
    const placed = await choose('library', 'tapestry');
    expect(placed.status).toBe(200);
    expect(placed.body.result).toMatchObject({ roomId: 'library', buy: false, costCoins: 0, coins: 80 });
    const duplicate = await choose('library', 'tapestry');
    expect(duplicate.body.result).toMatchObject({ unchanged: true, costCoins: 0, coins: 80 });
    const state = await request(app).get('/api/kingdom').set(auth());
    expect(state.body.kingdom.rooms.find((room: any) => room.id === 'library').level).toBe(1);
    expect(state.body.decor.placed).toMatchObject({ throne: 'sconces', library: 'tapestry' });
  });

});
