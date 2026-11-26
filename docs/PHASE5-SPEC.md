# Phase 5 technical specification: encrypted household relay

**Status: design for review. Nothing here is implemented or deployed.** No account, infrastructure or cost has been created. This document supersedes docs/PHASE5-PLAN.md.

## C1. Offline-first principles
- Each iPhone keeps its own complete local copy: localStorage for state, IndexedDB for photos and the sync log.
- Every feature works with no network: cooking, recipes, pantry, groceries, planning.
- The relay is a **mailbox for encrypted changes**. It is never the authoritative copy, and the app never waits on it to render.
- No dependence on any PC. If Cloudflare is down, sync shows "Offline" and the phones keep working; changes queue and send later.
- The 1,551-recipe library is static app code and is **never** synced.

## C2. Household pairing and device identity
- **Device identity:** each phone generates an ECDSA P-256 key pair with WebCrypto (non-extractable, stored in IndexedDB). The device ID is the SHA-256 of the public key.
- **Creating a household (phone A):** generates a random 256-bit household key `HK` (AES-GCM) and a random household ID (128 bits). It registers with the relay: household ID plus A's public key. This is a signed request; the relay stores only public keys.
- **Inviting phone B:**
  1. A shows a QR code with the household ID, a single-use invite token (128 bits, expires in 10 minutes) and a pairing secret.
  2. B scans it and sends its public key plus the token.
  3. The relay accepts B only if the token is valid, unused and unexpired, and marks it used.
  4. A must then approve B on screen: "Add Marco's iPhone?" Membership is explicit, with no public sign-up.
  5. A sends `HK` to B encrypted with ECDH (A's and B's keys) plus HKDF, bound to the pairing secret from the QR code, which the relay never sees.
- **Request authentication:** every request is signed with the device's private key over method, path, body hash, timestamp and nonce. The relay checks the signature against the registered public keys, rejects timestamps older than 5 minutes, and rejects reused nonces. This is separate from content encryption.
- **Revoking a device:** any member can revoke another. The relay removes its public key, and the remaining phones rotate `HK` (C3), so the revoked phone can't read new data.
- **Replacement phone:** pair it as a new device from the remaining phone, or use the recovery code if no phone is left (C7).
- **The client-side passcode isn't involved** in remote authentication.

## C3. End-to-end encryption
- **Primitives:** WebCrypto only (AES-256-GCM, ECDH and ECDSA P-256, HKDF-SHA-256, PBKDF2-SHA-256 for the recovery code). No custom cryptography and no third-party crypto library.
- **Records:** each change record is JSON, encrypted with AES-GCM under `HK`, with a random 96-bit nonce per record. The record ID, version and household ID are included as authenticated data, so records can't be swapped or replayed into another slot.
- **Key storage:** `HK` is stored wrapped by a non-extractable device key in IndexedDB.
- **Recovery code:** 24 random words (256 bits), shown once and kept on paper. It derives a wrapping key with PBKDF2 (600,000 iterations) that encrypts a copy of `HK` stored on the relay.
- **Key rotation:** a new `HK` is created on revocation or on request, and sent to the remaining devices. New records use it, and old records are re-encrypted in the background. Key IDs are kept in record headers.
- **Photos:** encrypted the same way before upload (per-photo key, wrapped by `HK`). Deduplicated by the SHA-256 of the encrypted bytes, so an unchanged photo is never re-uploaded.
- **What the relay can see:** household ID, device public keys, request times and IP addresses, record counts and sizes, and when each device syncs. It can't see content.
- **The trust limit:** the app's code comes from GitHub Pages. A malicious or compromised update could read decrypted data on the phone; **end-to-end encryption doesn't protect against a compromised app.**
  - Mitigations: no third-party scripts in the sync code path, a pinned set of local files, and the published source and commit history.
  - Optionally, an in-app "build fingerprint" (the hash shown in Settings) can be compared against the release notes.
  - Every update is a deliberate commit to your repository, and the service worker only updates from that origin.

## C4. Sync scope
| Synced with the household | Stays private on the device (default) |
|---|---|
| Pantry inventory, grocery list, extras and checks, meal plan, shared favorites, shared collections, leftovers, kitchen equipment | Personal notes, cooking notes not marked "share", private recipe versions, ratings (optional), settings such as night mode, timers, cooking session, offline downloads, the passcode flag |
| Personal recipes and versions **marked "share with household"** | Personal photos unless marked "share" |
| Cooking history entries marked "share" | |

