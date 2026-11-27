/* Rose's EATS sync: record model, projection between app state and records, merge rules, validation.
   Every syncable thing in the app state becomes a record "collection/id" whose fields are multi-value registers:
   each field keeps the set of concurrent writes ("heads"), each tagged with its dot [device, counter],
   the version vector the writer had seen (base), and a Lamport clock. A write removes the heads its base covers.
   Display uses the head with the highest (lamport, device); fields marked "keep" surface concurrent heads as conflicts.
   Ordering never depends on device wall clocks. See docs/PHASE5-SPEC.md B5/B6. */
"use strict";
const RM = (() => {
  const SV = 1; /* sync op format version this build understands */
  const canon = RC.canon;
  const omit = (o, k) => { const r = {}; for (const x in o) if (x !== k && o[x] !== undefined) r[x] = o[x]; return r; };
  const ordered = (old, ids, make, idOf) => { const have = new Map(ids.map(x => [x[0], x])); const out = []; for (const o of old || []) { const id = idOf(o); if (have.has(id)) { out.push(make(have.get(id))); have.delete(id); } } for (const x of have.values()) out.push(make(x)); return out; };
  /* collection descriptors: from(S) -> [[id, fields]], to(S, entries) rebuilds that part of S */
  const mapScalar = p => ({ from: S => Object.entries(S[p] || {}).filter(([, v]) => v != null).map(([id, v]) => [id, { v }]), to: (S, E) => { S[p] = Object.fromEntries(E.map(([id, f]) => [id, f.v])); } });
  const mapWhole = p => ({ from: S => Object.entries(S[p] || {}).map(([id, v]) => [id, { v }]), to: (S, E) => { S[p] = Object.fromEntries(E.map(([id, f]) => [id, f.v])); } });
  const setOf = p => ({ from: S => (S[p] || []).map(x => [String(x), { n: x }]), to: (S, E) => { S[p] = ordered(S[p], E, e => e[1].n, x => String(x)); } });
  const arrUid = (p, idf) => ({ from: S => (S[p] || []).filter(o => o && o[idf] != null).map(o => [String(o[idf]), omit(o, idf)]), to: (S, E) => { S[p] = ordered(S[p], E, ([id, f]) => ({ [idf]: typeof f.__n === "number" ? +id : id, ...omit(f, "__n") }), o => String(o[idf])); } });
  const arrWhole = (p, idf) => ({ from: S => (S[p] || []).filter(o => o && o[idf] != null).map(o => [String(o[idf]), { v: o }]), to: (S, E) => { S[p] = ordered(S[p], E, e => e[1].v, o => String(o[idf])); } });
  const nested = p => ({ from: S => Object.entries(S[p] || {}).flatMap(([w, m]) => Object.entries(m || {}).map(([k, v]) => [w + "|" + k, { v }])), to: (S, E) => { const o = {}; for (const [id, f] of E) { const i = id.indexOf("|"); const w = id.slice(0, i); (o[w] = o[w] || {})[id.slice(i + 1)] = f.v; } S[p] = o; } });
  const D = {
    plan: { cat: "plan", keep: true, del: "preserve", from: S => Object.entries(S.plan || {}).flatMap(([d, es]) => (es || []).filter(e => e && e.uid).map(e => [e.uid, { ...omit(e, "uid"), date: d }])), to: (S, E) => { const p = {}; const old = Object.values(S.plan || {}).flat(); for (const e of ordered(old, E, ([id, f]) => ({ uid: id, ...f }), e => e.uid)) { const { date, ...x } = e; (p[date] = p[date] || []).push(x); } S.plan = p; } },
    extra: { cat: "grocery", keep: ["name", "amt"], del: "delwins", ...arrUid("extras", "uid") },
    chk: { cat: "grocery", ...nested("checked") },
    gone: { cat: "grocery", ...nested("gone") },
    bask: { cat: "grocery", keep: ["v"], del: "delwins", ...mapScalar("basket") },
    pan: { cat: "pantry", ...setOf("pantry") },
    inv: { cat: "pantry", keep: true, del: "delwins", ...mapWhole("inv") },
    left: { cat: "pantry", keep: true, del: "delwins", ...arrUid("left", "uid") },
    col: { cat: "cols", keep: ["name"], del: "preserve", from: S => (S.cols || []).map(c => [c.id, { name: c.name }]), to: (S, E, all) => { const mem = {}; for (const [id, f] of all("colm")) { const i = id.indexOf("|"); (mem[id.slice(0, i)] = mem[id.slice(0, i)] || []).push([id.slice(i + 1), f]); } S.cols = ordered(S.cols, E, ([id, f]) => { const old = (S.cols || []).find(c => c.id === id); return { id, name: f.name, ids: ordered(old ? old.ids : [], mem[id] || [], e => e[1].n, x => String(x)) }; }, c => c.id); } },
    colm: { cat: "cols", from: S => (S.cols || []).flatMap(c => (c.ids || []).map(r => [c.id + "|" + r, { n: r }])), to: () => {} },
    fav: { cat: "favs", ...setOf("fav") },
    hide: { cat: "favs", ...setOf("hidden") },
    rate: { cat: "favs", ...mapScalar("rating") },
    tk: { cat: "favs", ...mapScalar("tk") },
    equip: { cat: "kitchen", ...mapScalar("equip") },
    note: { cat: "notes", own: true, keep: true, del: "preserve", ...mapScalar("notes") },
    ver: { cat: "versions", own: true, keep: true, del: "preserve", ...mapWhole("ver") },
    mine: { cat: "versions", own: true, keep: true, del: "preserve", ...arrWhole("mine", "id") },
    hist: { cat: "history", own: true, keep: true, del: "preserve", from: S => Object.entries(S.hist || {}).flatMap(([r, es]) => (es || []).filter(e => e && e.u).map(e => [r + "|" + e.u, { v: e }])), to: (S, E) => { const h = {}; const old = Object.entries(S.hist || {}).flatMap(([r, es]) => (es || []).map(e => ({ r, e }))); for (const x of ordered(old, E, ([id, f]) => ({ r: id.slice(0, id.indexOf("|")), e: f.v }), x => x.r + "|" + (x.e && x.e.u))) (h[x.r] = h[x.r] || []).push(x.e); S.hist = h; } },
    cook: { cat: "history", own: true, ...setOf("cooked") },
    photo: { cat: "photos", own: true, keep: true, del: "preserve", ...mapScalar("photos") }
  };
  const HOUSE = ["plan", "grocery", "pantry", "cols", "favs", "kitchen"], PERSONAL = ["notes", "versions", "history", "photos"];
  const CAT_LABEL = { plan: "Meal plan", grocery: "Grocery list", pantry: "Pantry and leftovers", cols: "Collections", favs: "Favorites and ratings", kitchen: "Kitchen equipment", notes: "Personal notes", versions: "Personal recipe versions and own recipes", history: "Cooking history", photos: "Personal photos" };
  /* additive: give cooking-history entries a stable id once (never removes or renames anything) */
  function ensureIds(S) { let n = 0; for (const es of Object.values(S.hist || {})) for (const e of es || []) if (e && typeof e === "object" && !e.u) { e.u = RC.id(9); n++; } return n; }
  /* ---------- registers ---------- */
  const win = hs => { let a = null; for (const h of hs || []) if (!a || h.l > a.l || (h.l === a.l && h.d[0] > a.d[0])) a = h; return a; };
  const covered = (b, d) => (b[d[0]] || 0) >= d[1];
  function present(rec) {
    const pol = D[rec.c].del || "lww", dh = rec.f._del || [];
    if (!dh.length) return true;
    if (pol === "lww") return win(dh).v !== true;
    if (pol === "delwins") return !dh.some(h => h.v === true);
    const dels = dh.filter(h => h.v === true); if (!dels.length) return true; /* preserve: survives only if some edit is concurrent with every delete */
    if (win(dh).v !== true && dh.some(h => h.v === false && !dels.some(x => covered(x.b, h.d)))) return true;
    return Object.entries(rec.f).some(([k, hs]) => k !== "_del" && hs.some(h => h.v != null && !dels.some(x => covered(x.b, h.d))));
  }
  function value(rec) { const o = {}; for (const [k, hs] of Object.entries(rec.f)) { if (k === "_del") continue; const w = win(hs); if (w && w.v != null) o[k] = w.v; } return o; }
  function conflicts(rec) {
    const p = D[rec.c], out = []; if (!present(rec)) return out;
    for (const [k, hs] of Object.entries(rec.f)) { if (k === "_del" || !(p.keep === true || (p.keep || []).includes(k))) continue; const vals = [...new Map(hs.filter(h => h.v != null).map(h => [canon(h.v), h])).values()]; if (vals.length > 1) out.push({ k: rec.k, field: k, vals: vals.map(h => ({ v: h.v, dev: h.d[0], l: h.l })).sort((a, b) => b.l - a.l || (b.dev > a.dev ? 1 : -1)) }); }
    if (p.del === "preserve" && (rec.f._del || []).some(h => h.v === true)) out.push({ k: rec.k, field: "_del", vals: [] });
    return out;
  }
  /* apply one op to a record (pure apart from mutating rec). Returns true when it changed anything.
     Ops from one device on one record are causally ordered (each includes the previous in its base), so a dot at or
     below the record's vector entry for that device is a duplicate or already superseded. */
  function apply(rec, op) {
    rec.vv = rec.vv || {}; rec.f = rec.f || {};
    if ((rec.vv[op.dev] || 0) >= op.c) return false;
    const dot = [op.dev, op.c];
    for (const [k, v] of Object.entries(op.f)) {
      const hs = rec.f[k] || [];
      if (hs.some(h => covered(h.b, dot))) continue; /* a later write already replaced this one */
      const nh = hs.filter(h => !covered(op.b, h.d)); nh.push({ v: v === undefined ? null : v, d: dot, b: op.b, l: op.l }); rec.f[k] = nh;
    }
    if (op.f._del === true) for (const [k, hs] of Object.entries(rec.f)) if (k !== "_del") { rec.f[k] = hs.filter(h => !covered(op.b, h.d)); if (!rec.f[k].length) delete rec.f[k]; }
    rec.vv[op.dev] = op.c; if (!rec.cl) rec.cl = op.l; return true;
  }
  /* ---------- validation of anything received from another device ---------- */
  const BAD = /^(__proto__|constructor|prototype|hasOwnProperty|toString|valueOf)$/;
  const DEVRX = /^[A-Za-z0-9_-]{8,43}$/, FRX = /^[A-Za-z_][A-Za-z0-9_]{0,30}$/, IDRX = /^[A-Za-z0-9%._~!*'()-]{1,300}$/;
  /* record ids are URI-encoded app ids, so any pantry name or recipe id is representable and "/" stays a separator */
  const encId = id => encodeURIComponent(String(id));
  function decId(p) { try { return decodeURIComponent(p); } catch (e) { return null; } }
  function keyOk(k) {
    if (typeof k !== "string" || k.length > 400) return false; const i = k.indexOf("/"); if (i < 0) return false; const c = k.slice(0, i); if (!Object.prototype.hasOwnProperty.call(D, c)) return false;
    const parts = k.slice(i + 1).split("/"); if (parts.length !== (D[c].own ? 2 : 1)) return false;
    return parts.every(p => { if (!IDRX.test(p)) return false; const d = decId(p); return d != null && d.length > 0 && !d.split("|").some(x => BAD.test(x)); });
  }
  const sizeOk = (v, depth = 0) => depth < 8 && (v === null || typeof v === "boolean" || (typeof v === "number" && isFinite(v)) || (typeof v === "string" && v.length <= 20000) || (Array.isArray(v) && v.length <= 500 && v.every(x => sizeOk(x, depth + 1))) || (typeof v === "object" && !Array.isArray(v) && Object.keys(v).length <= 60 && Object.keys(v).every(k => !BAD.test(k) && k.length <= 40) && Object.values(v).every(x => sizeOk(x, depth + 1))));
  function validOp(o) {
    if (!o || typeof o !== "object" || Array.isArray(o)) return "not an object";
    if (o.v !== 1) return "unknown op version"; if (!Number.isInteger(o.sv) || o.sv < 1) return "bad schema version";
    if (typeof o.dev !== "string" || !DEVRX.test(o.dev)) return "bad device id"; if (!Number.isInteger(o.c) || o.c < 1 || o.c > 1e12) return "bad counter"; if (!Number.isInteger(o.l) || o.l < 1 || o.l > 1e12) return "bad clock";
    if (!keyOk(o.k)) return "bad record id";
    if (!o.b || typeof o.b !== "object" || Array.isArray(o.b) || Object.keys(o.b).length > 64 || !Object.entries(o.b).every(([d, n]) => DEVRX.test(d) && Number.isInteger(n) && n >= 0)) return "bad base";
    if (!o.f || typeof o.f !== "object" || Array.isArray(o.f)) return "bad fields"; const ks = Object.keys(o.f); if (!ks.length || ks.length > 40) return "bad field count";
    if (!ks.every(k => FRX.test(k) && !BAD.test(k))) return "bad field name"; if (!Object.values(o.f).every(v => sizeOk(v))) return "value too large or malformed";
    if ("_del" in o.f && typeof o.f._del !== "boolean") return "bad delete marker"; if (o.id !== o.dev + ":" + o.c) return "bad op id";
    return null;
  }
  return { SV, D, HOUSE, PERSONAL, CAT_LABEL, ensureIds, win, present, value, conflicts, apply, validOp, keyOk, encId, decId, canon };
})();
