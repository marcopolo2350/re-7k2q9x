/* Navigation and interface journey tests. Run with ?testenv=1&selftest=nav. Results: window.__navtest.
   These drive the rendered interface (tabs, buttons, the page-turn book), not just helper functions. */
(async function () {
  if (!TESTENV) { alert("Navigation tests only run with ?testenv=1"); return; }
  const out = [], t0 = performance.now();
  const ok = (name, pass, info) => out.push({ name, pass: !!pass, info: info == null ? "" : String(info) });
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const click = sel => { const el = document.querySelector(sel); if (!el) return false; el.click(); return true; };
  const tabBtn = k => document.querySelector(`#tabs [data-t="${k}"]`);
  const CHROME = /🏠|📖|📚|🗓|🧺|🛒|👩‍🍳|⏱|🆘|🔪|🛟|🔖|🎰|🔎|🔍|⚙|🤔/;

  tab = "home"; render(); await wait(50);
  ok("tab bar shows Home, Cookbook, Pantry, Plan, Shop, Cook", ["home", "cookbook", "pantry", "plan", "groceries", "cook"].every(k => tabBtn(k)), [...document.querySelectorAll("#tabs button")].map(b => b.textContent.trim()).join(", "));
  ok("home has a one-tap Cookbook door", !!document.querySelector('#view .nav-tiles [data-t="cookbook"], #view .nav-tiles [data-a="resume"]'));
  ok("home has a one-tap Pantry door", !!document.querySelector('#view .nav-tiles [data-t="pantry"]'));
  ok("no decorative emoji left in the tab bar or home screen", !CHROME.test(document.getElementById("tabs").textContent + document.getElementById("view").textContent), (document.getElementById("view").textContent.match(CHROME) || [""])[0]);

  click('#view .nav-tiles [data-t="pantry"]'); await wait(50);
  ok("Pantry door opens the pantry screen", tab === "pantry" && tabBtn("pantry").classList.contains("on"));
  ok("pantry screen lists ingredients and what can be made", /pantry|have/i.test(document.getElementById("view").textContent));

  tab = "home"; render(); await wait(30);
  click('#view .nav-tiles [data-t="cookbook"]') || (tab = "cookbook", render()); await wait(50);
  ok("Cookbook door opens the cookbook screen", tab === "cookbook" || document.getElementById("book").classList.contains("open"));
  if (tab === "cookbook") {
    ok("cookbook screen has Open the cookbook", !!document.querySelector('#view [data-a="openBook"]'));
    ok("cookbook screen links to the searchable recipe list", !!document.querySelector('#view [data-t="recipes"]'));
    click('#view [data-a="openBook"]'); await wait(900);
  }
  ok("the page-turn book opens", document.getElementById("book").classList.contains("open") && !!pf, "page-flip " + (pf ? "ready" : "missing"));
  const before = typeof curPage === "function" ? curPage() : -1;
  try { pf.flipNext(); } catch (e) {}
  await wait(1200);
  ok("turning a page advances the book", typeof curPage === "function" && curPage() > before, before + " → " + (typeof curPage === "function" ? curPage() : "?"));
  ok("book pages have the corner-drag/swipe engine attached", !!document.querySelector("#stage .stf__parent, #stage .stf__block, #stage [class*=stf]"));
  closeBook(); await wait(50);

  tab = "recipes"; render(); await wait(50);
  ok("the full recipe list still renders and fits the phone width", document.documentElement.scrollWidth <= innerWidth + 1 && /recipe|menu/i.test(document.getElementById("view").textContent));

  for (const k of ["plan", "groceries", "cook"]) { tab = k; render(); await wait(30); }
  ok("Plan, Shop and Cook screens render without overflow", document.documentElement.scrollWidth <= innerWidth + 1);

  /* Typographic covers instead of emoji or cartoon art */
  const noPhoto = RECIPES.find(r => !realImg(r));
  ok("recipes without a verified photo get a typographic cover, not emoji art", noPhoto ? /class="art cover/.test(art(noPhoto)) && !art(noPhoto).includes(noPhoto.e) : true, noPhoto ? noPhoto.n : "all have photos");
  const withPhoto = RECIPES.find(r => realImg(r));
  ok("recipes with a verified photo still show the photo", withPhoto ? /class="art photo/.test(art(withPhoto)) : true);

  /* Cooking assistant: parallel prep is visible during a wait, never during attended steps */
  const CF = window.__cookflow;
  const waitRec = RECIPES.find(r => r.st.some((s, i) => CF.WAIT.test(s) && !CF.ATTEND.test(s) && r.st.slice(i + 1).some(CF.isPrep)));
  if (waitRec) {
    const i = waitRec.st.findIndex((s, k) => CF.WAIT.test(s) && !CF.ATTEND.test(s) && waitRec.st.slice(k + 1).some(CF.isPrep));
    openCook(waitRec.id); ck.done = {}; ck.i = i; rCook(); await wait(50);
    const wbox = document.querySelector("#cook .cf-wait");
    ok("during a waiting step, later prep appears under While you wait", !!wbox, waitRec.n + " step " + (i + 1));
    const btn = wbox && wbox.querySelector('[data-a="cfDone"]');
    const k = btn ? +btn.dataset.v : -1;
    if (btn) btn.click(); await wait(30);
    ok("ticking a While-you-wait task marks that later step done without moving the current step", k > i && ck.done[k] === 1 && ck.i === i);
    A.kNext(); let guard = 0; while (ck.i < k && guard++ < 50) A.kNext();
    ok("Next skips a step already done during the wait", ck.i !== k || k === waitRec.st.length - 1);
    ok("the whole recipe overview is available while cooking", !!document.querySelector("#cook .cf-ov"));
    A.closeCook ? A.closeCook() : document.querySelector('#cook [data-a="closeCook"]').click(); await wait(30);
  } else ok("a recipe with a waiting step and later prep exists for testing", false);
  const fryRec = RECIPES.find(r => r.st.some(s => CF.ATTEND.test(s)));
  if (fryRec) {
    const i = fryRec.st.findIndex(s => CF.ATTEND.test(s));
    openCook(fryRec.id); ck.done = {}; ck.i = i; rCook(); await wait(30);
    ok("attended steps (frying, constant stirring) suggest nothing else to do", !document.querySelector("#cook .cf-wait") && !!document.querySelector("#cook .cf-attend"), fryRec.n);
    document.querySelector('#cook [data-a="closeCook"]').click(); await wait(30);
  }
  S.cookSess = null; save();

  /* Bookmarks, recently viewed and reading position survive both backup formats */
  {
    const keep = { bm: S.bm, recent: S.recent, resume: S.resume };
    const id1 = RECIPES[0].id, id2 = RECIPES[1].id;
    S.bm = [id1]; S.recent = [id2, id1]; S.resume = { part: 0, id: id2, at: 1 };
    const c = cleanImport(expCode());
    ok("backup code restore keeps bookmarks, recently viewed and reading position", JSON.stringify(c.bm) === JSON.stringify([id1]) && c.recent[0] === id2 && c.resume && c.resume.id === id2);
    let fb = null; try { fb = await fullBackup(); } catch (e) {}
    const v = fb ? validateBackup(JSON.parse(JSON.stringify(fb))) : null;
    ok("full backup file keeps bookmarks, recently viewed and reading position", !!v && v.ok && JSON.stringify(v.st.bm) === JSON.stringify([id1]) && v.st.resume && v.st.resume.id === id2, v ? (v.errs || []).join("; ") : "no fullBackup");
    Object.assign(S, keep); save();
  }

  A.settings(); await wait(100);
  ok("Settings shows the running release", new RegExp(RELEASE.replace(/[.]/g, "\\.")).test(document.getElementById("sheetIn").textContent));
  closeSheet();
  tab = "home"; render();

  const pass = out.filter(x => x.pass).length;
  window.__navtest = { pass, fail: out.length - pass, total: out.length, ms: Math.round(performance.now() - t0), results: out };
  const box = document.createElement("div");
  box.style.cssText = "position:fixed;inset:0;z-index:99999;background:#fff;color:#222;overflow:auto;padding:16px;font:13px -apple-system,system-ui";
  box.innerHTML = `<h2>Navigation tests: ${pass}/${out.length}</h2>` + out.map(x => `<div style="color:${x.pass ? "#1a7f37" : "#c00"}">${x.pass ? "✓" : "✗"} ${esc(x.name)} <span style="color:#888">${esc(x.info)}</span></div>`).join("") + `<p><a href="./?testenv=1">Close</a></p>`;
  document.body.appendChild(box);
})();
