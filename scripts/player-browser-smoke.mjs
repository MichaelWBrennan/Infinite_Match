#!/usr/bin/env node
// Real Chromium input/layout smoke. Run against a development server with a clean guest session.
// No login, checkout, rewards, GPS permission, or external weather provider is exercised here.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const url = process.env.BROWSER_QA_URL || 'http://127.0.0.1:3000/';
const executablePath = process.env.BROWSER_EXECUTABLE_PATH || chromium.executablePath();
if (!fs.existsSync(executablePath)) {
  throw new Error('Set BROWSER_EXECUTABLE_PATH to an installed Chromium/Chrome. See docs/PLAYER_EXPERIENCE.md. Browser binaries do not belong in Git.');
}
const output = path.resolve(process.env.BROWSER_QA_OUTPUT || 'var/browser-player-qa');
fs.mkdirSync(output, { recursive: true });
const args = ['--disable-dev-shm-usage'];
if (process.env.BROWSER_NO_SANDBOX === '1') args.push('--no-sandbox');
if (process.env.BROWSER_SINGLE_PROCESS === '1') args.push('--single-process', '--no-zygote');
const cases = [
  { name: 'phone', width: 390, height: 844, mobile: true, motion: 'reduce' },
  { name: 'narrow-phone', width: 320, height: 568, mobile: true, motion: 'reduce' },
  { name: 'small-phone', width: 360, height: 640, mobile: true, motion: 'no-preference' },
  { name: 'short-phone', width: 375, height: 667, mobile: true, motion: 'reduce' },
  { name: 'landscape', width: 844, height: 390, mobile: true, motion: 'no-preference' },
  { name: 'tablet', width: 768, height: 1024, mobile: true, motion: 'no-preference' },
  { name: 'desktop', width: 1440, height: 900, mobile: false, motion: 'no-preference' },
];
const results = [];

async function snapshot(page) {
  return page.evaluate(() => {
    const g = window.game;
    return { board: g.board, specials: g.specials, objectiveProgress: g.objectiveProgress, score: g.score, moves: g.moves, rng: g.levelRng.state,
      charges: Array.from(g.playerUI.powerups, ([type, slot]) => [type, slot.btn.getData('count')]) };
  });
}

async function checkFit(page) {
  await page.evaluate(() => new Promise((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(resolve))));
  const fit = await page.evaluate(() => {
    const g = window.game;
    const shell = g.playerUI.shell.getBoundingClientRect();
    const surface = g.playerUI.surface.getBoundingClientRect();
    const canvas = g.game.canvas.getBoundingClientRect();
    const camera = g.scene.cameras.main;
    const size = g.boardSize * g.cellStep * camera.zoom;
    const corner = (x, y) => {
      const point = camera.matrix.transformPoint(x - camera.scrollX, y - camera.scrollY);
      return { x: canvas.x + point.x * canvas.width / g.game.scale.gameSize.width,
        y: canvas.y + point.y * canvas.height / g.game.scale.gameSize.height };
    };
    const topLeft = corner(g.cellX(0) - g.cellStep / 2, g.cellY(0) - g.cellStep / 2);
    const bottomRight = corner(g.cellX(g.boardSize - 1) + g.cellStep / 2, g.cellY(g.boardSize - 1) + g.cellStep / 2);
    const board = { left: topLeft.x, top: topLeft.y, right: bottomRight.x, bottom: bottomRight.y };
    const announcement = g.playerUI.shell.querySelector('.match-player-announcement').getBoundingClientRect();
    const announcementCoversBoard = announcement.left < board.right && announcement.right > board.left
      && announcement.top < board.bottom && announcement.bottom > board.top;
    const goals = Array.from(g.playerUI.shell.querySelectorAll('.match-objective')).map((goal) => ({ ...goal.getBoundingClientRect().toJSON(),
      label: goal.getAttribute('aria-label'), textFits: goal.scrollWidth <= goal.clientWidth + 1 }));
    const buttons = Array.from(g.playerUI.shell.querySelectorAll('footer button'))
      .filter((button) => button.getClientRects().length)
      .map((button) => ({ name: button.textContent.trim(), ...button.getBoundingClientRect().toJSON() }));
    return { width: innerWidth, height: innerHeight, bodyWidth: document.body.scrollWidth,
      shell: shell.toJSON(), surface: surface.toJSON(), canvas: canvas.toJSON(), boardExtent: size, buttons, goals, board, announcementCoversBoard };
  });
  assert.ok(fit.bodyWidth <= fit.width + 1, 'no horizontal page overflow');
  assert.ok(fit.surface.width > 0 && fit.surface.height > 0, 'board has a viewport');
  assert.ok(fit.boardExtent <= Math.min(fit.surface.width, fit.surface.height) + 1, 'entire board fits');
  assert.ok(fit.surface.bottom <= fit.height + 1, 'board is visible vertically');
  assert.ok(fit.board.left >= fit.surface.left - 1 && fit.board.right <= fit.surface.right + 1
    && fit.board.top >= fit.surface.top - 1 && fit.board.bottom <= fit.surface.bottom + 1, 'rendered board corners are not clipped');
  assert.equal(fit.announcementCoversBoard, false, 'goal announcements cannot cover puzzle cells');
  for (const goal of fit.goals) {
    assert.ok(goal.left >= -1 && goal.right <= fit.width + 1 && goal.bottom <= fit.height + 1 && (goal.bottom <= fit.surface.top + 1 || goal.right <= fit.surface.left + 1), 'every goal is above or beside the board, and within the screen');
    assert.ok(goal.textFits && goal.label, 'goals have unclipped readable text and non-color accessible names');
  }
  for (const button of fit.buttons) {
    assert.ok(button.width >= 44 && button.height >= 44, `${button.name}: minimum ordinary control size`);
    assert.ok(button.left >= -1 && button.right <= fit.width + 1 && button.bottom <= fit.height + 1, `${button.name}: control visible`);
  }
  return fit;
}

async function cellPoint(page, row, col) {
  return page.evaluate(([r, c]) => {
    const g = window.game;
    const camera = g.scene.cameras.main;
    const point = camera.matrix.transformPoint(g.cellX(c) - camera.scrollX, g.cellY(r) - camera.scrollY);
    const canvas = g.game.canvas.getBoundingClientRect();
    return { x: canvas.x + point.x * canvas.width / g.game.scale.gameSize.width,
      y: canvas.y + point.y * canvas.height / g.game.scale.gameSize.height };
  }, [row, col]);
}

async function reset(page) {
  await page.evaluate(() => {
    const g = window.game;
    g.applyGeneratedDefinition(window.__qaDefinition);
    g.isGameRunning = true;
    g.updateUI();
  });
  await page.waitForFunction(() => window.game.canInteractWithBoard());
  await page.waitForTimeout(80); // Wait for camera transform to render after reset/resize.
}

