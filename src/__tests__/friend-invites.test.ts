import { beforeEach, describe, expect, test } from '@jest/globals';
import {
  generateInvite,
  validateInviteCode,
  useInviteCode,
  getInvitedBy,
  getPlayerInvites,
  reachMilestone,
  getInviteStats,
  resetForTesting,
} from '../services/social/friend-invites/friend-invites.js';

describe('friend invites', () => {
  const now = Date.now();

  beforeEach(() => {
    resetForTesting();
  });

  test('generateInvite creates a valid invite code', () => {
    const result = generateInvite('inviter_1', now);
    expect(result.code).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);
    expect(result.inviteUrl).toContain(result.code);
    expect(result.expiresAt).toBeGreaterThan(now);
  });

  test('validateInviteCode returns valid for unused code', () => {
    const { code } = generateInvite('inviter_1', now);
    const result = validateInviteCode(code, now);
    expect(result.valid).toBe(true);
    expect(result.invite.code).toBe(code);
  });

  test('validateInviteCode returns invalid for unknown code', () => {
    const result = validateInviteCode('XXXXXXXX', now);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('invite_not_found');
  });

  test('useInviteCode records the invitee', () => {
    const { code } = generateInvite('inviter_1', now);
    const result = useInviteCode(code, 'invitee_1', now);
    expect(result.success).toBe(true);
    expect(result.inviterId).toBe('inviter_1');
    expect(getInvitedBy('invitee_1')).toBe(code);
  });

  test('useInviteCode rejects self-invite', () => {
    const { code } = generateInvite('inviter_1', now);
    const result = useInviteCode(code, 'inviter_1', now);
    expect(result.success).toBe(false);
    expect(result.reason).toBe('self_invite');
  });

  test('useInviteCode rejects already used code', () => {
    const { code } = generateInvite('inviter_1', now);
    useInviteCode(code, 'invitee_1', now);
    const result = useInviteCode(code, 'invitee_2', now);
    expect(result.success).toBe(false);
    expect(result.reason).toBe('invite_already_used');
  });

  test('useInviteCode rejects already invited player', () => {
    const { code: code1 } = generateInvite('inviter_1', now);
    const { code: code2 } = generateInvite('inviter_2', now);
    useInviteCode(code1, 'invitee_1', now);
    const result = useInviteCode(code2, 'invitee_1', now);
    expect(result.success).toBe(false);
    expect(result.reason).toBe('already_invited');
  });

  test('getPlayerInvites returns invites for a player', () => {
    generateInvite('inviter_1', now);
    generateInvite('inviter_1', now);
    generateInvite('inviter_2', now);
    const invites = getPlayerInvites('inviter_1');
    expect(invites.length).toBe(2);
  });

  test('getInviteStats returns correct counts', () => {
    const { code: code1 } = generateInvite('inviter_1', now);
    const { code: code2 } = generateInvite('inviter_1', now);
    useInviteCode(code1, 'invitee_1', now);
    // code2 expires
    const stats = getInviteStats('inviter_1');
    expect(stats.total).toBe(2);
    expect(stats.used).toBe(1);
    expect(stats.pending).toBe(1);
  });

  test('reachMilestone grants rewards', () => {
    const { code } = generateInvite('inviter_1', now);
    useInviteCode(code, 'invitee_1', now);
    const result = reachMilestone(code, 'first_level_win', now);
    expect(result.success).toBe(true);
    expect(result.inviterReward.coins).toBe(250);
    expect(result.inviteeReward.coins).toBe(500);
  });

  test('reachMilestone rejects unknown code', () => {
    const result = reachMilestone('XXXXXXXX', 'first_level_win', now);
    expect(result.success).toBe(false);
    expect(result.reason).toBe('invite_not_found');
  });
});
