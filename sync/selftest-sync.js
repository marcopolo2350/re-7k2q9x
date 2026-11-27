/* Phase 5 synchronization tests (Stages 1-4). Run with ?testenv=1&selftest=sync on the development build.
   Uses only synthetic test households, separate IndexedDB databases per simulated phone and an in-memory relay.
   Never reads or writes household data; never prints keys, recovery words or invitation secrets. Results: window.__synctest */
(async function () {
  if (!TESTENV) { alert("Sync tests only run with ?testenv=1"); return; }
  const out = [], t0 = performance.now(), RUN = Math.random().toString(36).slice(2, 8), engines = [];
  const ok = (sys, name, pass, info) => out.push({ sys, name, pass: pass === null ? null : !!pass, info: info == null ? "" : String(info) });
  const T = async (sys, name, fn) => { try { const r = await fn(); Array.isArray(r) ? ok(sys, name, r[0], r[1]) : ok(sys, name, r); } catch (e) { ok(sys, name, false, "threw: " + ((e && e.message) || e)); } };
  const throwsCode = async (fn, code) => { try { await fn(); return false; } catch (e) { return code == null ? true : e.code === code; } };
  let now = Date.now(); const clock = () => now;
  const today = todayIso(), C = RM.canon, sl = ms => new Promise(r => setTimeout(r, ms));
  const MK = { note: "ZEBRA-NOTE-7731", milk: "MARKER-MILK-5521", sumac: "MARKER-SUMAC-8812" }; const SECRETS = [];
  function testState() {
    const s = migrate(Object.assign(fresh(), { schema: 3 }));
    s.pantry = ["salt", "rice", MK.sumac]; s.plan = { [today]: [{ uid: "p1", id: 5, s: 4, m: "D" }] }; s.extras = [{ uid: "x1", name: MK.milk, amt: "1", done: false }, { uid: "x2", name: "eggs", amt: "12", done: false }];
    s.left = [{ uid: "l1", id: 5, date: today, type: "dish" }]; s.fav = [5, 12]; s.rating = { 5: 8 }; s.notes = { 5: MK.note, 7: "less salt" };
    s.cols[0].ids = [5]; s.hist = { 5: [{ r: 4, d: today, u: "h1" }] }; s.ver = {}; s.inv = { rice: { exp: today } }; return s;
  }
  async function dev(relay, name, member, st) { const box = { S: st || testState() }; const e = new SyncEngine({ db: "re-sim-" + RUN + "-" + name + "-" + engines.length, relay, member, name, clock, state: { get: () => box.S, set: ns => { box.S = ns; } } }); engines.push(e); e.box = box; await e.init(); return e; }
  const S_ = e => e.box.S;
  async function pair(a, b) { const iv = await a.invite(); SECRETS.push(iv.code.split(".")[3]); const j = await b.join(iv.code); const pj = await a.pendingJoin(); await a.approve(pj, pj.sas === j.sas); return b.finishJoin(); }
  const ALLP = { plan: true, grocery: true, pantry: true, cols: true, favs: true, kitchen: true, notes: true, versions: true, history: true, photos: true };
  async function house(opts = {}) {
    const relay = new SimRelay(clock), rose = await dev(relay, "rose", "rose"), marco = await dev(relay, "marco", "marco", opts.marcoEmpty ? migrate(Object.assign(fresh(), { schema: 3 })) : undefined);
    const hh = await rose.createHousehold(opts.share || ALLP); SECRETS.push(hh.words);
    if (opts.marcoEmpty !== false) marco.box.S = migrate(Object.assign(fresh(), { schema: 3 })); /* the joining phone starts with no household data */
    await pair(rose, marco); await marco.setMeta({ share: { ...ALLP, notes: false, versions: false, history: false, photos: false } });
    await sync(rose, marco); return { relay, rose, marco, words: hh.words, hh: hh.hh };
  }
  async function sync(...es) { for (let i = 0; i < 2; i++) for (const e of es) await e.sync(); }
  const sortJ = a => [...(a || [])].map(x => C(x)).sort();
  const hv = S => C({ plan: Object.fromEntries(Object.entries(S.plan || {}).map(([d, es]) => [d, sortJ(es)]).sort()), extras: sortJ(S.extras), checked: nz(S.checked), gone: nz(S.gone), basket: S.basket, pantry: sortJ(S.pantry), inv: S.inv, left: sortJ(S.left), cols: sortJ((S.cols || []).map(c => ({ ...c, ids: sortJ(c.ids) }))), fav: sortJ(S.fav), hidden: sortJ(S.hidden), rating: S.rating, tk: S.tk, equip: S.equip });
  function nz(o) { const r = {}; for (const [k, v] of Object.entries(o || {})) if (v && Object.keys(v).length) r[k] = v; return r; }
  const same = (a, b) => hv(S_(a)) === hv(S_(b));
  try {
    /* ================= Stage 1: local model, change tracking, op queue ================= */
    await T("s1-model", "sync is off by default in the app and has no relay", () => [!SYNC.enabled() && typeof SyncEngine === "function", "enabled=" + SYNC.enabled()]);
    await T("s1-model", "every category round-trips state -> records -> state", () => {
      const s = testState(); s.checked = { [S.week]: { milk: true } }; s.basket = { 5: 4 }; s.tk = { 5: "https://www.tiktok.com/@x" }; s.ver = { v1: { id: "v1", base: 5, name: "Ours", s: 2 } }; s.photos = { 5: "data:image/png;base64,AAAA" }; s.cooked = [5];
      const back = migrate(Object.assign(fresh(), { schema: 3 })); const bad = [];
      for (const [c, d] of Object.entries(RM.D)) { const ent = d.from(s); d.to(back, ent, x => RM.D[x].from(s)); }
      for (const f of ["plan", "extras", "checked", "basket", "pantry", "inv", "left", "fav", "rating", "tk", "notes", "ver", "hist", "photos", "cooked", "equip"]) if (C(s[f]) !== C(back[f])) bad.push(f);
      if (C(s.cols.map(c => [c.id, c.name, c.ids])) !== C(back.cols.map(c => [c.id, c.name, c.ids]))) bad.push("cols");
      return [!bad.length, bad.join(",") || "16 collections"];
    });
    const relay1 = new SimRelay(clock), a1 = await dev(relay1, "s1a", "rose"); await a1.setMeta({ share: ALLP, hh: "local", epoch: 1 });
    await T("s1-model", "first capture creates one record per item with stable ids", async () => { const r = await a1.capture(); const r2 = await a1.capture(); const recs = await a1.st.all("rec"); return [r.n > 10 && r2.n === 0 && recs.every(x => RM.keyOk(x.k)), r.n + " records, recapture " + r2.n]; });
    await T("s1-model", "an edit queues one op with only the changed field", async () => {
      const before = await a1.pending(); S_(a1).plan[today][0].s = 6; const r = await a1.capture(); const outs = (await a1.st.all("out")).sort((x, y) => y.c - x.c);
      return [r.n === 1 && (await a1.pending()) === before + 1 && C(outs[0].f) === C({ s: 6 }) && outs[0].k === "plan/p1", C(outs[0].f)];
    });
    await T("s1-model", "removing an item queues a delete marker", async () => { S_(a1).extras = S_(a1).extras.filter(x => x.uid !== "x2"); await a1.capture(); const r = (await a1.st.all("rec")).find(x => x.k === "extra/x2"); return [r && !RM.present(r), "x2 present=" + (r && RM.present(r))]; });
    await T("s1-model", "pantry names with any characters are representable", async () => { S_(a1).pantry.push("salt / pepper | 50% (fine)"); await a1.capture(); const S2 = structuredClone(S_(a1)); S2.pantry = []; a1._project(S2, await a1.st.all("rec"), new Set(["pantry"])); return S2.pantry.includes("salt / pepper | 50% (fine)"); });
    await T("s1-txn", "storage-full during capture writes nothing (records and queue stay consistent)", async () => {
      const r0 = C(await a1.st.all("rec")), q0 = await a1.pending(); S_(a1).rating[12] = 6; a1.st.fault = { type: "quota" };
      const threw = await throwsCode(() => a1.capture()); const same0 = C(await a1.st.all("rec")) === r0 && (await a1.pending()) === q0;
      const r = await a1.capture(); return [threw && same0 && r.n === 1, "aborted cleanly, retried " + r.n];
    });
    await T("s1-txn", "app closing mid-write leaves no partial change", async () => { S_(a1).rating[5] = 2; a1.st.fault = { type: "crash" }; const q0 = await a1.pending(); const threw = await throwsCode(() => a1.capture()); const q1 = await a1.pending(); const r = await a1.capture(); return [threw && q0 === q1 && r.n === 1, q0 + "->" + q1]; });
    await T("s1-txn", "a change saved just before the app closed is captured on the next start", async () => {
      S_(a1).fav.push(99); const restarted = new SyncEngine({ db: a1.o.db, relay: relay1, member: "rose", clock, state: a1.o.state }); await restarted.init(); const r = await restarted.capture();
      const rec = (await restarted.st.all("rec")).find(x => x.k === "fav/99"); restarted.st.close(); return [r.n === 1 && rec && RM.present(rec), "ops " + r.n];
    });
    await T("s1-txn", "applying the same op twice is a no-op", async () => { const op = (await a1.st.all("out"))[0]; const rec = structuredClone((await a1.st.all("rec")).find(x => x.k === op.k)); const c1 = C(rec); return [RM.apply(rec, op) === false && C(rec) === c1]; });
    await T("s1-migrate", "history entries get stable ids additively; nothing else changes", async () => { const s = testState(); s.hist = { 5: [{ r: 3, d: today }, { r: 5, d: today, n: "great" }] }; const before = C(s.hist[5].map(e => ({ ...e }))); const n = RM.ensureIds(s); const after = C(s.hist[5].map(e => { const { u, ...x } = e; return x; })); return [n === 2 && before === after && s.hist[5].every(e => typeof e.u === "string"), n + " ids added"]; });
    await T("s1-migrate", "a failed store upgrade leaves the existing sync data intact", async () => {
      const name = a1.o.db, n0 = (await a1.st.all("rec")).length; a1.st.close();
      const fail = await new Promise(res => { const r = indexedDB.open(name, RStore.VERSION + 1); r.onupgradeneeded = () => { r.transaction.abort(); }; r.onsuccess = () => { r.result.close(); res(false); }; r.onerror = () => res(true); });
      const n1 = (await a1.st.all("rec")).length; return [fail && n1 === n0 && a1.st.db.version === RStore.VERSION, n0 + " records kept, version " + a1.st.db.version];
    });
    await T("s1-txn", "merge committed but app closed before saving state: recovered on next start", async () => {
      const h = await house(); S_(h.rose).rating[33] = 9; await h.rose.sync(); h.marco.T.crashAfterCommit = 1; const threw = await throwsCode(() => h.marco.pull());
      const lost = S_(h.marco).rating[33] == null; const again = new SyncEngine({ db: h.marco.o.db, relay: h.relay, member: "marco", clock, state: h.marco.o.state }); await again.init(); const r = S_(h.marco).rating[33] === 9; again.st.close();
      return [threw && lost && r, "recovered=" + r];
    });
    await T("s1-app", "real app: enabling local tracking queues changes; disabling stops it; no network", async () => {
      let fetches = 0; const f0 = window.fetch; window.fetch = (...a) => { fetches++; return f0(...a); };
      try {
        await SYNC.remove(); const e = await SYNC.enableLocal("rose", "test phone"); const q0 = await e.pending(); S.pantry = S.pantry.concat(["sync-test-item"]); save(); await sl(700); const q1 = await e.pending();
        SYNC.disable(); S.pantry = S.pantry.concat(["sync-test-item-2"]); save(); await sl(700); const q2 = await e.pending();
        S.pantry = S.pantry.filter(x => !/^sync-test-item/.test(x)); save(); await SYNC.remove();
        return [q1 === q0 + 1 && q2 === q1 && fetches === 0 && e.relay === null, `queued ${q1 - q0}, after disable ${q2 - q1}, network calls ${fetches}`];
      } finally { window.fetch = f0; }
    });
    await T("s1-app", "real app: restoring an old backup does not bring back deleted records", async () => {
      await SYNC.remove(); const saved = JSON.stringify(S); S.extras = (S.extras || []).concat([{ uid: "rt1", name: "restore-test", amt: "", done: false }]); save();
      const e = await SYNC.enableLocal("rose", "test phone"); const old = JSON.parse(JSON.stringify(S)); S.extras = S.extras.filter(x => x.uid !== "rt1"); save(); await sl(600); await e.capture();
      pendingImport = { st: old, photos: {}, cnt: {} }; const _t = toast; let msg = ""; toast = m => { msg = m; }; await A.lImpYes(); toast = _t; const back = (S.extras || []).some(x => x.uid === "rt1");
      await SYNC.remove(); S = migrate(Object.assign(fresh(), JSON.parse(saved))); save(); try { localStorage.removeItem(KEY + ".before-import"); } catch (x) {}
      return [!back && /not restored/.test(msg), msg];
    });
    /* ================= Stage 2: simulated multi-device synchronization ================= */
    const H = await house();
    await T("s2-sync", "pairing gives the second phone the household data", () => [same(H.rose, H.marco) && S_(H.marco).pantry.includes(MK.sumac), "pantry " + S_(H.marco).pantry.length]);
    await T("s2-sync", "Marco's phone does not receive Rose's personal notes as his own", () => [S_(H.marco).notes[5] == null && S_(H.marco).hh && S_(H.marco).hh.note && S_(H.marco).hh.note.rose && S_(H.marco).hh.note.rose[5] === MK.note, "shown as Rose's note"]);
    await T("s2-sync", "both phones edit offline (different items) and converge in either order", async () => {
      const res = [];
      for (const order of [[0, 1], [1, 0]]) { const h = await house(); const P = [h.rose, h.marco]; S_(h.rose).pantry.push("cumin"); S_(h.rose).plan[today].push({ uid: "r2", id: 7, s: 2, m: "L" }); S_(h.marco).extras.push({ uid: "m1", name: "bread", amt: "1", done: false }); S_(h.marco).fav.push(44);
        for (const i of order) await P[i].sync(); for (const i of order) await P[i].sync(); res.push(same(h.rose, h.marco) && S_(h.rose).fav.includes(44) && S_(h.marco).pantry.includes("cumin")); }
      return [res.every(Boolean), res.join(",")];
    });
    await T("s2-conflict", "grocery quantity edited on both phones: both values kept until resolved", async () => {
      const h = await house(); S_(h.rose).extras.find(x => x.uid === "x1").amt = "2"; S_(h.marco).extras.find(x => x.uid === "x1").amt = "3"; await sync(h.rose, h.marco);
      const cr = await h.rose.conflicts(), cm = await h.marco.conflicts(); const both = cr.length === 1 && cm.length === 1 && C(cr[0].vals.map(v => v.v).sort()) === C(["2", "3"]) && same(h.rose, h.marco);
      await h.rose.resolve("extra/x1", "amt", "5"); await sync(h.rose, h.marco);
      return [both && !(await h.rose.conflicts()).length && !(await h.marco.conflicts()).length && S_(h.marco).extras.find(x => x.uid === "x1").amt === "5", "kept both, resolved to 5"];
    });
    await T("s2-conflict", "grocery checkbox: concurrent checks merge, a later uncheck wins everywhere", async () => {
      const h = await house(); const w = S.week; S_(h.rose).checked = { [w]: { eggs: true } }; S_(h.marco).checked = { [w]: { eggs: true } }; await sync(h.rose, h.marco); const a = S_(h.marco).checked[w].eggs === true && !(await h.marco.conflicts()).length;
      delete S_(h.marco).checked[w].eggs; await sync(h.marco, h.rose); return [a && !(S_(h.rose).checked[w] || {}).eggs && same(h.rose, h.marco)];
    });
    await T("s2-conflict", "pantry: one phone uses up an item while the other uses it and buys more", async () => {
      const h = await house(); S_(h.rose).pantry = S_(h.rose).pantry.filter(x => x !== "rice"); S_(h.marco).pantry = S_(h.marco).pantry.filter(x => x !== "rice"); await h.marco.capture(); S_(h.marco).pantry.push("rice");
      await sync(h.rose, h.marco); return [same(h.rose, h.marco), "rice on both=" + S_(h.rose).pantry.includes("rice") + "/" + S_(h.marco).pantry.includes("rice")];
    });
    await T("s2-conflict", "meal plan: same meal edited on both phones keeps both; new meals on the same day both stay", async () => {
      const h = await house(); S_(h.rose).plan[today][0].s = 2; S_(h.marco).plan[today][0].s = 8; S_(h.rose).plan[today].push({ uid: "rA", id: 9, s: 2, m: "L" }); S_(h.marco).plan[today].push({ uid: "mA", id: 10, s: 2, m: "L" }); await sync(h.rose, h.marco);
      const cf = await h.marco.conflicts(); return [cf.length === 1 && cf[0].k === "plan/p1" && S_(h.marco).plan[today].length === 3 && same(h.rose, h.marco), cf.length + " conflict, " + S_(h.marco).plan[today].length + " meals"];
    });
    await T("s2-conflict", "collections: concurrent additions merge; concurrent renames are kept for a decision", async () => {
      const h = await house(); S_(h.rose).cols[0].ids.push(10); S_(h.marco).cols[0].ids.push(11); S_(h.rose).cols[1].name = "Marco's Picks"; S_(h.marco).cols[1].name = "Marco Faves"; await sync(h.rose, h.marco);
      const ids = sortJ(S_(h.rose).cols[0].ids), cf = await h.rose.conflicts(); return [ids.length === 3 && cf.length === 1 && cf[0].field === "name" && same(h.rose, h.marco), "ids " + ids.length + ", conflicts " + cf.length];
    });
    const R2 = { h: await house() }; R2.tab = await dev(R2.h.relay, "rose-tablet", "rose", migrate(Object.assign(fresh(), { schema: 3 }))); await pair(R2.h.rose, R2.tab); await R2.tab.setMeta({ share: ALLP }); await sync(R2.h.rose, R2.tab, R2.h.marco);
    await T("s2-sync", "Rose's second device receives her personal data as her own", () => [S_(R2.tab).notes[5] === MK.note && S_(R2.tab).hist[5].length === 1]);
    await T("s2-conflict", "personal recipe version edited on two of Rose's devices: both versions kept", async () => {
      S_(R2.h.rose).ver.v1 = { id: "v1", base: 5, name: "Garlicky", s: 4 }; await sync(R2.h.rose, R2.tab); S_(R2.h.rose).ver.v1 = { ...S_(R2.h.rose).ver.v1, name: "Extra garlic" }; S_(R2.tab).ver.v1 = { ...S_(R2.tab).ver.v1, name: "Less garlic" }; await sync(R2.h.rose, R2.tab, R2.h.marco);
      const cf = (await R2.tab.conflicts()).filter(c => c.k.startsWith("ver/")); return [cf.length === 1 && cf[0].vals.length === 2 && C(S_(R2.h.rose).ver) === C(S_(R2.tab).ver) && !S_(R2.h.marco).ver.v1 && S_(R2.h.marco).hh.ver.rose.v1, "2 versions kept; Marco sees it as Rose's"];
    });
    await T("s2-conflict", "cooking history: entries from both devices are all kept", async () => { S_(R2.h.rose).hist[5].push({ r: 5, d: today, u: "h2" }); S_(R2.tab).hist[5].push({ r: 3, d: today, u: "h3" }); await sync(R2.h.rose, R2.tab, R2.h.marco); return [S_(R2.h.rose).hist[5].length === 3 && S_(R2.tab).hist[5].length === 3 && !(await R2.tab.conflicts()).some(c => c.k.startsWith("hist/")), S_(R2.tab).hist[5].length + " entries"]; });
    await T("s2-conflict", "personal note edited on two devices: both texts kept", async () => { S_(R2.h.rose).notes[7] = "less salt, more lemon"; S_(R2.tab).notes[7] = "less salt, add chili"; await sync(R2.h.rose, R2.tab); const cf = (await R2.h.rose.conflicts()).filter(c => c.k.startsWith("note/")); return [cf.length === 1 && cf[0].vals.length === 2]; });
    await T("s2-conflict", "shared photo replaced on two devices: both photos kept and transferred intact", async () => {
      const p1 = "data:image/png;base64," + "Q".repeat(6000), p2 = "data:image/png;base64," + "W".repeat(7000); S_(R2.h.rose).photos[5] = p1; S_(R2.tab).photos[5] = p2; await sync(R2.h.rose, R2.tab);
      const cf = (await R2.tab.conflicts()).filter(c => c.k.startsWith("photo/")); const vals = cf[0] ? cf[0].vals.map(v => v.v) : []; const leak = R2.h.relay.dump().includes("QQQQQQQQQQQQ");
      return [cf.length === 1 && vals.includes(p1) && vals.includes(p2) && !leak, "attachments encrypted separately"];
    });
    await T("s2-delete", "grocery item deleted on one phone while edited offline on the other: stays deleted", async () => { const h = await house(); S_(h.rose).extras = S_(h.rose).extras.filter(x => x.uid !== "x1"); S_(h.marco).extras.find(x => x.uid === "x1").amt = "9"; await sync(h.marco, h.rose); return [!S_(h.rose).extras.some(x => x.uid === "x1") && !S_(h.marco).extras.some(x => x.uid === "x1")]; });
    await T("s2-delete", "note deleted on one device while edited on another: kept and flagged, not silently lost", async () => { delete S_(R2.h.rose).notes[5]; S_(R2.tab).notes[5] = MK.note + " plus lime"; await sync(R2.h.rose, R2.tab); const cf = (await R2.h.rose.conflicts()).filter(c => c.k.endsWith("/5") && c.field === "_del"); return [S_(R2.h.rose).notes[5] === MK.note + " plus lime" && cf.length === 1, "flagged " + cf.length]; });
    await T("s2-delete", "a phone returning after a long time offline does not bring deleted items back", async () => {
      const h = await house(); S_(h.rose).left = []; S_(h.rose).pantry = S_(h.rose).pantry.filter(x => x !== "salt"); await h.rose.sync(); now += 40 * 864e5;
      for (let i = 0; i < 5; i++) { S_(h.rose).rating[100 + i] = 5; await h.rose.sync(); }
      await sync(h.marco, h.rose); return [!S_(h.marco).left.length && !S_(h.marco).pantry.includes("salt") && !S_(h.rose).pantry.includes("salt") && same(h.rose, h.marco)];
    });
    await T("s2-delivery", "duplicated and reordered deliveries converge", async () => {
      const h = await house(); h.relay.fault = { dupPull: 1, shufflePull: 1 }; for (let i = 0; i < 20; i++) { S_(h.rose).rating[200 + i] = i % 10; S_(h.rose).plan[today][0].s = i + 1; await h.rose.capture(); } S_(h.marco).fav.push(77);
      await sync(h.rose, h.marco); h.relay.fault = {}; return [same(h.rose, h.marco) && S_(h.marco).plan[today][0].s === 20 && !(await h.marco.conflicts()).length, "servings " + S_(h.marco).plan[today][0].s];
    });
    await T("s2-delivery", "upload interrupted after the relay stored it: retry creates no duplicates", async () => {
      const h = await house(); S_(h.rose).pantry.push("saffron"); await h.rose.capture(); await h.rose.pull(); h.relay.fault = { loseResponse: 1 }; const threw = await throwsCode(() => h.rose.push()); h.relay.fault = {}; const n0 = h.relay.H[h.hh].ops.length; await h.rose.sync(); const n1 = h.relay.H[h.hh].ops.length; await h.marco.sync();
      return [threw && n1 === n0 && S_(h.marco).pantry.includes("saffron") && !(await h.rose.pending()), `relay ops ${n0}->${n1}`];
    });
    await T("s2-delivery", "download interrupted: nothing applied twice, everything applied once", async () => { const h = await house(); S_(h.rose).rating[300] = 7; await h.rose.sync(); h.relay.fault = { loseResponse: 1 }; await throwsCode(() => h.marco.pull()); h.relay.fault = {}; await h.marco.sync(); return [S_(h.marco).rating[300] === 7 && same(h.rose, h.marco)]; });
    await T("s2-delivery", "long-offline phone catches up across many pages (450 changes)", async () => { const h = await house(); for (let i = 0; i < 450; i++) S_(h.rose).rating[1000 + i] = 1 + (i % 9); await h.rose.sync(); now += 60 * 864e5; await h.marco.sync(); return [Object.keys(S_(h.marco).rating).length >= 451 && same(h.rose, h.marco), Object.keys(S_(h.marco).rating).length + " ratings"]; });
    await T("s2-delivery", "relay unavailable: edits wait locally and go out when it returns", async () => { const h = await house(); h.relay.fault = { down: 1 }; S_(h.rose).pantry.push("za'atar"); const threw = await throwsCode(() => h.rose.sync()); const q = await h.rose.pending(); h.relay.fault = {}; await sync(h.rose, h.marco); return [threw && q === 1 && S_(h.marco).pantry.includes("za'atar"), "queued " + q]; });
    await T("s2-recovery", "relay data loss: the household is rebuilt from the phones with nothing lost", async () => {
      const h = await house(); S_(h.rose).pantry.push("sumac2"); await sync(h.rose, h.marco); h.relay.wipe(); S_(h.marco).fav.push(501);
      await h.rose.sync(); await h.marco.sync(); await sync(h.rose, h.marco); S_(h.rose).rating[502] = 4; await sync(h.rose, h.marco);
      return [same(h.rose, h.marco) && S_(h.rose).fav.includes(501) && S_(h.marco).pantry.includes("sumac2") && S_(h.marco).rating[502] === 4, "rebuilt and syncing"];
    });
    await T("s2-schema", "an op from a newer app version is held, not applied or lost, until this app understands it", async () => {
      const h = await house(); const m = await h.rose.meta(); const op = { v: 1, sv: RM.SV + 1, id: h.rose.dev.id + ":999999", dev: h.rose.dev.id, c: 999999, l: 999999, k: "rate/777", b: {}, f: { v: 3, extra: "future" } };
      await h.relay.call("push", await (async () => { const env = await h.rose.seal(op, m); const body = { ops: [env] }; const a = { t: "dev", dev: h.rose.dev.id, ts: now, nonce: RC.id(16) }; a.sig = await RC.sign((await h.rose.key("sign")).privateKey, C({ p: "push", hh: m.hh, dev: a.dev, ts: a.ts, nonce: a.nonce, bh: RC.b64(await RC.sha256(C(body))) })); return { hh: m.hh, body, auth: a }; })());
      await h.marco.sync(); const held = S_(h.marco).rating[777] == null && (await h.marco.st.all("park")).length === 1;
      const sv = RM.SV; RM.SV = sv + 1; const n = await h.marco.unpark(); RM.SV = sv; return [held && n === 1 && S_(h.marco).rating[777] === 3, "held then applied"];
    });
    await T("s2-recovery", "lost sync position: a full re-download changes nothing", async () => { const h = await house(); const v0 = hv(S_(h.marco)); await h.marco.setMeta({ cursor: undefined }); await h.marco.sync(); return [hv(S_(h.marco)) === v0 && !(await h.marco.conflicts()).length]; });
    /* ================= Stage 3: cryptography and pairing ================= */
    const k1 = await RC.genHK(), k2 = await RC.genHK();
    await T("s3-crypto", "encryption round trip", async () => { const b = await RC.seal(k1, "hello", "aad"); return RC.td.decode(await RC.open(k1, b, "aad")) === "hello"; });
    await T("s3-crypto", "wrong key is rejected", async () => throwsCode(async () => RC.open(k2, await RC.seal(k1, "x", "a"), "a")));
    await T("s3-crypto", "tampered ciphertext and tampered header are rejected", async () => { const b = await RC.seal(k1, "x".repeat(40), "hdr"); const u = RC.unb64(b.ct); u[3] ^= 1; return (await throwsCode(() => RC.open(k1, { n: b.n, ct: RC.b64(u) }, "hdr"))) && (await throwsCode(() => RC.open(k1, b, "hdr2"))); });
    await T("s3-crypto", "nonces are 96-bit and never repeat (5,000 encryptions)", async () => { const s = new Set(); for (let i = 0; i < 5000; i++) s.add((await RC.seal(k1, "", "")).n); return [s.size === 5000 && [...s].every(n => RC.unb64(n).length === 12), s.size + " unique"]; });
    await T("s3-crypto", "BIP-39 official test vectors and checksum", async () => {
      const v = [[new Uint8Array(32), "abandon ".repeat(23) + "art"], [new Uint8Array(32).fill(0x7f), "legal winner thank year wave sausage worth useful ".repeat(2) + "legal winner thank year wave sausage worth title"], [new Uint8Array(32).fill(0xff), "zoo ".repeat(23) + "vote"]];
      let good = true; for (const [e, w] of v) { good = good && (await RC.toWords(e)) === w && C([...(await RC.fromWords(w))]) === C([...e]); }
      const bad = await throwsCode(() => RC.fromWords("abandon ".repeat(24).trim())); const short = await throwsCode(() => RC.fromWords("abandon art"));
      return [good && bad && short, "3 vectors, bad checksum rejected"];
    });
    await T("s3-crypto", "the household key is random and independent of the app passcode", async () => { const a = RC.b64(await RC.rawKey(await RC.genHK())), b = RC.b64(await RC.rawKey(await RC.genHK())); return [a !== b && RC.unb64(a).length === 32 && !/5225/.test(String(SyncEngine.prototype.createHousehold)), "256-bit, crypto.getRandomValues"]; });
    const P = await house();
    await T("s3-pair", "both phones show the same 6-digit code during pairing", async () => { const st = await dev(P.relay, "sas", "guest"); const iv = await P.rose.invite(); const j = await st.join(iv.code); const pj = await P.rose.pendingJoin(); await P.rose.cancelInvite(); return [/^\d{6}$/.test(j.sas) && pj.sas === j.sas, "match"]; });
    await T("s3-pair", "approval is refused unless the codes were confirmed to match", async () => { const g = await dev(P.relay, "g2", "guest"); const iv = await P.rose.invite(); await g.join(iv.code); const pj = await P.rose.pendingJoin(); const refused = await throwsCode(() => P.rose.approve(pj, false)); await P.rose.cancelInvite(); return refused && !(await g.finishJoin()); });
    await T("s3-pair", "an expired invitation is rejected (10 minutes)", async () => { const g = await dev(P.relay, "g3", "guest"); const iv = await P.rose.invite(); now += 601000; const r = await throwsCode(() => g.join(iv.code), 410); now += 1000; return r; });
    await T("s3-pair", "a used invitation cannot be used again", async () => { const g = await dev(P.relay, "g4", "guest"), g2 = await dev(P.relay, "g5", "guest"); const iv = await P.rose.invite(); await g.join(iv.code); return throwsCode(() => g2.join(iv.code), 409); });
    await T("s3-pair", "a cancelled invitation stops working", async () => { const g = await dev(P.relay, "g6", "guest"); const iv = await P.rose.invite(); await P.rose.cancelInvite(); return throwsCode(() => g.join(iv.code), 404); });
    await T("s3-pair", "a wrong invitation credential is rejected", async () => { const g = await dev(P.relay, "g7", "guest"); const iv = await P.rose.invite(); const p = iv.code.split("."); p[3] = RC.b64(RC.rand(32)); const r = await throwsCode(() => g.join(p.join(".")), 403); await P.rose.cancelInvite(); return r; });
    await T("s3-pair", "a relay that swaps in its own device key is detected", async () => {
      const g = await dev(P.relay, "g8", "guest"); const iv = await P.rose.invite(); await g.join(iv.code); const evil = await RC.genSign(); P.relay.H[P.hh].inv[iv.code.split(".")[2]].join.sp = await RC.pubJwk(evil.publicKey);
      const pj = await P.rose.pendingJoin(); await P.rose.cancelInvite(); return [pj && pj.bad === true, "join request rejected"];
    });
    await T("s3-auth", "requests from a device outside the household are rejected", async () => { const x = await dev(P.relay, "outsider", "x"); await x.setMeta({ hh: P.hh }); return throwsCode(() => x.req("pull", { after: 0 }), 403); });
    await T("s3-auth", "an invalid request signature is rejected", async () => { const m = await P.rose.meta(); const a = { t: "dev", dev: P.rose.dev.id, ts: now, nonce: RC.id(16), sig: RC.b64(RC.rand(64)) }; return throwsCode(() => P.relay.call("pull", { hh: m.hh, body: { after: 0 }, auth: a }), 401); });
    await T("s3-auth", "a replayed request is rejected; so is a stale one", async () => {
      const m = await P.rose.meta(), body = { after: 0 }, a = { t: "dev", dev: P.rose.dev.id, ts: now, nonce: RC.id(16) }; a.sig = await RC.sign((await P.rose.key("sign")).privateKey, C({ p: "pull", hh: m.hh, dev: a.dev, ts: a.ts, nonce: a.nonce, bh: RC.b64(await RC.sha256(C(body))) }));
      await P.relay.call("pull", { hh: m.hh, body, auth: a }); const replay = await throwsCode(() => P.relay.call("pull", { hh: m.hh, body, auth: a }), 409);
      const b = { ...a, nonce: RC.id(16), ts: now - 600000 }; b.sig = await RC.sign((await P.rose.key("sign")).privateKey, C({ p: "pull", hh: m.hh, dev: b.dev, ts: b.ts, nonce: b.nonce, bh: RC.b64(await RC.sha256(C(body))) })); const stale = await throwsCode(() => P.relay.call("pull", { hh: m.hh, body, auth: b }), 401);
      return replay && stale;
    });
    await T("s3-auth", "an op signed by a key outside the roster is ignored by the phones", async () => {
      const m = await P.marco.meta(); P.relay.H[P.hh].ops.push({ s: ++P.relay.H[P.hh].seq, e: m.epoch, dev: "FAKEDEVICE123456", oid: "FAKEDEVICE123456:1", n: RC.b64(RC.rand(12)), ct: RC.b64(RC.rand(300)), sig: RC.b64(RC.rand(64)), rs: 0 });
      const r0 = P.marco.stats.rejected; await P.marco.sync(); return [P.marco.stats.rejected === r0 + 1 && same(P.rose, P.marco), "rejected"];
    });
    const V = await house(); const lost = V.marco; const third = await dev(V.relay, "rose-old", "rose", migrate(Object.assign(fresh(), { schema: 3 }))); await pair(V.rose, third); await sync(V.rose, third, lost);
    S_(third).rating[1] = 1; await third.capture(); /* third goes offline before the rotation, with a queued edit */
    await T("s3-revoke", "revoking a lost phone: its requests are rejected and the household key changes", async () => {
      const e0 = (await V.rose.meta()).epoch; const e1 = await V.rose.revoke(lost.dev.id); const pull = await throwsCode(() => lost.pull(), 403); S_(lost).pantry.push("stolen"); await lost.capture(); const push = await throwsCode(() => lost.push(), 403);
      const env = V.relay.H[V.hh].keys[e1]; return [e1 === e0 + 1 && pull && push && !env[lost.dev.id] && env[V.rose.dev.id] && env[third.dev.id], `epoch ${e0}->${e1}; no new key for the lost phone`];
    });
    await T("s3-revoke", "remaining phones keep syncing under the new key", async () => { S_(V.rose).pantry.push("after-rotation"); await V.rose.sync(); const m = await V.rose.meta(); const last = V.relay.H[V.hh].ops.slice(-1)[0]; return [last.e === m.epoch && m.epoch === 2, "epoch " + last.e]; });
    await T("s3-revoke", "a phone that was offline during rotation gets the new key and catches up", async () => { await third.sync(); await V.rose.sync(); return [(await third.meta()).epoch === 2 && S_(third).pantry.includes("after-rotation") && S_(V.rose).rating[1] === 1, "caught up, its queued edit delivered"]; });
    await T("s3-revoke", "the revoked phone cannot decrypt anything written after revocation", async () => { const last = V.relay.H[V.hh].ops.slice(-1)[0]; let k = await lost.key("hk:" + last.e); return [!k, "no epoch-" + last.e + " key"]; });
    await T("s3-recover", "recovery code restores a replacement phone without any other phone", async () => {
      const nw = await dev(V.relay, "rose-new", "rose", migrate(Object.assign(fresh(), { schema: 3 }))); await nw.recover(V.hh, V.words); await nw.setMeta({ share: ALLP }); await nw.sync();
      return [S_(nw).pantry.includes("after-rotation") && S_(nw).notes[5] === MK.note && (await nw.meta()).epoch === 2, "household and Rose's notes restored"];
    });
    await T("s3-recover", "wrong recovery words are rejected", async () => { const nw = await dev(V.relay, "rose-x", "rose"); const w = V.words.split(" "); [w[0], w[1]] = [w[1], w[0]]; const a = await throwsCode(() => nw.recover(V.hh, w.join(" "))); const other = await RC.newRecovery(); const b = await throwsCode(() => nw.recover(V.hh, other.words), 403); return a && b; });
    await T("s3-leak", "the relay holds no household plaintext and no keys", async () => {
      const d = V.relay.dump() + P.relay.dump() + H.relay.dump(); const keys = []; for (const e of [V.rose, P.rose, H.rose]) { const m = await e.meta(); for (let i = 1; i <= m.epoch; i++) { const k = await e.key("hk:" + i); if (k) keys.push(RC.b64(await RC.rawKey(k))); } }
      const hits = [MK.note, MK.milk, MK.sumac, "less salt", "after-rotation", ...keys, ...SECRETS.flatMap(s => s.split(" ").length === 24 ? [s] : [s])].filter(x => d.includes(x));
      return [!hits.length && keys.length >= 3, hits.length ? hits.length + " leaked" : "checked " + (3 + keys.length + SECRETS.length) + " secrets/markers"];
    });
    await T("s3-leak", "diagnostics contain no secrets", async () => { const d = JSON.stringify([V.rose.stats, P.marco.stats, out]); return ![MK.note, ...SECRETS].some(x => d.includes(x)); });
    /* ================= Stage 4: adversarial and interruption ================= */
    const X = await house(); const xm = await X.rose.meta();
    const inject = async (op, mut) => { const env = await X.rose.seal(op, xm); if (mut) mut(env); const h = X.relay.H[X.hh]; h.ops.push({ s: ++h.seq, ...env }); };
    const base = (k, f, extra) => ({ v: 1, sv: 1, id: X.rose.dev.id + ":" + (900000 + out.length), dev: X.rose.dev.id, c: 900000 + out.length, l: 900000, k, b: {}, f, ...(extra || {}) });
    await T("s4-attack", "corrupted relay messages are rejected and change nothing", async () => { const v0 = hv(S_(X.marco)); await inject(base("rate/5", { v: 1 }), env => { const u = RC.unb64(env.ct); u[10] ^= 255; env.ct = RC.b64(u); }); const r0 = X.marco.stats.rejected; await X.marco.sync(); return [X.marco.stats.rejected === r0 + 1 && hv(S_(X.marco)) === v0]; });
    for (const [name, op] of [["prototype-pollution field", base("rate/5", JSON.parse('{"__proto__":{"polluted":1}}'))], ["prototype-pollution record id", base("note/rose/__proto__", { v: "x" })], ["unknown collection", base("evil/1", { v: 1 })], ["path-like record id", base("rate/../../x", { v: 1 })], ["oversized value", base("note/rose/5", { v: "x".repeat(25000) })], ["deeply nested value", base("ver/rose/v9", { v: JSON.parse("[".repeat(20) + "]".repeat(20)) })], ["bad delete marker", base("rate/5", { _del: "yes" })], ["mismatched op id", { ...base("rate/5", { v: 1 }), id: "someone:1" }], ["op claiming another author", { ...base("rate/5", { v: 1 }), dev: "AAAAAAAAAAAAAAAAAAAAAA", id: "AAAAAAAAAAAAAAAAAAAAAA:900001" }], ["wrong format version", { ...base("rate/5", { v: 1 }), v: 2 }]])
      await T("s4-attack", "malicious payload rejected: " + name, async () => { const v0 = hv(S_(X.marco)); const r0 = X.marco.stats.rejected; await inject(op); await X.marco.sync(); return [X.marco.stats.rejected === r0 + 1 && hv(S_(X.marco)) === v0 && ({}).polluted === undefined, Object.keys(X.marco.stats.why).slice(-1)[0]]; });
    await T("s4-attack", "script text in a synced note is stored as text and displayed escaped", async () => { S_(X.rose).fav.push(666); S_(X.rose).extras.push({ uid: "xs", name: "<img src=x onerror=alert(1)>", amt: "", done: false }); await sync(X.rose, X.marco); const n = S_(X.marco).extras.find(x => x.uid === "xs"); return [n && esc(n.name).indexOf("<img") < 0, "escaped on display"]; });
    await T("s4-attack", "excessive sizes: relay refuses oversized requests and ops; phones refuse oversized ops", async () => {
      const big = await throwsCode(() => X.relay.call("push", { hh: X.hh, body: { ops: [{ ct: "x".repeat(300000) }] } }), 413);
      const r0 = X.marco.stats.rejected; await inject(base("rate/5", { v: 1 }), env => { env.ct = "A".repeat(100000); }); await X.marco.sync(); return [big && X.marco.stats.rejected === r0 + 1];
    });
    await T("s4-attack", "a phone from another household cannot read or write this one", async () => { const other = await house(); const m = await other.rose.meta(); await other.rose.setMeta({ hh: X.hh }); other.rose.relay = X.relay; /* same relay, different household */ let c1, c2; try { await other.rose.req("pull", { after: 0 }); } catch (e) { c1 = e.code; } try { await other.rose.req("push", { ops: [] }); } catch (e) { c2 = e.code; } await other.rose.setMeta({ hh: m.hh }); return [c1 === 403 && c2 === 403, c1 + "/" + c2]; });
    await T("s4-interrupt", "key rotation interrupted between upload and commit: household keeps working, then resumes", async () => {
      const h = await house(); h.rose.T.crashMidRotate = 1; const threw = await throwsCode(() => h.rose.rotate()); const ep = h.relay.H[h.hh].epoch; S_(h.marco).pantry.push("mid-rotation"); await sync(h.marco, h.rose);
      const staged = !!(await h.rose.key("stage:2")); const e = await h.rose.rotate(); await sync(h.rose, h.marco); S_(h.marco).pantry.push("post-rotation"); await sync(h.marco, h.rose);
      return [threw && ep === 1 && staged && e === 2 && S_(h.rose).pantry.includes("mid-rotation") && S_(h.rose).pantry.includes("post-rotation") && (await h.marco.meta()).epoch === 2, "resumed with the same staged key"];
    });
    await T("s4-interrupt", "pairing interrupted before approval: nothing granted, a new invitation works", async () => {
      const h = await house(); const g = await dev(h.relay, "half", "guest"); const iv = await h.rose.invite(); await g.join(iv.code); h.rose.inv = null; /* inviting phone closed */ now += 601000;
      const none = !(await g.finishJoin()) && !h.relay.H[h.hh].dev[g.dev.id]; const g2 = await dev(h.relay, "retry", "guest", migrate(Object.assign(fresh(), { schema: 3 }))); const okp = await pair(h.rose, g2); return [none && okp, "first attempt granted nothing"];
    });
    await T("s4-interrupt", "storage full while merging: nothing applied, position not advanced, retry succeeds", async () => {
      const h = await house(); S_(h.rose).rating[808] = 8; await h.rose.sync(); const c0 = (await h.marco.meta()).cursor; h.marco.st.fault = { type: "quota" }; const threw = await throwsCode(() => h.marco.pull());
      const c1 = (await h.marco.meta()).cursor; const not = S_(h.marco).rating[808] == null; await h.marco.sync(); return [threw && c0 === c1 && not && S_(h.marco).rating[808] === 8];
    });
    await T("s4-recovery", "encrypted household backup restores without the relay; wrong words fail", async () => {
      const h = await house(); const file = await h.rose.encryptedBackup(h.words); h.relay.fault = { down: 1 }; const p = await SyncEngine.openBackup(file, h.words); const ow = (await RC.newRecovery()).words; const wrong = await throwsCode(() => SyncEngine.openBackup(file, ow)); h.relay.fault = {};
      return [p.state.notes[5] === MK.note && Object.keys(p.keys).length === 1 && wrong && !file.includes(MK.note), "file is encrypted"];
    });
    await T("s4-recovery", "local sync store corrupted: rebuilt from the relay without losing or reviving anything", async () => {
      const h = await house(); S_(h.rose).extras = S_(h.rose).extras.filter(x => x.uid !== "x2"); await sync(h.rose, h.marco); S_(h.marco).pantry.push("unsent-edit");
      await h.marco.st.tx(["rec", "out"], "readwrite", async s => { await s.rec.clear(); await s.out.clear(); }); await h.marco.setMeta({ cursor: 0 });
      await h.marco.rebuild(); await sync(h.marco, h.rose); return [same(h.rose, h.marco) && !S_(h.rose).extras.some(x => x.uid === "x2") && S_(h.rose).pantry.includes("unsent-edit"), "rebuilt"];
    });
    await T("s4-client", "Content Security Policy: no inline or third-party scripts, no plug-ins, no base override", () => { const m = document.querySelector('meta[http-equiv="Content-Security-Policy"]'); const c = m ? m.content : ""; const sc = (c.match(/script-src([^;]*)/) || [])[1] || ""; return [!!m && !/unsafe-inline|unsafe-eval|https?:/.test(sc) && /object-src 'none'/.test(c) && /base-uri 'none'/.test(c), sc.trim().split(" ").length + " script sources"]; });
    await T("s4-client", "every loaded script is a same-origin file (no CDNs)", () => { const ext = [...document.scripts].filter(x => x.src && new URL(x.src).origin !== location.origin); return [!ext.length, document.scripts.length + " scripts"]; });
    await T("s4-recovery", "interrupted backup restore (existing safeguard) still works with sync code loaded", () => typeof checkInterruptedRestore === "function" && localStorage.getItem(KEY + ".restore-pending") === null);
  } catch (e) { ok("suite", "sync test suite crashed", false, (e && e.message) || e); }
  for (const e of engines) { try { await e.st.destroy(); } catch (x) {} }
  const pass = out.filter(x => x.pass === true).length, skip = out.filter(x => x.pass === null).length;
  window.__synctest = { pass, skip, fail: out.length - pass - skip, ms: Math.round(performance.now() - t0), results: out };
  const d = document.createElement("div"); d.id = "synctest";
  d.innerHTML = `<h2>Sync tests (simulated phones and relay, test data only): ${pass}/${out.length} passed</h2>${out.map(x => `<div style="color:${x.pass ? "#2F5A33" : "#A33A1F"}">${x.pass === null ? "–" : x.pass ? "✓" : "✗"} <b>${esc(x.sys)}</b> ${esc(x.name)} <small>${esc(x.info)}</small></div>`).join("")}<p><a href="./">Close</a></p>`;
  d.style.cssText = "position:fixed;inset:0;z-index:999;overflow:auto;background:#fff;color:#222;padding:16px;font:14px -apple-system,sans-serif"; document.body.appendChild(d);
})();
