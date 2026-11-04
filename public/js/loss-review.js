/**
 * Fair loss review: exact remaining goals, a free goal-aware tip, and transparent
 * retry cost. Presentation-only. It never grants moves, discounts a continue,
 * changes difficulty, or starts a run by itself.
 */
(function (root) {
  'use strict';

  const NAMES = {
    score: 'Score', timed: 'Timed score', boss: 'Boss score', collect: 'Collect',
    'clear-shields': 'Shields', 'clear-blockers': 'Blockers', 'clear-locked-gems': 'Locked gems',
    'clear-jelly': 'Jelly', 'clear-chocolate': 'Chocolate', 'clear-liquorice': 'Liquorice',
    'clear-marmalade': 'Marmalade', 'clear-frosting': 'Frosting', 'clear-delivery': 'Delivery',
    'clear-weather-hazards': 'Weather hazards',
  };

  function goalName(goal) {
    if (goal?.type === 'collect' && goal.gemType) return `Collect ${goal.gemType}`;
    return NAMES[goal?.type] || 'Goal';
  }

  function normalizeGoals(goals, score, targetScore) {
    const safeScore = Number.isFinite(score) ? Math.max(0, Math.floor(score)) : 0;
    const safeTarget = Number.isFinite(targetScore) ? Math.max(1, Math.floor(targetScore)) : 1;
    const source = Array.isArray(goals) && goals.length > 0 ? goals : [{ type: 'score', target: safeTarget, current: safeScore }];
    return source.slice(0, 4).map((goal) => {
      const target = Number.isFinite(goal?.target) ? Math.max(1, Math.floor(goal.target)) : safeTarget;
      const current = Number.isFinite(goal?.current) ? Math.max(0, Math.floor(goal.current)) : 0;
      const remaining = Math.max(0, target - current);
      return { type: goal?.type || 'score', gemType: goal?.gemType || null, label: goalName(goal), target, current: Math.min(current, target), remaining, complete: remaining === 0 };
    });
  }

  function tipFor(goals, mode) {
    const unfinished = goals.filter((goal) => !goal.complete);
    // Prefer a concrete board goal over the generic score goal on mixed levels.
    const first = unfinished.find((goal) => !['score', 'timed', 'boss'].includes(goal.type)) || unfinished[0];
    if (!first) return 'Every goal was complete. Extra stars come from score, not from buying help.';
    if (mode === 'timed') return 'Timed goal: keep matches small and fast near the target color; free hints can point to a useful swap without spending time or moves.';
    if (first.type === 'collect') return `Collection goal: clearing ${first.gemType} by match, cascade, or earned special counts. Free hints prefer unfinished goals.`;
    if (first.type === 'clear-shields') return 'Shield goal: hit the numbered shield cell directly. Gravity and free repairs do not remove shield layers.';
    if (first.type === 'clear-blockers') return 'Blocker goal: match beside blockers to clear them. Earned specials can hit several blocker cells in one move.';
    if (first.type === 'clear-locked-gems') return 'Locked-gem goal: clear the locked gem itself to free it. Free hints can point to a legal swap around locks.';
    if (first.type === 'clear-delivery') return 'Delivery goal: clear gems on marked delivery cells. Plan vertical clears when the marked cell is below the board.';
    if (first.type?.startsWith('clear-')) return `${first.label} goal: match on or beside the obstacle. Earned specials and cascades can clear multiple layers in one move.`;
    return 'Score goal: 4+ matches earn free specials. Combining specials usually scores more than spending moves on small matches.';
  }

  function review(input = {}) {
    const mode = input.mode || 'classic';
    const signedIn = input.signedIn === true;
    const goals = normalizeGoals(input.goals, input.score, input.targetScore);
    const movesLimit = Number.isFinite(input.movesLimit) ? Math.max(0, Math.floor(input.movesLimit)) : null;
    const moves = Number.isFinite(input.moves) ? Math.max(0, Math.floor(input.moves)) : null;
    const movesUsed = movesLimit !== null && moves !== null ? Math.max(0, movesLimit - moves) : null;
    const timeLimit = Number.isFinite(input.timeLimit) ? Math.max(0, Math.floor(input.timeLimit)) : 0;
    const time = Number.isFinite(input.time) ? Math.max(0, Math.floor(input.time)) : 0;
    const timeUsed = timeLimit > 0 ? Math.max(0, timeLimit - time) : null;
    const hintsUsed = Number.isFinite(input.hintsUsed) ? Math.max(0, Math.min(99, Math.floor(input.hintsUsed))) : 0;
    const lines = [];
    if (mode === 'timed' && timeUsed !== null) lines.push(`Time used: ${timeUsed}s of ${timeLimit}s.`);
    else if (movesUsed !== null && movesLimit !== null) lines.push(`Moves used: ${movesUsed} of ${movesLimit}.`);
    lines.push(`Free hints used: ${hintsUsed}. Hints never cost moves, coins, or energy.`);
    const retryLine = signedIn
      ? 'Retry starts a new attempt and uses 1 energy. No discounted continue is offered.'
      : 'Guest retry is free and starts a fresh board. No account or purchase is required.';
    return {
      mode,
      goals,
      unfinished: goals.filter((goal) => !goal.complete),
      movesUsed,
      timeUsed,
      hintsUsed,
      lines,
      tip: tipFor(goals, mode),
      retryLine,
    };
  }

  function render(host, payload, callbacks = {}) {
    if (!host || !host.ownerDocument) return null;
    const document = host.ownerDocument;
    const section = document.createElement('section');
    section.className = 'loss-review';
    section.setAttribute('data-loss-review', 'true');
    section.setAttribute('aria-label', 'Loss review');

    const heading = document.createElement('h3');
    heading.textContent = 'What was left';
    section.append(heading);

    const list = document.createElement('ul');
    list.className = 'loss-review-goals';
    for (const goal of payload.goals || []) {
      const item = document.createElement('li');
      item.textContent = goal.complete
        ? `${goal.label}: ${goal.current}/${goal.target} — done`
        : `${goal.label}: ${goal.current}/${goal.target} — ${goal.remaining} left`;
      list.append(item);
    }
    section.append(list);

    const tip = document.createElement('p');
    tip.className = 'loss-review-tip';
    tip.textContent = payload.tip || '';
    section.append(tip);

    for (const line of payload.lines || []) {
      const p = document.createElement('p');
      p.textContent = line;
      section.append(p);
    }
    const retry = document.createElement('p');
    retry.className = 'loss-review-retry-cost';
    retry.textContent = payload.retryLine || '';
    section.append(retry);

    const actions = document.createElement('div');
    actions.className = 'loss-review-actions';
    if (typeof callbacks.retry === 'function') {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.lossRetry = 'true';
      button.textContent = 'Retry';
      button.addEventListener('click', () => callbacks.retry());
      actions.append(button);
    }
    if (typeof callbacks.guide === 'function') {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.lossGuide = 'true';
      button.textContent = 'Goal guide';
      button.addEventListener('click', () => callbacks.guide());
      actions.append(button);
    }
    if (actions.childNodes.length > 0) section.append(actions);
    host.append(section);
    return section;
  }

  const api = Object.freeze({ goalName, normalizeGoals, tipFor, review, render });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.InfiniteLossReview = api;
})(typeof window !== 'undefined' ? window : globalThis);
