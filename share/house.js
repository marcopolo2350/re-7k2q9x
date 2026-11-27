/* Rose's EATS household sharing engine (Phase 5A). No server: phones exchange encrypted files by AirDrop, Messages or
   the share sheet, and importing merges them with the record model from the Phase 5 sync engine (see model.js).
   o = { db, state: { get(), set(S, json) -> bool (persisted?), raw() -> saved JSON text, gen() -> edit counter },
         photos: { get(k), put(k, v) } (the app's IndexedDB photo store), now }.
   Consistency (see docs/PHASE5A-SHARING.md, "Local consistency"):
   - The app state in localStorage is the source of truth for this phone's own edits. Records are derived from it by
     diffing (capture), in one IndexedDB transaction, so an edit saved just before the app closed is captured next time.
   - An import or conflict decision changes both stores. It is written as a journal entry first; then the app state is
     saved; then the records are committed and the journal removed. On start, a journal whose state hash matches the
     saved app state is completed, otherwise it is discarded (the import simply did not happen and can be repeated).
   - Every operation runs under one lock, and an import restarts if the app state was edited while it was prepared.
   Nothing here logs file contents, codes or keys. */
"use strict";
class HouseShare {
  constructor(o) { this.o = o; this.st = new RStore.Store(o.db); this.now = o.now || (() => Date.now()); this.T = {}; this._q = Promise.resolve(); }
  static err(msg, code) { return Object.assign(new Error(msg), { code: code || "share" }); }
  lock(fn) { const p = this._q.then(() => fn()); this._q = p.catch(() => {}); return p; }
  /* ---------- setup ---------- */
  async init() {
    let dev = await this.st.get("meta", "dev"); if (!dev) { dev = { id: RC.id(16) }; await this.st.put("meta", dev, "dev"); }
    this.dev = dev; this.journal = await this._journal(); return this;
  }
  async meta() { return this.st.tx(["meta"], "readonly", async s => { const m = {}; for (const k of await s.meta.keys()) m[k] = await s.meta.get(k); return m; }); }
  async setMeta(o) { return this.st.tx(["meta"], "readwrite", async s => { for (const [k, v] of Object.entries(o)) await (v === undefined ? s.meta.del(k) : s.meta.put(v, k)); }); }
  async household() { const m = await this.meta(); return m.hh ? { id: m.hh.id, check: HouseShare.check(m.hh.id), member: m.member, since: m.hh.since, peers: m.peers || {}, lastExport: m.lastExport || null, lastImport: m.lastImport || null } : null; }
  /* 4-digit household check number: both phones show the same one when they typed the same code (the 12-word
     checksum is only 4 bits, so a swapped or wrong word is caught 15 times in 16; this catches the rest) */
  static check(hh) { return String(parseInt(String(hh).slice(0, 8), 16) % 10000).padStart(4, "0"); }
  static async keysFor(code) { return { hh: RC.hex(await RC.hkdf(code, "RE share 1", "household id", 64)), hk: await RC.aesKey(await RC.hkdf(code, "RE share 1", "file key")) }; }
  async _setCode(code, member, keepOld) {
    const k = await HouseShare.keysFor(code), m = await this.meta(), old = (await this.st.get("keys", "old")) || [];
    if (keepOld && m.hh && m.hh.id !== k.hh) old.push({ hh: m.hh.id, hk: await this.st.get("keys", "hk"), until: this.now() });
    await this.st.tx(["keys", "meta"], "readwrite", async s => { await s.keys.put(code, "code"); await s.keys.put(k.hk, "hk"); await s.keys.put(old, "old"); await s.meta.put({ id: k.hh, since: this.now() }, "hh"); await s.meta.put(String(member || "Me").slice(0, 30), "member"); });
    await this.capture(); return k.hh;
  }
  /* first phone: a new random 128-bit household code, shown as 12 standard BIP-39 words */
  async setup(member) { const code = RC.rand(16); await this._setCode(code, member); return { words: await RC.toWords(code) }; }
  async join(words, member) { const code = await RC.fromWords(words, 12); return this._setCode(code, member, true); }
  async words() { const c = await this.st.get("keys", "code"); return c ? RC.toWords(c) : null; }
  /* lost phone or leaked code: a new code. Files made with the old code are refused unless the old code is entered. */
  async rotate() { const code = RC.rand(16), m = await this.meta(); await this._setCode(code, m.member, true); return { words: await RC.toWords(code) }; }
  async setMember(member) { await this.setMeta({ member: String(member).slice(0, 30) }); }
  /* turning sharing off removes only the sharing records and keys; the app's own data is untouched */
  async leave() { await this.lock(async () => { this.st.close(); await this.st.destroy(); this.st = new RStore.Store(this.o.db); }); }
  /* ---------- change capture: app state -> records, in one transaction ---------- */
  capture(opts) { return this.lock(() => this._captureTx(opts || {})); }
  async _captureTx(opts) {
    const m = await this.meta(); if (!m.hh) return { n: 0 }; if (m.journal) throw HouseShare.err("An import is still being finished", "journal");
    const S = this.o.state.get(); if (RM.ensureIds(S)) this.o.state.set(S);
    return this.st.tx(["rec", "meta"], "readwrite", s => this._capture(s, S, m, opts));
  }
  async _capture(s, S, m, opts) {
    const recs = new Map((await s.rec.all()).map(r => [r.k, r])), me = RM.encId(m.member), dev = this.dev.id;
    let lam = (await s.meta.get("lam")) || 0, ctr = (await s.meta.get("ctr")) || 0, n = 0; const skipped = [];
    const emit = async (r, f) => { const op = { v: 1, sv: RM.SV, id: dev + ":" + (++ctr), dev, c: ctr, l: ++lam, k: r.k, b: { ...r.vv }, f }; RM.apply(r, op); await s.rec.put(r); n++; };
    for (const [c, d] of Object.entries(RM.D)) {
      const pre = c + "/" + (d.own ? me + "/" : ""), seen = new Set();
      for (const [id, f] of d.from(S)) {
        const k = pre + RM.encId(id); if (!RM.keyOk(k)) continue; seen.add(k);
        let r = recs.get(k); const live = r && RM.present(r); let ch = {};
        if (!live) { if (r && opts.noResurrect) { skipped.push(k); continue; } ch = { ...f }; if (r) ch._del = false; }
        else { const v = RM.value(r); for (const x of new Set([...Object.keys(f), ...Object.keys(v)])) { const a = f[x] === undefined ? null : f[x], b = v[x] === undefined ? null : v[x]; if (RM.canon(a) !== RM.canon(b)) ch[x] = a; } }
        if (!Object.keys(ch).length) continue;
        if (!r) { r = { k, c, f: {}, vv: {} }; recs.set(k, r); }
        await emit(r, ch);
      }
      if (!d.grow) for (const [k, r] of recs) if (r.c === c && k.startsWith(pre) && !seen.has(k) && RM.present(r)) await emit(r, { _del: true });
    }
    await s.meta.put(lam, "lam"); await s.meta.put(ctr, "ctr"); return { n, skipped };
  }
  /* ---------- projection: records -> app state ---------- */
  _project(S, recs, cats, member) {
    const me = RM.encId(member), by = {};
    for (const r of recs) if (RM.present(r)) (by[r.c] = by[r.c] || []).push(r);
    const own = c => (by[c] || []).filter(r => !RM.D[c].own || r.k.split("/")[1] === me).sort((a, b) => (a.cl || 0) - (b.cl || 0))
      .map(r => [RM.decId(RM.D[c].own ? r.k.split("/")[2] : r.k.slice(c.length + 1)), RM.value(r)]).filter(e => Object.keys(e[1]).length);
    for (const [c, d] of Object.entries(RM.D)) {
      if (!cats.has(d.cat)) continue;
      d.to(S, own(c), own);
      if (d.own && c !== "photo") { /* other members' shared personal items, kept apart in S.hh[collection][member] (photos stay in the records) */
        const per = {}; for (const r of by[c] || []) { const [, mem, id] = r.k.split("/"); if (mem === me) continue; const v = RM.value(r); if (Object.keys(v).length) (per[RM.decId(mem)] = per[RM.decId(mem)] || []).push([RM.decId(id), v]); }
        const o = {}; for (const [mem, E] of Object.entries(per)) { const t = {}; d.to(t, E, () => []); o[mem] = Object.values(t)[0]; } S.hh = S.hh || {}; S.hh[c] = o;
      }
    }
    if (cats.has("pantry") && typeof INV !== "undefined") INV.refresh(S);
  }
  /* ---------- two-store commit with a journal ---------- */
  async _commit(changed, S2, lam, info) {
    const json = JSON.stringify(S2), h = RC.b64(await RC.sha256(json));
    const j = { recs: [...changed.values()], h, lam, info: info || {}, at: this.now() };
    await this.setMeta({ journal: j });
    if (this.T.crash === "afterJournal") { this.T.crash = 0; throw HouseShare.err("app closed (simulated)", "crash"); }
    if (this.o.state.gen() !== this._g0) { await this.setMeta({ journal: undefined }); return "retry"; }
    if (!this.o.state.set(S2, json)) { await this.setMeta({ journal: undefined }); throw HouseShare.err("There isn't enough storage space on this phone. Nothing was changed.", "quota"); }
    if (this.T.crash === "afterState") { this.T.crash = 0; throw HouseShare.err("app closed (simulated)", "crash"); }
    await this._finish(j); return "done";
  }
  async _finish(j) {
    await this.st.tx(["rec", "meta"], "readwrite", async s => {
      for (const r of j.recs) await s.rec.put(r);
      await s.meta.put(Math.max((await s.meta.get("lam")) || 0, j.lam || 0), "lam");
      if (j.info.file) { const imp = (await s.meta.get("imported")) || {}; imp[j.info.file] = j.at; await s.meta.put(imp, "imported"); await s.meta.put({ at: j.at, from: j.info.from || "" }, "lastImport"); }
      if (j.info.peer) { const p = (await s.meta.get("peers")) || {}; p[j.info.peer.dev] = j.info.peer; await s.meta.put(p, "peers"); }
      await s.meta.del("journal");
    });
  }
  /* interrupted import or decision: finish it if the app state was already saved, otherwise forget it */
  async _journal() {
    const j = await this.st.get("meta", "journal"); if (!j) return null;
    const raw = this.o.state.raw(); const same = raw != null && RC.b64(await RC.sha256(raw)) === j.h;
    if (same) { await this._finish(j); return "completed"; }
    await this.setMeta({ journal: undefined }); return "discarded";
  }
  /* ---------- export ---------- */
  async _attOut(v, att) { if (typeof v === "string" && v.startsWith("data:") && v.length > 4096) { const h = RC.b64(await RC.sha256(v)); att[h] = v; return { att: h }; } return v; }
  /* o = { kind, cats: [category], picks: { collection: [app ids] }, allPersonal, includeOthers, allPhotos } */
  exportFile(o) {
    return this.lock(async () => {
      await this._captureTx({}); const m = await this.meta(); if (!m.hh) throw HouseShare.err("Set up household sharing first");
      const hk = await this.st.get("keys", "hk"), me = RM.encId(m.member), cats = new Set(o.cats || []), picks = o.picks || {}, sent = { ...(m.sent || {}) };
      const out = [], att = {}, idb = {}, cnt = {};
      for (const r of await this.st.all("rec")) {
        const d = RM.D[r.c]; if (!d || !cats.has(d.cat)) continue;
        if (d.own) { const [, mem, id] = r.k.split("/"); if (mem === me) { if (!o.allPersonal && !(picks[r.c] || []).map(String).includes(RM.decId(id))) continue; } else if (!o.includeOthers) continue; }
        const dots = RM.canon(Object.values(r.f).flat().map(h => h.d));
        if (r.c === "photo" && !o.allPhotos && sent[r.k] === dots) continue; /* unchanged photo already sent */
        const f = {}; for (const [fk, hs] of Object.entries(r.f)) { f[fk] = []; for (const h of hs) f[fk].push({ ...h, v: await this._attOut(h.v, att) }); }
        if (r.c === "hist" && this.o.photos && (o.allPhotos || sent[r.k] !== dots)) for (const hs of Object.values(r.f)) for (const h of hs) for (const pk of (h.v && Array.isArray(h.v.ph) ? h.v.ph : [])) { try { const data = await this.o.photos.get(pk); if (typeof data === "string" && data.startsWith("data:image/")) { const h = RC.b64(await RC.sha256(data)); att[h] = data; idb[pk] = h; } } catch (e) {} }
        if (r.c === "photo" || r.c === "hist") sent[r.k] = dots;
        out.push({ k: r.k, f, vv: r.vv, cl: r.cl }); cnt[d.cat] = (cnt[d.cat] || 0) + 1;
      }
      const seq = (m.seq || 0) + 1, inner = { v: 1, sv: RM.SV, kind: o.kind || "changes", created: this.now(), from: { dev: this.dev.id, member: m.member }, seq, cats: [...cats], recs: out, att, idb };
      const json = JSON.stringify(inner), z = RC.canZip ? 1 : 0, data = z ? await RC.zip(json) : RC.te.encode(json), id = RC.id(12);
      const box = await RC.seal(hk, data, "RE-SHARE1|" + m.hh.id + "|" + id + "|" + z);
      const file = { app: "Rose's EATS", format: "RE-SHARE1", note: "Encrypted household file. Open it in Rose's EATS: Settings, Household sharing, Open a household file.", hh: m.hh.id, id, z, n: box.n, ct: box.ct };
      /* nothing is marked as sent yet: only confirmSent(), called after the share sheet or download succeeded, does that,
         so a cancelled or failed share never causes a photo to be skipped next time */
      const mark = {}; if (o.kind !== "backup") for (const [k, v] of Object.entries(sent)) if ((m.sent || {})[k] !== v) mark[k] = v;
      return { text: JSON.stringify(file), id, counts: cnt, photos: Object.keys(att).length, pend: { seq, mark, kind: o.kind || "changes" } };
    });
  }
  confirmSent(f) {
    return this.lock(async () => { const m = await this.meta(), p = f && f.pend; if (!p) return; await this.setMeta({ seq: Math.max(m.seq || 0, p.seq), sent: { ...(m.sent || {}), ...p.mark }, lastExport: { at: this.now(), kind: p.kind } }); });
  }
  /* ---------- import: decrypt, validate, preview (nothing is written) ---------- */
  readFile(text, opt) {
    return this.lock(async () => {
      const E = HouseShare.err; if (typeof text !== "string" || text.length > 90e6) throw E("This file is too large to be a household file.");
      let o; try { o = JSON.parse(text); } catch (e) { throw E("This isn't a Rose's EATS household file."); }
      if (!o || o.format !== "RE-SHARE1" || typeof o.hh !== "string" || typeof o.id !== "string" || typeof o.ct !== "string") { if (o && o.app === "Rose's EATS" && o.state) throw E("This is a full backup file. Restore it from Settings, Backup & restore."); throw E("This isn't a Rose's EATS household file."); }
      const m = await this.meta(); if (!m.hh) throw E("Set up household sharing first (Settings, Household sharing).");
      let key = null, old = false;
      if (o.hh === m.hh.id) key = await this.st.get("keys", "hk");
      else if (opt && opt.words) { const k = await HouseShare.keysFor(await RC.fromWords(opt.words, 12)); if (k.hh !== o.hh) throw E("Those words don't open this file."); key = k.hk; old = true; }
      else { const x = ((await this.st.get("keys", "old")) || []).find(y => y.hh === o.hh); if (x) { key = x.hk; old = true; } }
      if (!key) throw E("This file was made with a different household code (another household, or a code that has since been changed).", "otherhh");
      let data; try { data = await RC.open(key, o, "RE-SHARE1|" + o.hh + "|" + o.id + "|" + (o.z ? 1 : 0)); } catch (e) { throw E("This file is damaged or was changed after it was made. Nothing was imported.", "tamper"); }
      let inner; try { inner = JSON.parse(RC.td.decode(o.z ? await RC.unzip(data) : data)); } catch (e) { throw E("This file is damaged. Nothing was imported.", "tamper"); }
      if (!inner || inner.v !== 1 || !Array.isArray(inner.recs) || !Array.isArray(inner.cats) || inner.recs.length > 60000 || !inner.from || typeof inner.from.member !== "string") throw E("This file is damaged. Nothing was imported.", "tamper");
      if (!Number.isInteger(inner.sv) || inner.sv > RM.SV) throw E("This file was made by a newer version of Rose's EATS. Update the app on this phone (close and reopen it), then try again.", "newer");
      const ops = this._opsFrom(inner), preview = await this._dry(ops, m);
      const imp = m.imported || {}, peer = (m.peers || {})[inner.from.dev];
      return { file: o.id, old, from: { member: String(inner.from.member).slice(0, 30), dev: inner.from.dev, mine: RM.encId(inner.from.member) === RM.encId(m.member) }, kind: String(inner.kind || "changes"), created: inner.created, seq: inner.seq, ops, idb: inner.idb || {}, att: inner.att || {}, preview, dup: !!imp[o.id], gap: !!(peer && inner.seq > peer.seq + 1) };
    });
  }
  _opsFrom(inner) {
    const E = HouseShare.err, att = inner.att && typeof inner.att === "object" ? inner.att : {}, cats = new Set(inner.cats), ops = new Map();
    const ATT = /^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/]+=*$/;
    for (const [h, v] of Object.entries(att)) if (typeof v !== "string" || v.length > 8e6 || !ATT.test(v)) throw E("This file contains a photo that isn't a valid image. Nothing was imported.", "badatt");
    const bad = why => E("This file contains invalid data (" + why + "). Nothing was imported.", "invalid");
    for (const rec of inner.recs) {
      if (!rec || !RM.keyOk(rec.k) || !rec.f || typeof rec.f !== "object" || Array.isArray(rec.f)) throw bad("record");
      const c = rec.k.split("/")[0]; if (!cats.has(RM.D[c].cat)) throw bad("category");
      for (const [fk, hs] of Object.entries(rec.f)) {
        if (!/^[A-Za-z_][A-Za-z0-9_]{0,30}$/.test(fk) || /^(__proto__|constructor|prototype)$/.test(fk) || !Array.isArray(hs) || hs.length > 50) throw bad("field");
        for (const h of hs) {
          if (!h || !Array.isArray(h.d) || h.d.length !== 2 || typeof h.d[0] !== "string" || !Number.isInteger(h.d[1])) throw bad("version");
          const id = h.d[0] + ":" + h.d[1], key = rec.k + "#" + id; let op = ops.get(key);
          if (!op) { op = { v: 1, sv: inner.sv, id, dev: h.d[0], c: h.d[1], l: h.l, k: rec.k, b: h.b, f: {} }; ops.set(key, op); }
          else if (op.l !== h.l || RM.canon(op.b) !== RM.canon(h.b)) throw bad("inconsistent version");
          op.f[fk] = h.v === undefined ? null : h.v;
        }
      }
    }
    const list = [...ops.values()];
    for (const op of list) {
      const why = RM.validOp(op); if (why) throw bad(why);
      for (const [fk, v] of Object.entries(op.f)) if (v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 1 && typeof v.att === "string") { if (!att[v.att]) throw bad("missing photo"); op.f[fk] = att[v.att]; }
      if (op.k.startsWith("itx/") && op.f.v != null && !INV.valid(op.f.v)) throw bad("pantry change");
      if (op.k.startsWith("photo/") && op.f.v != null && !(typeof op.f.v === "string" && ATT.test(op.f.v))) throw bad("photo");
    }
    return list.sort((a, b) => a.dev < b.dev ? -1 : a.dev > b.dev ? 1 : a.c - b.c);
  }
  async _dry(ops, m) {
    const recs = new Map((await this.st.all("rec")).map(r => [r.k, r])), me = RM.encId(m.member), work = new Map(), by = {};
    for (const op of ops) { let r = work.get(op.k); if (!r) { r = recs.has(op.k) ? structuredClone(recs.get(op.k)) : { k: op.k, c: op.k.split("/")[0], f: {}, vv: {} }; work.set(op.k, r); } RM.apply(r, op); }
    let conflicts = 0, total = 0, others = 0;
    for (const [k, r] of work) {
      const b = recs.get(k), d = RM.D[r.c], wasP = !!(b && RM.present(b)), isP = RM.present(r);
      const kind = !wasP && isP ? "add" : wasP && !isP ? "del" : wasP && isP && RM.canon(RM.value(b)) !== RM.canon(RM.value(r)) ? "chg" : null;
      if (!kind) continue; total++;
      const mem = d.own ? RM.decId(k.split("/")[1]) : null; if (mem != null && RM.encId(mem) !== me) others++;
      const g = by[d.cat] = by[d.cat] || { add: 0, chg: 0, del: 0, label: RM.CAT_LABEL[d.cat] }; g[kind]++;
      conflicts += RM.conflicts(r).length - (b ? RM.conflicts(b).length : 0);
    }
    return { byCat: by, total, conflicts: Math.max(0, conflicts), others };
  }
  /* ---------- import: apply ---------- */
  applyImport(p) {
    return this.lock(async () => {
      for (let attempt = 0; attempt < 3; attempt++) {
        await this._captureTx({}); this._g0 = this.o.state.gen();
        const m = await this.meta(), S2 = structuredClone(this.o.state.get()); RM.ensureIds(S2);
        const recs = new Map((await this.st.all("rec")).map(r => [r.k, r])), changed = new Map(); let lam = 0; const cats = new Set();
        for (const op of p.ops) { const r = changed.get(op.k) || (recs.has(op.k) ? structuredClone(recs.get(op.k)) : { k: op.k, c: op.k.split("/")[0], f: {}, vv: {} }); if (RM.apply(r, op)) { changed.set(op.k, r); cats.add(RM.D[r.c].cat); } lam = Math.max(lam, op.l); }
        const info = { file: p.file, from: p.from.member, peer: { dev: p.from.dev, member: p.from.member, seq: p.seq || 0, at: this.now() } };
        if (!changed.size) { await this.st.tx(["meta"], "readwrite", async s => { const imp = (await s.meta.get("imported")) || {}; imp[p.file] = this.now(); await s.meta.put(imp, "imported"); const pe = (await s.meta.get("peers")) || {}; pe[p.from.dev] = info.peer; await s.meta.put(pe, "peers"); }); return { changed: 0 }; }
        for (const [k, r] of changed) recs.set(k, r);
        /* photos from cooking history go to the app's photo store first (idempotent; another member's are kept apart) */
        if (this.o.photos) for (const [pk, h] of Object.entries(p.idb || {})) { const data = p.att[h]; if (!data || typeof pk !== "string" || pk.length > 200) continue; try { await this.o.photos.put(p.from.mine ? pk : "x:" + RM.encId(p.from.member) + ":" + pk, data); } catch (e) { throw HouseShare.err("There isn't enough storage space on this phone for the photos in this file. Nothing was changed.", "quota"); } }
        this._project(S2, [...recs.values()], cats, m.member);
        if (this.T.mid) { const f = this.T.mid; this.T.mid = null; f(); } /* test hook: the person edits something right now */
        const r = await this._commit(changed, S2, lam, info); if (r === "retry") continue;
        return { changed: changed.size, cats: [...cats] };
      }
      throw HouseShare.err("The app kept changing while importing. Try again.", "busy");
    });
  }
  /* ---------- conflicts ---------- */
  async conflicts() { const m = await this.meta(), me = RM.encId(m.member || ""); return (await this.st.all("rec")).filter(r => !RM.D[r.c].own || r.k.split("/")[1] === me).flatMap(r => RM.conflicts(r)); }
  resolve(k, field, value) { /* an explicit choice: a new write whose base covers every competing value */
    return this.lock(async () => {
      for (let attempt = 0; attempt < 3; attempt++) {
        await this._captureTx({}); this._g0 = this.o.state.gen();
        const m = await this.meta(), S2 = structuredClone(this.o.state.get()), all = new Map((await this.st.all("rec")).map(r => [r.k, r])), r0 = all.get(k); if (!r0) return false;
        const r = structuredClone(r0), lam = ((await this.st.get("meta", "lam")) || 0) + 1, ctr = ((await this.st.get("meta", "ctr")) || 0) + 1;
        const f = field === "_del" ? (value === "delete" ? { _del: true } : { ...RM.value(r), _del: false }) : { [field]: value };
        RM.apply(r, { v: 1, sv: RM.SV, id: this.dev.id + ":" + ctr, dev: this.dev.id, c: ctr, l: lam, k, b: { ...r.vv }, f }); all.set(k, r);
        await this.setMeta({ ctr }); this._project(S2, [...all.values()], new Set([RM.D[r.c].cat]), m.member);
        const res = await this._commit(new Map([[k, r]]), S2, lam, {}); if (res === "retry") continue; return true;
      }
      throw HouseShare.err("The app kept changing. Try again.", "busy");
    });
  }
  /* ---------- items other members shared (read straight from the records) ---------- */
  async received() {
    const m = await this.meta(), me = RM.encId(m.member || ""), out = [];
    for (const r of await this.st.all("rec")) { const d = RM.D[r.c]; if (!d.own || !RM.present(r)) continue; const [, mem, id] = r.k.split("/"); if (mem === me) continue; out.push({ member: RM.decId(mem), c: r.c, id: RM.decId(id), v: RM.value(r) }); }
    return out;
  }
  /* restoring an old full backup on this phone: what the household records already know stays as recorded (it is
     newer or equal); only items the records have never seen come from the backup, and they are then captured */
  afterAppRestore() {
    return this.lock(async () => {
      const m = await this.meta(); if (!m.hh) return { kept: 0 };
      const S = this.o.state.get(), recs = await this.st.all("rec"), have = new Set(recs.map(r => r.k)), me = RM.encId(m.member), E = {};
      const live = recs.filter(r => RM.present(r));
      const ownE = c => live.filter(r => r.c === c && (!RM.D[c].own || r.k.split("/")[1] === me)).sort((a, b) => (a.cl || 0) - (b.cl || 0)).map(r => [RM.decId(RM.D[c].own ? r.k.split("/")[2] : r.k.slice(c.length + 1)), RM.value(r)]).filter(e => Object.keys(e[1]).length);
      let fromBackup = 0;
      for (const [c, d] of Object.entries(RM.D)) { const pre = c + "/" + (d.own ? me + "/" : ""); const extra = d.from(S).filter(([id]) => !have.has(pre + RM.encId(id))); fromBackup += extra.length; E[c] = ownE(c).concat(extra); }
      for (const [c, d] of Object.entries(RM.D)) d.to(S, E[c], x => E[x] || []);
      if (typeof INV !== "undefined") INV.refresh(S);
      this.o.state.set(S); const r = await this._captureTx({}); return { kept: fromBackup, captured: r.n };
    });
  }
}
