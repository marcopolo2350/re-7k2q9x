/* Rose's EATS: personalization (Phase 3), kitchen management (Phase 4), data protection and navigation.
   Loaded after kitchen.js. */
"use strict";
/* ================= data protection: schema, migrations, photo store ================= */
const SCHEMA = 3;
const DEF_COLS = ["Rose's Favorites", "Marco's Favorites", "We Both Love This", "Definitely Making Again", "Quick Weeknight Dinners", "Weekend Comfort Food", "Family Recipes", "Things We Want to Try"];
const DEF_EQUIP = { oven: 1, burners: 4, microwave: 1, airfryer: 0, slowcooker: 0, pressure: 0, grill: 0, blender: 1, processor: 0, mixer: 0, smoker: 0 };
function migrate(s) {
  /* additive and reversible: never deletes or renames existing fields */
  const v = s.schema || 1;
  if (v < 3) {
    try { if (!localStorage.getItem(KEY + ".pre-v3")) localStorage.setItem(KEY + ".pre-v3", localStorage.getItem(KEY) || ""); } catch (e) {}
  }
  if (!s.hist || typeof s.hist !== "object") s.hist = {};
  if (!s.ver || typeof s.ver !== "object") s.ver = {};
  if (!Array.isArray(s.cols)) s.cols = DEF_COLS.map((n, i) => ({ id: "c" + (i + 1), name: n, ids: [] }));
  if (!s.rej || typeof s.rej !== "object") s.rej = {};
  if (!Array.isArray(s.recent)) s.recent = [];
  if (!s.inv || typeof s.inv !== "object") s.inv = {};
  if (!s.buyCount || typeof s.buyCount !== "object") s.buyCount = {};
  if (!s.equip || typeof s.equip !== "object") s.equip = { ...DEF_EQUIP };
  for (const k in DEF_EQUIP) if (s.equip[k] == null) s.equip[k] = DEF_EQUIP[k];
  if (!Array.isArray(s.aisleOrder)) s.aisleOrder = [];
  if (!s.prefs || typeof s.prefs !== "object") s.prefs = {};
  (s.left || []).forEach(x => { if (!x.type) x.type = "dish"; });
  s.schema = SCHEMA; return s;
}
migrate(S); save();
const _load = load; load = function () { return migrate(_load()); };
/* IndexedDB for personal photos (localStorage is too small for photos) */
const IDB = { db: null, open() { return this.db ? Promise.resolve(this.db) : new Promise((ok, no) => { if (!("indexedDB" in window)) return no(new Error("no idb")); const r = indexedDB.open("roses-eats", 1); r.onupgradeneeded = () => r.result.createObjectStore("photos"); r.onsuccess = () => { this.db = r.result; ok(this.db); }; r.onerror = () => no(r.error); }); },
  async tx(mode, fn) { const db = await this.open(); return new Promise((ok, no) => { const t = db.transaction("photos", mode); const st = t.objectStore("photos"); const out = fn(st); t.oncomplete = () => ok(out && out.result !== undefined ? out.result : out); t.onerror = () => no(t.error); }); },
  put(k, v) { return this.tx("readwrite", s => s.put(v, k)); }, get(k) { return this.tx("readonly", s => s.get(k)); }, del(k) { return this.tx("readwrite", s => s.delete(k)); },
  async all() { const db = await this.open(); return new Promise((ok, no) => { const out = {}; const t = db.transaction("photos", "readonly"); const c = t.objectStore("photos").openCursor(); c.onsuccess = () => { const x = c.result; if (x) { out[x.key] = x.value; x.continue(); } }; t.oncomplete = () => ok(out); t.onerror = () => no(t.error); }); } };
