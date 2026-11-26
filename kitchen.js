/* Rose's EATS kitchen assistant. Loaded after app.js and reuses its globals.
   Sections: chef data v2, guidance + Help, personal chef notes, scaling, offline,
   cooking mode, timers, meal builder, cooking timeline. */
"use strict";
/* ---------- chef data v2: importance and substitutability are separate ---------- */
LVR.U = 3;
const LV2 = { E: "Essential", R: "Recommended", O: "Optional", U: "Not rated" };
const ROLE = { P: "main protein", B: "base / starch", V: "vegetable or fruit", S: "structure", L: "leavening", T: "thickener / binder", M: "liquid", F: "fat / richness", A: "acid", W: "sweetener", X: "flavor / aromatic", Z: "seasoning", G: "garnish / topping", K: "preservation / cure", C: "color" };
const GUIDE_OK = () => typeof GUIDE !== "undefined";
const G = id => (GUIDE_OK() && GUIDE[id]) || null;
function kImp(r) {
  r.ilv = r.i.map((g, k) => { const L = (r.ilv && r.ilv[k]) || "U"; return L === "S" ? "E" : L; });
  r.imp = {};
  r.i.forEach((g, k) => { if (SKIP.has(g.item)) return; const L = r.ilv[k], p = r.imp[g.item]; if (p == null || LVR[L] > LVR[p]) r.imp[g.item] = L; });
}
BASE.forEach(kImp);
/* personal recipes: notes stored per ingredient line, so edits and reordering keep them */
const _mineToR = mineToR;
mineToR = function (m) {
  const r = _mineToR(m); r.mine = true;
  const c = m.chef || {}, E = c.ing || {};
  const lines = (m.ing || []).filter(x => x.trim());
  const rated = lines.some(l => E[l] && E[l].L);
  r.ilv = r.i.map((g, k) => (E[lines[k]] && E[lines[k]].L) || "U");
  const w = {}, sub = {};
  r.i.forEach((g, k) => { const e = E[lines[k]]; if (!e) return; if (e.w) w[k] = e.w; if (e.x) sub[k] = { x: e.x, d: e.d || "", k: (e.k || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean) }; });
  const tips = (c.tips || []).filter(Boolean).map(t => ({ t, s: -1 }));
  r.cf = (rated || tips.length || Object.keys(sub).length) ? { lv: r.ilv.join(""), w, sub, tips, mine: true } : null;
  kImp(r); return r;
};
syncMine();
ingRow = function (r, g, k, f) {
  const L = r.ilv[k] || "U", cf = r.cf, w = cf && cf.w && cf.w[k], sb = cf && cf.sub && cf.sub[k], role = cf && cf.rl && cf.rl[k], has = inP(g.item);
  const chips = `<span class="lv lv${L}">${LV2[L]}</span>${sb ? `<span class="lv lvS">Swap OK</span>` : ""}`;
  let more = "";
  if (w || sb || role) {
    const sum = L === "O" ? "Don't make a special trip" : sb ? (L === "E" ? "Needed, but you can swap it" : "Easy substitution") : "Why it matters";
    more = `<details class="why"><summary>${sum}</summary>${role ? `<p><b>Role:</b> ${ROLE[role] || ""}</p>` : ""}`
      + (L === "E" ? `<p><b>Leave it out?</b> No, the dish depends on it${sb ? ", but the swap below works" : ""}.</p>` : "")
      + (w ? `<p><b>${L === "E" ? "Why" : "If you skip it"}:</b> ${esc(w)}</p>` : "")
      + (sb ? `<p class="sbx"><b>Swap:</b> ${scaleText(sb.x, f)}${sb.d ? `<br><span class="mut">${esc(sb.d)}</span>` : ""}${sb.wn ? `<br><span class="warn">⚠ ${esc(sb.wn)}</span>` : ""}</p>` : "")
      + `</details>`;
  }
  return `<li><div class="ir"><span class="q">${esc(ingText(g, f))} ${chips}</span><button class="have-b ${has ? "on" : ""}" data-a="have" data-it="${esc(g.item)}">${has ? "✓ Have" : "+ Have"}</button></div>${more}</li>`;
};
/* ---------- quantities in text: scaling ---------- */
const UFR = { "½": .5, "⅓": 1 / 3, "⅔": 2 / 3, "¼": .25, "¾": .75, "⅛": .125 };
function numOf(s) { s = String(s).trim(); if (UFR[s] != null) return UFR[s]; const m = s.match(/^(\d+)\s+(\d+)\/(\d+)$/); if (m) return +m[1] + m[2] / m[3]; const f = s.match(/^(\d+)\/(\d+)$/); if (f) return f[1] / f[2]; return parseFloat(s); }
const QRX = /(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?|[½⅓⅔¼¾⅛])(\s*(?:-|–|to)\s*(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?))?(\s*)(cups?|tablespoons?|tbsps?|teaspoons?|tsps?|ounces?|oz|pounds?|lbs?|grams?|g|kg|kilograms?|ml|millilit(?:er|re)s?|lit(?:er|re)s?|l|cloves?|cans?|sticks?|eggs?)\b/gi;
function scaleText(t, f) {
  t = String(t || ""); if (!f || Math.abs(f - 1) < 1e-6) return esc(t);
  let out = "", last = 0;
  t.replace(QRX, (m, a, rng, b, sp, u, off) => {
    out += esc(t.slice(last, off)); const x = numOf(a) * f, y = b ? numOf(b) * f : null;
    out += `<b class="scq" title="Original: ${esc(m)}">${fmtQ(x)}${y != null ? "–" + fmtQ(y) : ""}${sp}${esc(u)}</b>`; last = off + m.length; return m;
  });
  return out + esc(t.slice(last));
}
function stepIngs(r, k) {
  const t = " " + String(r.st[k] || "").toLowerCase().replace(/[^a-zÀ-ſ ]/g, " ") + " ";
  const full = [], head = [];
  r.i.forEach((g, j) => {
    const it = String(g.item || "").toLowerCase().replace(/\(.*?\)/g, "").replace(/[^a-zÀ-ſ ]/g, " ").trim(); if (!it) return;
    if (t.includes(" " + it + " ") || t.includes(" " + it + "s ")) { full.push(j); return; }
    const w = it.split(/\s+/).filter(x => x.length > 2); const h = (w[w.length - 1] || "").replace(/(es|s)$/, "");
    if (h.length >= 3 && !["fresh", "dried", "ground", "large", "small"].includes(h) && new RegExp(" " + h + "(e?s)? ").test(t)) head.push(j);
  });
  return full.concat(head.filter(j => !full.includes(j) && !full.some(x => r.i[x].item.endsWith(r.i[j].item.split(" ").pop()))));
}
function scaleNotes(r, f) {
  if (Math.abs(f - 1) < 1e-6) return "";
  const rl = (r.cf && r.cf.rl) || "", items = r.i.map(g => g.item.toLowerCase());
  const has = (re, roles) => items.some((x, k) => re.test(x) || (roles && roles.includes(rl[k])));
  const N = [`<li>Cooking times do <b>not</b> scale with servings. Use the doneness cues instead of multiplying the time.</li>`];
  if (f > 1 && has(/salt|pepper|chili|chilli|cayenne|cumin|paprika|spice|masala|flakes|curry/, "Z")) N.push(`<li>Start with about ¾ of the scaled salt and spice amounts, then taste and adjust.</li>`);
  if (has(/yeast|baking powder|baking soda|bicarbonate/, "L") && (f > 1.5 || f < .6)) N.push(`<li>Leaveners don't scale perfectly. For more than double, mix separate batches; for half, measure carefully.</li>`);
  if (["baking", "treats"].includes(r.c)) N.push(`<li>Use a bigger pan or more pans so the batter or dough stays the same depth, or the bake time and texture will change.</li>`);
  if (f > 1 && (["soup", "comfort"].includes(r.c) || /M/.test(rl))) N.push(`<li>Liquid evaporates more slowly in a bigger batch: add about 90% of the scaled liquid and top up as needed.</li>`);
  if (f >= 2) N.push(`<li>Check your pot or pan holds the larger amount, and brown meat in more batches so it sears instead of steaming.</li>`);
  return `<div class="scalebox"><b>Scaling notes</b><ul>${N.join("")}</ul></div>`;
}
function scalePanel(r) {
  const pre = [.5, 1, 1.5, 2, 3].map(x => Math.max(1, Math.round(r.s * x)));
  const uniq = [...new Set(pre)];
  return `<div class="scalebar">${uniq.map(n => `<button class="kc ${det.s === n ? "on" : ""}" data-a="kServ" data-v="${n}">${n === r.s ? n + " (original)" : n}</button>`).join("")}<input class="inp kserv" type="number" min="1" max="60" inputmode="numeric" value="${det.s}" data-k2="serv" aria-label="Custom servings">${det.s !== r.s ? `<button class="link" data-a="kServ" data-v="${r.s}">↺ Original</button>` : ""}</div>${scaleNotes(r, det.s / r.s)}`;
}
/* ---------- recipe detail additions ---------- */
function stepsHtml(r, f) {
  return `<ol class="steps">${r.st.map((s, k) => { const ix = stepIngs(r, k); return `<li>${scaleText(s, f)}${ix.length ? `<div class="sing">${ix.map(j => `<span>${esc(ingText(r.i[j], f))}</span>`).join("")}</div>` : ""}${stepTip(r, k)}</li>`; }).join("")}</ol>`;
}
const AI_NOTE = `<p class="ainote">Chef notes, tips and kitchen guidance are AI-generated and checked by automated rules and USDA food-safety reference values. They have not been reviewed by a professional chef.</p>`;
function guideHtml(r) {
  const g = G(r.id);
  if (r.mine) return `<div class="card small unrated"><b>👩‍🍳 Chef notes</b><p class="mut" style="margin:4px 0 8px">${r.cf ? "You've added your own notes for this recipe." : "Culinary guidance hasn't been added to this recipe yet, so ingredients are marked \"Not rated\" rather than evaluated."}</p><button class="btn sm" data-a="kChefEdit" data-id="${r.id}">✏️ ${r.cf ? "Edit" : "Add"} chef notes</button></div>`;
  if (!g) return "";
  const st = g.store || {};
  const sec = (t, body, open) => body ? `<details class="gsec2"${open ? " open" : ""}><summary>${t}</summary>${body}</details>` : "";
  return (g.safety ? `<div class="safety"><b>⚠ Food safety</b><p>${esc(g.safety)}</p></div>` : "")
    + sec("🍽 What it should be like", (g.expect ? `<p>${esc(g.expect)}</p>` : "") + (g.done ? `<p><b>How to tell it's done:</b> ${esc(g.done)}</p>` : ""))
    + sec("⚠ Common mistakes", (g.mistakes || []).length ? `<ul>${g.mistakes.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : "")
    + sec("🧊 Storing, reheating & make-ahead", [["Fridge", st.fridge], ["Freezer", st.freeze], ["Reheat", st.reheat], ["Make ahead", st.ahead]].filter(x => x[1]).map(x => `<p><b>${x[0]}:</b> ${esc(x[1])}</p>`).join(""))
    + `<button class="btn ghost full" style="margin-top:8px" data-a="kHelp" data-id="${r.id}">🆘 Help! My dish went wrong</button>` + AI_NOTE;
}
function toolsRow(r) {
  const off = S.offline && S.offline[r.id];
  return `<div class="ktools"><button class="btn sm ghost" data-a="kHelp" data-id="${r.id}">🆘 Help</button>${r.mine ? "" : `<button class="btn sm ghost" data-a="kMeal" data-id="${r.id}">🍽 Build a meal</button>`}<button class="btn sm ghost" data-a="kOff" data-id="${r.id}">${off ? "✓ Saved offline" : "⬇ Save offline"}</button></div>${!navigator.onLine && !off ? `<div class="mut small">📵 Offline: this recipe's photo wasn't saved, but the recipe works.</div>` : ""}`;
}
const _dDetail = dDetail;
dDetail = function () {
  let h = _dDetail(); const r = R_(det.id), f = det.s / r.s;
  h = h.replace(/(data-a="cook" data-id="\d+">[^<]*<\/button>)/, (m) => m + toolsRow(r));
  h = h.replace("Tap Have to update your pantry.</div>", "Tap Have to update your pantry.</div>" + scalePanel(r));
  h = h.replace(/<ol class="steps">[\s\S]*?<\/ol>/, () => stepsHtml(r, f));
  h = h.replace("<h3>Our rating</h3>", () => guideHtml(r) + "<h3>Our rating</h3>");
  if (r.cf && !r.mine) h = h.replace('<div class="tipbox"><h3>👩‍🍳 Chef\'s Pro Tips</h3>', '<div class="tipbox"><h3>👩‍🍳 Chef\'s Pro Tips <small>AI-generated</small></h3>');
  return h;
};
A.kServ = el => { det.s = Math.min(60, Math.max(1, +el.dataset.v || 1)); rerSheet(); };
document.addEventListener("change", e => {
  const el = e.target, k = el.dataset && el.dataset.k2; if (!k) return;
  if (k === "serv") { det.s = Math.min(60, Math.max(1, Math.round(+el.value) || 1)); rerSheet(); }
  else if (k === "tlTime") { tlTarget = el.value; }
});
/* ---------- Help! My dish went wrong ---------- */
const PROB = [["salty", "Too salty"], ["spicy", "Too spicy"], ["watery", "Too thin / watery"], ["thick", "Too thick"], ["bland", "Tastes bland"], ["sweet", "Too sweet"], ["sour", "Too sour"], ["dry", "Dry or tough"], ["separated", "Sauce split or curdled"], ["mushy", "Mushy (rice, pasta, veg)"], ["undercooked", "Raw or undercooked in the middle"], ["burnt", "Burnt"], ["norise", "Dough or cake didn't rise"], ["greasy", "Too greasy"], ["lumpy", "Lumpy"], ["soggy", "Soggy"]];
const GEN = {
  salty: { f: "Add more of the unsalted base (broth, tomatoes, cream, rice or potatoes cooked separately) to dilute it, and balance with a little acid. A raw potato does not pull salt out.", ok: true },
  spicy: { f: "Stir in dairy (yogurt, cream, coconut milk) or a little sugar or lemon, or increase the other ingredients. Serve with plain rice, bread or yogurt.", ok: true },
  watery: { f: "Simmer uncovered to reduce, or stir in a slurry of 1 tsp cornstarch per cup of liquid mixed with cold water and boil 1 minute.", ok: true },
  thick: { f: "Thin with warm broth, water or milk a spoonful at a time, then re-season.", ok: true },
  bland: { f: "Add salt in small pinches first, then acid (lemon or vinegar), then fresh herbs. Taste after each addition.", ok: true },
  sweet: { f: "Balance with acid (lemon, vinegar) and a pinch of salt, or add more of the unsweetened components.", ok: true },
  sour: { f: "Add a pinch of sugar or honey, a little fat (butter, cream) or more of the base ingredients.", ok: true },
  dry: { f: "Slice thinly and serve with a warm sauce or broth. Next time cook to temperature and rest the meat before cutting.", ok: true },
  separated: { f: "Off the heat, whisk in a spoonful of cold liquid (water or cream), or blend briefly. A curdled egg or cheese sauce usually can't be made smooth again.", ok: true },
  mushy: { f: "Spread on a tray to steam dry; turn overcooked rice into fried rice or rice pudding, and overcooked vegetables into soup or mash.", ok: true },
  undercooked: { f: "Return it to the heat (covered, lower heat, or a lower oven) until it reaches a safe temperature. Never serve undercooked poultry, ground meat or eggs.", ok: true },
  burnt: { f: "Don't scrape or stir the burnt part in. Move the unburnt food to a clean pan right away. If it tastes burnt throughout, it can't be saved.", ok: false },
  norise: { f: "If the yeast was dead or the leavener expired it can't be fixed; roll it thin and bake as flatbread or crackers. If the kitchen was cold, move it somewhere warm and give it more time.", ok: false },
  greasy: { f: "Skim fat from the surface (or chill and lift it off), and blot fried food on paper towels. Fry at the right oil temperature next time.", ok: true },
  lumpy: { f: "Whisk hard or pass through a sieve; an immersion blender fixes most lumpy sauces and gravies.", ok: true },
  soggy: { f: "Re-crisp in a hot oven or air fryer on a rack, uncovered. Don't cover hot fried or baked food.", ok: true }
};
A.kHelp = el => {
  const id = +(el && el.dataset && el.dataset.id) || (ck ? ck.id : 0) || (S.cookSess ? S.cookSess.id : 0);
  const r = id ? R_(id) : null, g = r ? G(r.id) : null, rs = (g && g.rescue) || {};
  const mine = Object.keys(rs).filter(k => PROB.some(p => p[0] === k));
  const card = (k, x, spec) => `<details class="help"><summary>${PROB.find(p => p[0] === k)[1]}${spec ? "" : ' <span class="mut small">(general)</span>'}</summary><p>${esc(x.f)}</p>${x.ok === false ? `<p class="warn">This one usually can't be fixed safely or fully. Follow the advice above rather than serving it as planned.</p>` : ""}</details>`;
  sheet(`<div class="d-body" style="padding-top:22px"><h2 class="d-t">🆘 Help! My dish went wrong</h2>${r ? `<p class="mut">For <b>${esc(r.n)}</b>. Tap what's happening.</p>` : `<p class="mut">Open Help from a recipe for advice specific to that dish.</p>`}
${mine.map(k => card(k, rs[k], true)).join("")}
${r && mine.length ? `<details class="gsec2"><summary>Other problems</summary>${PROB.filter(p => !mine.includes(p[0])).map(p => card(p[0], GEN[p[0]], false)).join("")}</details>` : PROB.map(p => card(p[0], GEN[p[0]], false)).join("")}
<p class="mut small" style="margin-top:12px">Safety first: if food may be undercooked or has been left out over 2 hours (1 hour above 90°F), fixing the flavor won't make it safe.</p>${AI_NOTE}</div>`, "help");
  if (ck) $("#shw").style.zIndex = 300;
};
/* ---------- personal recipe chef notes ---------- */
A.kChefEdit = el => {
  const id = +el.dataset.id, m = S.mine.find(x => x.id === id); if (!m) return;
  const c = m.chef || {}, E = c.ing || {}, lines = m.ing.filter(x => x.trim());
  sheet(`<div class="d-body" style="padding-top:22px"><h2 class="d-t">Chef notes: ${esc(m.n)}</h2><p class="mut small">Rate each ingredient so the pantry and grocery list know what you can skip. Leave anything blank you're not sure about.</p>
${lines.map((l, k) => { const e = E[l] || {}; return `<div class="card small cedit" data-line="${esc(l)}"><b>${esc(l)}</b><select class="inp" data-ce="L"><option value="">Not rated</option>${["E", "R", "O"].map(x => `<option value="${x}" ${e.L === x ? "selected" : ""}>${LV2[x]}</option>`).join("")}</select><input class="inp" data-ce="w" maxlength="160" placeholder="Why it matters / what happens if skipped" value="${esc(e.w || "")}"><input class="inp" data-ce="x" maxlength="120" placeholder="Swap with (e.g. 2 tbsp chopped onion)" value="${esc(e.x || "")}"><input class="inp" data-ce="d" maxlength="140" placeholder="What changes with the swap" value="${esc(e.d || "")}"><input class="inp" data-ce="k" maxlength="80" placeholder="Swap uses (pantry item, e.g. onion)" value="${esc(e.k || "")}"></div>`; }).join("")}
<h3>Our Pro Tips</h3><textarea class="inp" rows="4" id="ceTips" maxlength="1200" placeholder="One tip per line">${esc((c.tips || []).join("\n"))}</textarea>
<button class="btn full" style="margin-top:12px" data-a="kChefSave" data-id="${id}">Save chef notes</button></div>`, "chefedit");
};
A.kChefSave = el => {
  const id = +el.dataset.id, m = S.mine.find(x => x.id === id); if (!m) return;
  const ing = {};
  document.querySelectorAll(".cedit").forEach(c => { const o = {}; c.querySelectorAll("[data-ce]").forEach(i => { const v = i.value.trim(); if (v) o[i.dataset.ce] = v; }); if (Object.keys(o).length) ing[c.dataset.line] = o; });
  const tips = ($("#ceTips").value || "").split("\n").map(x => x.trim()).filter(Boolean).slice(0, 8);
  m.chef = { ing, tips }; save(); syncMine(); toast("👩‍🍳 Chef notes saved"); openDetail(id);
};
/* ---------- offline downloads ---------- */
const OFF = TESTENV ? "offline-test" : "offline-v1";
if (!S.offline || typeof S.offline !== "object") S.offline = {};
const offUrl = r => { const u = rImg(r); return u && !/^data:/.test(u) ? new URL(u, location.href).href : ""; };
const sizeCache = {};
async function offEstimate(ids) {
  let b = 0;
  await Promise.all(ids.map(async id => { const r = R_(id); const u = r && offUrl(r); if (!u) return; if (sizeCache[u] == null) { try { const x = await fetch(u, { method: "HEAD", mode: "cors" }); sizeCache[u] = +x.headers.get("content-length") || 90000; } catch (e) { sizeCache[u] = 90000; } } b += sizeCache[u]; }));
  return b;
}
const fmtB = b => !b ? "0 KB" : b >= 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB";
async function offSave(ids) {
  if (!("caches" in window)) { toast("This browser can't save recipes offline"); return; }
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}
  const c = await caches.open(OFF); let ok = 0, fail = 0;
  for (const id of ids) {
    const r = R_(id); if (!r) continue; const u = offUrl(r); let bytes = 0;
    try { if (u) { const res = await fetch(u, { mode: "cors", cache: "no-cache" }); if (!res.ok) throw 0; bytes = (await res.clone().blob()).size; await c.put(u, res); } S.offline[id] = { b: bytes, at: Date.now() }; ok++; } catch (e) { fail++; }
  }
  save(); toast(fail ? `Saved ${ok}, ${fail} photo${fail > 1 ? "s" : ""} failed (try again online)` : `⬇ ${ok} recipe${ok === 1 ? "" : "s"} saved for offline`);
  if (sheetKind === "detail") rerSheet(); else if (sheetKind === "settings") settings();
}
async function offRemove(ids) {
  try { const c = await caches.open(OFF); for (const id of ids) { const r = R_(id); const u = r && offUrl(r); if (u) await c.delete(u); delete S.offline[id]; } } catch (e) {}
  save();
}
A.kOff = async el => { const id = +el.dataset.id; if (S.offline[id]) { await offRemove([id]); toast("Removed from offline"); rerSheet(); } else { toast("Saving for offline…"); await offSave([id]); } };
const favIds = () => S.fav.filter(id => R_(id));
const weekIds = () => [...new Set(weekEntries(S.week).map(e => e.id))].filter(id => R_(id));
A.kOffFav = () => offSave(favIds());
A.kOffWeek = () => offSave(weekIds());
A.kOffClear = async () => { await offRemove(Object.keys(S.offline).map(Number)); toast("Offline downloads removed"); settings(); };
A.kOffDel = async el => { await offRemove([+el.dataset.id]); settings(); };
function offCard() {
  const ids = Object.keys(S.offline).map(Number).filter(id => R_(id));
  const tot = ids.reduce((a, id) => a + (S.offline[id].b || 0), 0);
  return `<div class="card small" id="offCard"><b>📥 Offline recipes</b><p class="mut" style="margin:4px 0 8px">Recipe text, tips and cooking steps always work offline once the app has loaded. Saving a recipe also keeps its photo. Nothing downloads automatically.</p>
<div><b>${ids.length}</b> saved · ${fmtB(tot)} of photos <span class="mut" id="offQuota"></span></div>
<div class="row g8 wrap" style="margin-top:8px"><button class="btn sm" data-a="kOffFav">⬇ Favorites (${favIds().length}) <span id="offFavSz" class="mut"></span></button><button class="btn sm" data-a="kOffWeek">⬇ This week's plan (${weekIds().length}) <span id="offWeekSz" class="mut"></span></button>${ids.length ? `<button class="btn sm ghost" data-a="kOffClear">Remove all</button>` : ""}</div>
${ids.length ? `<details class="gsec2"><summary>Saved recipes</summary>${ids.map(id => `<div class="pe"><span class="pn">${esc(R_(id).n)}<small>${fmtB(S.offline[id].b || 0)}</small></span><button class="x" data-a="kOffDel" data-id="${id}" aria-label="Remove">✕</button></div>`).join("")}</details>` : ""}</div>`;
}
const _settings = settings;
settings = function () {
  _settings();
  const box = $("#sheetIn .d-body"); if (box) { const d = document.createElement("div"); d.innerHTML = offCard() + `<div class="card small"><b>👩‍🍳 About the chef notes</b><p class="mut" style="margin-top:4px">Ingredient ratings, substitutions, tips, rescue advice and storage guidance are AI-generated and checked by automated rules and USDA food-safety reference values. They are not reviewed by a professional chef. Curing guidance for Montreal smoked meat was checked against Mississippi State University Extension curing guidance.</p></div>`; box.insertBefore(d, box.children[3] || null); }
  sheetKind = "settings";
  offEstimate(favIds()).then(b => { const x = $("#offFavSz"); if (x) x.textContent = "≈ " + fmtB(b); });
  offEstimate(weekIds()).then(b => { const x = $("#offWeekSz"); if (x) x.textContent = "≈ " + fmtB(b); });
  if (navigator.storage && navigator.storage.estimate) navigator.storage.estimate().then(e => { const x = $("#offQuota"); if (x && e.quota) x.textContent = `· browser storage used ${fmtB(e.usage || 0)}`; });
};
A.settings = () => settings();
function offBar() { let b = $("#offbar"); if (!b) { b = document.createElement("div"); b.id = "offbar"; document.body.appendChild(b); } b.textContent = "📵 Offline: recipes still work; only saved photos show"; b.classList.toggle("on", !navigator.onLine); }
window.addEventListener("online", offBar); window.addEventListener("offline", offBar); offBar();
/* ---------- cooking mode ---------- */
let speakAuto = false;
const canSpeak = () => "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
function speak(t) { if (!canSpeak()) { toast("Spoken steps aren't supported on this device"); return; } try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.rate = .95; speechSynthesis.speak(u); } catch (e) {} }
function saveSess() { if (!ck) return; S.cookSess = { id: ck.id, i: ck.i, s: ck.s, done: ck.done || {}, at: Date.now() }; save(); }
const _openCook = openCook;
openCook = function (id, serv) {
  _openCook(id, serv);
  const ss = S.cookSess;
  if (ss && ss.id === id && Date.now() - ss.at < 2 * 864e5) { ck.i = ss.i; ck.s = serv || ss.s; ck.done = ss.done || {}; } else ck.done = {};
  saveSess(); rCook();
};
rCook = function () {
  const r = R_(ck.id), n = r.st.length, f = ck.s / r.s, onIng = ck.i === -1; ck.done = ck.done || {};
  const nd = Object.keys(ck.done).length, step = onIng ? "" : r.st[ck.i];
  const ix = onIng ? [] : stepIngs(r, ck.i);
  const warn = ix.filter(j => !inP(r.i[j].item) && r.cf && r.cf.sub && r.cf.sub[j]).map(j => `<div class="ck-warn">Out of ${esc(r.i[j].item)}? Swap: ${scaleText(r.cf.sub[j].x, f)}</div>`).join("");
  const wake = "wakeLock" in navigator ? (wl ? "☀️ Screen stays on" : "Screen stays on while cooking") : "Screen may dim: keep-awake isn't supported here";
  $("#cook").innerHTML = `<div class="ck-top"><button class="ibtn" data-a="closeCook" aria-label="Close">✕</button><div class="ck-t">${esc(r.n)}<small>${wake}</small></div><button class="ibtn" data-a="kSpeak" aria-label="Read aloud">${speakAuto ? "🔊" : "🔈"}</button><button class="ibtn" data-a="timers" aria-label="Timers">⏱</button><button class="ibtn" data-a="kHelp" data-id="${r.id}" aria-label="Help">🆘</button></div>
<div class="ck-prog"><div style="width:${Math.round(100 * nd / n)}%"></div></div>
<div class="ck-dots">${["🧺"].concat(r.st.map((_, k) => k + 1)).map((x, k) => `<button class="${k - 1 === ck.i ? "on" : ck.done[k - 1] ? "past" : ""}" data-a="ckGo" data-v="${k - 1}">${ck.done[k - 1] ? "✓" : x}</button>`).join("")}</div>
<div class="ck-body" id="ckBody">${onIng ? `<div class="ck-k">Get everything out first</div><div class="ck-serv"><span>Making</span><div class="stepper"><button data-a="ckS" data-v="-1">−</button><span>${ck.s}</span><button data-a="ckS" data-v="1">＋</button></div><span>servings</span></div><ul class="ck-ing">${r.i.map((g, k) => `<li class="${ck.got[k] ? "got" : ""}" data-a="ckGot" data-v="${k}"><span class="cb">${ck.got[k] ? "✓" : ""}</span>${esc(ingText(g, f))}</li>`).join("")}</ul>${(r.cf && r.cf.tips || []).filter(x => x.s < 0).map(x => `<div class="ck-tip">💡 ${esc(x.t)}</div>`).join("")}${G(r.id) && G(r.id).safety ? `<div class="ck-warn">⚠ ${esc(G(r.id).safety)}</div>` : ""}${!canSpeak() ? `<div class="mut small">Spoken steps aren't available on this device.</div>` : ""}`
      : `<div class="ck-k">Step ${ck.i + 1} of ${n}${ck.done[ck.i] ? " · ✓ done" : ""}</div><div class="ck-step">${scaleText(step, f)}</div>${ix.length ? `<div class="sing big">${ix.map(j => `<span>${esc(ingText(r.i[j], f))}</span>`).join("")}</div>` : ""}${stepTip(r, ck.i, "ck-tip")}${warn}${findT(step).map(t => `<button class="ck-timer" data-a="ckTimer" data-v="${t.mins}">⏱ Start a ${fmtMin(t.mins)} timer</button>`).join("")}<button class="btn ghost full" style="margin-top:10px" data-a="kSpeakNow">🔊 Read this step</button>`}</div>
<div class="ck-nav"><button class="btn ghost" data-a="ckGo" data-v="${ck.i - 1}" ${ck.i < 0 ? "disabled" : ""}>‹ Back</button>${ck.i < n - 1 ? `<button class="btn" data-a="kNext">${onIng ? "Let's cook ›" : "Done, next ›"}</button>` : `<button class="btn sage" data-a="ckDone">🎉 Finished!</button>`}</div>`;
  ck.i = Math.max(-1, ck.i); saveSess();
};
A.kNext = () => { const r = R_(ck.id); if (ck.i >= 0) ck.done[ck.i] = 1; if (ck.i < r.st.length - 1) { ck.i++; rCook(); const b = $("#ckBody"); if (b) b.scrollTop = 0; if (speakAuto && ck.i >= 0) speak(R_(ck.id).st[ck.i]); } };
A.kSpeak = () => { if (!canSpeak()) { toast("Spoken steps aren't supported on this device"); return; } speakAuto = !speakAuto; toast(speakAuto ? "🔊 Steps will be read aloud" : "🔈 Read-aloud off"); if (speakAuto && ck && ck.i >= 0) speak(R_(ck.id).st[ck.i]); rCook(); };
A.kSpeakNow = () => { if (ck && ck.i >= 0) speak(R_(ck.id).st[ck.i]); };
const _ckDone = A.ckDone; A.ckDone = el => { if (ck) { const r = R_(ck.id); r.st.forEach((_, k) => ck.done[k] = 1); } delete S.cookSess; save(); try { speechSynthesis.cancel(); } catch (e) {} _ckDone(el); };
A.kResume = () => { const ss = S.cookSess; if (ss && R_(ss.id)) openCook(ss.id, ss.s); };
A.kResumeX = () => { delete S.cookSess; save(); render(true); };
/* ---------- timers ---------- */
dTimers = function () {
  const T = S.timers || [], now = Date.now();
  const row = t => `<div class="trow ${t.fired ? "done" : ""}"><div class="tl"><b>${esc(t.label)}</b><span data-tleft="${t.uid}">${t.fired ? "DONE!" : t.p ? "paused · " + mmss(t.left || 0) : mmss(t.end - now)}</span></div><div class="tbtns"><button data-a="kTA" data-u="${t.uid}" data-v="-1" aria-label="Minus 1 minute">−1</button><button data-a="kTA" data-u="${t.uid}" data-v="1" aria-label="Plus 1 minute">+1</button><button data-a="kTP" data-u="${t.uid}">${t.p ? "▶" : "⏸"}</button><button data-a="kTR" data-u="${t.uid}" aria-label="Reset">↺</button><button data-a="tDel" data-u="${t.uid}" aria-label="Cancel">✕</button></div></div>`;
  return `<div class="d-body" style="padding-top:22px"><h2 class="d-t">Kitchen timers</h2>${T.length ? T.map(row).join("") : ""}
<form class="addf" data-f="kTimerAdd" style="margin-top:10px"><input class="inp" id="tName" placeholder="Name (e.g. Rice)" maxlength="30"><input class="inp" id="tMin" type="number" min="1" max="600" inputmode="numeric" placeholder="Min" style="width:80px"><button class="btn sm">Start</button></form>
<div class="tgrid">${[1, 3, 5, 8, 10, 12, 15, 20, 25, 30, 45, 60].map(m => `<button data-a="tQuick" data-v="${m}">${m}<small>min</small></button>`).join("")}</div>
<div class="card small iosnote"><b>On iPhone, keep this app open on screen.</b> iOS pauses web apps in the background and when the screen locks, so an alarm can't ring until you come back. For a locked-screen alarm, also set the Clock app timer, or say "Hey Siri, set a timer for 12 minutes".</div>
${T.length ? `<button class="btn ghost full" data-a="tClear">Clear all timers</button>` : ""}</div>`;
};
const findT2 = u => (S.timers || []).find(t => t.uid === u);
function tAfter() { save(); tickTimers(); if (sheetKind === "timers") $("#sheetIn").innerHTML = dTimers(); }
A.kTP = el => { const t = findT2(el.dataset.u); if (!t || t.fired) return; const now = Date.now(); if (t.p) { t.end = now + (t.left || 0); delete t.p; delete t.left; } else { t.left = Math.max(0, t.end - now); t.p = 1; t.end = now + 3.15e11; } tAfter(); };
A.kTA = el => { const t = findT2(el.dataset.u); if (!t) return; const d = (+el.dataset.v) * 6e4, now = Date.now(); if (t.fired) { if (d > 0) { t.fired = 0; t.end = now + d; } } else if (t.p) t.left = Math.max(0, (t.left || 0) + d); else t.end = Math.max(now + 1000, t.end + d); tAfter(); };
A.kTR = el => { const t = findT2(el.dataset.u); if (!t) return; t.fired = 0; delete t.p; delete t.left; t.end = Date.now() + (t.mins || 1) * 6e4; tAfter(); };
A.kSnooze = () => { const now = Date.now(); (S.timers || []).forEach(t => { if (t.fired) { t.fired = 0; t.end = now + 6e4; } }); toast("😴 Snoozed 1 minute"); tAfter(); };
document.addEventListener("submit", e => { if (e.target.dataset.f !== "kTimerAdd") return; const m = +$("#tMin").value; if (!(m > 0)) { toast("Enter minutes"); return; } startTimer(Math.min(600, m), ($("#tName").value || "").trim() || m + " min"); $("#sheetIn").innerHTML = dTimers(); });
setInterval(() => { if (sheetKind !== "timers") return; const now = Date.now(); (S.timers || []).forEach(t => { const x = document.querySelector(`[data-tleft="${t.uid}"]`); if (x) x.textContent = t.fired ? "DONE!" : t.p ? "paused · " + mmss(t.left || 0) : mmss(t.end - now); }); }, 1000);
/* ---------- meal builder ---------- */
const COURSES = [["side", "Side"], ["salad", "Salad"], ["sauce", "Sauce"], ["app", "Appetizer"], ["bread", "Bread"], ["dessert", "Dessert"]];
function courseOf(r) {
  const n = r.n.toLowerCase();
  if (r.c === "treats") return "dessert";
  if (/sauce|dip\b|salsa|chutney|dressing|raita|tzatziki|aioli|gravy|relish|pesto|chimichurri|dakka|shatta|tahini|duqqa|dukkah|hummus|baba|mutabbal|tirokafteri|guacamole|pickle|torshi|giardiniera|escabeche|ajad/.test(n)) return "sauce";
  if (/salad|slaw|salata|tabbouleh|fattoush|namul|muchim|som tam/.test(n)) return "salad";
  if (r.c === "baking" && /bread|bun|roll|naan|pita|flatbread|focaccia|biscuit|cornbread|baladi|fino|baguette|ciabatta|loaf|bagel|scone|tortilla|farls|muffin/.test(n)) return "bread";
  if (/spring roll|egg roll|wings|bruschetta|sambousek|samosa|pakora|fritter|croquet|deviled|crostini|rangoon|dumpling|potsticker|gyoza|empanada|meatball|falafel|ta'?ameya|tamiya|stuffed mushroom|nachos|skewers|satay|lumpia|bites/.test(n)) return "app";
  if (r.c === "sides") return "side";
  if (r.c === "breakfast" || r.c === "baking") return "other";
  return "main";
}
const CGRP = [["Egyptian", "Lebanese", "Syrian", "Turkish", "Moroccan", "Tunisian", "Saudi", "Persian", "Iranian", "Palestinian", "Jordanian", "Israeli", "Iraqi", "Yemeni", "Algerian"], ["Italian", "Greek", "Spanish", "French", "Portuguese", "Croatian", "Albanian", "Bulgarian"], ["Mexican", "Tex-Mex", "Colombian", "Peruvian", "Venezuelan", "Cuban", "Argentinian", "Chilean", "Brazilian", "Jamaican", "Dominican", "Puerto Rican", "Salvadoran", "Uruguayan", "Trinidadian", "Bahamian", "Barbadian"], ["Chinese", "Japanese", "Korean", "Taiwanese"], ["Thai", "Vietnamese", "Filipino", "Malaysian", "Cambodian", "Lao", "Indonesian", "Singaporean"], ["Indian", "Pakistani", "Bangladeshi", "Sri Lankan", "Nepali", "Afghan"], ["American", "Southern", "Cajun", "Canadian", "British", "Irish", "Australian", "Scottish"], ["Polish", "Ukrainian", "Russian", "German", "Dutch", "Danish", "Norwegian", "Swedish", "Belgian", "Austrian", "Hungarian", "Slovak", "Estonian", "Finnish"]];
const grpOf = c => CGRP.findIndex(g => g.includes(c));
const usesOven = r => r.st.some(s => /\boven\b|\bbake|\broast|\bbroil/i.test(s));
const ovenTemp = r => { for (const s of r.st) { const m = s.match(/(\d{3})\s*(?:°|degrees|º)?\s*F\b/i) || s.match(/oven to (\d{3})/i); if (m) return +m[1]; const c = s.match(/(\d{3})\s*(?:°|degrees)?\s*C\b/i); if (c) return Math.round(+c[1] * 9 / 5 + 32); } return usesOven(r) ? 375 : 0; };
const isRich = r => r.keys.some(k => /cream|cheese|butter|bechamel|mayo/.test(k)) || r.cz >= 9;
const isStarch = r => r.keys.some(k => /\brice\b|pasta|noodle|potato|macaroni|bread|couscous|bulgur|freekeh/.test(k));
function mealScore(m, c) {
  let s = 0;
  if (m.cu && c.cu === m.cu) s += 3; else if (grpOf(m.cu) >= 0 && grpOf(m.cu) === grpOf(c.cu)) s += 1.5;
  if (isRich(m) && (courseOf(c) === "salad" || c.keys.some(k => /lemon|vinegar|lime|yogurt|pickle/.test(k)))) s += 1;
  if (isStarch(m) && isStarch(c) && ["side", "bread"].includes(courseOf(c))) s -= 1.5;
  if (c.t <= 30) s += .6; else if (c.t > 90) s -= 1;
  const sh = c.keys.filter(k => m.keys.includes(k)).length; s += Math.min(1.5, sh * .3);
  s += stats(c).pct / 100 * 1.2;
  if (usesOven(m) && usesOven(c) && Math.abs(ovenTemp(m) - ovenTemp(c)) > 25) s -= 1;
  if (c.id % 7 === m.id % 7) s += .05;
  return s;
}
function mealRank(m, course) { return RECIPES.filter(c => c.id !== m.id && courseOf(c) === course).map(c => ({ c, s: mealScore(m, c) })).sort((a, b) => b.s - a.s || a.c.id - b.c.id).slice(0, 12).map(x => x.c.id); }
let meal = null;
A.kMeal = el => { const id = +el.dataset.id, m = R_(id); meal = { main: id, pick: {}, skip: {}, list: {} }; COURSES.forEach(([k]) => { meal.list[k] = mealRank(m, k); meal.pick[k] = 0; }); meal.skip = { app: true, bread: !["Egyptian", "Lebanese", "Syrian", "Indian", "Greek", "Turkish"].includes(m.cu) }; showMeal(); };
function mealIds() { return [meal.main].concat(COURSES.filter(([k]) => !meal.skip[k] && meal.list[k].length).map(([k]) => meal.list[k][meal.pick[k] % meal.list[k].length])); }
function showMeal() {
  const m = R_(meal.main);
  sheet(`<div class="d-body" style="padding-top:22px"><h2 class="d-t">🍽 Build your ${m.cu ? esc(m.cu) + " " : ""}dinner</h2><div class="pe">${mini(m)}<span class="pn"><b>${esc(m.n)}</b><small>Main · ${m.t} min</small></span></div>
${COURSES.map(([k, t]) => { const L = meal.list[k]; if (!L.length) return ""; const r = R_(L[meal.pick[k] % L.length]); if (meal.skip[k]) return `<div class="mrow off"><span class="mut">${t}: none</span><button class="btn sm ghost" data-a="kMealOn" data-k="${k}">＋ Add ${t.toLowerCase()}</button></div>`; const st = stats(r); return `<div class="mrow"><span class="mc">${t}</span><div class="pe">${mini(r)}<span class="pn" data-a="open" data-id="${r.id}">${esc(r.n)}<small>${esc(r.cu || "")} · ${r.t} min · ${TIER[st.tier][0]} ${TIER[st.tier][1]}</small></span></div><div class="row g8"><button class="btn sm ghost" data-a="kMealNext" data-k="${k}">↻ Another</button><button class="btn sm ghost" data-a="kMealPick" data-k="${k}">Choose…</button><button class="x" data-a="kMealOff" data-k="${k}" aria-label="Remove">✕</button></div></div>`; }).join("")}
<p class="mut small">Ranked by cuisine match, flavor balance (something fresh with rich mains, no double starch), prep time, shared ingredients, what's in your pantry and oven conflicts.</p>
<div class="row g8 wrap"><button class="btn" data-a="kTL">⏱ Plan the cooking timeline</button><button class="btn ghost" data-a="kMealGroc">🛒 Add all to groceries</button><button class="btn ghost" data-a="kMealPlan">🗓️ Add all to planner today</button></div></div>`, "meal");
}
A.kMealNext = el => { meal.pick[el.dataset.k]++; showMeal(); };
A.kMealOff = el => { meal.skip[el.dataset.k] = true; showMeal(); };
A.kMealOn = el => { meal.skip[el.dataset.k] = false; showMeal(); };
A.kMealPick = el => { const k = el.dataset.k; sheet(`<div class="d-body" style="padding-top:22px"><h2 class="d-t">Choose a ${COURSES.find(c => c[0] === k)[1].toLowerCase()}</h2>${meal.list[k].map((id, i) => { const r = R_(id); return `<div class="pe" data-a="kMealSet" data-k="${k}" data-v="${i}">${mini(r)}<span class="pn">${esc(r.n)}<small>${esc(r.cu || "")} · ${r.t} min</small></span></div>`; }).join("")}<button class="btn ghost full" data-a="kMealBack">‹ Back</button></div>`, "meal"); };
A.kMealSet = el => { meal.pick[el.dataset.k] = +el.dataset.v; meal.skip[el.dataset.k] = false; showMeal(); };
A.kMealBack = () => showMeal();
A.kMealGroc = () => { mealIds().forEach(id => { if (!inBasket(id)) S.basket[id] = R_(id).s; unGone(id); }); save(); toast("🛒 Meal added to groceries"); };
A.kMealPlan = () => { const d = todayIso(); S.plan[d] = S.plan[d] || []; mealIds().forEach(id => S.plan[d].push({ uid: uid(), id, s: R_(id).s, m: "D" })); save(); toast("🗓️ Added to today's dinner"); };
/* ---------- coordinated cooking timeline ---------- */
const PASSIVE = /\b(bake|baking|roast|simmer|braise|marinat|rest|chill|refrigerat|rise|proof|soak|cool|let (it |them )?(stand|sit)|slow[- ]cook|steam|smok|freeze|set aside to|leave to)/i;
const STOVE = /\b(saute|sauté|fry|sear|brown|simmer|boil|skillet|frying pan|saucepan|pot|wok|stir-fry|poach|reduce)\b/i;
function tasksOf(r) {
  const temp = ovenTemp(r), out = [];
  r.st.forEach((s, k) => {
    const ts = findT(s); let d = ts.length ? Math.max(...ts.map(t => t.mins)) : 0;
    const pas = PASSIVE.test(s) && d >= 8, oven = /\boven\b|\bbake|\broast|\bbroil/i.test(s) && !/preheat|heat the oven|oven to/i.test(s);
    if (/preheat|heat the oven|oven to \d/i.test(s) && s.length < 90) return;
    if (!d) d = s.length > 160 ? 8 : s.length > 70 ? 5 : 3;
    if (/overnight/i.test(s)) d = Math.max(d, 480);
    out.push({ rid: r.id, k, text: s, d: Math.round(d), act: pas ? Math.min(3, d) : d, pas, oven: oven ? (temp || 375) : 0, stove: STOVE.test(s), ahead: d >= 240 });
  });
  return out;
}
const overlap = (a, b) => a[0] < b[1] && b[0] < a[1];
function schedule(ids, serveAt) {
  const rs = ids.map(R_).filter(Boolean); const all = [], busy = [], ovenUse = [], ahead = [], stoveUse = []; const CAP = Math.max(1, (S.equip && S.equip.burners) || 4);
  const ORD = { main: 0, other: 1, side: 2, app: 3, salad: 4, sauce: 5, bread: 6, dessert: 7 };
  rs.sort((a, b) => ORD[courseOf(a)] - ORD[courseOf(b)] || b.t - a.t);
  for (const r of rs) {
    const T = tasksOf(r); let cur = serveAt;
    for (let i = T.length - 1; i >= 0; i--) {
      const t = T[i]; if (t.ahead) { ahead.push(t); continue; }
      let end = cur;
      for (let guard = 0; guard < 3000; guard++) {
        const st = end - t.d * 6e4, actI = [st, st + t.act * 6e4];
        const actClash = busy.find(b => overlap(actI, b));
        const ovClash = t.oven ? ovenUse.find(o => overlap([st, end], o) && Math.abs(o[2] - t.oven) > 25) : null;
        const stFull = t.stove && stoveUse.filter(o => overlap([st, end], o)).length >= CAP;
        if (!actClash && !ovClash && !stFull) break;
        let ne = end - 6e4;
        if (actClash) ne = Math.min(ne, actClash[0] - t.act * 6e4 + t.d * 6e4);
        if (ovClash) ne = Math.min(ne, ovClash[0]);
        end = ne;
      }
      const st = end - t.d * 6e4;
      t.start = st; t.end = end; busy.push([st, st + t.act * 6e4]); if (t.oven) ovenUse.push([st, end, t.oven]); if (t.stove) stoveUse.push([st, end]);
      all.push(t); cur = st;
    }
  }
  /* preheat tasks: one per oven block, 15 minutes before */
  const ov = all.filter(t => t.oven).sort((a, b) => a.start - b.start); let lastEnd = -1, lastTemp = 0;
  for (const t of ov) { if (t.start > lastEnd + 6e4 || t.oven !== lastTemp) { let s = t.start - 15 * 6e4; const pre = { rid: t.rid, k: -1, text: `Preheat the oven to ${t.oven}°F`, d: 15, act: 1, pas: true, start: s, end: t.start, pre: 1 }; for (let g = 0; g < 500 && busy.find(b => overlap([pre.start, pre.start + 6e4], b)); g++) { pre.start -= 6e4; } busy.push([pre.start, pre.start + 6e4]); all.push(pre); } lastEnd = Math.max(lastEnd, t.end); lastTemp = t.oven; }
  all.sort((a, b) => a.start - b.start || a.end - b.end);
  return { tasks: all, ahead, start: all.length ? all[0].start : serveAt, serveAt };
}
function validSchedule(s) { const act = s.tasks.map(t => [t.start, t.start + t.act * 6e4]); for (let i = 0; i < act.length; i++)for (let j = i + 1; j < act.length; j++)if (overlap(act[i], act[j])) return false; return true; }
let tlTarget = "";
const hhmm = ms => new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
A.kTL = () => { const d = new Date(Date.now() + 90 * 6e4); tlTarget = String(d.getHours()).padStart(2, "0") + ":" + String(Math.ceil(d.getMinutes() / 15) * 15 % 60).padStart(2, "0"); showTLSetup(); };
function showTLSetup() { sheet(`<div class="d-body" style="padding-top:22px"><h2 class="d-t">⏱ Cooking timeline</h2><p class="mut">${mealIds().map(id => esc(R_(id).n)).join(" · ")}</p><label class="mut small">When do you want to eat?</label><input class="inp" type="time" value="${tlTarget}" data-k2="tlTime"><button class="btn full" style="margin-top:10px" data-a="kTLGo">Make my plan</button><p class="mut small">The plan assumes one cook, one oven and four burners. Times come from each recipe's steps; steps with no time get a short estimate.</p></div>`, "tl"); }
A.kTLGo = () => {
  const [h, m] = (tlTarget || "19:00").split(":").map(Number); const t = new Date(); t.setHours(h, m, 0, 0); if (t.getTime() < Date.now()) t.setDate(t.getDate() + 1);
  let s = schedule(mealIds(), t.getTime());
  if (s.start < Date.now()) { const shift = Date.now() + 5 * 6e4 - s.start; s = schedule(mealIds(), t.getTime() + shift); s.late = true; }
  S.timeline = { ids: mealIds(), serveAt: s.serveAt, tasks: s.tasks.map(x => ({ rid: x.rid, text: x.text, d: x.d, act: x.act, pas: x.pas, start: x.start, end: x.end, oven: x.oven || 0, pre: x.pre || 0, done: 0 })), ahead: s.ahead.map(x => ({ rid: x.rid, text: x.text, d: x.d })), late: !!s.late, ok: validSchedule(s) };
  save(); showTL();
};
function showTL() {
  const L = S.timeline; if (!L) return; const nd = L.tasks.filter(t => t.done).length;
  sheet(`<div class="d-body" style="padding-top:22px"><h2 class="d-t">Tonight's plan · eat at ${hhmm(L.serveAt)}</h2>${L.late ? `<div class="ck-warn">Your time was too soon, so this plan starts now and dinner is ready at ${hhmm(L.serveAt)}.</div>` : ""}
<div class="bar"><div style="width:${L.tasks.length ? Math.round(100 * nd / L.tasks.length) : 0}%"></div></div><div class="mut small">${nd} of ${L.tasks.length} done · start at ${L.tasks.length ? hhmm(L.tasks[0].start) : "-"}</div>
${L.ahead.length ? `<div class="card small"><b>Earlier or the day before</b>${L.ahead.map(t => `<div class="tlrow"><span>${esc(R_(t.rid).n)}: ${esc(t.text)}</span></div>`).join("")}</div>` : ""}
${L.tasks.map((t, i) => `<div class="tlrow ${t.done ? "done" : ""}"><button class="cb" data-a="kTLDone" data-v="${i}">${t.done ? "✓" : ""}</button><div><b>${hhmm(t.start)}</b> <span class="mut small">${esc(R_(t.rid).n)}${t.pas ? ` · ${t.act} min hands-on, then ${t.d - t.act} min hands-off` : ` · ${t.d} min hands-on`}</span><div>${esc(t.text.length > 180 ? t.text.slice(0, 180) + "…" : t.text)}</div>${t.pas && t.d >= 5 && !t.done ? `<button class="link" data-a="kTLTimer" data-v="${i}">⏱ Start ${fmtMin(t.d)} timer</button>` : ""}</div></div>`).join("")}
<div class="row g8 wrap" style="margin-top:12px"><button class="btn" data-a="kTLBehind">🐢 I'm running behind</button><button class="btn ghost" data-a="kTLClear">Clear plan</button></div><p class="mut small">Never more than one hands-on task at a time; oven steps at different temperatures don't overlap.</p></div>`, "tl");
}
A.kTLDone = el => { const t = S.timeline.tasks[+el.dataset.v]; t.done = t.done ? 0 : 1; save(); showTL(); };
A.kTLTimer = el => { const t = S.timeline.tasks[+el.dataset.v]; startTimer(t.d, R_(t.rid).n.split(" ").slice(0, 2).join(" ")); };
A.kTLBehind = () => { const L = S.timeline; const nx = L.tasks.find(t => !t.done); if (!nx) return; const delay = Date.now() - nx.start; if (delay <= 6e4) { toast("You're on time 👍"); return; } L.tasks.forEach(t => { if (!t.done) { t.start += delay; t.end += delay; } }); L.serveAt += delay; save(); toast(`Plan moved ${Math.round(delay / 6e4)} min later`); showTL(); };
A.kTLClear = () => { delete S.timeline; save(); closeSheet(); };
A.kTLOpen = () => showTL();
/* ---------- home: resume cards and kitchen help ---------- */
const _home = V.home;
V.home = function () {
  let h = _home();
  const ss = S.cookSess, r = ss && R_(ss.id);
  const card = (r && Date.now() - ss.at < 2 * 864e5 ? `<section class="card resume"><b>👩‍🍳 Continue cooking ${esc(r.n)}</b><div class="mut small">Step ${ss.i + 1 > 0 ? ss.i + 1 : "ingredients"} of ${r.st.length}</div><div class="row g8"><button class="btn sm" data-a="kResume">Resume</button><button class="btn sm ghost" data-a="kResumeX">Dismiss</button></div></section>` : "")
    + (S.timeline && S.timeline.serveAt > Date.now() - 3 * 36e5 ? `<section class="card resume"><b>⏱ Tonight's plan</b><div class="mut small">Eat at ${hhmm(S.timeline.serveAt)}</div><button class="btn sm" data-a="kTLOpen">Open plan</button></section>` : "");
  h = h.replace('<div id="spinOut"></div>', card + '<div id="spinOut"></div>');
  const i = h.indexOf('<div class="qa">'); if (i >= 0) { const j = h.indexOf("</div>", i); h = h.slice(0, j) + `<button class="qt" data-a="kHelp"><span>🆘</span>Kitchen help</button>` + h.slice(j); }
  return h;
};
render(true);
if (/[?&](selftest=full|diag=1)/.test(location.search)) setTimeout(() => { const s = document.createElement("script"); s.src = "selftest.js?v=5"; document.body.appendChild(s); }, 1500);
