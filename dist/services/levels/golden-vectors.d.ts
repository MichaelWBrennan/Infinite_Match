/** Build the full vector document for one rules version. Deterministic for the same code.
 * Rules v5 (the default) and v6 are separate committed fixtures; v5 output must not change. */
export function buildGoldenVectors(rulesVersion?: number, cases?: {
    name: string;
    level: number;
    mode: string;
    location: {
        timeZone: string;
        country: string;
        region: string;
    };
    nowMs: number;
}[]): {
    format: string;
    version: number;
    rulesVersion: number;
    notes: string[];
    hash: {
        text: string;
        seed: number;
    }[];
    rng: {
        seed: number;
        outputs: {
            state: number;
            numerator: number;
        }[];
    }[];
    levels: {
        name: string;
        input: {
            level: number;
            mode: string;
            location: {
                timeZone: string;
                country: string;
                region: string;
            };
            nowMs: number;
            rulesVersion: number;
        };
        expected: {
            legalOpeningMoves: number;
            firstLegalSwap: number[] | null;
            firstMove: {
                objectiveProgress: any;
                brokenBlockers?: any;
                blockerSpread?: any;
                score: any;
                refillState: any;
                board: any;
                collected: any;
                brokenShields: any;
            } | null;
            quality: any;
            frosting?: any;
            marmalade?: any;
            liquorice?: any;
            chocolate?: any;
            jelly?: any;
            lockedGems?: any;
            blockers?: any;
            id: any;
            generatorVersion: any;
            mode: any;
            level: any;
            seed: any;
            environmentKey: any;
            context: any;
            refillState: any;
            boardSize: any;
            board: any;
            gemTypes: any;
            gemWeights: any;
            targetScore: any;
            moves: any;
            objectives: any;
            objectiveProfile: any;
            shields: any;
        };
    }[];
};
/** Serialise deterministically with a trailing newline. */
export function serializeGoldenVectors(doc?: {
    format: string;
    version: number;
    rulesVersion: number;
    notes: string[];
    hash: {
        text: string;
        seed: number;
    }[];
    rng: {
        seed: number;
        outputs: {
            state: number;
            numerator: number;
        }[];
    }[];
    levels: {
        name: string;
        input: {
            level: number;
            mode: string;
            location: {
                timeZone: string;
                country: string;
                region: string;
            };
            nowMs: number;
            rulesVersion: number;
        };
        expected: {
            legalOpeningMoves: number;
            firstLegalSwap: number[] | null;
            firstMove: {
                objectiveProgress: any;
                brokenBlockers?: any;
                blockerSpread?: any;
                score: any;
                refillState: any;
                board: any;
                collected: any;
                brokenShields: any;
            } | null;
            quality: any;
            frosting?: any;
            marmalade?: any;
            liquorice?: any;
            chocolate?: any;
            jelly?: any;
            lockedGems?: any;
            blockers?: any;
            id: any;
            generatorVersion: any;
            mode: any;
            level: any;
            seed: any;
            environmentKey: any;
            context: any;
            refillState: any;
            boardSize: any;
            board: any;
            gemTypes: any;
            gemWeights: any;
            targetScore: any;
            moves: any;
            objectives: any;
            objectiveProfile: any;
            shields: any;
        };
    }[];
}): string;
export const GOLDEN_FORMAT: "infinite-match-golden-vectors";
export const GOLDEN_VERSION: 1;
/** Inputs are stable identifiers; the fixture stores every derived value the rules must agree on. */
export const LEVEL_CASES: {
    name: string;
    level: number;
    mode: string;
    location: {
        timeZone: string;
        country: string;
        region: string;
    };
    nowMs: number;
}[];
/** Rules v6 adds blocker-stage levels (level % 8 === 2 from level 10, plus the boss at 50). */
export const BLOCKER_LEVEL_CASES: {
    name: string;
    level: number;
    mode: string;
    location: {
        timeZone: string;
        country: string;
        region: string;
    };
    nowMs: number;
}[];
/** Strings that exercise hashing edge cases: ASCII, a dash-separated key, and an astral character. */
export const HASH_CASES: string[];
/** Named seeds for the RNG stream test (first eight outputs each). */
export const RNG_SEEDS: number[];
export { generateLevel };
import { generateLevel } from './generator.js';
//# sourceMappingURL=golden-vectors.d.ts.map