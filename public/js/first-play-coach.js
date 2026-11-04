/**
 * First-play confidence: a skippable, interactive coach for the player's first
 * board. Presentation-only. It explains the current goal, reuses the existing
 * free hint, and waits for the player to make the move. It never spends moves,
 * starts a run, grants rewards, or changes difficulty.
 */
(function (root) {
  'use strict';

  const STATUSES = Object.freeze(['new', 'completed', 'skipped']);
  const STEPS = Object.freeze(['goal', 'hint', 'done']);
  const NAMES = {
    score: 'Score', timed: 'Timed score', boss: 'Boss score', collect: 'Collect',
    'clear-shields': 'Shields', 'clear-blockers': 'Blockers', 'clear-locked-gems': 'Locked gems',
    'clear-jelly': 'Jelly', 'clear-chocolate': 'Chocolate', 'clear-liquorice': 'Liquorice',
    'clear-marmalade': 'Marmalade', 'clear-frosting': 'Frosting', 'clear-delivery': 'Delivery',
    'clear-weather-hazards': 'Weather hazards',
  };

  function normalizeStatus(value) {
    return STATUSES.includes(value) ? value : 'new';
  }

  function safeCount(value, fallback = 0) {
    return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback;
  }

  function goalName(goal) {
    if (goal?.type === 'collect' && goal.gemType) return `Collect ${goal.gemType}`;
    return NAMES[goal?.type] || 'Goal';
  }

  function goalLines(input = {}) {
    if (Array.isArray(input.goals) && input.goals.length > 0) {
      return input.goals.slice(0, 4).map((goal) => {
        const target = Math.max(1, safeCount(goal?.target, 1));
        const current = Math.min(target, safeCount(goal?.current));
        const remaining = Math.max(0, target - current);
        return remaining === 0
          ? `${goalName(goal)}: ${current}/${target} — done`
          : `${goalName(goal)}: ${current}/${target} — ${remaining} left`;
      });
    }
    const target = Math.max(1, safeCount(input.targetScore, 1));
    const current = Math.min(target, safeCount(input.score));
    const remaining = Math.max(0, target - current);
    return [`Score: ${current}/${target} — ${remaining} left`];
  }

  function cellName(row, col) {
    return `row ${safeCount(row) + 1}, column ${safeCount(col) + 1}`;
  }

  function hintInstruction(hint) {
    if (!Array.isArray(hint)) return 'Ask for a free hint to highlight a legal move.';
    if (hint.length === 2) {
      return `Activate the highlighted special at ${cellName(hint[0], hint[1])}. Touch: tap it. Keyboard: focus it and press Enter. Text board: select the cell, then Activate special.`;
    }
    if (hint.length === 4) {
      return `Swap the highlighted gems: ${cellName(hint[0], hint[1])} with ${cellName(hint[2], hint[3])}. Touch: tap both or swipe. Keyboard: arrows and Space on each. Text board: click the two named cells.`;
    }
    return 'Ask for a free hint to highlight a legal move.';
  }

  function view(input = {}) {
    const step = STEPS.includes(input.step) ? input.step : 'goal';
    const lines = [];
    if (step === 'goal') {
      lines.push(...goalLines(input));
      lines.push(input.earnedSpecials === false
        ? 'Match 3 or more of the same gem to clear them.'
        : 'Match 3 to clear. 4+ earns a free special gem.');
      lines.push('Hints are free and never spend a move, coins, or energy.');
    } else if (step === 'hint') {
      lines.push(hintInstruction(input.hint));
      lines.push('Make the move yourself. The coach never moves for you.');
    } else {
      lines.push('Nice move. Keep completing the goal above.');
      lines.push('Hints stay free whenever you want them.');
    }
    return {
      step,
      title: step === 'done' ? 'First-play coach · complete' : `First-play coach · step ${step === 'goal' ? 1 : 2} of 2`,
      lines,
      actions: {
        hint: step === 'goal',
        focus: step === 'hint',
        finish: step === 'done',
        skip: step !== 'done',
      },
    };
  }

  function button(document, label, data, onClick) {
    const node = document.createElement('button');
    node.type = 'button';
    node.textContent = label;
    node.dataset[data] = 'true';
    if (typeof onClick === 'function') node.addEventListener('click', () => onClick());
    return node;
  }

  function render(host, payload, callbacks = {}) {
    if (!host || !host.ownerDocument || !payload) return null;
    const document = host.ownerDocument;
    const section = document.createElement('section');
    section.className = 'first-play-coach';
    section.setAttribute('data-first-play-coach', 'true');
    section.setAttribute('aria-label', 'First-play coach');

    const heading = document.createElement('h3');
    heading.textContent = payload.title || 'First-play coach';
    section.append(heading);

    for (const line of payload.lines || []) {
      const paragraph = document.createElement('p');
      paragraph.textContent = line;
      section.append(paragraph);
    }

    const actions = document.createElement('div');
    actions.className = 'first-play-coach-actions';
    const flags = payload.actions || {};
    if (flags.hint) actions.append(button(document, 'Show a free hint', 'coachHint', callbacks.hint));
    if (flags.focus) actions.append(button(document, 'Focus highlighted move', 'coachFocus', callbacks.focus));
    if (flags.finish) actions.append(button(document, 'Finish coach', 'coachFinish', callbacks.finish));
    if (flags.skip) actions.append(button(document, 'Skip coach', 'coachSkip', callbacks.skip));
    if (actions.childNodes.length > 0) section.append(actions);
    host.append(section);
    return section;
  }

  root.InfiniteFirstPlayCoach = Object.freeze({ normalizeStatus, goalLines, hintInstruction, view, render });
})(globalThis);
