# Competition prize retries and limits

Community challenge and tournament prizes are low-stakes only. Their eligibility/rank and payout
reservation live in the single-server social JSON file; the signed-in player's coins and season XP
live in the account economy. They are **not one transaction**. Run only a single social-file writer;
this is not a multi-server leaderboard or a financially audited payout service.

For new rewards, each player/event pair (challenge or tournament ID) has a permanent hashed
receipt in the economy. The coin credit, receipt and (for an active, valid season) challenge season
XP save together under the economy revision guard. A lost economy acknowledgement can cause the
social reservation to be released and re-taken: the receipt then makes the retry an acknowledgment,
not a second grant. Contest IDs must **never be reused** for a different competition; changing a
prize for an already-paid ID fails closed with `competition_receipt_mismatch`. At 4,096 receipts per
player the next prize fails closed, never evicting a paid receipt. A full coin wallet only receives
its available space. Production uses `ECONOMY_STORE=mongo`; memory mode cannot survive restarts.

## Stuck reservation

A held social reservation **without** a matching durable receipt is ambiguous, including claims
created before these receipts were introduced. A player retry returns `payout_unconfirmed` (503);
a tournament settlement reports that rank as `failed`, not `alreadyPaid`. A receipt read failure
also fails rather than guessing. Do not clear the social marker solely because a receipt is absent:
a save may still be in flight or may have committed with a lost acknowledgement. Review the social
file, authoritative economy, original event configuration and verified-win/ranking evidence in a restricted, audited environment.
Do not trigger direct economy credits or run manual payout scripts without a documented, reviewed
reconciliation decision. If the reservation was released after a failed write, a normal retry is
safe: it re-evaluates the permanent receipt before granting.

Successful social reservations can still be lost if the single-file store is lost or corrupted;
new receipts prevent a second economy grant for the same event ID but **cannot reconstruct social
rankings, historical eligibility, or a missing season-XP policy**. The season config is loaded
best-effort; absent/invalid config grants coins without season XP, as before. Old successful prizes
without receipts cannot be proven or reconstructed by this code. Neither the social JSON file nor
this payout path supplies a multi-server outbox or distributed transaction.

Route, copy-on-write economy and fault-injection tests cover retries and conflicts; no live Mongo
multi-replica, production social-file crash recovery or real event settlement has been exercised.