async function performAction(page, cells, method, mobile) {
  const before = await snapshot(page);
  const expected = await page.evaluate((cells) => {
    const g = window.game;
    return window.InfiniteLevels.simulateLevelMove(g.generatedLevel,
      { board: g.board, specials: g.specials, refillState: g.levelRng.state, objectiveProgress: g.objectiveProgress }, cells);
  }, cells);
  assert.ok(expected, 'action is accepted by shared versioned rules');
  const first = await cellPoint(page, cells[0], cells[1]);
  const second = cells.length === 4 ? await cellPoint(page, cells[2], cells[3]) : null;
  if (method === 'tap') {
    const tap = (point) => mobile ? page.touchscreen.tap(point.x, point.y) : page.mouse.click(point.x, point.y);
    await tap(first);
    if (second) { await page.waitForTimeout(70); await tap(second); }
  } else if (method === 'swipe') {
    assert.ok(second);
    if (mobile) {
      const session = await page.context().newCDPSession(page);
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...first, id: 1 }] });
      await page.waitForTimeout(50);
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...second, id: 1 }] });
      await page.waitForTimeout(50);
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await session.detach();
    } else {
      await page.mouse.move(first.x, first.y); await page.mouse.down();
      await page.mouse.move(second.x, second.y, { steps: 4 }); await page.mouse.up();
    }
  } else if (method === 'named' || method === 'named-keyboard' || method === 'named-toolbar-keyboard' || method === 'assistive-click') {
    const button = (row, col) => page.locator(`[data-cell-row="${row}"][data-cell-col="${col}"]`);
    const choose = (row, col) => method === 'assistive-click' ? button(row, col).dispatchEvent('click', { detail: 0 })
      : mobile ? button(row, col).tap() : button(row, col).click();
    if (method === 'named-keyboard') {
      await button(cells[0], cells[1]).focus();
      if (!second) await page.keyboard.press('Enter');
      else {
        await page.keyboard.press('Space');
        await page.keyboard.press(cells[2] > cells[0] ? 'ArrowDown' : cells[2] < cells[0] ? 'ArrowUp' : cells[3] > cells[1] ? 'ArrowRight' : 'ArrowLeft');
        await page.keyboard.press('Space');
      }
    } else {
      await choose(cells[0], cells[1]);
      if (second) await choose(cells[2], cells[3]);
      else if (method === 'named-toolbar-keyboard') await page.locator('[data-cell-action="activate"]').press('Enter');
      else if (mobile) await page.locator('[data-cell-action="activate"]').tap();
      else await page.locator('[data-cell-action="activate"]').click();
    }
  } else {
    const board = page.locator('.match-board-surface');
    await board.focus();
    // Start from a known cursor after a definition reset.
    for (let row = 0; row < cells[0]; row++) await board.press('ArrowDown');
    for (let col = 0; col < cells[1]; col++) await board.press('ArrowRight');
    if (!second) await board.press('Enter');
    else {
      await board.press('Space'); // Select rather than activate an earned special.
      await board.press(cells[2] > cells[0] ? 'ArrowDown' : cells[2] < cells[0] ? 'ArrowUp' : cells[3] > cells[1] ? 'ArrowRight' : 'ArrowLeft');
      await board.press('Space');
    }
  }
  await page.waitForFunction((moves) => window.game.moves === moves - 1, before.moves, { timeout: 5000 });
  const after = await snapshot(page);
  assert.deepEqual(after.board, expected.board, `${method}: shared-rule board parity`);
  assert.deepEqual(after.specials, expected.specials ?? null, `${method}: persistent special parity`);
  assert.deepEqual(after.objectiveProgress, expected.objectiveProgress, `${method}: collection progress parity`);
  assert.equal(after.rng, expected.refillState, `${method}: deterministic refill parity`);
  assert.equal(after.score - before.score, expected.score, `${method}: score parity`);
  assert.deepEqual(after.charges, before.charges, `${method}: earned actions do not consume inventory`);
  assert.equal(await page.evaluate(() => window.__qaInventorySpends), 0, 'earned actions never request inventory spending');
  await page.waitForFunction(() => {
    const g = window.game;
    return !g.matchFeedback?.isActive() && !(g.inputLockedUntil > Date.now()) && g.gemSprites.every((row, r) => row.every((gem, c) =>
      Math.abs(gem.x - g.cellX(c)) < 0.5 && Math.abs(gem.y - g.cellY(r)) < 0.5));
  });
  const viewsMatch = await page.evaluate(() => {
    const g = window.game;
    return new Set(g.gemSprites.flat()).size === g.boardSize ** 2 && g.gemSprites.every((row, r) => row.every((gem, c) =>
      gem.texture.key === g.gemTexture(g.board[r][c], g.specials?.[r]?.[c]) && gem.getData('type') === g.board[r][c]
      && gem.getData('special') === (g.specials?.[r]?.[c] ?? null) && gem.getData('row') === r && gem.getData('col') === c));
  });
  assert.equal(viewsMatch, true, `${method}: no duplicated, stale or misplaced sprite`);
  await checkFit(page);
  await checkNamedBoard(page);
  return expected;
}

async function exerciseMove(page, method, mobile) {
  await reset(page);
  const cells = await page.evaluate(() => window.InfiniteLevels.levelActions(window.game.generatedLevel, window.game.board, window.game.specials)[0].cells);
  return performAction(page, cells, method, mobile);
}

async function checkNamedBoard(page, visible = false) {
  await page.waitForFunction(() => document.querySelector('.match-cell-grid').getAttribute('aria-disabled') === String(!window.game.canInteractWithBoard()));
  const info = await page.evaluate(() => {
    const g = window.game; const grid = g.playerUI.shell.querySelector('.match-cell-grid');
    const buttons = Array.from(grid.querySelectorAll('button')); const textVisible = g.playerUI.surface.classList.contains('match-text-board-active');
    return { size: g.boardSize, rows: Number(grid.getAttribute('aria-rowcount')), columns: Number(grid.getAttribute('aria-colcount')),
      rowIndices: Array.from(grid.querySelectorAll('[role="row"]'), (row) => Number(row.getAttribute('aria-rowindex'))),
      cells: buttons.map((button) => {
        const row = Number(button.dataset.cellRow); const col = Number(button.dataset.cellCol); const expected = window.InfiniteAssistiveBoard.describeCell(g, row, col);
        return { row, col, actual: button.getAttribute('aria-label'), expected: expected.label,
          selected: button.parentElement.getAttribute('aria-selected'), expectedSelected: String(expected.selected), colIndex: Number(button.parentElement.getAttribute('aria-colindex')),
          width: button.getBoundingClientRect().width, height: button.getBoundingClientRect().height };
      }), tabStops: buttons.filter((button) => button.tabIndex === 0).length, textVisible, pageFits: document.body.scrollWidth <= innerWidth + 1,
      canvasHidden: g.game.canvas.getAttribute('aria-hidden') === 'true' };
  });
  assert.equal(info.rows, info.size); assert.equal(info.columns, info.size); assert.equal(info.cells.length, info.size ** 2);
  assert.deepEqual(info.rowIndices, Array.from({ length: info.size }, (_, row) => row + 1));
  assert.equal(info.tabStops, 1, 'one roving cell entry, not 64 Tab stops'); assert.equal(info.canvasHidden, true, 'canvas is not a duplicate accessible board');
  assert.equal(info.pageFits, true, 'text cells scroll inside the board, not the whole page');
  if (visible) assert.equal(info.textVisible, true, 'focused or explicitly enabled named cells are visible');
  for (const cell of info.cells) {
    assert.equal(cell.actual, cell.expected, 'semantic name matches the current model after refills');
    assert.equal(cell.selected, cell.expectedSelected); assert.equal(cell.colIndex, cell.col + 1);
    if (info.textVisible) assert.ok(cell.width >= 44 && cell.height >= 44, 'named cells retain ordinary target size, including off-screen scrollable cells');
  }
  return info;
}

