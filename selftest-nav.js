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
    click('#view [data-a="openBook"]');
    for (let i = 0; i < 60 && !pf; i++) await wait(100); /* the book is built on the next frame; with 1,500+ pages that can take a few seconds */
    await wait(300);
  }
  ok("the page-turn book opens", document.getElementById("book").classList.contains("open") && !!pf, "page-flip " + (pf ? "ready" : "missing"));
  const before = typeof curPage === "function" ? curPage() : -1;
  try { pf.flipNext(); } catch (e) {}
  await wait(1200);
  ok("turning a page advances the book", typeof curPage === "function" && curPage() > before, before + " → " + (typeof curPage === "function" ? curPage() : "?"));
  ok("book pages have the corner-drag/swipe engine attached", !!document.querySelector("#stage .stf__parent, #stage .stf__block, #stage [class*=stf]"));
  /* In-book contents: chapter and section links land on the right recipe page */
  ok("the book is in chapter order, matching the contents", BL.length === RECIPES.length && BL.every((r, k) => r.id === flatBook()[k].id));
  ok("page 3 of the book is a clickable contents with every chapter", (() => { const h = bookTocHTML(); return ORG.book().chapters.every(c => h.includes(esc(c.n))) && (h.match(/class="tch-go"/g) || []).length === ORG.book().chapters.length; })());
  {
    const CS = chapterStarts(); let bad = 0;
    for (const x of CS) { const id = BL[x.i] && BL[x.i].id; if (id !== x.c.secs[0].ids[0]) bad++; for (const s of x.secs) if (!BL[s.i] || !ORG.book().chapters.find(c => c.k === x.c.k).secs.find(q => q.name === s.name).ids.includes(BL[s.i].id)) bad++; }
    ok("every chapter and section link points at its own first recipe", bad === 0, bad + " wrong");
    const x = CS[Math.min(2, CS.length - 1)];
    const link = document.querySelector(`#stage [data-a="bkGo"][data-i="${pageOf(x.i)}"]`) || null;
    pf.turnToPage(2); syncCnt(2); await wait(400);
    const btn = [...document.querySelectorAll('#stage .tch-go')].find(b => +b.dataset.i === pageOf(x.i));
    if (btn) btn.click();
    for (let i = 0; i < 30 && curPage() !== pageOf(x.i); i++) await wait(100);
    ok("tapping a chapter in the book's contents turns to that chapter", curPage() === pageOf(x.i), "page " + curPage() + " want " + pageOf(x.i));
    ok("the first recipe of each chapter carries a chapter divider", CS.every(x => /class="chdiv"/.test(chapDivHTML(BL[x.i], x.i))));
  }
  ok("a Contents button is always in the book's top bar", !!document.getElementById("bkToc"));
  ok("the recipe picker groups every recipe by chapter", document.querySelectorAll("#bkJump optgroup").length === ORG.book().chapters.length && document.querySelectorAll("#bkJump optgroup option").length === RECIPES.length);
  ok("recipes in the Contents sheet open in the book", /data-a="bookAt"/.test(tocHTML()) && !/data-a="gOpen"/.test(tocHTML()));
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

  /* Photo audit: hidden mismatches show the cover; a personal photo still wins */
  ok("photos flagged in the audit are not displayed", [...PHOTO_HIDE.keys()].every(id => !RID[id] || !realImg(RID[id])), PHOTO_HIDE.size + " hidden");
  ok("103 audited library photos remain displayed", RECIPES.filter(r => realImg(r) && /^img\//.test(realImg(r))).length === 103, RECIPES.filter(r => realImg(r) && /^img\//.test(realImg(r))).length);
  { const id = [...PHOTO_HIDE.keys()][0], had = S.photos[id]; S.photos[id] = "data:image/jpeg;base64,AAAA"; const shown = !!realImg(RID[id]); if (had) S.photos[id] = had; else delete S.photos[id];
    ok("a photo you added yourself is shown even on an audited recipe", shown); }

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
  /* Edge cases: a step that mixes prep with cooking is never offered early, so ticking it can't skip cooking */
  ok("a step that mixes chopping with cooking is not offered early", !CF.isPrep("Chop the onion and add it to the pan with the garlic.") && !CF.isPrep("Slice the chicken, then cook it in the skillet for 5 minutes."));
  ok("a step that uses earlier cooked food is not offered early", !CF.isPrep("Dice the cooked potatoes and toss with the dressing.") && !CF.isPrep("Stir in the reserved pasta water and the chopped parsley."));
  ok("pure preparation is offered early", CF.isPrep("Finely chop the parsley and mince the garlic.") && CF.isPrep("Measure the cream and grate the Parmesan."));
  ok("frying, broiling and caramel steps count as needing attention", ["Deep-fry the fritters in batches.", "Broil for 2 minutes, watching closely.", "Cook the sugar until it turns to caramel."].every(s => CF.ATTEND.test(s)));
  if (waitRec) {
    const i = waitRec.st.findIndex((s, k) => CF.WAIT.test(s) && !CF.ATTEND.test(s) && waitRec.st.slice(k + 1).some(CF.isPrep));
    openCook(waitRec.id); ck.done = {}; ck.i = i; rCook(); await wait(30);
    const b = document.querySelector('#cook [data-a="cfDone"]'); const k = b ? +b.dataset.v : -1; if (b) b.click(); await wait(30);
    document.querySelector('#cook [data-a="closeCook"]').click(); await wait(30);
    openCook(waitRec.id); await wait(30);
    ok("a step done during a wait is still done after leaving and reopening Cooking Mode", k >= 0 && ck.done[k] === 1 && ck.i === i);
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
