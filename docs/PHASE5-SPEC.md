# Phase 5 specification: encrypted household sync (revision 2)

**Status:** Stages 1–4 are implemented and tested on branch `dev/phase5` against a simulated relay. Nothing is deployed, no account exists, and no money has been spent. Production (`main`) contains no sync code.

This revision replaces revision 1, which was the design reviewed at `v3.1-closure`. Where the implementation differs from revision 1, the difference is listed in section 12.

**Code** (all under `sync/`):

| File | Contents |
|---|---|
| `crypto.js` | Cryptography |
| `model.js` | Records, merging and validation |
| `store.js` | Transactional local store |
| `engine.js` | Sync, pairing, rotation and recovery |
| `relay-sim.js` | In-memory test relay |
| `app-hook.js` | Integration with the app (off by default) |
| `bip39.js` | BIP-39 wordlist |
| `selftest-sync.js` | 86 tests |

**Running the tests:** `?testenv=1&selftest=sync` runs the sync tests. The existing regression runs at `?testenv=1&selftest=full&images=1`.

---

## B1. Cryptographic architecture
Only the browser's built-in Web Crypto API is used. There is no third-party cryptography code and no custom algorithm.

| Purpose | Algorithm and parameters | Where |
|---|---|---|
| Household content key `HK` | AES-256-GCM. 256 bits from `crypto.subtle.generateKey`, which uses the browser's secure random source. One key per epoch (`hk:1`, `hk:2`, …) | `RC.genHK` |
| Content encryption | AES-256-GCM, 96-bit random nonce, 128-bit tag. Plaintext is padded to 256-byte buckets. The header is bound as additional authenticated data (AAD) | `RC.seal/open/pad` |
| Device identity and signing | ECDSA P-256 with SHA-256. Private key non-extractable, kept in IndexedDB. Device ID is 128 random bits | `RC.genSign` |
| Device key agreement | ECDH P-256. Private key non-extractable | `RC.genDH` |
| Key wrapping (giving a device `HK`) | ECDH(sender, recipient) → 256-bit secret → HKDF-SHA-256 (salt `"RE1 wrap"`, info = context) → AES-256-GCM. The context is also the AAD | `RC.wrapFor/unwrapFrom` |
| Pairing authorization | 256-bit invitation secret → HKDF into three separate keys: relay credential, join MAC (HMAC-SHA-256) and welcome-box key. A 6-digit comparison code is derived from SHA-256(secret ‖ joining device's public keys) | `RC.inviteKeys/sas` |
| Recovery material | 256 bits of random entropy shown as 24 BIP-39 words → HKDF into a sealing key and a relay credential (see below) | `RC.newRecovery` |
| Encrypted household backup | AES-256-GCM under HKDF(recovery entropy, `"RE1 backup"`) | `SyncEngine.encryptedBackup` |

**Separation of secrets:**
- **Content:** `HK`.
- **Device identity:** the ECDSA key pair.
- **Device authentication:** request signatures with that key.
- **Pairing authorization:** the invitation secret.
- **Recovery:** the 24-word entropy.

Each of these is independent; none is derived from another.

**The app passcode is not used.** The 4-digit passcode (5225) only unlocks the app screen; it is not an input to any key (a test checks that household-key creation never references it).

**The relay never receives** `HK` in plaintext, the recovery entropy, the invitation secret, or any private key. It receives only:
- public keys;
- signatures;
- ciphertext;
- SHA-256 hashes of two derived bearer credentials (invitation and recovery), stored for comparison only.

**Recovery code standard: BIP-39 (mnemonic encoding only).**
- **Wordlist:** the official English list (2,048 words). File SHA-256 `2f5eed53…24dbda`, verified on download.
- **Encoding:** 256 bits of entropy plus an 8-bit checksum (the first byte of SHA-256(entropy)) gives 264 bits, split into 24 words of 11 bits.
- **Validation:** the three official test vectors (all-zero, all-0x7f, all-0xff entropy) pass. A wrong word, wrong order or wrong word count is rejected by the checksum before anything else is tried.
- **What is not used:** the BIP-39 PBKDF2 "seed" step is not used, because the entropy is already a uniform 256-bit secret. HKDF derives purpose-specific keys from it instead.
- **Recovery identity:** an ECDH key pair and an ECDSA key pair are generated at random. Their private keys are sealed under HKDF(entropy, `"seal"`), and the sealed box is stored at the relay and inside encrypted backups.
  - Devices keep only the public keys. A lost phone therefore cannot act as the recovery identity.
  - Key rotation can still give the recovery identity new keys: every rotation wraps the new `HK` to the recovery public key.
- **Recovery procedure:**
  1. Enter the 24 words.
  2. The phone checks the checksum and derives the relay credential.
  3. It fetches the sealed box and opens it.
  4. It proves the relay's recovery public key matches by signing a test message with the opened key and verifying it against that public key.
  5. It adds itself to the roster with an entry signed by the recovery key.
  6. It unwraps every epoch key from the recovery envelopes and downloads the household.

**Message formats** (base64url without padding):
- **Op envelope** (stored by the relay): `{e, dev, oid, n, ct, sig, rs}`
  - `e` is the epoch, `oid` is `deviceId:counter`, and `rs` = 1 marks an op re-uploaded by another device after relay data loss.
  - AAD = `"RE1op|" + household + "|" + e + "|" + dev + "|" + oid + "|" + rs`.
  - `sig` = ECDSA over `"RE1op|hh|e|dev|oid|rs|n|ct"`.
- **Op plaintext:** `{v:1, sv, id, dev, c, l, k, b, f, ts}`
  - `sv` is the op format version, `c` the device counter, `l` the Lamport clock and `k` the record ID.
  - `b` is the version vector the writer had seen; `f` holds the changed fields.
  - `ts` is informational only and is never used for ordering.
- **Signed request:** `auth = {dev, ts, nonce(128 bits), sig}`, where `sig` covers the canonical JSON of `{p: path, hh, dev, ts, nonce, bh: SHA-256(canonical body)}`.
- **Roster entry:** `{t: add|revoke, hh, dev, member, name, sp, dp, by, at, ep?, sig}`. It is signed by an active device, or by `"recovery"` (the recovery key).
- **Key envelope:** `{from, n, ct}`, with context `"RE1 key|hh|epoch|from|to"`.

## B2. Pairing security
| Requirement | Mechanism | Test |
|---|---|---|
| Single-use invitation | The relay marks it used on the first join | "a used invitation cannot be used again" |
| 10-minute expiry | Enforced by the relay and again by the approving phone | "an expired invitation is rejected" |
| High-entropy credential | 256-bit secret; the relay sees only the hash of a derived credential | "a wrong invitation credential is rejected" |
| Explicit approval by an authorized device | The approving phone must confirm the 6-digit codes match; `approve(…, false)` throws | "approval is refused unless the codes were confirmed" |
| Joining device verified | HMAC over the joiner's public keys with a key the relay never sees | "a relay that swaps in its own device key is detected" |
| Replay protection | Used invitations are rejected; requests carry a nonce and timestamp | Replay tests in B5 |
| Key substitution | MAC check plus the comparison code; the welcome box is sealed with an invitation-derived key | Same as above |
| Cancellation | `cancelInvite`; the relay rejects with 404 | "a cancelled invitation stops working" |
| Interrupted pairing | Nothing is granted until approval; a stale join expires | "pairing interrupted before approval" |

**The QR code is only a transport.** It carries `RE1J.<household>.<inviteId>.<secret>`. It is single-use, expires in 10 minutes, and is useless without approval on the other phone.
- The code is a plain string, not a URL. The planned scanner (Stage 6) reads it in the app, so it never enters browser history, logs or analytics.
- Manual entry of the same string is the fallback.

## B3. Device revocation and key rotation
- **Revoke:** an active phone signs a `revoke` entry. From then on the relay rejects every request from that device (403), and the other phones reject its ops in later epochs.
- **Rotate (two phases):**
  1. Generate `HK(n+1)`, store it locally as "staged", and upload envelopes for every remaining active device and for the recovery key.
  2. Send `commit`.
  - If the app is interrupted between the two phases, the household keeps working on epoch n. The next attempt reuses the same staged key.
- **A phone that was offline during rotation** fetches its envelope on its next sync and catches up. Its queued edits are re-encrypted under the new epoch.
- **Limitation (stated plainly):** revocation cannot erase anything the lost phone already decrypted or copied. Revocation and rotation protect only what is written afterwards. Old ops stay encrypted under old epoch keys that the lost phone had; they are not re-encrypted.
- **Tests:** revoked requests rejected; no new-epoch key for the revoked phone; the remaining phones sync under the new key; an offline phone catches up; rotation resumes after an interruption.

## B4. Local storage
- **The app's state stays in localStorage, unchanged.** It is a single key, written atomically. Moving it to IndexedDB would be a large migration with its own risks, and the requirement can be met without one.
- **The sync store is a separate IndexedDB database** (`roses-eats-sync`). Its stores:
  - `rec`: records;
  - `out`: queued ops;
  - `meta`: device, clocks, sync position, roster and sharing choices;
  - `keys`: CryptoKeys;
  - `park`: ops from a newer app version;
  - `att`: attachment metadata.
- **A record and its queued op are written in one IndexedDB transaction**, so an interruption commits both or neither. Nothing slow (crypto or network) runs inside a transaction.
- **Capture is a reconciliation of app state against records.** A change saved to localStorage just before the app closed is therefore picked up on the next start.
- **Merging remote changes** commits records, the sync position and a "projection pending" marker together, then saves the app state. If the app dies in between, the next start re-applies the projection from the records.
- **Reversibility:**
  - Sync can be switched off, which stops capture.
  - It can be removed, which deletes only the sync database; app data is untouched.
  - The only change to app data is additive: history entries gain a stable `u` id.
- **Failed schema upgrade:** IndexedDB aborts the upgrade transaction and the old store stays intact. This is tested.
- **Not done yet:** personal photos still live in the existing `roses-eats` IndexedDB `photos` store. Photo sync in the simulation covers recipe photos (`S.photos`); syncing cooking-note photos (`h:` keys) uses the same attachment path and is scheduled for Stage 6.

## B5. Synchronization protocol
- **Record IDs:** `collection/<id>` for household data and `collection/<member>/<id>` for personal data. IDs are the app's own (plan `uid`, extras `uid`, recipe IDs, pantry names), URI-encoded, so they are stable across devices.
- **Op IDs:** `deviceId:counter`, where the counter is per device and increases monotonically.
- **Version tracking:** each record keeps a version vector. Each field is a multi-value register whose heads are tagged with the dot (device, counter), the writer's base vector and a Lamport clock. A write removes exactly the heads its base covers.
- **Deletes** are a `_del` field (tombstone) that is never dropped.
- **Sync position:** a relay sequence cursor. If the relay reports a cursor beyond its head, or a different instance, the phone treats it as relay data loss.
- **Properties, each tested:**
  - Idempotent: an op whose dot is already covered is ignored.
  - Duplicates and reordering are handled: ops are sorted per device before applying, and the merge does not depend on order.
  - Interrupted upload: the relay deduplicates by (signer, op ID); the queue is cleared only after acknowledgement.
  - Interrupted download: the cursor advances only in the same transaction as the merge.
  - Replay: 5-minute timestamp window plus a nonce cache.
  - Concurrent offline edits.
  - Phones returning after 40–60 days, and 450 changes across multiple pages.
- **Ordering never uses wall clocks.** The tie-break is (Lamport clock, device ID).
- **Schema compatibility:** an op with a newer `sv` is parked, neither applied nor lost, and applied after the app updates.
- **Rejection:** a client rejects any op that:
  - comes from a device not in the signed roster;
  - comes from a revoked device in a later epoch;
  - has a bad signature or fails AES-GCM authentication;
  - fails schema validation (record ID grammar, field names, `__proto__`-style names, depth ≤ 8, strings ≤ 20,000 characters, ≤ 40 fields);
  - has an author or ID that doesn't match its envelope;
  - is over 96 KB.
  The rejected count is recorded without content.

## B6. Conflict-resolution rules
| Data | Rule | On conflict | Delete vs. concurrent edit |
|---|---|---|---|
| Grocery items: name, quantity | Keep both | Both values shown; "Resolve" picks one | Delete wins |
| Grocery item "done", checkboxes | Last writer by (Lamport, device) | None (converges) | Last writer |
| Basket servings | Keep both | Shown | Delete wins |
| Pantry presence (add, use up) | Last writer | Converges deterministically | Last writer |
| Pantry expiry info, leftovers | Keep both | Shown | Delete wins |
| Meal plan entries (date, recipe, servings) | Keep both; new entries never collide (unique IDs) | Shown | Edit survives and is flagged |
| Collections: membership | Set with last-writer per item; concurrent additions merge | None | Last writer |
| Collections: name | Keep both | Shown | Edit survives and is flagged |
| Favorites, hidden, ratings, TikTok links, equipment | Last writer | None | Last writer |
| Personal recipe versions, own recipes | Keep both | Both versions kept | Edit survives and is flagged |
| Cooking history | Each entry is its own record (append-only) | Never conflicts | Edit survives and is flagged |
| Personal notes | Keep both | Both texts kept | Edit survives and is flagged |
| Personal photos | Keep both | Both photos kept | Edit survives and is flagged |

- **Deleted records cannot silently reappear.** An old phone's stale state is never uploaded, because only ops travel, and a delete removes every head its base covers.
- **Restoring an old local backup while sync is on** does not resurrect records deleted elsewhere. It reports how many were skipped.

## B7. Private and shared data
- **Household categories,** shared by default once sync is set up:
  - meal plan;
  - grocery list;
  - pantry and leftovers;
  - collections;
  - favorites and ratings;
  - kitchen equipment.
- **Personal categories,** off by default:
  - notes;
  - personal recipe versions and own recipes;
  - cooking history;
  - personal photos.
- **How personal data is kept apart:** it is stored under the member (`note/rose/5`). It is never merged into another member's own data; another member sees it separately (`S.hh.note.rose`).
- **Enabling sync shares nothing** until the user confirms the preview. `SyncEngine.preview()` returns counts per category with their share flags; the confirmation screen is part of Stage 6.
- **Joining phone:** its existing household-category items merge into the household (union). Personal items stay private.
- **Known gap:** turning a household category off on just one phone is not supported. Household categories are a household-wide setting, to be enforced in the Stage 6 settings screen.

## B8. Client application security
| Topic | Status |
|---|---|
| Content Security Policy | Implemented on `dev/phase5` as a `<meta>` policy, since GitHub Pages cannot set headers: `default-src 'self'`, `script-src 'self'` plus SHA-256 hashes of the three inline scripts, `object-src 'none'`, `base-uri 'none'`, `connect-src 'self' data: https://www.tiktok.com`. Both test suites pass under it. Limitation: `frame-ancestors` cannot be set by `<meta>`. |
| Third-party scripts | None; tested. |
| Dependency pinning | There are no dependencies. The BIP-39 list is a checked-in file with a recorded hash. |
| Service worker updates | Network-first for the app shell, from the same origin only. |
| Cross-site scripting | All user and synced text is HTML-escaped on render; tested with a synced `<img onerror>` payload. |
| Malicious imported backups and recipes | Existing backup validation, plus the sync op validation above. |
| Compromised app update | **Not prevented by encryption.** Anyone who can change the code served from GitHub Pages can read decrypted data on the phone. Mitigations: repository access control and two-factor authentication on GitHub (your account), deliberate releases, a build fingerprint shown in Settings (Stage 6), and no third-party code. |
| Sensitive logging | The sync code has no `console` logging. Diagnostics record counts and reason codes only; a test checks they contain no secrets. The Worker (Stage 5) must log only status and timing. |

## B9. Recovery
| Scenario | Path | Tested |
|---|---|---|
| Lost phone | Revoke from another phone, then rotate keys | Yes |
| Replacement phone | Pair from another phone, or use the 24 words if none is left | Yes (both) |
| Lost device credentials | Recovery words, then a new device identity | Yes |
| Key rotation | Two-phase and resumable | Yes |
| Relay data loss | Phones re-create the household and re-upload every known value | Yes |
| Interrupted sync | Transactional queue and cursor | Yes |
| Corrupted messages | Rejected by authentication; state unchanged | Yes |
| Local sync store corruption | `rebuild()` re-downloads, then re-adds items that exist only on this phone | Yes |
| Encrypted household backup | Opens with the 24 words without the relay; wrong words fail | Yes |

**The plain local backup and restore stay fully independent of sync**, and the existing tests still pass. Recovery never requires the relay if an encrypted backup file exists.

**If every phone, the 24 words and all backup files are lost,** nobody can decrypt the relay copy, including Cloudflare and us.

## G. Cloudflare assessment (no account created)
Figures were read from Cloudflare's documentation on 2026-11-26. Pages:
- [Workers limits](https://developers.cloudflare.com/workers/platform/limits/)
- [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [D1 limits](https://developers.cloudflare.com/d1/platform/limits/)
- [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/)
- [R2 pricing](https://developers.cloudflare.com/r2/pricing/)
- [R2 limits](https://developers.cloudflare.com/r2/platform/limits/)
- [R2 getting started](https://developers.cloudflare.com/r2/get-started/)
- [Workers spend management](https://developers.cloudflare.com/workers/platform/spend-management/)

| Limit (Free) | Value | Over the limit |
|---|---|---|
| Workers requests | 100,000 per day (resets 00:00 UTC) | Error 1027; the docs describe no charge on Free |
| Workers CPU per request | **10 ms** | Request fails |
| Workers memory / subrequests | 128 MB / 50 per request | — |
| D1 rows read / written | 5 million / 100,000 per day | Queries return errors until reset; no charge stated on Free |
| D1 storage | 500 MB per database, 5 GB per account, 10 databases | Writes fail until data is deleted |
| D1 row, statement, parameters, queries | 2 MB row; 100 KB statement; 100 bound parameters; 50 queries per invocation (a batch counts as one) | — |
| R2 | 10 GB-month, 1 million Class A and 10 million Class B operations per month, no egress fees; beyond that $0.015/GB-month, $4.50 per million Class A, $0.36 per million Class B | Billed monthly. **Whether a payment method is required is not stated**; setup goes through a "checkout flow" |
| Spending limit | Covers Workers usage charges on the Paid plan only. It does not cover D1 or R2, and it "is not an exact maximum bill" | — |

**Usage model for two people** (worst case where noted):

| Scenario | Worker requests | D1 rows written | D1 rows read | Notes |
|---|---|---|---|---|
| Normal day (each phone open about 1 hour; 60-second polling; about 30 edits) | about 250 | about 600 (ops plus nonces) | about 2,000 | Under 1% of each limit |
| Heavy day (4 hours open each; planning and a big shop) | about 1,500 | about 5,000 | about 15,000 | Under 5% |
| Initial sync (about 3,000 records) | about 60 uploads, 15 downloads | about 3,000 | about 3,000 | One time |
| Catch-up after 30 days offline (about 18,000 ops) | about 90 | — | about 18,000 | Under 1% |
| Replacement-phone recovery | Like initial sync, plus a few key calls | — | All ops since the last compaction | See compaction below |
| Photos (about 4 per week, about 250 KB each) | 1 per photo | 1 per photo | — | About 52 MB per year |

**Constraints that shape the Stage 5 design:**
1. **The 10 ms CPU limit.** The Worker should verify one request signature per call and leave per-op signature checks to the phones. The phones already do this; the simulator checks both. Uploads are batched at up to 50 ops per request, and each batch is a single D1 `batch()`.
2. **The 500 MB D1 database cap.** About 600 ops a day at about 1 KB each would reach it in about 2 years. Stage 5 must therefore include **op-log compaction:**
   1. A phone uploads a snapshot of current values (the same mechanism as the relay-loss reseed, which is already tested).
   2. After every active device's cursor has passed the snapshot, the relay deletes the superseded ops.
3. **Photo storage options:**
   - **Separate D1 database for encrypted photos** (recommended first): no card needed, within Free limits, and a 400 MB household quota enforced by the app and the Worker (about 1,600 photos, several years). The drawback is that D1 is not designed for blobs.
   - **R2:** better suited to photos, with 10 GB free, but it may require a payment method, and overage is billed.
   - **No photo sync:** photos stay on each phone and travel in backups.

   **Do not put photos in the main D1 database,** even though they would fit: they would consume its 500 MB cap and the row-read budget.

**Hard spending controls:**
1. Stay on the **Workers Free plan.** Never subscribe to Workers Paid and never add a payment method. With no payment method, nothing can be billed. If R2 requires one, do not enable R2.
2. **The Worker enforces per-household quotas:**
   - 20,000 ops per day;
   - 400 MB of attachments;
   - 1 request per second per device.
3. **The app** polls at most every 60 seconds and backs off exponentially on errors 1027 and 429.
4. **A usage readout** in Settings shows requests and storage against the Free limits.
5. **If Free terms change,** sync can be switched off at any time and the phones keep working.

## Stage 5 provisioning instructions (for when you approve; nothing done yet)
1. **You:** create a Cloudflare account with your own email; enable two-factor authentication; **add no payment method**; stay on the Free plan.
2. **You:** create an API token scoped to *Workers Scripts: Edit* and *D1: Edit* for that account only, and give it to me for the session; revoke it afterwards. Alternatively, run `wrangler login` yourself and I give you the commands.
3. **Me:**
   - Deploy one Worker (`roses-eats-relay`) and two D1 databases: `ops` and `photos` (photos only if you choose that option).
   - Apply the schema and the per-household quotas.
   - Set Worker logging to status and timing only.
4. **Me:** port `relay-sim.js` to the Worker. It has the same endpoints and checks; per-op signature verification moves to the phones only, and compaction is added.
5. **Me:**
   - Run the 86 sync tests against the real relay using a **test household only.**
   - Publish the relay URL in the CSP `connect-src` on the dev build.
6. **Both:** run the controlled two-phone test (Stage 6) before anything reaches `main`.

## 12. Changes from revision 1
1. **Recovery-code key derivation:** HKDF on the BIP-39 entropy, instead of PBKDF2 with 600,000 iterations. The words carry 256 bits of entropy, so slow hashing adds nothing.
2. **Recovery identity:** a separate recovery key pair whose private half is sealed under the words. Revision 1 wrapped `HK` directly; with the key pair, rotations can update recovery without the words.
3. **Device ID:** random rather than a hash of the public key. Both are unique; random IDs avoid exposing a key fingerprint in op IDs.
4. **Old ops are not re-encrypted on rotation.** Disclosed in B3.
5. **Pantry quantities are not counters.** The app stores pantry presence plus expiry details, not amounts, so add/consume events were not needed. Presence uses last-writer-wins; expiry details keep both.
6. **Grocery "checked wins" was replaced by last-writer-wins,** which is deterministic and needs no special case.
7. **Photo deduplication by ciphertext hash is dropped.** Random nonces make ciphertext unique; attachments use random IDs instead.
8. **The Worker verifies one request signature per call; per-op signatures are verified by the phones.** This keeps within the 10 ms CPU limit, which is now confirmed.

## Status of remaining stages
- **Stage 5:** relay provisioning. Needs your approval and your account.
- **Stage 6:**
  - setup screens: preview, QR display and scanner, conflict screen, sync status chip, settings, build fingerprint;
  - cooking-note photo sync;
  - the controlled two-phone test.
- **Stage 7:** production integration (off by default).
- **Stage 8:** TikTok import and cookbook export. Authorized, but kept separate from sync and not started.
