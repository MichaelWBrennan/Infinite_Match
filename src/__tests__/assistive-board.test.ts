import { describe, expect, test } from '@jest/globals';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function helpers() {
  const sandbox: any = {};
  vm.createContext(sandbox);
  for (const file of ['public/js/player-experience.js', 'public/js/assistive-board.js']) vm.runInContext(readFileSync(file, 'utf8'), sandbox, { filename: file });
  return { api: sandbox.InfiniteAssistiveBoard, experience: sandbox.InfinitePlayerExperience };
}

function game() {
  const value: any = { boardSize: 3, board: [['red', 'blue', 'green'], ['yellow', 'purple', 'orange'], ['red', 'blue', 'green']],
    specials: [[null, 'row', 'column'], ['burst', 'prism', null], [null, null, null]], canInteractWithBoard: () => true,
    usesEarnedSpecials: () => true, calls: [] as any[] };
  value.gemSprites = value.board.map((line: string[], row: number) => line.map((type: string, col: number) => ({ getData: (key: string) => ({ row, col, type } as any)[key] })));
  value.selectGem = (...args: any[]) => value.calls.push(['select', ...args]);
  value.activateEarnedSpecial = (...args: any[]) => { value.calls.push(['activate', ...args]); return { score: 30 }; };
  return value;
}

describe('pure semantic cell names and grid navigation', () => {
  test.each([
    ['red', 'heart', 'R'], ['blue', 'diamond', 'B'], ['green', 'square', 'G'],
    ['yellow', 'triangle', 'Y'], ['purple', 'hexagon', 'P'], ['orange', 'star', 'O'],
  ])('%s cells have coordinate, color and non-color identity', (type, shape, symbol) => {
    const { api } = helpers(); const g = game(); g.board[0][0] = type;
    const info = api.describeCell(g, 0, 0);
    expect(info.label).toBe(`Row 1, column 1: ${type} ${shape} gem`);
    expect(info.symbol).toBe(symbol); expect(info.selected).toBe(false); expect(info.hinted).toBe('');
  });

  test('each special has its distinct full name without replacing base gem identity', () => {
    const { api } = helpers(); const g = game();
    for (const [row, col, type, shape, name] of [[0, 1, 'blue', 'diamond', 'Row Beam'], [0, 2, 'green', 'square', 'Column Beam'],
      [1, 0, 'yellow', 'triangle', 'Burst'], [1, 1, 'purple', 'hexagon', 'Prism']] as const) {
      expect(api.describeCell(g, row, col).label).toBe(`Row ${row + 1}, column ${col + 1}: ${type} ${shape}, ${name}`);
    }
  });

  test('selected and both hint endpoints are named, including single-special activation hints', () => {
    const { api } = helpers(); const g = game(); g.selectedGem = g.gemSprites[0][0]; g.hintCells = [0, 0, 0, 1];
    expect(api.describeCell(g, 0, 0).label).toMatch(/selected, hint start$/);
    expect(api.describeCell(g, 0, 1).label).toMatch(/hint partner$/);
    expect(api.describeCell(g, 1, 2).hinted).toBe('');
    g.hintCells = [1, 1]; expect(api.describeCell(g, 1, 1).label).toMatch(/Prism, hint activation$/);
  });

  test('naming repeatedly observes, never mutates a board, selection or hints', () => {
    const { api } = helpers(); const g = game(); g.hintCells = [0, 0, 0, 1];
    const before = JSON.stringify(g);
    for (let index = 0; index < 10; index++) for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) api.describeCell(g, row, col);
    expect(JSON.stringify(g)).toBe(before); expect(g.calls).toEqual([]);
    expect(api.describeCell(g, 10, 10)).toBeNull(); g.board[0][0] = 'unknown'; expect(api.describeCell(g, 0, 0)).toBeNull();
  });

  test.each([
    [0, 0, 'ArrowUp', false, [0, 0]], [7, 7, 'ArrowRight', false, [7, 7]],
    [3, 2, 'ArrowDown', false, [4, 2]], [3, 2, 'ArrowLeft', false, [3, 1]],
    [3, 2, 'Home', false, [3, 0]], [3, 2, 'End', false, [3, 7]],
    [3, 2, 'Home', true, [0, 0]], [3, 2, 'End', true, [7, 7]],
  ])('%s,%s %s (ctrl %s) moves focus only to %j', (row, col, key, ctrl, expected) => {
    const { api } = helpers(); expect(Array.from(api.navigationCell(row, col, key, 8, ctrl))).toEqual(expected);
  });

  test.each([0, -1, 9, 1.5, NaN])('invalid board size %s cannot navigate', (size) => {
    expect(helpers().api.navigationCell(0, 0, 'ArrowRight', size)).toBeNull();
  });
  test('invalid coordinates and inherited dictionary keys cannot produce phantom cells', () => {
    const { api } = helpers(); const g = game(); g.board[0][0] = '__proto__';
    expect(api.describeCell(g, 0, 0)).toBeNull(); expect(api.navigationCell(0, 0, '__proto__', 6)).toBeNull();
    expect(api.navigationCell(NaN, 1, 'Home', 6)).toBeNull(); expect(api.navigationCell(0.5, 1, 'End', 6)).toBeNull();
  });

  test('unknown/modified arrows remain browser commands; stale coordinates clamp', () => {
    const { api } = helpers();
    expect(api.navigationCell(1, 1, 'Enter', 6)).toBeNull(); expect(api.navigationCell(1, 1, 'ArrowDown', 6, true)).toBeNull();
    expect(Array.from(api.navigationCell(7, 7, 'End', 6))).toEqual([5, 5]);
  });
});

