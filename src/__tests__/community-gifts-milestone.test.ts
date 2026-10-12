// Live ops S5: the friend "Send energy" control and the guild milestone block in script.js. The
// controller is large, so the new methods are extracted from the source and run against stubs.
import { describe, expect, test } from '@jest/globals';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const script = fs.readFileSync(path.resolve('script.js'), 'utf8');

function methods() {
  const gift = script.slice(script.indexOf('    async sendEnergyGift('), script.indexOf('    // Guild milestone (S3)'));
  const milestone = script.slice(script.indexOf('    milestoneNodes(m) {'), script.indexOf('    async loadCommunityGuild(show) {'));
  // Object-literal members need commas between them; the source separates them with blank lines.
  const members = [gift, milestone.replace('\n\n    async claimGuildMilestone', ',\n\n    async claimGuildMilestone')].join(',');
  // The real error mapping from script.js, so the messages tested are the ones players see.
  const errors = script.slice(script.indexOf('    communityError(data) {'), script.indexOf('    // Runs a server action'));
  const document = { createElement: (tag: string) => ({ tag, attrs: {}, setAttribute(k: string, v: string) { this.attrs[k] = v; } }) };
  return vm.runInNewContext(`({${[members, errors].join(',')}})`, { crypto: webcrypto, globalThis: {}, document }) as any;
}

function harness(replies: Array<() => any>) {
  const calls: Array<{ url: string; body: any }> = [];
  const tabs: string[] = [];
  const ctx: any = {
    communityFlash: null,
    communityRequest: async (url: string, options: any = {}) => {
      calls.push({ url, body: options.body ? JSON.parse(options.body) : undefined });
      return replies.shift()!();
    },
    communityError: (data: any) => methods().communityError(data),
    showCommunityTab: (tab: string) => tabs.push(tab),
  };
  return { ctx, calls, tabs };
}

describe('friend energy gifts on the community screen (S5)', () => {
  test('a gift to a friend is sent once with a well-formed gift id, and reports the energy credited', async () => {
    const m = methods();
    const h = harness([() => ({ ok: true, data: { success: true, result: { credited: 1 } } })]);
    await m.sendEnergyGift.call(h.ctx, 'bob');
    expect(h.calls).toHaveLength(1);
    expect(h.calls[0].url).toBe('/api/social/gifts/energy');
    expect(h.calls[0].body.receiverId).toBe('bob');
    expect(h.calls[0].body.giftId).toMatch(/^[A-Za-z0-9_-]{8,64}$/);
    expect(h.ctx.communityFlash).toBe('Energy sent.');
    expect(h.tabs).toEqual(['friends']);
  });

  test('a retry after a dropped connection keeps the same gift id, so it cannot send twice', async () => {
    const m = methods();
    const h = harness([
      () => { throw new TypeError('Failed to fetch'); },
      () => ({ ok: true, data: { success: true, result: { credited: 1, duplicate: true } } }),
    ]);
    await m.sendEnergyGift.call(h.ctx, 'bob');
    expect(h.ctx.communityFlash).toMatch(/will not send twice/);
    await m.sendEnergyGift.call(h.ctx, 'bob');
    expect(h.calls).toHaveLength(2);
    expect(h.calls[1].body.giftId).toBe(h.calls[0].body.giftId);
    expect(h.ctx.communityFlash).toBe('Energy sent.');
  });

  test('after a server answer, the next tap is a new gift', async () => {
    const m = methods();
    const h = harness([
      () => ({ ok: true, data: { success: true, result: { credited: 1 } } }),
      () => ({ ok: true, data: { success: true, result: { credited: 1 } } }),
    ]);
    await m.sendEnergyGift.call(h.ctx, 'bob');
    await m.sendEnergyGift.call(h.ctx, 'bob');
    expect(h.calls[1].body.giftId).not.toBe(h.calls[0].body.giftId);
  });

  test('a refused gift shows the plain-language reason', async () => {
    const m = methods();
    const h = harness([() => ({ ok: false, data: { success: false, error: 'not_friends' } })]);
    await m.sendEnergyGift.call(h.ctx, 'stranger');
    expect(h.ctx.communityFlash).toBe('Not sent: you can only send energy to friends.');
  });

  test('a full receiver is told the gift was recorded but added nothing', async () => {
    const m = methods();
    const h = harness([() => ({ ok: true, data: { success: true, result: { credited: 0 } } })]);
    await m.sendEnergyGift.call(h.ctx, 'bob');
    expect(h.ctx.communityFlash).toBe('Gift recorded. Their energy is already full.');
  });
});

describe('guild milestone block on the community screen (S5)', () => {
  const block = (m: any) => {
    const el = (tag: string, text = '') => ({ tag, text, attrs: {}, setAttribute(k: string, v: string) { this.attrs[k] = v; } });
    const ctx = {
      communityEl: (tag: string, text: string) => el(tag, text),
      communityNote: (text: string) => el('p', text),
      communityButton: (label: string) => el('button', label),
      claimGuildMilestone: () => {},
    };
    const nodes = methods().milestoneNodes.call(ctx, m);
    return nodes.map((n: any) => n.text || n.tag);
  };

  test('shows progress, and a claim button only when the member can claim', () => {
    const base = { goal: 50, count: 50, rewardCoins: 25, claimed: false, canClaim: true, reached: true, contributed: 3 };
    expect(block(base)).toContain('Claim 25 coins');
    expect(block({ ...base, claimed: true, canClaim: false })).not.toContain('Claim 25 coins');
    expect(block({ ...base, claimed: true, canClaim: false }).join(' ')).toContain('You claimed this week');
    expect(block({ ...base, count: 12, reached: false, canClaim: false, contributed: 0 }).join(' ')).toContain('12 of 50 verified wins');
  });

  test('a claim refused by the server says why in plain language', async () => {
    const m = methods();
    const h = harness([() => ({ ok: false, data: { success: false, error: 'no_milestone_contribution' } })]);
    await m.claimGuildMilestone.call(h.ctx);
    expect(h.calls[0]).toMatchObject({ url: '/api/social/milestone/claim' });
    expect(h.ctx.communityFlash).toBe('Not claimed: win a classic or daily level first.');
  });
});
