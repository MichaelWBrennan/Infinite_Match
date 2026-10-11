/* Personal score challenge (live ops L4): text for the card in Explore and the Community events tab.
 * Pure functions that return plain strings. Callers insert them with textContent, never innerHTML.
 * Times: the server owns the window. Countdowns use a clock corrected to server time, so a phone with a
 * wrong clock still shows the right time left. The UTC boundary is always printed next to the local time. */
(function (root) {
    'use strict';

    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const DAY = 86400000;
    const HOUR = 3600000;
    const MINUTE = 60000;

    const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

    /** "17 Oct 2026, 00:00 UTC" */
    function utcText(ms) {
        const d = new Date(ms);
        const hh = String(d.getUTCHours()).padStart(2, '0');
        const mm = String(d.getUTCMinutes()).padStart(2, '0');
        return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${hh}:${mm} UTC`;
    }

    /** Default local time text. Tests inject their own formatter. */
    function localText(ms) {
        return new Date(ms).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    }

    /** "2 days 3 hours", "3 hours 5 minutes", "5 minutes", "under a minute". */
    function countdownText(ms) {
        if (!(ms > 0)) return 'under a minute';
        const days = Math.floor(ms / DAY);
        const hours = Math.floor((ms % DAY) / HOUR);
        const minutes = Math.floor((ms % HOUR) / MINUTE);
        if (days > 0) return hours > 0 ? `${plural(days, 'day')} ${plural(hours, 'hour')}` : plural(days, 'day');
        if (hours > 0) return minutes > 0 ? `${plural(hours, 'hour')} ${plural(minutes, 'minute')}` : plural(hours, 'hour');
        if (minutes > 0) return plural(minutes, 'minute');
        return 'under a minute';
    }

    /** Offset that turns the phone clock into server time. Use with clockNow(). */
    function clockOffset(serverNow, localNow = Date.now()) {
        const server = Date.parse(serverNow);
        return Number.isFinite(server) ? server - localNow : 0;
    }

    function clockNow(offset = 0) {
        return Date.now() + offset;
    }

    /** Lines describing when the window is open, from the server view. */
    function windowLines(view, nowMs, local = localText) {
        const challenge = view.challenge;
        const start = Date.parse(challenge.startsAt);
        const end = Date.parse(challenge.endsAt);
        if (challenge.status === 'active') {
            return [
                `Open now. Ends in ${countdownText(end - nowMs)}.`,
                `Ends ${local(end)} your time (${utcText(end)}).`,
                `Runs ${utcText(start)} to ${utcText(end)}. Claims after the end are not granted.`,
            ];
        }
        return [
            `Starts in ${countdownText(start - nowMs)}.`,
            `Starts ${local(start)} your time (${utcText(start)}).`,
        ];
    }

    /** "1200 of 1000 points" or, for a guest, the target only. */
    function progressText(challenge) {
        if (challenge.total === null || challenge.total === undefined) {
            return `Sign in to track your points. Target ${challenge.target} points.`;
        }
        return `${challenge.total} of ${challenge.target} points.`;
    }

    /** One accessible sentence for one tier. */
    function tierText(tier, total) {
        const base = `${tier.threshold} points: ${tier.coins} coins`;
        if (tier.claimed) return `${base}, claimed.`;
        if (tier.canClaim) return `${base}, ready to claim.`;
        if (tier.earned) return `${base}, earned. Claiming is closed right now.`;
        if (total === null || total === undefined) return `${base}.`;
        return `${base}, ${Math.max(0, tier.threshold - total)} more points to unlock.`;
    }

    /** The text for the whole card, in reading order. Empty when nothing is scheduled. */
    function cardLines(view, nowMs, local = localText) {
        if (view.disabled) return ['The personal score challenge is paused. Saved points are kept.'];
        const challenge = view.challenge;
        if (!challenge) return ['No personal score challenge is scheduled. Check back soon.'];
        const lines = [`Personal score challenge: ${challenge.name}.`, ...windowLines(view, nowMs, local), progressText(challenge)];
        if (challenge.total !== null && challenge.total !== undefined) {
            const ready = challenge.tiers.filter((t) => t.canClaim).length;
            if (ready > 0) lines.push(`${plural(ready, 'tier')} ready to claim.`);
        }
        return lines;
    }

    /** Fetches the public preview, or the signed-in progress when a token is given. */
    async function fetchView(token, fetchImpl = root.fetch) {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const url = token ? '/api/live-ops/score-challenge' : '/api/live-ops/score-challenge/preview';
        const res = await fetchImpl(url, { headers });
        const data = await res.json().catch(() => ({}));
        return { ok: res.ok && data.success !== false, data };
    }

    const api = Object.freeze({
        utcText, localText, countdownText, clockOffset, clockNow, windowLines,
        progressText, tierText, cardLines, fetchView,
    });
    root.ScoreChallengeCard = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
