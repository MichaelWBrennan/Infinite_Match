import { simulateLevelMove } from './generator.js';
import { initialObjectiveProgress, objectiveStatus, simulateObjectiveClear, validObjectives } from './objective-rules.js';
import { validBlockers } from './blocker-rules.js';
import { validLockedGems } from './locked-gem-rules.js';
import { validJelly, jellyCount, blankJelly } from './jelly-rules.js';
import { validChocolate } from './chocolate-rules.js';
import { validLiquorice } from './liquorice-rules.js';
import { validMarmalade } from './marmalade-rules.js';
import { validFrosting } from './frosting-rules.js';
import { inventoryReplayEffect } from './inventory-replay.js';
import { recordRejection } from './replay-telemetry.js';
/** A replay is evidence of a reachable result, not proof of human play or elapsed time.
 * Only deterministic, single-board classic/daily attempts are eligible. Inventory receipts
 * are minted and pinned by the economy service, never sourced from the completion body.
 */
function reject(reason) {
    recordRejection(reason);
    return { error: reason };
}
export function replayLevelAttempt(definition, moves, reportedScore, reportedProgress, receipts = []) {
    if (!definition || definition.generatorVersion < 4 || !['classic', 'daily'].includes(definition.mode)) {
        return reject('replay_unsupported');
    }
    // A pinned v6 definition must carry a valid blocker grid or locked gem grid whose
    // placed count is the objective target.
    if (definition.generatorVersion >= 6 && (!validBlockers(definition.blockers, definition.boardSize)
        || !validLockedGems(definition.lockedGems, definition.boardSize)
        || !validJelly(definition.jelly, definition.boardSize)
        || !validChocolate(definition.chocolate, definition.boardSize)
        || !validLiquorice(definition.liquorice, definition.boardSize) || !validObjectives(definition))) {
        return reject('invalid_level_objectives');
    }
    if (!Number.isSafeInteger(definition.moves) || definition.moves < 1 || definition.moves > 1000
        || !Array.isArray(receipts) || receipts.length > 20 || !Array.isArray(moves) || moves.length < 1
        || moves.length > definition.moves + receipts.length) {
        return reject('invalid_move_history');
    }
    const receiptById = new Map(receipts.map((receipt) => [receipt.id, receipt.type]));
    if (receiptById.size !== receipts.length)
        return reject('invalid_move_history');
    const used = new Set();
    let ordinaryMoves = 0;
    let state = {
        board: definition.board, specials: definition.specials, shields: definition.shields,
        refillState: definition.refillState, objectiveProgress: initialObjectiveProgress(definition),
        ...(definition.generatorVersion >= 6 ? { blockers: definition.blockers, locked: definition.lockedGems, jelly: definition.jelly, chocolate: definition.chocolate, liquorice: definition.liquorice, marmalade: definition.marmalade, frosting: definition.frosting } : {}),
    };
    let score = 0;
    for (let i = 0; i < moves.length; i++) {
        const action = moves[i];
        let result;
        if (Array.isArray(action)) {
            if (++ordinaryMoves > definition.moves)
                return reject('invalid_move_history');
            const size = definition.boardSize;
            if (![2, 4].includes(action.length)
                || action.some((n) => !Number.isSafeInteger(n) || n < 0 || n >= size)
                || (action.length === 2 && !state.specials?.[action[0]]?.[action[1]])) {
                return reject('invalid_move_history');
            }
            result = simulateLevelMove(definition, state, action);
        }
        else if (action && typeof action === 'object' && !Array.isArray(action)
            && typeof action.receiptId === 'string' && receiptById.get(action.receiptId) === action.type
            && !used.has(action.receiptId)) {
            const effect = inventoryReplayEffect(definition, state, action);
            if (!effect)
                return reject('invalid_move_history');
            used.add(action.receiptId);
            result = simulateObjectiveClear(definition, state, effect.keys, effect.points);
        }
        else {
            return reject('invalid_move_history');
        }
        if (!result || !Number.isSafeInteger(result.score) || result.score < 0) {
            return reject('invalid_move_history');
        }
        score += result.score;
        if (!Number.isSafeInteger(score) || score > 1000000)
            return reject('invalid_move_history');
        state = {
            board: result.board, specials: result.specials, shields: result.shields,
            refillState: result.refillState, objectiveProgress: result.objectiveProgress,
            // v6 terrain moves with the board. Without this the next move would restart from the initial grid.
            ...(definition.generatorVersion >= 6 ? { blockers: result.blockers, locked: result.locked, jelly: result.jelly, chocolate: result.chocolate, liquorice: result.liquorice, marmalade: result.marmalade, frosting: result.frosting } : {}),
        };
        // The browser ends the level immediately when the first winning action resolves.
        if (objectiveStatus(definition, score, state.objectiveProgress).complete && i !== moves.length - 1) {
            return reject('invalid_move_history');
        }
    }
    // All spent receipts must be accounted for; a lost response can still use legacy
    // unverified completion rather than inventing an effect or claiming a ranked result.
    if (used.size !== receipts.length)
        return reject('unused_powerup_receipt');
    if (score !== reportedScore || !objectiveStatus(definition, score, state.objectiveProgress).complete) {
        return reject('replay_result_mismatch');
    }
    const expected = state.objectiveProgress;
    if (!reportedProgress || typeof reportedProgress !== 'object'
        || definition.gemTypes.some((color) => (reportedProgress.collected?.[color] || 0) !== expected.collected[color])
        || (definition.generatorVersion >= 5 && reportedProgress.shieldsCleared !== expected.shieldsCleared)
        || (definition.generatorVersion >= 6 && reportedProgress.blockersCleared !== expected.blockersCleared)
        || (definition.generatorVersion >= 6 && reportedProgress.lockedCleared !== expected.lockedCleared)
        || (definition.generatorVersion >= 6 && reportedProgress.jellyCleared !== expected.jellyCleared)
        || (definition.generatorVersion >= 6 && reportedProgress.chocolateCleared !== expected.chocolateCleared)
        || (definition.generatorVersion >= 6 && reportedProgress.liquoriceCleared !== expected.liquoriceCleared)
        || (definition.generatorVersion >= 6 && reportedProgress.marmaladeCleared !== expected.marmaladeCleared)
        || (definition.generatorVersion >= 6 && reportedProgress.frostingCleared !== expected.frostingCleared)) {
        return reject('replay_result_mismatch');
    }
    return { verified: true, score };
}
//# sourceMappingURL=attempt-replay.js.map