async function exerciseAssistive(page, device) {
  await reset(page);
  const beforeMode = await snapshot(page);
  await page.locator('[data-action="menu"]').click();
  await page.getByRole('button', { name: 'Use text board', exact: true }).click();
  assert.deepEqual(await snapshot(page), beforeMode, 'view switch does not change the active puzzle');
  let info = await checkNamedBoard(page, true);
  const session = await page.context().newCDPSession(page);
  const tree = await session.send('Accessibility.getFullAXTree'); await session.detach();
  const exposed = tree.nodes.filter((node) => !node.ignored);
  assert.equal(exposed.filter((node) => node.role?.value === 'grid' && node.name?.value === 'Named gem board').length, 1);
  assert.equal(exposed.filter((node) => node.role?.value === 'gridcell').length, info.size ** 2);
  assert.equal(exposed.filter((node) => node.role?.value === 'button' && /^Row \d+, column \d+: /.test(node.name?.value)).length, info.size ** 2, 'actual AX tree exposes every named native action');
  if (device.name === 'phone') fs.writeFileSync(path.join(output, 'assistive-ax-summary.json'), JSON.stringify({ grid: 'Named gem board', rows: info.rows, columns: info.columns,
    cells: info.cells.length, tabStops: info.tabStops, sample: info.cells[0].actual, minTarget: Math.min(...info.cells.map((cell) => Math.min(cell.width, cell.height))) }, null, 2));
  const cell = (row, col) => page.locator(`[data-cell-row="${row}"][data-cell-col="${col}"]`);
  await cell(0, 0).focus(); await page.keyboard.press('Control+End');
  assert.deepEqual(await page.evaluate(() => window.game.keyboardCursor), [info.size - 1, info.size - 1]);
  await page.keyboard.press('Home'); assert.deepEqual(await page.evaluate(() => window.game.keyboardCursor), [info.size - 1, 0]);
  await page.keyboard.press('Control+Home');
  await page.keyboard.press('Tab'); assert.equal(await page.locator('[data-cell-action="status"]').evaluate((button) => button === document.activeElement), true, 'Tab exits cells to the first enabled board action');
  await cell(0, 0).focus(); await page.keyboard.press('Shift+Tab');
  assert.equal(await page.locator('.match-cell-grid').evaluate((grid) => grid.contains(document.activeElement)), false, 'Shift Tab leaves the grid without a trap');

  const beforeHint = await snapshot(page); await page.locator('[data-action="hint"]').click();
  const hinted = await page.evaluate(() => {
    const g = window.game; const cells = g.hintCells;
    return document.querySelector(`[data-cell-row="${cells[0]}"][data-cell-col="${cells[1]}"]`).getAttribute('aria-label');
  });
  assert.match(hinted, /hint (start|activation)/); assert.deepEqual(await snapshot(page), beforeHint);
  await page.locator('[data-cell-action="clear"]').click();
  assert.equal(await page.locator('.match-cell-grid').evaluate((grid) => grid.contains(document.activeElement)), true, 'clearing restores cell focus after disabling its own button');
  await page.locator('[data-cell-action="status"]').click(); assert.match(await page.locator('.match-player-announcement').textContent(), /Score .*moves left/);
  await exerciseMove(page, 'named', device.mobile);
  await earnedFixture(page, ['prism', 'burst']); await performAction(page, [3, 3, 3, 4], 'named', device.mobile);
  await earnedFixture(page, ['prism']); await performAction(page, [3, 3], 'named', device.mobile);
  assert.equal(await cell(3, 3).evaluate((button) => button === document.activeElement), true, 'activation restores cell focus rather than leaving a newly disabled toolbar button');
  await earnedFixture(page, ['burst']); await performAction(page, [3, 3], 'named-toolbar-keyboard', device.mobile);
  await earnedFixture(page, ['column']); await performAction(page, [3, 3], 'named-keyboard', device.mobile);
  await earnedFixture(page, ['row', 'column']); await performAction(page, [3, 3, 3, 4], 'named-keyboard', device.mobile);
  await earnedFixture(page, [], true); await performAction(page, [2, 3, 3, 3], 'assistive-click', device.mobile); // Zero-detail activation contract, not a physical screen reader.

  const labelBefore = await cell(0, 0).getAttribute('aria-label'); await cell(0, 0).focus();
  const beforeModal = await snapshot(page); await page.locator('[data-action="menu"]').click();
  await cell(0, 0).dispatchEvent('click', { detail: 0 }); assert.deepEqual(await snapshot(page), beforeModal, 'modal guard blocks synthetic accessibility activation');
  await page.getByRole('button', { name: 'Back to game', exact: true }).click();
  assert.equal(await cell(0, 0).evaluate((button) => button === document.activeElement), true, 'secondary dialog restores the current named cell');
  assert.equal(await cell(0, 0).getAttribute('aria-label'), labelBefore);
  await page.locator('[data-action="pause"]').click(); const paused = await snapshot(page);
  await cell(0, 0).click({ force: true }); await page.keyboard.press('Control+End');
  assert.equal(await page.evaluate(() => window.game.isPaused), true); assert.deepEqual(await snapshot(page), paused, 'reading/navigating/clicking paused cells never resumes or moves');
  assert.equal(await page.locator('.match-cell-grid').getAttribute('aria-disabled'), 'true');
  await page.locator('[data-action="pause"]').click();

  // Pointer down cannot be carried over to a fresh board or a cancelled/dragged native gesture.
  await cell(0, 0).scrollIntoViewIfNeeded(); const box = await cell(0, 0).boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
  await page.evaluate(() => { const g = window.game; g.applyGeneratedDefinition(g.generatedLevel); g.isGameRunning = true; g.updateUI(); });
  const fresh = await snapshot(page); await page.mouse.up(); assert.deepEqual(await snapshot(page), fresh);
  assert.equal(await page.evaluate(() => window.game.selectedGem === null), true, 'old pointer cannot select on the replacement board');
  await page.mouse.down(); await cell(0, 0).dispatchEvent('pointercancel', { pointerId: 1 }); await page.mouse.up();
  assert.equal(await page.evaluate(() => window.game.selectedGem === null), true, 'cancelled native pointer cannot select');
  await page.mouse.down();
  await cell(0, 0).evaluate((button) => {
    button.dispatchEvent(new window.PointerEvent('pointerdown', { pointerId: 2, isPrimary: false, button: 0, bubbles: true }));
    button.dispatchEvent(new window.PointerEvent('click', { pointerId: 2, detail: 1, bubbles: true }));
  });
  assert.equal(await page.evaluate(() => window.game.selectedGem === null), true, 'another pointer cannot impersonate the owning click');
  await page.mouse.up(); assert.equal(await page.evaluate(() => window.game.selectedGem !== null), true, 'the owning pointer still selects once');
  await page.locator('[data-cell-action="clear"]').click();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 20, box.y + box.height / 2); await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.up();
  assert.equal(await page.evaluate(() => window.game.selectedGem === null), true, 'a moved-and-returned native gesture cannot select');


  await page.evaluate(() => {
    const g = window.game;
    for (let number = 1; number <= 120; number++) {
      const definition = window.InfiniteLevels.generateLevel(number, window.__qaDefinition.context);
      if (definition.boardSize === 8) { g.applyGeneratedDefinition(definition); g.isGameRunning = true; g.updateUI(); return; }
    }
    throw new Error('No 8x8 cohort');
  });
  await cell(0, 0).focus(); await page.keyboard.press('Control+End'); info = await checkNamedBoard(page, true); assert.equal(info.size, 8);
  if (device.name === 'phone' || device.name === 'narrow-phone') await page.screenshot({ path: path.join(output, `${device.name}-text-board.png`) });
  await page.evaluate(() => {
    const g = window.game;
    for (let number = 1; number <= 120; number++) {
      const definition = window.InfiniteLevels.generateLevel(number, window.__qaDefinition.context);
      if (definition.boardSize === 6) { g.applyGeneratedDefinition(definition); g.isGameRunning = true; g.updateUI(); return; }
    }
    throw new Error('No 6x6 cohort');
  });
  assert.deepEqual(await page.evaluate(() => window.game.keyboardCursor), [5, 5], 'focus clamps when a smaller generated board replaces a focused cell');
  assert.equal(await cell(5, 5).evaluate((button) => button === document.activeElement), true);
  await checkNamedBoard(page, true);
  await reset(page);
  await page.locator('[data-action="menu"]').click(); await page.getByRole('button', { name: 'Use visual board', exact: true }).click();
  assert.equal(await page.evaluate(() => window.game.settings.textBoard), false);
  assert.equal(await page.locator('.match-board-surface').evaluate((board) => board.classList.contains('match-text-board-active')), false);
  await cell(0, 0).focus(); assert.equal(await page.locator('.match-board-surface').evaluate((board) => board.classList.contains('match-text-board-active')), true, 'keyboard focus cannot leave named cells invisible');
  await page.locator('.match-board-surface').focus(); await checkFit(page);
}

// Test-only model fixtures, not authored production levels: every effect is independently
// computed by the shipped shared engine, and production generation remains passive.
async function earnedFixture(page, kinds = [], earnFour = false) {
  await page.evaluate(({ kinds, earnFour }) => {
    const g = window.game;
    const palette = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
    const definition = { ...window.__qaDefinition, generatorVersion: 4, boardSize: 7, gemTypes: palette,
      gemWeights: {}, refillState: 12345, targetScore: 1000000, moves: 30, objectives: [{ type: 'score', target: 1000000 }],
      board: Array.from({ length: 7 }, (_, r) => Array.from({ length: 7 }, (_, c) => palette[(r * 2 + c) % 6])),
      specials: window.InfiniteLevels.blankSpecials(7) };
    kinds.forEach((kind, index) => { definition.specials[3][3 + index] = kind; });
    if (earnFour) {
      definition.board[3][0] = 'blue'; definition.board[3][1] = 'red'; definition.board[3][2] = 'red';
      definition.board[3][4] = 'red'; definition.board[2][3] = 'red';
    }
    g.applyGeneratedDefinition(definition); g.isGameRunning = true; g.updateUI();
  }, { kinds, earnFour });
  await page.waitForTimeout(80);
  await checkFit(page);
}

