/* Stage 1 integration with the real app: local change tracking only. OFF unless explicitly enabled
   (localStorage KEY + ".sync"); makes no network calls (the engine has no relay here); removing it leaves the app's
   data exactly as it was, because the app state stays in localStorage and the sync store is only derived from it. */
"use strict";
const SYNC = (() => {
  const CFG = KEY + ".sync"; let eng = null, timer = null, busy = false, quiet = false;
  const cfg = () => { try { return JSON.parse(localStorage.getItem(CFG) || "null"); } catch (e) { return null; } };
  const enabled = () => !!(cfg() && cfg().on);
  const quietSave = () => { quiet = true; try { save(); } finally { quiet = false; } };
  const adapter = { get: () => S, set: (ns, o) => { S = ns; quietSave(); if (!(o && o.quiet)) { syncMine(); render(true); } } };
  const _save = save; save = function () { _save(); if (!quiet && enabled()) { clearTimeout(timer); timer = setTimeout(run, 400); } };
  async function engine() { if (!eng) { const c = cfg() || {}; eng = new SyncEngine({ db: TESTENV ? "roses-eats-sync-test" : "roses-eats-sync", relay: null, member: c.member || "me", name: c.name || "phone", state: adapter }); await eng.init(); } return eng; }
  async function run() { if (busy) { clearTimeout(timer); timer = setTimeout(run, 400); return; } busy = true; try { await (await engine()).capture(); } catch (e) { SYNC.lastError = e.name || "error"; } finally { busy = false; } }
  async function enableLocal(member, name, share) { localStorage.setItem(CFG, JSON.stringify({ on: true, member, name })); const e = await engine(); if (!(await e.meta()).share) await e.setMeta({ share: share || e.defShare() }); await e.capture(); return e; }
  function disable() { localStorage.setItem(CFG, JSON.stringify({ ...(cfg() || {}), on: false })); clearTimeout(timer); }
  async function remove() { disable(); if (eng) { await eng.st.destroy(); eng = null; } else await new RStore.Store(TESTENV ? "roses-eats-sync-test" : "roses-eats-sync").destroy(); localStorage.removeItem(CFG); }
  /* restoring an old backup must not bring back records the household has since deleted */
  const _imp = A.lImpYes; A.lImpYes = async () => { await _imp(); if (!enabled()) return; const e = await engine(); const r = await e.capture({ noResurrect: true }); if (r.skipped && r.skipped.length) { await e.project(new Set(r.skipped.map(k => RM.D[k.split("/")[0]].cat))); toast(r.skipped.length + " item(s) deleted on another phone were not restored"); } };
  if (enabled()) setTimeout(async () => { try { const e = await engine(); await e.recoverPending(); await e.capture(); } catch (x) { SYNC.lastError = x.name || "error"; } }, 800);
  if (/[?&]selftest=sync/.test(location.search)) setTimeout(() => { const a = document.createElement("script"); a.src = "sync/relay-sim.js?v=" + Date.now() + ""; a.onload = () => { const b = document.createElement("script"); b.src = "sync/selftest-sync.js?v=" + Date.now() + ""; document.body.appendChild(b); }; document.body.appendChild(a); }, 1500);
  return { enabled, enableLocal, disable, remove, engine, run, cfg, lastError: null };
})();
