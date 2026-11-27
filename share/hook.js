/* Household sharing: connection to the app. OFF until someone sets up or joins a household (localStorage KEY+".share").
   No network calls of any kind. Turning it off leaves the app's data exactly as it is. */
"use strict";
const SHARE = (() => {
  const CFG = KEY + ".share", RESTORE = KEY + ".share-restore", DB = TESTENV ? "roses-eats-share-test" : "roses-eats-share";
  let eng = null, timer = null, gen = 0, quiet = false;
  const cfg = () => { try { return JSON.parse(localStorage.getItem(CFG) || "null"); } catch (e) { return null; } };
  const on = () => !!(cfg() && cfg().on);
  const setCfg = c => localStorage.setItem(CFG, JSON.stringify(c));
  const adapter = {
    get: () => S,
    set: (ns, json) => { try { localStorage.setItem(KEY, json != null ? json : JSON.stringify(ns)); } catch (e) { return false; } S = ns; gen++; try { if (typeof syncMine === "function") syncMine(); render(true); } catch (e) {} return true; },
    raw: () => localStorage.getItem(KEY), gen: () => gen
  };
  const photos = { get: k => IDB.get(k), put: (k, v) => IDB.put(k, v) };
  const _save = save; save = function () { gen++; _save(); if (!quiet && on()) { clearTimeout(timer); timer = setTimeout(capture, 600); } };
  async function engine() { if (!eng) { eng = new HouseShare({ db: DB, state: adapter, photos }); await eng.init(); } return eng; }
  async function capture() { try { await (await engine()).capture(); SHARE.lastError = null; } catch (e) { SHARE.lastError = e.code || e.name || "error"; } }
  async function start(member) { setCfg({ on: true, member }); const e = await engine(); const r = await e.setup(member); return r; }
  async function join(words, member) { const e = await engine(); await e.join(words, member); setCfg({ on: true, member }); return e; }
  async function leave() { const e = await engine(); await e.leave(); eng = null; localStorage.removeItem(CFG); }
  /* restoring a full app backup: mark it first, so an interrupted restore is reconciled on the next start */
  const _imp = A.lImpYes;
  A.lImpYes = async () => { if (on()) localStorage.setItem(RESTORE, "1"); await _imp(); if (!on()) return; const e = await engine(); const r = await e.afterAppRestore(); localStorage.removeItem(RESTORE); if (r.kept != null) toast("Household items already shared were kept as they are now"); };
  if (on()) setTimeout(async () => { try { const e = await engine(); if (localStorage.getItem(RESTORE)) { await e.afterAppRestore(); localStorage.removeItem(RESTORE); } await e.capture(); } catch (x) { SHARE.lastError = x.code || x.name || "error"; } }, 700);
  if (/[?&]selftest=share/.test(location.search)) setTimeout(() => { const b = document.createElement("script"); b.src = "share/selftest-share.js?v=" + Date.now(); document.body.appendChild(b); }, 1500);
  return { on, cfg, setCfg, engine, capture, start, join, leave, adapter, lastError: null };
})();