async function exerciseFeedback(page, device) {
  const cancelPaths = [];
  // Enable normal motion deliberately, also on reduced-motion QA viewports.
  // The original OS preference is restored before the other player tests.
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.evaluate(() => {
    const g = window.game; g.settings.reduceAnimations = false; g.settings.textBoard = false;
    document.activeElement?.blur(); g.playerUI.refresh();
    window.__qaFeedbackRead = []; window.__qaFeedbackProtected = []; window.__qaFeedbackBlocked = []; window.__qaFeedbackLabels = []; window.__qaFeedbackPointers = [];
    const begin = g.beginGemGesture; window.__qaFeedbackBegin = begin;
    g.beginGemGesture = (image, pointer) => {
      const bounds = g.game.scale.canvasBounds; const box = g.game.canvas.getBoundingClientRect();
      window.__qaFeedbackPointers.push({ row: image.getData('row'), col: image.getData('col'), aligned: Math.abs(bounds.x - box.x) < 1 && Math.abs(bounds.y - box.y) < 1 });
      return begin.call(g, image, pointer);
    };
    const controller = g.matchFeedback; const play = controller.play;
    window.__qaFeedbackPlay = play;
    controller.play = (result) => {
      window.__qaFeedbackExpected = result;
      const active = play(result);
      if (active) {
        const model = () => JSON.stringify({ board: g.board, specials: g.specials, progress: g.objectiveProgress, rng: g.levelRng.state,
          score: g.score, moves: g.moves, energy: g.energy, charges: Object.values(g.powerButtons).map((slot) => slot.btn.getData('count')) });
        const before = model();
        g.trySwap(2, 3, 3, 3); g.activateEarnedSpecial(3, 3); g.commitEarnedAction([2, 3, 3, 3]); g.showHint(); g.usePowerUp('bomb');
        window.__qaFeedbackBlocked.push({ unchanged: before === model(), blocked: !g.canInteractWithBoard() });
      }
      return active;
    };
    window.__qaFeedbackObserver = new window.MutationObserver(() => {
      const status = controller.status(); const result = window.__qaFeedbackExpected;
      window.__qaFeedbackLabels.push({ phase: status.phase, text: document.querySelector('.match-resolution-label').textContent });
      if (!status.active || !result?.presentation || !['read', 'clear'].includes(status.phase)) return;
      const frame = result.presentation.frames[status.wave - 1];
      const layer = g.scene.children.getByName('match-feedback-layer');
      const images = layer.list.filter((item) => item.type === 'Image');
      const n = g.boardSize;
      if (status.phase === 'read') window.__qaFeedbackRead.push({ wave: status.wave, total: result.cascades,
        matches: images.slice(0, n * n).every((image, index) => {
          const row = Math.floor(index / n); const col = index % n;
          return image.visible && image.texture.key === g.gemTexture(frame.before.board[row][col], frame.before.specials[row][col])
            && Math.abs(image.x - g.cellX(col)) < 0.5 && Math.abs(image.y - g.cellY(row)) < 0.5;
        }), coreHidden: g.gemSprites.flat().every((image) => !image.visible), nonInteractive: images.every((image) => !image.input), images: images.length });
      if (status.phase === 'clear') for (const item of result.events[status.wave - 1].created) {
        const image = images[item.row * n + item.col];
        window.__qaFeedbackProtected.push({ key: `${item.row},${item.col}`, type: item.type, preserved: image.alpha === 1
          && image.texture.key === g.gemTexture(frame.before.board[item.row][item.col], item.type)
          && !result.events[status.wave - 1].cleared.includes(`${item.row},${item.col}`) });
      }
    });
    window.__qaFeedbackObserver.observe(document.querySelector('.match-resolution-label'), { childList: true, attributes: true, attributeFilter: ['data-phase'] });
  });
  const visual = async () => page.evaluate(() => {
    const g = window.game; g.settings.textBoard = false; g.settings.reduceAnimations = false;
    document.activeElement?.blur(); g.playerUI.refresh();
  });
  const start = async () => {
    await visual(); await earnedFixture(page, ['prism', 'prism']);
    return page.evaluate(() => {
      const g = window.game; g.levelRng.state = 9;
      const expected = window.InfiniteLevels.simulateLevelMove(g.generatedLevel,
        { board: g.board, specials: g.specials, refillState: g.levelRng.state, objectiveProgress: g.objectiveProgress }, [3, 3, 3, 4]);
      const result = g.trySwap(3, 3, 3, 4);
      return { active: g.matchFeedback.isActive(), cascades: result.cascades, matches: JSON.stringify(result.board) === JSON.stringify(expected.board),
        disabled: [...document.querySelectorAll('.match-powerups button')].every((button) => button.disabled), busy: g.playerUI.surface.getAttribute('aria-busy'),
        committed: { board: g.board, specials: g.specials, objectiveProgress: g.objectiveProgress, score: g.score, moves: g.moves, rng: g.levelRng.state,
          charges: Array.from(g.playerUI.powerups, ([type, slot]) => [type, slot.btn.getData('count')]) },
        controls: Object.fromEntries(['finish-feedback', 'pause', 'menu'].map((name) => {
          const box = document.querySelector(`[data-action="${name}"]`).getBoundingClientRect();
          return [name, { x: box.x + box.width / 2, y: box.y + box.height / 2, width: box.width, height: box.height, bottom: box.bottom }];
        })) };
    });
  };
  const ready = () => page.waitForFunction(() => !window.game.matchFeedback.isActive());
  // Actual mouse/touch input, actual Phaser textures/coordinates on each observed read phase.
  await visual(); await earnedFixture(page, [], true); await performAction(page, [2, 3, 3, 3], 'tap', device.mobile);
  const observations = await page.evaluate(() => ({ read: window.__qaFeedbackRead, protected: window.__qaFeedbackProtected, pointers: window.__qaFeedbackPointers }));
  assert.deepEqual(observations.pointers.map((pointer) => [pointer.row, pointer.col]), [[2, 3], [3, 3]], 'first real inputs still target the intended cells after a goal/status row moves the canvas');
  assert.equal(observations.pointers.every((pointer) => pointer.aligned), true, 'input bounds are refreshed before Phaser hit-testing');
  assert.ok(observations.read.length > 0 && observations.read.every((row) => row.matches && row.coreHidden && row.nonInteractive && row.images <= 64), 'real intermediate images match the resolver, not the final board');
  assert.ok(observations.protected.some((row) => row.type === 'row' && row.preserved), 'earned anchor badge remains visible while actual clears fade');

  const readOffset = await page.evaluate(() => window.__qaFeedbackRead.length);
  await start();

  await ready();
  const complete = await page.evaluate((offset) => ({ reason: window.game.matchFeedback.status().lastReason,
    waves: [...new Set(window.__qaFeedbackRead.slice(offset).map((row) => row.wave))],
    summarized: window.__qaFeedbackLabels.some((label) => label.text === '1 more cascade resolved · settled'),
    visible: window.game.gemSprites.flat().every((image) => image.visible),
    totals: document.querySelector('.match-announcement-message').textContent.includes('4 waves') }), readOffset);
  // Slow software-rendered viewports may intentionally hit the bounded watchdog.
  // Require real, faithful prefix frames and final restoration in both outcomes;
  // a normal completion must show all three frames and the omitted-wave summary.
  assert.ok(['complete', 'watchdog'].includes(complete.reason));
  assert.ok(complete.waves.length >= 1 && complete.waves.length <= 3);
  assert.deepEqual(complete.waves, [1, 2, 3].slice(0, complete.waves.length));
  if (complete.reason === 'complete') {
    assert.deepEqual(complete.waves, [1, 2, 3]);
    assert.equal(complete.summarized, true, 'the real fourth wave is summarized instead of painted on a different board');
  }
  assert.equal(complete.totals, true); assert.equal(complete.visible, true);

  const started = await start(); assert.equal(started.active, true); assert.equal(started.cascades, 4);
  assert.equal(started.matches, true); assert.equal(started.disabled, true); assert.equal(started.busy, 'true');
  // Do not wait two slow headless render frames before trying a subsecond Finish.
  // Real native touch at its measured target, not a forced or synthetic click.
  const beforeFinish = started.committed;
  assert.ok(started.controls['finish-feedback'].width >= 44 && started.controls['finish-feedback'].height >= 44 && started.controls['finish-feedback'].bottom <= device.height + 1);
  if (device.mobile) await page.touchscreen.tap(started.controls['finish-feedback'].x, started.controls['finish-feedback'].y);
  else await page.getByRole('button', { name: 'Finish match animation', exact: true }).press('Enter');
  await ready(); assert.deepEqual(await snapshot(page), beforeFinish, 'Finish changes no model/charges');
  assert.equal(await page.evaluate(() => window.game.matchFeedback.status().lastReason), 'skip');
  await checkFit(page);
  assert.equal(await page.getByRole('button', { name: 'Finish match animation', exact: true }).isVisible(), false);
  assert.equal(await page.locator('.match-board-surface').getAttribute('aria-busy'), 'false');
  if (!device.mobile) assert.equal(await page.locator('.match-board-surface').evaluate((element) => element === document.activeElement), true, 'Finish does not strand keyboard focus on a hidden button');
  cancelPaths.push('native-finish');

  const pausedStart = await start(); const beforePause = pausedStart.committed;
  if (device.mobile) await page.touchscreen.tap(pausedStart.controls.pause.x, pausedStart.controls.pause.y);
  else await page.mouse.click(pausedStart.controls.pause.x, pausedStart.controls.pause.y);
  await ready();
  assert.equal(await page.evaluate(() => window.game.matchFeedback.status().lastReason), 'pause');
  assert.equal(await page.evaluate(() => window.game.isPaused), true);
  await page.waitForTimeout(1250); assert.deepEqual(await snapshot(page), beforePause, 'paused/stale feedback cannot replay a move');
  await page.locator('[data-action="pause"]').click(); cancelPaths.push('pause-resume');

  await start(); const beforeMotion = await snapshot(page);
  await page.emulateMedia({ reducedMotion: 'reduce' }); await ready();
  assert.deepEqual(await snapshot(page), beforeMotion, 'OS reduced-motion change finishes visual work only');
  await page.emulateMedia({ reducedMotion: 'no-preference' }); cancelPaths.push('motion-change');

  await start(); const beforeNamed = await snapshot(page);
  await page.locator('[data-cell-row="0"][data-cell-col="0"]').focus(); await ready();
  assert.deepEqual(await snapshot(page), beforeNamed, 'focusing the named board does not spend or activate');
  assert.equal(await page.locator('.match-board-surface').evaluate((element) => element.classList.contains('match-text-board-active')), true);
  cancelPaths.push('named-focus');

  const overlayStart = await start(); const beforeOverlay = overlayStart.committed;
  if (device.mobile) await page.touchscreen.tap(overlayStart.controls.menu.x, overlayStart.controls.menu.y);
  else await page.mouse.click(overlayStart.controls.menu.x, overlayStart.controls.menu.y);
  await ready();
  assert.equal(await page.evaluate(() => window.game.matchFeedback.status().lastReason), 'pause');
  assert.equal(await page.evaluate(() => window.game.isPaused), true);
  assert.deepEqual(await snapshot(page), beforeOverlay, 'Explore interrupts without spending');
  await page.getByRole('button', { name: 'Back to game', exact: true }).click(); cancelPaths.push('overlay');

  await start(); const beforeHidden = await snapshot(page);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
    delete document.hidden; document.dispatchEvent(new Event('visibilitychange'));
  }); await ready(); assert.deepEqual(await snapshot(page), beforeHidden); cancelPaths.push('synthetic-background');
  await start(); const beforeHide = await snapshot(page);
  await page.evaluate(() => { window.dispatchEvent(new Event('pagehide')); window.dispatchEvent(new Event('pageshow')); });
  await ready(); assert.deepEqual(await snapshot(page), beforeHide); cancelPaths.push('synthetic-pagehide');

  await start(); await reset(page); const replacement = await snapshot(page);
  await page.waitForTimeout(1250); assert.deepEqual(await snapshot(page), replacement, 'new-board epoch cancels stale visual/result callbacks');
  cancelPaths.push('new-board');

  for (const mode of ['setting', 'system', 'text']) {
    await visual(); await page.emulateMedia({ reducedMotion: mode === 'system' ? 'reduce' : 'no-preference' });
    await earnedFixture(page, [], true);
    const immediate = await page.evaluate((mode) => {
      const g = window.game; g.settings.reduceAnimations = mode === 'setting'; g.settings.textBoard = mode === 'text'; g.playerUI.refresh();
      const result = g.trySwap(2, 3, 3, 3);
      return { active: g.matchFeedback.isActive(), traced: !!result.presentation, locked: g.inputLockedUntil > Date.now(), ready: g.canInteractWithBoard() };
    }, mode);
    assert.deepEqual(immediate, { active: false, traced: false, locked: false, ready: true }, `${mode}: instantaneous accessible path`);
  }
  const metrics = await page.evaluate(() => {
    const g = window.game;
    window.__qaFeedbackObserver.disconnect(); g.matchFeedback.play = window.__qaFeedbackPlay; g.beginGemGesture = window.__qaFeedbackBegin;
    const status = g.matchFeedback.status();
    return { readFrames: window.__qaFeedbackRead.length, protectedAnchors: window.__qaFeedbackProtected.length,
      faithfulFrames: window.__qaFeedbackRead.every((row) => row.matches && row.coreHidden && row.nonInteractive),
      blockedActions: window.__qaFeedbackBlocked.length, guards: window.__qaFeedbackBlocked.every((row) => row.unchanged && row.blocked), firstTouchBoundsAligned: window.__qaFeedbackPointers.slice(0, 2).every((pointer) => pointer.aligned),
      images: status.images, scheduledDurationMs: status.scheduledDurationMs, watchdogMs: status.watchdogMs, inventorySpends: window.__qaInventorySpends };
  });
  assert.equal(metrics.faithfulFrames, true); assert.equal(metrics.guards, true); assert.equal(metrics.inventorySpends, 0); assert.ok(metrics.images <= 64);
  await visual(); await page.emulateMedia({ reducedMotion: device.motion }); await reset(page);
  return { ...metrics, completePlayback: complete.reason, renderedWaves: complete.waves, cancelPaths, immediate: ['setting', 'system', 'text'] };
}

