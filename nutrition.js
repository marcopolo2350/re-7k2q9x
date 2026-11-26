/* Nutrition estimates from USDA FoodData Central SR Legacy (via nutdb.js). See docs/NUTRITION.md. */
"use strict";
const NUT_W = { g: 1, kg: 1000, oz: 28.35, lb: 453.6 };
const NUT_V = { tsp: 1 / 48, "level tsp": 1 / 48, tbsp: 1 / 16, cup: 1, pint: 2, ml: 1 / 236.6, l: 1000 / 236.6 };
function nutFood(item) {
  if (typeof NUTDB === "undefined") return null; const I = NUTDB.items; const k = String(item || "").toLowerCase().trim();
  const cands = [k, k.replace(/es$/, ""), k.replace(/s$/, ""), k + "s"]; for (const c of cands) if (I[c] !== undefined) return I[c] ? I[c] : 0;
  return null; /* not in the matching table */
}
function nutGrams(g, m) {
  const q = g.q, u = (g.u || "").toLowerCase(); const map = m[1] || {};
  if (NUT_W[u]) return q * NUT_W[u];
  if (NUT_V[u] != null) return map.cup ? q * NUT_V[u] * map.cup : null;
  if (u === "pinch" || u === "dash") return q * .4;
  if (u === "stick" && /butter/.test(g.item)) return q * 113;
  if (!u) return map.each ? q * map.each : null;
  return map[u] ? q * map[u] : null;
}
function nutOf(r) {
  const tot = [0, 0, 0, 0, 0, 0, 0], miss = [], opt = [], taste = [], used = [];
  r.i.forEach((g, k) => {
    const L = (r.ilv && r.ilv[k]) || "U";
    if (SKIP.has(g.item)) return;
    if (g.q == null) { if (/taste|pinch|sprinkl|garnish|serving|as needed|splash|drizzle|dash|dust|optional|for frying|to fry|greasing/i.test((g.note || "") + " " + g.u) || /^(salt|black pepper|pepper|water|ice)$/.test(g.item)) taste.push(g.item); else miss.push(g.item + " (no quantity)"); return; }
    if (L === "O") { opt.push(g.item); return; }
    const m = nutFood(g.item); if (!m) { miss.push(g.item); return; }
    const gr = nutGrams(g, m); if (gr == null || !(gr >= 0)) { miss.push(g.item + " (unit " + (g.u || "count") + ")"); return; }
    const f = NUTDB.foods[m[0]]; for (let j = 0; j < 7; j++) if (f[j] != null) tot[j] += f[j] * gr / 100; used.push([g.item, Math.round(gr), m[0]]);
  });
  const need = used.length + miss.length; const cov = need ? used.length / need : 0;
  const status = !need ? "unavailable" : !miss.length ? "estimated" : (miss.length <= 2 && cov >= .8) ? "partial" : "unavailable";
  const s = Math.max(1, r.s); return { status, cov, per: tot.map(x => x / s), miss, opt, taste, used };
}
nutHtml = function (r) {
  const N = nutOf(r); const head = `<details class="gsec2"><summary>📊 Nutrition estimate</summary>`;
  if (N.status === "unavailable") return head + `<p class="mut"><b>Unavailable.</b> ${N.miss.length ? `${N.miss.length} ingredient${N.miss.length > 1 ? "s" : ""} couldn't be matched reliably to USDA data (${esc(N.miss.slice(0, 5).join(", "))}${N.miss.length > 5 ? "…" : ""}), so an estimate would be misleading.` : "Not enough quantity information."}</p></details>`;
  const p = N.per, row = (n, v, u) => `<tr><td>${n}</td><td>${v == null ? "n/a" : Math.round(v) + (u || "")}</td></tr>`;
  return head + `<p><b>${N.status === "estimated" ? "Estimated" : "Partial estimate"}</b> per serving (recipe makes ${r.s}).</p><table class="nut">${row("Calories", p[0], "")}${row("Protein", p[1], " g")}${row("Carbohydrates", p[2], " g")}${row("Fat", p[3], " g")}${row("Fiber", p[4], " g")}${row("Sugar", p[5], " g")}${row("Sodium", p[6], " mg")}</table>
<p class="mut small">${N.miss.length ? `<b>Not counted (no reliable match):</b> ${esc(N.miss.join(", "))}. Real values are higher. ` : ""}${N.opt.length ? `Excludes optional: ${esc(N.opt.join(", "))}. ` : ""}${N.taste.length ? `Excludes "to taste" items (${esc(N.taste.join(", "))}), so sodium is understated. ` : ""}Uses raw, as-listed weights from USDA FoodData Central SR Legacy; no cooking losses, drained fat or bones are accounted for. Changing servings doesn't change per-serving values. Not a verified label. <a href="docs/NUTRITION.md" target="_blank" rel="noopener">How it's calculated</a></p></details>`;
};
