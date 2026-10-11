# Payment claim triage (read-only)

A provider purchase and the player's economy balance are stored separately. A crash or a lost
acknowledgement can leave a claim held after a balance change. **Do not interpret an absent receipt
as proof that no balance write happened.** Do not clear claims on an age-based timer, replay an
unverified client request, or grant/refund coins directly to “repair” a row.

## Aggregate review

With `ECONOMY_STORE=mongo`, the existing admin credentials (`ADMIN_API_TOKEN`, `ADMIN_IDS`) can
read `GET /api/admin/payment-claims` using the protected admin client. It is authenticated,
`private, no-store`, and returns **no** player ID, provider transaction ID, account balance or
receipt contents. Do not place an admin token in a shell history or a committed file. The report
looks at at most **100 oldest-claimed, unreversed ledger rows** with a fulfillment or reversal
claim at least **15 minutes old**. `hasMore: true` means it is only a bounded sample, **not a total
count**. A slow in-flight write can still appear in the report. The two claim-time indexes
should be planned and observed on an existing production Mongo collection.

- `fulfillment.confirmedReceipt`: a credit receipt for the catalog currency/amount and a valid
  awarded-coin count was observed. A *verified provider redelivery* can finish the ledger mark
  without a second credit. Check the authoritative row again before acting: this report is a
  changing snapshot, not an instruction to mutate it.
- `reversal.confirmedReceipt`: a matching debit receipt with a valid taken/shortfall was observed.
  Provider redelivery can finish the reversal without another debit. A shortfall represents coins
  already spent, not a negative balance.
- `noConfirmedReceipt`: no receipt was observed at read time; **do not release the claim**. The
  original write may still be in flight, or this may be an older unreceipted operation. Use
  provider evidence, a controlled store inspection and support review to resolve it.
- `mismatch` and `invalidRows`: quarantined for manual review, not eligible for automated repair.
  Confirm product/provider IDs and the original transaction using secured provider/store tools.
- If Mongo/receipt reads fail or durable economy is disabled, the endpoint returns 503 rather than
  a partial or empty report. Check access, replication and service health; retry the report later.

Do not scrape report counts as revenue, customer conversion or an error-rate denominator; the
sample omits newer claims and becomes incomplete above 100. Individual investigations require
restricted, audited DB/provider access outside this aggregate endpoint. Protect transaction
identifiers, player IDs and store purchase tokens in support tickets and logs. Keep the ledger
claim in place until the two authoritative records and provider evidence are reconciled; retain
audit notes and an independently reviewed decision for any manual adjustment. There is no
automatic timeout, general-purpose “clear claim” endpoint or distributed transaction.

Tests use fake conditional ledger updates and copying economy documents; no live Mongo
multi-replica, provider-sandbox or production payment-reconciliation run has been performed.