async function exerciseLargestBoard(page, device) {
  await page.evaluate(() => {
    const g = window.game;
    for (let number = 1; number <= 120; number++) {
      const definition = window.InfiniteLevels.generateLevel(number, window.__qaDefinition.context);
      if (definition.boardSize !== 8 || definition.objectiveProfile !== 'collect-pair') continue;
      g.applyGeneratedDefinition(definition); g.isGameRunning = true; g.updateUI(); return;
    }
    throw new Error('No largest paired-objective board in seed cohort');
  });
  await page.waitForTimeout(80);
  const fit = await checkFit(page);
  if (device.name === 'narrow-phone') await page.screenshot({ path: path.join(output, 'narrow-phone-largest-board.png') });
  const cells = await page.evaluate(() => window.InfiniteLevels.levelActions(window.game.generatedLevel, window.game.board, window.game.specials)[0].cells);
  await performAction(page, cells, 'tap', device.mobile);
  await reset(page);
  return Math.round(fit.boardExtent / 8);
}

async function exerciseEarnedSpecials(page, device) {
  assert.equal(await page.evaluate(() => window.__qaDefinition.generatorVersion), 4, 'new frontend negotiates v4');
  const badgesVisible = await page.evaluate(() => window.InfinitePlayerExperience.specialTypes.every((kind) => {
    const canvas = window.game.scene.textures.get(`gem_red_${kind}`).getSourceImage();
    const pixels = canvas.getContext('2d').getImageData(42, 42, 15, 15).data;
    let white = 0;
    for (let index = 0; index < pixels.length; index += 4) if (pixels[index] > 225 && pixels[index + 1] > 225 && pixels[index + 2] > 225 && pixels[index + 3] > 0) white++;
    return white >= 10;
  }));
  assert.equal(badgesVisible, true, 'all earned badges have visible geometry without Unicode fonts');
  await earnedFixture(page, [], true);
  const earned = await performAction(page, [2, 3, 3, 3], 'tap', device.mobile);
  assert.equal(earned.events[0].created[0].type, 'row', 'a real two-tap four-match earns a Beam');
  await earnedFixture(page, ['row']);
  await performAction(page, [3, 3], 'tap', device.mobile);
  await earnedFixture(page, ['prism', 'burst']);
  if (device.name === 'phone') await page.screenshot({ path: path.join(output, 'phone-earned-specials.png') });
  const combined = await performAction(page, [3, 3, 3, 4], 'swipe', device.mobile);
  assert.equal(combined.events[0].combo, 'prism+burst');
  await earnedFixture(page, ['row', 'column']);
  const keyboard = await performAction(page, [3, 3, 3, 4], 'keyboard', device.mobile);
  assert.equal(keyboard.events[0].combo, 'beam+beam');
  await earnedFixture(page, ['column']);
  await performAction(page, [3, 3], 'keyboard', device.mobile);
  await reset(page);
  await page.locator('[data-action="menu"]').click();
  await page.getByRole('button', { name: 'Special gem guide', exact: true }).click();
  assert.equal(await page.evaluate(() => window.game.isPaused), true);
  assert.match(await page.locator('.match-player-dialog').textContent(), /one ordinary move/);
  const closeVisible = () => page.getByRole('button', { name: 'Back to game', exact: true }).evaluate((button) => {
    const bounds = button.getBoundingClientRect(); const dialog = button.closest('dialog').getBoundingClientRect();
    return bounds.top >= dialog.top - 1 && bounds.bottom <= dialog.bottom + 1;
  });
  assert.equal(await closeVisible(), true, 'guide close is visible before scrolling');
  await page.locator('.match-player-dialog').evaluate((dialog) => { dialog.scrollTop = dialog.scrollHeight; });
  assert.equal(await closeVisible(), true, 'guide close remains visible while reading long mobile content');
  await page.locator('.match-player-dialog').evaluate((dialog) => { dialog.scrollTop = 0; });
  if (device.name === 'phone') await page.screenshot({ path: path.join(output, 'phone-special-guide.png') });
  await page.getByRole('button', { name: 'Back to game', exact: true }).click();
  assert.equal(await page.evaluate(() => window.game.isPaused), false);
}

