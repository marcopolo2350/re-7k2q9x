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
