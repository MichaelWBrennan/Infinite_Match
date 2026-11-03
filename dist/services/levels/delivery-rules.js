/** Rules v6: delivery terrain tiles. A delivery cell requires a specific gem
 * type to be matched over it before it counts as cleared. Delivery never
 * blocks swaps and never spreads. Each delivery cell holds a gem type id
 * (e.g. 'red', 'blue') that must be cleared over it.
 * Classic only: daily, timed and endless never receive delivery objectives.
 */
import { hashSeed } from './match-core.js';
import { simulateSpecialMove, blankSpecials } from './special-rules.js';
export const DELIVERY_CAP = 5;
export function validDelivery(delivery, size, gemTypes) {
    if (!delivery)
        return true; // no delivery terrain is valid
    if (!Array.isArray(delivery) || delivery.length !== size)
        return false;
    return delivery.every((row) => Array.isArray(row) && row.length === size &&
        row.every((value) => value === null || (typeof value === 'string' && gemTypes.includes(value))));
}
export function deliveryCount(delivery) {
    if (!delivery)
        return 0;
    return delivery.flat().filter((value) => value !== null).length;
}
export function blankDelivery(size) {
    return Array.from({ length: size }, () => new Array(size).fill(null));
}
/** Apply delivery clearing to a move result. A delivery cell is cleared when
 *  the gem type at that cell (before clearing) matches the required type.
 *  `board` is the pre-move board state. Never mutates input. */
export function applyDeliveryClear(result, initialDelivery, board) {
    if (!result)
        return null;
    let grid = initialDelivery.map((row) => row.slice());
    let cleared = 0;
    const clearedKeys = result.cleared || [];
    for (const key of clearedKeys) {
        const [row, col] = key.split(',').map(Number);
        const required = grid[row][col];
        if (required !== null && board[row][col] === required) {
            grid[row][col] = null;
            cleared += 1;
        }
    }
    return { delivery: grid, deliveryCleared: cleared };
}
/** Place delivery cells only on cells the no-inventory witness actually clears
 *  with the required gem type, up to DELIVERY_CAP. Same existence-proof pattern
 *  as witnessedShields. */
export function witnessedDelivery(board, refillState, palette, weights, specials, witness, seed, gemTypes) {
    const n = board.length;
    const clears = new Map(); // key -> Set of gem types cleared over that cell
    let state = { board, specials, refillState };
    for (const cells of witness) {
        const next = simulateSpecialMove(state.board, state.refillState, palette, weights, cells, state.specials);
        if (!next)
            throw new Error('delivery_witness_invalid');
        for (const event of next.events) {
            for (const key of event.cleared) {
                const [row, col] = key.split(',').map(Number);
                const gemType = state.board[row][col];
                if (gemType && gemTypes.includes(gemType)) {
                    const set = clears.get(key) || new Set();
                    set.add(gemType);
                    clears.set(key, set);
                }
            }
        }
        state = next;
    }
    const candidates = [...clears.entries()].filter(([, types]) => types.size >= 1)
        .map(([key]) => key).sort();
    const delivery = blankDelivery(n);
    if (!candidates.length)
        return delivery;
    const offset = hashSeed(`${seed}|delivery-cells`) % candidates.length;
    const cap = Math.min(DELIVERY_CAP, candidates.length);
    for (let i = 0; i < cap; i++) {
        const [row, col] = candidates[(offset + i) % candidates.length].split(',').map(Number);
        const types = clears.get(candidates[(offset + i) % candidates.length]);
        delivery[row][col] = [...types][0];
    }
    return delivery;
}
/** Certify a delivery level: run the no-inventory witness and confirm every
 *  delivery cell is cleared by the witness path. Returns { score, collected,
 *  deliveryCleared, events }. */
export function certifyDeliveryBoard(definition) {
    const { board, refillState, gemTypes, gemWeights, specials, witness, delivery } = definition;
    if (!Array.isArray(witness) || witness.length === 0)
        throw new Error('delivery_certify_no_witness');
    let state = { board, specials: specials || blankSpecials(board.length), refillState };
    let score = 0;
    const collected = Object.fromEntries(gemTypes.map((color) => [color, 0]));
    let deliveryCleared = 0;
    for (const cells of witness) {
        const next = simulateSpecialMove(state.board, state.refillState, gemTypes, gemWeights, cells, state.specials, true);
        if (!next)
            throw new Error('delivery_certify_move_failed');
        score += next.score || 0;
        for (const color of gemTypes)
            collected[color] = (collected[color] || 0) + (next.collected?.[color] || 0);
        const cleared = applyDeliveryClear(next, state.delivery || blankDelivery(board.length), state.board);
        state.delivery = cleared.delivery;
        deliveryCleared += cleared.deliveryCleared || 0;
        state = { board: next.board, specials: next.specials, refillState: next.refillState };
    }
    const remaining = deliveryCount(state.delivery || blankDelivery(board.length));
    if (remaining > 0)
        throw new Error(`delivery_certify_incomplete:${remaining}`);
    return { score, collected, deliveryCleared, events: [] };
}
// Named exports only — build script strips 'export ' prefix.
//# sourceMappingURL=delivery-rules.js.map