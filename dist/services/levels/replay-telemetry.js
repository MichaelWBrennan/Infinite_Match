/**
 * False-rejection telemetry for replay-verified level completions.
 *
 * Every time `replayLevelAttempt` rejects a submission, the reason is counted
 * here. Operators can read the counters to detect regressions in replay logic
 * that would incorrectly refuse legitimate player wins. Counts live in memory
 * only (process lifetime) and are never used to gate rewards or ranking.
 *
 * A separate persisted attempt-observations file records player-side outcomes;
 * this module records server-side replay rejections only.
 */
const rejections = new Map(); // reason -> count
/** Record one replay rejection. Safe to call from any module. */
export function recordRejection(reason) {
    if (typeof reason !== 'string' || reason.length === 0)
        return;
    rejections.set(reason, (rejections.get(reason) || 0) + 1);
}
/** Read a snapshot of all rejection counters: { reason: count }. */
export function rejectionCounts() {
    return Object.fromEntries(rejections);
}
/** Total rejections across all reasons. */
export function totalRejections() {
    let total = 0;
    for (const count of rejections.values())
        total += count;
    return total;
}
/** Reset all counters (for tests). */
export function resetRejections() {
    rejections.clear();
}
export default { recordRejection, rejectionCounts, totalRejections, resetRejections };
//# sourceMappingURL=replay-telemetry.js.map