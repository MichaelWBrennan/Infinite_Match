/**
 * This week: one readable hub for the existing server-owned weekly event, an
 * optional local weekly play rhythm, and PWA install/offline status.
 *
 * The rhythm is not a login streak. It counts UTC days on which the player
 * finished a run, only after explicit opt-in. It grants nothing, never repairs
 * for money, and never removes rewards. Weekly event coins remain server-priced
 * and server-claimed through /api/live-ops/weekly/claim.
 */
(function (root) {
  'use strict';

  const DAY_MS = 86400000;
  const WEEK_MS = 7 * DAY_MS;
  const RHYTHM_GOAL = 3;
  const MAX_DAYS = 84; // 12 UTC weeks of local history.
  const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

  function dayKey(nowMs) {
    return new Date(nowMs).toISOString().slice(0, 10);
  }

  function weekStart(nowMs) {
    const date = new Date(nowMs);
    const monday = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
    return monday;
  }

  function normalizeDays(days) {
    if (!Array.isArray(days)) return [];
    const valid = days.filter((day) => typeof day === 'string' && DATE_KEY.test(day)
      && Number.isFinite(Date.parse(`${day}T00:00:00Z`))
      && new Date(`${day}T00:00:00Z`).toISOString().slice(0, 10) === day);
    return [...new Set(valid)].sort().slice(-MAX_DAYS);
  }

  function recordDay(days, nowMs = Date.now()) {
    return normalizeDays([...normalizeDays(days), dayKey(nowMs)]);
  }

  function daysInWeek(days, startMs) {
    const start = dayKey(startMs);
    const end = dayKey(startMs + WEEK_MS);
    return normalizeDays(days).filter((day) => day >= start && day < end).length;
  }

  /** Consecutive completed weeks with >= goal play days, plus the current week once met. */
  function rhythmView(days, nowMs = Date.now(), goal = RHYTHM_GOAL) {
    const normalized = normalizeDays(days);
    const currentStart = weekStart(nowMs);
    const currentDays = daysInWeek(normalized, currentStart);
    const target = Number.isInteger(goal) && goal >= 1 && goal <= 7 ? goal : RHYTHM_GOAL;
    let streakWeeks = currentDays >= target ? 1 : 0;
    for (let week = 1; week <= 12; week++) {
      if (daysInWeek(normalized, currentStart - week * WEEK_MS) >= target) streakWeeks++;
      else break;
    }
    return {
      goal: target,
      daysThisWeek: currentDays,
      remaining: Math.max(0, target - currentDays),
      met: currentDays >= target,
      streakWeeks,
      weekStartsAt: new Date(currentStart).toISOString(),
      weekEndsAt: new Date(currentStart + WEEK_MS).toISOString(),
      recordedDays: normalized.length,
    };
  }

  function rhythmLines(view, enabled) {
    if (!enabled) {
      return [
        'Optional weekly rhythm is off.',
        `If you enable it, finish a run on any ${view.goal} UTC days this week to mark the week. No daily login, no paid repairs, no rewards tied to it.`,
      ];
    }
    const lines = [
      `${view.daysThisWeek} of ${view.goal} play days this UTC week.`,
      view.met ? 'This week is marked. Extra play is welcome but never required.'
        : `${view.remaining} more play day${view.remaining === 1 ? '' : 's'} would mark this week. Any days count; you do not need consecutive days.`,
      view.streakWeeks > 0 ? `${view.streakWeeks} marked week${view.streakWeeks === 1 ? '' : 's'} in a row.` : 'No marked week streak yet.',
      'A missed week only resets this local counter. It never removes coins, stars, progress, or weekly event rewards.',
    ];
    return lines;
  }

  function weeklySummary(data, signedIn, nowMs = Date.now()) {
    if (!data || data.disabled) return { state: 'paused', lines: ['The weekly event is paused. Puzzles remain playable.'] };
    const event = data.event;
    if (!event) return { state: 'empty', lines: ['No weekly event is scheduled. Guest play and the kingdom remain available.'] };
    const starts = Date.parse(event.startsAt);
    const ends = Date.parse(event.endsAt);
    const upcoming = event.status === 'upcoming' || nowMs < starts;
    const lines = [event.description || ''];
    lines.push(upcoming
      ? `Starts ${new Date(starts).toLocaleString()} your time.`
      : `Ends ${new Date(ends).toLocaleString()} your time. Claims close at the UTC boundary.`);
    lines.push('Only server replay-verified classic or daily wins count. Assisted wins can count here but remain unranked.');
    if (!signedIn) lines.push('Sign in to save weekly progress and claim free milestones. Guest puzzles remain playable.');
    const milestones = Array.isArray(event.milestones) ? event.milestones : [];
    const claimable = milestones.filter((m) => m.canClaim);
    const next = milestones.find((m) => !m.claimed && m.wins > (event.wins || 0)) || milestones.find((m) => !m.claimed);
    if (signedIn && !upcoming) {
      lines.push(`${event.wins || 0} verified win${event.wins === 1 ? '' : 's'} this week.`);
      if (claimable.length) lines.push(`${claimable.length} free milestone${claimable.length === 1 ? '' : 's'} ready to claim.`);
      if (next && next.wins > (event.wins || 0)) lines.push(`Next free milestone: ${next.wins} wins for ${next.coins} coins (${next.wins - (event.wins || 0)} more).`);
      if (!claimable.length && !next) lines.push('Every weekly milestone is claimed. Thank you for playing.');
    }
    return { state: upcoming ? 'upcoming' : 'active', event, lines: lines.filter(Boolean), next, signedIn };
  }

  function pwaLines(status = {}) {
    const lines = [];
    lines.push(status.installed ? 'Installed app mode is active.' : 'You can keep playing in this browser tab.');
    lines.push(status.offlineReady
      ? 'Offline shell is ready. Guest puzzles work without a connection; account rewards still need the server.'
      : 'Offline shell is still preparing. Guest play may need a connection until it is ready.');
    if (!status.online) lines.push('You are offline now. Weekly progress and claims will wait until the server is reachable.');
    if (status.updateReady) lines.push('An update is ready. It will not reload while you are playing; restart from here when you choose.');
    return lines;
  }

  function render(host, payload = {}, callbacks = {}) {
    if (!host || !host.ownerDocument) return null;
    const document = host.ownerDocument;
    const section = document.createElement('section');
    section.className = 'weekly-hub';
    section.setAttribute('data-weekly-hub', 'true');

    const weekly = document.createElement('section');
    weekly.className = 'weekly-hub-event';
    weekly.setAttribute('data-weekly-event', 'true');
    const title = document.createElement('h3');
    title.textContent = payload.weekly?.event?.name || 'This week’s free event';
    weekly.append(title);
    const summary = payload.weekly || { state: 'loading', lines: ['Checking the weekly event…'] };
    for (const line of summary.lines || []) {
      const p = document.createElement('p'); p.textContent = line; weekly.append(p);
    }
    const signedIn = payload.signedIn ?? summary.signedIn;
    if (summary.event && signedIn && summary.state === 'active') {
      const max = Math.max(1, ...(summary.event.milestones || []).map((m) => m.wins));
      const meter = document.createElement('progress');
      meter.max = max; meter.value = Math.min(summary.event.wins || 0, max);
      meter.setAttribute('aria-label', `${summary.event.wins || 0} verified wins toward ${max}`);
      weekly.append(meter);
      for (const milestone of summary.event.milestones || []) {
        const row = document.createElement('p');
        row.textContent = `${milestone.wins} wins · ${milestone.coins} coins${milestone.claimed ? ' · claimed' : ''}`;
        if (milestone.canClaim && callbacks.claim) {
          const button = document.createElement('button');
          button.type = 'button'; button.textContent = 'Claim free coins';
          button.addEventListener('click', () => callbacks.claim(summary.event.id, milestone.wins));
          row.append(' ', button);
        }
        weekly.append(row);
      }
    }
    if (!signedIn && callbacks.signIn) {
      const sign = document.createElement('button'); sign.type = 'button'; sign.textContent = 'Sign in for weekly progress';
      sign.addEventListener('click', () => callbacks.signIn()); weekly.append(sign);
    }
    if (callbacks.openEvents) {
      const more = document.createElement('button'); more.type = 'button'; more.textContent = 'Open full events and score challenge';
      more.addEventListener('click', () => callbacks.openEvents()); weekly.append(more);
    }
    section.append(weekly);

    const rhythm = document.createElement('section');
    rhythm.className = 'weekly-hub-rhythm';
    rhythm.setAttribute('data-weekly-rhythm', 'true');
    const rhythmTitle = document.createElement('h3'); rhythmTitle.textContent = 'Your weekly rhythm (optional)'; rhythm.append(rhythmTitle);
    const view = payload.rhythm || rhythmView([], Date.now());
    for (const line of rhythmLines(view, payload.rhythmEnabled === true)) {
      const p = document.createElement('p'); p.textContent = line; rhythm.append(p);
    }
    if (payload.rhythmEnabled) {
      const meter = document.createElement('progress');
      meter.max = view.goal; meter.value = Math.min(view.daysThisWeek, view.goal);
      meter.setAttribute('aria-label', `${view.daysThisWeek} of ${view.goal} local play days this week`);
      rhythm.append(meter);
    }
    if (callbacks.setRhythmEnabled) {
      const toggle = document.createElement('button'); toggle.type = 'button';
      toggle.textContent = payload.rhythmEnabled ? 'Turn off local rhythm' : 'Enable local rhythm';
      toggle.addEventListener('click', () => callbacks.setRhythmEnabled(!payload.rhythmEnabled));
      rhythm.append(toggle);
    }
    if (payload.rhythmEnabled && callbacks.clearRhythm) {
      const clear = document.createElement('button'); clear.type = 'button'; clear.textContent = 'Clear local rhythm history';
      clear.addEventListener('click', () => callbacks.clearRhythm()); rhythm.append(clear);
    }
    section.append(rhythm);

    const pwa = document.createElement('section');
    pwa.className = 'weekly-hub-pwa';
    pwa.setAttribute('data-pwa-status', 'true');
    const pwaTitle = document.createElement('h3'); pwaTitle.textContent = 'Install and offline play'; pwa.append(pwaTitle);
    for (const line of pwaLines(payload.pwa || {})) {
      const p = document.createElement('p'); p.textContent = line; pwa.append(p);
    }
    if (payload.pwa?.installAvailable && callbacks.install) {
      const install = document.createElement('button'); install.type = 'button'; install.textContent = 'Install Infinite Match';
      install.addEventListener('click', () => callbacks.install()); pwa.append(install);
    } else if (!payload.pwa?.installed) {
      const help = document.createElement('p');
      help.textContent = 'If no install button appears, use your browser menu: Install app, or Share → Add to Home Screen on iPhone/iPad.';
      pwa.append(help);
    }
    if (payload.pwa?.updateReady && callbacks.applyUpdate) {
      const update = document.createElement('button'); update.type = 'button'; update.textContent = 'Restart to apply update';
      update.addEventListener('click', () => callbacks.applyUpdate()); pwa.append(update);
    }
    section.append(pwa);
    host.replaceChildren(section);
    return section;
  }

  const api = Object.freeze({
    DAY_MS, WEEK_MS, RHYTHM_GOAL, MAX_DAYS, dayKey, weekStart, normalizeDays, recordDay,
    daysInWeek, rhythmView, rhythmLines, weeklySummary, pwaLines, render,
  });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.InfiniteWeeklyHub = api;
})(typeof window !== 'undefined' ? window : globalThis);
