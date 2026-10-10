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

/** Validate all schedule entries, even upcoming ones. Invalid schedules fail closed. */
export function validateWeeklyEvents(entries) {
  const errors = [];
  const events = [];
  if (entries !== undefined && !Array.isArray(entries)) return { errors: ['weeklyEvents must be an array'], events };
  if ((entries || []).length > 12) errors.push('weeklyEvents: publish at most 12 weeks at a time');
  for (const [index, item] of (entries || []).entries()) {
    const label = `weeklyEvents[${index}]`;
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
      errors.push('weeklyEvents: windows cannot overlap and ids must be unique');
    }
  }
  if (new Set(events.map((e) => e.id)).size !== events.length) errors.push('weeklyEvents: duplicate id');
  return { errors, events: errors.length ? [] : events };
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
  const progress = economy?.weeklyEvents?.[event.id];
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
  // Keep the player record bounded as operators rotate expired weeks out of the
  // published schedule. Never prune an ID that can still be claimed.
  const published = new Set(config.weeklyEvents.map((week) => week.id));
  for (const id of Object.keys(records)) if (!published.has(id)) delete records[id];
  const record = (records[event.id] ??= { wins: 0, claimed: [] });
  record.wins = Math.min(20, (integer(record.wins, 0, 20) ? record.wins : 0) + 1);
  return { eventId: event.id, wins: record.wins };
}

/** Check all rules before mutating. Caller holds the economy lock and saves once. */
export function claimWeeklyMilestone(economy, config, eventId, goal, nowMs = Date.now()) {
  const event = (config.weeklyEvents || []).find((e) => e.id === eventId);
  if (!event) throw new WeeklyEventError('weekly_event_not_found');
  const milestone = event.milestones.find((m) => m.wins === goal);
  if (!milestone) throw new WeeklyEventError('weekly_milestone_not_found');
  const record = economy.weeklyEvents?.[event.id];
  if (record?.claimed?.includes(goal)) return { duplicate: true, coins: milestone.coins, balance: economy.currencies.coins.amount };
  if (weeklyDisabled() || nowMs < event.startMs || nowMs >= event.endMs) throw new WeeklyEventError('weekly_event_closed');
  if (!record || record.wins < goal) throw new WeeklyEventError('weekly_progress_required');
  const wallet = economy.currencies.coins;
  if (wallet.amount + milestone.coins > wallet.maxAmount) throw new WeeklyEventError('weekly_wallet_full');
  wallet.amount += milestone.coins;
  wallet.earned += milestone.coins;
  record.claimed.push(goal);
  return { duplicate: false, coins: milestone.coins, balance: wallet.amount };
}
