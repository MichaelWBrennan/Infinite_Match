# Web session stability beta — offline evidence kit

**Ready to run, not run. No real beta sessions were gathered in this repository.** This is a private operator/facilitator study of the [proposed stability gate](PLAYER_EXPERIENCE.md#measurable-release-gates) for the playable web game: at least 1,000 consented sessions, at least 99.5% with no crash observed. It is **not** browser crash telemetry, an in-game prompt, a new endpoint, or proof of a production crash-free-session rate. The opt-in [D1/D7 return study](WEB_RETURN_STUDY.md) only measures app-open days; it does not provide a session denominator. Error/rejection events in a running page do not detect tab/process termination, and a missing report is **unknown**, not evidence of a healthy session.

## Before recruiting

1. Decide and preregister a build SHA, device/browser/access-mode matrix, study start/stop dates, session-start and end rules, evidence sources, exclusions, and an owner to stop/rollback when a blocker occurs. A *session* starts when the playable web game is usable and ends when a consenting participant leaves normally or a confirmed crash interrupts it. Count repeated sessions as separate **sessions**, not independent people; also review coverage and clustering outside this file. Do not silently exclude sessions that lose connection, crash before an event beacon, or never report an end. The cohort and raw diagnostic log need separate secure handling. A recorded `no_crash_observed` requires a facilitator who saw the session end normally or a trusted device diagnostic with verified start **and** end coverage; an ordinary `pagehide`, successful API request, error-free log, or client-only heartbeat is insufficient.
2. Obtain informed consent for this **separate offline stability study**, not ads or return-day consent. Explain the random session code, broad device/browser/access categories, outcome and optional client-error flag; allow withdrawal. Keep the consent/code mapping and detailed crash/QA investigation logs *separately* in protected storage. Never enter account IDs, contact details, IP, location, device serial, exact timestamp, raw seed, board, exception message, stack or free text into this JSON. Delete a withdrawn participant's sessions before aggregating. Define a short retention/deletion period and never commit raw input or consent records. This file is not suitable for automatic collection from the user's browser.
3. Copy `docs/web-stability-template.json` to a private, Git-ignored location such as `var/studies/stability.json`. Replace `build` with the tested 8–40-character lowercase hex commit SHA, then add only consented, started sessions with codes generated independently of account IDs. The blank template intentionally fails the sample-size gate and its placeholder build fails schema validation.

## Record a session

Each session entry has **exactly** these seven keys. Unknown fields and repeated codes are rejected, but the evaluator cannot prove that a code represents an actual consenting session, real device, or unique start. Never make up an outcome to fill a missing entry.

| Field | Allowed values | Recording rule |
| --- | --- | --- |
| `sessionCode` | `s-` plus 8–20 lowercase letters/digits/hyphens | Random code per session, never the account or participant ID. Stored only in the private input; not in reports. |
| `device` | `small_android`, `mid_android`, `small_iphone`, `notched_iphone`, `tablet`, `desktop` | Coarse physical form factor, not model/serial. Report Android/iPhone coverage separately. |
| `browser` | `chrome`, `safari`, `firefox`, `edge`, `other` | Broad browser family only. |
| `accessMode` | `standard`, `large_text`, `reduced_motion`, `named_board`, `screen_reader`, `not_disclosed` | Usage setting, not a diagnosis; do not infer access quality from a passing aggregate. |
| `evidence` | `facilitator`, `device_diagnostic`, `client_only`, `unknown` | Only the first two can support a conclusive outcome. A client-only error-free log is not proof of no crash. |
| `outcome` | `no_crash_observed`, `confirmed_crash`, `unknown` | Confirmed crash = observed tab/app termination or unrecoverable hang requiring restart, corroborated by facilitator/device diagnostics. `unknown` = missing, disputed or unverified end (including lost follow-up). Do not code ordinary network loss or a recoverable script error as a browser crash. |
| `clientErrorObserved` | `true`, `false`, `null` | An observed uncaught script error/rejection is a separate reliability signal; `null` means not checked. `false` never establishes crash-free survival. Do not save the error message/stack. |

The evaluator rejects a conclusive outcome with `client_only`/`unknown` evidence. It limits input to 10,000 sessions / 2 MiB, one build, strict enums and ranges; its report never includes individual codes or rows. Overall outcome/error counts are suppressed below 20 sessions. Dimension breakdowns for device, browser, access mode and evidence are shown **only when every present stratum has at least 20 sessions**; if a smaller stratum exists, the entire dimension is hidden so subtraction from overall totals cannot reveal its crashes. The number of suppressed strata is reported. This is a disclosure limit, not adequate statistical power or device/access certification. The raw input still has pseudonymous codes; protect it.

## Evaluate without uploading data

```sh
node scripts/evaluate-web-stability.mjs var/studies/stability.json
node scripts/evaluate-web-stability.mjs var/studies/stability.json --json
```

Exit **0** means the submitted rows have ≥1,000 sessions, **zero unknown outcomes**, and ≥99.5% coded `no_crash_observed`. Exit **2** means valid but insufficient, incomplete or below threshold; **1** means invalid input. Unknowns remain in the conservative denominator, rather than being silently counted healthy or excluded. The report includes confirmed crashes, missing outcomes, client errors (separate from crashes), coarse coverage and an *approximate* 95% Wilson interval only when all outcomes are known. That interval assumes independent, representative sessions; repeat players, missing diagnostics and recruitment bias weaken or invalidate it. A point-rate pass is **not** a confident launch decision: inspect that interval, every confirmed crash, unknown coverage, Android/iPhone/access-mode representation, background/reconnect and payment failures, and the other [P0/P1 gates](COMPETITIVE_STRATEGY.md#ranked-roadmap-build-in-this-order-gates-before-launch). Do not claim 99.5% of all players or enable paid-difficulty tuning or consequential prizes from a green local report.
