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
    return { board: g.board, score: g.score, moves: g.moves, rng: g.levelRng.state,
      charges: Array.from(g.playerUI.powerups, ([type, slot]) => [type, slot.btn.getData('count')]) };
  });
}

async function checkFit(page) {
  const fit = await page.evaluate(() => {
    const g = window.game;
    const shell = g.playerUI.shell.getBoundingClientRect();
    const surface = g.playerUI.surface.getBoundingClientRect();
    const canvas = g.game.canvas.getBoundingClientRect();
    const size = g.boardSize * g.cellStep * g.scene.cameras.main.zoom;
    const buttons = Array.from(g.playerUI.shell.querySelectorAll('footer button'))
      .filter((button) => button.getClientRects().length)
      .map((button) => ({ name: button.textContent.trim(), ...button.getBoundingClientRect().toJSON() }));
    return { width: innerWidth, height: innerHeight, bodyWidth: document.body.scrollWidth,
      shell: shell.toJSON(), surface: surface.toJSON(), canvas: canvas.toJSON(), boardExtent: size, buttons };
  });
  assert.ok(fit.bodyWidth <= fit.width + 1, 'no horizontal page overflow');
  assert.ok(fit.surface.width > 0 && fit.surface.height > 0, 'board has a viewport');
  assert.ok(fit.boardExtent <= Math.min(fit.surface.width, fit.surface.height) + 1, 'entire board fits');
  assert.ok(fit.surface.bottom <= fit.height + 1, 'board is visible vertically');
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

async function exerciseMove(page, method, mobile) {
  await reset(page);
  const before = await snapshot(page);
  const { cells, expected } = await page.evaluate(() => {
    const g = window.game;
    const cells = window.InfiniteLevels.legalSwaps(g.board)[0].cells;
    return { cells, expected: window.InfiniteLevels.simulateMove(g.board, g.levelRng.state, g.gemTypes, g.generatedLevel.gemWeights, cells) };
  });
  const first = await cellPoint(page, cells[0], cells[1]);
  const second = await cellPoint(page, cells[2], cells[3]);
  if (method === 'tap') {
    if (mobile) {
      await page.touchscreen.tap(first.x, first.y);
      await page.waitForTimeout(70);
      await page.touchscreen.tap(second.x, second.y);
    } else {
      await page.mouse.click(first.x, first.y);
      await page.waitForTimeout(70);
      await page.mouse.click(second.x, second.y);
    }
  } else if (method === 'swipe') {
    const session = await page.context().newCDPSession(page);
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...first, id: 1 }] });
    await page.waitForTimeout(50);
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...second, id: 1 }] });
    await page.waitForTimeout(50);
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await session.detach();
  } else {
    const board = page.locator('.match-board-surface');
    await board.focus();
    for (let row = 0; row < cells[0]; row++) await board.press('ArrowDown');
    for (let col = 0; col < cells[1]; col++) await board.press('ArrowRight');
    await board.press('Enter');
    await board.press(cells[2] > cells[0] ? 'ArrowDown' : 'ArrowRight');
    await board.press('Space');
  }
  await page.waitForFunction((moves) => window.game.moves === moves - 1, before.moves, { timeout: 5000 });
  const after = await snapshot(page);
  assert.deepEqual(after.board, expected.board, `${method}: shared-rule board parity`);
  assert.equal(after.rng, expected.refillState, `${method}: deterministic refill parity`);
  assert.equal(after.score - before.score, expected.score, `${method}: shared-rule score parity`);
  assert.deepEqual(after.charges, before.charges, `${method}: no booster charge spent`);
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
    await page.evaluate(() => { window.__qaDefinition = structuredClone(window.game.generatedLevel); });
    const fit = await checkFit(page);
    const beforeHint = await snapshot(page);
    await page.locator('[data-action="hint"]').click();
    assert.match(await page.locator('.match-player-announcement').textContent(), /Free hint/);
    assert.deepEqual(await snapshot(page), beforeHint, 'hint does not consume RNG, moves, score, or inventory');
    await exerciseMove(page, 'tap', device.mobile);
    if (device.mobile) await exerciseMove(page, 'swipe', true);
    await exerciseMove(page, 'keyboard', device.mobile);
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
    const result = { device: device.name, viewport: `${device.width}x${device.height}`, boardSize: await page.evaluate(() => window.game.boardSize),
      gemCellPixels: Math.round(fit.boardExtent / await page.evaluate(() => window.game.boardSize)), errors, checks: 'layout, hint, tap, invalid-swap, keyboard, pause, preferences, navigation',
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
