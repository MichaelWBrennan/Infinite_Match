/** Rules v6: jelly terrain tiles. Jelly sits on top of ordinary gem cells and does not
 * alter the board, specials, shields, blockers, locked gems, or refill path. A match
 * that clears the gem on a jelly cell removes one layer of jelly; once all layers are
 * gone the cell is clear. Jelly never blocks swaps and never spreads. Only the v6 path
 * uses it.
 *
 * Each cell can carry 0, 1, or 2 jelly layers. A clear event over a jelly cell consumes
 * one layer per cleared cell. Specials and inventory hits also consume layers on covered
 * cells, matching how they hit shields.
 */
import { hashSeed } from './match-core.js';
import { simulateSpecialMove, blankSpecials } from './special-rules.js';
export const JELLY_MAX_LAYERS = 2;
export function validJelly(jelly, size) {
    return Array.isArray(jelly) && jelly.length === size && jelly.every((row) => Array.isArray(row) && row.length === size && row.every((value) => Number.isInteger(value) && value >= 0 && value <= JELLY_MAX_LAYERS));
}
export function jellyCount(jelly) {
    return jelly.flat().filter(Boolean).length;
}
/** Blank grid of zeros. */
export function blankJelly(size) {
    return Array.from({ length: size }, () => new Array(size).fill(0));
}
/** Place jelly only on cells the no-inventory witness actually clears, up to JELLY_CAP.
 * Same existence-proof pattern as witnessedShields. One layer per cell unless the
 * witness clears it twice or more, in which case two layers are used.
 */
export function witnessedJelly(board, refillState, palette, weights, specials, witness, seed) {
    const n = board.length;
    const clears = new Map();
    let state = { board, specials, refillState };
    for (const cells of witness) {
        const next = simulateSpecialMove(state.board, state.refillState, palette, weights, cells, state.specials);
        if (!next)
            throw new Error('jelly_witness_invalid');
        for (const event of next.events)
            for (const key of event.cleared)
                clears.set(key, (clears.get(key) || 0) + 1);
        state = next;
    }
    const candidates = [...clears.entries()].filter(([, hits]) => hits >= 1).map(([key]) => key).sort();
    const jelly = blankJelly(n);
    if (!candidates.length)
        return jelly;
    const offset = hashSeed(`${seed}|jelly-cells`) % candidates.length;
    const cap = Math.min(3, candidates.length);
    for (let i = 0; i < cap; i++) {
        const [row, col] = candidates[(offset + i) % candidates.length].split(',').map(Number);
        const hits = clears.get(`${row},${col}`);
        jelly[row][col] = hits >= 2 ? 2 : 1;
    }
    return jelly;
}
/** Apply one clear pass over jelly cells: decrement each covered cell by 1 (floor 0).
 * Returns { jelly, cleared: number of cells that lost a layer }. Never mutates input.
 */
export function clearJelly(jelly, clearedKeys) {
    const copy = jelly.map((row) => row.slice());
    let lost = 0;
    for (const key of clearedKeys) {
        const [row, col] = key.split(',').map(Number);
        if (copy[row][col] > 0) {
            copy[row][col] -= 1;
            lost += 1;
        }
    }
    return { jelly: copy, cleared: lost };
}
/** Certify a jelly level: run the no-inventory witness and confirm every jelly cell
 * is cleared by the witness path. Returns { score, collected, jellyCleared, events }.
 */
export function certifyJellyBoard(definition) {
    const { board, refillState, gemTypes, gemWeights, specials, witness, jelly } = definition;
    if (!Array.isArray(witness) || witness.length === 0)
        throw new Error('jelly_certify_no_witness');
    let state = { board, specials: specials || blankSpecials(board.length), refillState };
    let score = 0;
    const collected = Object.fromEntries(gemTypes.map((color) => [color, 0]));
    let jellyCleared = 0;
    for (const cells of witness) {
        const next = simulateSpecialMove(state.board, state.refillState, gemTypes, gemWeights, cells, state.specials, true);
        if (!next)
            throw new Error('jelly_certify_move_failed');
        score += next.score || 0;
        for (const color of gemTypes)
            collected[color] = (collected[color] || 0) + (next.collected?.[color] || 0);
        const cleared = applyJellyClear(next, state.jelly || blankJelly(board.length));
        state.jelly = cleared.jelly;
        jellyCleared += cleared.jellyCleared || 0;
        state = { board: next.board, specials: next.specials, refillState: next.refillState };
    }
    const remaining = jellyCount(state.jelly || blankJelly(board.length));
    if (remaining > 0)
        throw new Error(`jelly_certify_incomplete:${remaining}`);
    return { score, collected, jellyCleared, events: [] };
}
/** Thread jelly layers through a simulate-style result. Used by match-core's v6
 * transition to decrement jelly on cleared cells and rebuild state. Never mutates input.
 */
export function applyJellyClear(result, initialJelly) {
    if (!result)
        return null;
    const jelly = initialJelly.map((row) => row.slice());
    const trace = result.presentation;
    if (trace)
        trace.initial.jelly = initialJelly.map((row) => row.slice());
    const events = result.events.map((event, index) => {
        const visual = trace?.frames[index];
        if (visual)
            visual.before.jelly = jelly.map((row) => row.slice());
        const jellyHits = [];
        for (const key of event.cleared) {
            const [row, col] = key.split(',').map(Number);
            if (jelly[row][col] > 0) {
                jelly[row][col] -= 1;
                jellyHits.push(key);
            }
        }
        if (visual)
            visual.after.jelly = jelly.map((row) => row.slice());
        return { ...event, jellyHits };
    });
    let totalJellyHits = 0;
    for (const event of events)
        totalJellyHits += event.jellyHits.length;
    return { ...result, events, jelly, jellyCleared: totalJellyHits };
}
export default {
    validJelly, jellyCount, blankJelly, witnessedJelly, clearJelly, applyJellyClear,
    JELLY_MAX_LAYERS,
};
//# sourceMappingURL=jelly-rules.js.map