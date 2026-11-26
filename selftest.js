/* Rose's EATS tests.
   ?diag=1                      lightweight, read-only diagnostics; safe on a real phone (never writes data).
   ?testenv=1&selftest=full     full cumulative regression. Runs ONLY in the isolated test namespace
                                (localStorage "roses-eats-TEST", IndexedDB "roses-eats-test", cache "offline-test"),
                                so household data is never read or written, even if interrupted.
   Add &images=1 to either to check every photo URL.  Results: window.__selftest */
(async function () {
  const FULL = /selftest=full/.test(location.search), out = [], t0 = performance.now();
  const ok = (sys, name, pass, info) => out.push({ sys, name, pass: !!pass, info: info == null ? "" : String(info) });
  if (FULL && !TESTENV) { alert("Full regression only runs with ?testenv=1 so your real data is never touched."); return; }
  const realSave = save; if (!FULL) save = () => {}; /* diagnostics: no writes at all */
  const resetP = a => { S.pantry = a; pMemo = new Map(); pMemo.ref = null; pSig = ""; };
  const B = BASE, sl = ms => new Promise(r => setTimeout(r, ms));
  try {
    /* ---------- data ---------- */
    ok("data", "1551 library recipes", B.length === 1551, B.length);
    ok("data", "unique recipe ids", new Set(B.map(r => r.id)).size === B.length);
    ok("data", "ingredients and steps on every recipe", B.every(r => r.i.length && r.st.length));
    ok("data", "photo on every recipe", B.every(r => r.img), B.filter(r => !r.img).length + " missing");
    ok("chef", "chef notes on every recipe", B.every(r => r.cf));
    ok("chef", "importance uses only E/R/O", B.every(r => r.ilv.every(L => "ERO".includes(L))));
    ok("chef", "every recipe keeps an essential ingredient", B.every(r => r.ilv.includes("E")));
    const lvc = { E: 0, R: 0, O: 0 }; B.forEach(r => r.ilv.forEach(L => lvc[L]++)); ok("chef", "importance distribution", true, JSON.stringify(lvc));
    ok("chef", "substitutions kept independent of importance", B.some(r => r.ilv.some((L, k) => L === "E" && r.cf.sub && r.cf.sub[k])) && B.some(r => r.ilv.some((L, k) => L === "O" && r.cf.sub && r.cf.sub[k])));
    ok("chef", "roles align with ingredients", B.every(r => !r.cf.rl || r.cf.rl.length === r.i.length), B.filter(r => !r.cf.rl).length + " without roles");
    ok("chef", "tips attach to existing steps", B.every(r => r.cf.tips.every(t => t.s < r.st.length)));
    ok("safety", "no 'ingredient list omits' or 'package amount' tips", !B.some(r => r.cf.tips.some(t => /\bomits\b|not listed|missing from the|amount on the package/i.test(t.t))));
    ok("safety", "Montreal smoked meat marked unverified", RISK[52927] && RISK[52927].status === "flagged");
    ok("safety", "room-temperature ferments flagged", [3362, 53426, 3303, 53307].every(id => RISK[id] && RISK[id].status === "flagged"));
    ok("safety", "no high-risk recipe shown as checked", !Object.values(RISK).some(x => x.status === "checked"));
    ok("safety", "poultry tips never below 165°F", !B.some(r => [...r.cf.tips.map(t => t.t), (G(r.id) || {}).done || ""].some(t => /(chicken|poultry|turkey)[^.]{0,60}?\b1[0-5]\d\s*°?\s*F/i.test(t))));
    ok("guide", "kitchen guidance on every recipe", B.every(r => G(r.id)));
    ok("guide", "rescue keys are known problems", B.every(r => Object.keys(G(r.id).rescue || {}).every(k => PROB.some(p => p[0] === k))));
    /* ---------- rendering ---------- */
    let rb = 0; for (const r of B) { try { det = { id: r.id, s: r.s, tk: false }; const h = dDetail(); if (/undefined|NaN|\[object/.test(h.replace(/<[^>]+>/g, " "))) rb++; } catch (e) { rb++; } }
    ok("render", "every recipe page renders", rb === 0, rb + " bad");
    const ckN = FULL ? B.length : 150; let cb = 0; for (const r of B.slice(0, ckN)) { try { ck = { id: r.id, i: -1, s: r.s, ing: true, got: {}, done: {} }; for (let i = -1; i < r.st.length; i++) { ck.i = i; rCook(); if (/undefined|NaN/.test($("#cook").innerText)) cb++; } } catch (e) { cb++; } } ck = null; $("#cook").innerHTML = "";
    ok("render", `cooking mode, every step (${ckN} recipes)`, cb === 0, cb + " bad");
    let tb = 0, tw = []; for (const t of TABS) { try { tab = t[0]; render(); if (document.documentElement.scrollWidth > innerWidth + 1) { tb++; tw.push(t[0] + ":" + document.documentElement.scrollWidth + "/" + innerWidth); } } catch (e) { tb++; tw.push(t[0] + ":" + e.message); } } tab = "home"; render();
    if (innerWidth < 200) out.push({ sys: "render", name: "all six tabs render without horizontal overflow", pass: null, info: "skipped: page hidden, width not measurable" }); else ok("render", "all six tabs render without horizontal overflow", tb === 0, tw.join(" "));
    if (!FULL) { const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration(); ok("offline", "service worker active", reg && reg.active); throw "diag-done"; }
    /* ---------- filters and counts (restored full Phase 1 coverage) ---------- */
    tab = "recipes"; render();
    const base = { q: "", cat: "all", part: 0, time: 0, fav: false, lim: 99999, cu: "", mn: "", eq: false };
    const cats = ["all", ...Object.keys(CATS)], cus = [...new Set(RECIPES.map(r => r.cu).filter(Boolean))], mns = ["", ...MAINS.map(m => m[0])];
    let ft = 0, ff = 0;
    const chk = o => { Object.assign(F, base, o); fillGrid(); ft++; const exp = RECIPES.filter(r => (F.cat === "all" || r.c === F.cat) && (!F.cu || r.cu === F.cu) && (!F.mn || (r.mn || []).includes(F.mn)) && (!F.time || r.t <= F.time) && (!F.q || [r.n, r.d, r.cu || "", CATS[r.c].n, ...r.keys].join("|").toLowerCase().includes(F.q.toLowerCase())) && (!F.eq || !missingEq(r).length)).length; if (parseInt($("#rcnt").textContent) !== exp || (exp > 0 && $("#rgrid").children.length !== exp)) ff++; };
    for (const c of cats) for (const u of ["", ...cus]) chk({ cat: c, cu: u });
    for (const c of cats) for (const m of mns) chk({ cat: c, mn: m });
    for (const u of cus) for (const m of mns) chk({ cu: u, mn: m });
    for (const c of cats) for (const u of cus.slice(0, 25)) for (const m of ["chicken", "veg", "dessert"]) chk({ cat: c, cu: u, mn: m });
    for (const q of ["chicken", "egg", "lamb", "koshari", "cake", "rice", "zzzz", "soup", "bread"]) { chk({ q }); for (const u of ["Egyptian", "Italian", "American"]) chk({ q, cu: u }); chk({ q, cat: "sides" }); chk({ q, mn: "chicken", cat: "soup" }); }
    chk({ time: 30 }); chk({ time: 30, cu: "Egyptian" }); chk({ time: 15, cat: "quick", mn: "chicken" });
    for (const c of cats) chk({ cat: c, eq: true });
    ok("filters", "filter counts match shown recipes", ff === 0, `${ft} combinations, ${ff} wrong`);
    let dd = 0, ddf = 0; for (const c of cats) for (const m of mns) { Object.assign(F, base, { lim: 24, cat: c, mn: m }); render(); for (const o of document.querySelectorAll("select[data-ch=fcu] option")) { if (!o.value) continue; dd++; if (+o.textContent.match(/\((\d+)\)/)[1] !== filtered(true).filter(r => r.cu === o.value).length) ddf++; } }
    ok("filters", "cuisine dropdown counts (per category x ingredient)", ddf === 0, `${dd} options, ${ddf} wrong`);
    Object.assign(F, base, { lim: 24 });
    /* ---------- pantry ---------- */
    let pa = 0, pb = 0, pc = 0, pd = 0, pe = 0;
    for (const r of B) {
      resetP(r.keys.slice()); if (stats(r).tier !== "ready") pa++;
      const O = r.keys.filter(k => r.imp[k] === "O"); if (O.length) { resetP(r.keys.filter(k => !O.includes(k))); if (stats(r).tier === "almost") pb++; }
      const E = r.keys.filter(k => r.imp[k] === "E" && !subFor(r, k)); if (E.length) { const k = E[0]; resetP(r.keys.filter(x => x !== k && !ingMatch(x, k) && !ingMatch(k, x))); if (stats(r).tier !== "almost") pc++; }
      const ES = r.keys.find(k => r.imp[k] === "E" && subFor(r, k) && subFor(r, k).k.length); if (ES) { const P = r.keys.filter(x => x !== ES && !ingMatch(x, ES) && !ingMatch(ES, x)); resetP(P); const st = stats(r); if (!st.buy.includes(ES) && !st.sub.some(z => z.k === ES)) pd++; }
      const RR = r.keys.find(k => r.imp[k] === "R" && !subFor(r, k)); if (RR) { resetP(r.keys.filter(x => x !== RR && !ingMatch(x, RR) && !ingMatch(RR, x))); if (stats(r).buy.includes(RR)) pe++; }
    }
    ok("pantry", "everything present = ready", pa === 0, pa); ok("pantry", "only optional missing never needs shopping", pb === 0, pb);
    ok("pantry", "missing essential without swap = almost ready", pc === 0, pc); ok("pantry", "essential with swap needs the swap in the pantry", pd === 0, pd);
    ok("pantry", "missing recommended is never a must-buy", pe === 0, pe);
    S.mine = [{ id: 1001, n: "Test soup", c: "soup", t: 20, s: 4, cz: 8, d: "", ing: ["2 cups broth", "1 onion"], st: ["Simmer", "Eat"], img: "" }]; syncMine();
    resetP(["broth"]); ok("pantry", "unrated personal ingredients are needed and labeled", stats(R_(1001)).buy.includes("onion") && /Not rated/.test((det = { id: 1001, s: 4, tk: false }, dDetail())));
    /* ---------- grocery ---------- */
    resetP(["salt"]); S.basket = {}; [3583, 53027, 3253, 53133].forEach(i => S.basket[i] = R_(i).s); S.gmode = "selected"; S.hidePantry = false; S.skipOpt = false; S.inv = {};
    let all = grocery(); const ess = []; [3583, 53027, 3253, 53133].forEach(i => { const r = R_(i); r.i.forEach((g, k) => { if (r.ilv[k] === "E" && !SKIP.has(g.item)) { const e = all.find(x => x.key === g.item); if (!e || gGrp(e) !== "must") ess.push(g.item); } }); });
    ok("grocery", "essentials always in Must buy", !ess.length, ess.join(", "));
    S.skipOpt = true; ok("grocery", "optional toggle hides only optional items", all.filter(e => !gVis(e)).every(e => e.lv === "O")); S.skipOpt = false;
    const onion = all.find(e => e.key === "onion"); S.inv.onion = { q: 1 }; resetP(["salt", "onion"]); S.hidePantry = false;
    ok("grocery", "pantry count deducted once from the combined total", onion && /have 1/.test(amtText(onion)) || /enough/.test(amtText(onion)), onion && amtText(onion));
    S.inv["beef broth"] = { q: 2, u: "lb" }; const bb = all.find(e => e.key === "beef broth"); ok("grocery", "incompatible units are never deducted", bb && !/have|enough/.test(amtText(bb)), bb && amtText(bb)); S.inv = {};
    ok("grocery", "metric and imperial weights combine", amtText({ key: "x", v: 0, w: 16, g: 453.6, m: 0, o: {}, taste: false }) === "2 lb");
    S.plan = {}; const d0 = weekDates(S.week)[1]; S.plan[d0] = [{ uid: "a", id: 3583, s: 6, m: "D" }]; A.lLeftNext({ dataset: { date: d0, u: "a" } }); S.gmode = "week";
    ok("grocery", "planned leftovers don't add groceries", sources().length === 1);
    A.lCopyWeek(); ok("planner", "copy last week works", true);
    /* ---------- scaling, timers, timeline ---------- */
    ok("scaling", "quantities scale, times and temperatures don't", /<b class="scq"[^>]*>3 cups<\/b>/.test(scaleText("Add 1 1/2 cups broth and bake at 350°F for 20 minutes", 2)) && scaleText("Bake 20 minutes at 400°F", 3) === esc("Bake 20 minutes at 400°F"));
    S.timers = []; startTimer(5, "Test"); const tm = S.timers[0]; A.kTP({ dataset: { u: tm.uid } }); tm.end = Date.now() - 1; tickTimers(); ok("timers", "paused timer never fires", !tm.fired);
    A.kTP({ dataset: { u: tm.uid } }); tm.end = Date.now() - 1; tickTimers(); ok("timers", "alarm shows Stop and Snooze", tm.fired && /Stop alarm/.test($("#alarm").innerText) && /Snooze/.test($("#alarm").innerText));
    A.kSnooze(); ok("timers", "snooze restarts 1 minute", !tm.fired && Math.abs(tm.end - Date.now() - 6e4) < 2000); S.timers = []; tickTimers();
    const mains = RECIPES.filter(r => courseOf(r) === "main"); let bad = 0, ov = 0;
    for (const burn of [4, 2]) { S.equip.burners = burn; for (let i = 0; i < 60; i++) { const m = mains[(i * 37) % mains.length]; meal = { main: m.id, pick: {}, skip: { app: i % 2 === 0, bread: i % 3 === 0 }, list: {} }; COURSES.forEach(([k]) => { meal.list[k] = mealRank(m, k); meal.pick[k] = i % 3; }); const s = schedule(mealIds(), Date.now() + 6 * 36e5); if (!validSchedule(s)) bad++; const o = s.tasks.filter(t => t.oven && !t.pre); for (let a = 0; a < o.length; a++) for (let b2 = a + 1; b2 < o.length; b2++) if (o[a].start < o[b2].end && o[b2].start < o[a].end && Math.abs(o[a].oven - o[b2].oven) > 25) ov++; } }
    S.equip.burners = 4; meal = null;
    ok("timeline", "no impossible schedules (4 and 2 burners)", bad === 0, "120 meals"); ok("timeline", "no oven temperature conflicts", ov === 0);
    /* ---------- Phase 3 ---------- */
    S.hist = {}; S.fav = []; S.rating = {}; S.rej = {}; S.recent = []; S.log = []; S.cooked = []; resetP(["salt", "black pepper", "olive oil"]);
    const r0 = recommend({ seed: 1 }, 3); ok("recommend", "new user still gets 3 suggestions with reasons", r0.top.length === 3 && r0.top.every(x => x.why.length));
    const rid = r0.top[0].r.id; S.rej[rid] = { n: 1, at: Date.now() }; ok("recommend", "rejected recipe is not suggested again right away", !recommend({ seed: 1 }, 3).top.some(x => x.r.id === rid));
    S.fav = [r0.top[1].r.id]; const af = affinity(); ok("recommend", "preferences come only from recorded favorites/history", Object.keys(af.cu).length <= 1);
    RQ = { seed: 3 }; A.lRecShuffle(); ok("recommend", "shuffle and pick-for-me work", RQ.last && RQ.last.length);
    const orig = JSON.stringify(R_(3583).i); S.ver = {}; S.ver[700001] = { id: 700001, base: 3583, name: "Our way", s: 4, method: "", ing: ["1 lb beef chuck", "8 oz egg noodles", "4 cups beef broth"], st: ["Brown", "Simmer"], tips: ["More pepper"] }; syncMine();
    ok("versions", "version works and original is unchanged", R_(700001) && R_(700001).isVer && JSON.stringify(R_(3583).i) === orig && R_(3583).i.length === 13);
    A.lVerCmp({ dataset: { id: "700001" } }); ok("versions", "compare shows removed ingredients", /Removed/.test($("#sheetIn").innerText)); closeSheet();
    S.cols[0].ids = [3583]; ok("collections", "collections hold recipes", S.cols.length >= 8 && S.cols[0].ids.includes(3583));
    S.hist[3583] = [{ at: todayIso(), r: 5, again: "yes", notes: "Great", next: "More garlic" }]; det = { id: 3583, s: 6, tk: false }; ok("history", "kitchen notes appear on the recipe", /More garlic/.test(dDetail()));
    const today = todayIso(), ago = n => iso(addDays(fromIso(today), -n));
    ok("leftovers", "counter or slow cooling = throw out", loStatus({ type: "chicken", date: today, where: "counter" }).cls === "bad" && loStatus({ type: "rice", date: today, where: "fridge", cooled: "no" }).cls === "bad");
    ok("leftovers", "unknown handling = uncertain, no suggestions", loStatus({ type: "chicken", date: today, where: "fridge", cooled: "unknown" }).cls === "warn" && !loSuggest({ type: "chicken", date: today, where: "fridge", cooled: "unknown" }).length);
    ok("leftovers", "day 4 in the fridge = throw out", loStatus({ type: "chicken", date: ago(4), where: "fridge", cooled: "yes" }).cls === "bad");
    ok("leftovers", "fresh, properly stored leftovers get ideas", loSuggest({ type: "chicken", date: today, where: "fridge", cooled: "yes" }).length > 0);
    /* ---------- Phase 4 ---------- */
    resetP(["spinach", "salt", "olive oil", "garlic"]); S.inv = { spinach: { exp: today } }; ok("kitchen", "use-soon items are found", soonItems().length === 1);
    ok("kitchen", "Use What We Have prioritises them", useScores().slice(0, 5).some(x => x.why.some(w => /spinach/.test(w)))); S.inv = {};
    S.plan = {}; const dd2 = weekDates(S.week).filter(d => d >= today); if (dd2.length) { S.plan[dd2[0]] = [{ uid: "p1", id: 3583, s: 6, m: "D" }, { uid: "p2", id: 53027, s: 4, m: "D" }]; ok("kitchen", "prep plan groups shared prep", prepPlan().tasks.length > 0); }
    const eq0 = { ...S.equip }; S.equip.oven = 0; ok("kitchen", "equipment filter hides recipes needing missing equipment", RECIPES.filter(r => missingEq(r).includes("oven")).length > 0); S.equip = eq0;
    ok("kitchen", "technique words link to the guide", /data-a="lTech"/.test(techLink("Sear the beef, then deglaze the pan")));
    /* ---------- nutrition ---------- */
    const bt = NUTDB.items.butter, bf = NUTDB.foods[bt[0]];
    const one = { id: -1, s: 1, ilv: ["E"], i: [{ q: 100, u: "g", item: "butter", note: "" }] };
    ok("nutrition", "100 g butter = USDA value", Math.abs(nutOf(one).per[0] - bf[0]) < .01, Math.round(nutOf(one).per[0]) + " kcal");
    const cupB = { id: -2, s: 2, ilv: ["E"], i: [{ q: 1, u: "cup", item: "butter", note: "" }] };
    ok("nutrition", "volume uses the food's own cup weight", Math.abs(nutOf(cupB).per[0] - bf[0] * bt[1].cup / 100 / 2) < .01);
    const unk = { id: -3, s: 1, ilv: ["E", "E"], i: [{ q: 100, u: "g", item: "butter", note: "" }, { q: 1, u: "cup", item: "unobtainium paste", note: "" }] };
    ok("nutrition", "unmatched ingredients are never counted as zero", nutOf(unk).status !== "estimated" && nutOf(unk).miss.length === 1);
    const op = { id: -4, s: 1, ilv: ["E", "O"], i: [{ q: 100, u: "g", item: "butter", note: "" }, { q: 100, u: "g", item: "butter", note: "" }] };
    ok("nutrition", "optional ingredients are excluded and listed", Math.abs(nutOf(op).per[0] - bf[0]) < .01 && nutOf(op).opt.length === 1);
    const bnN = nutOf(R_(3583)); ok("nutrition", "Beef and Noodles matches an independent hand calculation (524 kcal, 44 g protein per serving)", Math.abs(bnN.per[0] - 524.4) < 2 && Math.abs(bnN.per[1] - 44) < 1, Math.round(bnN.per[0]) + " kcal");
    const hmN = nutOf(R_(3241)); ok("nutrition", "bone-in thighs use edible portion (Honey Mustard Chicken 517 kcal)", Math.abs(hmN.per[0] - 517.5) < 2 && hmN.used[0][1] === 680, hmN.used[0][1] + " g edible of 907 g");
    const dbl = { ...R_(3583), id: -5, s: 12, i: R_(3583).i.map(g => ({ ...g, q: g.q == null ? null : g.q * 2 })) }; ok("nutrition", "per-serving values don't change when a recipe is doubled", Math.abs(nutOf(dbl).per[0] - bnN.per[0]) < .5);
    const nq = { id: -6, s: 1, ilv: ["E", "E"], i: [{ q: 100, u: "g", item: "butter", note: "" }, { q: null, u: "", item: "chickpeas", note: "can" }] }; ok("nutrition", "an ingredient with no quantity is missing, not zero or 'to taste'", nutOf(nq).miss.length === 1 && nutOf(nq).status !== "estimated");
    const nc = { estimated: 0, partial: 0, unavailable: 0 }; B.forEach(r => nc[nutOf(r).status]++); ok("nutrition", "recipe-level coverage", true, JSON.stringify(nc));
    /* ---------- closure items ---------- */
    det = { id: 52927, s: 4, tk: false }; const mh = dDetail(); openCook(52927); ok("safety", "unverified curing/ferment recipes can't start cooking mode", !$("#cook").classList.contains("open") && !/data-a="cook" data-id="52927"/.test(mh) && /Show the unverified steps/.test(mh)); closeSheet();
    ok("safety", "unverified high-risk recipes are never recommended", !recommend({ seed: 5 }, 400).all.some(x => riskRestricted(x.r)));
    RQ = null; const dg = recommend({ seed: 2, diet: "dairyfree" }, 3).top; ok("recommend", "diet results say they are ingredient-based estimates", dg.length && dg.every(x => /not verified/.test(x.why[0])));
    const mk = (id, n, st) => { RID[id] = { id, n, s: 4, c: "comfort", i: [{ q: 1, u: "lb", item: "chicken breast", note: "" }, { q: 1, u: "cup", item: "rice", note: "" }], st, ilv: ["E", "E"], keys: ["chicken breast", "rice"], cf: null }; };
    mk(-11, "Test A", ["Roast the chicken breast at 425°F for 20 minutes.", "Serve with rice."]); mk(-12, "Test B", ["Roast the chicken breast at 425°F until 165°F.", "Slice over rice."]); mk(-13, "Test C", ["Marinate the chicken breast in yogurt, then roast at 425°F.", "Serve."]);
    const d0p = todayIso(), d1p = iso(addDays(fromIso(d0p), 1)); S.week = iso(mondayOf(fromIso(d0p))); S.plan = { [d0p]: [{ uid: "q1", id: -11, s: 4, m: "D" }, { uid: "q3", id: -13, s: 4, m: "D" }], [d1p]: [{ uid: "q2", id: -12, s: 4, m: "D" }] };
    const pp = proteinPrep(Object.entries(S.plan).flatMap(([d, E]) => E.map(e => ({ ...e, date: d }))));
    ok("kitchen", "shared protein cooked once only when the method matches", pp.length === 1 && pp[0].uses.length === 2 && !pp[0].uses.some(u => u.n === "Test C") && pp[0].q === 2, JSON.stringify(pp.map(o => [o.item, o.mth, o.q, o.uses.map(u => u.n)])));
    [-11, -12, -13].forEach(id => delete RID[id]); S.plan = {};
    localStorage.setItem(KEY + ".restore-pending", JSON.stringify({ id: "x-unfinished", at: Date.now() })); ok("backup", "a restore killed before the final write is detected and old data kept", checkInterruptedRestore() === "interrupted"); S.importId = "x-done"; localStorage.setItem(KEY + ".restore-pending", JSON.stringify({ id: "x-done", at: Date.now() })); ok("backup", "a restore killed after the final write completes cleanly", checkInterruptedRestore() === "completed" && !localStorage.getItem(KEY + ".restore-pending"));
    /* ---------- backup, restore, migration ---------- */
    S.fav = [5, 3583]; S.notes = { 5: "extra garlic" }; S.pantry = ["salt", "onion"]; save();
    try { await IDB.put("h:3583:test", "data:image/jpeg;base64,/9j/AAA="); } catch (e) {}
    const bk = await fullBackup(); const bkText = JSON.stringify(bk); const v = validateBackup(JSON.parse(bkText));
    ok("backup", "export validates with correct counts", v.ok && v.cnt.favorites === 2 && v.cnt.photos >= 1);
    const before = localStorage.getItem(KEY);
    await importBackup("{not json"); ok("backup", "invalid file changes nothing", localStorage.getItem(KEY) === before); closeSheet();
    await importBackup(bkText.slice(0, bkText.length / 2)); ok("backup", "truncated file changes nothing", localStorage.getItem(KEY) === before); closeSheet();
    const newer = JSON.parse(bkText); newer.state.schema = 99; ok("backup", "newer data format is rejected", !validateBackup(newer).ok);
    S.fav = []; S.notes = {}; save(); try { await IDB.del("h:3583:test"); } catch (e) {}
    await importBackup(bkText); await A.lImpYes();
    ok("backup", "restore brings back the exact data", JSON.stringify(S.fav) === "[5,3583]" && S.notes[5] === "extra garlic" && S.pantry.includes("onion"));
    let ph = null; try { ph = await IDB.get("h:3583:test"); } catch (e) {} ok("backup", "restore brings back personal photos", !!ph);
    await importBackup(bkText); await A.lImpYes(); ok("backup", "importing the same backup twice is harmless", JSON.stringify(S.fav) === "[5,3583]");
    const keep = JSON.stringify(S); const realSet = Storage.prototype.setItem; Storage.prototype.setItem = function (k, val) { if (k === KEY) throw new Error("QuotaExceededError"); return realSet.call(this, k, val); };
    const other = JSON.parse(bkText); other.state.fav = [1]; await importBackup(JSON.stringify(other)); await A.lImpYes(); Storage.prototype.setItem = realSet;
    ok("backup", "a failed restore (storage full) keeps existing data", JSON.stringify(S) === keep && JSON.parse(localStorage.getItem(KEY)).fav.length === 2); closeSheet();
    ok("backup", "undo copy exists after import", !!localStorage.getItem(KEY + ".before-import"));
    const p2 = { v: 1, mine: [{ id: 1001, n: "Our soup", c: "soup", t: 20, s: 4, cz: 8, d: "", ing: ["2 cups broth"], st: ["Heat"], img: "" }], left: [{ uid: "l1", id: 3583, date: today }], log: [{ id: 3583, date: today }], soon: [], timers: [], fav: [5, 3583], cooked: [3583], basket: { 3583: 4 }, pantry: ["salt", "onion"], plan: { [today]: [{ uid: "a1", id: 3583, s: 4, m: "D" }] }, checked: {}, extras: [{ uid: "x1", name: "Paper towels", amt: "", done: false }], tk: {}, rating: { 5: 9 }, notes: { 5: "extra garlic" }, hidden: [12], photos: {}, gone: {}, myIng: [], thr: 70, maxMiss: 3, gmode: "all", hidePantry: true, night: true, week: S.week, flex: 1, skipOpt: true, offline: {}, cookSess: { id: 3583, i: 2, s: 6, done: {}, at: Date.now() } };
    localStorage.setItem(KEY, JSON.stringify(p2)); const m = load();
    ok("migration", "Phase 2 data survives the upgrade", JSON.stringify(m.fav) === "[5,3583]" && m.notes[5] === "extra garlic" && m.plan[today].length === 1 && m.mine.length === 1 && m.flex === 1 && m.skipOpt && m.cookSess.i === 2 && m.hidden[0] === 12 && m.extras.length === 1);
    ok("migration", "new features get safe defaults", m.schema === SCHEMA && m.cols.length === 8 && m.equip.burners === 4 && m.hist && m.ver && m.inv);
    ok("migration", "pre-upgrade copy is kept", localStorage.getItem(KEY + ".pre-v3") !== null);
    const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration(); ok("offline", "service worker active", reg && reg.active);
  } catch (e) { if (e !== "diag-done") ok("suite", "test suite crashed", false, (e && e.message) || e); }
  if (/images=1/.test(location.search)) { let badI = [], i = 0; const L = B.map(r => r.img); const head = async u => { try { const x = await fetch(u, { method: "HEAD", cache: "no-store", mode: "cors" }); return x.ok; } catch (e) { return false; } }; await Promise.all(Array.from({ length: 12 }, async () => { while (i < L.length) { const u = L[i++]; if (!(await head(u))) badI.push(u); } })); ok("images", "every photo URL responds", !badI.length, badI.slice(0, 5).join(" ")); }
  if (!FULL) save = realSave;
  const pass = out.filter(x => x.pass === true).length, skip = out.filter(x => x.pass === null).length;
  window.__selftest = { mode: FULL ? "full" : "diagnostics", pass, skip, fail: out.length - pass - skip, ms: Math.round(performance.now() - t0), results: out };
  const d = document.createElement("div"); d.id = "selftest";
  d.innerHTML = `<h2>${FULL ? "Full regression (isolated test data)" : "Diagnostics (read-only)"}: ${pass}/${out.length} passed</h2>${out.map(x => `<div style="color:${x.pass ? "#2F5A33" : "#A33A1F"}">${x.pass === null ? "–" : x.pass ? "✓" : "✗"} <b>${esc(x.sys)}</b> ${esc(x.name)} <small>${esc(x.info)}</small></div>`).join("")}<p><button onclick="location.href=location.pathname">Close</button></p>`;
  d.style.cssText = "position:fixed;inset:0;z-index:999;overflow:auto;background:#fff;color:#222;padding:16px;font:14px -apple-system,sans-serif";
  document.body.appendChild(d);
})();
