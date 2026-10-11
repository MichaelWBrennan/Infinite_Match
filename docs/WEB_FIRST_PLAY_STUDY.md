# Web first-play and loss-fairness pilot — operator study kit

**Status: ready to conduct, not conducted.** This is an offline, observed usability study for the playable Phaser web game, not a tracker, in-game prompt, retention measurement or a release certification. No player data is sent to a new endpoint. A human facilitator must recruit consenting participants, observe real phones, and verify that each row is a different person. The evaluator cannot establish whether submitted rows describe real people. Do not upload raw study files or consent records to GitHub.

## Before a participant arrives

1. Record the exact web build SHA and write down a study hypothesis, participant recruitment/exclusion rules, device/network matrix, seed/board-variant coverage, pass thresholds and stop/rollback owner **before** seeing outcomes. The thresholds below are the existing [proposed player-experience gates](PLAYER_EXPERIENCE.md#measurable-release-gates), not statistical power or a market comparison.
2. Use 20+ **first-time phone players** to test learning; obtain a separate or overlapping cohort of 30+ people who actually reach a loss and answer a short-session fairness/enjoyment question. Thirty total sign-ups will not necessarily produce thirty observed losses. Offer accessible participation without requiring anyone to disclose a diagnosis. Include small Android/iPhone and different input/access modes. Record phone model/build/network and screen-reader/zoom issues in a **separate access/QA log**; never put free text or personal details in this file.
3. Obtain informed, revocable study consent separately. Explain that this file uses randomly assigned participant codes, a coarse device/access category, and binary/1–5 answers; it is not automatically collected by the game. Never enter account IDs, IP, precise location, raw seeds, contact details, disability diagnoses, or play transcripts. A study facilitator can keep a separate consent/code mapping securely for withdrawal, but **not** in the study JSON or repository. Remove a participant's row on withdrawal. Decide a local retention/deletion date before recruitment (suggest at most 30 days after analysis); aggregate only when strata have at least five participants.
4. Copy `docs/player-study-template.json` into a private ignored location such as `var/studies/pilot.json`. Replace `build` with the tested 8–40 character hexadecimal Git commit SHA. Keep `sessions` empty until observed visits occur. The template intentionally fails validation until the build is filled in.

## One observation per participant

Start the timer when the **interactable board** is displayed; do not count loading animation as play. Do not coach or offer a hint before the first-move task. Record the first independently observed valid match/activation as integer `firstMoveSeconds` (0–300). A move after 30 seconds is recorded but does **not** meet the quick-learning gate; use `null` if no valid move is observed before this task ends. If someone was coached or used a hint, set `coachedBeforeMove: true` and neither the move nor a goal description counts toward **unassisted** learning. Ask the participant to describe the current goal in their own words without leading; the facilitator codes `goalExplained: true/false`. `null` means the question was not asked and blocks a complete first-play result. Do not record their words in JSON.

Let them complete a short session. After a **real observed loss**, ask whether that loss was understandable/fair (`lossFair: true/false`), and for enjoyment on an anchored 1–5 scale (1 not enjoyable, 5 very enjoyable). Non-loss sessions set `lossFair: null`; unasked enjoyment is `null`, never silently counted as a positive. `outcome` is one of `won`, `lost`, `quit`, `unfinished`. A participant may stop at any time. A difficult or frustrating session is evidence, not a reason to edit an answer.

Each entry has **exactly** these keys (unknown keys or duplicate codes are rejected):

| Field | Accepted values | Notes |
| --- | --- | --- |
| `participantCode` | Random `p-` plus 4–16 lowercase letters/digits/hyphens | One code per person; **not** a player/account ID or name. Never published by evaluator. |
| `device` | `small_android`, `mid_android`, `small_iphone`, `notched_iphone`, `tablet`, `desktop` | Only the four phones count toward the learning minimum. |
| `browser` | `chrome`, `safari`, `firefox`, `edge`, `other` | Coarse only. |
| `network` | `wifi`, `4g_throttled`, `offline`, `unknown` | No IP/carrier/location. |
| `input` | `touch`, `keyboard`, `named_board` | Controls used; no touch coordinates. |
| `accessMode` | `standard`, `large_text`, `reduced_motion`, `named_board`, `screen_reader`, `not_disclosed` | Optional usage category, **not** a diagnosis. |
| `firstTime` | boolean | First time playing this game, independently confirmed by facilitator. |
| `coachedBeforeMove` | boolean | Includes receiving a hint before the unassisted task ended. |
| `firstMoveSeconds` | integer 0–300, or `null` | `null` means none in the unassisted observation, not missing telemetry. |
| `goalExplained` | boolean or `null` | `null` means not asked; blocks a complete learning gate. |
| `objective` | `score`, `collect`, `collect_pair`, `score_and_collect`, `clear_shields`, `unknown` | Board's coarse objective. |
| `difficulty` | `gentle`, `steady`, `challenging`, `boss`, `unknown` | Board's coarse generated difficulty. |
| `boardGroup` | `unknown` or `group-` plus 1–12 lowercase letters | **Operator-assigned label only**, not raw seed/hash or a location. Mark `unknown` if not safely linked; no seed-level inference then. |
| `outcome` | `won`, `lost`, `quit`, `unfinished` | A report of an observed session, not server replay proof. |
| `enjoyment` | integer 1–5 or `null` | If a loss was observed, a missing answer blocks fairness/enjoyment gate. |
| `lossFair` | boolean or `null` | `null` for non-loss sessions; a missing loss answer blocks the pilot gate. |

The evaluator enforces at most 500 sessions / 256 KiB, a single build, strict enumeration/ranges, distinct codes, and small-stratum suppression in its **output**. It cannot verify uniqueness of real humans, screen-reader effectiveness, experiment assignment, or honesty of responses. The raw local input still contains pseudonymous codes: protect it.

## Evaluate and decide

```sh
node scripts/evaluate-player-study.mjs var/studies/pilot.json
node scripts/evaluate-player-study.mjs var/studies/pilot.json --json
```

Exit status **0** means both proposed gates are *met in submitted records*; **2** means a valid but insufficient/incomplete/below-threshold pilot; **1** means invalid input. No command uploads or writes data. Learning requires ≥20 first-time **phone** sessions, ≥90% unassisted valid moves within 30 seconds and ≥90% correct goal explanations, with no missing goal answers. The loss pilot requires ≥30 **observed-loss** sessions, ≥80% fair-loss responses, median enjoyment ≥4/5, and no missing loss/enjoyment answers. Missing responses are surfaced, never dropped to improve rates. The aggregate report contains the two gate totals, overall dimension counts, and first-time-phone/observed-loss rates by device, input, access mode, objective, difficulty and operator board label **only for groups of at least five**; it never echoes a participant code or individual answer. A five-person stratum is a disclosure floor, not adequate power for subgroup conclusions.

These two metrics are **not** a release decision on their own. Inspect qualitative feedback separately, device and access failures, age/vision/input representation, genuine seed coverage, p75 first-play load, p95 input feedback/frame time, crash-free ≥1,000 consented sessions, and replay false-rejections. D1/D7 measurement is a separate opt-in web return study; an [offline stability beta kit](WEB_SESSION_STABILITY.md) can evaluate submitted consented sessions but is **not** automatic crash instrumentation and has no real observations yet. Do not enable paid-difficulty auto-tuning or team/competitive prizes on the basis of a green JSON report. Verify real sessions and all remaining P0/P1 gates before P2 team cooperation.
