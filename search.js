/* Rose's EATS universal search (Phase 5B). Runs entirely on the phone against the recipe library, the cookbook chapters
   (org.js) and the pantry, grocery list and meal plan. No network, no AI service. The index is built once and reused.
   Results never invent attributes: a recipe matches only on data it actually has (name, cuisine, chapter, ingredients,
   method, time, cozy level, equipment). Dietary matches are ingredient-based estimates and carry the existing disclaimer. */
"use strict";
const SEARCH = (() => {
  const norm = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/['’`]/g, "").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
  const stem = w => w.length > 3 && /ies$/.test(w) ? w.slice(0, -3) + "y" : w.length > 3 && /(oes|ches|shes|xes)$/.test(w) ? w.slice(0, -2) : w.length > 3 && /s$/.test(w) && !/ss$/.test(w) ? w.slice(0, -1) : w;
  /* Egyptian and Arabic/English spelling families, and common synonyms. Each group maps to one canonical term. */
  const SYN = {
    koshari: ["koshary", "kushari", "kosheri", "koshary", "kushari"], mahshi: ["mahshy", "mahshee", "mahshe"], molokhia: ["mulukhiyah", "mloukhia", "molokhiya", "molokhia", "mulukhiya", "mulukhiyah"],
    fatta: ["fatteh", "fatah", "fattah", "fateh"], ful: ["foul", "fool"], tamiya: ["taameya", "taamiya", "ta'ameya", "falafel", "tamaya"], kofta: ["kefta", "kafta", "kofta"],
    basbousa: ["bassbousa", "basbusa", "harissa cake"], kunafa: ["konafa", "knafeh", "kanafeh", "kunefe", "kunafeh"], sayadeya: ["sayadia", "sayadiyah", "saiadia"],
    shorba: ["shorbet", "shorbat", "shorbah", "shorba"], balila: ["belila"], eish: ["aish", "aysh", "aish baladi"], sahlab: ["salep", "sahleb"],
    cozy: ["comfort", "comforting", "warm", "hearty", "cosy"], quick: ["fast", "easy", "speedy", "weeknight"], dessert: ["sweet", "sweets", "pudding", "treat"],
    soup: ["broth", "stew", "chowder", "shorba", "soups"], dinner: ["supper", "main"], lunch: ["lunchbox", "packed lunch"], breakfast: ["brunch", "morning"],
    chicken: ["poultry", "hen", "fowl"], beef: ["steak", "meat"], veg: ["vegetarian", "vegan", "plant"], egyptian: ["egypt", "egyptian"], airfryer: ["air fryer", "air-fry", "airfry"],
    dairy: ["milk", "cheese", "butter", "cream", "yogurt", "yoghurt"], gluten: ["wheat", "flour", "bread"], shrimp: ["prawn"], eggplant: ["aubergine"], zucchini: ["courgette"], cilantro: ["coriander"]
  };
  const ALIAS = new Map(); for (const [canon, list] of Object.entries(SYN)) for (const a of [canon, ...list]) ALIAS.set(stem(norm(a)), canon);
  const canon = w => ALIAS.get(w) || w;
  const EXCL = /^(no|without|not|free|except|minus)$/;
  const NUM = { fifteen: 15, twenty: 20, thirty: 30, forty: 40, forty5: 45, sixty: 60, an: 1, one: 1, hour: 60 };
  const STOPW = new Set(["and", "with", "or", "the", "a", "an", "for", "of", "i", "can", "make", "what", "use", "using", "have", "recipes", "recipe", "something", "meals", "meal", "to", "in", "on", "that", "is", "my", "our", "some", "want", "need", "under", "less", "than", "within", "max", "maximum", "minutes", "minute", "min", "mins", "hour", "hours", "ingredients", "ingredient"]);
  function parse(q) {
    const raw = norm(q), out = { words: [], not: [], max: 0, raw };
    const ws = raw.split(" ").filter(Boolean);
    for (let i = 0; i < ws.length; i++) {
      const w = ws[i], nx = ws[i + 1];
      if (/^(under|within|less|max|maximum|in)$/.test(w) && nx && /^\d+$/.test(nx)) { out.max = +nx; i++; continue; }
      if (/^(under|within|less|in)$/.test(w) && nx && /^(an?|one)$/.test(nx) && ws[i + 2] === "hour") { out.max = 60; i += 2; continue; }
      if (/^\d+$/.test(w) && (nx === "min" || nx === "minutes" || nx === "mins")) { out.max = out.max || +w; i++; continue; }
      if (EXCL.test(w) && nx) { out.not.push(canon(stem(nx))); i++; continue; }
      if (STOPW.has(w)) continue;
      out.words.push(canon(stem(w)));
    }
    return out;
  }
  /* ---------- index: built once from the library; the book supplies chapters and sections ---------- */
  let IX = null, IXkey = "";
  function index() {
    const L = (typeof RECIPES !== "undefined" ? RECIPES : []).filter(r => !(S.hidden || []).includes(r.id));
    const key = L.length + ":" + (typeof S !== "undefined" && S.mine ? S.mine.length : 0) + ":" + JSON.stringify(S.place || {});
    if (IX && IXkey === key) return IX;
    IX = L.map(r => {
      const tg = ORG.tags(r), title = norm(r.n), cu = norm(r.cu || "");
      const ing = (r.keys || []).map(k => norm(k)).join(" ");
      const extra = norm([tg.chapter, tg.section, tg.meal, tg.main, tg.time, (tg.method || []).join(" "), (tg.equipment || []).join(" "), (tg.moods || []).join(" "), r.gf || "", r.d || ""].join(" "));
      const tokens = new Set([...(title + " " + cu + " " + ing + " " + extra).split(" ").filter(Boolean).map(w => canon(stem(w)))]);
      return { r, id: r.id, title, cu, cuRaw: r.cu || "", ing, extra, tokens, tg, min: +r.t || 0, cz: +r.cz || 0, fav: (S.fav || []).includes(r.id), pantryHave: null };
    });
    IXkey = key; return IX;
  }
  function lev(a, b) { if (Math.abs(a.length - b.length) > 1) return 9; const d = []; for (let i = 0; i <= a.length; i++) { d[i] = [i]; } for (let j = 0; j <= b.length; j++) d[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; }
  function wordScore(w, e) {
    if (e.tokens.has(w)) return 10;
    for (const t of e.tokens) if (t.length >= 3 && w.length >= 3 && (t.startsWith(w) || w.startsWith(t))) return 6;
    if (w.length >= 4) for (const t of e.tokens) if (t.length >= 4 && lev(w, t) === 1) return 3;
    return 0;
  }
  function score(e, q) {
    if (!q.words.length && !q.max && !q.not.length) return 0;
    if (q.not.some(n => e.tokens.has(n) || (n === "dairy" && typeof dairy === "function" && dairy(e.r)) || (n === "gluten" && typeof gluten === "function" && gluten(e.r)))) return -1;
    if (q.max && e.min > q.max) return -1;
    let s = 0, hit = 0;
    for (const w of q.words) { const v = wordScore(w, e); if (v) hit++; s += v; }
    if (q.words.length && hit < Math.ceil(q.words.length * 0.6)) return 0;
    if (q.words.length && hit < q.words.length) s = s * 0.6;
    if (e.title === q.words.join(" ") || e.title === q.raw) s += 60;
    else if (q.words.length && e.title.includes(q.words.join(" "))) s += 25;
    if (!q.words.length) s += 5;
    if (q.max && e.min <= q.max) s += 4;
    s += e.cz / 20 + (e.fav ? 1 : 0);
    return s;
  }
  /* ---------- search ---------- */
  function run(qs, filt) {
    const q = parse(qs), ix = index(), res = { recipes: [], chapters: [], cuisines: [], pantry: [], grocery: [], plans: [], history: [], q };
    if (!q.raw) return res;
    const want = t => !filt || filt === "all" || filt === t;
    if (want("recipes")) {
      const sc = ix.map(e => [score(e, q), e]).filter(([s]) => s > 0).sort((a, b) => b[0] - a[0] || a[1].title.localeCompare(b[1].title) || a[1].id - b[1].id);
      res.recipes = sc.slice(0, 200).map(([s, e]) => ({ id: e.id, s, e: e }));
    }
    const tok = q.words.join(" ");
    if (tok && want("chapters")) res.chapters = ORG.CH.filter(([k, n]) => q.words.every(w => norm(n).includes(w) || (ORG.SUB[k] || []).some(([sn]) => norm(sn).includes(w)))).map(([k, n, e]) => ({ k, n, e }));
    if (tok && want("cuisines")) res.cuisines = [...new Set(ix.map(e => e.cuRaw).filter(c => { const n = norm(c); return n && (q.words.some(w => n.includes(w)) || q.words.every(w => n.includes(w))); }))].slice(0, 12);
    if (tok && want("pantry")) res.pantry = (S.pantry || []).filter(x => q.words.every(w => norm(x).includes(w)));
    if (tok && want("grocery")) res.grocery = (S.extras || []).filter(x => !x.done && q.words.every(w => norm(x.name).includes(w))).map(x => x.name);
    if (tok && want("plans")) { const d = []; for (const [day, es] of Object.entries(S.plan || {})) for (const e of es || []) { const r = R_(e.id); if (r && q.words.every(w => norm(r.n).includes(w))) d.push({ day, id: e.id }); } res.plans = d.slice(0, 20); }
    if (tok && want("history")) res.history = (S.cooked || []).map(id => R_(id)).filter(r => r && q.words.every(w => norm(r.n).includes(w))).slice(0, 20).map(r => r.id);
    if (tok && want("mine")) res.mine = (S.mine || []).filter(m => q.words.every(w => norm(m.n).includes(w))).map(m => m.id);
    return res;
  }
  /* ---------- suggestions: prefixes of known dish names and chapter names ---------- */
  function suggest(qs) {
    const p = norm(qs); if (p.length < 2) return [];
    const names = [...new Set([...ORG.CH.map(c => c[1]), ...(typeof RECIPES !== "undefined" ? RECIPES.map(r => r.n) : []), "Egyptian dinner", "Chicken soup", "Quick chicken", "Something sweet", "What can I make with eggs?", "Cozy dinner", "No dairy", "Air fryer chicken", "Garlic and potatoes", "Koshari", "Soups", "Desserts with chocolate", "Creamy pasta"])];
    const seen = new Set(), out = [];
    for (const n of names) { const t = norm(n); if (seen.has(t)) continue; if (t.startsWith(p) || t.split(" ").some(w => w.startsWith(p))) { seen.add(t); out.push(n); if (out.length >= 8) break; } }
    return out;
  }
  /* ---------- recent searches (per phone) ---------- */
  const RK = () => KEY + ".recent";
  const recent = () => { try { return JSON.parse(localStorage.getItem(RK()) || "[]"); } catch (e) { return []; } };
  function remember(q) { q = String(q || "").trim(); if (q.length < 2) return; try { localStorage.setItem(RK(), JSON.stringify([q, ...recent().filter(x => x !== q)].slice(0, 8))); } catch (e) {} }
  return { run, suggest, recent, remember, parse, norm, index, clearRecent: () => { try { localStorage.removeItem(RK()); } catch (e) {} } };
})();
/* ---------- the search sheet (opens from every screen's header) ---------- */
let gFilt = "all", gQ = "";
function gHTML(qs, filt) {
  const isQ = !!SEARCH.norm(qs);
  const r = isQ ? SEARCH.run(qs, filt) : null;
  const F = [["all", "All"], ["recipes", "Recipes"], ["chapters", "Chapters"], ["cuisines", "Cuisines"], ["pantry", "Pantry"], ["grocery", "Grocery"], ["plans", "Meal plan"], ["history", "Cooked"], ["mine", "Our recipes"]];
  const sug = SEARCH.suggest(qs);
  const pill = (k, l) => `<button class="chip ${gFilt === k ? "on" : ""}" data-a="gFilt" data-k="${k}">${l}</button>`;
  let body = "";
  if (!isQ) {
    const rec = SEARCH.recent();
    body = `${rec.length ? `<div class="row g8 wrap" style="margin:8px 0"><span class="mut small">Recent</span>${rec.map(x => `<button class="chip" data-a="gUse" data-q="${esc(x)}">${esc(x)}</button>`).join("")}<button class="link small" data-a="gClear">Clear history</button></div>` : ""}
<h3>Try</h3><div class="row g8 wrap">${["Chicken soup", "Egyptian dinner", "Chicken under 30 minutes", "Creamy pasta", "Garlic and potatoes", "No dairy", "Air fryer chicken", "What can I make with eggs?", "Koshari", "Something sweet"].map(x => `<button class="chip" data-a="gUse" data-q="${esc(x)}">${esc(x)}</button>`).join("")}</div>`;
  } else {
    const n = (r.recipes || []).length;
    body = `<div class="row g8 wrap" style="margin:6px 0">${F.map(([k, l]) => pill(k, l)).join("")}</div>
<p class="mut small" aria-live="polite">${n} matching recipe${n === 1 ? "" : "s"}${filt && filt !== "all" ? "" : ""}${r.not && r.not.length ? "" : ""}</p>
${sug.length && n === 0 ? `<p class="small">No recipes matched. Did you mean: ${sug.slice(0, 4).map(x => `<button class="link" data-a="gUse" data-q="${esc(x)}">${esc(x)}</button>`).join(" · ")}?</p>` : ""}
${(gFilt === "all" || gFilt === "chapters") && r.chapters.length ? `<h3>Cookbook chapters</h3>${r.chapters.map(c => `<button class="prow" data-a="gChapter" data-k="${c.k}"><span class="pn">${c.e} ${esc(c.n)}</span></button>`).join("")}` : ""}
${(gFilt === "all" || gFilt === "cuisines") && r.cuisines.length ? `<h3>Cuisines</h3>${r.cuisines.map(c => `<button class="chip" data-a="gUse" data-q="${esc(c)}">${esc(c)}</button>`).join(" ")}` : ""}
${(gFilt === "all" || gFilt === "pantry") && r.pantry.length ? `<h3>In your pantry</h3><p class="small">${r.pantry.map(esc).join(", ")}</p>` : ""}
${(gFilt === "all" || gFilt === "grocery") && r.grocery.length ? `<h3>On your grocery list</h3><p class="small">${r.grocery.map(esc).join(", ")}</p>` : ""}
${(gFilt === "all" || gFilt === "plans") && r.plans.length ? `<h3>In your meal plan</h3>${r.plans.map(p => `<p class="small">${esc(nice(p.day))}: ${esc(R_(p.id) ? R_(p.id).n : "")}</p>`).join("")}` : ""}
${(gFilt === "all" || gFilt === "history") && r.history.length ? `<h3>Cooked before</h3>${r.history.slice(0, 8).map(id => `<button class="prow" data-a="gOpen" data-id="${id}"><span class="pn">${esc(R_(id).n)}</span></button>`).join("")}` : ""}
${(gFilt === "all" || gFilt === "mine") && (r.mine || []).length ? `<h3>Our own recipes</h3>${r.mine.slice(0, 8).map(id => `<button class="prow" data-a="gOpen" data-id="${id}"><span class="pn">${esc((S.mine.find(m => m.id === id) || {}).n || "")}</span></button>`).join("")}` : ""}
${(gFilt === "all" || gFilt === "recipes") && n ? `<h3>Recipes</h3>${r.recipes.slice(0, 40).map(x => { const e = x.e, rr = e.r; return `<div class="prow" style="align-items:center"><button class="pn" style="text-align:left;flex:1" data-a="gOpen" data-id="${e.id}"><b>${esc(rr.n)}</b><small>${esc(e.cu || "")} · ${esc(e.tg.meal)} · ${e.min ? e.min + " min" : "time not listed"}${rr.cz ? " · cozy " + rr.cz + "/10" : ""}${e.fav ? " · ♥" : ""}</small></button><button class="btn sm ghost" data-a="gPlan" data-id="${e.id}">+ Plan</button></div>`; }).join("")}${n > 40 ? `<p class="mut small">Showing 40 of ${n}. Narrow the search to see more.</p>` : ""}` : ""}
${isQ && n && /dairy|gluten|vegetarian/i.test(qs) ? `<p class="mut small">* Dietary matches are based on the ingredient list only, not a verified label. Check packaged ingredients yourself.</p>` : ""}`;
  }
  return `<div class="d-body" style="padding-top:22px"><h2 class="d-t">Search everything</h2>
<input class="inp" id="gq" type="search" placeholder="Recipes, ingredients, chapters, cuisines…" value="${esc(qs)}" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" aria-label="Search" data-ch="gq">
${body}</div>`;
}
A.gSearch = () => { sheet(gHTML("", "all"), "search"); setTimeout(() => { const i = $("#gq"); if (i) i.focus(); }, 50); };
A.gUse = el => { gQ = el.dataset.q; $("#gq").value = gQ; SEARCH.remember(gQ); sheetRefresh(); };
A.gFilt = el => { gFilt = el.dataset.k; sheetRefresh(); };
A.gClear = () => { SEARCH.clearRecent(); sheetRefresh(); toast("Search history cleared"); };
A.gOpen = el => { SEARCH.remember(gQ); openDetail(+el.dataset.id); };
A.gPlan = el => { SEARCH.remember(gQ); planDlg(+el.dataset.id, null); };
A.gChapter = el => { sheetKind = null; closeSheet(); openChapter(el.dataset.k); };
function sheetRefresh() { const i = $("#gq"); const v = i ? i.value : gQ; sheet(gHTML(v, gFilt), "search"); const n = $("#gq"); if (n) { n.value = v; n.focus(); } }
document.addEventListener("input", e => { if (e.target && e.target.id === "gq") { gQ = e.target.value; clearTimeout(gq.t); gq.t = setTimeout(() => { if (!$("#gq")) return; const pos = $("#gq").selectionStart; const h = gHTML(gQ, gFilt); $("#sheetIn").innerHTML = h; const n = $("#gq"); n.value = gQ; n.focus(); try { n.setSelectionRange(pos, pos); } catch (x) {} }, 120); } });
document.addEventListener("keydown", e => { if (e.target && e.target.id === "gq" && e.key === "Enter") { SEARCH.remember(gQ); } });
let gq = { t: 0 };
