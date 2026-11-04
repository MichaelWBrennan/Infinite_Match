/**
 * Reward receipt and sync status. Read-only presentation over the server's
 * settled attempt result and the local offline win queue. It never grants a
 * reward, changes a balance, or ranks a result by itself.
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

  function view(input = {}) {
    const signedIn = input.signedIn === true;
    const mode = input.mode || 'classic';
    const pendingCount = Number.isSafeInteger(input.pendingCount) ? Math.max(0, input.pendingCount) : 0;
    const result = input.result || null;
    if (!signedIn) {
      return {
        state: 'guest',
        title: 'Guest play',
        lines: ['Guest wins are free and local. Sign in to earn account rewards and keep them across devices.'],
        rewards: [],
        pendingCount: 0,
      };
    }
    if (!result) {
      if (pendingCount > 0) {
        return {
          state: 'pending',
          title: 'Reward saved on this device',
          lines: [
            `${pendingCount} win${pendingCount === 1 ? '' : 's'} waiting to sync.`,
            'The server has not confirmed this reward yet. It will be sent again with the same attempt id; a settled attempt pays only once.',
          ],
          rewards: [],
          pendingCount,
        };
      }
      return {
        state: 'unconfirmed',
        title: 'Reward not confirmed',
        lines: ['The server did not confirm a reward for this run. No local reward was granted. You can try syncing saved wins.'],
        rewards: [],
        pendingCount: 0,
      };
    }
    const lines = [];
    if (result.duplicate === true) lines.push('Already settled. This retry shows the original receipt and grants no second reward.');
    if (mode === 'endless') {
      lines.push(result.verified === true ? 'Endless bank confirmed by the server. Endless results do not enter ranked boards.' : 'Endless bank accepted by the server. It is not replay-ranked.');
    } else if (result.verified === true && result.ranked === true) {
      lines.push('Replay verified. This win can enter ranked boards.');
    } else if (result.verified === true) {
      lines.push('Replay verified, but booster-assisted. Rewards count; ranked boards do not.');
    } else {
      lines.push('Server accepted the result, but replay was not verified. Rewards count; ranked boards do not.');
    }
    const rewards = rewardLines(result);
    if (rewards.length > 0) lines.push(`Server reward: ${rewards.join(' · ')}`);
    if (Number.isSafeInteger(result.balances?.stars)) lines.push(`Star balance: ${result.balances.stars.toLocaleString()}`);
    if (pendingCount > 0) lines.push(`${pendingCount} older win${pendingCount === 1 ? '' : 's'} still waiting to sync.`);
    return {
      state: result.duplicate === true ? 'duplicate' : 'settled',
      title: result.duplicate === true ? 'Original receipt' : 'Server receipt',
      lines,
      rewards,
      pendingCount,
      verified: result.verified === true,
      ranked: result.ranked === true,
    };
  }

  function syncLines(outcomes) {
    const list = Array.isArray(outcomes) ? outcomes : [];
    if (list.length === 0) return 'No saved wins needed syncing.';
    const settled = list.filter((item) => item.outcome === 'settled').length;
    const refused = list.filter((item) => item.outcome === 'refused').length;
    const kept = list.filter((item) => item.outcome === 'kept').length;
    const parts = [];
    if (settled > 0) parts.push(`${settled} confirmed`);
    if (refused > 0) parts.push(`${refused} refused by the server`);
    if (kept > 0) parts.push(`${kept} still waiting`);
    return parts.length > 0 ? `Sync: ${parts.join(', ')}.` : 'Sync finished.';
  }

  function render(host, payload, callbacks = {}) {
    if (!host || !host.ownerDocument) return null;
    const document = host.ownerDocument;
    const section = document.createElement('section');
    section.className = 'reward-receipt';
    section.setAttribute('data-reward-receipt', 'true');
    section.setAttribute('aria-label', 'Reward receipt');

    const heading = document.createElement('h3');
    heading.textContent = payload.title || 'Reward receipt';
    section.append(heading);

    for (const line of payload.lines || []) {
      const p = document.createElement('p');
      p.textContent = line;
      section.append(p);
    }

    const actions = document.createElement('div');
    actions.className = 'reward-receipt-actions';
    if (typeof callbacks.sync === 'function') {
      const sync = document.createElement('button');
      sync.type = 'button';
      sync.dataset.rewardSync = 'true';
      sync.textContent = payload.pendingCount > 0 ? `Sync ${payload.pendingCount} saved win${payload.pendingCount === 1 ? '' : 's'}` : 'Check saved wins';
      sync.addEventListener('click', () => callbacks.sync());
      actions.append(sync);
    }
    if (typeof callbacks.guide === 'function') {
      const guide = document.createElement('button');
      guide.type = 'button';
      guide.dataset.rewardGuide = 'true';
      guide.textContent = 'How verification works';
      guide.addEventListener('click', () => callbacks.guide());
      actions.append(guide);
    }
    if (actions.childNodes.length > 0) section.append(actions);
    host.append(section);
    return section;
  }

  const api = Object.freeze({ rewardLines, view, syncLines, render });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.InfiniteRewardReceipt = api;
})(typeof window !== 'undefined' ? window : globalThis);
