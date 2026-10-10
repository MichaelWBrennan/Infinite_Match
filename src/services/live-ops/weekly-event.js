// One modest, free weekly win event. The server owns the schedule, progress and grants.
// Only deterministic replay-verified classic/daily completions count (assisted wins can
// count, but are still unranked on competitive boards).
export class WeeklyEventError extends Error {
  constructor(code) { super(code); this.code = code; }
}

const ID = /^[a-z0-9][a-z0-9_-]{2,39}$/;
const ISO_UTC = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/;
const DAY_MS = 86400000;
const WEEK_MS = 7 * DAY_MS;
const integer = (n, min, max) => Number.isSafeInteger(n) && n >= min && n <= max;

/** Validate scheduled or archived weeks. Archived definitions are for read-only claim retries only. */
export function validateWeeklyEvents(entries, { archive = false, nowMs = Date.now() } = {}) {
  const errors = [];
  const events = [];
  const field = archive ? 'weeklyEventArchive' : 'weeklyEvents';
  const limit = archive ? 52 : 12;
  if (entries !== undefined && !Array.isArray(entries)) return { errors: [`${field} must be an array`], events };
  if ((entries || []).length > limit) errors.push(`${field}: publish at most ${limit} weeks at a time`);
  for (const [index, item] of (entries || []).entries()) {
    const label = `${field}[${index}]`;
    const startMs = typeof item?.start === 'string' && ISO_UTC.test(item.start) ? Date.parse(item.start) : NaN;
    const endMs = typeof item?.end === 'string' && ISO_UTC.test(item.end) ? Date.parse(item.end) : NaN;
    if (!ID.test(item?.id || '')) errors.push(`${label}: invalid id`);
    if (typeof item?.name !== 'string' || !item.name.trim() || item.name.length > 80) errors.push(`${label}: name required (max 80)`);
    if (typeof item?.description !== 'string' || !item.description.trim() || item.description.length > 240) errors.push(`${label}: description required (max 240)`);
    const exact = (value, ms) => Number.isFinite(ms) && new Date(ms).toISOString() === value.replace(/(?<!\.\d{3})Z$/, '.000Z');
    if (!exact(item.start, startMs) || !exact(item.end, endMs) || endMs - startMs !== WEEK_MS
      || new Date(startMs).getUTCDay() !== 1 || startMs % DAY_MS !== 0) {
      errors.push(`${label}: use a Monday 00:00 UTC start and a seven-day half-open UTC window`);
    }
    if (archive && Number.isFinite(endMs) && endMs > nowMs) {
      errors.push(`${label}: cannot archive a week before its UTC end`);
    }
    const milestones = [];
    if (!Array.isArray(item?.milestones) || item.milestones.length < 1 || item.milestones.length > 3) {
      errors.push(`${label}: provide 1-3 milestones`);
    } else {
      let previous = 0;
      for (const m of item.milestones) {
        if (!integer(m?.wins, previous + 1, 20) || !integer(m?.coins, 1, 100)) {
          errors.push(`${label}: milestones need increasing wins (1-20) and 1-100 coins`);
          break;
        }
        milestones.push({ wins: m.wins, coins: m.coins });
        previous = m.wins;
      }
    }
    if (errors.length === 0) events.push({ id: item.id, name: item.name.trim(), description: item.description.trim(), startMs, endMs, milestones });
  }
  events.sort((a, b) => a.startMs - b.startMs);
  for (let i = 1; i < events.length; i++) {
    if (events[i].startMs < events[i - 1].endMs || events[i].id === events[i - 1].id) {
      errors.push(`${field}: windows cannot overlap and ids must be unique`);
    }
  }
  if (new Set(events.map((e) => e.id)).size !== events.length) errors.push(`${field}: duplicate id`);
  return { errors, events: errors.length ? [] : events };
}

/** Reject reused IDs and out-of-order archives, including when one list is empty. */
export function validateWeeklyCalendar(schedule, archive, nowMs = Date.now()) {
  const current = validateWeeklyEvents(schedule);
  const retired = validateWeeklyEvents(archive, { archive: true, nowMs });
  const errors = [...current.errors, ...retired.errors];
  if (!errors.length && current.events.length && retired.events.length) {
    if (retired.events.at(-1).endMs > current.events[0].startMs) {
      errors.push('weeklyEventArchive: archived weeks must end before the published schedule starts');
    }
  }
  if (!errors.length) {
    const ids = [...current.events, ...retired.events].map((event) => event.id);
    if (new Set(ids).size !== ids.length) errors.push('weeklyEventArchive: ids cannot be reused');
  }
  return { errors, events: errors.length ? [] : current.events, archive: errors.length ? [] : retired.events };
}

