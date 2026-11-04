import { describe, expect, jest, test } from '@jest/globals';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('public/js/game-feel.js', 'utf8');
function helpers() {
  const sandbox: any = { console };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  return sandbox.InfiniteGameFeel;
}

function mockScene() {
  const objects: any[] = [];
  const tweens: any[] = [];
  const make = (kind: string) => {
    const object: any = { kind, destroyed: false, setDepth() { return object; }, setStrokeStyle() { return object; },
      fillStyle() { return object; }, fillRoundedRect() { return object; },
      destroy() { object.destroyed = true; } };
    objects.push(object);
    return object;
  };
  return {
    objects, tweens,
    add: { circle: () => make('circle'), rectangle: () => make('rectangle'), graphics: () => make('graphics') },
    tweens: { add: (config: any) => { tweens.push(config); return config; }, killTweensOf: () => {} },
    cameras: { main: { shake: jest.fn() } },
    events: { once: () => {}, off: () => {} },
  };
}

function mockGame(scene: any, overrides: any = {}) {
  return {
    scene, isGameRunning: true, isPaused: false, boardSize: 6, cellStep: 50,
    cellX: (col: number) => col * 50, cellY: (row: number) => row * 50,
    settings: { impactEffects: true, haptics: true, textBoard: false },
    animationsReduced: () => false, playerUI: null, ...overrides,
  };
}

function mockEnvironment() {
  const handlers = new Map<string, Set<any>>();
  const vibrate = jest.fn();
  let time = 0;
  const document = { hidden: false, addEventListener: (type: string, fn: any) => {
    if (!handlers.has(type)) handlers.set(type, new Set()); handlers.get(type)!.add(fn);
  }, removeEventListener: (type: string, fn: any) => handlers.get(type)?.delete(fn) };
  return { document, navigator: { vibrate }, performance: { now: () => time },
    matchMedia: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }),
    addEventListener: () => {}, removeEventListener: () => {},
    advance: (ms: number) => { time += ms; }, vibrate };
}

describe('bounded deterministic game-feel plans', () => {
  test('intensity escalates with cascade depth and special activations but stays capped', () => {
    const api = helpers();
    const plain = api.intensityFor({ cleared: ['0,0', '0,1', '0,2'] }, 0, 1);
    const cascade = api.intensityFor({ cleared: ['0,0', '0,1', '0,2'] }, 3, 4);
    const combo = api.intensityFor({ combo: 'prism+burst', activated: [{ type: 'prism' }], cleared: Array(12).fill('0,0') }, 4, 5);
    expect(plain.level).toBe(0);
    expect(cascade.level).toBeGreaterThan(plain.level);
    expect(combo.level).toBe(4);
    expect(combo.particles).toBeLessThanOrEqual(28);
    expect(combo.shakeMs).toBeLessThanOrEqual(160);
    expect(combo.shakeStrength).toBeLessThanOrEqual(0.006);
    expect(api.intensityFor({}, 999, 999).level).toBeLessThanOrEqual(4);
  });

  test('haptic patterns are short, explicit, and capped', () => {
    const api = helpers();
    for (const kind of api.Kinds) {
      const pattern = api.hapticFor({ kind, level: 4 });
      expect(Array.isArray(pattern)).toBe(true);
      expect(pattern.reduce((sum: number, value: number) => sum + value, 0)).toBeLessThanOrEqual(160);
      expect(pattern.every((value: number) => value >= 0 && value <= 60)).toBe(true);
    }
  });

  test('source is presentation-only: no gameplay RNG, network, or asset loading', () => {
    expect(source).not.toMatch(/Math\.random|nextRandom|fetch\(|XMLHttpRequest|new Image|\.load\.audio|localStorage|saveUserData/);
  });
});

describe('opt-in, reduced-motion-safe runtime', () => {
  test('creates no effects while reduced motion, text board, pause, hidden tab, or impactEffects off', () => {
    const api = helpers();
    for (const overrides of [
      { animationsReduced: () => true },
      { settings: { impactEffects: true, haptics: true, textBoard: true } },
      { isPaused: true },
      { settings: { impactEffects: false, haptics: true, textBoard: false } },
    ]) {
      const scene = mockScene(); const env = mockEnvironment();
      const feel = api.create(mockGame(scene, overrides), env);
      feel.wave({ cleared: ['0,0', '1,1', '2,2'], activated: [{ type: 'burst', row: 1, col: 1 }] }, 2, 3);
      expect(scene.objects).toHaveLength(0);
      expect(scene.cameras.main.shake).not.toHaveBeenCalled();
    }
    const scene = mockScene(); const env = mockEnvironment(); env.document.hidden = true;
    const feel = api.create(mockGame(scene), env);
    feel.wave({ cleared: ['0,0'] }, 0, 1);
    expect(scene.objects).toHaveLength(0);
  });

  test('haptics require explicit opt-in and are throttled', () => {
    const api = helpers(); const scene = mockScene(); const env = mockEnvironment();
    const game = mockGame(scene, { settings: { impactEffects: true, haptics: false, textBoard: false } });
    const feel = api.create(game, env);
    feel.wave({ cleared: ['0,0'] }, 0, 1);
    expect(env.vibrate).not.toHaveBeenCalled();
    game.settings.haptics = true;
    feel.wave({ cleared: ['0,0'] }, 0, 1);
    expect(env.vibrate).toHaveBeenCalledTimes(1);
    feel.wave({ cleared: ['0,0'] }, 0, 1);
    expect(env.vibrate).toHaveBeenCalledTimes(1);
    env.advance(api.HAPTIC_GAP_MS + 1);
    feel.wave({ cleared: ['0,0'] }, 0, 1);
    expect(env.vibrate).toHaveBeenCalledTimes(2);
  });

  test('active presentation objects stay bounded and destroy releases them', () => {
    const api = helpers(); const scene = mockScene(); const env = mockEnvironment();
    const feel = api.create(mockGame(scene), env);
    for (let i = 0; i < 40; i++) {
      feel.wave({ cleared: Array.from({ length: 12 }, (_, cell) => `${cell % 6},${Math.floor(cell / 6)}`),
        activated: [{ type: 'prism', row: 0, col: 0 }] }, i % 5, 5);
    }
    expect(feel.status().active).toBeLessThanOrEqual(api.MAX_PARTICLES);
    feel.destroy();
    expect(feel.status().active).toBe(0);
    expect(scene.objects.every((object: any) => object.destroyed)).toBe(true);
  });

  test('wiring loads game-feel before the game and connects it to staged feedback, pause, and teardown', () => {
    const html = fs.readFileSync('index.html', 'utf8');
    const phaser = fs.readFileSync('phaser3-game.js', 'utf8');
    const feedback = fs.readFileSync('public/js/match-feedback.js', 'utf8');
    const worker = fs.readFileSync('public/sw.js', 'utf8');
    expect(html.indexOf('src="js/game-feel.js"')).toBeLessThan(html.indexOf('src="phaser3-game.js"'));
    expect(phaser).toContain('window.InfiniteGameFeel?.create(this)');
    expect(phaser).toContain('this.gameFeel?.destroy()');
    expect(phaser).toContain('this.gameFeel?.reset()');
    expect(feedback).toContain('game.gameFeel?.wave?.(event, index, run.plan.total, visual.before)');
    expect(worker).toContain("'/js/game-feel.js'");
  });
});
