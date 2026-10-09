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

function loadGameClass(rng: () => number) {
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
  return (sandbox.window as { PhaserMatch3Game: any }).PhaserMatch3Game;
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
  return s;
}

function makeGame(seed = 1) {
  const rng = seeded(seed);
  const Ctor = loadGameClass(rng);
  const game: any = Object.create(Ctor.prototype);
  const scene = {
    add: { image: (x: number, y: number, key: string) => makeSprite(x, y, key) },
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
});