// Operator-side comparison only. The server cannot recover a prior published
// snapshot after restart, so run this on the deployed snapshot and candidate.
export function validateWeeklyRotation(previous, candidate, nowMs = Date.now()) {
  const errors = [];
  const prevSchedule = previous.weeklyEvents || [];
  const prevArchive = previous.weeklyEventArchive || [];
  const nextSchedule = new Map((candidate.weeklyEvents || []).map((event) => [event.id, event]));
  const nextArchive = new Map((candidate.weeklyEventArchive || []).map((event) => [event.id, event]));
  const previousIds = new Set([...prevSchedule, ...prevArchive].map((event) => event.id));
  for (const event of prevSchedule) {
    const scheduled = nextSchedule.get(event.id);
    const retired = nextArchive.get(event.id);
    if (!scheduled && !retired) errors.push(`${event.id}: previously scheduled week must move into the archive, not disappear`);
    if (retired && nowMs < event.endMs) errors.push(`${event.id}: cannot retire a week before its UTC end`);
    if ((scheduled || retired) && JSON.stringify(scheduled || retired) !== JSON.stringify(event)) {
      errors.push(`${event.id}: published week definition changed`);
    }
  }
  for (const event of prevArchive) {
    const retired = nextArchive.get(event.id);
    if (nextSchedule.has(event.id)) errors.push(`${event.id}: cannot move an archived week back into the schedule`);
    if (!retired && nowMs - event.endMs < 35 * DAY_MS) {
      errors.push(`${event.id}: keep archived claim retries for at least 35 days after the UTC end`);
    }
    if (retired && JSON.stringify(retired) !== JSON.stringify(event)) errors.push(`${event.id}: archived week definition changed`);
  }
  for (const id of nextArchive.keys()) {
    if (!previousIds.has(id)) errors.push(`${id}: cannot invent archived history; first publish it in the schedule`);
  }
  return errors;
}

export function weeklyDisabled() { return process.env.WEEKLY_EVENT_DISABLED === '1'; }

export function activeWeeklyEvent(config, nowMs = Date.now()) {
  if (weeklyDisabled()) return null;
  return (config.weeklyEvents || []).find((e) => nowMs >= e.startMs && nowMs < e.endMs) || null;
}

export function visibleWeeklyEvent(config, nowMs = Date.now()) {
  if (weeklyDisabled()) return null;
  return activeWeeklyEvent(config, nowMs)
    || (config.weeklyEvents || []).find((e) => e.startMs > nowMs) || null;
}

export function weeklyView(event, economy = null, nowMs = Date.now()) {
  if (!event) return null;
  const progress = Object.hasOwn(economy?.weeklyEvents || {}, event.id) ? economy.weeklyEvents[event.id] : null;
  const wins = integer(progress?.wins, 0, 20) ? progress.wins : 0;
  const claimed = Array.isArray(progress?.claimed) ? progress.claimed : [];
  return { id: event.id, name: event.name, description: event.description,
    startsAt: new Date(event.startMs).toISOString(), endsAt: new Date(event.endMs).toISOString(),
    status: nowMs < event.startMs ? 'upcoming' : 'active', wins,
    milestones: event.milestones.map(({ wins: goal, coins }) => ({ wins: goal, coins,
      claimed: claimed.includes(goal), canClaim: !!economy && nowMs >= event.startMs && wins >= goal && !claimed.includes(goal) })) };
}

/** Called inside consumeAttempt's lock and save, exactly once per verified paid attempt. */
export function recordWeeklyWin(economy, config, nowMs = Date.now()) {
  const event = activeWeeklyEvent(config, nowMs);
  if (!event) return null;
  const records = (economy.weeklyEvents ??= {});
  // Keep records for published or archived IDs, so a lost claim response can still
  // be acknowledged after rotation. Prune only after the operator removes the archive.
  const retained = new Set([...(config.weeklyEvents || []), ...(config.weeklyEventArchive || [])].map((week) => week.id));
  for (const id of Object.keys(records)) if (!retained.has(id)) delete records[id];
  if (!Object.hasOwn(records, event.id)) records[event.id] = { wins: 0, claimed: [] };
  const record = records[event.id];
  record.wins = Math.min(20, (integer(record.wins, 0, 20) ? record.wins : 0) + 1);
  return { eventId: event.id, wins: record.wins };
}

/** Check all rules before mutating. Caller holds the economy lock and saves once. */
export function claimWeeklyMilestone(economy, config, eventId, goal, nowMs = Date.now()) {
  const active = (config.weeklyEvents || []).find((e) => e.id === eventId);
  const event = active || (config.weeklyEventArchive || []).find((e) => e.id === eventId);
  if (!event) throw new WeeklyEventError('weekly_event_not_found');
  const milestone = event.milestones.find((m) => m.wins === goal);
  if (!milestone) throw new WeeklyEventError('weekly_milestone_not_found');
  const record = Object.hasOwn(economy.weeklyEvents || {}, event.id) ? economy.weeklyEvents[event.id] : null;
  if (record?.claimed?.includes(goal)) return { duplicate: true, coins: milestone.coins, balance: economy.currencies.coins.amount };
  if (!active || weeklyDisabled() || nowMs < event.startMs || nowMs >= event.endMs) throw new WeeklyEventError('weekly_event_closed');
  if (!record || record.wins < goal) throw new WeeklyEventError('weekly_progress_required');
  const wallet = economy.currencies.coins;
  if (wallet.amount + milestone.coins > wallet.maxAmount) throw new WeeklyEventError('weekly_wallet_full');
  wallet.amount += milestone.coins;
  wallet.earned += milestone.coins;
  record.claimed.push(goal);
  return { duplicate: false, coins: milestone.coins, balance: wallet.amount };
}