async function setObjectives(page, objectives) {
  await page.evaluate((objectives) => {
    const g = window.game; g.generatedLevel.objectives = objectives; g.objectiveProgress = window.InfiniteLevels.initialObjectiveProgress(g.generatedLevel); g.updateUI();
  }, objectives);
  await page.waitForTimeout(80); await checkFit(page);
}

async function exerciseObjectives(page, device) {
  await earnedFixture(page, [], true);
  await setObjectives(page, [{ type: 'collect', gemType: 'red', target: 30 }, { type: 'collect', gemType: 'blue', target: 20 }]);
  assert.equal(await page.locator('.match-objective canvas').count(), 2, 'both collection goals use shape/symbol/color gem icons');
  await performAction(page, [2, 3, 3, 3], 'tap', device.mobile);
  assert.equal(await page.evaluate(() => window.game.isGameRunning), true, 'one color does not bypass the pair goal');
  const progress = await page.evaluate(() => {
    const g = window.game; return { red: g.objectiveProgress.collected.red, blue: g.objectiveProgress.collected.blue,
      fraction: window.InfiniteLevels.objectiveStatus(g.generatedLevel, g.score, g.objectiveProgress).fraction,
      meter: g.playerUI.shell.querySelector('progress').value };
  });
  assert.ok(progress.red >= 3, 'cleared red gems accumulate in the real input path');
  assert.ok(Math.abs(progress.meter - progress.fraction * 100) < 0.000001, 'meter represents all goals, not rating score');
  assert.match(await page.locator('.match-objective[data-gem-type="red"]').textContent(), new RegExp(`red ${Math.min(30, progress.red)}/30`));
  if (device.name === 'phone') await page.screenshot({ path: path.join(output, 'phone-collection-objectives.png') });
  await page.locator('[data-action="menu"]').click();
  await page.getByRole('button', { name: 'Level goal guide', exact: true }).click();
  assert.match(await page.locator('.match-player-dialog').textContent(), /score is not an extra win requirement/);
  assert.equal(await page.evaluate(() => window.game.isPaused), true);
  await page.locator('.match-player-dialog').evaluate((dialog) => { dialog.scrollTop = dialog.scrollHeight; });
  assert.equal(await page.getByRole('button', { name: 'Back to game', exact: true }).evaluate((button) => {
    const bounds = button.getBoundingClientRect(); const parent = button.closest('dialog').getBoundingClientRect();
    return bounds.top >= parent.top - 1 && bounds.bottom <= parent.bottom + 1;
  }), true, 'goal guide keeps its close control visible after scrolling');
  await page.getByRole('button', { name: 'Back to game', exact: true }).click();
  assert.equal(await page.evaluate(() => window.game.isPaused), false);

  await earnedFixture(page, [], true);
  await setObjectives(page, [{ type: 'score', target: 1 }, { type: 'collect', gemType: 'red', target: 3 }]);
  await page.evaluate(() => { const g = window.game; g.score = 1; g.checkEndConditions(); g.updateUI(); });
  assert.equal(await page.evaluate(() => window.game.isGameRunning), true, 'score alone cannot bypass a mixed goal');
  assert.equal(await page.locator('.match-objective').count(), 2);

  await earnedFixture(page, [], true);
  await setObjectives(page, [{ type: 'collect', gemType: 'red', target: 3 }]);
  await performAction(page, [2, 3, 3, 3], 'tap', device.mobile);
  await page.waitForSelector('.match-player-dialog[open]');
  const won = await page.evaluate(() => ({ won: window.game.hasWonLevel(), score: window.game.score, target: window.game.targetScore,
    stars: window.game.starsFor(window.game.score) }));
  assert.equal(won.won, true); assert.ok(won.score < won.target, 'no undisclosed score target on collection-only levels'); assert.equal(won.stars, 1);
  assert.match(await page.locator('.match-player-dialog').textContent(), /red 3\/3 \(done\)/);
  await page.getByRole('button', { name: 'Replay', exact: true }).click();
  await page.waitForFunction(() => window.game.isGameRunning && !window.game.levelStarting);
  assert.equal(await page.evaluate(() => Object.values(window.game.objectiveProgress.collected).every((count) => count === 0)), true, 'actual Replay resets counters');
  await reset(page);
}

async function exerciseSound(page, device) {
  assert.equal(await page.evaluate(() => window.__qaAudioContexts), 0, 'muted gameplay, hints, specials and results never create audio');
  await reset(page);
  const before = await snapshot(page);
  await page.evaluate(() => {
    const g = window.game; const audio = g.soundEffects; window.__qaSoundEvents = [];
    g.soundEffects = { ...audio, play: (cue) => { const accepted = audio.play(cue); window.__qaSoundEvents.push({ cue, accepted }); return accepted; } };
  });
  await page.locator('[data-action="menu"]').click();
  await page.getByRole('button', { name: 'Play preferences', exact: true }).click();
  const choice = page.getByRole('checkbox', { name: 'Sound effects (optional)', exact: true });
  assert.equal(await choice.isChecked(), false);
  assert.equal(await page.getByRole('button', { name: 'Test sound', exact: true }).isDisabled(), true);
  await choice.check();
  await page.waitForFunction(() => window.game.getSoundStatus().state === 'ready');
  assert.equal(await page.evaluate(() => window.__qaAudioContexts), 1, 'explicit checkbox choice creates/unlocks one real context');
  const slider = page.getByRole('slider', { name: 'Sound volume', exact: true });
  await slider.press('Home');
  for (let index = 0; index < 25; index++) await slider.press('ArrowRight');
  assert.equal(await page.evaluate(() => window.game.settings.soundVolume), 0.25, 'real range keys set volume');
  await page.waitForFunction(() => window.game.getSoundStatus().activeVoices === 0);
  await page.getByRole('button', { name: 'Test sound', exact: true }).click();
  assert.equal(await page.evaluate(() => window.__qaSoundEvents.some((event) => event.cue === 'test' && event.accepted)), true);
  if (device.name === 'phone') await page.screenshot({ path: path.join(output, 'phone-sound-preferences.png') });
  await page.getByRole('button', { name: 'Back to game', exact: true }).click();
  assert.deepEqual(await snapshot(page), before, 'sound preferences/test do not mutate the puzzle or inventory');

  await earnedFixture(page, ['prism', 'burst']);
  await performAction(page, [3, 3, 3, 4], 'swipe', device.mobile);
  assert.equal(await page.evaluate(() => window.__qaSoundEvents.some((event) => event.cue === 'special-combo' && event.accepted)), true, 'actual combo emits semantic local cue');
  await page.locator('[data-action="pause"]').click();
  const paused = await snapshot(page);
  await page.locator('.match-board-surface').press('m');
  assert.equal(await page.evaluate(() => window.game.settings.sfx), false);
  assert.equal(await page.evaluate(() => window.game.isPaused), true, 'M may mute without resuming the board');
  assert.equal(await page.evaluate(() => window.game.getSoundStatus().activeVoices), 0);
  const mutedNodes = await page.evaluate(() => window.__qaOscillators);
  assert.equal(await page.evaluate(() => window.game.playSound('win')), false);
  assert.equal(await page.evaluate(() => window.__qaOscillators), mutedNodes, 'mute cannot schedule sound');
  assert.deepEqual(await snapshot(page), paused, 'paused mute changes no game state');
  await page.locator('.match-board-surface').press('m');
  await page.waitForFunction(() => window.game.getSoundStatus().state === 'ready');
  assert.equal(await page.evaluate(() => window.__qaAudioContexts), 1, 'unmute reuses the existing context');
  await page.locator('[data-action="pause"]').click();

  // Synthetic lifecycle event tests the shipped cancellation handler, not physical OS audio policy.
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  await page.waitForFunction(() => window.game.getSoundStatus().contextState !== 'running');
  assert.equal(await page.evaluate(() => window.game.playSound('win')), false);
  await page.evaluate(() => window.dispatchEvent(new Event('pageshow')));
  assert.equal(await page.evaluate(() => window.game.getSoundStatus().state), 'gesture-required', 'return never resumes automatically');
  await page.locator('.match-board-surface').press('ArrowLeft');
  await page.waitForFunction(() => window.game.getSoundStatus().state === 'ready');
  assert.equal(await page.evaluate(() => window.game.getSoundStatus().activeVoices <= window.InfiniteSoundEffects.MAX_VOICES), true);
  if (device.name === 'phone') await checkOfflineSound(page);
  await reset(page);
}

