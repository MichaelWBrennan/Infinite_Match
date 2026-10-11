#!/usr/bin/env node
// Read-only weekly calendar validator and operator preview. Does not award currency.
import fs from 'node:fs';
import path from 'node:path';
import { validateWeeklyCalendar, validateWeeklyRotation, visibleWeeklyEvent, weeklyView } from '../src/services/live-ops/weekly-event.js';

const file = path.resolve(process.env.LIVE_OPS_CONFIG || 'config/liveops.json');
const at = process.argv[2] ? Date.parse(process.argv[2]) : Date.now();
const horizonRaw = process.env.WEEKLY_EVENT_MIN_FUTURE_DAYS || '0';
const horizonDays = /^\d{1,2}$/.test(horizonRaw) ? Number(horizonRaw) : NaN;
if (!Number.isFinite(at) || !Number.isInteger(horizonDays) || horizonDays < 0 || horizonDays > 84) {
  console.error('Usage: WEEKLY_EVENT_MIN_FUTURE_DAYS=0..84 node scripts/preview-weekly-event.mjs [ISO instant]');
  process.exit(1);
}
try {
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  const { errors, events, archive } = validateWeeklyCalendar(raw.weeklyEvents, raw.weeklyEventArchive, Date.now());
  if (errors.length) throw new Error(errors.join('\n'));
  if (process.env.WEEKLY_EVENT_PREVIOUS_CONFIG) {
    const previousFile = path.resolve(process.env.WEEKLY_EVENT_PREVIOUS_CONFIG);
    const previousRaw = JSON.parse(fs.readFileSync(previousFile, 'utf8'));
    const previous = validateWeeklyCalendar(previousRaw.weeklyEvents, previousRaw.weeklyEventArchive, Date.now());
    if (previous.errors.length) throw new Error(`Previous calendar is invalid: ${previous.errors.join('\n')}`);
    const rotationErrors = validateWeeklyRotation(
      { weeklyEvents: previous.events, weeklyEventArchive: previous.archive },
      { weeklyEvents: events, weeklyEventArchive: archive },
    );
    if (rotationErrors.length) throw new Error(rotationErrors.join('\n'));
    console.log(`Rotation check passed against ${previousFile}`);
  }
  console.log(`Weekly calendar: ${events.length} scheduled windows, ${archive.length} archived weeks in ${file}`);
  for (const e of events) console.log(`${e.id} | ${new Date(e.startMs).toISOString()} — ${new Date(e.endMs).toISOString()} | ${e.milestones.map((m) => `${m.wins} wins: ${m.coins} coins`).join(', ')}`);
  const event = weeklyView(visibleWeeklyEvent({ weeklyEvents: events }, at), null, at);
  console.log(JSON.stringify({ at: new Date(at).toISOString(), disabled: process.env.WEEKLY_EVENT_DISABLED === '1', visible: event }, null, 2));
  if (!event) {
    console.error('No active or upcoming weekly event at this instant. Publish future dates before the schedule runs out.');
    process.exitCode = 1;
  }
  const lastEnd = events.at(-1)?.endMs;
  if (horizonDays && (!lastEnd || lastEnd - at < horizonDays * 86400000)) {
    console.error(`Weekly calendar has less than ${horizonDays} full days remaining from the preview instant. Validate and deploy more weeks before it runs out.`);
    process.exitCode = 1;
  }
} catch (error) {
  console.error(`Invalid weekly calendar: ${error.message}`);
  process.exitCode = 1;
}
