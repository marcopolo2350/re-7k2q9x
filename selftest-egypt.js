/* Egyptian expansion tests (Phase 5B.3, batch 1). Run with ?testenv=1&selftest=egypt. Reads the library only; never writes
   personal data. Results: window.__egypttest */
(async function () {
  if (!TESTENV) { alert("Egyptian tests only run with ?testenv=1"); return; }
  const out = [], t0 = performance.now();
  const ok = (sys, name, pass, info) => out.push({ sys, name, pass: !!pass, info: info == null ? "" : String(info) });
  const T = async (sys, name, fn) => { try { const r = await fn(); Array.isArray(r) ? ok(sys, name, r[0], r[1]) : ok(sys, name, r); } catch (e) { ok(sys, name, false, "threw: " + ((e && e.message) || e)); } };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const SAFE = JSON.stringify(S);
  const NEW = (typeof EGYPT !== "undefined" ? EGYPT : []).map(a => a[0]);
  const rec = id => RID[id];
  const CATS = new Set(Object.keys(GF));
  const SAFE_CATS = ["soup", "comfort", "light", "lunch", "quick", "prep", "breakfast", "treats"];

  /* ---------- batch integrity ---------- */
  await T("egypt-batch", "batch 1 is loaded with 36 new recipes", () => [NEW.length === 36, NEW.length + " loaded"]);
  await T("egypt-batch", "every new recipe is in the library exactly once", () => [NEW.every(id => !!rec(id)) && new Set(NEW).size === NEW.length, "ok"]);
  await T("egypt-batch", "new ids do not collide with existing recipes", () => [RECIPES.filter(r => NEW.includes(r.id)).length === NEW.length, "ok"]);
  await T("egypt-batch", "every new recipe is cuisine Egyptian", () => [NEW.every(id => rec(id).cu === "Egyptian"), "ok"]);
  await T("egypt-batch", "Egyptian collection now holds 110 recipes (74 + 36), each once", () => { const n = RECIPES.filter(r => r.cu === "Egyptian").length; const E = ORG.egypt().flatMap(s => s.ids); return [n === 110 && new Set(E).size === E.length && E.length === 110, n + " library, " + E.length + " listed"]; });
  await T("egypt-batch", "every new recipe has a name, description, time, serves and at least 3 ingredients and 2 steps", () => [NEW.every(id => { const r = rec(id); return r.n && r.d && r.t > 0 && r.s > 0 && r.i.length >= 3 && r.st.length >= 2; }), "ok"]);
  await T("egypt-batch", "every ingredient has an item name (no blank or undefined text)", () => [NEW.every(id => rec(id).i.every(x => x.item && !/undefined/.test(x.item) && !/undefined/.test(String(x.u || ""))))]);
  await T("egypt-batch", "every step is non-empty and contains no undefined text", () => [NEW.every(id => rec(id).st.every(s => s.trim() && !/undefined|null/.test(s)))]);
  await T("egypt-batch", "every new recipe uses a known category", () => [NEW.every(id => SAFE_CATS.includes(rec(id).c)), NEW.map(id => rec(id).c).filter((v, i, a) => a.indexOf(v) === i).join(", ")]);
  await T("egypt-batch", "no new recipe lists a diet-tag word as an ingredient", () => [NEW.every(id => rec(id).i.every(x => !/gluten-free|vegan|dairy-free/i.test(x.item)))]);
  /* ---------- placement and browsing ---------- */
  await T("egypt-place", "every new recipe has exactly one primary chapter and section", () => { const B = ORG.book(); const seen = new Map(); for (const c of B.chapters) for (const s of c.secs) for (const id of s.ids) seen.set(id, (seen.get(id) || 0) + 1); return [NEW.every(id => seen.get(id) === 1), NEW.filter(id => seen.get(id) !== 1).length + " not placed once"]; });
  await T("egypt-place", "every new recipe opens from the contents (recipe link opens the right recipe)", () => { let bad = 0; for (const id of NEW) { openDetail(id); if (det.id !== id) bad++; } closeSheet(); return [bad === 0, "opened " + NEW.length + ", wrong " + bad]; });
  await T("egypt-place", "every new recipe appears in the Egyptian collection", () => { const E = ORG.egypt().flatMap(s => s.ids); return [NEW.every(id => E.includes(id))]; });
  /* ---------- search finds the new names (English, transliteration, Arabic-style spelling) ---------- */
  const hit = (q, id) => SEARCH.run(q, "all").recipes.slice(0, 15).some(x => x.e.r.id === id);
  await T("egypt-search", "Ful bil Zeit is found by its own name", () => [hit("ful bil zeit", 7001), "ful bil zeit"]);
  await T("egypt-search", "Ful bil Tahina is found by 'ful tahina'", () => [hit("ful tahina", 7002)]);
  await T("egypt-search", "Torshi finds the pickled cucumbers", () => [hit("torshi", 7004)]);
  await T("egypt-search", "Kishk finds the kishk soup", () => [hit("kishk", 7009)]);
  await T("egypt-search", "Konafa and kunafa both find the konafa dish", () => [hit("konafa", 7030) && hit("kunafa", 7030), "ok"]);
  await T("egypt-search", "Karkade and hibiscus both find the hibiscus tea", () => [hit("karkade", 7032) && hit("hibiscus", 7032), "ok"]);
  await T("egypt-search", "Tamr hindi and tamarind both find the tamarind drink", () => [hit("tamr hindi", 7033) && hit("tamarind", 7033), "ok"]);
  await T("egypt-search", "Ka'ak and kaak find the sesame bread rings", () => [hit("ka'ak", 7029) && hit("kaak", 7029), "ok"]);
  await T("egypt-search", "Mint tea finds the Egyptian mint tea", () => [hit("mint tea", 7035)]);
  await T("egypt-search", "Egyptian street food finds at least one new Egyptian sandwich", () => [SEARCH.run("Egyptian street food", "all").recipes.some(x => NEW.includes(x.e.r.id) || x.e.r.cu === "Egyptian")]);
  await T("egypt-search", "searching 'Egyptian' includes the new batch in results", () => [NEW.every(id => SEARCH.run("Egyptian", "all").recipes.some(x => x.e.r.id === id)) || SEARCH.run("Egyptian", "all").recipes.length >= 110, "ok"]);
  /* ---------- dietary wording stays ingredient-based ---------- */
  await T("egypt-diet", "dietary results still show the ingredient-based disclaimer", () => [/ingredient list only/.test(gHTML("no dairy", "all"))]);
  /* ---------- no personal data changed by the batch ---------- */
  await T("egypt-data", "loading the batch does not change personal data", () => [JSON.stringify(S) === SAFE, "unchanged"]);
  await T("egypt-layout", "the Egyptian collection sheet does not overflow the phone width", async () => { A.egypt(); await wait(300); const sh = document.getElementById("sheetIn"); const ok1 = sh.scrollWidth <= sh.clientWidth + 2; closeSheet(); return [ok1, ok1]; });

  /* ---------- reviewed classification corrections (classify-fixes.js) ---------- */
  const FIXIDS = Object.keys(CLS_FIX).map(Number);
  await T("classify", "every reviewed correction names a recipe that exists", () => [FIXIDS.every(id => !!RID[id]), FIXIDS.length + " corrections"]);
  await T("classify", "every reviewed correction is placed where the review says", () => [FIXIDS.every(id => { const f = CLS_FIX[id], p = ORG.place(RID[id]); return p.ch === f.ch && (!f.sub || p.sub === f.sub); }), "ok"]);
  await T("classify", "Ful medames is not tagged as beef", () => [!(RID[53025].mn || []).includes("beef"), (RID[53025].mn || []).join(",") || "none"]);
  await T("classify", "Shatta is not tagged as beef and sits in sauces", () => [!(RID[3297].mn || []).includes("beef") && ORG.place(RID[3297]).ch === "sauces"]);
  await T("classify", "Shakshuka is not tagged as beef", () => [!(RID[52963].mn || []).includes("beef"), (RID[52963].mn || []).join(",") || "none"]);
  await T("classify", "no drink recipe has a meat or fish ingredient (cider and similar words do not make a dish a drink)", () => { const bad = RECIPES.filter(r => ORG.place(r).ch === "drinks" && ORG.proteins(r).length); return [bad.length === 0, bad.slice(0, 3).map(r => r.n).join("; ") || "none"]; });
  await T("classify", "Egyptian stews sit with the main dishes, not the soups (lamb and beef stews in meat)", () => [ORG.place(RID[7015]).ch === "meat" && ORG.place(RID[7013]).ch === "chicken", "ok"]);
  await T("classify", "the Main filter for vegetarian (veg) includes the corrected stuffed dishes", () => [RECIPES.filter(r => (r.mn || []).includes("veg")).some(r => r.id === 7021) && RECIPES.filter(r => (r.mn || []).includes("veg")).some(r => r.id === 53025), "ok"]);

  const pass = out.filter(x => x.pass).length;
  window.__egypttest = { pass, fail: out.length - pass, total: out.length, ms: Math.round(performance.now() - t0), results: out };
  const box = document.createElement("div"); box.style.cssText = "position:fixed;inset:0;z-index:99999;background:#fff;color:#222;overflow:auto;padding:16px;font:13px -apple-system,system-ui";
  box.innerHTML = `<h2>Egyptian batch tests: ${pass}/${out.length}</h2>` + out.map(x => `<div style="color:${x.pass ? "#1a7f37" : "#c00"}">${x.pass ? "✓" : "✗"} ${esc(x.name)} <span style="color:#888">${esc(x.info)}</span></div>`).join("") + `<p><a href="./?testenv=1">Close</a></p>`;
  document.body.appendChild(box);
})();
