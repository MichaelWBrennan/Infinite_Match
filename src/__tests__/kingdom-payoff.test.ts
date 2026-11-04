import { describe, expect, test } from '@jest/globals';
import fs from 'node:fs';
import vm from 'node:vm';
import { parseHTML } from 'linkedom';
import { initialKingdom, kingdomNextGoal, kingdomView, unlockEligibleRooms } from '../services/meta/kingdom.js';

function loadClient() {
  const sandbox: any = {};
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync('public/js/kingdom-payoff.js', 'utf8'), sandbox);
  return sandbox.InfiniteKingdomPayoff;
}

function kingdomWith(rooms: Record<string, number>, unlocked: string[] = ['throne', 'library', 'garden', 'armory', 'gatehouse', 'chapel']) {
  const kingdom = initialKingdom();
  Object.assign(kingdom.rooms, rooms);
  kingdom.unlockedRooms = unlocked;
  return kingdom;
}

describe('server kingdom next goal', () => {
  test('prefers a ready renovation and reports the exact server price', () => {
    const goal = kingdomNextGoal({ kingdom: kingdomWith({ throne: 0 }), coins: 200, lifetimeStars: 0 });
    expect(goal.kind).toBe('renovate');
    expect(goal.roomId).toBe('throne');
    expect(goal.costCoins).toBe(200);
    expect(goal.canRenovate).toBe(true);
    expect(goal.missingCoins).toBe(0);
  });

  test('shows the nearest coin gap when no room is ready', () => {
    const goal = kingdomNextGoal({ kingdom: kingdomWith({ throne: 1 }, ['throne']), coins: 500, lifetimeStars: 5 });
    expect(goal.kind).toBe('coins');
    expect(goal.roomId).toBe('throne');
    expect(goal.targetLevel).toBe(2);
    expect(goal.costCoins).toBe(800);
    expect(goal.missingCoins).toBe(300);
    expect(goal.canRenovate).toBe(false);
  });

  test('shows a lifetime-star gap before a coin gap when stars block the next level', () => {
    const goal = kingdomNextGoal({ kingdom: kingdomWith({ throne: 1 }, ['throne']), coins: 5000, lifetimeStars: 3 });
    expect(goal.kind).toBe('stars');
    expect(goal.missingStars).toBe(2);
    expect(goal.starProgress).toBeCloseTo(0.6);
  });

  test('locked rooms become an unlock goal, and a finished kingdom completes gracefully', () => {
    const locked = kingdomNextGoal({ kingdom: kingdomWith({ throne: 5 }, ['throne']), coins: 0, lifetimeStars: 0 });
    expect(locked.kind).toBe('unlock');
    expect(locked.roomId).toBe('library');
    expect(locked.missingStars).toBe(5);
    const kingdom = kingdomWith({ throne: 5, library: 5, garden: 5, armory: 5, gatehouse: 5, chapel: 5 });
    kingdom.completedRooms = ['throne', 'library', 'garden', 'armory', 'gatehouse', 'chapel'];
    const complete = kingdomNextGoal({ kingdom, coins: 0, lifetimeStars: 0 });
    expect(complete.kind).toBe('complete');
    expect(complete.canRenovate).toBe(false);
  });

  test('room view reports the real blocker instead of hiding it behind a null plan', () => {
    const view = kingdomView({ kingdom: kingdomWith({ throne: 1 }), coins: 0, lifetimeStars: 0 });
    expect(view.rooms[0].blockedBy).toBe('stars_required');
  });
});

describe('post-win kingdom payoff client', () => {
  test('renders rewards, unlocks, progress, and a renovate action without innerHTML', () => {
    const { document } = parseHTML('<html><body><div id="host"></div></body></html>');
    const api = loadClient();
    const host = document.getElementById('host');
    const calls: string[] = [];
    const payload = {
      coins: 200,
      lifetimeStars: 5,
      result: { rewards: [{ type: 'currency', currencyId: 'coins', amount: 25 }, { type: 'currency', currencyId: 'stars', amount: 3 }], justUnlocked: ['library'] },
      kingdomData: {
        kingdom: { rooms: [{ id: 'library', name: 'Royal Library' }] },
        nextGoal: { kind: 'renovate', roomId: 'throne', roomName: 'Throne Hall', targetLevel: 1, costCoins: 200, starsRequired: 0, missingCoins: 0, missingStars: 0, coinProgress: 1, starProgress: 1, canRenovate: true, milestone: { itemId: 'blast' } },
      },
    };
    const section = api.render(host, payload, { renovate: (id: string) => calls.push(`renovate:${id}`), openKingdom: () => calls.push('open') });
    expect(section.textContent).toContain('+25 coins');
    expect(section.textContent).toContain('New room unlocked: Royal Library');
    expect(section.querySelector('.kingdom-payoff-renovate').textContent).toContain('200 coins');
    section.querySelector('.kingdom-payoff-renovate').dispatchEvent(new (document.defaultView as any).Event('click'));
    section.querySelector('.kingdom-payoff-open').dispatchEvent(new (document.defaultView as any).Event('click'));
    expect(calls).toEqual(['renovate:throne', 'open']);
    expect(host.querySelectorAll('[data-kingdom-payoff]')).toHaveLength(1);
  });

  test('a non-ready goal explains the exact missing coins or stars', () => {
    const api = loadClient();
    expect(api.goalCopy({ kind: 'coins', roomName: 'Throne Hall', targetLevel: 2, missingCoins: 300, missingStars: 0, canRenovate: false }).detail).toContain('300 more coins');
    expect(api.goalCopy({ kind: 'stars', roomName: 'Throne Hall', targetLevel: 2, missingCoins: 0, missingStars: 2, canRenovate: false }).detail).toContain('2 more lifetime stars');
    expect(api.goalCopy({ kind: 'complete' }).title).toBe('Kingdom complete');
  });

  test('wiring loads the payoff module and connects it to the result screen and shell', () => {
    const html = fs.readFileSync('index.html', 'utf8');
    const phaser = fs.readFileSync('phaser3-game.js', 'utf8');
    const ui = fs.readFileSync('public/js/player-experience.js', 'utf8');
    const sw = fs.readFileSync('public/sw.js', 'utf8');
    expect(html.indexOf('src="js/kingdom-payoff.js"')).toBeLessThan(html.indexOf('src="phaser3-game.js"'));
    expect(phaser).toContain('void this.showKingdomPayoff()');
    expect(phaser).toContain('\'/api/kingdom/renovate\'');
    expect(ui).toContain('renderKingdomPayoff');
    expect(sw).toContain('\'/js/kingdom-payoff.js\'');
  });
});
