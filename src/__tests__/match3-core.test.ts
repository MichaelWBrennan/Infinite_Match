import { readFileSync } from 'fs';
import { resolve } from 'path';
import vm from 'vm';
import { describe, test, expect } from '@jest/globals';

// Loads the real browser script (phaser3-game.js) into a sandbox with no DOM
// or Phaser, and drives its match-3 core through a stub scene. Math.random is
// seeded so the random checks are repeatable.

function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function loadSandbox(rng: () => number): Record<string, any> {
  const code = readFileSync(resolve(process.cwd(), 'phaser3-game.js'), 'utf8');
  const sandboxMath = Object.create(Math);
  sandboxMath.random = rng;
  const sandbox: Record<string, unknown> = {
    window: {},
    console: { log() {}, warn() {}, error() {}, info() {} },
    navigator: {},
    Math: sandboxMath,
    setTimeout, clearTimeout, setInterval, clearInterval,
  };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: 'phaser3-game.js' });
  return sandbox;
}

function loadGameClass(rng: () => number) {
  const sandbox = loadSandbox(rng);
  const Ctor = (sandbox.window as { PhaserMatch3Game: any }).PhaserMatch3Game;
  // Tests reach the sandbox through the class, to stub fetch.
  (Ctor as any).sandbox = sandbox;
  return Ctor;
}

function makeSprite(x: number, y: number, key: string) {
  const s: any = { x, y, key, alpha: 1, visible: true, scale: 1, data: {} as Record<string, unknown> };
  s.setData = (k: string, v: unknown) => { s.data[k] = v; return s; };
  s.getData = (k: string) => s.data[k];
  s.setTexture = (k: string) => { s.key = k; return s; };
  s.setScale = (v: number) => { s.scale = v; return s; };
  s.setAlpha = (v: number) => { s.alpha = v; return s; };
  s.setVisible = (v: boolean) => { s.visible = v; return s; };
  s.setPosition = (px: number, py: number) => { s.x = px; s.y = py; return s; };
  s.setInteractive = () => s;
  s.on = () => s;
  s.setTint = () => s;
  s.clearTint = () => s;
  s.setDisplaySize = () => s;
  s.setOrigin = () => s;
  s.setText = (t: string) => { s.text = t; return s; };
  return s;
}

function makeGame(seed = 1) {
  const rng = seeded(seed);
  const Ctor = loadGameClass(rng);
  const game: any = Object.create(Ctor.prototype);
  const scene = {
    add: {
      image: (x: number, y: number, key: string) => makeSprite(x, y, key),
      text: (x: number, y: number, text: string) => makeSprite(x, y, text),
    },
    // Tweens apply their end position immediately so sprite positions are testable.
    tweens: {
      add: (cfg: any) => {
        // Yoyo tweens (the refused-swap shake) return to their start, so skip them.
        if (cfg.targets && cfg.x !== undefined && !cfg.yoyo) {
          cfg.targets.x = cfg.x;
          cfg.targets.y = cfg.y;
        }
        return {};
      },
      killTweensOf: () => {},
    },
  };
  Object.assign(game, {
    scene,
    boardSize: 8,
    gemTypes: ['red', 'blue', 'green', 'yellow', 'purple', 'orange'],
    score: 0,
    moves: 30,
    time: 60,
    targetScore: 1000,
    isGameRunning: true,
    isPaused: false,
    settings: { sfx: false },
    endCalls: 0,
    scoreText: { setText() {} },
  });
  Object.assign(game, {
    endGame() { game.endCalls++; game.isGameRunning = false; },
    showScorePopup() {},
    checkAchievements() {},
    playSound() {},
    updateUI() {},
    trackEvent() {},
  });
  game.createGameBoard();
  game.createPowerUps();
  game.setupInput();
  return game;
}

// Checks every invariant the board must hold between moves.
function assertBoardInvariants(game: any) {
  const n = game.boardSize;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const type = game.board[r][c];
      expect(type).not.toBeNull();
      const sprite = game.gemSprites[r][c];
      expect(sprite.key).toBe(`gem_${type}`);
      expect(sprite.getData('type')).toBe(type);
      expect(sprite.getData('row')).toBe(r);
      expect(sprite.getData('col')).toBe(c);
      expect(sprite.x).toBe(game.cellX(c));
      expect(sprite.y).toBe(game.cellY(r));
    }
  }
  expect(game.findMatches().size).toBe(0);
}