/* ================= backup, validated restore, storage info ================= */
async function fullBackup() { let photos = {}; try { photos = await IDB.all(); } catch (e) {} return { app: "Rose's EATS", format: 2, schema: SCHEMA, exported: new Date().toISOString(), state: S, photos }; }
function validateBackup(o) {
  const errs = []; if (!o || typeof o !== "object") return { ok: false, errs: ["Not a Rose's EATS backup file."] };
  const st = o.state && typeof o.state === "object" ? o.state : (o.v ? o : null);
  if (!st) return { ok: false, errs: ["No saved data found in this file."] };
  const arr = ["fav", "cooked", "pantry", "mine", "extras", "left", "log"], obj = ["plan", "basket", "notes", "rating", "tk", "photos"];
  arr.forEach(k => { if (st[k] != null && !Array.isArray(st[k])) errs.push(k + " should be a list"); });
  obj.forEach(k => { if (st[k] != null && typeof st[k] !== "object") errs.push(k + " should be an object"); });
  const photos = o.photos && typeof o.photos === "object" ? Object.fromEntries(Object.entries(o.photos).filter(([k, v]) => typeof v === "string" && /^data:image\/(jpeg|png|webp);base64,/.test(v))) : {};
  const cnt = { favorites: (st.fav || []).length, "cooking history entries": Object.values(st.hist || {}).reduce((a, x) => a + (x || []).length, 0), "recipe versions": Object.keys(st.ver || {}).length, "own recipes": (st.mine || []).length, collections: (st.cols || []).length, "pantry items": (st.pantry || []).length, "planned meals": Object.values(st.plan || {}).flat().length, "grocery extras": (st.extras || []).length, photos: Object.keys(photos).length + Object.keys(st.photos || {}).length };
  return { ok: !errs.length, errs, st, photos, cnt };
}
let pendingImport = null;
async function importBackup(text) {
  let o; try { o = JSON.parse(text); } catch (e) { try { o = cleanImport(text); } catch (e2) { toast("That file or code isn't a valid backup"); return; } }
  const v = validateBackup(o); if (!v.ok) { sheet(`<div class="d-body" style="padding-top:22px"><h2 class="d-t">Can't import this</h2><ul>${v.errs.map(e => `<li>${esc(e)}</li>`).join("")}</ul><p class="mut">Nothing was changed.</p></div>`, "imp"); return; }
  pendingImport = v;
  sheet(`<div class="d-body" style="padding-top:22px"><h2 class="d-t">Import preview</h2><p class="mut">This backup contains:</p><ul>${Object.entries(v.cnt).map(([k, n]) => `<li><b>${n}</b> ${esc(k)}</li>`).join("")}</ul>
<p class="warn">Importing replaces the data on this phone. A copy of the current data is saved first, so you can undo it from Settings.</p>
<button class="btn full big" data-a="lImpYes">Replace with this backup</button><button class="btn ghost full" style="margin-top:8px" data-a="closeSheet">Cancel</button></div>`, "imp");
}
A.lImpYes = async () => {
  const v = pendingImport; if (!v) return;
  try { localStorage.setItem(KEY + ".before-import", JSON.stringify({ at: Date.now(), state: S })); } catch (e) { toast("Not enough space to keep an undo copy. Export a backup first."); return; }
  try { for (const [k, d] of Object.entries(v.photos)) await IDB.put(k, d); } catch (e) {}
  const ns = migrate(Object.assign(fresh(), v.st));
  try { localStorage.setItem(KEY, JSON.stringify(ns)); } catch (e) { toast("Import failed: not enough storage. Nothing was changed."); return; }
  S = ns; pendingImport = null; syncMine(); closeSheet(); toast("Backup restored ♡"); render();
};
A.lUndoImport = () => { const b = localStorage.getItem(KEY + ".before-import"); if (!b) { toast("No import to undo"); return; } confirmDlg("Undo the last import?", "This puts back the data that was on this phone before the import.", "Undo import", () => { const o = JSON.parse(b); S = migrate(Object.assign(fresh(), o.state)); save(); syncMine(); closeSheet(); toast("Import undone"); render(); }); };
A.lExport = async () => { const b = await fullBackup(); const t = JSON.stringify(b); const name = "roses-eats-backup-" + todayIso() + ".json"; try { const f = new File([t], name, { type: "application/json" }); if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: "Rose's EATS backup" }); S.prefs.lastBackup = Date.now(); save(); return; } } catch (e) {} dl(name, t, "application/json"); S.prefs.lastBackup = Date.now(); save(); };
A.lImportFile = () => { const i = document.createElement("input"); i.type = "file"; i.accept = ".json,application/json,text/plain"; i.onchange = () => { const f = i.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => importBackup(rd.result); rd.readAsText(f); }; i.click(); };
async function storageInfo() {
  const ls = (localStorage.getItem(KEY) || "").length * 2; let ph = 0, n = 0; try { const a = await IDB.all(); for (const v of Object.values(a)) { ph += v.length * .75; n++; } } catch (e) {}
  let est = ""; try { const e = await navigator.storage.estimate(); est = `${fmtB(e.usage || 0)} used of about ${fmtB(e.quota || 0)} the browser allows`; } catch (e) {}
  let pers = ""; try { pers = navigator.storage && navigator.storage.persisted ? ((await navigator.storage.persisted()) ? "Protected from automatic clearing" : "The browser may clear this data if the phone runs low on space") : ""; } catch (e) {}
  return `Saved data ${fmtB(ls)} · ${n} personal photo${n === 1 ? "" : "s"} ${fmtB(ph)}<br>${est}<br>${pers}`;
}
function dataCard() {
  const lb = S.prefs.lastBackup;
  return `<div class="card small" id="dataCard"><b>🛟 Backup & restore</b><p class="mut" style="margin:4px 0 8px">Everything lives only on this phone. Browser storage isn't a guaranteed backup, so export a backup file now and then (it includes history, versions, photos, pantry and plans). ${lb ? "Last backup: " + nice(iso(new Date(lb))) + "." : "<b>No backup yet.</b>"}</p>
<div class="row g8 wrap"><button class="btn sm" data-a="lExport">⬇ Export full backup</button><button class="btn sm ghost" data-a="lImportFile">⬆ Restore from file</button>${localStorage.getItem(KEY + ".before-import") ? `<button class="btn sm ghost" data-a="lUndoImport">↺ Undo last import</button>` : ""}</div><div class="mut" id="lStore" style="margin-top:8px">Checking storage…</div></div>`;
}
/* ================= equipment ================= */
const EQ = [["oven", "Oven"], ["microwave", "Microwave"], ["airfryer", "Air fryer"], ["slowcooker", "Slow cooker"], ["pressure", "Pressure cooker / Instant Pot"], ["grill", "Outdoor grill"], ["smoker", "Smoker"], ["blender", "Blender"], ["processor", "Food processor"], ["mixer", "Stand or hand mixer"]];
const EQRX = { oven: /\boven\b|\bbake[sd]?\b|\broast(ed|ing)?\b|\bbroil/i, airfryer: /air[- ]?fr/i, slowcooker: /slow[- ]?cooker|crock[- ]?pot|crockpot/i, pressure: /pressure cooker|instant pot|pressure cook/i, grill: /\bgrill(ed|ing)?\b(?!\s*pan)|barbecue|\bbbq\b|charcoal/i, smoker: /\bsmoker\b/i, blender: /\bblend(er)?\b|pur[ée]e\b|smoothie/i, processor: /food processor|\bpulse\b/i, mixer: /stand mixer|electric mixer|hand mixer|\bmixer\b/i, microwave: /microwave/i };
const EQALT = { oven: "No oven: a covered heavy pan on low heat or a toaster oven can work for some dishes; baking needs an oven.", airfryer: "No air fryer: use the oven at 400°F on a rack, about 25% longer.", slowcooker: "No slow cooker: simmer covered in a Dutch oven at 300°F in the oven, about half the slow-cooker time.", pressure: "No pressure cooker: simmer covered on the stove, roughly 3 times longer, until tender.", grill: "No grill: use a very hot grill pan, cast-iron skillet or the broiler.", smoker: "No smoker: a covered grill set up for indirect heat with wood chips can work.", blender: "No blender: mash by hand or use a food processor; texture will be coarser.", processor: "No food processor: chop very finely by hand or use a blender in short pulses.", mixer: "No mixer: whisk or beat by hand; it takes longer.", microwave: "No microwave: warm on the stove." };
const reqEq = r => { if (r._eq) return r._eq; const t = r.st.join(" "); return (r._eq = Object.keys(EQRX).filter(k => EQRX[k].test(t) && !(k === "mixer" && /\bmix\b/i.test(t) && !/mixer/i.test(t)))); };
const missingEq = r => reqEq(r).filter(k => !S.equip[k]);
const canMake = r => !missingEq(r).filter(k => ["oven", "pressure", "slowcooker", "smoker", "airfryer", "grill"].includes(k) ? !EQALT[k] || k === "oven" && ["baking", "treats"].includes(r.c) : false).length;
/* recipes view: equipment filter */
const _filtered = filtered; filtered = function (skipCu) { const L = _filtered(skipCu); return F.eq ? L.filter(r => !missingEq(r).length) : L; };
A.lEqF = () => { F.eq = !F.eq; F.lim = 24; render(true); };
const _recipes = V.recipes;
V.recipes = function () { let h = _recipes(); const i = h.indexOf('<div class="filters">'); const add = `<div class="row g8 wrap" style="margin:4px 0 8px"><button class="chip ${F.eq ? "on" : ""}" data-a="lEqF">🍳 Only what my kitchen can make</button><button class="chip" data-a="go" data-t="cookbook">📚 Open the cookbook</button><button class="chip" data-a="lCols">🗂 Collections</button></div>`; return i >= 0 ? h.slice(0, i) + add + h.slice(i) : h + add; };
/* ================= techniques ================= */
const TECH = {
  dice: ["Dice", "Cut into even cubes (small ¼ in, medium ½ in). Square off the vegetable, slice into planks, then sticks, then across.", "Uneven pieces cook unevenly: the small ones burn while big ones stay raw."],
  mince: ["Mince", "Chop as finely as possible: slice thin, then rock the knife back and forth over the pile, gathering it as you go.", "Minced garlic burns in seconds; add it after onions have softened."],
  julienne: ["Julienne", "Cut into thin matchsticks about ⅛ in by 2 in: slice thin planks, stack them, slice into strips.", "Thick, uneven sticks cook at different speeds in stir-fries."],
  fold: ["Fold", "Gently combine a light mixture (whipped cream or egg whites) into a heavier one: cut down through the middle with a spatula, sweep along the bottom and turn it over, rotating the bowl.", "Stirring knocks out the air, so the cake or mousse turns flat and dense."],
  blanch: ["Blanch", "Boil briefly in well-salted water (30 seconds to 3 minutes), then plunge into ice water to stop cooking.", "Skipping the ice bath lets vegetables keep cooking and lose their color."],
  deglaze: ["Deglaze", "Add liquid (wine, broth, water) to the hot pan after searing and scrape up the browned bits; they dissolve into the sauce.", "Burnt, black bits are bitter; only deglaze brown fond."],
  temper: ["Temper", "Slowly whisk a little hot liquid into eggs (or yogurt) to warm them gradually, then add the mixture back to the pot.", "Adding eggs straight into hot liquid scrambles them."],
  emulsify: ["Emulsify", "Combine fat and liquid into a smooth sauce by adding the oil in a slow, thin stream while whisking or blending.", "Adding oil too fast breaks the sauce; whisk a spoonful of water or a fresh yolk in a clean bowl and slowly add the broken sauce back."],
  knead: ["Knead", "Push the dough away with the heel of your hand, fold it back, turn a quarter and repeat until smooth and springy (8 to 10 minutes).", "Adding too much flour makes bread dry and dense; a little stickiness is normal."],
  proof: ["Proof (rise)", "Let yeast dough rise covered in a warm, draft-free place until about doubled, or until a floured finger dent springs back slowly.", "Over-proofed dough collapses in the oven; under-proofed dough bakes dense."],
  sear: ["Sear", "Brown the surface over high heat in a hot pan with a little oil. Pat the food dry and don't move it until it releases.", "A crowded or cool pan steams the meat gray instead of browning it."],
  reduce: ["Reduce", "Simmer uncovered so water evaporates and the liquid thickens and concentrates.", "Season after reducing; salt concentrates as it cooks down."],
  rest: ["Rest", "Let cooked meat sit loosely covered 5 to 15 minutes before cutting so juices settle (the center also rises a few degrees).", "Cutting right away floods the board with juice and dries the meat."],
  saute: ["Sauté", "Cook quickly in a little fat over medium-high heat, stirring or tossing often.", "Too much in the pan lowers the heat; cook in batches."],
  braise: ["Braise", "Brown, then cook slowly covered with some liquid at a gentle simmer (stove or a 300–325°F oven) until tender.", "Boiling instead of simmering makes braised meat tough and stringy."],
  simmer: ["Simmer", "Cook just below boiling: small bubbles break the surface gently.", "A rolling boil toughens meat and clouds broths."],
  caramelize: ["Caramelize", "Cook sliced onions slowly over medium-low heat with a little fat for 30–45 minutes until deep golden and sweet.", "High heat browns the edges but leaves them raw and bitter."],
  zest: ["Zest", "Grate only the colored outer peel of citrus; the white pith underneath is bitter.", "Zest before you juice; it's much harder afterwards."],
  whisk: ["Whisk", "Beat quickly in a loop to blend and add air.", "A cold or greasy bowl stops egg whites from whipping."],
  cream: ["Cream (butter and sugar)", "Beat soft butter with sugar until pale and fluffy (3–5 minutes); this traps air that helps cakes rise.", "Melted or cold butter won't cream properly."],
  bloom: ["Bloom", "Briefly fry spices in hot oil (or soak gelatin in cold water) to wake up their flavor or texture.", "Spices burn in seconds; keep the heat moderate."],
  chiffonade: ["Chiffonade", "Stack leaves, roll tightly, slice into thin ribbons.", "A dull knife bruises herbs and turns them black."]
};
const TECHRX = new RegExp("\\b(" + ["diced?", "dicing", "minced?", "mincing", "julienned?", "fold(?:ed|ing)? in", "fold", "blanch(?:ed|ing)?", "deglaze[ds]?", "deglazing", "temper(?:ed|ing)?", "emulsif(?:y|ies|ied)", "knead(?:ed|ing)?", "proof(?:ed|ing)?", "sear(?:ed|ing)?", "reduce[ds]?", "let (?:it )?rest", "rest(?:ing)? for", "saut[eé](?:ed|ing)?", "braise[ds]?", "braising", "simmer(?:ed|ing)?", "carameli[sz](?:e|ed|ing)", "zest(?:ed)?", "whisk(?:ed|ing)?", "cream the butter", "bloom", "chiffonade"].join("|") + ")\\b", "i");
const techKey = w => { w = w.toLowerCase(); for (const k of Object.keys(TECH)) if (w.startsWith(k.slice(0, 4)) || (k === "saute" && /^saut/.test(w)) || (k === "caramelize" && /^carameli/.test(w)) || (k === "rest" && /rest/.test(w)) || (k === "cream" && /^cream the/.test(w)) || (k === "fold" && /^fold/.test(w)) || (k === "emulsify" && /^emulsif/.test(w))) return k; return null; };
function techLink(html) { const seen = new Set(); return html.split(/(<[^>]+>)/).map(p => p.startsWith("<") ? p : p.replace(new RegExp(TECHRX.source, "gi"), m => { const k = techKey(m); if (!k || seen.has(k)) return m; seen.add(k); return `<button class="tech" data-a="lTech" data-k="${k}">${m}</button>`; })).join(""); }
A.lTech = el => { const t = TECH[el.dataset.k]; if (!t) return; let o = $("#techPop"); if (!o) { o = document.createElement("div"); o.id = "techPop"; document.body.appendChild(o); } o.innerHTML = `<div class="tp-in"><b>${t[0]}</b><p>${t[1]}</p><p class="mut"><b>Common mistake:</b> ${t[2]}</p><button class="btn full" data-a="lTechX">Got it</button></div>`; o.classList.add("on"); };
A.lTechX = () => { const o = $("#techPop"); if (o) o.classList.remove("on"); };
const _stepsHtml = stepsHtml; stepsHtml = function (r, f) { return techLink(_stepsHtml(r, f)); };
const _rCook = rCook; rCook = function () { _rCook(); const s = $("#cook .ck-step"); if (s) s.innerHTML = techLink(s.innerHTML); };
/* ================= cooking history ================= */
const hist = id => (S.hist[id] = S.hist[id] || []);
function histCard(r) {
  const H = S.hist[r.id] || []; const log = (S.log || []).filter(x => x.id === r.id).length;
  if (!H.length && !log) return "";
  const last = H[H.length - 1], rated = H.filter(h => h.r), avg = rated.length ? (rated.reduce((a, h) => a + h.r, 0) / rated.length).toFixed(1) : null;
  return `<div class="card khist"><b>📓 Rose's Kitchen Notes</b><div class="mut small">${Math.max(H.length, log)} time${Math.max(H.length, log) === 1 ? "" : "s"} cooked${avg ? ` · ★ ${avg}` : ""}${last && last.again ? ` · make again: ${esc(last.again)}` : ""}</div>${last ? `<p><b>Last time (${nice(last.at)}):</b> ${esc([last.notes, last.changes && "Changed: " + last.changes, last.subs && "Swapped/skipped: " + last.subs].filter(Boolean).join(" · ") || "No notes")}</p>${last.next ? `<p><b>Next time:</b> ${esc(last.next)}</p>` : ""}${last.both ? `<p class="mut small">${esc({ both: "We both loved it", rose: "Rose loved it", marco: "Marco loved it", neither: "Not a hit" }[last.both] || "")}</p>` : ""}<div class="hph" data-hph="${r.id}"></div>` : ""}
<div class="row g8"><button class="btn sm ghost" data-a="lHistAdd" data-id="${r.id}">＋ Add a cooking note</button>${H.length > 1 ? `<button class="btn sm ghost" data-a="lHistAll" data-id="${r.id}">All ${H.length}</button>` : ""}</div></div>`;
}
function histForm(id, h) {
  h = h || {}; const r = R_(id); const st = stats(r);
  const sug = [...st.sub.map(x => x.k + " → " + x.sb.x), ...st.rec.map(k => "skipped " + k), ...st.opt.map(k => "skipped " + k)].join("; ");
  const stars = [1, 2, 3, 4, 5].map(n => `<button class="star ${h.r >= n ? "on" : ""}" data-a="lStar" data-v="${n}">★</button>`).join("");
  return `<div class="d-body" style="padding-top:22px"><h2 class="d-t">How did it go?</h2><p class="mut">${esc(r.n)}. The original recipe never changes; this is your own record.</p>
<div class="hf" id="hf" data-id="${id}" data-r="${h.r || 0}"><label>Date</label><input class="inp" type="date" data-h="at" value="${h.at || todayIso()}"><label>Rating</label><div class="stars">${stars}</div>
<label>Make it again?</label><select class="inp" data-h="again">${["", "yes", "maybe", "no"].map(x => `<option ${h.again === x ? "selected" : ""} value="${x}">${x ? { yes: "Yes", maybe: "Maybe", no: "No" }[x] : "-"}</option>`).join("")}</select>
<label>Who loved it?</label><select class="inp" data-h="both">${[["", "-"], ["both", "We both loved it"], ["rose", "Rose"], ["marco", "Marco"], ["neither", "Not a hit"]].map(([v, t]) => `<option ${h.both === v ? "selected" : ""} value="${v}">${t}</option>`).join("")}</select>
<div class="row g8"><div style="flex:1"><label>Prep (min)</label><input class="inp" type="number" inputmode="numeric" data-h="prep" value="${h.prep || ""}"></div><div style="flex:1"><label>Cook (min)</label><input class="inp" type="number" inputmode="numeric" data-h="cook" value="${h.cook || ""}"></div><div style="flex:1"><label>Servings</label><input class="inp" type="number" inputmode="numeric" data-h="s" value="${h.s || (det && det.id === id ? det.s : r.s)}"></div></div>
<label>Swaps & skipped ingredients</label><input class="inp" data-h="subs" maxlength="300" value="${esc(h.subs || sug)}">
<label>Quantity or method changes</label><input class="inp" data-h="changes" maxlength="300" value="${esc(h.changes || "")}">
<label>What worked</label><input class="inp" data-h="worked" maxlength="300" value="${esc(h.worked || "")}">
<label>What didn't</label><input class="inp" data-h="notWorked" maxlength="300" value="${esc(h.notWorked || "")}">
<label>Notes</label><textarea class="inp" rows="2" data-h="notes" maxlength="800">${esc(h.notes || "")}</textarea>
<label>Next time</label><input class="inp" data-h="next" maxlength="300" value="${esc(h.next || "")}">
<label class="btn sm ghost" style="margin-top:8px">📷 Add a photo<input type="file" accept="image/*" data-k2="hphoto" style="display:none"></label><span class="mut small" id="hphN"></span></div>
<button class="btn full big" style="margin-top:12px" data-a="lHistSave">Save to my kitchen notes</button></div>`;
}
let hPhotos = [];
A.lHistAdd = el => { hPhotos = []; sheet(histForm(+el.dataset.id), "hist"); };
A.lStar = el => { const f = $("#hf"); f.dataset.r = el.dataset.v; document.querySelectorAll("#hf .star").forEach((b, i) => b.classList.toggle("on", i < +el.dataset.v)); };
document.addEventListener("change", e => { if (e.target.dataset && e.target.dataset.k2 === "hphoto") { const f = e.target.files[0]; if (!f) return; shrinkImg(f, u => { hPhotos.push(u); const n = $("#hphN"); if (n) n.textContent = hPhotos.length + " photo(s) attached"; }); } });
A.lHistSave = async () => {
  const f = $("#hf"); const id = +f.dataset.id; const h = { r: +f.dataset.r || 0 };
  f.querySelectorAll("[data-h]").forEach(i => { const v = i.value.trim(); if (v) h[i.dataset.h] = ["prep", "cook", "s"].includes(i.dataset.h) ? Math.max(0, Math.min(2000, +v)) : v.slice(0, 800); });
  h.ph = []; for (const p of hPhotos) { const k = "h:" + id + ":" + Date.now() + ":" + h.ph.length; try { await IDB.put(k, p); h.ph.push(k); } catch (e) { toast("Couldn't save the photo on this browser"); } }
  hist(id).push(h); if (h.r) S.rating[id] = h.r * 2; if (!isCooked(id)) S.cooked.push(id); if (h.again === "no") S.rej[id] = { n: 3, at: Date.now() };
  save(); hPhotos = []; toast("📓 Saved to your kitchen notes"); openDetail(id);
};
A.lHistAll = el => { const id = +el.dataset.id; sheet(`<div class="d-body" style="padding-top:22px"><h2 class="d-t">Every time we made ${esc(R_(id).n)}</h2>${hist(id).slice().reverse().map(h => `<div class="card small"><b>${nice(h.at)}</b>${h.r ? " · " + "★".repeat(h.r) : ""}${h.again ? " · again: " + esc(h.again) : ""}${h.prep || h.cook ? `<div class="mut">prep ${h.prep || "?"} min · cook ${h.cook || "?"} min${h.s ? " · " + h.s + " servings" : ""}</div>` : ""}${["subs", "changes", "worked", "notWorked", "notes", "next"].filter(k => h[k]).map(k => `<div><b>${{ subs: "Swaps", changes: "Changes", worked: "Worked", notWorked: "Didn't work", notes: "Notes", next: "Next time" }[k]}:</b> ${esc(h[k])}</div>`).join("")}</div>`).join("")}</div>`, "hist"); };
async function fillHistPhotos() { const el = document.querySelector("[data-hph]"); if (!el) return; const H = S.hist[+el.dataset.hph] || []; const last = H[H.length - 1]; if (!last || !last.ph || !last.ph.length) return; for (const k of last.ph) { try { const u = await IDB.get(k); if (u) el.insertAdjacentHTML("beforeend", `<img src="${u}" alt="Our photo">`); } catch (e) {} } }
const _logCooked = logCooked; logCooked = function (id) { _logCooked(id); const s = $("#sheetIn"); if (s) s.insertAdjacentHTML("beforeend", `<div style="text-align:center;margin-top:10px"><button class="btn" data-a="lHistAdd" data-id="${id}">📓 How did it go? Add a note</button></div>`); };
/* ================= personal recipe versions ================= */
const VBASE = 700000;
function verToR(v) {
  const b = R_(v.base) || BASE.find(x => x.id === v.base); if (!b) return null;
  const r = { ...b, id: v.id, n: v.name, vbase: b.id, s: v.s || b.s, i: v.ing.map(parseFree), st: v.st.slice(), d: v.method ? v.method : b.d, isVer: true };
  r.keys = [...new Set(r.i.map(x => x.item).filter(x => x && !SKIP.has(x)))]; if (!r.keys.length) r.keys = ["(no ingredients)"];
  const map = r.i.map(g => b.i.findIndex(x => x.item === g.item));
  const cf = b.cf || {}; r.ilv = map.map(j => j >= 0 ? b.ilv[j] : "U");
  const w = {}, sub = {}; let rl = ""; map.forEach((j, k) => { if (j < 0) { rl += "X"; return; } rl += (cf.rl || "")[j] || "X"; if (cf.w && cf.w[j]) w[k] = cf.w[j]; if (cf.sub && cf.sub[j]) sub[k] = cf.sub[j]; });
  r.cf = { lv: r.ilv.join(""), rl, w, sub, tips: (v.tips || []).map(t => ({ t, s: -1 })).concat((cf.tips || []).map(t => ({ t: t.t, s: -1 }))) };
  kImp(r); r.mn = mainOf(r); return r;
}
const _syncMine = syncMine; syncMine = function () { _syncMine(); Object.values(S.ver || {}).forEach(v => { const r = verToR(v); if (r) RID[v.id] = r; }); };
syncMine();
const versionsOf = id => Object.values(S.ver).filter(v => v.base === id);
function verBar(r) {
  const base = r.isVer ? r.vbase : r.id; if (r.mine && !r.isVer) return "";
  const V = versionsOf(base);
  return `<div class="verbar"><button class="chip ${!r.isVer ? "on" : ""}" data-a="open" data-id="${base}">Original</button>${V.map(v => `<button class="chip ${r.id === v.id ? "on" : ""}" data-a="open" data-id="${v.id}">${esc(v.name)}</button>`).join("")}<button class="chip" data-a="lVerNew" data-id="${r.id}">＋ My version</button></div>${r.isVer ? `<div class="card small verinfo">✏️ Your version of <b>${esc(R_(base).n)}</b>. The original is unchanged.<div class="row g8 wrap"><button class="btn sm ghost" data-a="lVerEdit" data-id="${r.id}">Edit</button><button class="btn sm ghost" data-a="lVerCmp" data-id="${r.id}">Compare</button><button class="btn sm ghost" data-a="lVerDup" data-id="${r.id}">Duplicate</button><button class="btn sm ghost" data-a="lVerDel" data-id="${r.id}">Delete</button></div></div>` : ""}`;
}
function verForm(src, v) {
  return `<div class="d-body" style="padding-top:22px"><h2 class="d-t">${v ? "Edit" : "New"} version</h2><p class="mut small">Based on ${esc(src.n)}. One ingredient or step per line. The original recipe is never changed.</p><div id="vf" data-base="${src.isVer ? src.vbase : src.id}" data-vid="${v ? v.id : ""}">
<label>Version name</label><input class="inp" id="vName" maxlength="60" value="${esc(v ? v.name : src.n.replace(/ \(.*\)$/, "") + " (our way)")}">
<label>Servings</label><input class="inp" id="vS" type="number" min="1" max="60" value="${v ? v.s : src.s}">
<label>Cooking method or notes (e.g. made in the air fryer)</label><input class="inp" id="vM" maxlength="200" value="${esc(v ? v.method || "" : "")}">
<label>Ingredients</label><textarea class="inp" id="vI" rows="10">${esc(v ? v.ing.join("\n") : src.i.map(g => ingText(g, 1)).join("\n"))}</textarea>
<label>Steps</label><textarea class="inp" id="vSt" rows="8">${esc((v ? v.st : src.st).join("\n"))}</textarea>
<label>Our Pro Tips (one per line)</label><textarea class="inp" id="vT" rows="3">${esc(v ? (v.tips || []).join("\n") : "")}</textarea></div>
<button class="btn full big" style="margin-top:12px" data-a="lVerSave">Save version</button></div>`;
}
A.lVerNew = el => { sheet(verForm(R_(+el.dataset.id)), "ver"); };
A.lVerEdit = el => { const v = S.ver[el.dataset.id]; sheet(verForm(R_(v.base), v), "ver"); };
A.lVerSave = () => {
  const f = $("#vf"); const lines = id => $(id).value.split("\n").map(x => x.trim()).filter(Boolean);
  const ing = lines("#vI").slice(0, 80), st = lines("#vSt").slice(0, 60); if (!ing.length || !st.length) { toast("A version needs ingredients and steps"); return; }
  const id = f.dataset.vid ? +f.dataset.vid : VBASE + 1 + Object.keys(S.ver).reduce((a, k) => Math.max(a, +k - VBASE), 0);
  S.ver[id] = { id, base: +f.dataset.base, name: ($("#vName").value.trim() || "Our version").slice(0, 60), s: Math.max(1, Math.min(60, +$("#vS").value || 4)), method: $("#vM").value.trim().slice(0, 200), ing, st, tips: lines("#vT").slice(0, 10), at: S.ver[id] ? S.ver[id].at : Date.now(), upd: Date.now() };
  save(); syncMine(); toast("✏️ Version saved"); openDetail(id);
};
A.lVerDup = el => { const v = S.ver[el.dataset.id]; const id = VBASE + 1 + Object.keys(S.ver).reduce((a, k) => Math.max(a, +k - VBASE), 0); S.ver[id] = { ...JSON.parse(JSON.stringify(v)), id, name: (v.name + " (copy)").slice(0, 60), at: Date.now() }; save(); syncMine(); openDetail(id); };
A.lVerDel = el => { const v = S.ver[el.dataset.id]; confirmDlg("Delete this version?", `"${v.name}" will be removed. The original recipe stays.`, "Delete version", () => { delete S.ver[v.id]; save(); syncMine(); closeSheet(); openDetail(v.base); }); };
A.lVerCmp = el => {
  const v = S.ver[el.dataset.id], b = R_(v.base), r = R_(v.id);
  const bi = b.i.map(g => ingText(g, v.s / b.s)), vi = r.i.map(g => ingText(g, 1));
  const bItems = new Set(b.i.map(g => g.item)), vItems = new Set(r.i.map(g => g.item));
  const added = r.i.filter(g => !bItems.has(g.item)).map(g => ingText(g, 1)), removed = b.i.filter(g => !vItems.has(g.item)).map(g => ingText(g, 1));
  const changed = r.i.filter(g => bItems.has(g.item)).map(g => { const o = b.i.find(x => x.item === g.item); const a = ingText(o, v.s / b.s), c = ingText(g, 1); return a !== c ? `${c} <span class="mut">(original: ${esc(a)})</span>` : null; }).filter(Boolean);
  sheet(`<div class="d-body" style="padding-top:22px"><h2 class="d-t">${esc(v.name)} vs original</h2><p class="mut small">Original quantities shown for ${v.s} servings.</p>
${added.length ? `<h3>Added</h3><ul>${added.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}${removed.length ? `<h3>Removed</h3><ul>${removed.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}${changed.length ? `<h3>Changed</h3><ul>${changed.map(x => `<li>${x}</li>`).join("")}</ul>` : ""}
<h3>Steps</h3><p>${r.st.length} steps (original ${b.st.length}).${v.method ? " Method: " + esc(v.method) : ""}</p>${!added.length && !removed.length && !changed.length ? "<p>Same ingredients as the original.</p>" : ""}
<button class="btn ghost full" data-a="open" data-id="${b.id}">Open the original</button></div>`, "ver");
};
/* ================= collections ================= */
A.lColAdd = el => { const id = +el.dataset.id; sheet(`<div class="d-body" style="padding-top:22px"><h2 class="d-t">Save ${esc(R_(id).n)} to…</h2>${S.cols.map(c => `<label class="toggle"><span>${esc(c.name)}</span><span class="sw"><input type="checkbox" data-k2="colTog" data-c="${c.id}" data-id="${id}" ${c.ids.includes(id) ? "checked" : ""}><span></span></span></label>`).join("")}<form class="addf" data-f="lColNew" data-id="${id}"><input class="inp" id="colN" placeholder="New collection" maxlength="40"><button class="btn sm">Add</button></form></div>`, "col"); };
document.addEventListener("change", e => { const el = e.target; if (!el.dataset || el.dataset.k2 !== "colTog") return; const c = S.cols.find(x => x.id === el.dataset.c), id = +el.dataset.id; if (!c) return; c.ids = c.ids.filter(x => x !== id); if (el.checked) c.ids.push(id); save(); });
document.addEventListener("submit", e => { if (e.target.dataset.f === "lColNew") { const n = ($("#colN").value || "").trim(); if (!n) return; const id = +e.target.dataset.id; S.cols.push({ id: "c" + Date.now().toString(36), name: n.slice(0, 40), ids: id ? [id] : [] }); save(); id ? A.lColAdd({ dataset: { id } }) : A.lCols(); } else if (e.target.dataset.f === "lColRen") { const c = S.cols.find(x => x.id === e.target.dataset.c); const n = (e.target.querySelector("input").value || "").trim(); if (c && n) { c.name = n.slice(0, 40); save(); toast("Renamed"); } } });
A.lCols = () => sheet(`<div class="d-body" style="padding-top:22px"><h2 class="d-t">🗂 Collections</h2>${S.cols.map(c => `<div class="card small"><div class="row sb"><b data-a="lColOpen" data-c="${c.id}">${esc(c.name)}</b><span class="mut">${c.ids.filter(id => R_(id)).length}</span></div><div class="row g8"><button class="btn sm" data-a="lColOpen" data-c="${c.id}">Open</button><form class="addf" data-f="lColRen" data-c="${c.id}" style="flex:1"><input class="inp" value="${esc(c.name)}" maxlength="40"><button class="btn sm ghost">Rename</button></form><button class="x" data-a="lColDel" data-c="${c.id}" aria-label="Delete collection">✕</button></div></div>`).join("")}<form class="addf" data-f="lColNew" data-id="0"><input class="inp" id="colN" placeholder="New collection" maxlength="40"><button class="btn sm">Add</button></form></div>`, "cols");
A.lColOpen = el => { const c = S.cols.find(x => x.id === el.dataset.c); const L = c.ids.map(R_).filter(Boolean); sheet(`<div class="d-body" style="padding-top:22px"><h2 class="d-t">${esc(c.name)}</h2>${L.length ? L.map(r => `<div class="pe" data-a="open" data-id="${r.id}">${mini(r)}<span class="pn">${esc(r.n)}<small>${r.t} min${r.cu ? " · " + esc(r.cu) : ""}</small></span></div>`).join("") : `<p class="mut">Nothing here yet. Use "🗂 Save to…" on any recipe.</p>`}<button class="btn ghost full" data-a="lCols">‹ All collections</button></div>`, "cols"); };
A.lColDel = el => { const c = S.cols.find(x => x.id === el.dataset.c); confirmDlg(`Delete "${c.name}"?`, "Only the collection is removed; the recipes stay.", "Delete", () => { S.cols = S.cols.filter(x => x !== c); save(); A.lCols(); }); };
/* ================= recommender ================= */
const MOODS = [["cozy", "Cozy"], ["comfort", "Comfort food"], ["light", "Something light"], ["spicy", "Spicy"], ["cheesy", "Cheesy"], ["fresh", "Fresh"], ["takeout", "Takeout-style"], ["sweet", "Sweet"]];
const moodOk = { cozy: r => r.cz >= 8 || ["soup", "comfort"].includes(r.c), comfort: r => r.c === "comfort" || r.cz >= 9, light: r => r.c === "light" || (r.cz <= 6 && r.c !== "treats"), spicy: r => /spic|hot|chili|chilli|curry|vindaloo|szechuan|sichuan|harissa|jerk|buffalo|kimchi/i.test(r.n) || r.keys.some(k => /chili|chilli|cayenne|jalape|sriracha|gochu|scotch bonnet|habanero|chipotle|red pepper flakes/.test(k)), cheesy: r => r.keys.some(k => /cheese|parmesan|mozzarella|cheddar|feta|ricotta/.test(k)), fresh: r => r.c === "light" || /salad|slaw|ceviche|fresh/i.test(r.n) || r.keys.some(k => /lemon|lime|herb|cucumber|mint/.test(k)) && r.cz <= 7, takeout: r => ["Chinese", "Thai", "Indian", "Korean", "Japanese", "Tex-Mex", "Vietnamese"].includes(r.cu) || /fried rice|lo mein|tikka|burrito|pizza|burger|wings|orange chicken|pad thai|tacos/i.test(r.n), sweet: r => r.c === "treats" };
const dairy = r => r.keys.some(k => /milk|cream|butter|cheese|yogurt|yoghurt|ghee|parmesan|mozzarella/.test(k));
const gluten = r => r.keys.some(k => /flour|bread|pasta|noodle|spaghetti|macaroni|couscous|bulgur|barley|soy sauce|tortilla|pita|panko|breadcrumb|crackers|beer|phyllo|pastry|wheat/.test(k));
let RQ = null;
function affinity() { const cu = {}, mn = {}; const add = (r, w) => { if (!r) return; if (r.cu) cu[r.cu] = (cu[r.cu] || 0) + w; (r.mn || []).forEach(m => mn[m] = (mn[m] || 0) + w); }; S.fav.forEach(id => add(R_(id), 2)); Object.entries(S.hist).forEach(([id, H]) => H.forEach(h => add(R_(+id), h.r >= 4 || h.again === "yes" ? 2 : h.r && h.r <= 2 ? -2 : .5))); Object.entries(S.rating).forEach(([id, v]) => add(R_(+id), v >= 8 ? 1 : v <= 4 ? -1 : 0)); return { cu, mn }; }
function recScore(r, q, af, now) {
  const why = []; let s = 0;
  if (q.mood && !moodOk[q.mood](r)) return null;
  if (q.time && r.t > q.time) return null;
  if (q.effort === "easy" && r.df !== "Easy") return null; if (q.effort === "moderate" && r.df === "Hard") return null;
  if (q.cu && r.cu !== q.cu) return null; if (q.mn && !(r.mn || []).includes(q.mn)) return null;
  if (q.diet === "veg" && !(r.mn || []).includes("veg")) return null; if (q.diet === "dairyfree" && dairy(r)) return null; if (q.diet === "glutenfree" && gluten(r)) return null;
  if (q.eq && missingEq(r).length) return null;
  if (!q.mood && ["treats", "sides"].includes(r.c)) return null;
  const st = stats(r);
  if (q.shop === "none" && st.tier === "almost") return null; if (q.shop === "one" && st.buy.length > 1) return null;
  const H = S.hist[r.id] || [], cooked = isCooked(r.id) || H.length, fav = isFav(r.id);
  if (q.fam === "new" && cooked) return null;
  if (q.fam === "familiar" && !cooked && !fav) s -= 2;
  if (q.mood) { s += 2; why.push(MOODS.find(m => m[0] === q.mood)[1].toLowerCase()); }
  if (st.tier === "ready") { s += 3; why.push("ready with what you have"); } else if (st.tier !== "almost") { s += 2; why.push(st.tier === "subs" ? "ready with a swap" : "only minor ingredients missing"); } else if (st.buy.length === 1) { s += .8; why.push("one essential to buy"); }
  if (fav) { s += 2; why.push("a favorite"); }
  const last = H[H.length - 1]; if (last && last.r >= 4) { s += 1.5; why.push(`you gave it ${last.r}★`); } if (last && last.again === "no") s -= 6;
  const rt = S.rating[r.id]; if (rt >= 8) s += 1; if (rt && rt <= 4) s -= 2;
  if (r.cu && af.cu[r.cu] > 1) { s += Math.min(2, af.cu[r.cu] * .4); if (!fav) why.push(`you enjoy ${r.cu} food`); }
  const m = (r.mn || []).find(x => af.mn[x] > 1); if (m) s += Math.min(1.5, af.mn[m] * .3);
  const rj = S.rej[r.id]; if (rj) s -= Math.max(0, rj.n * 2 - (now - rj.at) / 864e5 / 15);
  const lastLog = (S.log || []).filter(x => x.id === r.id).map(x => x.date).sort().pop(); if (lastLog && daysSince(lastLog) < 7 && !fav) s -= 3;
  if (S.recent.slice(-30).includes(r.id)) s -= 1.5;
  if (r.t <= 30) { s += .4; if (q.time && q.time <= 30) why.push(r.t + " min"); }
  s += ((r.id * 9301 + (q.seed || 0)) % 97) / 400;
  return { r, s, st, why };
}
function recommend(q, n) { const af = affinity(), now = Date.now(); const L = RECIPES.map(r => recScore(r, q, af, now)).filter(Boolean).sort((a, b) => b.s - a.s); const out = [], seen = new Set(); for (const x of L) { const k = (x.r.cu || "") + "|" + (x.r.mn || [])[0]; if (out.length < n && (!seen.has(k) || L.length < n * 4)) { out.push(x); seen.add(k); } if (out.length >= n) break; } return { top: out, all: L }; }
function recCard(x) { const r = x.r; return `<div class="card rec"><div class="mk-top" data-a="open" data-id="${r.id}">${mini(r, 1)}<span class="pn">${esc(r.n)}<small>${r.t} min · ${CATS[r.c].n}${r.cu ? " · " + esc(r.cu) : ""}</small></span></div><div class="tierb t-${x.st.tier}">${TIER[x.st.tier][0]} ${TIER[x.st.tier][1]}</div><div class="mut small why">Why: ${esc(x.why.slice(0, 3).join(" · ") || "a good match")}</div><div class="row g8 wrap"><button class="btn sm" data-a="cook" data-id="${r.id}">👩‍🍳 Cook</button><button class="btn sm ghost" data-a="lRecLike" data-id="${r.id}">More like this</button><button class="btn sm ghost" data-a="lRecNo" data-id="${r.id}">Not this</button></div></div>`; }
function showRec() {
  const q = RQ; const res = recommend(q, 3); q.last = res.top.map(x => x.r.id); S.recent = S.recent.concat(q.last).slice(-60); save();
  const ch = (k, v, l) => `<button class="chip ${q[k] === v ? "on" : ""}" data-a="lRQ" data-k="${k}" data-v="${v}">${l}</button>`;
  sheet(`<div class="d-body" style="padding-top:22px"><h2 class="d-t">Rose, what are we eating?</h2><p class="mut" style="margin-top:-4px">Because your favorite meal is always the next one.</p>
<div class="chips">${MOODS.map(([k, l]) => ch("mood", k, l)).join("")}</div>
<div class="chips">${[[0, "Any time"], [15, "15 min"], [30, "30 min"], [60, "1 hour"]].map(([v, l]) => ch("time", v, l)).join("")}${[["", "Any effort"], ["easy", "Easy"], ["moderate", "Moderate"]].map(([v, l]) => ch("effort", v, l)).join("")}</div>
<details class="gsec2"${q.more ? " open" : ""}><summary>More choices</summary>
<div class="chips">${[["", "Shopping is fine"], ["one", "Buy 1 thing max"], ["none", "No shopping"]].map(([v, l]) => ch("shop", v, l)).join("")}</div>
<div class="chips">${[["", "Anything"], ["familiar", "Something familiar"], ["new", "Something new"]].map(([v, l]) => ch("fam", v, l)).join("")}</div>
<div class="chips">${[["", "No diet filter"], ["veg", "Vegetarian"], ["dairyfree", "Dairy-free*"], ["glutenfree", "Gluten-free*"]].map(([v, l]) => ch("diet", v, l)).join("")}${ch("eq", q.eq ? 0 : 1, "🍳 My equipment only").replace('class="chip "', `class="chip ${q.eq ? "on" : ""}"`)}</div>
<div class="filters"><select class="inp" data-k2="rqcu"><option value="">Any cuisine</option>${[...new Set(RECIPES.map(r => r.cu).filter(Boolean))].sort().map(c => `<option ${q.cu === c ? "selected" : ""}>${esc(c)}</option>`).join("")}</select><select class="inp" data-k2="rqmn"><option value="">Any main ingredient</option>${MAINS.map(([k, n]) => `<option value="${k}" ${q.mn === k ? "selected" : ""}>${n}</option>`).join("")}</select></div>
<label class="mut small">Cooking for <input class="inp" style="width:70px;display:inline-block" type="number" min="1" max="30" value="${q.serv || ""}" placeholder="—" data-k2="rqserv"> people</label>
<p class="mut small">*Best guess from the ingredient list. Always check labels; stock, sauces and spices can contain hidden dairy or gluten.</p></details>
${res.top.length ? res.top.map(recCard).join("") : `<div class="empty">Nothing fits all of that. Loosen a choice above.</div>`}
<div class="row g8 wrap"><button class="btn" data-a="lPick">🎲 Pick for me</button><button class="btn ghost" data-a="lRecShuffle">↻ Shuffle</button></div></div>`, "rec");
}
A.decide = () => { RQ = { seed: Math.floor(Math.random() * 1e4) }; showRec(); };
A.lRQ = el => { const k = el.dataset.k; let v = el.dataset.v; if (["time", "eq"].includes(k)) v = +v; RQ[k] = RQ[k] === v && k !== "eq" ? (k === "time" ? 0 : "") : v; RQ.more = ["shop", "fam", "diet", "eq"].includes(k) || RQ.more; showRec(); };
document.addEventListener("change", e => { const k = e.target.dataset && e.target.dataset.k2; if (!RQ || !k) return; if (k === "rqcu") { RQ.cu = e.target.value; RQ.more = true; showRec(); } else if (k === "rqmn") { RQ.mn = e.target.value; RQ.more = true; showRec(); } else if (k === "rqserv") { RQ.serv = +e.target.value || 0; } });
A.lRecShuffle = () => { RQ.seed = (RQ.seed || 0) + 7919; (RQ.last || []).forEach(id => S.rej[id] = { n: .5 + ((S.rej[id] || {}).n || 0) * .5, at: Date.now() }); showRec(); };
A.lRecNo = el => { const id = +el.dataset.id; S.rej[id] = { n: ((S.rej[id] || {}).n || 0) + 1, at: Date.now() }; save(); toast("Got it, not that one"); showRec(); };
A.lRecLike = el => { const r = R_(+el.dataset.id); RQ.cu = r.cu || ""; RQ.mn = (r.mn || [])[0] || ""; RQ.more = true; S.rej[r.id] = { n: 1, at: Date.now() }; showRec(); };
A.lPick = () => { const res = recommend(RQ || {}, 5); if (!res.top.length) { toast("Nothing fits; loosen a choice"); return; } const x = res.top[Math.floor(Math.random() * Math.min(3, res.top.length))]; if (RQ && RQ.serv) det = { id: x.r.id, s: RQ.serv, tk: false }; openDetail(x.r.id); if (RQ && RQ.serv) { det.s = RQ.serv; rerSheet(); } toast("🎲 Tonight: " + x.r.n); };
A.spin = () => { RQ = { seed: Math.floor(Math.random() * 1e4) }; showRec(); };
/* ================= leftovers ================= */
const LO = [["chicken", "Cooked chicken", /chicken|turkey/, /soup|sandwich|wrap|quesadilla|salad|pasta|fried rice|taco|enchilada|pot pie|casserole|burrito|bowl|noodle|curry/i], ["beef", "Cooked steak or beef", /steak|beef|brisket/, /sandwich|wrap|taco|burrito|salad|fried rice|hash|bowl|quesadilla|noodle/i], ["pork", "Cooked pork", /pork|ham/, /fried rice|sandwich|taco|soup|noodle|bowl|hash/i], ["rice", "Cooked rice", /\brice\b/, /fried rice|pudding|stuffed|bowl|soup|congee|arancini|burrito|casserole/i], ["pasta", "Cooked pasta", /pasta|spaghetti|penne|macaroni|noodle/, /salad|bake|frittata|soup|casserole/i], ["veg", "Roasted or cooked vegetables", /zucchini|pepper|carrot|potato|broccoli|cauliflower|eggplant|squash|vegetable/, /soup|frittata|omelet|bowl|salad|quesadilla|pasta|hash|curry/i], ["beans", "Cooked beans or lentils", /bean|lentil|chickpea/, /soup|salad|taco|burrito|bowl|hummus|chili|stew/i], ["fish", "Cooked fish", /salmon|fish|cod|tuna/, /cake|salad|taco|rice|sandwich/i], ["dish", "A finished dish", /^$/, /^$/]];
const loAge = x => daysSince(x.date);
function loSuggest(x) {
  const t = LO.find(l => l[0] === x.type); if (!t || x.type === "dish" || loAge(x) > 3) return [];
  return RECIPES.filter(r => t[3].test(r.n) && r.keys.some(k => t[2].test(k)) && r.c !== "treats").map(r => ({ r, s: stats(r).pct + (isFav(r.id) ? 20 : 0) + (r.t <= 30 ? 10 : 0) })).sort((a, b) => b.s - a.s).slice(0, 4).map(x => x.r);
}
function loHtml() {
  const L = (S.left || []).slice().sort((a, b) => a.date.localeCompare(b.date));
  return `<div class="h2">🥡 Cooked leftovers <span class="cnt">${L.length}</span></div><p class="mut small">Cooked leftovers keep 3 to 4 days in the fridge (USDA). Day 4 is the limit; after that, throw them out. Reheat to 165°F.</p>${L.map(x => { const a = loAge(x), r = x.id ? R_(x.id) : null, t = LO.find(l => l[0] === x.type); const bad = a >= 4; const sug = loSuggest(x); return `<div class="card small"><div class="row sb"><b>${esc(x.name || (r ? r.n : t ? t[1] : "Leftovers"))}</b><span class="lf ${bad ? "bad" : a >= 3 ? "warn" : "ok"}">${bad ? "Past 4 days: throw out" : a === 3 ? "Use today" : `Good for ${4 - a} more day${4 - a === 1 ? "" : "s"}`}</span></div><div class="mut small">${t ? t[1] : ""} · cooked ${a === 0 ? "today" : a === 1 ? "yesterday" : a + " days ago"}</div>${!bad && sug.length ? `<div class="mut small" style="margin-top:6px">Turn it into: ${sug.map(s => `<button class="link" data-a="lLoUse" data-id="${s.id}" data-t="${x.type}">${esc(s.n)}</button>`).join(" · ")}</div>` : ""}<div class="row g8"><button class="btn sm sage" data-a="leftAte" data-u="${x.uid}">Ate it</button><button class="btn sm ghost" data-a="leftToss" data-u="${x.uid}">Toss</button></div></div>`; }).join("")}
<form class="addf" data-f="lLoAdd"><select class="inp" id="loT">${LO.map(([k, n]) => `<option value="${k}">${n}</option>`).join("")}</select><input class="inp" id="loN" placeholder="What is it? (optional)" maxlength="50"><input class="inp" id="loD" type="date" value="${todayIso()}" style="width:150px"><button class="btn sm">Add</button></form>`;
}
document.addEventListener("submit", e => { if (e.target.dataset.f !== "lLoAdd") return; S.left = S.left || []; S.left.push({ uid: uid(), id: 0, type: $("#loT").value, name: ($("#loN").value || "").trim().slice(0, 50), date: $("#loD").value || todayIso() }); save(); toast("🥡 Leftover saved"); render(true); });
A.lLoUse = el => { openDetail(+el.dataset.id); const t = LO.find(l => l[0] === el.dataset.t); setTimeout(() => toast(`Use your ${t[1].toLowerCase()} in place of the raw ingredient: add it near the end and heat until steaming hot (165°F).`), 300); };
/* ================= pantry inventory ================= */
const LOC = [["fridge", "Fridge"], ["freezer", "Freezer"], ["pantry", "Pantry / shelf"]];
const daysTo = d => d ? Math.round((fromIso(d) - fromIso(todayIso())) / 864e5) : null;
function soonItems() { return S.pantry.map(k => ({ k, e: S.inv[k] || {} })).filter(x => x.e.exp && daysTo(x.e.exp) <= 3).sort((a, b) => a.e.exp.localeCompare(b.e.exp)); }
A.lInv = () => sheet(`<div class="d-body" style="padding-top:22px"><h2 class="d-t">Pantry details</h2><p class="mut small">Optional. Track amounts, dates and where things live only for the items you care about. Dates are your own reminders for quality; check smell, look and how it was stored. A date alone doesn't make food safe or unsafe.</p>
${S.pantry.slice().sort().map(k => { const e = S.inv[k] || {}; const d = daysTo(e.exp); return `<div class="invrow"><button class="pn" data-a="lInvEd" data-k="${esc(k)}"><b>${esc(cap(k))}</b><small>${[e.q ? e.q + (e.u ? " " + e.u : "") : "", e.loc ? LOC.find(l => l[0] === e.loc)[1] : "", e.exp ? (d < 0 ? "date passed" : d === 0 ? "use today" : "use by " + nice(e.exp)) : "", e.low ? "running low" : "", e.staple ? "staple" : ""].filter(Boolean).join(" · ") || "tap to add details"}</small></button>${e.low ? "⚠️" : ""}</div>`; }).join("") || `<p class="mut">Your pantry is empty.</p>`}</div>`, "inv");
A.lInvEd = el => { const k = el.dataset.k, e = S.inv[k] || {}; sheet(`<div class="d-body" style="padding-top:22px"><h2 class="d-t">${esc(cap(k))}</h2><div id="invF" data-k="${esc(k)}"><div class="row g8"><input class="inp" data-i="q" type="number" step="any" placeholder="Amount" value="${e.q || ""}"><input class="inp" data-i="u" placeholder="Unit (cup, lb, g, pcs)" value="${esc(e.u || "")}"></div>
<label>Kept in</label><select class="inp" data-i="loc"><option value="">-</option>${LOC.map(([v, n]) => `<option value="${v}" ${e.loc === v ? "selected" : ""}>${n}</option>`).join("")}</select>
<label>Bought</label><input class="inp" type="date" data-i="bought" value="${e.bought || ""}"><label>Opened</label><input class="inp" type="date" data-i="opened" value="${e.opened || ""}"><label>Use by (your reminder)</label><input class="inp" type="date" data-i="exp" value="${e.exp || ""}">
<label class="toggle"><span>Running low</span><span class="sw"><input type="checkbox" data-i="low" ${e.low ? "checked" : ""}><span></span></span></label><label class="toggle"><span>Household staple</span><span class="sw"><input type="checkbox" data-i="staple" ${e.staple ? "checked" : ""}><span></span></span></label></div>
<button class="btn full" data-a="lInvSave">Save</button><button class="btn ghost full" style="margin-top:8px" data-a="lInv">‹ Back</button></div>`, "inv"); };
A.lInvSave = () => { const f = $("#invF"), k = f.dataset.k, e = {}; f.querySelectorAll("[data-i]").forEach(i => { const v = i.type === "checkbox" ? i.checked : i.value.trim(); if (v) e[i.dataset.i] = i.dataset.i === "q" ? +v : v; }); if (Object.keys(e).length) S.inv[k] = e; else delete S.inv[k]; save(); toast("Saved"); A.lInv(); };
const _vHave = vHave;
vHave = function () { const soon = soonItems(), low = S.pantry.filter(k => (S.inv[k] || {}).low); const often = Object.entries(S.buyCount).sort((a, b) => b[1] - a[1]).map(x => x[0]).filter(k => !inP(k)).slice(0, 8); return `<div class="row g8 wrap" style="margin-bottom:8px"><button class="btn sm ghost" data-a="lInv">📋 Amounts & dates (optional)</button>${low.length ? `<span class="mut small">⚠️ Low: ${low.map(esc).join(", ")}</span>` : ""}</div>${soon.length ? `<div class="card small"><b>⏰ Use soon</b> ${soon.map(x => `<span class="nchip">${esc(x.k)} · ${daysTo(x.e.exp) < 0 ? "date passed" : nice(x.e.exp)}</span>`).join("")}</div>` : ""}${often.length ? `<div class="mut small">Often bought: ${often.map(k => `<button class="chip" data-a="have" data-it="${esc(k)}">＋ ${esc(k)}</button>`).join("")}</div>` : ""}` + _vHave() + loHtml(); };
/* ================= Use What We Have ================= */
function useScores() {
  const soon = new Set(soonItems().map(x => x.k)); const lo = (S.left || []).filter(x => loAge(x) <= 3);
  return RECIPES.filter(r => !["treats"].includes(r.c) || soon.size).map(r => { const st = stats(r); const why = []; let s = 0; const us = r.keys.filter(k => [...soon].some(x => ingMatch(x, k) || x === k)); if (us.length) { s += us.length * 4; why.push("uses " + us.join(", ")); } const lm = lo.filter(x => { const t = LO.find(l => l[0] === x.type); return t && x.type !== "dish" && t[3].test(r.n) && r.keys.some(k => t[2].test(k)); }); if (lm.length) { s += 5; why.push("uses your leftover " + LO.find(l => l[0] === lm[0].type)[1].toLowerCase()); } if (st.tier === "ready") { s += 4; why.push("everything is here"); } else if (st.tier === "subs") { s += 3; why.push("ready with a swap"); } else if (st.tier === "minor") { s += 2.5; why.push("only minor ingredients missing"); } else { s -= st.buy.length * 1.5; why.push(st.buy.length + " to buy: " + st.buy.slice(0, 2).join(", ")); } if (isFav(r.id)) s += 1; return { r, st, s, why }; }).sort((a, b) => b.s - a.s);
}
A.lUse = () => { const soon = soonItems(), lo = (S.left || []).filter(x => loAge(x) <= 3); const L = useScores().slice(0, 8); sheet(`<div class="d-body" style="padding-top:22px"><h2 class="d-t">🧺 Use what we have</h2>${soon.length || lo.length ? `<div class="card small"><b>Use these first</b><div>${soon.map(x => `<span class="nchip">${esc(x.k)} · ${daysTo(x.e.exp) < 0 ? "date passed, check it" : daysTo(x.e.exp) === 0 ? "today" : nice(x.e.exp)}</span>`).join("")}${lo.map(x => `<span class="nchip">🥡 ${esc(x.name || (LO.find(l => l[0] === x.type) || [0, "leftovers"])[1])} · day ${loAge(x)}</span>`).join("")}</div><p class="mut small">Dates are quality reminders you set. They don't prove food is safe or unsafe.</p></div>` : `<p class="mut">Add use-by reminders in My Kitchen → Amounts & dates, or log leftovers, and they'll be prioritized here.</p>`}
${L.map(x => `<div class="card rec"><div class="mk-top" data-a="open" data-id="${x.r.id}">${mini(x.r, 1)}<span class="pn">${esc(x.r.n)}<small>${x.r.t} min</small></span></div><div class="tierb t-${x.st.tier}">${TIER[x.st.tier][0]} ${TIER[x.st.tier][1]}</div><div class="mut small">Why: ${esc(x.why.join(" · "))}</div>${whatNeed(x.st)}</div>`).join("")}</div>`, "use"); };
A.pantryMake = () => A.lUse();
/* ================= groceries: deductions, units, aisle order, confirm to pantry ================= */
const VOLT = { tsp: 1, tbsp: 3, cup: 48, ml: 1 / 4.929, l: 1000 / 4.929 }, WT = { oz: 1, lb: 16, g: 1 / 28.35, kg: 1000 / 28.35 };
function invHave(key) { const e = S.inv[key]; if (!e || !e.q) return null; const u = (UNITW[(e.u || "").toLowerCase()] || (e.u || "").toLowerCase()); if (VOLT[u]) return { v: e.q * VOLT[u] }; if (WT[u]) return { w: e.q * WT[u] }; if (!u || /pc|piece|each|count/.test(u)) return { n: e.q }; return null; }
amtText = function (e) {
  const parts = []; let v = e.v + (e.m ? e.m / 4.929 : 0), w = e.w + (e.g ? e.g / 28.35 : 0); const h = invHave(e.key);
  let note = "";
  if (h && h.v != null && v) { const need = v - h.v; note = need <= 0 ? " (pantry has enough)" : ` (have ${fmtQ(h.v / 48)} cup)`; v = Math.max(0, need); }
  if (h && h.w != null && w) { const need = w - h.w; note = need <= 0 ? " (pantry has enough)" : ` (have ${h.w >= 16 ? fmtQ(h.w / 16) + " lb" : fmtQ(h.w) + " oz"})`; w = Math.max(0, need); }
  if (v) parts.push(v >= 12 ? fmtQ(v / 48) + " " + uL("cup", v / 48) : v >= 3 ? fmtQ(v / 3) + " tbsp" : fmtQ(v) + " tsp");
  if (w) parts.push(w >= 16 ? fmtQ(w / 16) + " lb" : fmtQ(w) + " oz");
  for (const [u, q] of Object.entries(e.o)) { let qq = q; if (h && h.n != null && !u) { const need = q - h.n; note = need <= 0 ? " (pantry has enough)" : ` (have ${h.n})`; qq = Math.max(0, need); } if (qq) parts.push((fmtQ(qq) + " " + uL(u, qq)).trim()); }
  let s = parts.join(" + "); if (e.taste) s += s ? " (+ to taste)" : "to taste"; return (s || "none needed") + note;
};
const AISLE0 = AISLES.slice();
function applyAisleOrder() { if (!S.aisleOrder.length) return; AISLES.sort((a, b) => { const ia = S.aisleOrder.indexOf(a[0]), ib = S.aisleOrder.indexOf(b[0]); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib); }); }
applyAisleOrder();
A.lAisles = () => { const L = AISLES.map(a => a); sheet(`<div class="d-body" style="padding-top:22px"><h2 class="d-t">Store aisle order</h2><p class="mut small">Arrange sections in the order you walk your store.</p>${L.map((a, i) => `<div class="pe"><span class="pn">${a[1]}</span><button class="x" data-a="lAisleMv" data-i="${i}" data-v="-1" aria-label="Move up">↑</button><button class="x" data-a="lAisleMv" data-i="${i}" data-v="1" aria-label="Move down">↓</button></div>`).join("")}<button class="btn ghost full" data-a="lAisleReset">Reset to default</button></div>`, "aisle"); };
A.lAisleMv = el => { const i = +el.dataset.i, j = i + +el.dataset.v; if (j < 0 || j >= AISLES.length) return; [AISLES[i], AISLES[j]] = [AISLES[j], AISLES[i]]; S.aisleOrder = AISLES.map(a => a[0]); save(); A.lAisles(); };
A.lAisleReset = () => { S.aisleOrder = []; AISLES.splice(0, AISLES.length, ...AISLE0); save(); A.lAisles(); };
A.toPantry = () => { const c = chk(); const ks = Object.keys(c).filter(k => c[k]); const xs = S.extras.filter(x => x.done).map(x => x.name.toLowerCase()); const all = [...new Set(ks.concat(xs))]; if (!all.length) { toast("Check items off first"); return; } sheet(`<div class="d-body" style="padding-top:22px"><h2 class="d-t">Add purchases to the pantry?</h2><p class="mut small">Untick anything you didn't buy. Nothing changes until you confirm.</p>${all.map(k => `<label class="toggle"><span>${esc(cap(k))}</span><span class="sw"><input type="checkbox" class="tpk" value="${esc(k)}" checked><span></span></span></label>`).join("")}<button class="btn full big" data-a="lToPantryYes">Add to pantry</button></div>`, "tp"); };
A.lToPantryYes = () => { const ks = [...document.querySelectorAll(".tpk")].filter(i => i.checked).map(i => i.value); ks.forEach(k => { if (!inP(k)) S.pantry.push(k); S.buyCount[k] = (S.buyCount[k] || 0) + 1; const e = S.inv[k]; if (e) { e.bought = todayIso(); delete e.low; } }); delete S.checked[S.week]; S.extras = S.extras.filter(x => !x.done); save(); closeSheet(); toast(`${ks.length} item${ks.length === 1 ? "" : "s"} added to the pantry 🧺`); render(true); };
const _groc = V.groceries;
V.groceries = function () { let h = _groc(); const low = S.pantry.filter(k => (S.inv[k] || {}).low && !S.extras.some(x => x.name.toLowerCase() === k)); const add = `<div class="row g8 wrap" style="margin:6px 0"><button class="btn sm ghost" data-a="lAisles">↕ Aisle order</button>${low.length ? low.map(k => `<button class="chip" data-a="staple" data-v="${esc(cap(k))}">⚠️ ＋ ${esc(k)} (low)</button>`).join("") : ""}</div>`; const i = h.indexOf('<div class="chips" style="padding-top:0">'); return i >= 0 ? h.slice(0, i) + add + h.slice(i) : h + add; };
/* ================= meal prep ================= */
const PREPRX = /(diced|chopped|minced|sliced|grated|shredded|cubed|julienned|peeled|crushed|cut)/i;
function prepPlan() {
  const t = todayIso(); const days = weekDates(S.week).filter(d => d >= t); const ent = days.flatMap(d => (S.plan[d] || []).filter(e => !e.lo).map(e => ({ ...e, date: d }))).filter(e => R_(e.id));
  const by = {};
  ent.forEach(e => { const r = R_(e.id), f = e.s / r.s; r.i.forEach(g => { const m = (g.note || "").match(PREPRX); if (!m || SKIP.has(g.item)) return; const k = g.item + "|" + m[1].toLowerCase(); (by[k] = by[k] || { item: g.item, how: m[1].toLowerCase(), uses: [], q: 0, u: g.u, mixed: false }); const b = by[k]; if (g.q != null) { if (b.u === g.u) b.q += g.q * f; else b.mixed = true; } b.uses.push({ n: r.n, d: e.date }); }); });
  const tasks = Object.values(by).filter(b => b.uses.length >= 1).sort((a, b) => b.uses.length - a.uses.length);
  const ahead = ent.map(e => ({ e, g: G(e.id) })).filter(x => x.g && x.g.store && x.g.store.ahead && !/fresh/i.test(x.g.store.ahead));
  return { ent, tasks, ahead };
}
A.lPrep = () => { const P = prepPlan(); const t = todayIso(); const far = d => daysTo(d) > 3;
  sheet(`<div class="d-body" style="padding-top:22px"><h2 class="d-t">🔪 Prep plan</h2>${!P.ent.length ? `<p class="mut">Plan some meals for the rest of this week first.</p>` : `<p class="mut small">Grouped so you chop once. Cut vegetables are best within 3 days; marinate raw meat no longer than 2 days; keep everything in covered containers in the fridge.</p>
${P.tasks.map(b => { const soon = b.uses.filter(u => !far(u.d)), later = b.uses.filter(u => far(u.d)); return `<div class="tlrow"><div><b>${esc(cap(b.how))} ${b.q && !b.mixed ? fmtQ(b.q) + " " + uL(b.u, b.q) + " " : ""}${esc(b.item)}</b><div class="mut small">for ${soon.map(u => esc(u.n) + " (" + DAYS[weekDates(S.week).indexOf(u.d)].slice(0, 3) + ")").join(", ")}${later.length ? `<br>⏳ Prep closer to the day for ${later.map(u => esc(u.n)).join(", ")}` : ""}</div></div></div>`; }).join("")}
${P.ahead.length ? `<h3>Make ahead</h3>${P.ahead.map(x => `<div class="tlrow"><div><b>${esc(R_(x.e.id).n)}</b> <span class="mut small">(${DAYS[weekDates(S.week).indexOf(x.e.date)].slice(0, 3)})</span><div>${esc(x.g.store.ahead)}</div></div></div>`).join("")}` : ""}`}</div>`, "prep"); };
/* ================= planner additions ================= */
A.lCopyWeek = () => { const prev = iso(addDays(fromIso(S.week), -7)); const pd = weekDates(prev), cd = weekDates(S.week); let n = 0; pd.forEach((d, i) => (S.plan[d] || []).forEach(e => { S.plan[cd[i]] = S.plan[cd[i]] || []; S.plan[cd[i]].push({ ...e, uid: uid() }); n++; })); save(); toast(n ? `Copied ${n} meal${n > 1 ? "s" : ""} from last week` : "Last week was empty"); render(true); };
A.lLeftNext = el => { const d = el.dataset.date, e = (S.plan[d] || []).find(x => x.uid === el.dataset.u); if (!e) return; const nd = iso(addDays(fromIso(d), 1)); S.plan[nd] = S.plan[nd] || []; S.plan[nd].push({ uid: uid(), id: e.id, s: e.s, m: "L", lo: 1 }); save(); toast("🥡 Leftovers planned for tomorrow's lunch (not added to groceries)"); render(true); };
A.lRepeat = el => { const d = el.dataset.date, e = (S.plan[d] || []).find(x => x.uid === el.dataset.u); if (!e) return; const nd = iso(addDays(fromIso(d), 7)); S.plan[nd] = S.plan[nd] || []; S.plan[nd].push({ ...e, uid: uid(), lo: 0 }); save(); toast("↻ Repeated next week"); render(true); };
const _plan = V.plan;
V.plan = function () { let h = _plan(); h = h.replace(/(<button class="x" data-a="peEdit" data-date="([^"]+)" data-u="([^"]+)"[^>]*>✎<\/button>)/g, (m, b, d, u) => `<button class="x" data-a="lLeftNext" data-date="${d}" data-u="${u}" aria-label="Plan leftovers tomorrow" title="Leftovers tomorrow">🥡</button><button class="x" data-a="lRepeat" data-date="${d}" data-u="${u}" aria-label="Repeat next week" title="Repeat next week">↻</button>` + b); const i = h.indexOf('<div class="card"><div class="weeknav">'); const add = `<div class="row g8 wrap" style="margin-bottom:8px"><button class="btn sm ghost" data-a="lCopyWeek">⧉ Copy last week</button><button class="btn sm ghost" data-a="lPrep">🔪 Prep plan</button></div>`; return i >= 0 ? h.slice(0, i) + add + h.slice(i) : h; };
/* ================= equipment profile (settings + My Kitchen) ================= */
function equipCard() { return `<div class="card small" id="eqCard"><b>🍳 Our kitchen equipment</b><p class="mut" style="margin:4px 0 8px">Used for recipe filters, recommendations and cooking timelines.</p><div class="chips">${EQ.map(([k, n]) => `<button class="chip ${S.equip[k] ? "on" : ""}" data-a="lEq" data-k="${k}">${S.equip[k] ? "✓ " : ""}${n}</button>`).join("")}</div><div class="row g8" style="align-items:center"><span>Stove burners</span><div class="stepper"><button data-a="lBurn" data-v="-1">−</button><span>${S.equip.burners}</span><button data-a="lBurn" data-v="1">＋</button></div></div></div>`; }
A.lEq = el => { const k = el.dataset.k; S.equip[k] = S.equip[k] ? 0 : 1; save(); const c = $("#eqCard"); if (c) c.outerHTML = equipCard(); };
A.lBurn = el => { S.equip.burners = Math.max(1, Math.min(8, S.equip.burners + +el.dataset.v)); save(); const c = $("#eqCard"); if (c) c.outerHTML = equipCard(); };
const _settings2 = settings;
settings = function () { _settings2(); const box = $("#sheetIn .d-body"); if (box) { const d = document.createElement("div"); d.innerHTML = dataCard() + equipCard(); box.insertBefore(d, box.children[2] || null); storageInfo().then(t => { const x = $("#lStore"); if (x) x.innerHTML = t; }); } };
A.settings = () => settings();
/* ================= recipe detail additions ================= */
function eqNote(r) { const need = reqEq(r); if (!need.length) return ""; const miss = missingEq(r); return `<div class="mut small eqn">🍳 Uses: ${need.map(k => EQ.find(e => e[0] === k)[1]).join(", ")}${miss.length ? `<div class="warn">${miss.map(k => EQALT[k]).join(" ")}</div>` : ""}</div>`; }
function varHtml(r) { const V = typeof VARS !== "undefined" && VARS[r.isVer ? r.vbase : r.id]; if (!V || !V.length) return ""; return `<details class="gsec2"><summary>🔀 Variations</summary>${V.map(v => `<div class="var"><b>${esc(v.t)}</b><ul>${(v.c || []).map(c => `<li>${esc(c)}</li>`).join("")}</ul>${v.n ? `<p class="mut">${esc(v.n)}</p>` : ""}${v.a ? `<p class="warn small">⚠ ${esc(v.a)}</p>` : ""}</div>`).join("")}<p class="ainote">Variations are AI-generated suggestions. Swapping an ingredient doesn't make a dish allergen-free; check every label.</p></details>`; }
function nutHtml(r) { const N = typeof NUTR !== "undefined" && NUTR[r.isVer ? r.vbase : r.id]; const head = `<details class="gsec2"><summary>📊 Nutrition estimate</summary>`; if (r.isVer || r.mine) return ""; if (!N) return head + `<p class="mut">Unavailable for this recipe.</p></details>`; if (N.cov < .9) return head + `<p class="mut">Unavailable: ${Math.round((1 - N.cov) * 100)}% of the ingredients couldn't be matched reliably to USDA data, so an estimate would be misleading.</p></details>`; const f = det && det.id === r.id ? 1 : 1; return head + `<table class="nut"><tr><td>Calories</td><td>${Math.round(N.kcal)}</td></tr><tr><td>Protein</td><td>${Math.round(N.p)} g</td></tr><tr><td>Carbohydrates</td><td>${Math.round(N.c)} g</td></tr><tr><td>Fat</td><td>${Math.round(N.f)} g</td></tr><tr><td>Fiber</td><td>${Math.round(N.fb)} g</td></tr><tr><td>Sugar</td><td>${N.su == null ? "n/a" : Math.round(N.su) + " g"}</td></tr><tr><td>Sodium</td><td>${N.na == null ? "unavailable" : Math.round(N.na) + " mg" + (N.naTaste ? " + salt to taste" : "")}</td></tr></table><p class="mut small">Per serving (recipe makes ${r.s}). Estimated from USDA FoodData Central SR Legacy values for ${Math.round(N.cov * 100)}% of ingredients; not a verified label. <a href="docs/NUTRITION.md" target="_blank" rel="noopener">How this is calculated</a>.</p></details>`; }
const _dDetail2 = dDetail;
dDetail = function () {
  let h = _dDetail2(); const r = R_(det.id);
  h = h.replace('<div class="ktools">', verBar(r) + '<div class="ktools">');
  h = h.replace('<div class="ktools">', `<div class="ktools"><button class="btn sm ghost" data-a="lColAdd" data-id="${r.id}">🗂 Save to…</button>`);
  h = h.replace('<div class="sec-h"><h3>Ingredients</h3>', () => histCard(r) + eqNote(r) + '<div class="sec-h"><h3>Ingredients</h3>');
  h = h.replace("<h3>Our rating</h3>", () => varHtml(r) + nutHtml(r) + "<h3>Our rating</h3>");
  setTimeout(fillHistPhotos, 0);
  return h;
};
/* ================= timeline: configurable equipment ================= */
const _schedule = schedule;
schedule = function (ids, serveAt) {
  const s = _schedule(ids, serveAt); const cap = Math.max(1, S.equip.burners || 4);
  /* burner capacity: push stove tasks earlier (with their predecessors) when too many overlap */
  for (let pass = 0; pass < 6; pass++) {
    let moved = false; const st = s.tasks.filter(t => t.stove);
    for (const t of st) { const over = st.filter(o => o !== t && o.start < t.end && t.start < o.end).length + 1; if (over > cap) { const sh = (t.end - Math.max(...st.filter(o => o !== t && o.start < t.end && t.start < o.end).map(o => o.start))) || 6e4; s.tasks.filter(x => x.rid === t.rid && x.start <= t.start).forEach(x => { x.start -= sh; x.end -= sh; }); moved = true; break; } }
    if (!moved) break;
  }
  s.tasks.sort((a, b) => a.start - b.start); s.start = s.tasks.length ? s.tasks[0].start : serveAt;
  s.noOven = !S.equip.oven && s.tasks.some(t => t.oven);
  return s;
};
const _validSchedule = validSchedule;
validSchedule = function (s) { if (!_validSchedule(s)) return false; const cap = Math.max(1, S.equip.burners || 4); const st = s.tasks.filter(t => t.stove); for (const t of st) if (st.filter(o => o.start < t.end && t.start < o.end).length > cap) return false; return true; };
/* ================= navigation: six destinations ================= */
TABS.splice(0, TABS.length, ["home", "🏠", "For You"], ["recipes", "📖", "Cookbook"], ["pantry", "🧺", "Kitchen"], ["plan", "🗓️", "Plan"], ["groceries", "🛒", "Shop"], ["cook", "👩‍🍳", "Cook"]);
V.cook = function () {
  const ss = S.cookSess, r = ss && R_(ss.id), t = todayIso(), today = (S.plan[t] || []).map(e => R_(e.id)).filter(Boolean);
  return `<h1 class="h1">Cooking</h1>
${r ? `<section class="card resume"><b>👩‍🍳 ${esc(r.n)}</b><div class="mut small">Step ${ss.i + 1 > 0 ? ss.i + 1 : "ingredients"} of ${r.st.length}</div><button class="btn sm" data-a="kResume">Resume cooking</button></section>` : ""}
${S.timeline ? `<section class="card"><b>⏱ Tonight's plan</b><div class="mut small">Eat at ${hhmm(S.timeline.serveAt)}</div><button class="btn sm" data-a="kTLOpen">Open plan</button></section>` : ""}
${today.length ? `<div class="h2">On today's plan</div>${today.map(x => `<div class="pe">${mini(x)}<span class="pn">${esc(x.n)}<small>${x.t} min</small></span><button class="btn sm" data-a="cook" data-id="${x.id}">Cook</button></div>`).join("")}` : ""}
<div class="qa"><button class="qt" data-a="timers"><span>⏱</span>Timers${(S.timers || []).length ? ` (${S.timers.length})` : ""}</button><button class="qt" data-a="kHelp"><span>🆘</span>Kitchen help</button><button class="qt" data-a="lTechAll"><span>🔪</span>Techniques</button><button class="qt" data-a="lPrep"><span>🥣</span>Prep plan</button></div>
<p class="mut small">Pick any recipe and tap "Start cooking" for step-by-step mode with timers, swaps and read-aloud.</p>`;
};
A.lTechAll = () => sheet(`<div class="d-body" style="padding-top:22px"><h2 class="d-t">🔪 Technique guide</h2>${Object.values(TECH).map(t => `<details class="help"><summary>${t[0]}</summary><p>${t[1]}</p><p class="mut"><b>Common mistake:</b> ${t[2]}</p></details>`).join("")}</div>`, "tech");
/* For You dashboard */
const _home2 = V.home;
V.home = function () {
  let h = _home2();
  const M = RECIPES.map(stats); const ready = M.filter(m => m.tier === "ready" || m.tier === "minor" || m.tier === "subs").length; const soon = soonItems().length + (S.left || []).filter(x => loAge(x) <= 3).length;
  const recs = recommend({ seed: Math.floor(Date.now() / 864e5) }, 2).top;
  const dash = `<section class="dash"><div class="dash-q"><button class="chip" data-a="lDQ" data-m="cozy">Something cozy</button><button class="chip" data-a="lDQ" data-m="quick">Quick and easy</button><button class="chip" data-a="lUse">Use what we have</button><button class="chip" data-a="lPick">Surprise me</button></div>
<div class="kstats"><div class="stat" data-a="lUse"><b>${ready}</b><span>ready to cook</span></div><div class="stat" data-a="lUse"><b>${soon}</b><span>use soon</span></div><div class="stat" data-a="go" data-t="groceries"><b>${gCount()}</b><span>shopping items</span></div></div>
${recs.length ? `<div class="h2">Recommended for you</div>${recs.map(recCard).join("")}` : ""}${!S.prefs.lastBackup && (Object.keys(S.hist).length || Object.keys(S.ver).length) ? `<div class="card small">🛟 You have personal notes now. <button class="link" data-a="settings">Export a backup</button> so they're safe.</div>` : ""}</section>`;
  h = h.replace(/<div class="qa">[\s\S]*?<\/div>\s*/, () => dash);
  return h;
};
A.lDQ = el => { RQ = { seed: Math.floor(Math.random() * 1e4) }; if (el.dataset.m === "cozy") RQ.mood = "cozy"; else { RQ.time = 30; RQ.effort = "easy"; } showRec(); };
A.lPick0 = A.lPick; A.lPick = () => { if (!RQ) RQ = { seed: Math.floor(Math.random() * 1e4) }; A.lPick0(); };
if (!TABS.some(t => t[0] === tab)) tab = "home";
render(true);
/* ================= high-risk recipes ================= */
function riskHtml(r) {
  const k = r.isVer ? r.vbase : r.id; const x = typeof RISK !== "undefined" && RISK[k]; if (!x) return "";
  const head = x.status === "checked" ? "✅ High-risk method checked against food-safety guidance" : x.status === "flagged" ? "⛔ Not verified for safety" : "⚠ High-risk preparation";
  return `<div class="risk ${x.status}"><b>${head}</b>${x.note ? `<p>${esc(x.note)}</p>` : ""}${x.msg.map(m => `<p>${esc(m)}</p>`).join("")}<p class="small">Reference: ${x.ref.map(([t, u]) => `<a href="${u}" target="_blank" rel="noopener">${esc(t)}</a>`).join("; ")}. This recipe's text is AI-assisted and has not been reviewed by a food-safety professional.</p></div>`;
}
const _dDetail3 = dDetail;
dDetail = function () { let h = _dDetail3(); const r = R_(det.id); const rk = riskHtml(r); if (rk) h = h.replace('<div class="sec-h"><h3>Ingredients</h3>', () => rk + '<div class="sec-h"><h3>Ingredients</h3>'); return h; };
