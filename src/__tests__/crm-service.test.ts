import { describe, expect, test } from '@jest/globals';
import {
  getAllSegments,
  computeSegments,
  createCampaign,
  getCampaign,
  getAllCampaigns,
  deactivateCampaign,
  evaluateCampaign,
  sendCampaign,
  getPlayerCampaigns,
} from '../services/crm/crm-service.js';

describe('CRM service', () => {
  test('getAllSegments returns all segment definitions', () => {
    const segments = getAllSegments();
    expect(segments.length).toBeGreaterThan(0);
    const ids = segments.map((s) => s.id);
    expect(ids).toContain('newbie');
    expect(ids).toContain('payer');
    expect(ids).toContain('whale');
    expect(ids).toContain('lapsed_7d');
    expect(ids).toContain('vip');
    for (const seg of segments) {
      expect(seg).toHaveProperty('id');
      expect(seg).toHaveProperty('label');
      expect(seg).toHaveProperty('description');
    }
  });

  test('computeSegments: newbie player', () => {
    const segments = computeSegments({
      playerId: 'p1',
      level: 5,
      totalSpentUsd: 0,
    });
    expect(segments).toContain('newbie');
    expect(segments).not.toContain('payer');
    expect(segments).not.toContain('whale');
  });

  test('computeSegments: whale player', () => {
    const segments = computeSegments({
      playerId: 'p2',
      level: 50,
      totalSpentUsd: 100,
    });
    expect(segments).toContain('payer');
    expect(segments).toContain('whale');
    expect(segments).not.toContain('newbie');
  });

  test('computeSegments: lapsed player', () => {
    const lastPlay = Date.now() - 10 * 24 * 60 * 60 * 1000;
    const segments = computeSegments({
      playerId: 'p3',
      level: 20,
      totalSpentUsd: 0,
      lastPlay: new Date(lastPlay).toISOString(),
    });
    expect(segments).toContain('lapsed_7d');
    expect(segments).toContain('nonpayer');
  });

  test('computeSegments: VIP player', () => {
    const segments = computeSegments({
      playerId: 'p4',
      level: 30,
      totalSpentUsd: 5,
      hasVip: true,
    });
    expect(segments).toContain('vip');
    expect(segments).toContain('payer');
  });

  test('createCampaign and getCampaign', () => {
    const campaign = createCampaign({
      name: 'Welcome Back',
      segmentIds: ['lapsed_7d'],
      message: 'Come back and play!',
      offer: { sku: 'pack_comeback', discount: 0.5 },
    });
    expect(campaign.id).toMatch(/^campaign_\d+$/);
    expect(campaign.name).toBe('Welcome Back');
    expect(campaign.segmentIds).toEqual(['lapsed_7d']);
    expect(campaign.status).toBe('active');

    const fetched = getCampaign(campaign.id);
    expect(fetched).not.toBeNull();
    expect(fetched!.name).toBe('Welcome Back');
  });

  test('getAllCampaigns returns all campaigns', () => {
    const before = getAllCampaigns().length;
    createCampaign({ name: 'Campaign 1', segmentIds: ['newbie'], message: 'Hi newbie' });
    createCampaign({ name: 'Campaign 2', segmentIds: ['whale'], message: 'Hi whale' });
    const all = getAllCampaigns();
    expect(all.length).toBe(before + 2);
  });

  test('deactivateCampaign sets status to inactive', () => {
    const campaign = createCampaign({
      name: 'Temp',
      segmentIds: ['newbie'],
      message: 'Bye',
    });
    const ok = deactivateCampaign(campaign.id);
    expect(ok).toBe(true);
    const fetched = getCampaign(campaign.id);
    expect(fetched!.status).toBe('inactive');
  });

  test('evaluateCampaign returns matching players', () => {
    createCampaign({
      name: 'Lapsed Winback',
      segmentIds: ['lapsed_7d'],
      message: 'Come back!',
    });
    const players = [
      { playerId: 'p1', level: 5, totalSpentUsd: 0 },
      {
        playerId: 'p2',
        level: 20,
        totalSpentUsd: 0,
        lastPlay: new Date(Date.now() - 10 * 86400000).toISOString(),
      },
      { playerId: 'p3', level: 50, totalSpentUsd: 100 },
    ];
    const matching = evaluateCampaign('campaign_1', players);
    expect(matching.length).toBe(1);
    expect(matching[0].playerId).toBe('p2');
  });

  test('getPlayerCampaigns returns empty for player with no campaigns', () => {
    const received = getPlayerCampaigns('nonexistent_player');
    expect(received).toEqual([]);
  });
});
