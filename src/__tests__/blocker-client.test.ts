import { describe, expect, test } from '@jest/globals';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Client presentation for v6 blockers: named cells, goal labels, and the phaser overlay.
// Pure functions only. No browser, no simulation, no speech.

function sandboxWith(files: string[]) {
  const sandbox: any = {
    console: { log() {}, info() {}, error() {}, warn() {} },
    navigator: {}, Intl, Date, URLSearchParams, AbortSignal,
    setTimeout: () => 1, clearTimeout() {}, setInterval: () => 1, clearInterval() {},
    localStorage: { getItem: () => null, setItem() {} },
    document: { readyState: 'loading', addEventListener() {}, getElementById: () => null },
    addEventListener() {},
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  for (const file of files) vm.runInContext(readFileSync(file, 'utf8'), sandbox, { filename: file });
  return sandbox;
}

function boardGame(blockers: number[][] | null) {
  const value: any = {
    boardSize: 3, board: [['red', 'blue', 'green'], ['yellow', 'purple', 'orange'], ['red', 'blue', 'green']],
    specials: [[null, null, null], [null, null, null], [null, null, null]], shields: null, blockers,
    canInteractWithBoard: () => true, usesEarnedSpecials: () => true, hintCells: null, selectedGem: null,
  };
  value.gemSprites = value.board.map((line: string[], row: number) => line.map((type: string, col: number) => ({ getData: (key: string) => ({ row, col, type } as any)[key] })));
  return value;
}

describe('assistive names for blocked cells', () => {
  const sandbox = sandboxWith(['public/js/player-experience.js', 'public/js/assistive-board.js']);
  const api = sandbox.InfiniteAssistiveBoard;

  test('a blocked cell is named, with the rule for clearing it', () => {
    const game = boardGame([[0, 1, 0], [0, 0, 0], [0, 0, 0]]);
    const info = api.describeCell(game, 0, 1);
    expect(info.blocker).toBe(1);
    expect(info.label).toContain('blocked: a match on this cell removes the blocker');
    expect(api.describeCell(game, 0, 0).blocker).toBe(0);
    expect(api.describeCell(game, 0, 0).label).not.toContain('blocked');
  });

  test('a board without blockers (v2-v5) keeps its names unchanged', () => {
    const game = boardGame(null);
    expect(api.describeCell(game, 0, 1).label).not.toContain('blocked');
    expect(api.describeCell(game, 0, 1).blocker).toBe(0);
  });
});

describe('phaser blocker overlay', () => {
  const files = ['public/js/procedural-levels.js', 'public/js/level-location.js', 'public/js/sound-effects.js',
    'public/js/player-experience.js', 'public/js/assistive-board.js', 'public/js/match-feedback.js', 'phaser3-game.js'];
  const sandbox = sandboxWith(files);

  function recordingGame(blockers: number[][] | null) {
    const calls: string[] = [];
    let created = 0;
    const layer: any = { active: true };
    for (const name of ['fillStyle', 'lineStyle', 'setDepth']) layer[name] = () => layer;
    layer.clear = () => { calls.push('clear'); return layer; };
    layer.fillRoundedRect = () => { calls.push('fill'); return layer; };
    layer.strokeRoundedRect = () => { calls.push('stroke'); return layer; };
    const game: any = Object.create(sandbox.PhaserMatch3Game.prototype);
    Object.assign(game, {
      blockers, gemSize: 50, cellX: (col: number) => col * 50, cellY: (row: number) => row * 50,
      scene: { add: { graphics: () => { created++; return layer; } } },
    });
    return { game, calls, created: () => created };
  }

  test('v2-v5 boards (no blockers) create no overlay and touch no scene graphics', () => {
    const { game, calls, created } = recordingGame(null);
    game.renderBlockers();
    expect(created()).toBe(0);
    expect(calls).toEqual([]);
  });

  test('each blocked cell gets one filled, outlined tile; the layer is cleared first', () => {
    const { game, calls, created } = recordingGame([[0, 1, 0], [0, 0, 0], [0, 0, 1]]);
    game.renderBlockers();
    expect(created()).toBe(1);
    expect(calls).toEqual(['clear', 'fill', 'stroke', 'fill', 'stroke']);
  });

  test('clearing every blocker leaves an empty overlay, not a stale one', () => {
    const { game, calls } = recordingGame([[0, 0, 0], [0, 0, 0], [0, 0, 0]]);
    game.renderBlockers();
    expect(calls).toEqual(['clear']);
  });

  test('the phaser source describes blockers as an overlay, not a gem change', () => {
    const code = readFileSync('phaser3-game.js', 'utf8');
    expect(code).toContain('blockers are an overlay');
    expect(code).toContain('this.blockers = result.blockers');
  });
});

describe('match feedback names blocker clears', () => {
  const sandbox = sandboxWith(['public/js/player-experience.js', 'public/js/match-feedback.js']);
  const { waveLabel } = sandbox.InfiniteMatchFeedback;
  const wave = (blockerHits?: any[]) => ({ combo: null, created: [], activated: [], points: 10, cleared: [], shieldHits: [], ...(blockerHits ? { blockerHits } : {}) });

  test('one blocker cleared in a wave is announced once', () => {
    expect(waveLabel(wave([{ row: 0, col: 1 }]), 0, 1)).toContain(' · 1 blocker cleared · ');
  });

  test('several blockers cleared are announced with a plural', () => {
    expect(waveLabel(wave([{ row: 0, col: 1 }, { row: 2, col: 2 }]), 1, 3)).toContain('2 blockers cleared');
  });

  test('a wave without blocker hits (v2-v5) keeps its text', () => {
    expect(waveLabel(wave(), 0, 1)).toBe('Match · +10 points');
  });
});

describe('service worker cache is bumped for the changed client files', () => {
  test('the shell cache version moved past v1', () => {
    const sw = readFileSync('public/sw.js', 'utf8');
    expect(sw).toMatch(/const SHELL_VERSION = 'v[2-9]'/);
  });
});
