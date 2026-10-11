#!/usr/bin/env node
// Offline aggregate evaluator only. Never calls an API or writes a report to disk.
import { readFile, stat } from 'node:fs/promises';
import { evaluateStabilityStudy } from '../src/services/study/session-stability.js';

const args = process.argv.slice(2);
const usage = 'Usage: node scripts/evaluate-web-stability.mjs <private-study.json> [--json]';
if (args.length === 1 && args[0] === '--help') {
  console.log(usage);
  process.exit(0);
}
if ((args.length !== 1 && args.length !== 2) || (args.length === 2 && args[1] !== '--json')
  || args[0]?.startsWith('-')) {
  console.error(usage);
  process.exit(1);
}
try {
  if ((await stat(args[0])).size > 2 * 1024 * 1024) throw new Error('study_file_too_large');
  const report = evaluateStabilityStudy(JSON.parse(await readFile(args[0], 'utf8')));
  if (report.error) {
    console.error(`Stability study schema rejected: ${report.error}${report.row ? ` at row ${report.row}` : ''}`);
    process.exitCode = 1;
  } else {
    if (args[1] === '--json') console.log(JSON.stringify(report, null, 2));
    else {
      console.log(`Stability study ${report.studyId} (${report.build}): ${report.status}`);
      console.log(`Sessions (${report.stability.sessions}/${report.stability.minimum}): ${report.stability.status}`);
      console.log(`  No crash observed: ${report.stability.noCrashObserved}; confirmed crashes: ${report.stability.confirmedCrashes}; unknown outcomes: ${report.stability.unknownOutcomes}`);
      console.log(`  Conservative rate: ${report.stability.conservativeNoCrashRate}; approximate independent-session 95% Wilson interval: ${JSON.stringify(report.stability.approximate95PercentWilson)}`);
      console.log(`  Client errors observed: ${report.clientErrors.observed}; unchecked: ${report.clientErrors.missingChecks} (not equivalent to crashes)`);
      console.log(report.note);
    }
    if (report.status !== 'criteria_met_in_submitted_records') process.exitCode = 2;
  }
} catch (error) {
  // Never print input contents or a path containing participant information.
  console.error(`Stability study could not be evaluated: ${error.message === 'study_file_too_large' ? error.message : 'invalid_or_unreadable_file'}`);
  process.exitCode = 1;
}
