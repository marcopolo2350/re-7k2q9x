/* Rose's EATS sync engine (Phase 5 candidate, NOT enabled in production).
   One engine per device profile. It captures local changes as per-record operations (transactionally with the records),
   encrypts and signs them, exchanges them through a relay, verifies and merges what other devices sent, and projects the
   result back into the app state. It also runs pairing, revocation, key rotation and recovery.
   o = { db, relay, member, name, clock, state: { get(), set(S) } }. Nothing here logs plaintext or key material. */
"use strict";
class SyncEngine {
  constructor(o) { this.o = o; this.st = new RStore.Store(o.db); this.relay = o.relay; this.now = o.clock || (() => Date.now()); this.stats = { rejected: 0, parked: 0, unsyncable: 0, why: {} }; this.T = {}; }
  /* ---------- setup ---------- */
  async init() {
    let dev = await this.st.get("meta", "dev");
    if (!dev) {
      const sign = await RC.genSign(), dh = await RC.genDH();
      dev = { id: RC.id(16), member: this.o.member || "me", name: this.o.name || "phone" };
      await this.st.tx(["meta", "keys"], "readwrite", async s => { await s.keys.put(sign, "sign"); await s.keys.put(dh, "dh"); await s.meta.put(dev, "dev"); });
    }
    this.dev = dev; await this.recoverPending(); return this;
  }
  async meta() { return this.st.tx(["meta"], "readonly", async s => { const m = {}; for (const k of await s.meta.keys()) m[k] = await s.meta.get(k); return m; }); }
  async setMeta(o) { return this.st.tx(["meta"], "readwrite", async s => { for (const [k, v] of Object.entries(o)) await (v === undefined ? s.meta.del(k) : s.meta.put(v, k)); }); }
  key(k) { return this.st.get("keys", k); }
  async hk(e) { const k = await this.key("hk:" + e); if (!k) throw Object.assign(new Error("missing key for epoch " + e), { code: "nokey" }); return k; }
  shared(cat, m) { return !!(m.share && m.share[cat]); }
  ctx(hh, e, from, to) { return "RE1 key|" + hh + "|" + e + "|" + from + "|" + to; }
  bad(why) { this.stats.rejected++; this.stats.why[why] = (this.stats.why[why] || 0) + 1; }
  /* ---------- change capture: app state -> records + queued ops, in one transaction ---------- */
  async capture(opts = {}) {
    const S = this.o.state.get(); if (RM.ensureIds(S)) this.o.state.set(S, { quiet: true });
    const m = await this.meta(); if (!m.share) return { n: 0 };
    return this.st.tx(["rec", "out", "meta"], "readwrite", s => this._capture(s, S, m, opts));
  }
  async _capture(s, S, m, opts) {
    const recs = new Map((await s.rec.all()).map(r => [r.k, r])), me = RM.encId(this.dev.member), dev = this.dev.id;
    let lam = (await s.meta.get("lam")) || 0, ctr = (await s.meta.get("ctr")) || 0, n = 0; const skipped = [];
    const emit = async (r, f) => { const op = { v: 1, sv: RM.SV, id: dev + ":" + (++ctr), dev, c: ctr, l: ++lam, k: r.k, b: { ...r.vv }, f, ts: this.now() }; RM.apply(r, op); await s.rec.put(r); await s.out.put(op); n++; };
    for (const [c, d] of Object.entries(RM.D)) {
      if (!this.shared(d.cat, m)) continue;
      const pre = c + "/" + (d.own ? me + "/" : ""), seen = new Set();
      for (const [id, f] of d.from(S)) {
        const k = pre + RM.encId(id); if (!RM.keyOk(k)) { this.stats.unsyncable++; continue; } seen.add(k);
        let r = recs.get(k); const live = r && RM.present(r); let ch = {};
        if (!live) { if (r && opts.noResurrect) { skipped.push(k); continue; } ch = { ...f }; if (r) ch._del = false; }
        else { const v = RM.value(r); for (const x of new Set([...Object.keys(f), ...Object.keys(v)])) { const a = f[x] === undefined ? null : f[x], b = v[x] === undefined ? null : v[x]; if (RM.canon(a) !== RM.canon(b)) ch[x] = a; } }
        if (!Object.keys(ch).length) continue;
        if (!r) { r = { k, c, f: {}, vv: {} }; recs.set(k, r); }
        await emit(r, ch);
      }
      for (const [k, r] of recs) if (r.c === c && k.startsWith(pre) && !seen.has(k) && RM.present(r)) await emit(r, { _del: true });
    }
    await s.meta.put(lam, "lam"); await s.meta.put(ctr, "ctr"); return { n, skipped };
  }
  /* ---------- projection: records -> app state ---------- */
  _project(S, recs, cats) {
    const me = RM.encId(this.dev.member), by = {};
    for (const r of recs) if (RM.present(r)) (by[r.c] = by[r.c] || []).push(r);
    const own = c => (by[c] || []).filter(r => !RM.D[c].own || r.k.split("/")[1] === me).sort((a, b) => (a.cl || 0) - (b.cl || 0))
      .map(r => [RM.decId(RM.D[c].own ? r.k.split("/")[2] : r.k.slice(c.length + 1)), RM.value(r)]).filter(e => Object.keys(e[1]).length);
    for (const [c, d] of Object.entries(RM.D)) {
      if (!cats.has(d.cat)) continue;
      d.to(S, own(c), own);
      if (d.own) { /* other members' shared personal data, kept apart in S.hh[collection][member] in the app's own shape */
        const per = {}; for (const r of by[c] || []) { const [, mem, id] = r.k.split("/"); if (mem === me) continue; const v = RM.value(r); if (Object.keys(v).length) (per[RM.decId(mem)] = per[RM.decId(mem)] || []).push([RM.decId(id), v]); }
        const o = {}; for (const [mem, E] of Object.entries(per)) { const t = {}; d.to(t, E, () => []); o[mem] = Object.values(t)[0]; } S.hh = S.hh || {}; S.hh[c] = o;
      }
    }
  }
  async recoverPending() { /* the app closed after records were committed but before the app state was saved */
    const pend = await this.st.get("meta", "pend"); if (!pend || !pend.length) return false;
    const S = structuredClone(this.o.state.get()); this._project(S, await this.st.all("rec"), new Set(pend)); this.o.state.set(S); await this.setMeta({ pend: undefined }); return true;
  }
  async project(cats) { const S = structuredClone(this.o.state.get()); this._project(S, await this.st.all("rec"), new Set(cats)); this.o.state.set(S); }
  /* ---------- relay requests: every device request is signed (path, household, time, nonce, body hash) ---------- */
  async req(path, body = {}) {
    const m = await this.meta(), a = { t: "dev", dev: this.dev.id, ts: this.now(), nonce: RC.id(16) };
    const bh = RC.b64(await RC.sha256(RC.canon(body)));
    a.sig = await RC.sign((await this.key("sign")).privateKey, RC.canon({ p: path, hh: m.hh, dev: a.dev, ts: a.ts, nonce: a.nonce, bh }));
    return this.relay.call(path, { hh: m.hh, body, auth: a });
  }
  async pubs() { return { sp: await RC.pubJwk((await this.key("sign")).publicKey), dp: await RC.pubJwk((await this.key("dh")).publicKey) }; }
  async signEntry(e) { e.sig = await RC.sign((await this.key("sign")).privateKey, RC.canon({ ...e, sig: undefined })); return e; }
  async wrap(e, raw, toDev, toDp) { return { from: this.dev.id, ...(await RC.wrapFor((await this.key("dh")).privateKey, toDp, raw, this.ctx((await this.meta()).hh, e, this.dev.id, toDev))) }; }
  /* ---------- household creation (first device) ---------- */
  async createHousehold(share) {
    const hh = RC.id(16), hk = await RC.genHK(), raw = await RC.rawKey(hk), rec = await RC.newRecovery(), p = await this.pubs();
    await this.setMeta({ hh, epoch: 1, cursor: 0 });
    const entry = await this.signEntry({ t: "add", hh, dev: this.dev.id, member: this.dev.member, name: this.dev.name, sp: p.sp, dp: p.dp, by: this.dev.id, at: this.now() });
    const envs = { [this.dev.id]: await this.wrap(1, raw, this.dev.id, p.dp) }, recEnv = await this.wrap(1, raw, "recovery", rec.pub.dh);
    const recovery = { verifier: rec.verifier, box: rec.box, pub: rec.pub };
    const r = await this.relay.call("create", { hh, body: { roster: [entry], envs, recEnv, recovery }, auth: { t: "self" } });
    await this.st.tx(["meta", "keys"], "readwrite", async s => { await s.keys.put(hk, "hk:1"); await s.meta.put(recovery, "recovery"); await s.meta.put([entry], "roster"); await s.meta.put(p.sp, "founder"); await s.meta.put(r.inst, "inst"); await s.meta.put(share || this.defShare(), "share"); });
    await this.refreshRoster(); return { words: rec.words, hh };
  }
  defShare() { const s = {}; RM.HOUSE.forEach(c => s[c] = true); RM.PERSONAL.forEach(c => s[c] = false); return s; }
  /* initial sync preview: what would be shared, by category, before anything leaves the phone */
  preview(share) { const S = this.o.state.get(), out = {}; for (const [c, d] of Object.entries(RM.D)) { const n = d.from(S).length; out[d.cat] = out[d.cat] || { label: RM.CAT_LABEL[d.cat], records: 0, shared: !!(share || this.defShare())[d.cat], personal: RM.PERSONAL.includes(d.cat) }; out[d.cat].records += n; } return out; }
  /* ---------- roster: chain of signed add/revoke entries rooted in the pinned founder key ---------- */
  async refreshRoster() {
    const m = await this.meta(), r = await this.req("roster", { from: 0 }), list = r.roster, act = {};
    for (let i = 0; i < list.length; i++) {
      const e = list[i], msg = RC.canon({ ...e, sig: undefined }); let ok;
      if (e.hh !== m.hh) throw new Error("roster entry for another household");
      if (i === 0) ok = e.t === "add" && e.by === e.dev && RC.canon(e.sp) === RC.canon(m.founder) && (await RC.verify(e.sp, e.sig, msg));
      else if (e.by === "recovery") ok = await RC.verify(m.recovery.pub.sg, e.sig, msg);
      else ok = !!(act[e.by] && act[e.by].st === "active" && (await RC.verify(act[e.by].sp, e.sig, msg)));
      if (!ok) throw new Error("roster signature check failed at entry " + i);
      if (e.t === "add") act[e.dev] = { ...e, st: "active" }; else if (act[e.dev]) { act[e.dev].st = "revoked"; act[e.dev].rev = e.ep || 0; }
    }
    await this.setMeta({ roster: list, devs: act, epochSeen: r.epoch }); return act;
  }
  async fetchKeys() {
    const m = await this.meta(), r = await this.req("keys-get", {}), dh = (await this.key("dh")).privateKey;
    for (const [e, env] of Object.entries(r.envs)) {
      if (await this.key("hk:" + e)) continue; const from = m.devs[env.from]; if (!from) { this.bad("key from unknown device"); continue; }
      try { const raw = await RC.unwrapFrom(dh, from.dp, env, this.ctx(m.hh, e, env.from, this.dev.id)); await this.st.put("keys", await RC.aesKey(raw, true), "hk:" + e); } catch (x) { this.bad("key envelope failed"); }
    }
    if (await this.key("hk:" + r.epoch)) await this.setMeta({ epoch: r.epoch }); return r;
  }
  /* ---------- push: queued ops -> encrypted, signed envelopes ---------- */
  async seal(op, m, rs) {
    const e = m.epoch, hk = await this.hk(e), body = await this.attOut(op, m), oid = op.id;
    const box = await RC.seal(hk, RC.pad(JSON.stringify(body)), "RE1op|" + m.hh + "|" + e + "|" + this.dev.id + "|" + oid + "|" + (rs ? 1 : 0));
    const env = { e, dev: this.dev.id, oid, n: box.n, ct: box.ct, rs: rs ? 1 : 0 };
    env.sig = await RC.sign((await this.key("sign")).privateKey, SyncEngine.opMsg(m.hh, env)); return env;
  }
  async attOut(op, m) { /* large photos travel as separate encrypted attachments, never inside an op */
    const f = {}; for (const [k, v] of Object.entries(op.f)) {
      if (typeof v === "string" && v.startsWith("data:image/") && v.length > 4096) { const id = RC.id(16), box = await RC.seal(await this.hk(m.epoch), v, "RE1att|" + m.hh + "|" + id); await this.req("att-put", { id, e: m.epoch, ...box }); f[k] = { att: id, e: m.epoch }; }
      else f[k] = v;
    } return { ...op, f };
  }
  async push() {
    let m = await this.meta(); const outs = (await this.st.all("out")).sort((a, b) => a.c - b.c); let sent = 0, retries = 0;
    for (let i = 0; i < outs.length;) {
      const batch = outs.slice(i, i + 50), envs = [];
      for (const op of batch) envs.push(await this.seal(op, m));
      try { await this.req("push", { ops: envs }); }
      catch (e) { if (e.code === 409 && /epoch/.test(e.message) && retries++ < 3) { await this.fetchKeys(); m = await this.meta(); continue; } throw e; }
      /* the relay ignores op ids it already has, so a retry after a lost reply never duplicates anything */
      await this.st.tx(["out"], "readwrite", async s => { for (const op of batch) await s.out.del(op.id); }); sent += batch.length; i += 50;
    }
    return sent;
  }
  /* ---------- pull: verify, decrypt, validate, merge, project ---------- */
  async openEnv(env, m) {
    const d = m.devs && m.devs[env.dev]; if (!d) return this.bad("op from a device not in the roster"), null;
    if (d.st === "revoked" && env.e > (d.rev || 0)) return this.bad("op from a revoked device"), null;
    if (!(await RC.verify(d.sp, env.sig, SyncEngine.opMsg(m.hh, env)))) return this.bad("op signature invalid"), null;
    if (typeof env.ct !== "string" || env.ct.length > 98304) return this.bad("op too large"), null;
    let k; try { k = await this.hk(env.e); } catch (e) { await this.fetchKeys(); try { k = await this.hk(env.e); } catch (e2) { return this.bad("no key for epoch"), null; } }
    let o; try { o = JSON.parse(RC.unpad(await RC.open(k, env, "RE1op|" + m.hh + "|" + env.e + "|" + env.dev + "|" + env.oid + "|" + (env.rs ? 1 : 0)))); } catch (e) { return this.bad("decryption or authentication failed"), null; }
    const why = RM.validOp(o); if (why) return this.bad(why), null;
    if (o.id !== env.oid || (!env.rs && o.dev !== env.dev)) return this.bad("op identity mismatch"), null;
    if (o.sv > RM.SV) { this.stats.parked++; return { park: o }; }
    for (const [f, v] of Object.entries(o.f)) if (v && typeof v === "object" && typeof v.att === "string") {
      try { const a = await this.req("att-get", { id: v.att }); o.f[f] = RC.td.decode(await RC.open(await this.hk(a.e), a, "RE1att|" + m.hh + "|" + v.att)); } catch (e) { return this.bad("attachment unavailable"), null; }
    }
    return o;
  }
  async pull() {
    let total = 0;
    for (let g = 0; g < 100; g++) {
      let m = await this.meta(), r;
      try { r = await this.req("pull", { after: m.cursor || 0 }); } catch (e) { if (e.code === 404 && /household/.test(e.message)) return this.onRelayLoss(); throw e; }
      if (r.reset || (m.inst && r.inst !== m.inst)) return this.onRelayLoss();
      if (r.rl !== (m.roster || []).length) { await this.refreshRoster(); m = await this.meta(); }
      if (r.epoch > (m.epoch || 1)) { await this.fetchKeys(); m = await this.meta(); }
      const ops = [];
      for (const env of r.ops) { const o = await this.openEnv(env, m); if (o) ops.push(o); }
      await this.applyRemote(ops, r.next, r.inst); total += ops.length;
      if (r.next >= r.head) break;
    }
    return { applied: total };
  }
  async applyRemote(ops, next, inst) {
    const S = structuredClone(this.o.state.get()); RM.ensureIds(S); const m = await this.meta();
    ops = ops.filter(o => !o.park).sort((a, b) => a.dev < b.dev ? -1 : a.dev > b.dev ? 1 : a.c - b.c).concat(ops.filter(o => o.park));
    const touched = await this.st.tx(["rec", "out", "meta", "park"], "readwrite", async s => {
      if (!this._noCap) await this._capture(s, S, m, {}); /* local edits made since the last capture are queued first, in this same transaction */
      const recs = new Map((await s.rec.all()).map(r => [r.k, r])); let lam = (await s.meta.get("lam")) || 0; const t = new Set();
      for (const x of ops) {
        if (x.park) { await s.park.put(x.park); continue; }
        const c = x.k.split("/")[0]; let r = recs.get(x.k) || { k: x.k, c, f: {}, vv: {} };
        if (RM.apply(r, x)) { recs.set(x.k, r); await s.rec.put(r); t.add(RM.D[c].cat); } lam = Math.max(lam, x.l);
      }
      await s.meta.put(lam, "lam"); await s.meta.put(next, "cursor"); await s.meta.put(inst, "inst");
      const cats = new Set([...t].filter(c => this.shared(c, m) || RM.PERSONAL.includes(c)));
      if (cats.size) { this._project(S, [...recs.values()], cats); await s.meta.put([...cats], "pend"); }
      return cats;
    });
    if (touched.size) { if (this.T.crashAfterCommit) { this.T.crashAfterCommit = 0; throw new Error("app closed after merge (simulated)"); } this.o.state.set(S); await this.setMeta({ pend: undefined }); }
    return touched;
  }
  async sync() { await this.capture(); await this.pull(); const n = await this.push(); if (n) await this.pull(); return n; }
  /* ---------- conflicts ---------- */
  async conflicts() { return (await this.st.all("rec")).flatMap(r => RM.conflicts(r)); }
  async resolve(k, field, value) { /* an explicit choice: a new op whose base covers every competing value */
    const m = await this.meta(); const S = structuredClone(this.o.state.get());
    await this.st.tx(["rec", "out", "meta"], "readwrite", async s => {
      await this._capture(s, S, m, {}); const r = await s.rec.get(k); if (!r) return;
      let lam = (await s.meta.get("lam")) || 0, ctr = (await s.meta.get("ctr")) || 0;
      const f = field === "_del" ? (value === "delete" ? { _del: true } : { ...RM.value(r), _del: false }) : { [field]: value };
      const op = { v: 1, sv: RM.SV, id: this.dev.id + ":" + (++ctr), dev: this.dev.id, c: ctr, l: ++lam, k, b: { ...r.vv }, f, ts: this.now() };
      RM.apply(r, op); await s.rec.put(r); await s.out.put(op); await s.meta.put(lam, "lam"); await s.meta.put(ctr, "ctr");
      this._project(S, await s.rec.all(), new Set([RM.D[r.c].cat]));
    });
    this.o.state.set(S);
  }
  /* ---------- pairing ---------- */
  async invite() {
    const inviteId = RC.id(16), secret = RC.rand(32), ik = await RC.inviteKeys(secret);
    const r = await this.req("invite-create", { inviteId, ver: RC.b64(await RC.sha256(ik.auth)) });
    this.inv = { inviteId, secret, exp: r.exp }; const m = await this.meta();
    return { code: "RE1J." + m.hh + "." + inviteId + "." + RC.b64(secret), exp: r.exp };
  }
  async cancelInvite() { if (this.inv) await this.req("invite-cancel", { inviteId: this.inv.inviteId }); this.inv = null; }
  async join(code) {
    const p = String(code || "").split("."); if (p.length !== 4 || p[0] !== "RE1J") throw new Error("This isn't a Rose's EATS pairing code");
    const [, hh, inviteId, sec] = p, secret = RC.unb64(sec), ik = await RC.inviteKeys(secret), pb = await this.pubs();
    const j = { hh, inviteId, dev: this.dev.id, sp: pb.sp, dp: pb.dp, member: this.dev.member, name: this.dev.name };
    await this.relay.call("join", { hh, body: { dev: j.dev, sp: j.sp, dp: j.dp, member: j.member, name: j.name, mac: await RC.hmac(ik.mac, RC.canon(j)) }, auth: { t: "invite", inviteId, key: ik.auth } });
    await this.setMeta({ hh, joining: { inviteId, sec, at: this.now() } });
    return { sas: await RC.sas(secret, { dev: j.dev, sp: j.sp, dp: j.dp }) };
  }
  async pendingJoin() {
    if (!this.inv) return null; const m = await this.meta(), st = await this.req("invite-status", { inviteId: this.inv.inviteId }); if (!st.join) return null;
    const j = st.join, ik = await RC.inviteKeys(this.inv.secret);
    const macOk = await RC.hmacOk(ik.mac, j.mac, RC.canon({ hh: m.hh, inviteId: this.inv.inviteId, dev: j.dev, sp: j.sp, dp: j.dp, member: j.member, name: j.name }));
    if (!macOk) return { bad: true }; if (this.now() > this.inv.exp) return { expired: true };
    return { join: j, sas: await RC.sas(this.inv.secret, { dev: j.dev, sp: j.sp, dp: j.dp }) };
  }
  async approve(pj, codeMatches) {
    if (!pj || !pj.join || pj.bad) throw new Error("No valid join request"); if (!codeMatches) throw new Error("The codes must match before approving");
    if (this.now() > this.inv.exp) throw new Error("This invitation has expired");
    const j = pj.join, m = await this.meta();
    await this.req("roster-add", { entry: await this.signEntry({ t: "add", hh: m.hh, dev: j.dev, member: j.member, name: j.name, sp: j.sp, dp: j.dp, by: this.dev.id, at: this.now() }) });
    const envs = {}; for (let e = 1; e <= m.epoch; e++) { const k = await this.key("hk:" + e); if (k) envs[e] = { [j.dev]: await this.wrap(e, await RC.rawKey(k), j.dev, j.dp) }; }
    const wk = await RC.aesKey(await RC.hkdf(this.inv.secret, "RE1 invite", "welcome"));
    const box = await RC.seal(wk, JSON.stringify({ founder: m.founder, recovery: m.recovery, share: m.share }), "RE1 welcome|" + m.hh + "|" + j.dev);
    await this.req("keys-add", { envs, welcome: { dev: j.dev, box } }); this.inv = null; await this.refreshRoster();
  }
  async finishJoin(share) {
    const m = await this.meta(); if (!m.joining) throw new Error("not joining"); let r;
    try { r = await this.req("keys-get", {}); } catch (e) { if (e.code === 403) return false; throw e; }
    if (!r.welcome) return false;
    const wk = await RC.aesKey(await RC.hkdf(RC.unb64(m.joining.sec), "RE1 invite", "welcome"));
    const w = JSON.parse(RC.td.decode(await RC.open(wk, r.welcome, "RE1 welcome|" + m.hh + "|" + this.dev.id)));
    await this.setMeta({ founder: w.founder, recovery: w.recovery, share: share || w.share, joining: undefined, cursor: 0, epoch: 1 });
    await this.refreshRoster(); await this.fetchKeys(); return true;
  }
  /* ---------- revocation and key rotation (two-phase, resumable) ---------- */
  async revoke(devId) { const m = await this.meta(); await this.req("roster-add", { entry: await this.signEntry({ t: "revoke", hh: m.hh, dev: devId, by: this.dev.id, at: this.now(), ep: m.epoch }) }); await this.refreshRoster(); return this.rotate(); }
  async rotate() {
    const m = await this.meta(), e = m.epoch + 1; let hk = await this.key("stage:" + e);
    if (!hk) { hk = await RC.genHK(); await this.st.put("keys", hk, "stage:" + e); }
    const raw = await RC.rawKey(hk), envs = {};
    for (const d of Object.values(m.devs)) if (d.st === "active") envs[d.dev] = await this.wrap(e, raw, d.dev, d.dp);
    await this.req("rotate", { e, envs, recEnv: await this.wrap(e, raw, "recovery", m.recovery.pub.dh) });
    if (this.T.crashMidRotate) { this.T.crashMidRotate = 0; throw new Error("app closed during key rotation (simulated)"); }
    await this.req("commit", { e });
    await this.st.tx(["keys", "meta"], "readwrite", async s => { await s.keys.put(hk, "hk:" + e); await s.keys.del("stage:" + e); await s.meta.put(e, "epoch"); });
    return e;
  }
  /* ---------- recovery with the 24 words (new phone, no other device needed) ---------- */
  async recover(hh, words) {
    const key = await RC.recoveryAuth(words), auth = { t: "recovery", key };
    const r0 = await this.relay.call("recover", { hh, body: {}, auth }); const rk = await RC.openRecovery(words, r0.box);
    const probe = "RE1 probe|" + hh; if (!(await RC.verify(r0.pub.sg, await RC.sign(rk.sg, probe), probe))) throw new Error("relay returned a different recovery key");
    const p = await this.pubs(); const entry = { t: "add", hh, dev: this.dev.id, member: this.dev.member, name: this.dev.name, sp: p.sp, dp: p.dp, by: "recovery", at: this.now() };
    entry.sig = await RC.sign(rk.sg, RC.canon({ ...entry, sig: undefined }));
    const r = await this.relay.call("recover", { hh, body: { entry }, auth });
    await this.setMeta({ hh, founder: r.roster[0].sp, recovery: { verifier: RC.b64(await RC.sha256(key)), box: r.box, pub: r.pub }, cursor: 0, inst: r.inst, epoch: r.epoch, share: this.defShare() });
    const devs = await this.refreshRoster(), envs = {};
    for (const [e, env] of Object.entries(r.rec)) {
      if (!env || !devs[env.from]) continue;
      try { const raw = await RC.unwrapFrom(rk.dh, devs[env.from].dp, env, this.ctx(hh, e, env.from, "recovery")); await this.st.put("keys", await RC.aesKey(raw, true), "hk:" + e); envs[e] = { [this.dev.id]: await this.wrap(e, raw, this.dev.id, p.dp) }; } catch (x) { this.bad("recovery envelope failed"); }
    }
    await this.req("keys-add", { envs }); return true;
  }
  /* ---------- relay data loss: re-create the household and re-upload every known value ---------- */
  async onRelayLoss() {
    const m = await this.meta(), raw = await RC.rawKey(await this.hk(m.epoch)), envs = {};
    for (const d of Object.values(m.devs)) if (d.st === "active") envs[d.dev] = await this.wrap(m.epoch, raw, d.dev, d.dp);
    let inst;
    try { inst = (await this.relay.call("create", { hh: m.hh, body: { roster: m.roster, envs, recEnv: await this.wrap(m.epoch, raw, "recovery", m.recovery.pub.dh), recovery: m.recovery, epoch: m.epoch }, auth: { t: "self" } })).inst; }
    catch (e) { if (e.code !== 409) throw e; }
    const rm = await this.meta(); await this.setMeta({ cursor: 0, inst: inst || undefined });
    const ops = []; for (const r of await this.st.all("rec")) { const by = new Map(); for (const [f, hs] of Object.entries(r.f)) for (const h of hs) { const id = h.d[0] + ":" + h.d[1]; if (!by.has(id)) by.set(id, { v: 1, sv: RM.SV, id, dev: h.d[0], c: h.d[1], l: h.l, k: r.k, b: h.b, f: {} }); by.get(id).f[f] = h.v; } ops.push(...by.values()); }
    ops.sort((a, b) => a.c - b.c); const m2 = { ...rm, cursor: 0 };
    for (let i = 0; i < ops.length; i += 50) { const envs2 = []; for (const op of ops.slice(i, i + 50)) envs2.push(await this.seal(op, m2, op.dev !== this.dev.id)); await this.req("push", { ops: envs2 }); }
    if (!inst) { const p = await this.req("pull", { after: 0 }); await this.setMeta({ inst: p.inst }); }
    else await this.setMeta({ inst });
    await this.push(); return { reset: true, reseeded: ops.length };
  }
  /* ---------- encrypted household backup file (works without the relay) ---------- */
  async encryptedBackup(words) {
    const m = await this.meta(), keys = {}; for (let e = 1; e <= m.epoch; e++) { const k = await this.key("hk:" + e); if (k) keys[e] = RC.b64(await RC.rawKey(k)); }
    const box = await RC.seal(await RC.backupKey(words), JSON.stringify({ hh: m.hh, epoch: m.epoch, keys, founder: m.founder, recovery: m.recovery, state: this.o.state.get() }), "RE1 backup|" + m.hh);
    return JSON.stringify({ app: "Rose's EATS", format: "RE-ENC1", hh: m.hh, ...box });
  }
  static async openBackup(text, words) {
    const o = JSON.parse(text); if (o.format !== "RE-ENC1") throw new Error("Not an encrypted household backup");
    try { return JSON.parse(RC.td.decode(await RC.open(await RC.backupKey(words), o, "RE1 backup|" + o.hh))); } catch (e) { throw new Error("These words don't open this backup"); }
  }
  async unpark() { /* after an app update raises RM.SV, re-apply ops parked for being too new */
    const parked = await this.st.all("park"), ok = parked.filter(o => o.sv <= RM.SV); if (!ok.length) return 0;
    const m = await this.meta(); await this.applyRemote(ok, m.cursor, m.inst); await this.st.tx(["park"], "readwrite", async s => { for (const o of ok) await s.park.del(o.id); }); return ok.length;
  }
  /* local sync store lost or corrupted (device keys intact): re-download everything first, so nothing deleted elsewhere
     comes back, then re-add items that exist only on this phone (created but never sent) and queue them */
  async rebuild() {
    const snap = structuredClone(this.o.state.get()); RM.ensureIds(snap);
    await this.st.tx(["rec", "meta"], "readwrite", async s => { await s.rec.clear(); await s.meta.put(0, "cursor"); await s.meta.del("pend"); });
    this._noCap = true; try { await this.pull(); } finally { this._noCap = false; }
    const m = await this.meta(), S = structuredClone(this.o.state.get()), have = new Set((await this.st.all("rec")).map(r => r.k)), me = RM.encId(this.dev.member);
    const E = {}; for (const [c, d] of Object.entries(RM.D)) { if (!this.shared(d.cat, m)) continue; const cur = d.from(S), ids = new Set(cur.map(x => x[0])), pre = c + "/" + (d.own ? me + "/" : ""); E[c] = cur.concat(d.from(snap).filter(([id]) => !ids.has(id) && !have.has(pre + RM.encId(id)))); }
    for (const [c, d] of Object.entries(RM.D)) if (E[c]) d.to(S, E[c], x => E[x] || []);
    this.o.state.set(S); return this.capture();
  }
  static opMsg(hh, env) { return "RE1op|" + hh + "|" + env.e + "|" + env.dev + "|" + env.oid + "|" + (env.rs ? 1 : 0) + "|" + env.n + "|" + env.ct; }
  async pending() { return this.st.tx(["out"], "readonly", s => s.out.count()); }
}