describe('semantic controls forward to the guarded Phaser methods only', () => {
  test('cell clicks select rather than unexpectedly fire a special, and focus is presentation-only', () => {
    const { api } = helpers(); const g = game();
    expect(api.interact(g, 0, 1)).toBe(true);
    expect(g.calls).toEqual([['select', g.gemSprites[0][1], { selectOnly: true }]]);
    expect(Array.from(g.keyboardCursor)).toEqual([0, 1]);
  });

  test('explicit activation uses the existing special transition exactly once', () => {
    const { api } = helpers(); const g = game(); expect(api.interact(g, 1, 1, true)).toBe(true);
    expect(g.calls).toEqual([['activate', 1, 1]]);
  });

  test.each([[0, 0, true], [3, 0, false], [-1, 1, false], [1.5, 1, false], [1, NaN, false]])('invalid action %j calls no core method', (row, col, activate) => {
    const { api } = helpers(); const g = game(); expect(api.interact(g, row, col, activate)).toBe(false); expect(g.calls).toEqual([]);
  });

  test('paused/pending/modal/settling guards cannot be bypassed by accessibility clicks', () => {
    const { api } = helpers(); const g = game(); g.canInteractWithBoard = () => false;
    expect(api.interact(g, 0, 1)).toBe(false); expect(api.interact(g, 0, 1, true)).toBe(false);
    expect(g.calls).toEqual([]); expect(g.keyboardCursor).toBeUndefined();
  });

  test('explicit special activation cannot fire an armed inventory booster, or a frozen plain-gem level', () => {
    const { api } = helpers(); const g = game(); g.armedPowerUp = 'target'; expect(api.interact(g, 0, 1, true)).toBe(false);
    g.armedPowerUp = null; g.usesEarnedSpecials = () => false; expect(api.interact(g, 0, 1, true)).toBe(false); expect(g.calls).toEqual([]);
  });

  test('stale/missing sprites are refused without gameplay calls', () => {
    const { api } = helpers(); const g = game();
    g.gemSprites[0][1] = g.gemSprites[0][2]; expect(api.interact(g, 0, 1)).toBe(false);
    g.gemSprites[0][1] = null; expect(api.interact(g, 0, 1)).toBe(false); expect(g.calls).toEqual([]);
  });

  test('the optional grid keeps older shells usable and is installed before game creation', () => {
    const { api } = helpers(); expect(api.mount({}, null, () => {})).toBeNull();
    const html = readFileSync('index.html', 'utf8'); expect(html.indexOf('src="js/assistive-board.js"')).toBeLessThan(html.indexOf('src="phaser3-game.js"'));
    const code = readFileSync('public/js/assistive-board.js', 'utf8');
    expect(code).not.toMatch(/fetch\(|Math\.random|randomGem|simulateLevelMove|SpeechSynthesis|speechSynthesis/);
  });
});
