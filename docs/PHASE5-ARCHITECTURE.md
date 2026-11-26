# Phase 5 (connected household): architecture options

**Status: proposal only. Nothing in this document is implemented. Each option below needs your approval before any account, service or data sharing is set up.**

Today Rose's EATS is device-local. Data lives in the browser on each phone, and the only way to share it is the backup file.

The client-side passcode is **not** authentication. It is checked in the page and can be bypassed. Any remote storage needs real authentication, or encryption with a key that never leaves the phones.

## What needs to sync
- Pantry and inventory.
- Grocery list and checks.
- Meal plan.
- Favorites, collections and ratings.
- Cooking history.
- Personal photos (large).
- Personal recipes and versions.

Most of this is small: well under 1 MB of JSON. Photos are the exception, at tens of MB.

## Options compared

| | A. Local + file sharing (today) | B. Peer-to-peer sync (WebRTC) | C. Encrypted relay (Cloudflare Worker + KV/R2) | D. Hosted backend (Supabase or Firebase) |
|---|---|---|---|---|
| Cost | Free | Free (needs a small signaling server, or manual QR pairing) | Free tier (100k requests/day, 1 GB KV; R2 10 GB) | Free tier (Supabase: 500 MB DB, 1 GB files; Firebase Spark similar) |
| Authentication | None needed | Pairing code / QR between the two phones | A household passphrase derives an encryption key; the server only sees ciphertext | Real accounts (email magic link or Apple sign-in) |
| Privacy | Best: nothing leaves the phone | Data goes phone to phone only | Server stores encrypted blobs it can't read | Provider stores readable data under its privacy policy |
| Security risks | Lost phone = lost data without backups | Pairing must be done carefully | Passphrase strength is the whole defense | Misconfigured row-level security can leak data |
| Offline | Full | Full; syncs when both phones are online at the same time | Full; syncs whenever online | Full with a local cache; syncs when online |
| Conflict resolution | Manual (last import wins) | Per-record timestamps or a CRDT (e.g. Automerge, about 100 KB) | Same as B | Same as B, or server-side last-write-wins |
| Data ownership | Yours | Yours | Yours, stored on your Cloudflare account | Stored with the provider; exportable |
| Storage limits | Browser quota | Browser quota | KV value 25 MB; R2 for photos | Free-tier quotas |
| Maintenance | None | Low, but WebRTC on iOS Safari is fiddly | Low: one small worker script | Medium: schema, auth and security rules |
| Backup and recovery | Manual export | Each phone is a backup of the other | Server copy plus exports | Provider backups plus exports |
| iPhone | Works | Works in Safari; Home Screen apps can't keep connections open in the background | Works | Works |

## Recommendation
**Option C, an end-to-end encrypted relay.** It is the best fit for a two-person household with privacy priorities and no recurring cost.
- Both phones derive an encryption key from a household passphrase using PBKDF2 or Argon2 in the browser.
- The app uploads encrypted change records to a small Cloudflare Worker you own, and downloads the other phone's records.
- Records merge with per-record timestamps; a CRDT is only needed if simultaneous edits become a problem.
- Photos go to R2 encrypted, or stay local with an optional sync setting.
- Cost: $0 on the free tier for this volume. Needs a Cloudflare account (your approval) and about 150 lines of Worker code.

If you prefer a managed login over a passphrase, Option D (Supabase) is the runner-up, with row-level security limited to your household.

## Other Phase 5 items
- **TikTok importing.** TikTok has no public recipe API. The public oEmbed endpoint returns the video caption only, and it can't be called directly from the browser, so it needs the same relay worker as a proxy. Captions often lack quantities, so imports would open the existing "add a recipe" form pre-filled for review. Scraping video pages is against TikTok's terms and won't be done.
- **Family recipe collection.** Reuses personal recipes and photos and syncs through the chosen option. Handwritten cards would be photographed and typed in. On-device text recognition isn't available on iPhone for web apps.
- **Personal cookbook export.** Can be done fully offline with no service: a print stylesheet saved as PDF from Safari's share sheet.

## Decisions needed from you
1. Choose Option C, D, or stay local-only (A).
2. If C or D: approve creating the Cloudflare or Supabase account.
3. Whether personal photos should sync at all, or stay on each phone.
