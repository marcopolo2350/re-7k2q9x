/* Rose's EATS sync: cryptography. Web Crypto only (no third-party code).
   AES-256-GCM (96-bit random nonce, 128-bit tag, header bound as AAD), ECDSA P-256/SHA-256 signatures,
   ECDH P-256 + HKDF-SHA-256 key wrapping, HMAC-SHA-256, BIP-39 mnemonic encoding of 256-bit entropy.
   See docs/PHASE5-SPEC.md section B1. */
"use strict";
const RC = (() => {
  const sub = crypto.subtle, te = new TextEncoder(), td = new TextDecoder();
  const u8 = x => typeof x === "string" ? te.encode(x) : x instanceof Uint8Array ? x : new Uint8Array(x);
  const rand = n => crypto.getRandomValues(new Uint8Array(n));
  const b64 = x => { const a = u8(x); let s = ""; for (let i = 0; i < a.length; i++) s += String.fromCharCode(a[i]); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
  const unb64 = s => { if (typeof s !== "string" || !/^[A-Za-z0-9_-]*$/.test(s)) throw new Error("bad encoding"); s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; const b = atob(s), o = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) o[i] = b.charCodeAt(i); return o; };
  const cat = (...a) => { const o = new Uint8Array(a.reduce((n, x) => n + x.length, 0)); let p = 0; for (const x of a) { o.set(x, p); p += x.length; } return o; };
  /* canonical JSON: sorted keys, so signatures do not depend on property order */
  const canon = v => v === null || typeof v !== "object" ? JSON.stringify(v) : Array.isArray(v) ? "[" + v.map(canon).join(",") + "]" : "{" + Object.keys(v).sort().filter(k => v[k] !== undefined).map(k => JSON.stringify(k) + ":" + canon(v[k])).join(",") + "}";
  const sha256 = async x => new Uint8Array(await sub.digest("SHA-256", u8(x)));
  const hkdf = async (ikm, salt, info, bits = 256) => new Uint8Array(await sub.deriveBits({ name: "HKDF", hash: "SHA-256", salt: u8(salt), info: u8(info) }, await sub.importKey("raw", u8(ikm), "HKDF", false, ["deriveBits"]), bits));
  const aesKey = (raw, extractable = false) => sub.importKey("raw", u8(raw), { name: "AES-GCM" }, extractable, ["encrypt", "decrypt"]);
  const hkdfAes = async (ikm, salt, info) => aesKey(await hkdf(ikm, salt, info));
  async function seal(key, plain, aad) { const n = rand(12); const ct = await sub.encrypt({ name: "AES-GCM", iv: n, additionalData: u8(aad), tagLength: 128 }, key, u8(plain)); return { n: b64(n), ct: b64(ct) }; }
  async function open(key, box, aad) { return new Uint8Array(await sub.decrypt({ name: "AES-GCM", iv: unb64(box.n), additionalData: u8(aad), tagLength: 128 }, key, unb64(box.ct))); }
  /* length padding to 256-byte buckets so the relay learns less from ciphertext sizes */
  const pad = s => { const b = te.encode(s), L = Math.ceil((b.length + 4) / 256) * 256, o = new Uint8Array(L); new DataView(o.buffer).setUint32(0, b.length); o.set(b, 4); return o; };
  const unpad = u => { const n = new DataView(u.buffer, u.byteOffset, u.byteLength).getUint32(0); if (n > u.length - 4) throw new Error("bad padding"); return td.decode(u.subarray(4, 4 + n)); };
  /* keys */
  const genHK = () => sub.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
  const genSign = (ext = false) => sub.generateKey({ name: "ECDSA", namedCurve: "P-256" }, ext, ["sign", "verify"]);
  const genDH = (ext = false) => sub.generateKey({ name: "ECDH", namedCurve: "P-256" }, ext, ["deriveBits"]);
  const pubJwk = async k => { const j = await sub.exportKey("jwk", k); return { kty: j.kty, crv: j.crv, x: j.x, y: j.y }; };
  const okJwk = j => j && j.kty === "EC" && j.crv === "P-256" && typeof j.x === "string" && typeof j.y === "string" && j.x.length === 43 && j.y.length === 43 && !j.d;
  const impSign = j => { if (!okJwk(j)) throw new Error("bad key"); return sub.importKey("jwk", { kty: "EC", crv: "P-256", x: j.x, y: j.y, ext: true }, { name: "ECDSA", namedCurve: "P-256" }, true, ["verify"]); };
  const impDH = j => { if (!okJwk(j)) throw new Error("bad key"); return sub.importKey("jwk", { kty: "EC", crv: "P-256", x: j.x, y: j.y, ext: true }, { name: "ECDH", namedCurve: "P-256" }, true, []); };
  const sign = async (priv, msg) => b64(await sub.sign({ name: "ECDSA", hash: "SHA-256" }, priv, u8(msg)));
  async function verify(pub, sig, msg) { try { const k = pub && pub.type === "public" ? pub : await impSign(pub); return await sub.verify({ name: "ECDSA", hash: "SHA-256" }, k, unb64(sig), u8(msg)); } catch (e) { return false; } }
  const hmacKey = raw => sub.importKey("raw", u8(raw), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
  const hmac = async (raw, msg) => b64(await sub.sign("HMAC", await hmacKey(raw), u8(msg)));
  async function hmacOk(raw, mac, msg) { try { return await sub.verify("HMAC", await hmacKey(raw), unb64(mac), u8(msg)); } catch (e) { return false; } }
  /* ECDH key wrap: shared secret -> HKDF(salt "RE1 wrap", info = context) -> AES-256-GCM, context also bound as AAD */
  async function wrapFor(myDHPriv, theirDHPub, raw, ctx) { const ss = await sub.deriveBits({ name: "ECDH", public: await impDH(theirDHPub) }, myDHPriv, 256); return seal(await hkdfAes(new Uint8Array(ss), "RE1 wrap", ctx), raw, ctx); }
  async function unwrapFrom(myDHPriv, theirDHPub, box, ctx) { const ss = await sub.deriveBits({ name: "ECDH", public: await impDH(theirDHPub) }, myDHPriv, 256); return open(await hkdfAes(new Uint8Array(ss), "RE1 wrap", ctx), box, ctx); }
  const rawKey = async k => new Uint8Array(await sub.exportKey("raw", k));
  /* BIP-39: 256 bits of entropy + first 8 bits of SHA-256(entropy) as checksum = 264 bits = 24 words of 11 bits.
     Only the mnemonic encoding is used; the BIP-39 PBKDF2 seed step is not (the entropy is already a uniform 256-bit secret). */
  async function toWords(ent) { ent = u8(ent); if (ent.length !== 32) throw new Error("need 32 bytes"); const h = await sha256(ent); const bits = [...ent, h[0]].map(b => b.toString(2).padStart(8, "0")).join(""); return Array.from({ length: 24 }, (_, i) => BIP39[parseInt(bits.slice(i * 11, i * 11 + 11), 2)]).join(" "); }
  async function fromWords(m) {
    const w = String(m || "").trim().toLowerCase().split(/\s+/); if (w.length !== 24) throw new Error("Enter all 24 words");
    const idx = w.map(x => BIP39.indexOf(x)); const bad = idx.findIndex(i => i < 0); if (bad >= 0) throw new Error("Word " + (bad + 1) + " isn't on the recovery word list");
    const bits = idx.map(i => i.toString(2).padStart(11, "0")).join(""), ent = new Uint8Array(32); for (let i = 0; i < 32; i++) ent[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
    if ((await sha256(ent))[0] !== parseInt(bits.slice(256), 2)) throw new Error("These words don't check out. Check each word and its order."); return ent;
  }
  /* recovery identity: random ECDH + ECDSA pairs whose private halves are sealed under a key derived from the 24 words.
     Devices keep only the public halves, so a lost phone cannot use the recovery identity. */
  async function newRecovery() {
    const rs = rand(32), words = await toWords(rs), dh = await genDH(true), sg = await genSign(true);
    const box = await seal(await hkdfAes(rs, "RE1 recovery", "seal"), JSON.stringify({ dh: await sub.exportKey("jwk", dh.privateKey), sg: await sub.exportKey("jwk", sg.privateKey) }), "RE1 recovery-keys");
    const auth = b64(await hkdf(rs, "RE1 recovery", "relay-auth"));
    return { words, pub: { dh: await pubJwk(dh.publicKey), sg: await pubJwk(sg.publicKey) }, box, verifier: b64(await sha256(auth)) };
  }
  async function recoveryAuth(words) { return b64(await hkdf(await fromWords(words), "RE1 recovery", "relay-auth")); }
  async function openRecovery(words, box) {
    const rs = await fromWords(words); let p;
    try { p = JSON.parse(td.decode(await open(await hkdfAes(rs, "RE1 recovery", "seal"), box, "RE1 recovery-keys"))); } catch (e) { throw new Error("These recovery words don't belong to this household"); }
    return { dh: await sub.importKey("jwk", p.dh, { name: "ECDH", namedCurve: "P-256" }, false, ["deriveBits"]), sg: await sub.importKey("jwk", p.sg, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]) };
  }
  /* encrypted household backup file, independent of the relay: key = HKDF(recovery entropy, "RE1 backup") */
  async function backupKey(words) { return hkdfAes(await fromWords(words), "RE1 backup", "file"); }
  /* pairing: invite secret (256 bits) -> separate keys for relay auth (bearer, single use), join MAC, and SAS */
  async function inviteKeys(secret) { return { auth: b64(await hkdf(secret, "RE1 invite", "relay-auth")), mac: await hkdf(secret, "RE1 invite", "join-mac") }; }
  async function sas(secret, pubs) { const h = await sha256(cat(u8(secret), te.encode(canon(pubs)))); return String(((h[0] << 16) | (h[1] << 8) | h[2]) % 1000000).padStart(6, "0"); }
  const id = (n = 16) => b64(rand(n));
  return { u8, rand, b64, unb64, canon, sha256, hkdf, aesKey, seal, open, pad, unpad, genHK, genSign, genDH, pubJwk, okJwk, impSign, sign, verify, hmac, hmacOk, wrapFor, unwrapFrom, rawKey, toWords, fromWords, newRecovery, recoveryAuth, openRecovery, backupKey, inviteKeys, sas, id, te, td };
})();