async function soundFallbackCases() {
  for (const scenario of ['legacy-placeholder', 'unavailable']) {
    // Isolate processes: constrained --single-process Chromium cannot safely close concurrent guest contexts.
    const browser = await chromium.launch({ executablePath, headless: true, args });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    try {
      await context.addInitScript((scenario) => {
        window.__qaAudioContexts = 0;
        if (window.location.origin === 'null') return;
        if (scenario === 'legacy-placeholder') {
          localStorage.setItem('phaser3_game_data', JSON.stringify({ settings: { sfx: true, highContrast: true } }));
          const NativeContext = window.AudioContext || window.webkitAudioContext;
          if (NativeContext) window.AudioContext = class extends NativeContext { constructor(...args) { super(...args); window.__qaAudioContexts++; } };
        } else { window.AudioContext = undefined; window.webkitAudioContext = undefined; }
      }, scenario);
      const page = await context.newPage(); const errors = []; page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(url, { waitUntil: 'domcontentloaded' }); await page.waitForSelector('.match-player-dialog[open]');
      assert.equal(await page.evaluate(() => window.game.settings.sfx), false);
      await page.getByRole('button', { name: 'Play preferences', exact: true }).click();
      const choice = page.getByRole('checkbox', { name: 'Sound effects (optional)', exact: true });
      assert.equal(await choice.isChecked(), false); assert.equal(await choice.isDisabled(), scenario === 'unavailable');
      await page.keyboard.press('Escape'); // The title's new preference close must restore the title, not lose Play.
      await page.getByRole('button', { name: 'Play', exact: true }).click();
      await page.waitForFunction(() => window.game.isGameRunning && !window.game.levelStarting);
      assert.equal(await page.evaluate(() => window.game.settings.sfx), false, 'legacy placeholder remains off after a second settings load');
      assert.equal(await page.evaluate(() => window.__qaAudioContexts), 0);
      await page.evaluate(() => { window.__qaDefinition = structuredClone(window.game.generatedLevel); window.__qaInventorySpends = 0; });
      const cells = await page.evaluate(() => window.InfiniteLevels.levelActions(window.game.generatedLevel, window.game.board, window.game.specials)[0].cells);
      await performAction(page, cells, 'tap', true);
      assert.deepEqual(errors, [], `${scenario}: silent fallback has no page errors`);
    } finally { await browser.close(); }
  }
}

async function checkOfflineSound(page) {
  const metrics = await page.evaluate(async () => {
    const sounds = window.InfiniteSoundEffects; const metrics = [];
    for (const cue of sounds.cueNames) {
      const context = new window.OfflineAudioContext(1, 22050, 44100); const master = context.createGain();
      master.gain.value = sounds.MAX_GAIN * sounds.DEFAULT_VOLUME; master.connect(context.destination);
      sounds.scheduleCue(context, master, cue); const buffer = await context.startRendering(); const samples = buffer.getChannelData(0);
      let sum = 0; let peak = 0; let hash = 2166136261; let last = 0;
      for (let index = 0; index < samples.length; index++) {
        const sample = samples[index]; if (!Number.isFinite(sample)) throw new Error('nonfinite audio');
        sum += sample * sample; peak = Math.max(peak, Math.abs(sample)); if (Math.abs(sample) > 0.000001) last = index;
        hash = Math.imul(hash ^ Math.round(sample * 32767), 16777619) >>> 0;
      }
      metrics.push({ cue, peak, rms: Math.sqrt(sum / samples.length), lastSeconds: last / 44100, hash });
    }
    return metrics;
  });
  assert.equal(metrics.length, 16); assert.equal(new Set(metrics.map((metric) => metric.hash)).size, 16, 'every original cue renders a distinct waveform');
  for (const metric of metrics) {
    assert.ok(metric.rms > 0.0001 && metric.peak < 0.2, `${metric.cue}: actual finite nonzero bounded audio`);
    assert.ok(metric.lastSeconds < 0.4, `${metric.cue}: short sound ends in silence`);
  }
  fs.writeFileSync(path.join(output, 'sound-render-metrics.json'), JSON.stringify(metrics, null, 2));
}

