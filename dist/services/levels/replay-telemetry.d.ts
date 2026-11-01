/** Record one replay rejection. Safe to call from any module. */
export function recordRejection(reason: any): void;
/** Read a snapshot of all rejection counters: { reason: count }. */
export function rejectionCounts(): any;
/** Total rejections across all reasons. */
export function totalRejections(): number;
/** Reset all counters (for tests). */
export function resetRejections(): void;
declare namespace _default {
    export { recordRejection };
    export { rejectionCounts };
    export { totalRejections };
    export { resetRejections };
}
export default _default;
//# sourceMappingURL=replay-telemetry.d.ts.map