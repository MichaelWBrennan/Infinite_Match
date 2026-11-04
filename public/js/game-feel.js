/* Infinite Match game-feel layer.
 * Read-only presentation juice: particles, special detonations, bounded camera
 * impact, and opt-in haptics. It never touches matching, refill RNG, score,
 * moves, inventory, network, or save data. Visual effects are deterministic and
 * capped; haptics require the player's explicit haptics preference.
 */
(function (root) {
  'use strict';

  const MAX_PARTICLES = 96;
  const MAX_RING_SECONDS = 0.45;
  const HAPTIC_GAP_MS = 140;
  const COLORS = Object.freeze({
    red: 0xff6b6b, blue: 0x4ecdc4, green: 0x95e06c, yellow: 0xffe66d,
    purple: 0xb28dff, orange: 0xffa94d, gold: 0xf5d58b, ink: 0x10213a,
  });
  const Kinds = Object.freeze(['match', 'cascade', 'earned', 'beam', 'burst', 'prism', 'combo']);

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function kindFor(event) {
    if (event && typeof event.combo === 'string' && event.combo.length) return 'combo';
    const activated = Array.isArray(event?.activated) ? event.activated : [];
    if (activated.some((item) => item?.type === 'prism')) return 'prism';
    if (activated.some((item) => item?.type === 'burst')) return 'burst';
    if (activated.some((item) => item?.type === 'row' || item?.type === 'column')) return 'beam';
    if (Array.isArray(event?.created) && event.created.length) return 'earned';
    return 'match';
  }

  /** Pure, bounded intensity plan for one settled resolver wave. */
  function intensityFor(event = {}, waveIndex = 0, total = 1) {
    const cleared = Array.isArray(event?.cleared) ? event.cleared.length : 0;
    const activated = Array.isArray(event?.activated) ? event.activated.length : 0;
    const created = Array.isArray(event?.created) ? event.created.length : 0;
    const kind = kindFor(event);
    let score = 0;
    if (cleared >= 5) score += 1;
    if (cleared >= 10) score += 1;
    if (created) score += 1;
    if (activated) score += kind === 'prism' || kind === 'combo' ? 2 : 1;
    if (kind === 'combo') score += 1;
    const cascade = clamp(Number.isInteger(waveIndex) ? waveIndex : 0, 0, 8);
    if (cascade > 0) score += Math.min(2, cascade);
    const level = clamp(score, 0, 4);
    const waves = clamp(Number.isInteger(total) ? total : 1, 1, 64);
    const particles = level === 0 ? Math.min(4, cleared) : clamp(4 + cleared + level * 3, 6, 28);
    const shakeMs = level >= 2 ? clamp(50 + level * 22 + cascade * 8, 60, 160) : 0;
    const shakeStrength = level >= 2 ? clamp(0.0012 * level + cascade * 0.0004, 0.0015, 0.006) : 0;
    return Object.freeze({
      kind, level, cleared, activated, created, cascade, waves,
      particles, shakeMs, shakeStrength,
      ring: level >= 2 || kind === 'earned',
      beam: kind === 'beam' || kind === 'combo',
      burst: kind === 'burst' || kind === 'combo',
      prism: kind === 'prism' || kind === 'combo',
    });
  }

  /** Short, explicit, capped vibration patterns. Silent unless opted in. */
  function hapticFor(plan) {
    const level = clamp(plan?.level ?? 0, 0, 4);
    if (plan?.kind === 'combo') return Object.freeze([22, 35, 22, 35, 40]);
    if (plan?.kind === 'prism') return Object.freeze([18, 30, 18, 30, 30]);
    if (plan?.kind === 'burst') return Object.freeze([28, 25, 28]);
    if (plan?.kind === 'beam') return Object.freeze([16, 20, 16]);
    if (level >= 2) return Object.freeze([12, 22, 14]);
    if (level === 1) return Object.freeze([10, 16, 10]);
    return Object.freeze([8]);
  }

  function colorFor(type) {
    const value = root.InfinitePlayerExperience?.visuals?.[type]?.color;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)) return parseInt(value.slice(1), 16);
    return COLORS[type] || COLORS.gold;
  }

  function create(game, environment = root) {
    const scene = game?.scene;
    if (!scene?.add || !scene.tweens?.add) return null;
    let disposed = false;
    let lastHaptic = -Infinity;
    const active = new Set();
    const removers = [];
    const motion = environment.matchMedia?.('(prefers-reduced-motion: reduce)');

    function listen(target, event, handler) {
      if (!target?.addEventListener) return;
      target.addEventListener(event, handler);
      removers.push(() => target.removeEventListener(event, handler));
    }
    function now() {
      return environment.performance?.now?.() ?? environment.Date?.now?.() ?? Date.now();
    }
    function textView() {
      return game.settings?.textBoard === true || !!game.playerUI?.surface?.classList?.contains('match-text-board-active');
    }
    function canAnimate() {
      return !disposed && game.isGameRunning === true && game.isPaused !== true
        && game.settings?.impactEffects !== false
        && game.settings?.reduceAnimations !== true
        && game.animationsReduced?.() !== true && motion?.matches !== true
        && game.namedBoardActive?.() !== true
        && !textView() && environment.document?.hidden !== true
        && !game.playerUI?.shell?.querySelector?.('dialog')?.open;
    }
    function canHaptic() {
      return !disposed && game.settings?.haptics === true && game.isPaused !== true
        && environment.document?.hidden !== true && typeof environment.navigator?.vibrate === 'function';
    }
    function release(object) {
      if (!object) return;
      active.delete(object);
      try { scene.tweens.killTweensOf(object); } catch { /* Optional presentation only. */ }
      try { object.destroy(); } catch { /* Already destroyed by scene shutdown. */ }
    }
    function reset() {
      for (const object of [...active]) release(object);
      active.clear();
    }
    function track(object) {
      if (!object) return null;
      active.add(object);
      while (active.size > MAX_PARTICLES) release(active.values().next().value);
      return object;
    }
    function tween(object, config) {
      if (!object) return;
      try {
        scene.tweens.add({
          targets: object,
          ...config,
          onComplete: () => {
            try { config.onComplete?.(); } catch { /* Ignore optional callback faults. */ }
            release(object);
          },
        });
      } catch {
        release(object);
      }
    }
    function spark(x, y, color, angle, distance, size) {
      const dot = scene.add.circle
        ? scene.add.circle(x, y, size, color, 0.95)
        : scene.add.rectangle(x, y, size * 2, size * 2, color, 0.95);
      if (!dot) return;
      dot.setDepth?.(14);
      track(dot);
      tween(dot, {
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.25,
        duration: 240 + size * 24,
        ease: 'Cubic.easeOut',
      });
    }
    function ring(x, y, color, radius = 10) {
      const circle = scene.add.circle?.(x, y, radius, color, 0);
      if (!circle) return;
      circle.setStrokeStyle?.(3, color, 0.75);
      circle.setDepth?.(13);
      track(circle);
      tween(circle, { scale: 3.2, alpha: 0, duration: MAX_RING_SECONDS * 1000, ease: 'Quad.easeOut' });
    }
    function beam(kind, row, col, color) {
      const size = game.boardSize;
      const step = game.cellStep;
      if (!Number.isInteger(size) || !Number.isFinite(step) || !game.cellX || !game.cellY) return;
      const graphics = scene.add.graphics?.();
      if (!graphics) return;
      graphics.setDepth?.(12);
      graphics.fillStyle(color, 0.28);
      if (kind === 'row') {
        graphics.fillRoundedRect(game.cellX(0) - step / 2, game.cellY(row) - step * 0.2, size * step, step * 0.4, step * 0.2);
      } else {
        graphics.fillRoundedRect(game.cellX(col) - step * 0.2, game.cellY(0) - step / 2, step * 0.4, size * step, step * 0.2);
      }
      track(graphics);
      tween(graphics, { alpha: 0, duration: 220, ease: 'Quad.easeOut' });
    }
    function impact(plan) {
      if (!plan.shakeMs || !scene.cameras?.main?.shake) return;
      try {
        scene.cameras.main.shake(plan.shakeMs, plan.shakeStrength);
      } catch { /* Camera impact is optional; never block play. */ }
    }
    function haptic(plan) {
      if (!canHaptic()) return false;
      const time = now();
      if (time - lastHaptic < HAPTIC_GAP_MS) return false;
      lastHaptic = time;
      try {
        environment.navigator.vibrate(hapticFor(plan));
        return true;
      } catch {
        return false;
      }
    }
    function cellCenter(key) {
      const [row, col] = String(key).split(',').map(Number);
      if (!Number.isInteger(row) || !Number.isInteger(col) || !game.cellX || !game.cellY) return null;
      return { row, col, x: game.cellX(col), y: game.cellY(row) };
    }
    function wave(event, waveIndex = 0, total = 1, before = null) {
      const plan = intensityFor(event, waveIndex, total);
      haptic(plan);
      if (!canAnimate() || !event) return plan;
      const cleared = Array.isArray(event.cleared) ? event.cleared : [];
      const sample = Math.max(1, Math.ceil(cleared.length / Math.max(1, plan.particles)));
      let emitted = 0;
      for (let index = 0; index < cleared.length && emitted < plan.particles; index += sample) {
        const center = cellCenter(cleared[index]);
        if (!center) continue;
        const type = before?.board?.[center.row]?.[center.col];
        const color = colorFor(type);
        const count = Math.min(3, plan.particles - emitted);
        for (let i = 0; i < count; i++) {
          // Deterministic golden-angle spread; no gameplay or visual RNG.
          const angle = (index * 2.399963229728653) + (i * 2.0943951023931953);
          spark(center.x, center.y, color, angle, 16 + plan.level * 7 + i * 4, 2.2 + plan.level * 0.5);
          emitted++;
        }
        if (plan.ring && emitted <= 3) ring(center.x, center.y, COLORS.gold, 9);
      }
      for (const item of Array.isArray(event.activated) ? event.activated : []) {
        const center = cellCenter(`${item?.row},${item?.col}`);
        if (!center) continue;
        if (item.type === 'row' || item.type === 'column' || plan.beam) beam(item.type === 'column' ? 'column' : 'row', center.row, center.col, COLORS.gold);
        if (item.type === 'burst' || plan.burst) ring(center.x, center.y, COLORS.orange, 14);
        if (item.type === 'prism' || plan.prism) ring(center.x, center.y, COLORS.blue, 18);
      }
      if (plan.kind === 'earned' && Array.isArray(event.created)) {
        for (const item of event.created) {
          const center = cellCenter(`${item?.row},${item?.col}`);
          if (center) ring(center.x, center.y, COLORS.gold, 12);
        }
      }
      impact(plan);
      return plan;
    }
    function pulse(cascades = 1) {
      const plan = intensityFor({ cleared: [] }, clamp(cascades - 1, 0, 8), cascades);
      haptic(plan);
      if (canAnimate() && plan.level >= 2) impact(plan);
      return plan;
    }
    function invalid() {
      const plan = intensityFor({ cleared: [] }, 0, 1);
      if (!canHaptic()) return false;
      const time = now();
      if (time - lastHaptic < HAPTIC_GAP_MS) return false;
      lastHaptic = time;
      try { environment.navigator.vibrate([12]); return true; } catch { return false; }
    }
    function celebrate(stars = 0) {
      const plan = intensityFor({ combo: stars > 0 ? 'win' : '' }, stars > 0 ? 2 : 0, 3);
      if (stars <= 0) return plan;
      haptic(plan);
      if (!canAnimate() || !game.cellX || !game.cellY) return plan;
      const size = game.boardSize || 6;
      const x = game.cellX((size - 1) / 2);
      const y = game.cellY((size - 1) / 2);
      const colors = [COLORS.gold, COLORS.blue, COLORS.green, COLORS.purple, COLORS.orange];
      for (let i = 0; i < 24; i++) {
        const angle = i * 2.399963229728653;
        spark(x, y, colors[i % colors.length], angle, 40 + (i % 5) * 12, 3);
      }
      ring(x, y, COLORS.gold, 20);
      return plan;
    }
    function destroy() {
      if (disposed) return;
      disposed = true;
      reset();
      removers.splice(0).forEach((remove) => remove());
      scene.events?.off?.('shutdown', destroy);
    }

    listen(environment.document, 'visibilitychange', () => { if (environment.document.hidden) reset(); });
    listen(environment, 'pagehide', reset);
    listen(motion, 'change', () => { if (motion.matches) reset(); });
    scene.events?.once?.('shutdown', destroy);

    return Object.freeze({
      wave, pulse, invalid, celebrate, haptic, reset, destroy,
      status: () => ({ disposed, active: active.size, maxParticles: MAX_PARTICLES, canAnimate: canAnimate(), canHaptic: canHaptic() }),
    });
  }

  root.InfiniteGameFeel = Object.freeze({
    MAX_PARTICLES, HAPTIC_GAP_MS, COLORS, Kinds,
    intensityFor, hapticFor, kindFor, create,
  });
})(typeof window === 'undefined' ? globalThis : window);