function findSwap(game: any, wantMatch: boolean): [number, number, number, number] | null {
  const n = game.boardSize;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      for (const [dr, dc] of [[0, 1], [1, 0]]) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= n || nc >= n) continue;
        game.swapModel(r, c, nr, nc);
        const ok = game.findMatches().size > 0;
        game.swapModel(r, c, nr, nc);
        if (ok === wantMatch) return [r, c, nr, nc];
      }
    }
  }
  return null;
}

describe('match-3 core', () => {
  test('a new board starts with no formed matches and sprites mirror the model', () => {
    for (const seed of [1, 2, 3, 42]) {
      assertBoardInvariants(makeGame(seed));
    }
  });

  test('findMatches finds runs of three horizontally and vertically, not pairs', () => {
    const game = makeGame(7);
    game.board = Array.from({ length: 8 }, () => new Array(8).fill('red'));
    expect(game.findMatches().size).toBe(64);

    const g2 = makeGame(7);
    g2.board = Array.from({ length: 8 }, (_, r) =>
      Array.from({ length: 8 }, (_, c) => (c === 0 && r < 3 ? 'red' : (r === 7 && c < 2 ? 'blue' : 'green'))),
    );
    const found = g2.findMatches();
    expect(found.has('0,0')).toBe(true);
    expect(found.has('2,0')).toBe(true);
    expect(found.has('7,0')).toBe(false); // a pair of blues is not a match
  });

  test('a refused swap leaves the board and move count untouched', () => {
    const game = makeGame(3);
    const before = game.board.map((row: string[]) => row.slice());
    const [r1, c1, r2, c2] = findSwap(game, false)!;
    game.trySwap(r1, c1, r2, c2);
    expect(game.board).toEqual(before);
    expect(game.moves).toBe(30);
    expect(game.score).toBe(0);
  });

  test('a valid swap spends a move, scores, and leaves a stable board', () => {
    const game = makeGame(5);
    const [r1, c1, r2, c2] = findSwap(game, true)!;
    game.trySwap(r1, c1, r2, c2);
    expect(game.moves).toBe(29);
    expect(game.score).toBeGreaterThan(0);
    assertBoardInvariants(game);
  });

  test('selecting two adjacent gems swaps them; non-adjacent taps move the selection', () => {
    const game = makeGame(9);
    const [r1, c1, r2, c2] = findSwap(game, true)!;
    game.selectGem(game.gemSprites[r1][c1]);
    game.selectGem(game.gemSprites[r2][c2]);
    expect(game.moves).toBe(29);
    assertBoardInvariants(game);

    const g2 = makeGame(9);
    g2.selectGem(g2.gemSprites[0][0]);
    g2.selectGem(g2.gemSprites[5][5]);
    expect(g2.selectedGem).toBe(g2.gemSprites[5][5]);
    expect(g2.moves).toBe(30);
  });

  test('the game ends when the moves run out', () => {
    const game = makeGame(11);
    game.moves = 1;
    const [r1, c1, r2, c2] = findSwap(game, true)!;
    game.trySwap(r1, c1, r2, c2);
    expect(game.moves).toBe(0);
    expect(game.endCalls).toBe(1);
  });

  test('collapse keeps survivor order, moves their sprites down, and refills the top', () => {
    const game = makeGame(13);
    const col = 3;
    // Column 3 top to bottom: a b _ c d _ e f (gaps at rows 2 and 5).
    const labels = ['a', 'b', null, 'c', 'd', null, 'e', 'f'];
    labels.forEach((t, r) => { game.board[r][col] = t; });
    const survivorSprites: Record<string, any> = {};
    labels.forEach((t, r) => { if (t) survivorSprites[t] = game.gemSprites[r][col]; });
    const colZeroBefore = game.board.map((row: string[]) => row[0]);

    game.collapseColumns();

    // Survivors sink, keeping their top-to-bottom order: a b c d e f ends at rows 2..7.
    expect(game.board[7][col]).toBe('f');
    expect(game.board[6][col]).toBe('e');
    expect(game.board[5][col]).toBe('d');
    expect(game.board[4][col]).toBe('c');
    expect(game.board[3][col]).toBe('b');
    expect(game.board[2][col]).toBe('a');
    // Sprites travel with their gems.
    expect(game.gemSprites[7][col]).toBe(survivorSprites.f);
    expect(game.gemSprites[2][col]).toBe(survivorSprites.a);
    // The two freed top cells are refilled with real gems.
    expect(game.board[0][col]).toBeTruthy();
    expect(game.board[1][col]).toBeTruthy();
    // Other columns are not disturbed.
    game.board.forEach((row: string[], r: number) => expect(row[0]).toBe(colZeroBefore[r]));
    for (const row of game.board) for (const cell of row) expect(cell).not.toBeNull();
  });

  test('a random sequence of swaps and power-ups keeps every invariant', () => {
    const game = makeGame(2024);
    game.targetScore = Number.POSITIVE_INFINITY;
    game.moves = 1_000_000;
    const picker = seeded(99);
    let lastScore = 0;

    for (let step = 0; step < 300; step++) {
      game.isGameRunning = true;
      const roll = picker();
      if (roll < 0.1) {
        game.activateBomb();
      } else if (roll < 0.15) {
        game.activateLightning();
      } else if (roll < 0.17) {
        game.activateRainbow();
      } else {
        const r = Math.floor(picker() * 8);
        const c = Math.floor(picker() * 8);
        const horizontal = picker() < 0.5;
        const nr = horizontal ? r : Math.min(7, r + 1);
        const nc = horizontal ? Math.min(7, c + 1) : c;
        if (nr === r && nc === c) continue;
        game.trySwap(r, c, nr, nc);
      }
      assertBoardInvariants(game);
      expect(game.score).toBeGreaterThanOrEqual(lastScore);
      lastScore = game.score;
      expect(game.hasPossibleMove()).toBe(true);
    }
    expect(game.score).toBeGreaterThan(0);
  });

  describe('targeted power-ups', () => {
    test('target clears the tapped gem and its four neighbours', () => {
      const game = makeGame(21);
      expect(game.powerUpKeys('target', 4, 4).size).toBe(5);
      expect(game.powerUpKeys('target', 0, 0).size).toBe(3);
      expect(game.powerUpKeys('target', 4, 4).has('3,4')).toBe(true);
    });

    test('star clears the whole row and column of the tapped gem', () => {
      const game = makeGame(22);
      const keys = game.powerUpKeys('star', 3, 4);
      expect(keys.size).toBe(15); // 8 + 8 - 1 shared cell
      expect(keys.has('3,0')).toBe(true);
      expect(keys.has('7,4')).toBe(true);
      expect(keys.has('0,0')).toBe(false);
    });

    test('diamond clears every gem of the tapped colour', () => {
      const game = makeGame(23);
      const colour = game.board[2][5];
      let expected = 0;
      for (const row of game.board) for (const cell of row) if (cell === colour) expected++;
      const keys = game.powerUpKeys('diamond', 2, 5);
      expect(keys.size).toBe(expected);
      for (const key of keys) {
        const [r, c] = key.split(',').map(Number);
        expect(game.board[r][c]).toBe(colour);
      }
    });

    test('arming then tapping a gem fires once, spends the charge, and keeps the board valid', () => {
      const game = makeGame(24);
      const before = game.moves;
      game.usePowerUp('target');
      expect(game.armedPowerUp).toBe('target');
      game.selectGem(game.gemSprites[4][4]);
      expect(game.armedPowerUp).toBeNull();
      expect(game.powerButtons.target.btn.getData('count')).toBe(0);
      expect(game.moves).toBe(before); // power-ups do not spend a move
      assertBoardInvariants(game);
    });

    test('a spent targeted power-up cannot be armed again', () => {
      const game = makeGame(25);
      game.usePowerUp('star');
      game.selectGem(game.gemSprites[1][1]);
      game.usePowerUp('star');
      expect(game.armedPowerUp).toBeNull();
    });

    test('pressing an armed power-up again disarms it', () => {
      const game = makeGame(26);
      game.usePowerUp('diamond');
      game.usePowerUp('diamond');
      expect(game.armedPowerUp).toBeNull();
      expect(game.powerButtons.diamond.btn.getData('count')).toBe(1);
    });

    test('random targeted power-up use keeps every invariant', () => {
      const game = makeGame(27);
      game.targetScore = Number.POSITIVE_INFINITY;
      game.moves = 1_000_000;
      const picker = seeded(7);
      const types = ['diamond', 'target', 'star'];
      for (let step = 0; step < 120; step++) {
        game.isGameRunning = true;
        const type = types[Math.floor(picker() * 3)];
        game.powerButtons[type].btn.setData('count', 1);
        game.usePowerUp(type);
        const r = Math.floor(picker() * 8);
        const c = Math.floor(picker() * 8);
        game.selectGem(game.gemSprites[r][c]);
        expect(game.armedPowerUp).toBeNull();
        assertBoardInvariants(game);
      }
    });
  });
});

