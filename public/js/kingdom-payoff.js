/**
 * Post-win kingdom payoff. Read-only presentation over the server's kingdom view.
 * It never prices a renovation, grants a reward, or writes save data. The only
 * mutation is an explicit player click that calls the existing server endpoint.
 */
(function (root) {
  'use strict';

  function rewardLines(result) {
    const lines = [];
    const rewards = Array.isArray(result?.rewards) ? result.rewards : [];
    for (const reward of rewards) {
      if (reward?.type !== 'currency' || !Number.isSafeInteger(reward.amount) || reward.amount <= 0) continue;
      if (reward.currencyId === 'coins') lines.push(`+${reward.amount.toLocaleString()} coins`);
      if (reward.currencyId === 'stars') lines.push(`+${reward.amount.toLocaleString()} stars`);
    }
    return lines;
  }

  function unlockedNames(result, kingdomData) {
    const ids = Array.isArray(result?.justUnlocked) ? result.justUnlocked : [];
    const rooms = Array.isArray(kingdomData?.kingdom?.rooms) ? kingdomData.kingdom.rooms : [];
    return ids.map((id) => rooms.find((room) => room.id === id)?.name || id);
  }

  function goalCopy(goal) {
    if (!goal || goal.kind === 'complete') {
      return { title: 'Kingdom complete', detail: 'Every room is restored. Keep playing for coins, stars, and events.', action: 'Open Kingdom' };
    }
    if (goal.kind === 'unlock') {
      return {
        title: `Next room: ${goal.roomName}`,
        detail: `${goal.missingStars > 0 ? `${goal.missingStars.toLocaleString()} more lifetime stars` : 'Ready'} to unlock this room.`,
        action: 'Open Kingdom',
      };
    }
    const level = goal.targetLevel ? ` to level ${goal.targetLevel}` : '';
    if (goal.canRenovate) {
      return {
        title: `Renovate ${goal.roomName}${level}`,
        detail: `Ready now · ${goal.costCoins.toLocaleString()} coins${goal.milestone ? ' · milestone reward included' : ''}`,
        action: `Renovate · ${goal.costCoins.toLocaleString()} coins`,
      };
    }
    const needs = [];
    if (goal.missingStars > 0) needs.push(`${goal.missingStars.toLocaleString()} more lifetime stars`);
    if (goal.missingCoins > 0) needs.push(`${goal.missingCoins.toLocaleString()} more coins`);
    return {
      title: `Next: ${goal.roomName}${level}`,
      detail: needs.length > 0 ? `Needs ${needs.join(' and ')}.` : 'Open the kingdom to continue.',
      action: 'Open Kingdom',
    };
  }

  function progressRow(document, label, value) {
    const row = document.createElement('label');
    row.className = 'kingdom-payoff-progress';
    const text = document.createElement('span');
    text.textContent = label;
    const bar = document.createElement('progress');
    bar.max = 100;
    bar.value = Math.round(Math.max(0, Math.min(1, Number(value) || 0)) * 100);
    bar.setAttribute('aria-label', label);
    row.append(text, bar);
    return row;
  }

  function render(host, payload, callbacks = {}) {
    if (!host || !host.ownerDocument) return null;
    const document = host.ownerDocument;
    host.replaceChildren();
    const section = document.createElement('section');
    section.className = 'kingdom-payoff';
    section.dataset.kingdomPayoff = 'true';
    section.setAttribute('aria-label', 'Kingdom payoff');

    const heading = document.createElement('h3');
    heading.textContent = 'Your kingdom';
    section.append(heading);

    const kingdomData = payload?.kingdomData || null;
    const result = payload?.result || null;
    const rewards = rewardLines(result);
    if (rewards.length > 0) {
      const line = document.createElement('p');
      line.className = 'kingdom-payoff-reward';
      line.textContent = rewards.join(' · ');
      section.append(line);
    }

    const unlocked = unlockedNames(result, kingdomData);
    if (unlocked.length > 0) {
      const line = document.createElement('p');
      line.className = 'kingdom-payoff-unlocked';
      line.textContent = `New room unlocked: ${unlocked.join(', ')}`;
      section.append(line);
    }

    const goal = kingdomData?.nextGoal || null;
    const copy = goalCopy(goal);
    const title = document.createElement('p');
    title.className = 'kingdom-payoff-title';
    title.textContent = copy.title;
    const detail = document.createElement('p');
    detail.className = 'kingdom-payoff-detail';
    detail.textContent = copy.detail;
    section.append(title, detail);

    if (goal && goal.kind !== 'complete' && goal.kind !== 'unlock') {
      if (goal.costCoins > 0) section.append(progressRow(document, `Coins ${Math.min(payload.coins ?? 0, goal.costCoins).toLocaleString()} / ${goal.costCoins.toLocaleString()}`, goal.coinProgress));
      if (goal.starsRequired > 0) section.append(progressRow(document, `Lifetime stars ${Math.min(payload.lifetimeStars ?? 0, goal.starsRequired).toLocaleString()} / ${goal.starsRequired.toLocaleString()}`, goal.starProgress));
    } else if (goal && goal.kind === 'unlock' && goal.starsRequired > 0) {
      section.append(progressRow(document, `Lifetime stars ${Math.min(payload.lifetimeStars ?? 0, goal.starsRequired).toLocaleString()} / ${goal.starsRequired.toLocaleString()}`, goal.starProgress));
    }

    const actions = document.createElement('div');
    actions.className = 'kingdom-payoff-actions';
    if (goal?.canRenovate && typeof callbacks.renovate === 'function') {
      const renovate = document.createElement('button');
      renovate.type = 'button';
      renovate.className = 'kingdom-payoff-renovate';
      renovate.textContent = copy.action;
      renovate.addEventListener('click', () => callbacks.renovate(goal.roomId));
      actions.append(renovate);
    }
    if (typeof callbacks.openKingdom === 'function') {
      const open = document.createElement('button');
      open.type = 'button';
      open.className = 'kingdom-payoff-open';
      open.textContent = goal?.canRenovate ? 'View Kingdom' : copy.action;
      open.addEventListener('click', () => callbacks.openKingdom());
      actions.append(open);
    }
    if (actions.childNodes.length > 0) section.append(actions);
    host.append(section);
    return section;
  }

  const api = Object.freeze({ rewardLines, unlockedNames, goalCopy, render });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.InfiniteKingdomPayoff = api;
})(typeof window !== 'undefined' ? window : globalThis);
