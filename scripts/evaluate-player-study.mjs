#!/usr/bin/env node
// Offline study gate evaluator. Deliberately never calls an API or writes a report to disk.
import { readFile, stat } from 'node:fs/promises';
import { evaluateStudy } from '../src/services/study/first-play.js';

const args = process.argv.slice(2);
if (args.length === 1 && args[0] === '--help') {
  console.log('Usage: node scripts/evaluate-player-study.mjs <local-study.json> [--json]');
  process.exit(0);
}
if ((args.length !== 1 && args.length !== 2) || (args.length === 2 && args[1] !== '--json')
  || args[0]?.startsWith('-')) {
  console.error('Usage: node scripts/evaluate-player-study.mjs <local-study.json> [--json]');
  process.exit(1);
}
try {
  if ((await stat(args[0])).size > 256 * 1024) throw new Error('study_file_too_large');
  const report = evaluateStudy(JSON.parse(await readFile(args[0], 'utf8')));
  if (report.error) {
    console.error(`Study schema rejected: ${report.error}${report.row ? ` at row ${report.row}` : ''}`);
    process.exitCode = 1;
  } else {
    if (args[1] === '--json') console.log(JSON.stringify(report, null, 2));
    else {
      console.log(`Study ${report.studyId} (${report.build}): ${report.status}`);
      console.log(`First-time phone (${report.learning.sessions}/${report.learning.minimum}): ${report.learning.status}`);
      console.log(`  Unassisted valid move within 30s: ${report.learning.unassistedMovesBy30s}; understood goal: ${report.learning.goalsExplained}; missing goal answers: ${report.learning.missingGoal}`);
      console.log(`Observed loss (${report.fairness.sessions}/${report.fairness.minimum}): ${report.fairness.status}`);
      console.log(`  Fair loss: ${report.fairness.fairLosses}; median enjoyment: ${report.fairness.medianEnjoyment}; missing fairness: ${report.fairness.missingFairness}; missing enjoyment: ${report.fairness.missingEnjoyment}`);
      console.log(report.note);
    }
    if (report.status !== 'criteria_met_in_submitted_records') process.exitCode = 2;
  }
} catch (error) {
  // Avoid printing file contents or a path containing a participant's name.
  console.error(`Study could not be evaluated: ${error.message === 'study_file_too_large' ? error.message : 'invalid_or_unreadable_file'}`);
  process.exitCode = 1;
}
