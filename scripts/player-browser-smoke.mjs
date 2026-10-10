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
    return !(g.inputLockedUntil > Date.now()) && g.gemSprites.every((row, r) => row.every((gem, c) =>
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
  return expected;
}

async function exerciseMove(page, method, mobile) {
  await reset(page);
  const cells = await page.evaluate(() => window.InfiniteLevels.levelActions(window.game.generatedLevel, window.game.board, window.game.specials)[0].cells);
  return performAction(page, cells, method, mobile);
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

for (const device of cases) {
  const browser = await chromium.launch({ executablePath, args, headless: true });
  let page;
  try {
    const context = await browser.newContext({ viewport: { width: device.width, height: device.height },
      isMobile: device.mobile, hasTouch: device.mobile, deviceScaleFactor: 1, reducedMotion: device.motion });
    page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.match-player-dialog[open]', { timeout: 30000 });
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
    await exerciseMove(page, 'tap', device.mobile);
    if (device.mobile) await exerciseMove(page, 'swipe', true);
    await exerciseMove(page, 'keyboard', device.mobile);
    await exerciseEarnedSpecials(page, device);
    await exerciseObjectives(page, device);
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
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.match-player-dialog[open]');
      await page.getByRole('button', { name: 'Play', exact: true }).click();
      await page.waitForFunction(() => window.game?.isGameRunning && !window.game.levelStarting);
      const settings = await page.evaluate(() => window.game.settings);
      assert.equal(settings.highContrast, true);
      assert.equal(settings.largeText, true);
      assert.equal(settings.reduceAnimations, true);
      await checkFit(page);
    }
    await page.screenshot({ path: path.join(output, `${device.name}.png`) });
    assert.deepEqual(errors, [], 'no page JavaScript errors');
    const result = { device: device.name, viewport: `${device.width}x${device.height}`, boardSize: initialBoardSize,
      gemCellPixels: Math.round(fit.boardExtent / initialBoardSize), largestBoardCellPixels, errors, checks: 'layout, hint, tap, invalid-swap, keyboard, pause, preferences, navigation, special-earning, special-tap, swipe-combo, keyboard-combo, special-guide, collection-progress, pair/mixed/collection-win, objective-guide, objective-replay, largest-board/large-text',
      touchSwipe: device.mobile };
    results.push(result);
    console.log(JSON.stringify(result));
  } catch (error) {
    if (page) await page.screenshot({ path: path.join(output, `${device.name}-failed.png`) }).catch(() => {});
    throw error;
  } finally {
    await browser.close();
  }
}
fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ url, results }, null, 2));
console.log(`Player browser smoke passed for ${results.length} viewports. Screenshots and results: ${output}`);
