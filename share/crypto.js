/* Rose's EATS household sharing: cryptography. Web Crypto only (no third-party code). Reused from the Phase 5 sync
   engine (branch dev/phase5, tag v5.0-sync-candidate) with the relay, signature and key-exchange parts removed.
   AES-256-GCM (96-bit random nonce, 128-bit tag, file header bound as additional authenticated data),
   HKDF-SHA-256 key derivation, SHA-256, and the standard BIP-39 English mnemonic encoding (128 or 256 bits of
   entropy; only the mnemonic encoding is used, not the BIP-39 PBKDF2 seed step). See docs/PHASE5A-SHARING.md. */
"use strict";
const RC = (() => {
  const sub = crypto.subtle, te = new TextEncoder(), td = new TextDecoder();
  const u8 = x => typeof x === "string" ? te.encode(x) : x instanceof Uint8Array ? x : new Uint8Array(x);
  const rand = n => crypto.getRandomValues(new Uint8Array(n));
  const b64 = x => { const a = u8(x); let s = ""; for (let i = 0; i < a.length; i += 32768) s += String.fromCharCode.apply(null, a.subarray(i, i + 32768)); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
  const unb64 = s => { if (typeof s !== "string" || !/^[A-Za-z0-9_-]*$/.test(s)) throw new Error("bad encoding"); s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; const b = atob(s), o = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) o[i] = b.charCodeAt(i); return o; };
  const hex = x => [...u8(x)].map(b => b.toString(16).padStart(2, "0")).join("");
  /* canonical JSON: sorted keys, so hashes and additional data never depend on property order */
  const canon = v => v === null || typeof v !== "object" ? JSON.stringify(v) : Array.isArray(v) ? "[" + v.map(canon).join(",") + "]" : "{" + Object.keys(v).sort().filter(k => v[k] !== undefined).map(k => JSON.stringify(k) + ":" + canon(v[k])).join(",") + "}";
  const sha256 = async x => new Uint8Array(await sub.digest("SHA-256", u8(x)));
  const hkdf = async (ikm, salt, info, bits = 256) => new Uint8Array(await sub.deriveBits({ name: "HKDF", hash: "SHA-256", salt: u8(salt), info: u8(info) }, await sub.importKey("raw", u8(ikm), "HKDF", false, ["deriveBits"]), bits));
  const aesKey = (raw, extractable = false) => sub.importKey("raw", u8(raw), { name: "AES-GCM" }, extractable, ["encrypt", "decrypt"]);
  async function seal(key, plain, aad) { const n = rand(12); const ct = await sub.encrypt({ name: "AES-GCM", iv: n, additionalData: u8(aad), tagLength: 128 }, key, u8(plain)); return { n: b64(n), ct: b64(ct) }; }
  async function open(key, box, aad) { return new Uint8Array(await sub.decrypt({ name: "AES-GCM", iv: unb64(box.n), additionalData: u8(aad), tagLength: 128 }, key, unb64(box.ct))); }
  /* BIP-39: ENT bits of entropy + first ENT/32 bits of SHA-256(entropy) as checksum, split into 11-bit word indexes.
     16 bytes -> 12 words (household code), 32 bytes -> 24 words. Checked against the official test vectors. */
  async function toWords(ent) {
    ent = u8(ent); if (ent.length !== 16 && ent.length !== 32) throw new Error("need 16 or 32 bytes");
    const cs = ent.length / 4, h = await sha256(ent), bits = [...ent].map(b => b.toString(2).padStart(8, "0")).join("") + h[0].toString(2).padStart(8, "0").slice(0, cs);
    return Array.from({ length: bits.length / 11 }, (_, i) => BIP39[parseInt(bits.slice(i * 11, i * 11 + 11), 2)]).join(" ");
  }
  async function fromWords(m, want) {
    const w = String(m || "").trim().toLowerCase().split(/[\s,.-]+/).filter(Boolean); if (want && w.length !== want) throw new Error("Enter all " + want + " words");
    if (w.length !== 12 && w.length !== 24) throw new Error("Enter all 12 words");
    const idx = w.map(x => BIP39.indexOf(x)); const bad = idx.findIndex(i => i < 0); if (bad >= 0) throw new Error("Word " + (bad + 1) + " (\"" + w[bad].slice(0, 12) + "\") isn't on the word list");
    const bits = idx.map(i => i.toString(2).padStart(11, "0")).join(""), n = w.length * 11 * 32 / 33 / 8, ent = new Uint8Array(n);
    for (let i = 0; i < n; i++) ent[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
    const cs = n / 4; if ((await sha256(ent))[0].toString(2).padStart(8, "0").slice(0, cs) !== bits.slice(n * 8)) throw new Error("These words don't check out. Check each word and the order.");
    return ent;
  }
  /* gzip where the browser supports it (Safari 16.4+); files say whether they are compressed */
  const canZip = typeof CompressionStream === "function";
  async function pipe(data, stream) { const r = new Blob([data]).stream().pipeThrough(stream); return new Uint8Array(await new Response(r).arrayBuffer()); }
  const zip = d => pipe(u8(d), new CompressionStream("gzip")), unzip = d => pipe(u8(d), new DecompressionStream("gzip"));
  const id = (n = 16) => b64(rand(n));
  return { u8, rand, b64, unb64, hex, canon, sha256, hkdf, aesKey, seal, open, toWords, fromWords, canZip, zip, unzip, id, te, td };
})();