## C5. Conflict resolution
- **Data model:** every synced item has a stable ID (random 128-bit), a version vector `{deviceId: counter}`, `updatedAt`, `deletedAt` (a tombstone that is never just dropped) and its fields. Operations are idempotent: applying the same change twice does nothing.
- **Merge rules by type:**
  - **Grocery list:** each item is its own record, so two phones adding items never conflict. The quantity is a register; concurrent edits keep the higher value and flag "edited on both phones". "Checked" wins over an edit made at the same time, and the edit is kept as the new item text.
  - **Pantry quantities:** stored as signed add/consume events, not a total, so both phones' consumption adds up correctly. Quantities never go below 0; if they would, the item is flagged "check amount".
  - **Meal plan:** each entry is a record. Two phones adding entries to the same day keep both. Moving the same entry on both phones keeps the later move and lists the other in "Recently replaced".
  - **Recipe versions, notes and cooking history: never silently overwritten.** Concurrent edits produce two copies ("edited on Rose's phone" / "edited on Marco's phone") and a **"Conflict needs attention"** prompt to choose or merge. A deletion on one phone while the other edited means the edit wins, restored with a notice.
  - **Favorites and collections:** set operations with tombstones, so add and remove commute.
- **Ordering:** duplicates are discarded by (record ID, version). Out-of-order messages are fine because merges use version vectors, not arrival order. An interrupted sync resumes from the last acknowledged cursor, and the local queue is only cleared after the relay acknowledges.
- **A phone offline for weeks:** it pulls all changes since its cursor. Tombstones are kept for 180 days, and a phone offline longer than that does a full re-sync (a merge, not an overwrite).
- **Test matrix** (run against an in-browser simulated relay, Stage 2): every case listed in the brief, plus clock skew between phones.

## C6. Sync experience
- **Status chip in the header:** Synced (time of last sync) · Changes pending (n) · Offline · Syncing… · Conflict needs attention · Sync failed (tap for details).
- **"Sync now"** lives in Settings.
- Temporary connection failures only change the chip, with no pop-ups.
- **iOS limits:** Home Screen web apps can't sync in the background. Sync happens when the app opens, when it returns to the foreground, every 60 seconds while open, and after each edit, so a change from Rose shows on Marco's phone the next time he opens the app. This is stated in the app.

## C7. Recovery and backup
- **Local backup and restore** (already shipped) stays independent of the relay.
- **Household backup:** the export includes shared and private data and photos.
- **Private-only export:** same format, shared data excluded.
- **Replacement phone:** pair it from the other phone (C2), or enter the recovery code. The code unwraps `HK` and the full encrypted history downloads.
- **Relay data lost:** each phone still has everything and re-uploads on the next sync. Nothing is lost.
- **Interrupted sync:** queued changes stay on the phone until acknowledged.
- **Lost credentials:** if one phone is lost, revoke it from the other and rotate keys. If both phones are lost but the recovery code is kept, restore on new phones.
- **If every phone and the recovery code are lost:** the relay copy can't be decrypted by anyone, including you or Cloudflare. The only remaining source is an exported backup file. The app reminds you to export one regularly.

## C8. Photos and storage
| | 1 year | 3 years | 5 years |
|---|---|---|---|
| Cooking photos (2 people, ~4/week, ~120 KB each at 1280 px) | ~25 MB | ~75 MB | ~125 MB |
| History, versions, pantry, plans (JSON) | ~1 MB | ~3 MB | ~5 MB |
| Sync metadata (change log, compacted monthly) | ~2 MB | ~3 MB | ~4 MB |

- **Limits:** photos capped at 1280 px and about 250 KB, deduplicated by hash, with deletes propagated as tombstones. Default household quota: 2 GB of photos.
- **At 80% of quota:** a warning. **At 100%:** new photo uploads pause and stay on the phone, marked "not yet synced". Nothing is deleted.

## C9. Cloudflare services and cost (checked against Cloudflare's docs, November 2026)
- **Workers (Free):** 100,000 requests per day; over that, requests fail with error 1027. They're never billed on the Free plan. The per-request CPU limit on Free (historically 10 ms) is to be confirmed on the limits page. The Worker only checks signatures and moves bytes; encryption happens on the phones.
- **Storage choice:**
  - **D1 (Free):** 5 million rows read and 100,000 rows written per day; 500 MB per database, 5 GB per account; queries fail when the limit is hit.
  - **Workers KV (Free):** 100,000 reads and **only 1,000 writes per day**. That write limit is too tight for a change log, so **D1 is the recommended store** for records.
  - **R2 (photos, optional):** 10 GB-month storage, 1 million writes and 10 million reads per month free, no egress fees. Beyond that it's paid ($4.50 per million writes, $0.36 per million reads). I couldn't confirm from the docs whether R2 needs a payment method on file; **check in the dashboard**. If it does, photo sync stays off unless you approve.
