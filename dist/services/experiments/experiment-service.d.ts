/** Returns all registered experiment definitions. */
export function listExperiments(): ({
    id: string;
    name: string;
    description: string;
    variants: {
        id: string;
        label: string;
        config: {
            discountPercent: number;
        };
    }[];
    traffic: number;
    goalEvent: string;
} | {
    id: string;
    name: string;
    description: string;
    variants: {
        id: string;
        label: string;
        config: {
            priceCents: number;
            lives: number;
        };
    }[];
    traffic: number;
    goalEvent: string;
})[];
/** Returns a single experiment definition, or null. */
export function getExperiment(id: any): any;
/**
 * Legacy sticky assignment: hash experiment+userId to pick a variant.
 * Kept for backward compatibility with existing tests and callers.
 */
export function stickyAssign(experiment: any, userId: any, variants: any): any;
/**
 * Sticky assignment: hash experiment+playerId to pick a variant deterministically.
 * Returns { variantId, variant, inExperiment } where inExperiment is false when
 * the player falls outside the traffic allocation or fails the segment filter.
 */
export function assignPlayer(experimentId: any, playerId: any, player?: {}): {
    variantId: any;
    variant: any;
    inExperiment: boolean;
};
/** Records an assignment event (called when the client requests a variant). */
export function recordAssignment(experimentId: any, playerId: any, variantId: any, inExperiment: any): Promise<void>;
/** Records a conversion event for an experiment variant. */
export function recordConversion(experimentId: any, playerId: any, variantId: any, event: any, value?: number): Promise<void>;
/**
 * Computes experiment results: conversion rate per variant, lift vs control,
 * and sample sizes. Returns an array of result rows.
 */
export function computeResults(experimentId: any): Promise<{
    experimentId: any;
    name: any;
    goalEvent: any;
    totalPlayers: number;
    results: {
        variantId: any;
        label: any;
        players: any;
        converters: any;
        conversionRate: number;
        liftPercent: number;
        isControl: boolean;
    }[];
    holdoutPlayers: number;
    controlConversionRate: number;
} | null>;
declare namespace _default {
    export { listExperiments };
    export { getExperiment };
    export { assignPlayer };
    export { recordAssignment };
    export { recordConversion };
    export { computeResults };
}
export default _default;
//# sourceMappingURL=experiment-service.d.ts.map