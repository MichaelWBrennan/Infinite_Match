#!/usr/bin/env node
// Read-only weekly calendar validator and operator preview. Does not award currency.
import fs from 'node:fs';
import path from 'node:path';
import { validateWeeklyEvents, visibleWeeklyEvent, weeklyView } from '../src/services/live-ops/weekly-event.js';

const file = path.resolve(process.env.LIVE_OPS_CONFIG || 'config/liveops.json');
const at = process.argv[2] ? Date.parse(process.argv[2]) : Date.now();
if (!Number.isFinite(at)) {
  console.error('Usage: node scripts/preview-weekly-event.mjs [ISO instant]');
  process.exit(1);
}
try {
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  const { errors, events } = validateWeeklyEvents(raw.weeklyEvents);
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(`Weekly calendar: ${events.length} windows in ${file}`);
  for (const e of events) console.log(`${e.id} | ${new Date(e.startMs).toISOString()} — ${new Date(e.endMs).toISOString()} | ${e.milestones.map((m) => `${m.wins} wins: ${m.coins} coins`).join(', ')}`);
  const event = weeklyView(visibleWeeklyEvent({ weeklyEvents: events }, at), null, at);
  console.log(JSON.stringify({ at: new Date(at).toISOString(), disabled: process.env.WEEKLY_EVENT_DISABLED === '1', visible: event }, null, 2));
  if (!event) {
    console.error('No active or upcoming weekly event at this instant. Publish future dates before the schedule runs out.');
    process.exitCode = 1;
  }
} catch (error) {
  console.error(`Invalid weekly calendar: ${error.message}`);
  process.exitCode = 1;
}