- **Expected household use:**
  - About 300 to 1,500 requests per day (both phones, 60-second polling while open, plus edits). That's under 2% of the request limit.
  - About 500 to 3,000 D1 rows written per day.
  - Photo storage as above, well under 10 GB for 5 years.
- **Avoiding surprise charges:** stay on the Workers Free plan, which fails instead of billing. Don't enable paid plans. The app slows its polling if it gets throttled. A monthly usage readout goes in Settings.
- **Risks:** free-tier terms can change (the D1 enforcement date shows they do). Mitigation: the relay is optional and the phones are self-sufficient.

## C10. Threat model (summary)
| Threat | Defense |
|---|---|
| Someone tries to join the household | Single-use, 10-minute invites; explicit on-screen approval; signed device requests |
| Pairing QR code photographed | Expiry, single use, approval step; the pairing secret alone can't add a device |
| Stolen phone | iPhone passcode and Face ID; revoke from the other phone, then rotate keys |
| Relay breached | Only ciphertext and public keys are stored; no keys or plaintext |
| Malicious payloads | Strict schema validation after decryption; size limits; failed authentication drops the record |
| Replay of old requests | Timestamp window, nonce cache, version vectors |
| Tampering | AES-GCM authentication with bound record headers |
| Compromised app update | See C3: not prevented by encryption; mitigated by controlled releases and the build fingerprint |
| Flooding with requests | Per-device rate limits in the Worker; free-plan limits cap any cost at $0 |
| Accidental deletion | Tombstones, "Recently replaced", local backups |
| Leaks through logs | The Worker logs only status codes and timings; it never logs bodies, keys, recovery data or signatures |

**Validation plan:**
- Unit tests for each cryptographic step.
- A second "attacker" household in tests must fail to read or write the first household's data.
- Replay tests and tampered-ciphertext tests.
- Code review of the Worker for logging.

## C11. TikTok import
- **Inputs:** paste a TikTok link, paste the caption or recipe text, or type it in.
- With a link, the relay can request TikTok's public oEmbed caption. No scraping, no logins, no bypassing restrictions.
- **Extraction:** the existing on-phone text parser finds ingredient and step lines. Every field is labeled "found in caption", "you entered" or "empty". **Nothing missing is ever invented.** Empty quantities stay empty.
- You review and save. The source link is kept.
- No AI service is used.

## C12. Family cookbook export
- Choose recipes, versions and family recipes from collections; set a cover and title; include notes, chosen Pro Tips and **your own photos or verified-licence photos only**. Illustrations are labeled. Credits are listed on the last page.
- **Output:** a print layout saved as a PDF from the share sheet, plus a portable JSON file that can be re-imported.

## D. Staged implementation plan
1. **Local sync data model.** Item IDs, version vectors, tombstones, change log, migration of current data.
   - Accept when: the existing 87-check regression still passes, and migration is lossless and reversible.
2. **Simulated relay and multi-device tests.** Two in-page "phones" exchange changes through a fake relay.
   - Accept when: the full conflict matrix (C5) passes, including duplicates, reordering, interruption and a phone offline for weeks.
3. **Cryptography and pairing.** WebCrypto keys, QR pairing, approval, revoke, rotation, recovery code.
   - Accept when: crypto unit tests pass; a second "attacker" household is rejected; tampering and replay are rejected.
4. **Recovery and security validation.** Lost phone, lost relay, recovery code, key rotation, log review.
   - Accept when: every C7 scenario passes in simulation, and the threat-model checklist is reviewed by you.
5. **Approved relay provisioning** *(needs your approval).* You create the Cloudflare account; I deploy the Worker and D1 database on the Free plan.
   - Accept when: a usage readout is visible and a $0 bill is confirmed.
6. **Controlled two-phone test** on Rose's and Marco's iPhones.
   - Accept when: the physical checklist and a sync checklist both pass.
7. **Production integration.** Sync stays off by default, with an opt-in "Connect our two phones" setup.
   - Accept when: offline behavior is unchanged with sync off.
8. **TikTok import and cookbook export.**
   - Accept when: nothing is ever invented, and exports contain no unlicensed photos.

## Decisions for you
- Approve this specification, or ask for changes.
- At Stage 5: create the Cloudflare account yourself, then confirm whether R2 needs a card. If it does, decide whether photo sync is worth it.
- Defaults for what's private versus shared (C4).
