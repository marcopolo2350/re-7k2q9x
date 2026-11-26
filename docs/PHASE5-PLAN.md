# Phase 5 plan: encrypted household relay (Option C)

**Status:** you chose this option to plan. Nothing is built. No account has been created, no money spent and no data shared.

## What you'd need to approve before any build
1. **A free Cloudflare account, created by you.** I can't create accounts or enter passwords. You'd sign up, then share only a scoped API token for deploying one Worker.
2. **A household passphrase** that Rose and Marco both know. It never leaves the phones. If it's forgotten, the synced copy can't be decrypted; each phone's local data is unaffected.
3. **Whether personal photos sync,** or stay on each phone. Syncing them uses Cloudflare R2 storage: free up to 10 GB, though R2 asks for a payment card on file even within the free tier.

## How it works
- **Encryption on the phone.** Each phone turns the passphrase into a key using PBKDF2-SHA-256 (600,000 rounds, built into Safari) and a household salt. Every change is encrypted with AES-GCM before upload. The server only ever stores unreadable blobs.
- **Relay.** One small Cloudflare Worker (about 150 lines) with three endpoints:
  - `PUT /h/:household/:record`: store an encrypted record.
  - `GET /h/:household/changes?since=`: list changes since a point.
  - `GET` for a single record.
  - The household ID is a random 128-bit value, and every request is signed with a key derived from the passphrase, so others can't read or overwrite your records. Rate limiting is included.
- **What syncs:**
  - Pantry and inventory, grocery list and checks, meal plan.
  - Favorites, collections, ratings, cooking history.
  - Personal recipes and versions, leftovers, settings.
  - **Not synced:** offline photo downloads, timers, an in-progress cooking session, the passcode flag.
- **Conflict handling.** Each item (one plan entry, one pantry item, one history entry) carries a last-changed time and a device ID; the newer change wins per item, not per whole list. Deleted items leave a marker so they don't come back. Simultaneous edits to the same item: the later save wins and the other is kept in a "recently replaced" list for 7 days, so nothing silently disappears.
- **Offline.** Changes queue on the phone and send when back online. The app always works from local data first.
- **iPhone.** Sync runs when the app is opened or brought to the front, and every minute while open. iOS doesn't allow web apps to sync in the background, so a change made on one phone appears on the other the next time it opens the app.

## Costs and limits (free tier, a 2-person household)
| | Expected use | Free allowance |
|---|---|---|
| Requests | ~2–5k per day | 100k per day |
| KV storage | under 5 MB | 1 GB |
| R2 photos (optional) | ~50–500 MB | 10 GB |

Expected cost: **$0**.

## Security and privacy notes
- The passphrase isn't recoverable by design. Backups keep working as today.
- Cloudflare sees request timing and sizes, but not content.
- The existing client-side passcode stays as a convenience lock only.
- A setting turns sync off completely and deletes the server copy.

## Build steps, each tested and checkpointed
1. Sync engine in the app: per-item change tracking, encryption, queue and merge. Tests run against an in-browser fake relay, in the isolated test environment.
2. Worker code and its tests, run locally with Cloudflare's emulator. No account needed.
3. **Only after your approval:** deploy the Worker to your account, pair both phones, and test with real devices.
4. Optional photo sync.

## TikTok import, cookbook export and family recipes (same phase)
- **TikTok import:** the same Worker fetches TikTok's public oEmbed caption for a link you paste and pre-fills the add-recipe form for you to review. No scraping.
- **Cookbook export:** done fully on the phone as a print layout saved to PDF. No service needed.
- **Family recipes:** use personal recipes and photos and sync like everything else.
