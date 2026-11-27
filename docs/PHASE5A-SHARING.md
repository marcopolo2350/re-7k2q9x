# Phase 5A: household sharing without servers

Status: built on branch `dev/phase5a` and not merged into the live app. Written 27 Nov 2026.

## 1. Architecture constraint (permanent until you change it)
- Rose's EATS is hosted **only on free GitHub Pages**.
- It uses no Cloudflare, Supabase, Firebase or any other backend, and no paid APIs, subscriptions, billing accounts or external databases.
- No GitHub tokens are kept on the phones. No household data goes into the public repository, and nothing depends on a computer staying on.
- **Automatic remote syncing is therefore not possible and is not offered.**
  - Phones catch up only when someone sends a file and the other phone opens it.
  - The app says this wherever sharing appears ("This is not automatic syncing").

## 2. What was kept and reused from Phase 5
- The automatic-sync engine is preserved on branch `dev/phase5`, tag `v5.0-sync-candidate` (86 sync tests).
- No relay, Worker, D1 or Cloudflare work continues.

| Part | Reused in 5A | Notes |
|---|---|---|
| Record model and change tracking (`model.js`) | Yes | Per-field multi-value registers with version vectors; delete policies. Pantry amounts are now inventory transactions. |
| Record identifiers (`encId`, `keyOk`) | Yes | Any pantry name or recipe id is representable. |
| Conflict detection and explicit resolution | Yes | |
| Validation of received data (`validOp`) | Yes | It now also checks field names, photo data and pantry transactions. |
| Transactional local store (`store.js`) | Yes, unchanged | |
| Duplicate detection | Yes | Version dots make re-imports no-ops; file ids are remembered. |
| Cryptography | Partly | AES-256-GCM, HKDF, SHA-256 and the BIP-39 encoding stay. Signatures, ECDH key exchange, relay authentication, invitations and device rosters are removed; with no relay there is nothing for them to protect against. |
| Device identity | Simplified | A random device id per phone, used only to name versions. |
| Relay, invitations, rotation protocol, relay-loss reseed | No | They stay on `dev/phase5`. |

## 3. How it works
- **Start household sharing** on one phone: choose whose phone it is (Marco, Rose or another name).
  - The app makes a random 128-bit **household code**, shown as 12 standard BIP-39 words.
  - To check they were written down, you type back words 3 and 9.
- **Join with a code** on the other phone: type the 12 words. The words are never sent anywhere.
- **Send my changes** creates one encrypted file and opens the iPhone share sheet (AirDrop, Messages, Mail, Files).
  - Where sharing a file isn't supported, the file is downloaded instead.
  - Household categories are selected by default: meal plan, grocery list, pantry with amounts and leftovers, collections, favorites and ratings, and kitchen equipment.
  - Personal categories are off by default: notes, recipe versions and own recipes, cooking history, and photos. Individual items can be picked.
- **Open a household file** shows a preview before anything is written.
  - The preview shows who sent it and when, and counts what is new, changed and removed in each category.
  - It also shows how many personal items were shared and how many things were changed differently on both phones.
  - **Cancel** changes nothing; **Open and merge** applies it.
- **Shortcuts:**
  - **Share grocery list** and **Share meal plan** make a file or plain text readable in Messages.
  - **Share recipes** picks specific recipes.
  - **Household backup** makes one encrypted file with everything.
- **Shared with me** shows the other person's shared notes, recipes, history and photos.
  - These are kept apart from your own (stored in `S.hh` and the records) and never replace your notes or recipes.
  - A shared recipe can be saved to your own recipes as a copy; duplicates are refused.
- **Choose what's right** lists things changed differently on two phones, with both values and who made each.
  - Your choice travels to the other phone in the next file.
- **Sharing settings:**
  - Rename this phone, or show the household code (after a confirmation).
  - Make a new code if a phone is lost.
  - Turn sharing off. All your data stays, and items others shared are removed from this phone.

## 4. Merge rules (unchanged from Phase 5 B6, plus pantry transactions)
- **Grocery items, meal plan entries, leftovers and pantry details:**
  - Concurrent edits to different fields merge.
  - Concurrent edits to the same "keep" field keep both values until someone chooses.
  - Deletions win over edits for grocery and pantry items.
  - Meal-plan entries, collections and personal items are preserved if edited elsewhere while deleted here; that case is shown for a decision.
