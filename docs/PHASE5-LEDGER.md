# Phase 5 implementation ledger (branch `dev/phase5`)

Production baseline: `5150ef3` (tag `v3.1-closure`), with photo batches on `main` since then. Nothing on this branch is deployed; GitHub Pages serves `main` only.

| Stage | What exists | Evidence |
|---|---|---|
| **1. Local data model** | `sync/model.js` (records, ID scheme, merge registers, validation), `sync/store.js` (one IndexedDB transaction per change), `sync/app-hook.js` (local tracking, off by default, no relay, no network) | 15 tests (`s1-*`): round trip of 16 collections, single-field ops, atomic writes under storage-full and crash, pickup after closing, idempotence, additive migration, failed upgrade, recovery after the merge, real-app tracking with 0 network calls, backup restore without resurrection |
| **2. Simulated multi-device sync** | `sync/relay-sim.js`, `sync/engine.js` (capture, push, pull, merge, projection, conflicts, resolve) | 24 tests (`s2-*`): Rose and Marco offline in both orders; grocery quantity and checkbox, pantry, plan, collections, versions, history, notes and photo conflicts; deletes; long-offline phone; duplicates and reordering; interrupted upload and download; 450-change catch-up; relay down; relay data loss; newer schema parked; lost cursor |
| **3. Cryptography and pairing** | `sync/crypto.js`, `sync/bip39.js`; pairing, approval, revocation, rotation and recovery in the engine | 25 tests (`s3-*`): round trip, wrong key, tampering, 5,000 unique nonces, BIP-39 vectors, comparison code, approval gate, expiry, reuse, cancellation, wrong credential, key substitution, outsider, bad signature, replay and stale requests, rogue op, revocation and rotation, offline catch-up, recovery from words, wrong words, no plaintext or keys at the relay, no secrets in diagnostics |
| **4. Recovery and security validation** | Content Security Policy in `index.html`; `rebuild()`, `encryptedBackup()`, resumable rotation | 22 tests (`s4-*`): corrupted messages; 10 malicious payload types; XSS text; oversized requests and ops; cross-household access; interrupted rotation; interrupted pairing; storage-full during merge; encrypted backup without relay; corrupted local store; CSP; same-origin scripts; restore safeguard |

**Totals:** 86/86 sync tests pass, and the existing regression passes 88/88 on this branch with the sync code loaded and the CSP active (desktop Chromium, local preview).

**Commits:**
- `5df8747`: Stages 1–4 code and tests. They were built together because one engine serves all four stages.
- `85178d5`: merge of `main` (photo batch 1).
- `aa72ced`: CSP and client-security tests.
- Documentation commit: follows.

**Not yet done:**
- **UI.** Setup preview, QR, conflict screen, status chip.
- **Cooking-note photo sync.**
- **Op-log compaction.** Required before Stage 5.
- **Worker port.** Stage 5, needs approval.
- **Physical-device testing.**
