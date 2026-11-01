/**
 * CRM campaign service.
 *
 * Provides player segmentation and targeted campaign management for retention
 * and monetization. Segments are computed from player data (spend, level,
 * recency, streak) and campaigns can target one or more segments with a
 * message and optional offer.
 *
 * All campaign state is kept in memory. In production this should be persisted
 * to a database. Campaign sends are best-effort: failures are logged and never
 * block the calling game flow.
 */
import { notifyPlayers } from '../push/push-service.js';
import { Logger } from '../../core/logger/index.js';
const logger = new Logger('CRMService');
/**
 * Player segment definitions. Each segment has an id, a label, and a `matches`
 * function that receives a player profile and returns true if the player belongs.
 */
const SEGMENTS = Object.freeze([
    {
        id: 'newbie',
        label: 'New players',
        description: 'Players below level 10 who have not made a purchase',
        matches: (profile) => (profile.level || 0) < 10 && profile.totalSpentUsd === 0,
    },
    {
        id: 'payer',
        label: 'Payers',
        description: 'Players who have made at least one purchase',
        matches: (profile) => profile.totalSpentUsd > 0,
    },
    {
        id: 'whale',
        label: 'Whales',
        description: 'Players who have spent $50 or more',
        matches: (profile) => profile.totalSpentUsd >= 50,
    },
    {
        id: 'nonpayer',
        label: 'Non-payers',
        description: 'Players at level 10+ who have never purchased',
        matches: (profile) => (profile.level || 0) >= 10 && profile.totalSpentUsd === 0,
    },
    {
        id: 'lapsed_7d',
        label: 'Lapsed 7+ days',
        description: 'Players who have not played in 7+ days',
        matches: (profile) => {
            const lastPlay = profile.lastPlay ? new Date(profile.lastPlay).getTime() : 0;
            if (!lastPlay)
                return false;
            const daysOffline = Math.floor((Date.now() - lastPlay) / (24 * 60 * 60 * 1000));
            return daysOffline >= 7;
        },
    },
    {
        id: 'lapsed_30d',
        label: 'Lapsed 30+ days',
        description: 'Players who have not played in 30+ days',
        matches: (profile) => {
            const lastPlay = profile.lastPlay ? new Date(profile.lastPlay).getTime() : 0;
            if (!lastPlay)
                return false;
            const daysOffline = Math.floor((Date.now() - lastPlay) / (24 * 60 * 60 * 1000));
            return daysOffline >= 30;
        },
    },
    {
        id: 'streak_keeper',
        label: 'Streak keepers',
        description: 'Players with a login streak of 7+ days',
        matches: (profile) => (profile.streak || 0) >= 7,
    },
    {
        id: 'vip',
        label: 'VIP players',
        description: 'Players with an active VIP entitlement',
        matches: (profile) => profile.hasVip === true,
    },
]);
/** Returns the segment definition for an id, or null. */
export function getSegment(segmentId) {
    return SEGMENTS.find((s) => s.id === segmentId) || null;
}
/** Returns all segment definitions. */
export function getAllSegments() {
    return SEGMENTS.map((s) => ({ id: s.id, label: s.label, description: s.description }));
}
/**
 * Computes which segments a player belongs to based on their profile.
 * Returns an array of segment ids.
 */
export function computeSegments(profile) {
    return SEGMENTS.filter((s) => s.matches(profile)).map((s) => s.id);
}
/**
 * Campaign state. In-memory for now.
 *
 * campaigns: Map<campaignId, { id, name, segmentIds, message, offer, createdAt, status, sends: [] }>
 * playerCampaigns: Map<playerId, Set<campaignId>> - which campaigns a player has received
 */
const campaigns = new Map();
const playerCampaigns = new Map();
let campaignIdCounter = 0;
/**
 * Creates a new campaign targeting one or more segments.
 * Returns { id, name, segmentIds, message, offer, createdAt, status }.
 */