- **Favorites, ratings and the pantry name list:** last writer by Lamport order. The order never depends on phone clocks.
- **Deleted items carry a deletion marker.** An older file, or a file from a phone that was offline, cannot bring them back. This is tested.
- **Personal items from another member** are stored under that member's name and never written into your own notes, versions, history or photos.

### Pantry amounts are transactions
- Amounts stay optional. The ingredient-only pantry (the list of names) works exactly as before.
- Each change to an amount is an immutable transaction with a random 96-bit id:
  - `buy`, `use`, `toss` (discarded or expired) and `adj` are relative changes.
  - `set` is an absolute correction. It records the ids of the transactions it had already seen.
  - `void` undoes one transaction.
- Merging is a set union by id. **Duplicates and order never matter.**
- **Amount** = the latest correction plus every relative change that correction had not seen.
  - Example: Rose uses 3 eggs and Marco uses 2 while apart. After sharing, both phones show **10 − 3 − 2 = 5**.
- **Concurrent corrections** (two people typed a new amount without seeing each other's) are a **conflict**.
  - Both amounts are shown with who entered them. Choosing one adds a new correction that covers both.
- **Negative totals** (for example two people each logged the last eggs as used) are **shown as a discrepancy** with a prompt to correct. They are never clamped to zero.
- **Units:**
  - Compatible units convert: volume tsp, tbsp, cup, ml, l; weight oz, lb, g, kg; pieces.
  - Incompatible ones (cups against pounds) are not guessed. They are listed as "couldn't be added".
- **Migration:** an amount typed before this version becomes one starting correction. This is additive and runs once.
- The editor now has **＋ Bought, − Used, 🗑 Threw away, ✎ Correct the amount**, the recent history with **undo**, and the conflict and discrepancy notices.
- The rest of the app (grocery deduction, lists) still reads `S.inv[item].q`, now a cache computed from the transactions.
- **Growth:** about 10 transactions a week for two people is about 60 KB a year. Nothing is pruned yet; a 10-year estimate is about 0.6 MB.

## 5. Encrypted transfer files: exact cryptography
All cryptography uses the browser's built-in Web Crypto. No third-party cryptographic code.

| Item | Algorithm and size | Lifecycle |
|---|---|---|
| Household code | 128 bits from `crypto.getRandomValues`, shown as 12 BIP-39 English words (4-bit checksum) | Created on the first phone; typed on the second; kept in the phone's IndexedDB so it can be shown again; replaced by **Make a new household code** |
| Household id | HKDF-SHA-256 (code, salt "RE share 1", info "household id"), 64 bits, hex | Not secret. Tells a phone that a file belongs to another household before it tries to decrypt it |
| File key | HKDF-SHA-256 (code, salt "RE share 1", info "file key"), 256 bits, imported as a **non-extractable** AES-GCM key | One per code. Old keys are kept on the phone that changed the code, so it can still open its own older files, marked "older code" |
| File encryption | AES-256-GCM, a new 96-bit random nonce per file, 128-bit tag | Each file has a random 96-bit id |
| Authenticated header | Additional data = `RE-SHARE1 | household id | file id | compression flag` | Changing any of these, or any byte of the ciphertext, makes decryption fail. Tested |
| Compression | gzip (CompressionStream) before encryption where available | The flag is authenticated |
| Photo integrity | Each embedded photo is keyed by the SHA-256 of its data and checked on import; it must be a base64 JPEG, PNG, WebP or GIF data URL | |

- **Visible in a file without the code:** the app name, the format, a 64-bit household id, the file id and the ciphertext length.
  - Member names, recipe names, lists and photos are all inside the encrypted part. This is tested.
- **Nonce management:** random 96-bit nonces, one encryption per file. The collision risk is negligible at household volumes.
- **Why no signatures?** Both phones hold the same key, so any household member can make a valid file; that is the intended trust model. A file can't be forged or altered by anyone without the code.
  - **Limitation:** someone who has the code (for example a lost phone that hasn't been cut off by changing the code) can make valid files.
- **Changing the code (lost phone):**
  - Files made with the old code are refused on phones that only know the new code.
  - An old backup can still be opened by typing the old words.
  - The phone that changed the code can open its own older files and shows a warning.
- **Pairing:** done in person by typing 12 words, which have a checksum.
  - There is no network step, so there is nothing to intercept or substitute.
  - The code isn't sent with files, and the app tells you not to post it or send it with your files.

## 6. Local consistency (the app's storage and the sharing records)
- The app keeps its state in localStorage (`roses-eats-v1`). Sharing keeps derived records in a separate IndexedDB database (`roses-eats-share`).
- The two can't be written in one transaction, so the design is a **source of truth plus a journal**:

| Moment the app closes | What happens | Evidence (test) |
|---|---|---|
| After a household edit was saved, before it was recorded for sharing | The app state is the source of truth. On the next start the records are compared with it and the edit is recorded, so nothing is lost or left out of the next file | consistency: "app closed after a local edit..." |
| While recording an edit (storage full or crash) | The record changes are one IndexedDB transaction: all or nothing. The next attempt records it | "storage full while recording an edit" |
| During an import, before the app data was saved | A journal entry (new records plus a SHA-256 of the new app state) was written. On start the saved state doesn't match it, so the import is discarded and can simply be repeated | "app closed during an import, before the app data was saved" |
| During an import, after the app data was saved | The saved state matches the journal hash, so the records are completed. The next recording finds nothing extra | "...after the app data was saved: import completed" |
| Storage full when saving imported data | The journal is removed, nothing changes, and a plain message is shown; it works after space is freed | "storage full when saving the imported data" |
| Storage full when saving shared photos | They are written before anything else changes, so nothing changes | "storage full for photos" |
| During a conflict decision | The same journal mechanism applies | "a conflict decision interrupted after saving" |
| During migration | Migrations are additive and run before anything is saved; an interrupted migration reruns. An older-format state is recorded with no false deletions | "migration: an older-format app state..." |
| During reconciliation after restoring a full app backup | A restore marker is set first; on the next start the reconciliation runs again before anything is recorded | "restoring an old app backup never overwrites newer household information" |
| Someone edits while an import is being prepared | Each import checks an edit counter just before saving and restarts if anything changed, so the edit is kept | "an edit made while an import is being prepared is kept" |

All sharing operations run under one lock, so recording never interleaves with an import.

## 7. Recovery: what can and cannot be recovered

| What | How it's recovered | Needs |
|---|---|---|
| 1. Access (being able to open household files) | Type the 12 words on any phone | The words |
| 2. Household records (lists, plan, pantry, collections, favorites) | From any phone that still has them (**Send my changes**, or a **Household backup**), or from a **Household backup** file | A surviving phone **or** a backup file, **plus** the words |
| 3. Personal photos and other personal items | Only from a **Household backup** made on that phone, or a normal **Export full backup**, or from the other phone if you had shared them | A backup file (and the words, for the encrypted one) |
| 4. Private items that were never shared or backed up | Not recoverable if that phone is lost | Nothing can bring them back |

- **The 12 words are a key, not a backup.** On their own they restore access and no data. The app says so where the words are shown, and a test proves it: a phone joined with the words alone gets none of the data.
- **If every phone and every backup file is lost, nothing can be recovered.** There is no server copy, by design.

Tested scenarios:
- A surviving phone sends an "everything" file.
- An encrypted household backup plus the words, with both phones lost.
- The backup can't be opened without the words.
- After changing the code because a phone was lost, files from the lost phone are refused.
- After changing the code, an old backup opens only when the old words are typed.
- The phone that changed the code can still open its own older files.
- An old app backup restored on a phone does not overwrite newer household information. Only items the household never had come back from the backup.

## 8. Security validation (done here; this is not a professional audit)
Verified by tests:
- Household code entropy and format (128-bit random; the official BIP-39 vectors pass).
- Mistyped or reordered words are caught by the checksum.
- Tampered ciphertext and tampered headers are rejected.
- Files from another household are refused.
- Files from a newer app version are refused.
- Eight kinds of malicious content inside a correctly encrypted file are refused:
  - a prototype-pollution record or field;
  - an oversized value;
  - an invalid version id;
  - an invalid pantry transaction;
  - a non-image photo;
  - a category not declared in the file;
  - a malformed record list.
- HTML or script in grocery names, notes and recipe names is stored as text. When rendered on the import preview, the conflict screen and the Shared-with-me screen, it shows as text with no element created and no script run.
- Test output contains no household codes.
- The household key is non-extractable.
- Sharing makes no network requests.

Content Security Policy (added on this branch; checked against the whole app):
- **Policy:** `default-src 'self'`; scripts from `'self'` plus three hash-pinned inline scripts (passcode gate, page-flip library, service-worker registration); `object-src 'none'`; `base-uri 'none'`; `form-action 'self'`; `connect-src 'self' data: https://www.tiktok.com` (TikTok title lookup only); `img-src 'self' data: blob: https:`.
- The 88-check regression passes under it with no violations.
  - The one violation found was the regression panel's own inline Close button, now a link.
- **Remaining gaps:**
  - `style-src 'unsafe-inline'`: the app uses inline styles throughout. That allows CSS injection but not script execution.
  - `img-src https:` is wider than needed now that remote photos are gone. It can be tightened after a check that no remote images remain.
  - `frame-ancestors` can't be set in a `<meta>` tag, and GitHub Pages doesn't allow custom headers.

Limitations:
- A compromised copy of the app itself (a malicious update) could read everything; encryption can't protect against that.
- Anyone holding the 12 words can read and make household files.
- Files are only as private as where you keep them, but without the words their content can't be read.
- Changing the code doesn't erase what a lost phone already had.

## 9. GitHub Pages sustainability (checked 27 Nov 2026 against GitHub's docs)
| Limit (GitHub docs) | Value | Rose's EATS now |
|---|---|---|
| Published site | ≤ 1 GB | About 14 MB of tracked files, including 5.9 MB of photos (69 at about 86 KB). Even 470 photos would add about 34 MB |
| Source repository | Recommended < 1 GB ("less than 5 GB is strongly recommended") | 84 MB on GitHub, including the 776 removed images still in history (about 75 MB) |
| Single file | Warning at 50 MiB, blocked at 100 MiB | The largest file is `guide.js` at 1.9 MB |
| Bandwidth | Soft 100 GB per month | The offline app shell is 6.9 MB raw, 1.8 MB gzip. Two phones re-downloading it after every deploy, 30 deploys a month, is about 0.1 GB |
| Builds | Soft 10 per hour | Deploys are manual and occasional |
| Use | Not for commercial transactions, SaaS or sensitive transactions such as passwords or card numbers | A personal household app; nothing sensitive is sent to Pages |

- **Personal data never goes to GitHub.** Household data, photos and backups live on the phones and in files you export yourself.
- **Optimizations available without quality loss:**
  - WebP photos, about 30% smaller; Safari supports WebP.
  - Lazy-loading the sharing screens, about 25 KB gzip.
- Not needed now.
- GitHub sets these free-tier terms and can change them.

## 10. Revised roadmap
- **Phase 5A (this):** serverless household sharing, pantry transactions and recovery. **Waiting for your review and physical-iPhone testing.**
- **Phase 5B:** TikTok import from links, descriptions and recipe text you supply; personal cookbook (collections, custom covers, your photos, printable export).
- **Phase 6:** premium design, more licensed photos, accessibility and performance.
- **Final acceptance:** physical iPhone testing and the complete regression.

## 11. Known gaps
- **No QR codes.**
  - iPhone Safari has no built-in QR reader for web apps, and a home-screen app can't receive a QR link from the camera (iOS keeps Safari and home-screen app storage separate).
  - Pairing is therefore typed words. An in-app scanner would need a vendored decoder library; that's possible later.
- **The share sheet and file opening haven't been tried on a physical iPhone.**
  - Desktop Chromium has no AirDrop.
  - The app falls back to downloading the file. That path and the share call were tested with a simulated share sheet.
- **A file opened in Messages** has to be saved to Files first, then opened from the app. iOS home-screen apps can't register as a file handler.
