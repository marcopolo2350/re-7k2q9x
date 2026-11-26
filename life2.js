/* Rose's EATS: leftover safety, personal photo storage, planner controls. Loaded after life.js. */
"use strict";
/* ================= leftovers: food type, storage and handling ================= */
const LOSAFE = { chicken: 4, beef: 4, pork: 4, rice: 4, pasta: 4, veg: 4, beans: 4, fish: 4, dish: 4 };
function loStatus(x) {
  const a = loAge(x), lim = LOSAFE[x.type] || 4;
  if (x.where === "freezer") return { cls: "ok", txt: "Frozen: stays safe while frozen; best quality within 2 to 3 months. Thaw in the fridge.", use: true };
  if (x.where === "counter" || x.cooled === "no") return { cls: "bad", txt: "Left out over 2 hours or not cooled promptly: throw it out. Reheating doesn't make it safe.", use: false };
  if (a >= lim) return { cls: "bad", txt: `Past ${lim} days in the fridge: throw it out.`, use: false };
  const unk = !x.cooled || x.cooled === "unknown" || !x.where;
  const base = a === lim - 1 ? "Last day: use today" : `Within the 3 to 4 day fridge window (day ${a + 1})`;
  return { cls: unk || a >= lim - 1 ? "warn" : "ok", txt: unk ? `${base}, but we don't know how it was cooled or stored, so we can't say it's safe. If unsure, throw it out.` : base + ".", use: !unk };
}
loHtml = function () {
  const L = (S.left || []).slice().sort((a, b) => a.date.localeCompare(b.date));
  return `<div class="h2">🥡 Cooked leftovers <span class="cnt">${L.length}</span></div><p class="mut small">USDA guidance: refrigerate cooked food within 2 hours (1 hour above 90°F), eat within 3 to 4 days, and reheat to 165°F. Cool rice quickly. These are rules of thumb, not a guarantee; when in doubt, throw it out.</p>${L.map(x => { const st = loStatus(x), r = x.id ? R_(x.id) : null, t = LO.find(l => l[0] === x.type); const sug = st.use ? loSuggest(x) : []; return `<div class="card small"><b>${esc(x.name || (r ? r.n : t ? t[1] : "Leftovers"))}</b><div class="lf ${st.cls}">${esc(st.txt)}</div><div class="mut small">${t ? t[1] : ""} · cooked ${nice(x.date)}${x.where ? " · " + x.where : " · storage not recorded"}</div>${sug.length ? `<div class="mut small" style="margin-top:6px">Turn it into: ${sug.map(s => `<button class="link" data-a="lLoUse" data-id="${s.id}" data-t="${x.type}">${esc(s.n)}</button>`).join(" · ")}</div>` : ""}<div class="row g8"><button class="btn sm sage" data-a="leftAte" data-u="${x.uid}">Ate it</button><button class="btn sm ghost" data-a="leftToss" data-u="${x.uid}">Toss</button></div></div>`; }).join("")}
<form class="addf lofm" data-f="lLoAdd2"><select class="inp" id="loT">${LO.map(([k, n]) => `<option value="${k}">${n}</option>`).join("")}</select><input class="inp" id="loN" placeholder="What is it? (optional)" maxlength="50"><label class="mut small">Cooked on <input class="inp" id="loD" type="date" value="${todayIso()}"></label><select class="inp" id="loW"><option value="fridge">In the fridge</option><option value="freezer">In the freezer</option><option value="counter">Still on the counter</option></select><select class="inp" id="loC"><option value="yes">Refrigerated within 2 hours</option><option value="unknown">Not sure how it was cooled</option><option value="no">Sat out longer than 2 hours</option></select><button class="btn sm">Add leftover</button></form>`;
};
document.addEventListener("submit", e => { if (e.target.dataset.f !== "lLoAdd2") return; S.left = S.left || []; S.left.push({ uid: uid(), id: 0, type: $("#loT").value, name: ($("#loN").value || "").trim().slice(0, 50), date: $("#loD").value || todayIso(), where: $("#loW").value, cooled: $("#loC").value }); save(); toast("🥡 Leftover saved"); render(true); });
const _loSuggest = loSuggest;
loSuggest = function (x) { const st = loStatus(x); return !st.use ? [] : _loSuggest(Object.assign({}, x, { date: todayIso() })); };
/* ================= personal photo storage ================= */
async function photoRoom() { try { const e = await navigator.storage.estimate(); return e.quota ? e.quota - (e.usage || 0) : Infinity; } catch (e) { return Infinity; } }
A.lHistSave = async () => {
  const f = $("#hf"); const id = +f.dataset.id; const h = { r: +f.dataset.r || 0 };
  f.querySelectorAll("[data-h]").forEach(i => { const v = i.value.trim(); if (v) h[i.dataset.h] = ["prep", "cook", "s"].includes(i.dataset.h) ? Math.max(0, Math.min(2000, +v)) : v.slice(0, 800); });
  h.ph = []; let failed = 0;
  const need = hPhotos.reduce((a, p) => a + p.length, 0) * 2 + 5e6;
  if (hPhotos.length && (await photoRoom()) < need) failed = hPhotos.length;
  else for (const p of hPhotos) { const k = "h:" + id + ":" + Date.now() + ":" + h.ph.length; try { await IDB.put(k, p); h.ph.push(k); } catch (e) { failed++; } }
  hist(id).push(h);
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { hist(id).pop(); toast("Couldn't save: browser storage is full. Nothing was lost. Export a backup, then delete old photos."); return; }
  if (h.r) S.rating[id] = h.r * 2; if (!isCooked(id)) S.cooked.push(id); if (h.again === "no") S.rej[id] = { n: 3, at: Date.now() }; save();
  toast(failed ? `Note saved. ${failed} photo(s) couldn't be stored: phone storage is nearly full.` : "📓 Saved to your kitchen notes");
  hPhotos = []; openDetail(id);
};
async function photoCard() { let a = {}; try { a = await IDB.all(); } catch (e) {} const ks = Object.keys(a); const tot = ks.reduce((s, k) => s + a[k].length * .75, 0); return `<b>📷 Personal photos</b><div class="mut">${ks.length} photo${ks.length === 1 ? "" : "s"} · ${fmtB(tot)}, compressed to 720 px and stored on this phone. Included in "Export full backup".</div>${ks.length ? `<details class="gsec2"><summary>Manage photos</summary><div class="phgrid">${ks.map(k => `<div><img src="${a[k]}" alt=""><button class="x" data-a="lPhDel" data-k="${esc(k)}" aria-label="Delete photo">✕</button></div>`).join("")}</div></details>` : ""}`; }
A.lPhDel = el => { const k = el.dataset.k; confirmDlg("Delete this photo?", "It's removed from this phone. Export a backup first if you want to keep a copy.", "Delete photo", async () => { try { await IDB.del(k); } catch (e) {} Object.values(S.hist).forEach(H => H.forEach(h => { if (h.ph) h.ph = h.ph.filter(x => x !== k); })); save(); closeSheet(); settings(); }); };
const _settings3 = settings;
settings = function () { _settings3(); const c = $("#dataCard"); if (c) { const d = document.createElement("div"); d.className = "card small"; d.id = "phCard"; d.textContent = "Loading photos…"; c.after(d); photoCard().then(h => { const x = $("#phCard"); if (x) x.innerHTML = h; }); } };
A.settings = () => settings();
/* ================= planner: move (edit), copy, replace ================= */
A.lCopyE = el => { const e = (S.plan[el.dataset.date] || []).find(x => x.uid === el.dataset.u); if (e) planDlg(e.id, el.dataset.date); };
A.lReplace = el => { const e = (S.plan[el.dataset.date] || []).find(x => x.uid === el.dataset.u); if (e) planDlg(0, null, { ...e, id: 0, date: el.dataset.date, q: "" }); };
const _plan2 = V.plan;
V.plan = function () { return _plan2().replace(/(<button class="x" data-a="lLeftNext" data-date="([^"]+)" data-u="([^"]+)")/g, (m, b, d, u) => `<button class="x" data-a="lCopyE" data-date="${d}" data-u="${u}" aria-label="Copy to another day" title="Copy">⧉</button><button class="x" data-a="lReplace" data-date="${d}" data-u="${u}" aria-label="Replace recipe" title="Replace">⇄</button>` + m); };
render(true);
