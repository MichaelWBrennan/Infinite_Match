export function liveOpsConfigPath(): string;
/** Checks a raw config. Returns { errors, config } where config is normalised when valid. */
export function validateLiveOps(raw: any): {
    errors: any[];
    config: null;
} | {
    errors: any[];
    config: {
        events: any[];
        deals: any[];
    };
};
/** Loads the config once per process. Restart the server to pick up changes. */
export function loadLiveOps({ path, reload }?: {
    path?: string | undefined;
    reload?: boolean | undefined;
}): any;
/**
 * The price to charge for a catalog product at a given time. Deal windows are
 * compared at whole-second resolution so the purchase route and the webhook agree.
 */
export function priceFor(productId: any, nowMs?: number, config?: any): {
    priceCents: any;
    currency: any;
    deal: boolean;
} | null;
/** What the game shows today: active deals, active events, and events coming up. */
export function liveOpsToday(nowMs?: number, config?: any): {
    deals: any;
    activeEvents: any;
    upcomingEvents: any;
};
export const MIN_DEAL_PRICE_CENTS: 99;
declare namespace _default {
    export { loadLiveOps };
    export { validateLiveOps };
    export { priceFor };
    export { liveOpsToday };
    export { MIN_DEAL_PRICE_CENTS };
}
export default _default;
//# sourceMappingURL=live-ops.d.ts.map