/** Returns the segment definition for an id, or null. */
export function getSegment(segmentId: any): {
    id: string;
    label: string;
    description: string;
    matches: (profile: any) => boolean;
} | null;
/** Returns all segment definitions. */
export function getAllSegments(): {
    id: string;
    label: string;
    description: string;
}[];
/**
 * Computes which segments a player belongs to based on their profile.
 * Returns an array of segment ids.
 */
export function computeSegments(profile: any): string[];
/**
 * Creates a new campaign targeting one or more segments.
 * Returns { id, name, segmentIds, message, offer, createdAt, status }.
 */
export function createCampaign({ name, segmentIds, message, offer }: {
    name: any;
    segmentIds: any;
    message: any;
    offer: any;
}): {
    id: string;
    name: string;
    segmentIds: any[];
    message: any;
    offer: any;
    createdAt: string;
    status: string;
    sends: never[];
};
/** Returns a campaign by id, or null. */
export function getCampaign(campaignId: any): any;
/** Returns all campaigns. */
export function getAllCampaigns(): any[];
/** Deactivates a campaign. */
export function deactivateCampaign(campaignId: any): boolean;
/**
 * Evaluates which players should receive a campaign based on segment membership.
 * Receives a list of player profiles and returns the profiles that match.
 */
export function evaluateCampaign(campaignId: any, playerProfiles: any): any;
/**
 * Sends a campaign message to matching players via push notification.
 * Returns { successCount, failureCount, sentTo: [playerIds] }.
 * Skips players who have already received this campaign.
 */
export function sendCampaign(campaignId: any, playerProfiles: any): Promise<{
    successCount: number;
    failureCount: number;
    sentTo: never[];
    reason: string;
} | {
    successCount: number;
    failureCount: number;
    sentTo: any[];
    reason?: never;
}>;
/** Returns the campaigns a player has received. */
export function getPlayerCampaigns(playerId: any): any[];
declare namespace _default {
    export { getSegment };
    export { getAllSegments };
    export { computeSegments };
    export { createCampaign };
    export { getCampaign };
    export { getAllCampaigns };
    export { deactivateCampaign };
    export { evaluateCampaign };
    export { sendCampaign };
    export { getPlayerCampaigns };
}
export default _default;
//# sourceMappingURL=crm-service.d.ts.map