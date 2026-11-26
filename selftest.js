/* Rose's EATS regression self-test. Open the app with ?selftest=1 (add &images=1 to also check every photo).
   Your saved data is snapshotted first and restored afterwards. Results: window.__selftest */
(async function () {
  const KEYSNAP = localStorage.getItem(KEY), out = [], t0 = performance.now();
  const ok = (name, pass, info) => out.push({ name, pass: !!pass, info: info == null ? "" : String(info) });
  const resetP = a => { S.pantry = a; pMemo = new Map(); pMemo.ref = null; pSig = ""; };
  try {
    const B = BASE;
    ok("1551 library recipes", B.length === 1551, B.length);
    ok("unique recipe ids", new Set(B.map(r => r.id)).size === B.length);
    ok("every recipe has ingredients and steps", B.every(r => r.i.length && r.st.length));
    ok("every recipe has a photo", B.every(r => r.img), B.filter(r => !r.img).length + " missing");
    ok("chef notes on every recipe", B.every(r => r.cf), B.filter(r => !r.cf).length + " missing");
    ok("importance has no legacy S level", B.every(r => !r.ilv.includes("S")));
    ok("every recipe has an essential ingredient", B.every(r => r.ilv.includes("E")));
    ok("roles align with ingredients", B.every(r => !r.cf.rl || r.cf.rl.length === r.i.length), B.filter(r => !r.cf.rl).length + " without roles");
    ok("tips attach to existing steps", B.every(r => r.cf.tips.every(t => t.s < r.st.length)));
    ok("kitchen guidance on every recipe", B.every(r => G(r.id)), B.filter(r => !G(r.id)).length + " missing");
    ok("rescue entries use known problems", B.every(r => !G(r.id) || Object.keys(G(r.id).rescue || {}).every(k => PROB.some(p => p[0] === k))));
    let rb = 0; B.forEach(r => { try { det = { id: r.id, s: r.s, tk: false }; const h = dDetail(); if (/undefined|NaN|\[object/.test(h.replace(/<[^>]+>/g, " "))) rb++; } catch (e) { rb++; } });
    ok("every recipe page renders cleanly", rb === 0, rb + " bad");
    let cb = 0; for (const r of B.slice(0, 400)) { try { ck = { id: r.id, i: -1, s: r.s, ing: true, got: {}, done: {} }; for (let i = -1; i < r.st.length; i++) { ck.i = i; rCook(); if (/undefined|NaN/.test($("#cook").innerText)) cb++; } } catch (e) { cb++; } } ck = null; $("#cook").innerHTML = "";
    ok("cooking mode renders (400 recipes, every step)", cb === 0, cb + " bad");
    /* filters and counts */
    tab = "recipes"; render();
    const base = { q: "", cat: "all", part: 0, time: 0, fav: false, lim: 99999, cu: "", mn: "" };
    const cats = ["all", ...Object.keys(CATS)], cus = [...new Set(RECIPES.map(r => r.cu).filter(Boolean))], mns = ["", ...MAINS.map(m => m[0])];
    let ft = 0, ff = 0;
    const chk = o => { Object.assign(F, base, o); fillGrid(); ft++; const exp = RECIPES.filter(r => (F.cat === "all" || r.c === F.cat) && (!F.cu || r.cu === F.cu) && (!F.mn || (r.mn || []).includes(F.mn)) && (!F.q || [r.n, r.d, r.cu || "", CATS[r.c].n, ...r.keys].join("|").toLowerCase().includes(F.q.toLowerCase()))).length; if (parseInt($("#rcnt").textContent) !== exp || (exp > 0 && $("#rgrid").children.length !== exp)) ff++; };
    for (const c of cats) for (const u of ["", ...cus]) chk({ cat: c, cu: u });
    for (const c of cats) for (const m of mns) chk({ cat: c, mn: m });
    for (const q of ["chicken", "koshari", "cake", "soup", "zzzz"]) { chk({ q }); chk({ q, cu: "Egyptian" }); }
    ok("filter counts match shown recipes", ff === 0, `${ft} combinations, ${ff} wrong`);
    let dd = 0, ddf = 0; for (const c of cats) { Object.assign(F, base, { lim: 24, cat: c }); render(); for (const o of document.querySelectorAll("select[data-ch=fcu] option")) { if (!o.value) continue; dd++; if (+o.textContent.match(/\((\d+)\)/)[1] !== filtered(true).filter(r => r.cu === o.value).length) ddf++; } }
    ok("cuisine dropdown counts are right", ddf === 0, `${dd} options, ${ddf} wrong`);
    Object.assign(F, base, { lim: 24 });
    /* pantry tiers */
    let pa = 0, pb = 0, pc = 0;
    for (const r of B) { resetP(r.keys.slice()); if (stats(r).tier !== "ready") pa++; const O = r.keys.filter(k => r.imp[k] === "O"); if (O.length) { resetP(r.keys.filter(k => !O.includes(k))); if (stats(r).tier === "almost") pb++; } const E = r.keys.filter(k => r.imp[k] === "E" && !subFor(r, k)); if (E.length) { const k = E[0]; resetP(r.keys.filter(x => x !== k && !ingMatch(x, k) && !ingMatch(k, x))); if (stats(r).tier !== "almost") pc++; } }
    ok("all ingredients present = ready to cook", pa === 0, pa);
    ok("only optional missing never blocks", pb === 0, pb);
    ok("missing essential without swap = almost ready", pc === 0, pc);
    /* grocery */
    const sb = JSON.stringify(S.basket), sg = S.gmode, sh = S.hidePantry, so = S.skipOpt;
    resetP(["salt"]); S.basket = {}; [3583, 53027, 3253, 53133].forEach(i => S.basket[i] = R_(i).s); S.gmode = "selected"; S.hidePantry = false; S.skipOpt = false;
    const all = grocery(); const ess = []; [3583, 53027, 3253, 53133].forEach(i => { const r = R_(i); r.i.forEach((g, k) => { if (r.ilv[k] === "E" && !SKIP.has(g.item)) { const e = all.find(x => x.key === g.item); if (!e || gGrp(e) !== "must") ess.push(g.item); } }); });
    ok("essential ingredients always in Must buy", !ess.length, ess.join(", "));
    const v1 = all.filter(gVis).length; S.skipOpt = true; const v2 = all.filter(gVis); ok("optional toggle hides only optional items", v2.every(e => e.lv !== "O") && all.filter(e => !gVis(e)).every(e => e.lv === "O"), `${v1}→${v2.length}`);
    S.basket = JSON.parse(sb); S.gmode = sg; S.hidePantry = sh; S.skipOpt = so;
    /* scaling */
    ok("scaling multiplies quantities in text", /<b class="scq"[^>]*>3 cups<\/b>/.test(scaleText("Add 1 1/2 cups broth and bake at 350°F for 20 minutes", 2)) && !/40 minutes|700/.test(scaleText("Add 1 1/2 cups broth and bake at 350°F for 20 minutes", 2)));
    ok("scaling leaves times and temperatures alone", scaleText("Bake 20 minutes at 400°F", 3) === esc("Bake 20 minutes at 400°F"));
    /* timers (logic, no waiting) */
    const st = JSON.stringify(S.timers || []); S.timers = []; startTimer(5, "Test"); const tm = S.timers[0];
    A.kTP({ dataset: { u: tm.uid } }); tm.end = Date.now() - 1; ok("paused timer never fires", (tickTimers(), !tm.fired));
    A.kTP({ dataset: { u: tm.uid } }); tm.end = Date.now() - 1; tickTimers(); ok("finished timer rings with Stop and Snooze", tm.fired && /Stop alarm/.test($("#alarm").innerText) && /Snooze/.test($("#alarm").innerText));
    A.kSnooze(); ok("snooze restarts for 1 minute", !tm.fired && Math.abs(tm.end - Date.now() - 6e4) < 2000);
    S.timers = JSON.parse(st); tickTimers();
    /* meal builder and timeline */
    const mains = RECIPES.filter(r => courseOf(r) === "main"); let bad = 0, ov = 0;
    for (let i = 0; i < 120; i++) { const m = mains[(i * 37) % mains.length]; meal = { main: m.id, pick: {}, skip: { app: i % 2 === 0, bread: i % 3 === 0 }, list: {} }; COURSES.forEach(([k]) => { meal.list[k] = mealRank(m, k); meal.pick[k] = i % 3; }); const s = schedule(mealIds(), Date.now() + 6 * 36e5); if (!validSchedule(s)) bad++; const o = s.tasks.filter(t => t.oven && !t.pre); for (let a = 0; a < o.length; a++) for (let b = a + 1; b < o.length; b++) if (o[a].start < o[b].end && o[b].start < o[a].end && Math.abs(o[a].oven - o[b].oven) > 25) ov++; if (s.tasks.some(t => t.end > s.serveAt)) bad++; }
    meal = null;
    ok("timelines never need two hands-on tasks at once", bad === 0, "120 meals");
    ok("timelines never overlap different oven temperatures", ov === 0);
    /* service worker */
    const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration();
    ok("service worker active", reg && reg.active, reg && reg.active ? reg.active.scriptURL : "none");
    if (/images=1/.test(location.search)) {
      let badI = [], i = 0; const L = B.map(r => r.img); const head = async u => { try { const x = await fetch(u, { method: "HEAD", cache: "no-store", mode: "cors" }); return x.ok; } catch (e) { return false; } };
      await Promise.all(Array.from({ length: 12 }, async () => { while (i < L.length) { const u = L[i++]; if (!(await head(u))) badI.push(u); } }));
      ok("every photo URL responds", !badI.length, badI.slice(0, 5).join(" "));
    }
  } catch (e) { ok("self-test crashed", false, e.message); }
  localStorage.setItem(KEY, KEYSNAP == null ? "" : KEYSNAP); if (KEYSNAP == null) localStorage.removeItem(KEY);
  const pass = out.filter(x => x.pass).length;
  window.__selftest = { pass, fail: out.length - pass, ms: Math.round(performance.now() - t0), results: out };
  const d = document.createElement("div"); d.id = "selftest";
  d.innerHTML = `<h2>Self-test: ${pass}/${out.length} passed</h2>${out.map(x => `<div style="color:${x.pass ? "#2F5A33" : "#A33A1F"}">${x.pass ? "✓" : "✗"} ${esc(x.name)} <small>${esc(x.info)}</small></div>`).join("")}<p><button onclick="location.href=location.pathname">Close and reload</button></p>`;
  d.style.cssText = "position:fixed;inset:0;z-index:999;overflow:auto;background:#fff;color:#222;padding:16px;font:14px -apple-system,sans-serif";
  document.body.appendChild(d);
})();
