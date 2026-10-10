# Hall Lanterns: web weekly event operations

This is a **small free event**, not a prize tournament. The first published UTC windows in `config/liveops.json` are 2026-10-05–12, 12–19 and 19–26. Three **new, unchanged-reward** windows continue on 2026-10-26–11-02, 11-02–09 and 11-09–16; the original three IDs, windows and milestone definitions are frozen. **Publish another validated week before November 16** or the event intentionally disappears. Each Monday 00:00 UTC begins a new seven-day event; the end is exclusive. The player's browser shows the end in their local time and explicitly names the UTC boundary. Progress and unclaimed rewards expire at the end; there is no late grant. Do not call an empty schema a live event.

## Publishing and preview

1. Add the next object in `weeklyEvents` in `config/liveops.json` with a **new** 3–40-character lowercase ID. Never reuse or edit a published ID, dates, milestones, description or name. Set `start` to Monday 00:00:00Z and `end` exactly seven days later; no overlaps. Limit to 12 scheduled windows, three increasing goals (1–20) and at most 100 coins per milestone. Keep the description honest about replay requirements. The config parser rejects the entire live-ops file if any weekly entry is invalid (existing deals are then unavailable too).
2. Preview current week, the next boundary, and the end of the planned schedule **before rollout**:
   ```sh
   node scripts/preview-weekly-event.mjs
   node scripts/preview-weekly-event.mjs 2026-10-26T00:00:00Z
   node scripts/preview-weekly-event.mjs 2026-11-02T00:00:00Z
   node scripts/preview-weekly-event.mjs 2026-11-09T00:00:00Z
   node scripts/preview-weekly-event.mjs 2026-11-16T00:00:00Z # expected to exit nonzero until another week is published
   npm test -- --runInBand src/__tests__/weekly-event.test.ts src/__tests__/store-billing.test.ts
   ```
   `LIVE_OPS_CONFIG=/path/to/staging.json` lets the preview read a candidate without changing the checked-in file. The script validates **the weekly schedule and archive** (and optionally compares a prior snapshot); Jest validates the **whole** live-ops config. An empty preview at the final date exits nonzero to flag a publishing gap (**November 16 currently fails until another week is published**). Previewing never updates player progress or coins.
3. Deploy/restart the web server so its cached live-ops config is reloaded, then verify `GET /api/live-ops/weekly/preview` (public), `GET /api/live-ops/weekly` (signed in), and the web **Explore → Weekly event** / Community → Events tab. Check a fresh guest can still play; make a verified classic/daily win with a test account and confirm only one increment and one claim. Test the next Monday rollover with staging's config/clock before promoting. Keep receipts/logs of the published schedule and sample checks. Never modify the server clock or player balances in production to simulate a window.

**Rotating the bounded calendar (not yet done to the six seeded weeks):** keep at most 12 entries in `weeklyEvents`. Once a week has actually ended, move its **unchanged** definition into `weeklyEventArchive` (at most 52 entries) in the same candidate file as the new scheduled week. Do not put a future/active week in the archive; the server rejects it. Archive entries are not advertised, never accrue progress and cannot grant coins. A previously claimed milestone can still return a read-only `duplicate: true` acknowledgment while its archived definition and player record remain. Unclaimed milestones close at the end as before. The next verified win retains archived player records and prunes IDs no longer in either list.

Before publishing a candidate, **save the actual currently deployed live-ops file** and compare it to the candidate using the read-only preview:

```sh
WEEKLY_EVENT_PREVIOUS_CONFIG=/path/to/deployed-liveops.json LIVE_OPS_CONFIG=/path/to/candidate-liveops.json node scripts/preview-weekly-event.mjs 2026-11-16T00:00:00Z
```

The comparison rejects edits to published weeks, missing scheduled weeks, early archive moves, reactivated archived IDs, invented archived history and dropping an archive entry less than **35 full days after its UTC end**. An older archived entry may be retired when the 52-entry limit requires it; after it is removed, retries for that ID return `weekly_event_not_found`, and its player record is pruned at the next verified win. Keep removed definitions in the deployment log for support. This 35-day floor is an **operator publication check**, not server-enforced history: it can be bypassed by deploying a file without comparing it to the actual prior deployed snapshot. The server still rejects invalid/future archives but cannot reconstruct lost history after a restart. No automatic publication, live multi-server rotation or production rollover has been validated.

## Shutdown and recovery

- Emergency switch: set `WEEKLY_EVENT_DISABLED=1` and restart every web server. The public preview and signed-in status then show it paused, verified wins stop counting, and new claims are rejected. Already-claimed retries remain read-only acknowledgments; there is no additional grant. Remove the flag and restart only after fixing the problem. **Do not** delete an active ID to disable it silently.
- A claim checks the active server window and available progress, then marks the milestone and grants its modest coins in **one player-locked economy save**. If a response is lost, the same claim returns `duplicate: true` with no second grant, including after the window closes while its unchanged ID/definition remains scheduled or archived. A full coin wallet returns `weekly_wallet_full` with no claim; spend coins and retry before expiry.
- If a win or claim fails, consult server logs and `GET /api/live-ops/weekly` before retrying. A server failure during a completion can still leave ordinary win rewards in an uncertain state: the existing win pipeline saves attempt consumption before the rest of its reward operations. Do not manufacture progress or issue manual compensation without examining that attempt and its economy record.
- Production requires `ECONOMY_STORE=mongo`; the per-player lock is process-local, **not** a multi-replica distributed transaction. Keep this event's grants low-stakes and operate a single writer per player or add distributed concurrency control and fault-injection before scaling to multiple replicas or any consequential prizes. The public replay witness and client-reported random booster locations do not prove human play. Booster-assisted wins can count here and earn ordinary coins, but remain **unranked** on competitive boards. Unverified legacy/timed/endless payouts do not count.

## Review after each window

Record actual starts/ends, status/claim success and duplicate/error counts, total coins granted, event-discovery task completion and support reports. Compare first-session understanding/return with the pre-event baseline and physical phone/screen-reader checks. Do not infer retention or fair play from API tests or win counts alone.
