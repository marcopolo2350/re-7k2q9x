/* Rose's EATS: pantry amounts as inventory transactions (Phase 5A).
   Amounts are optional; the simple ingredient-only pantry (S.pantry) is unchanged.
   Each change to an amount is an immutable transaction with a random id, stored in S.invTx[item]:
     buy / use / toss (discarded or expired) / adj (manual +/- adjustment): relative changes that always add up
     set: an absolute correction ("there are 6 now"). It lists the transactions it had already seen ("seen"), so
          later or concurrent uses still count against it.
     void: undoes one earlier transaction (ref).
   Merging two phones' transactions is a set union by id, so duplicates and order never matter.
   amount = latest correction + every relative change the correction had not seen. Two corrections that did not see
   each other are a conflict and are shown for a decision; a negative total is shown as a discrepancy, never hidden.
   S.inv[item].q / .u / .chk are a derived cache for the rest of the app (grocery deduction, lists). */
"use strict";
const INV = (() => {
  const REL = { buy: 1, use: -1, toss: -1, adj: 1 }, TYPES = ["buy", "use", "toss", "adj", "set", "void"];
  const LABEL = { buy: "Bought", use: "Used", toss: "Threw away", adj: "Adjusted", set: "Corrected to", void: "Undid" };
  const normU = u => { u = String(u || "").trim().toLowerCase(); const w = (typeof UNITW !== "undefined" && UNITW[u]) || u; return /^(pc|pcs|piece|pieces|each|count|x)$/.test(w) ? "" : w; };
  const VT = () => (typeof VOLT !== "undefined" ? VOLT : { tsp: 1, tbsp: 3, cup: 48, ml: 1 / 4.929, l: 1000 / 4.929 }), WG = () => (typeof WT !== "undefined" ? WT : { oz: 1, lb: 16, g: 1 / 28.35, kg: 1000 / 28.35 });
  /* convert q from unit a to unit b; null when the units are not compatible */
  function conv(q, a, b) { a = normU(a); b = normU(b); if (a === b) return q; const V = VT(), W = WG(); if (V[a] && V[b]) return q * V[a] / V[b]; if (W[a] && W[b]) return q * W[a] / W[b]; return null; }
  const valid = t => t && typeof t === "object" && typeof t.id === "string" && /^[A-Za-z0-9_-]{8,40}$/.test(t.id) && TYPES.includes(t.t) && (t.t === "void" ? typeof t.ref === "string" : Number.isFinite(t.q) && Math.abs(t.q) < 1e7) && (t.seen == null || (Array.isArray(t.seen) && t.seen.length <= 500 && t.seen.every(x => typeof x === "string")));
  function compute(txs) {
    txs = (txs || []).filter(valid); const byId = new Map(); for (const t of txs) if (!byId.has(t.id)) byId.set(t.id, t);
    const voided = new Set([...byId.values()].filter(t => t.t === "void").map(t => t.ref));
    const live = [...byId.values()].filter(t => t.t !== "void" && !voided.has(t.id)), sets = live.filter(t => t.t === "set");
    const memo = new Map();
    const cov = s => { if (memo.has(s.id)) return memo.get(s.id); const c = new Set(); memo.set(s.id, c); for (const id of s.seen || []) { c.add(id); const o = byId.get(id); if (o && o.t === "set") for (const x of cov(o)) c.add(x); } return c; };
    const max = sets.filter(s => !sets.some(o => o !== s && cov(o).has(s.id))).sort((a, b) => (b.at || "").localeCompare(a.at || "") || (b.id > a.id ? 1 : -1));
    const rel = live.filter(t => REL[t.t]).sort((a, b) => (a.at || "").localeCompare(b.at || "") || (a.id > b.id ? 1 : -1));
    const unit = max.length ? normU(max[0].u) : rel.length ? normU(rel[0].u) : "";
    const total = s => { let q = s ? conv(s.q, s.u, unit) : 0; const skipped = []; const c = s ? cov(s) : new Set(); for (const t of rel) { if (c.has(t.id)) continue; const v = conv(Math.abs(t.q), t.u, unit); if (v == null) { skipped.push(t); continue; } q += (t.t === "adj" ? Math.sign(t.q) : REL[t.t]) * v; } return { q: Math.round(q * 1000) / 1000, skipped }; };
    const w = total(max[0] || null), cands = max.length > 1 ? max.map(s => ({ set: s, q: total(s).q })) : null;
    return { q: w.q, u: unit, n: live.length, conflict: cands, neg: w.q < 0, skipped: w.skipped, tracked: live.length > 0 };
  }
  /* ids a new correction has "seen": every live transaction not already covered by a correction it supersedes,
     plus the corrections themselves (kept short so the list does not grow forever) */
  function frontier(txs) {
    const r = compute(txs), all = (txs || []).filter(valid), byId = new Map(all.map(t => [t.id, t])), sets = all.filter(t => t.t === "set");
    const memo = new Map(); const cov = s => { if (memo.has(s.id)) return memo.get(s.id); const c = new Set(); memo.set(s.id, c); for (const id of s.seen || []) { c.add(id); const o = byId.get(id); if (o && o.t === "set") for (const x of cov(o)) c.add(x); } return c; };
    const covered = new Set(); for (const s of sets) for (const x of cov(s)) covered.add(x);
    return all.filter(t => !covered.has(t.id)).map(t => t.id).slice(-400);
  }
  const newId = () => { const a = crypto.getRandomValues(new Uint8Array(12)); return btoa(String.fromCharCode(...a)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
  const who = () => { try { const c = JSON.parse(localStorage.getItem(KEY + ".share") || "null"); return (c && c.member) || ""; } catch (e) { return ""; } };
  function add(s, item, t, q, u, extra) {
    s.invTx = s.invTx || {}; const list = s.invTx[item] = s.invTx[item] || [];
    const tx = { id: newId(), t, at: new Date().toISOString(), ...(t === "void" ? { ref: extra } : { q: +q, u: String(u || "").trim().slice(0, 20) }) };
    const by = who(); if (by) tx.by = by.slice(0, 30);
    if (t === "set") tx.seen = frontier(list);
    list.push(tx); refresh(s, item); return tx;
  }
  /* rebuild the derived cache in S.inv from the transactions */
  function refresh(s, only) {
    s.inv = s.inv || {}; for (const [k, txs] of Object.entries(s.invTx || {})) {
      if (only && k !== only) continue; const r = compute(txs), e = s.inv[k] || {};
      if (!r.tracked) { delete e.q; delete e.u; delete e.chk; } else { e.q = r.q; if (r.u) e.u = r.u; else delete e.u; if (r.conflict || r.neg || r.skipped.length) e.chk = 1; else delete e.chk; }
      if (Object.keys(e).length) s.inv[k] = e; else delete s.inv[k];
    }
    return s;
  }
  /* one-time, additive: an amount typed before this version becomes an initial correction transaction */
  function migrate(s) {
    if (!s || !s.inv) return s; s.invTx = s.invTx && typeof s.invTx === "object" ? s.invTx : {};
    for (const [k, e] of Object.entries(s.inv)) if (e && Number.isFinite(e.q) && !(s.invTx[k] || []).length) s.invTx[k] = [{ id: newId(), t: "set", q: e.q, u: e.u || "", at: e.bought ? e.bought + "T00:00:00.000Z" : new Date().toISOString(), seen: [] }];
    return s;
  }
  return { compute, add, refresh, migrate, conv, normU, valid, LABEL, REL };
})();
/* ---------- wire into the app (only touches pantry amounts) ---------- */
(function () {
  if (typeof migrate === "function") { const _m = migrate; migrate = function (s) { return INV.migrate(_m(s)); }; }
  INV.migrate(S); save();
  const fmt = (q, u) => (Math.round(q * 100) / 100) + (u ? " " + u : "");
  function issues(k) {
    const r = INV.compute((S.invTx || {})[k]); let h = "";
    if (r.conflict) h += `<div class="warn small"><b>Two different amounts were entered at the same time.</b> Which is right?<div class="row g8 wrap" style="margin-top:6px">${r.conflict.map(c => `<button class="btn sm ghost" data-a="invPick" data-k="${esc(k)}" data-q="${c.q}">${esc(fmt(c.q, r.u))}${c.set.by ? " (" + esc(c.set.by) + ")" : ""}</button>`).join("")}</div></div>`;
    if (r.neg) h += `<div class="warn small"><b>The records add up to ${esc(fmt(r.q, r.u))}.</b> A use may have been entered twice or a purchase missed. Correct the amount below.</div>`;
    if (r.skipped.length) h += `<div class="warn small">${r.skipped.length} change${r.skipped.length === 1 ? "" : "s"} in a different unit (${esc([...new Set(r.skipped.map(t => t.u || "pieces"))].join(", "))}) couldn't be added to ${esc(r.u || "pieces")}.</div>`;
    return { r, h };
  }
  const _ed = A.lInvEd;
  A.lInvEd = el => {
    _ed(el); const k = el.dataset.k, box = document.querySelector("#invF"); if (!box) return;
    const { r, h } = issues(k), txs = ((S.invTx || {})[k] || []).slice(-6).reverse(), voided = new Set(((S.invTx || {})[k] || []).filter(t => t.t === "void").map(t => t.ref));
    const q = box.querySelector('[data-i="q"]'), u = box.querySelector('[data-i="u"]'); const row = q && q.closest(".row");
    const panel = document.createElement("div");
    panel.innerHTML = `${h}<div class="card small" style="margin:6px 0"><b>Amount: ${r.tracked ? esc(fmt(r.q, r.u)) : "not tracked"}</b>
<div class="row g8" style="margin-top:6px"><input class="inp" id="invQ" type="number" step="any" min="0" placeholder="How much" inputmode="decimal"><input class="inp" id="invU" placeholder="Unit" value="${esc(r.u || (S.inv[k] || {}).u || "")}"></div>
<div class="row g8 wrap" style="margin-top:6px"><button class="btn sm" data-a="invTx" data-t="buy" data-k="${esc(k)}">＋ Bought</button><button class="btn sm ghost" data-a="invTx" data-t="use" data-k="${esc(k)}">− Used</button><button class="btn sm ghost" data-a="invTx" data-t="toss" data-k="${esc(k)}">🗑 Threw away</button><button class="btn sm ghost" data-a="invTx" data-t="set" data-k="${esc(k)}">✎ Correct the amount</button></div>
${txs.length ? `<div class="mut small" style="margin-top:8px">${txs.map(t => `<div>${esc(INV.LABEL[t.t])} ${t.t === "void" ? "" : esc(fmt(t.q, t.u))}${t.by ? " · " + esc(t.by) : ""} · ${esc(nice((t.at || "").slice(0, 10)))}${t.t !== "void" && !voided.has(t.id) ? ` <button class="link" data-a="invUndo" data-k="${esc(k)}" data-id="${esc(t.id)}">undo</button>` : voided.has(t.id) ? " (undone)" : ""}</div>`).join("")}</div>` : ""}</div>`;
    if (row) { row.replaceWith(panel); } else box.prepend(panel);
  };
  A.invTx = el => { const k = el.dataset.k, t = el.dataset.t, qv = parseFloat(($("#invQ") || {}).value), u = ($("#invU") || {}).value || ""; if (!Number.isFinite(qv) || qv < 0 || (t !== "set" && qv === 0)) { toast("Enter how much first"); return; } const s = S; INV.add(s, k, t, qv, u); save(); toast(INV.LABEL[t] + " " + qv + (u ? " " + u : "")); A.lInvEd({ dataset: { k } }); };
  A.invPick = el => { const k = el.dataset.k, r = INV.compute(S.invTx[k]); INV.add(S, k, "set", +el.dataset.q, r.u); save(); toast("Amount set"); A.lInvEd({ dataset: { k } }); };
  A.invUndo = el => { const k = el.dataset.k; INV.add(S, k, "void", 0, "", el.dataset.id); save(); toast("Undone"); A.lInvEd({ dataset: { k } }); };
  /* the details form no longer edits the amount directly (amount changes are transactions); keep everything else */
  const _sv = A.lInvSave;
  A.lInvSave = () => { const f = $("#invF"); if (!f) return; const k = f.dataset.k, keep = S.inv[k] ? { q: S.inv[k].q, u: S.inv[k].u, chk: S.inv[k].chk } : {}; _sv(); const e = S.inv[k] || {}; for (const [x, v] of Object.entries(keep)) if (v != null) e[x] = v; if (Object.keys(e).length) S.inv[k] = e; INV.refresh(S, k); save(); };
  const _inv = A.lInv;
  A.lInv = (...a) => { _inv(...a); const chk = Object.entries(S.inv || {}).filter(([k, e]) => e.chk && S.pantry.includes(k)).map(([k]) => k); const box = document.querySelector("#sheetIn .d-body"); if (chk.length && box) { const d = document.createElement("div"); d.className = "warn small"; d.innerHTML = `⚠️ Check the amount of: ${chk.map(k => `<button class="link" data-a="lInvEd" data-k="${esc(k)}">${esc(k)}</button>`).join(", ")}`; box.insertBefore(d, box.children[1] || null); } };
})();
