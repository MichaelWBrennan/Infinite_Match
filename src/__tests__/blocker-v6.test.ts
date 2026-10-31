import { describe, expect, test } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { generatedLevel } from '../services/levels/level-service.js';
import { certifyLevel, simulateLevelMove, levelActions } from '../services/levels/generator.js';
import { validObjectives, validObjectiveProgress, initialObjectiveProgress, objectiveStatus } from '../services/levels/objective-rules.js';
import { blockerCount, blockerKeys, simulateBlockerClear, validBlockers, BLOCKER_CAP } from '../services/levels/blocker-rules.js';
import { legalSwaps } from '../services/levels/match-core.js';
import { buildGoldenVectors, serializeGoldenVectors, LEVEL_CASES, BLOCKER_LEVEL_CASES } from '../services/levels/golden-vectors.js';

const loc = { timeZone: 'America/New_York', country: 'US', region: 'PA' };
const NOW = Date.parse('2026-10-31T12:00:00Z');
const v6 = (level: number, nowMs = NOW, mode: any = 'classic') => generatedLevel({ level, mode, location: loc, rulesVersion: 6 }, nowMs);

describe('rules v6 generation gate', () => {
  test('200 blocker-stage levels certify from the witness with every goal met', () => {
    let certified = 0;
    for (let i = 0; i < 200; i++) {
      // Blocker stage: level >= 3 and level % 6 === 2 (and not shield stage). Vary the forecast band through nowMs.
      const level = 14 + i * 12;
      const definition = v6(level, NOW + i * 3600_000);
      expect(blockerCount(definition.blockers)).toBeGreaterThan(0);
      const proof = certifyLevel(definition) as any;
      expect(proof.objectivesComplete).toBe(true);
      expect(proof.objectiveProgress.blockersCleared).toBeGreaterThanOrEqual(blockerCount(definition.blockers));
      certified++;
    }
    expect(certified).toBe(200);
  }, 120_000);

  test('v6 keeps every v5 shield stage and never stacks shields with blockers', () => {
    for (let level = 1; level <= 60; level++) {
      const definition = v6(level);
      const shieldCells = definition.shields.flat().filter(Boolean).length;
      const blockerCells = blockerCount(definition.blockers);
      expect(shieldCells > 0 && blockerCells > 0).toBe(false);
      if (level % 4 === 0 && level >= 4) expect(shieldCells).toBeGreaterThan(0);
    }
  });

  test('blockers never sit on special anchors or shield cells', () => {
    for (let level = 14; level <= 200; level += 12) {
      const d = v6(level);
      expect(validBlockers(d.blockers, d.boardSize)).toBe(true);
      for (const key of blockerKeys(d.blockers)) {
        const [r, c] = key.split(',').map(Number);
        expect(d.specials[r][c]).toBeNull();
        expect(d.shields[r][c]).toBe(0);
      }
    }
  });

  test('an unsupported rules version still fails closed', () => {
    expect(() => generatedLevel({ level: 1, mode: 'classic', location: loc, rulesVersion: 7 as any }, NOW)).toThrow();
  });
});

describe('rules v6 transition', () => {
  test('an accepted move spreads at most one blocker and stays under the cap', () => {
    const d = v6(14);
    let state: any = { board: d.board, specials: d.specials, refillState: d.refillState, shields: d.shields, blockers: d.blockers, objectiveProgress: initialObjectiveProgress(d) };
    const first = legalSwaps(d.board)[0].cells;
    const before = blockerCount(state.blockers);
    const next = simulateLevelMove(d, state, first) as any;
    expect(next).not.toBeNull();
    const after = blockerCount(next.blockers);
    expect(after).toBeLessThanOrEqual(Math.min(BLOCKER_CAP, before + 1));
    expect(after).toBeGreaterThanOrEqual(before - next.brokenBlockers);
  });

  test('a booster clear removes the blocker it hits and never spreads', () => {
    const d = v6(14);
    const [key] = blockerKeys(d.blockers);
    const state: any = { board: d.board, specials: d.specials, refillState: d.refillState, shields: d.shields, blockers: d.blockers, objectiveProgress: initialObjectiveProgress(d) };
    const out = simulateBlockerClear(d, state, [key], 0) as any;
    expect(out).not.toBeNull();
    expect(out.brokenBlockers).toBeGreaterThanOrEqual(1);
    expect(out.blockerSpread).toBeNull();
    expect(blockerKeys(out.blockers)).not.toContain(key);
  });

  test('hints carry a blocker priority and remain legal actions', () => {
    const d = v6(14);
    const progress = initialObjectiveProgress(d);
    const actions = levelActions(d, d.board, d.specials, progress, 0, d.shields, d.refillState, d.blockers) as any[];
    expect(actions.length).toBeGreaterThan(0);
    expect(actions.every((action) => Number.isFinite(action.priority))).toBe(true);
  });
});

describe('rules v6 objectives and progress', () => {
  test('clear-blockers is accepted only for v6 with the exact placed count', () => {
    const d = v6(14);
    expect(validObjectives(d)).toBe(true);
    const bad = { ...d, objectives: [{ type: 'clear-blockers', target: blockerCount(d.blockers) + 1 }] };
    expect(validObjectives(bad)).toBe(false);
    const v5Like = { ...d, generatorVersion: 5, objectives: d.objectives };
    expect(validObjectives(v5Like)).toBe(false);
  });

  test('v6 progress needs blockersCleared; v5 shape is still exact', () => {
    const d = v6(14);
    const good = initialObjectiveProgress(d);
    expect(Object.keys(good).sort()).toEqual(['blockersCleared', 'collected', 'shieldsCleared']);
    expect(validObjectiveProgress(d, good)).toBe(true);
    const missing = { collected: good.collected, shieldsCleared: 0 };
    expect(validObjectiveProgress(d, missing as any)).toBe(false);
    expect(validObjectiveProgress(d, { ...good, blockersCleared: -1 })).toBe(false);
    expect(validObjectiveProgress(d, { ...good, blockersCleared: 1.5 })).toBe(false);
  });

  test('objective status reads blockersCleared', () => {
    const d = v6(14);
    const target = d.objectives.find((goal: any) => goal.type === 'clear-blockers').target;
    const status = objectiveStatus(d, 0, { ...initialObjectiveProgress(d), blockersCleared: target });
    expect(status.items.find((goal: any) => goal.type === 'clear-blockers').complete).toBe(true);
  });
});

describe('golden fixtures', () => {
  test('rules-v6.json is current with the v6 rules that generate it', () => {
    expect(readFileSync('fixtures/golden/rules-v6.json', 'utf8'))
      .toBe(serializeGoldenVectors(buildGoldenVectors(6, [...LEVEL_CASES, ...BLOCKER_LEVEL_CASES])));
  });

  test('rules-v6.json lists the blocker-stage cases and declares version 6', () => {
    const doc = JSON.parse(readFileSync('fixtures/golden/rules-v6.json', 'utf8'));
    expect(doc.rulesVersion).toBe(6);
    const names = doc.levels.map((level: any) => level.name);
    expect(names).toEqual(expect.arrayContaining(['classic-14-blocker-stage', 'classic-50-boss-blocker-stage']));
    const blockerCase = doc.levels.find((level: any) => level.name === 'classic-14-blocker-stage');
    expect(blockerCase.expected.blockers.flat().some(Boolean)).toBe(true);
  });
});
