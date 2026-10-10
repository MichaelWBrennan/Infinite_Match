/* Read-only, bounded presentation of observations from the shared resolver.
   No matching, refill RNG, score, goals, inventory, moves or network operations. */
(function (root) {
  'use strict';
  const MAX_FRAMES = 3;
  const SWAP_MS = 90;
  const READ_MS = 65;
  const CLEAR_MS = 65;
  const FALL_MS = 90;
  const SETTLE_MS = 60;
  const MAX_DURATION_MS = SWAP_MS + MAX_FRAMES * (READ_MS + CLEAR_MS + FALL_MS) + SETTLE_MS;
  const WATCHDOG_MS = MAX_DURATION_MS + 390; // Headroom for slow render/task scheduling, still bounded.
  const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
  const specials = [null, 'row', 'column', 'burst', 'prism'];
  const names = { row: 'Row Beam', column: 'Column Beam', burst: 'Burst', prism: 'Prism', beam: 'Beam' };

  function matrix(value, size, values) {
    return Array.isArray(value) && value.length === size && value.every((row) => Array.isArray(row) && row.length === size && row.every((cell) => values.includes(cell)));
  }
  function frame(value, size, shielded = false) {
    return value && matrix(value.board, size, colors) && matrix(value.specials, size, specials)
      && (!shielded || matrix(value.shields, size, [0, 1, 2]));
  }
  function validKey(key, size) {
    return typeof key === 'string' && /^\d,\d$/.test(key) && key.split(',').every((value) => Number(value) < size);
  }

  // Geometry only: map surviving images downwards and recycled images to the
  // refill cells already supplied by the resolver. This never deals a gem.
  function fallingCells(size, cleared) {
    const keys = new Set(cleared);
    const cells = [];
    for (let col = 0; col < size; col++) {
      let row = size - 1;
      const free = [];
      for (let source = size - 1; source >= 0; source--) {
        if (keys.has(`${source},${col}`)) free.push(source);
        else cells.push({ from: source, row: row--, col, refill: false });
      }
      free.forEach((source, index) => cells.push({ from: source, row: row--, col, refill: true, start: -1 - index }));
    }
    return cells;
  }

  function planFor(result) {
    const trace = result?.presentation;
    const size = result?.board?.length;
    const shielded = result?.shields !== undefined;
    if (!Number.isInteger(size) || size < 3 || size > 8 || !frame(result, size, shielded) || !frame(trace?.initial, size, shielded)
        || !Number.isInteger(result.cascades) || result.cascades < 1 || result.cascades > 64 || !Array.isArray(result.events)
        || result.events.length !== result.cascades || !Array.isArray(trace.frames) || trace.frames.length !== Math.min(MAX_FRAMES, result.cascades)) return null;
    if (trace.cells !== null && (!Array.isArray(trace.cells) || ![2, 4].includes(trace.cells.length)
        || !trace.cells.every((value) => Number.isInteger(value) && value >= 0 && value < size))) return null;
    const waves = [];
    for (let index = 0; index < trace.frames.length; index++) {
      const visual = trace.frames[index]; const event = result.events[index];
      if (!frame(visual?.before, size, shielded) || !frame(visual?.after, size, shielded) || !event || !Array.isArray(event.cleared)
          || event.cleared.length > size * size || !event.cleared.every((key) => validKey(key, size))
          || new Set(event.cleared).size !== event.cleared.length || !Number.isFinite(event.points) || event.points < 0
          || !Array.isArray(event.created) || !event.created.every((item) => item && validKey(`${item.row},${item.col}`, size) && specials.slice(1).includes(item.type))
          || !Array.isArray(event.activated)) return null;
      if (shielded) {
        if (!Array.isArray(event.shieldHits) || event.shieldHits.length > size * size) return null;
        const hits = new Set();
        for (const hit of event.shieldHits) {
          const key = `${hit?.row},${hit?.col}`;
          if (!Number.isInteger(hit?.row) || !Number.isInteger(hit?.col) || !validKey(key, size)
            || hits.has(key) || !event.cleared.includes(key) || ![0, 1].includes(hit.remaining)
            || visual.before.shields[hit.row][hit.col] !== hit.remaining + 1
            || visual.after.shields[hit.row][hit.col] !== hit.remaining) return null;
          hits.add(key);
        }
        for (let row = 0; row < size; row++) for (let col = 0; col < size; col++) {
          if (!hits.has(`${row},${col}`) && visual.before.shields[row][col] !== visual.after.shields[row][col]) return null;
        }
        const preceding = index ? waves[index - 1].after.shields : trace.initial.shields;
        if (visual.before.shields.some((row, r) => row.some((hits, c) => hits !== preceding[r][c]))) return null;
      }
      waves.push({ ...visual, event, falls: fallingCells(size, event.cleared) });
    }
    if (shielded && result.cascades === waves.length && result.shields.some((row, r) => row.some((hits, c) => hits !== waves.at(-1).after.shields[r][c]))) return null;
    return { size, initial: trace.initial, cells: trace.cells, waves, total: result.cascades, final: result };
  }

  function waveLabel(event, index, total) {
    const phase = index ? `Cascade ${index + 1}/${total}` : 'Match';
    const combo = event.combo ? event.combo.split('+').map((kind) => names[kind] || kind).join(' + ') : '';
    const earned = [...new Set(event.created.map((item) => names[item.type]))].join(', ');
    const detail = combo ? `${combo} combo` : earned ? `Earned ${earned}` : event.activated.length ? `${event.activated.length} special${event.activated.length === 1 ? '' : 's'} activated` : '';
    const hits = event.shieldHits || [];
    const broken = hits.filter((hit) => hit.remaining === 0).length;
    const shieldDetail = hits.length ? ` · ${hits.length} shield hit${hits.length === 1 ? '' : 's'}${broken ? `, ${broken} cleared` : ''}` : '';
    return `${phase}${detail ? ` · ${detail}` : ''}${shieldDetail} · +${event.points} points`;
  }

  function create(game, environment = root) {
    const scene = game.scene;
    if (!scene?.add?.container || !scene.add.graphics || !scene.make?.graphics || !scene.tweens?.add || !environment.setTimeout) return null;
    let disposed = false; let failed = false; let current = null; let lastReason = null;
    let layer = null; let footprint = null; let maskSource = null; let mask = null;
    const views = [];
    const terrain = []; // Fixed numbered overlays; never move with falling/refilling gems.
    const removers = [];
    const motion = environment.matchMedia?.('(prefers-reduced-motion: reduce)');

    function listen(target, event, handler) {
      if (!target?.addEventListener) return;
      target.addEventListener(event, handler);
      removers.push(() => target.removeEventListener(event, handler));
    }
    function textView() { return !!game.playerUI?.surface?.classList?.contains('match-text-board-active') || game.settings?.textBoard === true; }
    function canStage() {
      return !disposed && !failed && !current && !!game.playerUI && !game.animationsReduced() && !motion?.matches && !textView()
        && game.isGameRunning && !game.isPaused && !game.playerUI?.shell?.querySelector?.('dialog')?.open && !environment.document?.hidden;
    }
    function safely(action) { try { action(); } catch { failed = true; } }
    function stopTweens() { for (const image of views) safely(() => scene.tweens.killTweensOf(image)); if (footprint) safely(() => scene.tweens.killTweensOf(footprint)); }
    function ensureLayer(size, shielded) {
      if (!layer) {
        layer = scene.add.container(0, 0).setName('match-feedback-layer').setDepth(10).setVisible(false);
        footprint = scene.add.graphics(); layer.add(footprint);
        maskSource = scene.make.graphics({ add: false });
        mask = maskSource.createGeometryMask(); layer.setMask(mask);
      }
      while (views.length < size * size) {
        const image = scene.add.image(0, 0, 'gem_red'); // Deliberately no input hit area.
        views.push(image); layer.add(image);
      }
      // The footprint belongs above gems; terrain belongs above both and stays fixed.
      layer.bringToTop(footprint);
      if (shielded) while (terrain.length < size * size) {
        const image = scene.add.image(0, 0, 'shield_overlay_1').setVisible(false);
        terrain.push(image); layer.add(image);
      }
      for (const image of terrain) layer.bringToTop(image);
      maskSource.clear().fillStyle(0xffffff).fillRect(game.cellX(0) - game.cellStep / 2, game.cellY(0) - game.cellStep / 2, size * game.cellStep, size * game.cellStep);
    }
    function drawTerrain(snapshot, size) {
      terrain.forEach((image, index) => {
        const row = Math.floor(index / size); const col = index % size;
        const hits = index < size * size ? snapshot.shields?.[row]?.[col] : 0;
        image.setVisible(!!hits);
        if (hits) image.setTexture(`shield_overlay_${hits}`).setPosition(game.cellX(col), game.cellY(row)).setScale(game.gemScale);
      });
    }
    function draw(snapshot, size) {
      stopTweens(); footprint.clear().setAlpha(1);
      views.forEach((image, index) => {
        image.setVisible(index < size * size);
        if (index >= size * size) return;
        const row = Math.floor(index / size); const col = index % size;
        image.setTexture(game.gemTexture(snapshot.board[row][col], snapshot.specials[row][col]));
        image.setPosition(game.cellX(col), game.cellY(row)).setScale(game.gemScale).setAlpha(1);
      });
      drawTerrain(snapshot, size);
    }
    function label(text, index, phase) {
      if (!current) return;
      current.wave = index; current.phase = phase;
      game.playerUI?.setResolution?.({ text, busy: true, phase });
    }
    function guard(run, action) {
      if (current !== run || disposed) return;
      if (run.epoch !== game.boardEpoch) { finish('stale-board', false); return; }
      try { action(); } catch { failed = true; finish('unavailable'); }
    }
    function now() { return environment.performance?.now() ?? environment.Date.now(); }
    function later(run, duration, action) {
      run.nextAt += duration;
      // Absolute deadlines: DOM/render work must not accumulate an extra delay
      // per phase. A stalled browser still has a separate bounded watchdog.
      const delay = Math.max(0, run.startedAt + run.nextAt - now());
      run.timer = environment.setTimeout(() => { run.timer = null; guard(run, action); }, delay);
    }
    function settled(run) {
      draw(run.plan.final, run.plan.size);
      const skipped = run.plan.total - run.plan.waves.length;
      label(run.plan.final.reshuffled ? 'Free board repair · settled' : skipped ? `${skipped} more cascade${skipped === 1 ? '' : 's'} resolved · settled` : 'Board settled', run.plan.waves.length, 'settled');
      later(run, SETTLE_MS, () => finish('complete'));
    }
    function wave(run, index) {
      if (index >= run.plan.waves.length) { settled(run); return; }
      const visual = run.plan.waves[index]; const event = visual.event; const size = run.plan.size;
      draw(visual.before, size);
      label(waveLabel(event, index, run.plan.total), index + 1, 'read');
      footprint.fillStyle(event.combo ? 0xffdf87 : 0x80dac9, 0.12);
      for (const key of event.cleared) {
        const [row, col] = key.split(',').map(Number);
        footprint.fillRoundedRect(game.cellX(col) - 24, game.cellY(row) - 24, 48, 48, 8);
      }
      later(run, READ_MS, () => {
        label(waveLabel(event, index, run.plan.total), index + 1, 'clear');
        for (const item of event.created) {
          views[item.row * size + item.col].setTexture(game.gemTexture(visual.before.board[item.row][item.col], item.type));
        }
        const cleared = event.cleared.map((key) => { const [row, col] = key.split(',').map(Number); return views[row * size + col]; });
        if (cleared.length) scene.tweens.add({ targets: cleared, alpha: 0, duration: CLEAR_MS, ease: 'Quad.easeIn' });
        scene.tweens.add({ targets: footprint, alpha: 0, duration: CLEAR_MS });
        later(run, CLEAR_MS, () => {
          stopTweens(); footprint.clear();
          drawTerrain(visual.after, size); // Damage updates in place, never riding a gem.
          label(waveLabel(event, index, run.plan.total), index + 1, 'fall');
          for (const cell of visual.falls) {
            const image = views[cell.from * size + cell.col];
            image.setAlpha(1);
            if (cell.refill) {
              image.setTexture(game.gemTexture(visual.after.board[cell.row][cell.col], visual.after.specials[cell.row][cell.col]));
              image.setPosition(game.cellX(cell.col), game.cellY(cell.start));
            }
            scene.tweens.add({ targets: image, y: game.cellY(cell.row), duration: FALL_MS, ease: 'Quad.easeOut' });
          }
          later(run, FALL_MS, () => wave(run, index + 1));
        });
      });
    }
    function play(result) {
      if (!canStage()) return false;
      const plan = planFor(result);
      if (!plan || plan.size !== game.boardSize) return false;
      const run = { plan, epoch: game.boardEpoch, core: game.gemSprites.flat(), timer: null, watchdog: null, wave: 0, phase: 'swap', startedAt: 0, nextAt: 0 };
      current = run; lastReason = null;
      guard(run, () => {
        ensureLayer(plan.size, !!plan.initial.shields?.some((row) => row.some(Boolean))); draw(plan.initial, plan.size); layer.setVisible(true);
        for (const image of run.core) image.setVisible(false);
        run.startedAt = now();
        run.watchdog = environment.setTimeout(() => guard(run, () => finish('watchdog')), WATCHDOG_MS);
        label(plan.cells?.length === 4 ? 'Swap · resolving' : 'Special effect · resolving', 0, 'swap');
        if (plan.cells?.length === 4) {
          const [r1, c1, r2, c2] = plan.cells;
          scene.tweens.add({ targets: views[r1 * plan.size + c1], x: game.cellX(c2), y: game.cellY(r2), duration: SWAP_MS });
          scene.tweens.add({ targets: views[r2 * plan.size + c2], x: game.cellX(c1), y: game.cellY(r1), duration: SWAP_MS });
          later(run, SWAP_MS, () => wave(run, 0));
        } else wave(run, 0);
      });
      return current === run;
    }
    function finish(reason = 'skip', notify = true) {
      const run = current;
      if (!run) return false;
      current = null; lastReason = reason; // First: late callbacks and reentrant result/board replacement are inert.
      if (run.timer !== null) environment.clearTimeout(run.timer);
      if (run.watchdog !== null) environment.clearTimeout(run.watchdog);
      stopTweens(); safely(() => layer?.setVisible(false)); safely(() => footprint?.clear());
      if (run.epoch === game.boardEpoch) for (const image of run.core) if (image.active !== false) safely(() => image.setVisible(true));
      safely(() => game.playerUI?.setResolution?.(null));
      if (notify && !disposed && run.epoch === game.boardEpoch) game.onMatchFeedbackSettled?.(run.epoch, reason);
      return true;
    }
    function destroy() {
      if (disposed) return;
      disposed = true; finish('destroy', false);
      removers.splice(0).forEach((remove) => remove());
      scene.events?.off('shutdown', destroy);
      safely(() => layer?.destroy(true)); safely(() => mask?.destroy()); safely(() => maskSource?.destroy()); views.length = 0;
      layer = footprint = mask = maskSource = null; terrain.length = 0;
    }
    listen(environment.document, 'visibilitychange', () => { if (environment.document.hidden) finish('background'); });
    listen(environment, 'pagehide', () => finish('pagehide'));
    listen(motion, 'change', () => { if (motion.matches) finish('reduced-motion'); });
    listen(game.playerUI?.surface, 'focusin', () => { if (textView()) finish('named-cell-view'); });
    scene.events?.once('shutdown', destroy);
    return { canStage, play, finish, destroy, isActive: () => !!current,
      status: () => ({ active: !!current, lastReason, wave: current?.wave || 0, phase: current?.phase || 'idle', images: views.length + terrain.length, scheduledDurationMs: MAX_DURATION_MS, watchdogMs: WATCHDOG_MS }) };
  }

  root.InfiniteMatchFeedback = Object.freeze({ create, planFor, fallingCells, waveLabel, MAX_FRAMES, MAX_DURATION_MS, WATCHDOG_MS });
})(typeof window === 'undefined' ? globalThis : window);