export function createCampaign({ name, segmentIds, message, offer }) {
    if (!name || typeof name !== 'string') {
        throw new Error('campaign name is required');
    }
    if (!Array.isArray(segmentIds) || segmentIds.length === 0) {
        throw new Error('at least one segment id is required');
    }
    for (const sid of segmentIds) {
        if (!getSegment(sid)) {
            throw new Error(`unknown segment: ${sid}`);
        }
    }
    const id = `campaign_${++campaignIdCounter}`;
    const campaign = {
        id,
        name,
        segmentIds,
        message,
        offer: offer || null,
        createdAt: new Date().toISOString(),
        status: 'active',
        sends: [],
    };
    campaigns.set(id, campaign);
    logger.info('Campaign created', { id, name, segmentIds });
    return { ...campaign };
}
/** Returns a campaign by id, or null. */
export function getCampaign(campaignId) {
    return campaigns.get(campaignId) || null;
}
/** Returns all campaigns. */
export function getAllCampaigns() {
    return Array.from(campaigns.values()).map((c) => ({
        ...c,
        sends: c.sends.length,
    }));
}
/** Deactivates a campaign. */
export function deactivateCampaign(campaignId) {
    const campaign = campaigns.get(campaignId);
    if (!campaign)
        return false;
    campaign.status = 'inactive';
    return true;
}
/**
 * Evaluates which players should receive a campaign based on segment membership.
 * Receives a list of player profiles and returns the profiles that match.
 */
export function evaluateCampaign(campaignId, playerProfiles) {
    const campaign = campaigns.get(campaignId);
    if (!campaign || campaign.status !== 'active')
        return [];
    const segmentIds = new Set(campaign.segmentIds);
    return playerProfiles.filter((profile) => {
        const playerSegments = new Set(computeSegments(profile));
        for (const sid of segmentIds) {
            if (playerSegments.has(sid))
                return true;
        }
        return false;
    });
}
/**
 * Sends a campaign message to matching players via push notification.
 * Returns { successCount, failureCount, sentTo: [playerIds] }.
 * Skips players who have already received this campaign.
 */
export async function sendCampaign(campaignId, playerProfiles) {
    const campaign = campaigns.get(campaignId);
    if (!campaign || campaign.status !== 'active') {
        return { successCount: 0, failureCount: 0, sentTo: [], reason: 'campaign_not_active' };
    }
    const matching = evaluateCampaign(campaignId, playerProfiles);
    const userIds = [];
    for (const profile of matching) {
        const playerId = profile.playerId;
        if (!playerId)
            continue;
        // Skip if already received this campaign
        const received = playerCampaigns.get(playerId);
        if (received && received.has(campaignId))
            continue;
        userIds.push(playerId);
    }
    if (userIds.length === 0) {
        return { successCount: 0, failureCount: 0, sentTo: [], reason: 'no_matching_players' };
    }
    let successCount = 0;
    let failureCount = 0;
    for (const userId of userIds) {
        try {
            const data = {
                type: 'crm_campaign',
                campaignId,
                message: campaign.message,
                ...(campaign.offer ? { offer: campaign.offer } : {}),
            };
            const result = await notifyPlayers({
                userIds: [userId],
                title: campaign.name,
                body: campaign.message,
                data,
            });
            if (result.successCount > 0)
                successCount++;
            else
                failureCount++;
            // Mark as received
            let received = playerCampaigns.get(userId);
            if (!received) {
                received = new Set();
                playerCampaigns.set(userId, received);
            }
            received.add(campaignId);
            campaign.sends.push({
                playerId: userId,
                sentAt: new Date().toISOString(),
                success: result.successCount > 0,
            });
        }
        catch (error) {
            logger.warn(`CRM campaign send failed for ${userId}`, {
                error: error.message,
            });
            failureCount++;
        }
    }
    return { successCount, failureCount, sentTo: userIds };
}
/** Returns the campaigns a player has received. */
export function getPlayerCampaigns(playerId) {
    const received = playerCampaigns.get(playerId);
    return received ? Array.from(received) : [];
}
export default {
    getSegment,
    getAllSegments,
    computeSegments,
    createCampaign,
    getCampaign,
    getAllCampaigns,
    deactivateCampaign,
    evaluateCampaign,
    sendCampaign,
    getPlayerCampaigns,
};
//# sourceMappingURL=crm-service.js.map