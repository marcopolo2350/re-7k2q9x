/* Milestone closure: interrupted-restore recovery, high-risk restrictions, shared-protein prep,
   diet-estimate labels, edible-portion handling. Loaded after life2.js. */
"use strict";
/* ---------- restore that survives being killed half-way ---------- */
const RKEY = KEY + ".restore-pending";
A.lImpYes = async () => {
  const v = pendingImport; if (!v) return;
  const id = "imp-" + Date.now().toString(36);
  try { localStorage.setItem(KEY + ".before-import", JSON.stringify({ at: Date.now(), state: S })); localStorage.setItem(RKEY, JSON.stringify({ id, at: Date.now() })); }
  catch (e) { toast("Not enough space to keep an undo copy. Export a backup first."); return; }
  try { for (const [k, d] of Object.entries(v.photos)) await IDB.put(k, d); } catch (e) {}
  const ns = migrate(Object.assign(fresh(), v.st)); ns.importId = id;
  try { localStorage.setItem(KEY, JSON.stringify(ns)); } catch (e) { try { localStorage.removeItem(RKEY); } catch (e2) {} toast("Import failed: not enough storage. Nothing was changed."); return; }
  try { localStorage.removeItem(RKEY); } catch (e) {}
  S = ns; pendingImport = null; syncMine(); closeSheet(); toast("Backup restored ♡"); render();
};
function checkInterruptedRestore() {
  let m = null; try { m = JSON.parse(localStorage.getItem(RKEY) || "null"); } catch (e) {}
  if (!m) return null;
  if (S.importId === m.id) { localStorage.removeItem(RKEY); return "completed"; }
  return "interrupted";
}
const RESTORE_STATE = checkInterruptedRestore();
if (RESTORE_STATE === "interrupted") setTimeout(() => sheet(`<div class="d-body" style="padding-top:22px"><h2 class="d-t">A restore was interrupted</h2><p>The app closed before the backup finished loading. <b>Your previous data is still here, unchanged.</b> Photos from the backup may already have been added; nothing was removed.</p><button class="btn full" data-a="lImportFile">Try the restore again</button><button class="btn ghost full" style="margin-top:8px" data-a="lRestoreDismiss">Keep my current data</button></div>`, "restore"), 600);
A.lRestoreDismiss = () => { try { localStorage.removeItem(RKEY); } catch (e) {} closeSheet(); };
/* ---------- unverified high-risk procedures are restricted ---------- */
const riskRestricted = r => { const x = typeof RISK !== "undefined" && RISK[r.isVer ? r.vbase : r.id]; return !!(x && x.status === "flagged"); };
const _openCook2 = openCook;
openCook = function (id, serv) {
  const r = R_(id);
  if (r && riskRestricted(r)) { sheet(`<div class="d-body" style="padding-top:22px"><h2 class="d-t">Cooking mode is off for this recipe</h2><p>${esc(r.n)} uses a curing or fermentation method that hasn't been validated against a tested source, so the app won't guide you through it step by step.</p>${(RISK[r.id].ref || []).map(([t, u]) => `<p><a href="${u}" target="_blank" rel="noopener">${esc(t)}</a></p>`).join("")}<p class="mut small">The original recipe text is kept for reference on the recipe page.</p></div>`, "risk"); return; }
  _openCook2(id, serv);
};
const _dDetail4 = dDetail;
dDetail = function () {
  let h = _dDetail4(); const r = R_(det.id); if (!riskRestricted(r)) return h;
  h = h.replace(/<button class="btn full big rose"[^>]*data-a="cook"[^>]*>[^<]*<\/button>/, `<div class="risk flagged"><b>⛔ Step-by-step cooking is turned off</b><p>This method isn't validated for safety. The recipe text below is kept for reference only.</p></div>`);
  h = h.replace(/<h3>Directions<\/h3>(<ol class="steps">[\s\S]*?<\/ol>)/, (m, ol) => `<h3>Directions</h3><details class="gsec2"><summary>Show the unverified steps (reference only)</summary>${ol}</details>`);
  return h;
};
const _recScore = recScore; recScore = function (r, q, af, now) { return riskRestricted(r) ? null : _recScore(r, q, af, now); };
const _mealRank = mealRank; mealRank = function (m, course) { return _mealRank(m, course).filter(id => !riskRestricted(R_(id))); };
/* ---------- diet filters are ingredient-based estimates ---------- */
const _recScore2 = recScore; recScore = function (r, q, af, now) { const x = _recScore2(r, q, af, now); if (x && q.diet) x.why.unshift({ veg: "vegetarian by ingredient list (not verified)", dairyfree: "no dairy in the ingredient list (not verified; check labels)", glutenfree: "no obvious gluten in the ingredient list (not verified; check labels)" }[q.diet]); return x; };
/* ---------- shared-protein preparation ---------- */
const PROT = /chicken|turkey|beef|steak|pork|lamb|sausage|shrimp|salmon|fish|ground meat|mince/;
const METHOD = [["roast", /\broast|\bbake/i], ["poach", /\bpoach|\bboil/i], ["grill", /\bgrill|broil/i], ["brown", /\bbrown|\bsear|\bfry|saut/i]];
function proteinPrep(ent) {
  const out = {};
  for (const e of ent) {
    const r = R_(e.id); if (!r || riskRestricted(r)) continue; const f = e.s / r.s;
    r.i.forEach((g, k) => {
      if (!PROT.test(g.item) || r.ilv[k] === "O" || /cooked|leftover|rotisserie|canned/.test(g.item + " " + g.note)) return;
      const step = r.st.find(s => new RegExp("\\b" + g.item.split(" ").pop().replace(/s$/, "") + "s?\\b", "i").test(s)) || "";
      const mth = (METHOD.find(([, rx]) => rx.test(step)) || [null])[0]; if (!mth) return;
      if (/marinat|rub|coat|bread|batter|stuff/i.test(step)) return; /* recipe-specific seasoning before cooking: don't combine */
      const key = g.item + "|" + mth; (out[key] = out[key] || { item: g.item, mth, uses: [], q: 0, u: g.u, mixed: false });
      const o = out[key]; if (g.q != null && o.u === g.u) o.q += g.q * f; else o.mixed = true; o.uses.push({ n: r.n, d: e.date });
    });
  }
  return Object.values(out).filter(o => o.uses.length >= 2 && new Set(o.uses.map(u => u.n)).size >= 2).map(o => { const days = o.uses.map(u => daysTo(u.d)); o.ok = Math.max(...days) - Math.min(...days) <= 3; return o; });
}
const _prepPlan = prepPlan; prepPlan = function () { const P = _prepPlan(); P.prot = proteinPrep(P.ent); return P; };
const _lPrep = A.lPrep;
A.lPrep = () => { _lPrep(); const P = prepPlan(); if (!P.prot.length) return; const box = $("#sheetIn .d-body"); if (!box) return; box.insertAdjacentHTML("beforeend", `<h3>Cook shared proteins once</h3>${P.prot.map(o => `<div class="tlrow"><div><b>${o.ok ? "" : "⏳ "}${esc(cap(o.mth))} ${o.q && !o.mixed ? fmtQ(o.q) + " " + uL(o.u, o.q) + " " : ""}${esc(o.item)} together</b><div class="mut small">for ${o.uses.map(u => esc(u.n)).join(", ")}. ${o.ok ? "Season plainly; add each recipe's sauce and spices later. Cool within 2 hours, refrigerate, and use within 3 to 4 days (USDA)." : "These meals are more than 3 days apart, so cook separately: cooked meat keeps 3 to 4 days in the fridge."}</div></div></div>`).join("")}<p class="mut small">Only recipes that cook the same protein the same plain way are grouped. Marinated, breaded or stuffed proteins are never combined.</p>`); };
/* ---------- nutrition: edible portion for bone-in cuts ---------- */
const BONE = [[/whole chicken|whole bird/, .65], [/oxtail/, .45], [/trotter|pig.?s feet|cow feet/, .3], [/shank/, .55], [/short ribs|spare ?ribs|baby back|\bribs\b/, .6], [/wings?\b/, .6], [/drumstick/, .7], [/thigh/, .75], [/bone-in|on the bone|with bone/, .7], [/chop/, .8]];
const _nutGrams = nutGrams;
nutGrams = function (g, m) { const gr = _nutGrams(g, m); if (gr == null) return gr; const t = (g.item + " " + (g.note || "")).toLowerCase(); if (/boneless|fillet|ground|mince/.test(t)) return gr; if (!/bone|whole chicken|oxtail|trotter|shank|ribs|wing|drumstick|thigh|chop/.test(t)) return gr; const NU = typeof NUT_W !== "undefined" ? NUT_W : {}; if (!NU[(g.u || "").toLowerCase()] && g.u) return gr; const b = BONE.find(([rx]) => rx.test(t)); return b ? gr * b[1] : gr; };
render(true);
