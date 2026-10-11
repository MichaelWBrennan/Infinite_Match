// Golden rule vectors: a language-neutral record of what the canonical (JavaScript) rules produce.
// Any other engine (for example a future Unity/C# port) must reproduce these exact integers and
// doubles to claim parity. Regenerate with `npm run vectors:build`; a test fails when the committed
// fixture is stale. Keep this module pure: no network, no clock other than the explicit nowMs inputs.
import { generateLevel, GENERATOR_VERSION, simulateLevelMove } from './generator.js';
import { hashSeed, legalSwaps, nextRandom } from './match-core.js';
import { generatedLevel } from './level-service.js';
import { initialObjectiveProgress } from './objective-rules.js';

export const GOLDEN_FORMAT = 'infinite-match-golden-vectors';
export const GOLDEN_VERSION = 1;

const NOW = Date.parse('2026-10-31T12:00:00Z');
const US_EAST = { timeZone: 'America/New_York', country: 'US', region: 'PA' };
const AU_EAST = { timeZone: 'Australia/Sydney', country: 'AU', region: 'NSW' };

/** Inputs are stable identifiers; the fixture stores every derived value the rules must agree on. */
export const LEVEL_CASES = [
  { name: 'classic-1-us-east', level: 1, mode: 'classic', location: US_EAST, nowMs: NOW },
  { name: 'classic-4-us-east-shield-stage', level: 4, mode: 'classic', location: US_EAST, nowMs: NOW },
  { name: 'classic-8-us-east-shield-stage', level: 8, mode: 'classic', location: US_EAST, nowMs: NOW },
  { name: 'classic-10-boss', level: 10, mode: 'classic', location: US_EAST, nowMs: NOW },
  { name: 'classic-17-us-east', level: 17, mode: 'classic', location: US_EAST, nowMs: NOW },
  { name: 'daily-us-east', level: 1, mode: 'daily', location: US_EAST, nowMs: NOW },
  { name: 'timed-5-us-east', level: 5, mode: 'timed', location: US_EAST, nowMs: NOW },
  { name: 'endless-12-us-east', level: 12, mode: 'endless', location: US_EAST, nowMs: NOW },
  { name: 'classic-3-southern-hemisphere', level: 3, mode: 'classic', location: AU_EAST, nowMs: NOW },
  { name: 'daily-southern-hemisphere', level: 1, mode: 'daily', location: AU_EAST, nowMs: NOW },
];

/** Strings that exercise hashing edge cases: ASCII, a dash-separated key, and an astral character. */
export const HASH_CASES = ['', 'classic|1', 'v5|daily|1|2026-10-31|America/New_York', 'emoji 😀 key'];

/** Named seeds for the RNG stream test (first eight outputs each). */
export const RNG_SEEDS = [0, 1, 0xdeadbeef, 0xffffffff];

function rngVectors() {
  return RNG_SEEDS.map((seed) => {
    const rng = { state: seed >>> 0 };
    const outputs = [];
    for (let i = 0; i < 8; i++) {
      const value = nextRandom(rng);
      // Store the exact fraction as its uint32 numerator (value * 2^32 is an integer by construction).
      outputs.push({ state: rng.state, numerator: value * 4294967296 });
    }
    return { seed, outputs };
  });
}

function summarizeLevel(definition) {
  const progress = initialObjectiveProgress(definition);
  const swaps = legalSwaps(definition.board);
  const first = swaps[0]?.cells ?? null;
  const move = first ? simulateLevelMove(definition, {
    board: definition.board,
    refillState: definition.refillState,
    specials: definition.specials,
    shields: definition.shields,
    objectiveProgress: progress,
    score: 0,
  }, first) : null;
  return {
    id: definition.id,
    generatorVersion: definition.generatorVersion,
    mode: definition.mode,
    level: definition.level,
    seed: definition.seed,
    environmentKey: definition.environmentKey,
    context: definition.context,
    refillState: definition.refillState,
    boardSize: definition.boardSize,
    board: definition.board,
    gemTypes: definition.gemTypes,
    gemWeights: definition.gemWeights,
    targetScore: definition.targetScore,
    moves: definition.moves,
    objectives: definition.objectives,
    objectiveProfile: definition.objectiveProfile ?? null,
    shields: definition.shields ?? null,
    legalOpeningMoves: swaps.length,
    firstLegalSwap: first,
    firstMove: move ? {
      score: move.score ?? 0,
      refillState: move.refillState ?? null,
      board: move.board ?? null,
      collected: move.collected ?? null,
      brokenShields: move.brokenShields ?? null,
      objectiveProgress: move.objectiveProgress ?? null,
    } : null,
    quality: definition.quality,
  };
}

/** Build the full vector document. Deterministic for the same code. */
export function buildGoldenVectors() {
  return {
    format: GOLDEN_FORMAT,
    version: GOLDEN_VERSION,
    rulesVersion: GENERATOR_VERSION,
    notes: [
      'Integers are exact; numerator = fraction * 2^32 for RNG outputs.',
      'Weights and objective numbers are IEEE-754 doubles; port with double arithmetic in the same operation order.',
      'hashSeed iterates UTF-16 code units (charCodeAt), not Unicode code points; see the astral-character hash case.',
    ],
    hash: HASH_CASES.map((text) => ({ text, seed: hashSeed(text) })),
    rng: rngVectors(),
    levels: LEVEL_CASES.map((input) => {
      const { name, level, mode, location, nowMs } = input;
      const definition = generatedLevel({ level, mode, location, rulesVersion: GENERATOR_VERSION }, nowMs);
      return { name, input: { level, mode, location, nowMs, rulesVersion: GENERATOR_VERSION }, expected: summarizeLevel(definition) };
    }),
  };
}

/** Serialise deterministically with a trailing newline. */
export function serializeGoldenVectors(doc = buildGoldenVectors()) {
  return `${JSON.stringify(doc, null, 2)}\n`;
}

// Re-exported for tests that want to confirm the direct generator path equals the level-service path.
export { generateLevel };