describe('levels', () => {
  const sandbox = loadSandbox(seeded(1));

  test('targets grow with the level number', () => {
    let previous = 0;
    for (let n = 1; n <= 1200; n++) {
      const { targetScore } = sandbox.levelConfig(n);
      if (!sandbox.levelConfig(n).isBoss) {
        expect(targetScore).toBeGreaterThan(previous);
        previous = targetScore;
      }
    }
  });

  test('every tenth level is a boss with a doubled target and fewer moves', () => {
    const normal = sandbox.levelConfig(9);
    const boss = sandbox.levelConfig(10);
    expect(boss.isBoss).toBe(true);
    expect(boss.targetScore).toBeGreaterThan(sandbox.levelConfig(11).targetScore);
    expect(boss.moves).toBeLessThan(normal.moves);
  });

  test('moves never drop below twelve, so there is no cap on level count', () => {
    for (const n of [1, 100, 500, 1000, 5000, 100000]) {
      expect(sandbox.levelConfig(n).moves).toBeGreaterThanOrEqual(12);
    }
    expect(sandbox.levelConfig(100000).targetScore).toBeGreaterThan(sandbox.levelConfig(1000).targetScore);
  });

  test('the daily challenge is the same for everyone on a given day', () => {
    const a = sandbox.dailyChallengeLevel('2026-10-09');
    const b = sandbox.dailyChallengeLevel('2026-10-09');
    expect(a).toEqual(b);
    expect(a.isDaily).toBe(true);
    expect(sandbox.dailyChallengeLevel('2026-10-10')).not.toEqual(a);
  });

  test('selectLevel applies the level target and move limit', () => {
    const game = makeGame(31);
    game.restartGame = () => {};
    game.selectLevel(20);
    expect(game.level).toBe(20);
    expect(game.targetScore).toBe(sandbox.levelConfig(20).targetScore);
    expect(game.moves).toBe(sandbox.levelConfig(20).moves);
    expect(game.isBossLevel).toBe(true);
  });

  test('stars are relative to the level target', () => {
    const game = makeGame(32);
    game.targetScore = 1000;
    expect(game.starsFor(999)).toBe(0);
    expect(game.starsFor(1000)).toBe(1);
    expect(game.starsFor(1500)).toBe(2);
    expect(game.starsFor(2000)).toBe(3);
  });

  describe('power-ups and the server inventory', () => {
    const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

    function signedIn(game: any, inventory: Record<string, { count: number }>) {
      game.getAuthToken = () => 'test-token';
      game.constructor.sandbox.fetch = async () => ({
        ok: true,
        json: async () => ({ data: { inventory: { powerups: inventory } } }),
      });
    }

    test('signed-in counts load from the server inventory', async () => {
      const game = makeGame(41);
      signedIn(game, { bomb: { count: 7 }, diamond: { count: 2 } });
      await game.syncPowerUpInventory();
      expect(game.bombBtn.getData('count')).toBe(7);
      expect(game.powerButtons.diamond.btn.getData('count')).toBe(2);
    });

    test('guests keep local counts and make no request', async () => {
      const game = makeGame(42);
      let called = false;
      game.constructor.sandbox.fetch = async () => { called = true; throw new Error('no'); };
      await game.syncPowerUpInventory();
      expect(called).toBe(false);
      expect(game.bombBtn.getData('count')).toBe(3);
    });

    test('a power-up takes effect only after the server confirms the spend', async () => {
      const game = makeGame(43);
      signedIn(game, { bomb: { count: 3 } });
      let confirm: (ok: boolean) => void = () => {};
      game.consumePowerUpOnServer = () => new Promise((resolve) => { confirm = resolve; });
      const scoreBefore = game.score;

      game.usePowerUp('bomb');
      expect(game.bombBtn.getData('count')).toBe(3); // not spent yet
      expect(game.score).toBe(scoreBefore);

      confirm(true);
      await flush();
      expect(game.bombBtn.getData('count')).toBe(2);
      expect(game.score).toBeGreaterThan(scoreBefore);
      expect(game.powerUpPending).toBe(false);
    });

    test('a refused spend changes nothing and resyncs the count', async () => {
      const game = makeGame(44);
      signedIn(game, { bomb: { count: 0 } });
      game.consumePowerUpOnServer = async () => false;
      const scoreBefore = game.score;

      game.usePowerUp('bomb');
      await flush();
      expect(game.score).toBe(scoreBefore);
      expect(game.bombBtn.getData('count')).toBe(0);
    });

    test('input is blocked while a server check is pending', async () => {
      const game = makeGame(45);
      signedIn(game, { bomb: { count: 3 } });
      let confirm: (ok: boolean) => void = () => {};
      game.consumePowerUpOnServer = () => new Promise((resolve) => { confirm = resolve; });
      game.usePowerUp('bomb');
      game.usePowerUp('bomb'); // ignored while pending
      confirm(true);
      await flush();
      expect(game.bombBtn.getData('count')).toBe(2);
    });
  });
});