for (const device of cases) {
  const browser = await chromium.launch({ executablePath, args, headless: true });
  let page;
  try {
    const context = await browser.newContext({ viewport: { width: device.width, height: device.height },
      isMobile: device.mobile, hasTouch: device.mobile, deviceScaleFactor: 1, reducedMotion: device.motion });
    await context.addInitScript(() => {
      window.__qaAudioContexts = 0; window.__qaOscillators = 0;
      const NativeContext = window.AudioContext || window.webkitAudioContext;
      if (NativeContext) {
        class CountingContext extends NativeContext {
          constructor(...args) {
            super(...args); window.__qaAudioContexts++;
            const createOscillator = this.createOscillator.bind(this);
            this.createOscillator = () => { window.__qaOscillators++; return createOscillator(); };
          }
        }
        window.AudioContext = CountingContext;
      }
    });
    page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.match-player-dialog[open]', { timeout: 30000 });
    assert.equal(await page.evaluate(() => window.__qaAudioContexts), 0, 'title creates no audio context');
    assert.equal(await page.evaluate(() => window.game.settings.sfx), false, 'fresh play is opt-in silent');
    // Native account dialog must be usable, not hidden beneath another modal's top layer.
    if (device.name === 'phone') {
      await page.getByRole('button', { name: 'Sign in / Register', exact: true }).click();
      assert.equal(await page.locator('#login-modal').evaluate((dialog) => dialog.open), true);
      assert.equal(await page.locator('#login-player-id').evaluate((input) => input === document.activeElement), true);
      await page.getByRole('button', { name: 'Close account sign in' }).click();
      await page.waitForSelector('.match-player-dialog[open]');
    }
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await page.waitForFunction(() => window.game?.isGameRunning && !window.game.levelStarting, null, { timeout: 15000 });
    await page.waitForTimeout(100);
    await page.evaluate(() => {
      window.__qaDefinition = structuredClone(window.game.generatedLevel); window.__qaInventorySpends = 0;
      const spend = window.game.spendPowerUp.bind(window.game);
      window.game.spendPowerUp = (...args) => { window.__qaInventorySpends++; return spend(...args); };
    });
    const fit = await checkFit(page);
    const initialBoardSize = await page.evaluate(() => window.game.boardSize);
    const beforeHint = await snapshot(page);
    await page.locator('[data-action="hint"]').click();
    assert.match(await page.locator('.match-player-announcement').textContent(), /Free hint/);
    assert.deepEqual(await snapshot(page), beforeHint, 'hint does not consume RNG, moves, score, or inventory');
    const feedback = await exerciseFeedback(page, device);
    await exerciseMove(page, 'tap', device.mobile);
    if (device.mobile) await exerciseMove(page, 'swipe', true);
    await exerciseMove(page, 'keyboard', device.mobile);
    await exerciseEarnedSpecials(page, device);
    await exerciseObjectives(page, device);
    await exerciseSound(page, device);
    await exerciseAssistive(page, device);
    await reset(page);

    // Invalid adjacent swaps give feedback even when motion is reduced, and cost nothing.
    const invalid = await page.evaluate(() => {
      const g = window.game;
      const legal = new Set(window.InfiniteLevels.legalSwaps(g.board).map((move) => JSON.stringify(move.cells)));
      for (let r = 0; r < g.boardSize; r++) {
        for (let c = 0; c < g.boardSize - 1; c++) {
          const cells = [r, c, r, c + 1];
          if (!legal.has(JSON.stringify(cells))) return cells;
        }
      }
      return null;
    });
    assert.ok(invalid, 'fixture has an invalid swap');
    const beforeInvalid = await snapshot(page);
    const invalidFirst = await cellPoint(page, invalid[0], invalid[1]);
    const invalidSecond = await cellPoint(page, invalid[2], invalid[3]);
    if (device.mobile) {
      await page.touchscreen.tap(invalidFirst.x, invalidFirst.y);
      await page.waitForTimeout(70);
      await page.touchscreen.tap(invalidSecond.x, invalidSecond.y);
    } else {
      await page.mouse.click(invalidFirst.x, invalidFirst.y);
      await page.waitForTimeout(70);
      await page.mouse.click(invalidSecond.x, invalidSecond.y);
    }
    await page.waitForFunction(() => document.querySelector('.match-player-announcement').textContent.includes('No move spent'));
    assert.deepEqual(await snapshot(page), beforeInvalid, 'invalid swap costs nothing');
    await reset(page);

    // Pause cannot mutate the model; Resume must restore native controls.
    await page.locator('[data-action="pause"]').click();
    assert.equal(await page.evaluate(() => window.game.isPaused), true);
    assert.equal(await page.locator('[data-action="hint"]').isDisabled(), true);
    const paused = await snapshot(page);
    const first = await cellPoint(page, 0, 0);
    if (device.mobile) await page.touchscreen.tap(first.x, first.y);
    else await page.mouse.click(first.x, first.y);
    assert.deepEqual(await snapshot(page), paused);
    await page.locator('[data-action="pause"]').click();
    assert.equal(await page.locator('[data-action="hint"]').isDisabled(), false);

    // Explore -> preferences -> game preserves pause state and persists settings.
    await page.locator('[data-action="menu"]').click();
    await page.getByRole('button', { name: 'Play preferences', exact: true }).click();
    await page.getByRole('checkbox', { name: 'High contrast', exact: true }).check();
    await page.getByRole('checkbox', { name: 'Larger HUD text', exact: true }).check();
    await page.getByRole('checkbox', { name: 'Reduced motion', exact: true }).check();
    await page.getByRole('button', { name: 'Back to game', exact: true }).click();
    assert.equal(await page.evaluate(() => window.game.isPaused), false);
    assert.equal(await page.locator('.match-board-surface').evaluate((element) => element === document.activeElement), true);
    await checkFit(page);
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('phaser3_game_data')).settings);
    assert.equal(stored.highContrast, true);
    assert.equal(stored.largeText, true);
    assert.equal(stored.reduceAnimations, true);
    assert.equal(stored.haptics, false);
    const largestBoardCellPixels = await exerciseLargestBoard(page, device);

    // All main secondary navigation must be reachable without a lingering native modal.
    await page.locator('[data-action="menu"]').click();
    await page.getByRole('button', { name: 'Shop', exact: true }).click();
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    assert.equal(await page.locator('[data-action="hint"]').isDisabled(), false);
    await page.locator('[data-action="menu"]').click();
    await page.getByRole('button', { name: 'Kingdom', exact: true }).click();
    await page.getByRole('button', { name: 'Decor', exact: true }).click();
    await page.getByRole('button', { name: 'Back', exact: true }).click();
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await page.locator('[data-action="menu"]').click();
    await page.getByRole('button', { name: 'Game modes and local level settings', exact: true }).click();
    assert.equal(await page.locator('.match-player-dialog').evaluate((dialog) => dialog.open), false);
    assert.equal(await page.locator('#phaser-game-container').isVisible(), false);
    await page.locator('#menu-return').click();
    assert.equal(await page.evaluate(() => window.game.isPaused), false);
    await page.locator('[data-action="menu"]').click();
    await page.getByRole('button', { name: 'Season and community', exact: true }).click();
    await page.locator('#menu-return').click();
    assert.equal(await page.evaluate(() => window.game.isPaused), false);

    if (device.name === 'phone') {
      const beforeRotate = await snapshot(page);
      await page.setViewportSize({ width: 844, height: 390 });
      await page.waitForTimeout(200);
      await checkFit(page);
      assert.deepEqual(await snapshot(page), beforeRotate, 'rotation preserves active board and RNG');
      await page.setViewportSize({ width: device.width, height: device.height });
      await page.waitForTimeout(200);
    }

    // A player-initiated pause is not silently undone by preferences or a secondary screen.
    await page.locator('[data-action="pause"]').click();
    await page.locator('[data-action="menu"]').click();
    await page.getByRole('button', { name: 'Play preferences', exact: true }).click();
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => window.game.isPaused), true);
    await page.locator('[data-action="menu"]').click();
    await page.getByRole('button', { name: 'Shop', exact: true }).click();
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    assert.equal(await page.evaluate(() => window.game.isPaused), true);
    await page.locator('[data-action="pause"]').click();

    // Preference storage survives a real reload and the next Play action.
    if (device.name === 'phone') {
      await page.locator('[data-action="menu"]').click();
      await page.getByRole('button', { name: 'Play preferences', exact: true }).click();
      await page.getByRole('checkbox', { name: 'Text board (named cells and larger targets)', exact: true }).check();
      await page.getByRole('button', { name: 'Back to game', exact: true }).click();
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.match-player-dialog[open]');
      assert.equal(await page.evaluate(() => window.__qaAudioContexts), 0, 'saved opt-in does not autoplay on reload');
      await page.getByRole('button', { name: 'Play', exact: true }).click();
      await page.waitForFunction(() => window.game?.isGameRunning && !window.game.levelStarting);
      const settings = await page.evaluate(() => window.game.settings);
      assert.equal(settings.highContrast, true);
      assert.equal(settings.largeText, true);
      assert.equal(settings.reduceAnimations, true);
      assert.equal(settings.textBoard, true);
      assert.equal(settings.sfx, true); assert.equal(settings.soundChoiceVersion, 1); assert.equal(settings.soundVolume, 0.25);
      await page.waitForFunction(() => window.game.getSoundStatus().state === 'ready');
      assert.equal(await page.evaluate(() => window.__qaAudioContexts), 1, 'saved opt-in unlocks one context only after actual Play gesture');
      await checkNamedBoard(page, true);
      await page.locator('[data-action="menu"]').click();
      await page.getByRole('button', { name: 'Use visual board', exact: true }).click();
      await checkFit(page);
    }
    await page.screenshot({ path: path.join(output, `${device.name}.png`) });
    assert.deepEqual(errors, [], 'no page JavaScript errors');
    const result = { device: device.name, feedback, viewport: `${device.width}x${device.height}`, boardSize: initialBoardSize,
      gemCellPixels: Math.round(fit.boardExtent / initialBoardSize), largestBoardCellPixels, errors, checks: 'bounded-staged-feedback, real-intermediate-textures, protected-anchors, skip/pause/motion/focus/lifecycle-cancel, instant-accessible-paths, layout, hint, tap, invalid-swap, keyboard, pause, preferences, navigation, special-earning, special-tap, swipe-combo, keyboard-combo, special-guide, collection-progress, pair/mixed/collection-win, objective-guide, objective-replay, opt-in-sound, volume/mute/pause/lifecycle, audio-parity, semantic-grid/AX/roving-focus, native-cell-actions, text-board-52px-scroll, largest-board/large-text',
      touchSwipe: device.mobile };
    if (device.name === 'phone') {
      await page.evaluate(() => window.game.destroy());
      assert.equal(await page.evaluate(() => window.game.matchFeedback.status().images), 0, 'teardown releases feedback images');
      assert.equal(await page.locator('.match-assistive-board').count(), 0, 'teardown removes semantic controls and pending refresh timers');
      await page.evaluate(() => document.dispatchEvent(new window.PointerEvent('pointerup', { pointerId: 1 })));
      assert.deepEqual(errors, [], 'teardown and later pointer events leave no stale callbacks');
    }
    results.push(result);
    console.log(JSON.stringify(result));
  } catch (error) {
    if (page) await page.screenshot({ path: path.join(output, `${device.name}-failed.png`) }).catch(() => {});
    throw error;
  } finally {
    await browser.close();
  }
  if (device.name === 'phone') await soundFallbackCases();
}
fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ url, results }, null, 2));
console.log(`Player browser smoke passed for ${results.length} viewports. Screenshots and results: ${output}`);
