# Hall Lanterns: web weekly event operations

This is a **small free event**, not a prize tournament. The first published UTC windows in `config/liveops.json` are 2026-10-05–12, 12–19 and 19–26. Three **new, unchanged-reward** windows continue on 2026-10-26–11-02, 11-02–09 and 11-09–16; the original three IDs, windows and milestone definitions are frozen. **Publish another validated week before November 16** or the event intentionally disappears. Each Monday 00:00 UTC begins a new seven-day event; the end is exclusive. The player's browser shows the end in their local time and explicitly names the UTC boundary. Progress and unclaimed rewards expire at the end; there is no late grant. Do not call an empty schema a live event.

## Publishing and preview

1. Add the next object in `weeklyEvents` in `config/liveops.json` with a **new** 3–40-character lowercase ID. Do not reuse or edit an already-published ID, dates, milestones or price. Set `start` to Monday 00:00:00Z and `end` exactly seven days later; no overlaps. Limit to 12 windows in the published file, three increasing goals (1–20) and at most 100 coins per milestone. Keep the description honest about replay requirements. The config parser rejects the entire live-ops file if any weekly entry is invalid (existing deals are then unavailable too).
2. Preview current week, the next boundary, and the end of the planned schedule **before rollout**:
   ```sh
   node scripts/preview-weekly-event.mjs
   node scripts/preview-weekly-event.mjs 2026-10-26T00:00:00Z
   node scripts/preview-weekly-event.mjs 2026-11-02T00:00:00Z
   node scripts/preview-weekly-event.mjs 2026-11-09T00:00:00Z
   node scripts/preview-weekly-event.mjs 2026-11-16T00:00:00Z # expected to exit nonzero until another week is published
   npm test -- --runInBand src/__tests__/weekly-event.test.ts src/__tests__/store-billing.test.ts
   ```
   `LIVE_OPS_CONFIG=/path/to/staging.json` lets the preview read a candidate without changing the checked-in file. The script validates **the weekly section**; Jest validates the **whole** live-ops config. An empty preview at the final date exits nonzero to flag a publishing gap (**November 16 currently fails until another week is published**). Previewing never updates player progress or coins.
3. Deploy/restart the web server so its cached live-ops config is reloaded, then verify `GET /api/live-ops/weekly/preview` (public), `GET /api/live-ops/weekly` (signed in), and the web **Explore → Weekly event** / Community → Events tab. Check a fresh guest can still play; make a verified classic/daily win with a test account and confirm only one increment and one claim. Test the next Monday rollover with staging's config/clock before promoting. Keep receipts/logs of the published schedule and sample checks. Never modify the server clock or player balances in production to simulate a window.

**Longer-term calendar limit:** the validator accepts at most 12 windows; six are now present. Before that limit is reached, define an explicit expiry/retention policy for removing old IDs: removing a week also prevents read-only duplicate acknowledgments for its claims, and the next verified win prunes its old progress from the player record. Do not silently drop published history while relying on those retry guarantees. No automatic publishing or production rollover has been validated by this schedule change.

## Shutdown and recovery

- Emergency switch: set `WEEKLY_EVENT_DISABLED=1` and restart every web server. The public preview and signed-in status then show it paused, verified wins stop counting, and new claims are rejected. Already-claimed retries remain read-only acknowledgments; there is no additional grant. Remove the flag and restart only after fixing the problem. **Do not** delete an active ID to disable it silently.
- A claim checks the active server window and available progress, then marks the milestone and grants its modest coins in **one player-locked economy save**. If a response is lost, the same claim returns `duplicate: true` with no second grant, including after the window closes while the ID remains published. A full coin wallet returns `weekly_wallet_full` with no claim; spend coins and retry before expiry.
- If a win or claim fails, consult server logs and `GET /api/live-ops/weekly` before retrying. A server failure during a completion can still leave ordinary win rewards in an uncertain state: the existing win pipeline saves attempt consumption before the rest of its reward operations. Do not manufacture progress or issue manual compensation without examining that attempt and its economy record.
- Production requires `ECONOMY_STORE=mongo`; the per-player lock is process-local, **not** a multi-replica distributed transaction. Keep this event's grants low-stakes and operate a single writer per player or add distributed concurrency control and fault-injection before scaling to multiple replicas or any consequential prizes. The public replay witness and client-reported random booster locations do not prove human play. Booster-assisted wins can count here and earn ordinary coins, but remain **unranked** on competitive boards. Unverified legacy/timed/endless payouts do not count.

## Review after each window

Record actual starts/ends, status/claim success and duplicate/error counts, total coins granted, event-discovery task completion and support reports. Compare first-session understanding/return with the pre-event baseline and physical phone/screen-reader checks. Do not infer retention or fair play from API tests or win counts alone.
