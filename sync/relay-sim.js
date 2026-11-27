/* Rose's EATS sync: SIMULATED relay (in memory, test-only). It models what the future Cloudflare Worker will enforce:
   signed device requests with replay protection, single-use expiring invitations, device revocation, epoch-based key
   envelopes with two-phase rotation, recovery verification and size limits. It only ever holds ciphertext, public keys,
   hashes and routing metadata. Fault switches simulate outages, lost responses, duplicates, reordering and data loss. */
"use strict";
class SimRelay {
  constructor(clock) { this.clock = clock || (() => Date.now()); this.H = {}; this.inst = RC.id(8); this.fault = {}; this.calls = 0; this.LIM = { body: 262144, ct: 98304, att: 1572864, ops: 100, skew: 300000, inviteTtl: 600000 }; }
  wipe() { this.H = {}; this.inst = RC.id(8); } /* relay data loss */
  dump() { return JSON.stringify(this.H); }
  err(code, msg) { return Object.assign(new Error(msg), { code }); }
  async call(path, req) {
    this.calls++;
    if (this.fault.down) throw this.err(0, "relay unreachable");
    if (JSON.stringify(req || {}).length > this.LIM.body) throw this.err(413, "request too large");
    const res = await this.route(path, req || {});
    if (this.fault.loseResponse) { this.fault.loseResponse--; throw this.err(0, "connection lost before the reply"); }
    return JSON.parse(JSON.stringify(res));
  }
  async authDev(path, req, h) {
    const a = req.auth || {}; if (a.t !== "dev") throw this.err(401, "device signature required");
    const d = h.dev[a.dev]; if (!d) throw this.err(403, "unknown device"); if (d.st !== "active") throw this.err(403, "device revoked");
    const now = this.clock(); if (!Number.isFinite(a.ts) || Math.abs(now - a.ts) > this.LIM.skew) throw this.err(401, "stale request");
    if (typeof a.nonce !== "string" || a.nonce.length < 16) throw this.err(401, "bad nonce"); if (h.nonces[a.nonce]) throw this.err(409, "replayed request");
    const bh = RC.b64(await RC.sha256(RC.canon(req.body || {})));
    if (!(await RC.verify(d.sp, a.sig, RC.canon({ p: path, hh: req.hh, dev: a.dev, ts: a.ts, nonce: a.nonce, bh })))) throw this.err(401, "bad signature");
    for (const [n, t] of Object.entries(h.nonces)) if (now - t > 2 * this.LIM.skew) delete h.nonces[n];
    h.nonces[a.nonce] = now; return a.dev;
  }
  hh(req) { const h = this.H[req.hh]; if (!h) throw this.err(404, "unknown household"); return h; }
  async entryOk(h, e) { /* roster entries must be signed by a device active at that time, or by the household recovery key */
    const msg = RC.canon({ ...e, sig: undefined });
    if (e.by === "recovery") return RC.verify(h.recovery.pub.sg, e.sig, msg);
    const s = h.dev[e.by]; return !!(s && s.st === "active" && (await RC.verify(s.sp, e.sig, msg)));
  }
  applyEntry(h, e) { if (e.t === "add") h.dev[e.dev] = { sp: e.sp, st: "active" }; if (e.t === "revoke" && h.dev[e.dev]) h.dev[e.dev].st = "revoked"; h.roster.push(e); }
  async route(path, req) {
    const b = req.body || {}, now = this.clock();
    if (path === "create") {
      if (this.H[req.hh]) throw this.err(409, "household exists");
      const e = b.roster && b.roster[0]; if (!e || e.t !== "add" || e.by !== e.dev || !(await RC.verify(e.sp, e.sig, RC.canon({ ...e, sig: undefined })))) throw this.err(400, "bad founder entry");
      const ep = Number.isInteger(b.epoch) && b.epoch > 0 ? b.epoch : 1;
      const h = this.H[req.hh] = { dev: {}, roster: [], ops: [], oids: {}, nonces: {}, epoch: ep, keys: { [ep]: b.envs || {} }, rec: { [ep]: b.recEnv }, pend: null, recovery: b.recovery, inv: {}, att: {}, welcome: {}, seq: 0 };
      for (const x of b.roster) { if (h.roster.length && !(await this.entryOk(h, x))) throw this.err(400, "bad roster"); this.applyEntry(h, x); }
      for (const op of b.ops || []) this.storeOp(h, op);
      return { ok: true, inst: this.inst };
    }
    if (path === "join") { /* invitation bearer: single use, 10-minute expiry, hash comparison only */
      const h = this.hh(req), a = req.auth || {}, iv = h.inv[a.inviteId];
      if (!iv) throw this.err(404, "invitation not found or cancelled"); if (iv.used) throw this.err(409, "invitation already used"); if (now > iv.exp) throw this.err(410, "invitation expired");
      if (RC.b64(await RC.sha256(a.key || "")) !== iv.ver) throw this.err(403, "invitation credential wrong");
      if (!RC.okJwk(b.sp) || !RC.okJwk(b.dp) || typeof b.mac !== "string") throw this.err(400, "bad join request");
      iv.used = true; iv.join = { sp: b.sp, dp: b.dp, name: String(b.name || "").slice(0, 40), member: String(b.member || "").slice(0, 40), mac: b.mac, dev: b.dev }; return { ok: true };
    }
    if (path === "recover") {
      const h = this.hh(req), a = req.auth || {};
      if (!h.recovery || RC.b64(await RC.sha256(a.key || "")) !== h.recovery.verifier) throw this.err(403, "recovery credential wrong");
      if (b.entry) { if (b.entry.by !== "recovery" || !(await this.entryOk(h, b.entry))) throw this.err(403, "bad recovery entry"); this.applyEntry(h, b.entry); }
      return { box: h.recovery.box, pub: h.recovery.pub, rec: h.rec, epoch: h.epoch, roster: h.roster, inst: this.inst };
    }
    const h = this.hh(req), dev = await this.authDev(path, req, h);
    switch (path) {
      case "push": {
        if (!Array.isArray(b.ops) || b.ops.length > this.LIM.ops) throw this.err(400, "bad batch");
        for (const env of b.ops) {
          if (!env || env.dev !== dev) throw this.err(403, "ops must be signed by the sending device");
          if (env.e !== h.epoch) throw this.err(409, "stale key epoch");
          if (typeof env.ct !== "string" || env.ct.length > this.LIM.ct) throw this.err(413, "op too large");
          if (!(await RC.verify(h.dev[dev].sp, env.sig, SyncEngine.opMsg(req.hh, env)))) throw this.err(401, "bad op signature");
        }
        let added = 0; for (const env of b.ops) added += this.storeOp(h, env); return { ok: true, added, head: h.seq };
      }
      case "pull": {
        const after = +b.after || 0; if (after > h.seq) return { reset: true, head: h.seq, inst: this.inst };
        let ops = h.ops.filter(o => o.s > after).slice(0, Math.min(200, +b.limit || 200));
        const next = ops.length ? ops[ops.length - 1].s : after;
        if (this.fault.dupPull) ops = ops.concat(ops.slice(0, Math.ceil(ops.length / 2)));
        if (this.fault.shufflePull) ops = ops.map(o => [Math.random(), o]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
        return { ops, next, head: h.seq, inst: this.inst, epoch: h.epoch, rl: h.roster.length };
      }
      case "roster": return { roster: h.roster.slice(+b.from || 0), epoch: h.epoch };
      case "roster-add": { const e = b.entry; if (!e || e.by !== dev || !["add", "revoke"].includes(e.t) || !(await this.entryOk(h, e))) throw this.err(403, "bad roster entry"); if (e.t === "add" && h.dev[e.dev]) throw this.err(409, "device exists"); this.applyEntry(h, e); return { ok: true, rl: h.roster.length }; }
      case "invite-create": { if (typeof b.inviteId !== "string" || typeof b.ver !== "string") throw this.err(400, "bad invite"); h.inv[b.inviteId] = { ver: b.ver, exp: now + this.LIM.inviteTtl, by: dev, used: false }; return { exp: h.inv[b.inviteId].exp }; }
      case "invite-cancel": { const iv = h.inv[b.inviteId]; if (iv && iv.by === dev) delete h.inv[b.inviteId]; return { ok: true }; }
      case "invite-status": { const iv = h.inv[b.inviteId]; if (!iv || iv.by !== dev) throw this.err(404, "invitation not found"); return { used: iv.used, exp: iv.exp, join: iv.join || null }; }
      case "keys-add": { for (const [e, m] of Object.entries(b.envs || {})) { if (!h.keys[e]) throw this.err(400, "unknown epoch"); Object.assign(h.keys[e], m); } if (b.welcome && h.dev[b.welcome.dev]) h.welcome[b.welcome.dev] = b.welcome.box; return { ok: true }; }
      case "keys-get": { const out = {}; for (const [e, m] of Object.entries(h.keys)) if (m[dev]) out[e] = m[dev]; return { epoch: h.epoch, envs: out, welcome: h.welcome[dev] || null }; }
      case "rotate": { /* phase 1: stage the next epoch's envelopes; phase 2 ("commit") makes it current */
        if (b.e !== h.epoch + 1) throw this.err(409, "epoch already advanced");
        if (h.pend && h.pend.by !== dev && now - h.pend.at < 120000) throw this.err(409, "another device is rotating keys");
        h.pend = { e: b.e, envs: b.envs, recEnv: b.recEnv, by: dev, at: now }; return { ok: true };
      }
      case "commit": { if (!h.pend || h.pend.e !== b.e || h.pend.by !== dev) throw this.err(409, "nothing staged"); h.keys[b.e] = h.pend.envs; h.rec[b.e] = h.pend.recEnv; h.epoch = b.e; h.pend = null; return { ok: true, epoch: h.epoch }; }
      case "att-put": { if (typeof b.id !== "string" || typeof b.ct !== "string" || b.ct.length > this.LIM.att) throw this.err(413, "attachment too large"); h.att[b.id] = { e: b.e, n: b.n, ct: b.ct }; return { ok: true }; }
      case "att-get": { const x = h.att[b.id]; if (!x) throw this.err(404, "attachment not found"); return x; }
      default: throw this.err(404, "unknown endpoint");
    }
  }
  storeOp(h, env) { const key = env.dev + "|" + env.oid; if (h.oids[key]) return 0; h.oids[key] = 1; h.ops.push({ s: ++h.seq, e: env.e, dev: env.dev, oid: env.oid, n: env.n, ct: env.ct, sig: env.sig, rs: env.rs ? 1 : 0 }); return 1; }
}
