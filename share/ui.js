/* Household sharing screens (Settings > Household sharing). Plain language; optional; nothing is ever sent
   automatically. Every value shown is escaped; the household code is shown only when asked for. */
"use strict";
(function () {
  const H = () => SHARE.engine();
  const CATS = [["plan", "📅"], ["grocery", "🛒"], ["pantry", "🧺"], ["cols", "📚"], ["favs", "♡"], ["kitchen", "🍳"]];
  const PERS = [["notes", "📝", "note"], ["versions", "📖", "mine"], ["history", "🍽", "hist"], ["photos", "📷", "photo"]];
  const lab = c => RM.CAT_LABEL[c];
  const ago = t => { if (!t) return "never"; const m = Math.round((Date.now() - t) / 60000); return m < 2 ? "just now" : m < 60 ? m + " minutes ago" : m < 1440 ? Math.round(m / 60) + " hours ago" : nice(iso(new Date(t))); };
  const rn = id => { const r = typeof R_ === "function" && R_(+id); const m = (S.mine || []).find(x => String(x.id) === String(id)); return (r && r.n) || (m && m.n) || "recipe " + id; };
  let pending = null, sel = null;
  async function fileOut(name, text, title) {
    try { const f = new File([text], name, { type: "application/json" }); if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title }); return "shared"; } } catch (e) { if (e && e.name === "AbortError") return "cancelled"; }
    dl(name, text, "application/json"); return "saved";
  }
  const fname = kind => "RosesEATS-" + kind + "-" + String((SHARE.cfg() || {}).member || "phone").replace(/[^A-Za-z0-9]+/g, "") + "-" + todayIso() + ".json";
  function card() {
    if (!SHARE.on()) return `<div class="card small" id="shareCard"><b>👪 Household sharing</b><p class="mut" style="margin:4px 0 8px">Share the grocery list, meal plan, pantry and recipes you choose with the other phone by sending a file (AirDrop, Messages or the share sheet). This is <b>not automatic syncing</b>: the other phone catches up when it opens a file you sent. No account and no server.</p><div class="row g8 wrap"><button class="btn sm" data-a="shStart">Start household sharing</button><button class="btn sm ghost" data-a="shJoin">Join with a code</button></div></div>`;
    return `<div class="card small" id="shareCard"><b>👪 Household sharing</b><div class="mut" id="shStat" style="margin:4px 0 8px">Checking…</div><div class="row g8 wrap"><button class="btn sm" data-a="shSend">📤 Send my changes</button><button class="btn sm" data-a="shOpen">📥 Open a household file</button><button class="btn sm ghost" data-a="shGroc">🛒 Share grocery list</button><button class="btn sm ghost" data-a="shPlan">📅 Share meal plan</button><button class="btn sm ghost" data-a="shRecipes">📖 Share recipes</button><button class="btn sm ghost" data-a="shBackup">🛟 Household backup</button><button class="btn sm ghost" data-a="shGot">💌 Shared with me</button><button class="btn sm ghost" data-a="shSet">⚙️ Sharing settings</button></div><div id="shConf"></div></div>`;
  }
  async function status() {
    const el = $("#shStat"); if (!el) return; const e = await H(), h = await e.household(); if (!h) { el.textContent = "Not set up on this phone."; return; }
    const peers = Object.values(h.peers || {}); el.innerHTML = `This phone: <b>${esc(h.member)}</b>. Last sent ${esc(ago(h.lastExport && h.lastExport.at))}; last opened a file ${esc(ago(h.lastImport && h.lastImport.at))}${peers.length ? " (from " + esc([...new Set(peers.map(p => p.member))].join(", ")) + ")" : ""}.`;
    const n = (await e.conflicts()).length, c = $("#shConf"); if (c) c.innerHTML = n ? `<div class="warn small" style="margin-top:8px">⚠️ ${n} thing${n === 1 ? "" : "s"} were changed differently on two phones. <button class="link" data-a="shConflicts">Choose</button></div>` : "";
  }
  const _set = settings; settings = function () { _set(); const box = $("#sheetIn .d-body"); if (box) { const d = document.createElement("div"); d.innerHTML = card(); const dc = $("#dataCard"); if (dc && dc.parentNode) dc.parentNode.insertBefore(d.firstChild, dc.nextSibling); else box.appendChild(d.firstChild); status().catch(() => {}); } };
  A.settings = () => settings();
  const back = `<button class="btn ghost full" style="margin-top:8px" data-a="settings">‹ Back to Settings</button>`;
  const whoPick = (id, v) => `<label>Whose phone is this?</label><div class="row g8 wrap">${["Marco", "Rose"].map(n => `<button class="chip${v === n ? " on" : ""}" data-a="shWho" data-v="${n}" data-for="${id}">${n}</button>`).join("")}</div><input class="inp" id="${id}" maxlength="30" placeholder="Name" value="${esc(v || "")}" style="margin-top:6px">`;
  A.shWho = el => { const i = $("#" + el.dataset.for); if (i) i.value = el.dataset.v; document.querySelectorAll('[data-a="shWho"]').forEach(b => b.classList.toggle("on", b === el)); };
  /* ---------- start / join ---------- */
  A.shStart = () => sheet(`<div class="d-body" style="padding-top:22px"><h2 class="d-t">Start household sharing</h2><p class="mut">This creates a private household code (12 words). The other phone joins by typing the same 12 words, then you send each other files when you want to share. Your notes, history, versions and photos stay private unless you choose to share them.</p>${whoPick("shName", "")}<button class="btn full big" style="margin-top:12px" data-a="shStartGo">Create household code</button>${back}</div>`, "share");
  A.shStartGo = async () => { const n = ($("#shName").value || "").trim(); if (!n) { toast("Choose whose phone this is"); return; } try { const r = await SHARE.start(n); showWords(r.words, true); } catch (e) { toast("Couldn't set up sharing on this browser"); } };
  function showWords(words, fresh) {
    const w = words.split(" "); sel = { confirm: [2, 8].map(i => [i, w[i]]) };
    sheet(`<div class="d-body" style="padding-top:22px"><h2 class="d-t">Your household code</h2><p class="mut">Type these 12 words on the other phone to join. Write them down and keep them somewhere safe: with them you can open your household backups on a new phone.</p>
<div class="card" style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;font:600 16px -apple-system,system-ui">${w.map((x, i) => `<div><span class="mut small">${i + 1}.</span> ${esc(x)}</div>`).join("")}</div>
<p class="mut small"><b>The code is a key, not a backup.</b> It gives access to your household files, but it doesn't contain any recipes or lists. Keep exporting backups too. Don't post the code anywhere or send it with your files.</p>
${fresh ? `<label>To check you wrote them down: word ${sel.confirm[0][0] + 1}</label><input class="inp" id="shC1" autocomplete="off" autocapitalize="none"><label>Word ${sel.confirm[1][0] + 1}</label><input class="inp" id="shC2" autocomplete="off" autocapitalize="none"><button class="btn full" style="margin-top:10px" data-a="shConfirm">I've written them down</button>` : ""}${back}</div>`, "share");
  }
  A.shConfirm = () => { const a = ($("#shC1").value || "").trim().toLowerCase(), b = ($("#shC2").value || "").trim().toLowerCase(); if (a !== sel.confirm[0][1] || b !== sel.confirm[1][1]) { toast("Those words don't match. Check your copy."); return; } sel = null; toast("Household sharing is ready"); settings(); };
  A.shJoin = () => sheet(`<div class="d-body" style="padding-top:22px"><h2 class="d-t">Join a household</h2><p class="mut">On the other phone, open Settings, Household sharing, Sharing settings, Show household code. Type the 12 words here, in order, with spaces.</p>${whoPick("shName", "")}<label>The 12 words</label><textarea class="inp" id="shWords" rows="3" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="word word word …"></textarea><div class="warn small" id="shErr"></div><button class="btn full big" style="margin-top:10px" data-a="shJoinGo">Join</button>${back}</div>`, "share");
  A.shJoinGo = async () => { const n = ($("#shName").value || "").trim(), w = $("#shWords").value; if (!n) { toast("Choose whose phone this is"); return; } try { await SHARE.join(w, n); $("#shWords").value = ""; sheet(`<div class="d-body" style="padding-top:22px"><h2 class="d-t">Joined ♡</h2><p>This phone is now part of the household. Ask the other phone to tap <b>Send my changes</b> and send you the file; then open it here with <b>Open a household file</b>.</p>${back}</div>`, "share"); } catch (e) { $("#shErr").textContent = e.message || "Those words didn't work"; } };
  /* ---------- send ---------- */
  function pickRows(c, col) {
    const items = col === "note" ? Object.entries(S.notes || {}).map(([id, v]) => [id, rn(id) + ": " + String(v).slice(0, 40)])
      : col === "mine" ? (S.mine || []).map(r => [String(r.id), r.n]).concat(Object.values(S.ver || {}).map(v => ["ver:" + v.id, (v.name || "Version") + " of " + rn(v.base)]))
      : col === "hist" ? Object.entries(S.hist || {}).flatMap(([r, es]) => (es || []).filter(e => e.u).map(e => [r + "|" + e.u, rn(r) + " · " + (e.d ? nice(e.d) : "") + (e.ph && e.ph.length ? " · 📷" : "")]))
      : Object.keys(S.photos || {}).map(id => [id, rn(id)]);
    const on = new Set((sel.picks[col] || []).map(String));
    return items.length ? items.map(([id, t]) => `<label class="toggle"><span>${esc(t)}</span><span class="sw"><input type="checkbox" class="shPk" data-col="${col}" value="${esc(id)}" ${on.has(id) ? "checked" : ""}><span></span></span></label>`).join("") : `<p class="mut small">Nothing here yet.</p>`;
  }
  async function sendSheet(kind) {
    const m = await (await H()).meta(); sel = { kind, picks: structuredClone(m.picks || {}), cats: new Set(m.cats || CATS.map(x => x[0])) };
    const title = { changes: "Send my changes", recipes: "Share recipes" }[kind];
    const cats = kind === "recipes" ? "" : CATS.map(([c, ic]) => `<label class="toggle"><span>${ic} ${esc(lab(c))}</span><span class="sw"><input type="checkbox" class="shCat" value="${c}" ${sel.cats.has(c) ? "checked" : ""}><span></span></span></label>`).join("");
    const pers = PERS.filter(p => kind === "changes" || p[2] === "mine" || p[2] === "photo").map(([c, ic, col]) => `<details ${kind === "recipes" && col === "mine" ? "open" : ""}><summary><b>${ic} ${esc(lab(c))}</b> <span class="mut small">private unless you pick items</span></summary>${pickRows(c, col)}</details>`).join("");
    sheet(`<div class="d-body" style="padding-top:22px"><h2 class="d-t">${title}</h2>${kind === "changes" ? `<p class="mut">The file includes everything that is shared, so it's fine if an earlier file was missed. Opening it on the other phone merges it with what's there; nothing personal is replaced.</p><h3>Household</h3>${cats}` : `<p class="mut">Pick the recipes to send. They'll show on the other phone under <b>Shared with me</b>, where they can be saved.</p>`}<h3>Personal (choose items)</h3>${pers}
<label class="toggle"><span>Include photos already sent</span><span class="sw"><input type="checkbox" id="shAllPh"><span></span></span></label><button class="btn full big" style="margin-top:10px" data-a="shSendGo">Create the file and share</button>${back}</div>`, "share");
  }
  function readSel() {
    const picks = {}; document.querySelectorAll(".shPk").forEach(i => { if (i.checked) { let col = i.dataset.col, v = i.value; if (col === "mine" && v.startsWith("ver:")) { col = "ver"; v = v.slice(4); } (picks[col] = picks[col] || []).push(isNaN(+v) || col === "hist" || col === "ver" ? v : +v); } });
    const cats = sel.kind === "recipes" ? [] : [...document.querySelectorAll(".shCat")].filter(i => i.checked).map(i => i.value);
    for (const [c, , col] of PERS) if ((picks[col] || []).length || (col === "mine" && (picks.ver || []).length)) cats.push(c);
    return { picks, cats, allPhotos: !!($("#shAllPh") || {}).checked };
  }
  A.shSend = () => sendSheet("changes"); A.shRecipes = () => sendSheet("recipes");
  A.shSendGo = async () => {
    const r = readSel(); if (!r.cats.length) { toast("Choose something to share"); return; }
    const e = await H(); if (sel.kind === "changes") await e.setMeta({ picks: r.picks, cats: r.cats.filter(c => CATS.some(x => x[0] === c)) });
    try { const f = await e.exportFile({ kind: sel.kind, cats: r.cats, picks: r.picks, allPhotos: r.allPhotos }); const how = await fileOut(fname(sel.kind === "recipes" ? "recipes" : "household"), f.text, "Rose's EATS household file"); if (how !== "cancelled") { toast(how === "shared" ? "File ready to send" : "File saved to Downloads"); settings(); } } catch (x) { toast(x.message || "Couldn't make the file"); }
  };
  async function quick(kind, cats, txt) {
    sheet(`<div class="d-body" style="padding-top:22px"><h2 class="d-t">Share ${esc(lab(cats[0]).toLowerCase())}</h2><p class="mut">Send a file the other phone can open and merge, or plain text anyone can read in Messages.</p><button class="btn full big" data-a="shQuickFile" data-k="${kind}" data-c="${cats[0]}">As a household file</button><button class="btn full" style="margin-top:8px" data-a="shQuickText" data-k="${kind}">As text</button>${back}</div>`, "share");
  }
  A.shGroc = () => quick("grocery", ["grocery"]); A.shPlan = () => quick("plan", ["plan"]);
  A.shQuickFile = async el => { try { const f = await (await H()).exportFile({ kind: el.dataset.k, cats: [el.dataset.c] }); const how = await fileOut(fname(el.dataset.k), f.text, "Rose's EATS " + el.dataset.k); if (how !== "cancelled") toast("File ready"); } catch (x) { toast(x.message || "Couldn't make the file"); } };
  function groceryText() { let items = []; try { items = (typeof grocery === "function" ? grocery() : []).filter(e => !(S.checked[S.week] || {})[e.key]).map(e => "• " + e.key); } catch (e) {} const ex = (S.extras || []).filter(x => !x.done).map(x => "• " + x.name + (x.amt ? " (" + x.amt + ")" : "")); return "Grocery list\n" + items.concat(ex).join("\n"); }
  function planText() { return "Meal plan\n" + Object.keys(S.plan || {}).sort().filter(d => d >= todayIso()).slice(0, 14).map(d => nice(d) + ": " + (S.plan[d] || []).map(e => rn(e.id)).join(", ")).join("\n"); }
  A.shQuickText = async el => { const t = el.dataset.k === "grocery" ? groceryText() : planText(); try { if (navigator.share) { await navigator.share({ text: t }); return; } } catch (e) { if (e && e.name === "AbortError") return; } copyText(t, "Copied as text"); };
  A.shBackup = () => sheet(`<div class="d-body" style="padding-top:22px"><h2 class="d-t">Household backup</h2><p>One encrypted file with everything on this phone: household data, your personal notes, history, versions and photos, and what others shared with you.</p><p class="mut">To restore it on a new phone: install the app, join with the household code, then open this file. Keep it somewhere safe (Files, iCloud Drive or email to yourself). Without the household code nobody can open it, including you.</p><button class="btn full big" data-a="shBackupGo">Create backup file</button>${back}</div>`, "share");
  A.shBackupGo = async () => { try { const f = await (await H()).exportFile({ kind: "backup", cats: RM.HOUSE.concat(RM.PERSONAL), allPersonal: true, includeOthers: true, allPhotos: true }); const how = await fileOut(fname("backup"), f.text, "Rose's EATS household backup"); if (how !== "cancelled") toast("Backup ready"); } catch (x) { toast(x.message || "Couldn't make the backup"); } };
  /* ---------- open / import ---------- */
  A.shOpen = () => { const i = document.createElement("input"); i.type = "file"; i.accept = ".json,application/json,text/plain"; i.onchange = () => { const f = i.files[0]; if (!f) return; if (f.size > 90e6) { toast("That file is too large"); return; } const rd = new FileReader(); rd.onload = () => readIn(String(rd.result)); rd.readAsText(f); }; i.click(); };
  async function readIn(text, words) {
    try { pending = await (await H()).readFile(text, words ? { words } : null); pending.text = text; previewSheet(); }
    catch (e) {
      const old = e.code === "otherhh";
      sheet(`<div class="d-body" style="padding-top:22px"><h2 class="d-t">Can't open this file</h2><p>${esc(e.message || "Something went wrong.")}</p><p class="mut">Nothing was changed.</p>${old ? `<p class="mut small">If the household code was changed since this file was made, type the old 12 words:</p><textarea class="inp" id="shOld" rows="3" autocomplete="off" autocapitalize="none" spellcheck="false"></textarea><button class="btn full" data-a="shOldGo">Open with the old code</button>` : ""}${back}</div>`, "share");
      if (old) A.shOldGo = () => { const w = $("#shOld").value; $("#shOld").value = ""; readIn(text, w); };
    }
  }
  function previewSheet() {
    const p = pending, pv = p.preview, when = p.created ? new Date(p.created).toLocaleString() : "";
    const rows = Object.values(pv.byCat).map(g => `<li><b>${esc(g.label)}</b>: ${[g.add && g.add + " new", g.chg && g.chg + " changed", g.del && g.del + " removed"].filter(Boolean).join(", ")}</li>`).join("");
    sheet(`<div class="d-body" style="padding-top:22px"><h2 class="d-t">Open household file</h2><p class="mut">From <b>${esc(p.from.member)}</b>${p.from.mine ? " (your own data from another phone)" : ""}${when ? ", made " + esc(when) : ""}.</p>
${p.dup ? `<p class="mut">You've opened this file before.</p>` : ""}${p.old ? `<p class="warn small">This file was made with an older household code. Only continue if you trust where it came from.</p>` : ""}${p.gap ? `<p class="mut small">A file sent before this one wasn't opened here. That's fine for lists and plans; some photos may only come with a later file.</p>` : ""}
${pv.total ? `<p>Opening it will update:</p><ul>${rows}</ul>${pv.others ? `<p class="mut small">${pv.others} personal item${pv.others === 1 ? "" : "s"} shared by ${esc(p.from.member)} will appear under <b>Shared with me</b>. Your own notes and recipes aren't changed.</p>` : ""}${pv.conflicts ? `<p class="warn small">${pv.conflicts} thing${pv.conflicts === 1 ? " was" : "s were"} changed differently on both phones. Both versions are kept until you choose.</p>` : ""}<button class="btn full big" data-a="shImport">Open and merge</button>` : `<p><b>Nothing new</b>: this phone already has everything in this file.</p>`}
<button class="btn ghost full" style="margin-top:8px" data-a="shCancel">Cancel</button></div>`, "share");
  }
  A.shCancel = () => { pending = null; toast("Nothing was changed"); settings(); };
  A.shImport = async el => { if (!pending) return; el.disabled = true; try { const r = await (await H()).applyImport(pending); pending = null; toast(r.changed ? "Merged ♡" : "Nothing new"); render(true); settings(); } catch (e) { el.disabled = false; sheet(`<div class="d-body" style="padding-top:22px"><h2 class="d-t">The file wasn't opened</h2><p>${esc(e.message || "Something went wrong.")}</p><p class="mut">Nothing was changed. You can try again.</p>${back}</div>`, "share"); } };
  /* ---------- conflicts ---------- */
  function describe(c) {
    const [col, a, b] = c.k.split("/"), id = RM.decId(b || a);
    const f = { amt: "amount", name: "name", s: "servings", m: "meal", date: "day", v: "", n: "" }[c.field];
    const what = col === "extra" ? "Grocery item “" + ((S.extras.find(x => x.uid === id) || {}).name || "item") + "”" : col === "plan" ? "Meal plan entry" : col === "inv" ? "Pantry details for " + id : col === "left" ? "Leftovers" : col === "col" ? "Collection name" : col === "bask" ? "Servings to shop for: " + rn(id) : col === "note" ? "Your note on " + rn(id) : col === "ver" ? "Your version of a recipe" : col === "mine" ? "Your recipe" : col === "hist" ? "A cooking-history entry" : col === "photo" ? "Your photo of " + rn(id) : "Item";
    return what + (f ? ": " + f : "");
  }
  const show = v => typeof v === "string" ? (v.startsWith("data:image/") ? "(photo)" : v) : v && typeof v === "object" ? (v.n || v.name || (v.s != null ? v.s + " servings" : "") || "version") : String(v);
  A.shConflicts = async () => {
    const e = await H(), m = await e.meta(), names = { [e.dev.id]: "this phone" }; for (const [d, p] of Object.entries(m.peers || {})) names[d] = p.member;
    const cs = await e.conflicts(); sel = { cs };
    sheet(`<div class="d-body" style="padding-top:22px"><h2 class="d-t">Choose what's right</h2><p class="mut">These were changed differently on two phones before they were shared. Both are kept until you choose; the other phone gets your choice in the next file.</p>${cs.length ? cs.map((c, i) => `<div class="card small"><b>${esc(describe(c))}</b>${c.field === "_del" ? `<p class="mut small">Deleted on one phone and changed on the other.</p><div class="row g8 wrap"><button class="btn sm" data-a="shPick" data-i="${i}" data-v="keep">Keep it</button><button class="btn sm ghost" data-a="shPick" data-i="${i}" data-v="delete">Delete it</button></div>` : `<div class="row g8 wrap" style="margin-top:6px">${c.vals.map((v, j) => `<button class="btn sm ghost" data-a="shPick" data-i="${i}" data-j="${j}">${esc(String(show(v.v)).slice(0, 60))} <span class="mut small">(${esc(names[v.dev] || "other phone")})</span></button>`).join("")}</div>`}</div>`).join("") : `<p>Nothing to choose. ♡</p>`}${back}</div>`, "share");
  };
  A.shPick = async el => { const c = sel.cs[+el.dataset.i]; try { await (await H()).resolve(c.k, c.field, c.field === "_del" ? el.dataset.v : c.vals[+el.dataset.j].v); toast("Saved"); A.shConflicts(); } catch (e) { toast(e.message || "Couldn't save the choice"); } };
  /* ---------- shared with me ---------- */
  A.shGot = async () => {
    const items = await (await H()).received(); sel = { items };
    const by = {}; items.forEach((x, i) => (by[x.member] = by[x.member] || []).push([x, i]));
    const row = ([x, i]) => x.c === "mine" ? `<div class="card small"><b>📖 ${esc(x.v.v && x.v.v.n || "Recipe")}</b><div class="row g8" style="margin-top:6px"><button class="btn sm" data-a="shSaveMine" data-i="${i}">Save to my recipes</button></div></div>`
      : x.c === "note" ? `<div class="card small"><b>📝 ${esc(rn(x.id))}</b><p class="small">${esc(x.v.v)}</p></div>`
      : x.c === "photo" ? `<div class="card small"><b>📷 ${esc(rn(x.id))}</b><img alt="" src="${/^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/]+=*$/.test(x.v.v) ? esc(x.v.v) : ""}" style="width:100%;max-height:220px;object-fit:cover;border-radius:10px;margin-top:6px"></div>`
      : x.c === "hist" ? `<div class="card small"><b>🍽 ${esc(rn(String(x.id).split("|")[0]))}</b> <span class="mut small">${esc(x.v.v && x.v.v.d ? nice(x.v.v.d) : "")}${x.v.v && x.v.v.r ? " · rated " + esc(x.v.v.r) : ""}</span>${x.v.v && x.v.v.n ? `<p class="small">${esc(x.v.v.n)}</p>` : ""}</div>`
      : x.c === "ver" ? `<div class="card small"><b>📖 ${esc((x.v.v && x.v.v.name) || "Version")} of ${esc(rn(x.v.v && x.v.v.base))}</b></div>` : "";
    sheet(`<div class="d-body" style="padding-top:22px"><h2 class="d-t">Shared with me</h2>${Object.keys(by).length ? Object.entries(by).map(([mem, xs]) => `<h3>From ${esc(mem)}</h3>${xs.map(row).join("")}`).join("") : `<p class="mut">Nothing yet. When the other phone shares notes, recipes, history or photos with you, they'll be here.</p>`}${back}</div>`, "share");
  };
  A.shSaveMine = el => { const x = sel.items[+el.dataset.i]; const r = structuredClone(x.v.v); if ((S.mine || []).some(m => m.n === r.n && JSON.stringify(m.ing || m.i) === JSON.stringify(r.ing || r.i))) { toast("You already have this recipe"); return; } r.id = Math.min(-1000, ...(S.mine || []).map(m => +m.id || 0)) - 1; r.from = x.member; S.mine.push(r); save(); if (typeof syncMine === "function") syncMine(); toast("Saved to your recipes"); };
  /* ---------- settings ---------- */
  A.shSet = async () => { const h = await (await H()).household(); sheet(`<div class="d-body" style="padding-top:22px"><h2 class="d-t">Sharing settings</h2>${whoPick("shName", h.member)}<button class="btn sm" style="margin-top:6px" data-a="shRename">Save name</button>
<div class="card small" style="margin-top:12px"><b>Household code</b><p class="mut small">Needed to join a phone and to open backups on a new phone.</p><button class="btn sm ghost" data-a="shShowCode">Show household code</button></div>
<div class="card small"><b>Lost a phone?</b><p class="mut small">Make a new code. Files made with the old code won't open anymore unless the old code is typed. The other phone must join again with the new code (its data stays).</p><button class="btn sm ghost" data-a="shRotate">Make a new household code</button></div>
<div class="card small"><b>Turn off sharing on this phone</b><p class="mut small">All your recipes, lists and photos stay on this phone. Items others shared with you (under Shared with me) are removed from this phone.</p><button class="btn sm ghost" data-a="shLeave">Turn off household sharing</button></div>${back}</div>`, "share"); };
  A.shRename = async () => { const n = ($("#shName").value || "").trim(); if (!n) return; await (await H()).setMember(n); SHARE.setCfg({ ...(SHARE.cfg() || {}), member: n }); toast("Saved"); };
  A.shShowCode = () => confirmDlg("Show the household code?", "Make sure nobody else can see your screen.", "Show it", async () => { const w = await (await H()).words(); if (w) showWords(w, false); });
  A.shRotate = () => confirmDlg("Make a new household code?", "The other phone will need to join again with the new 12 words.", "Make new code", async () => { const r = await (await H()).rotate(); showWords(r.words, true); });
  window.SHAREUI = { readIn, status, card }; /* used by the self-tests */
  A.shLeave = () => confirmDlg("Turn off household sharing?", "Your own data stays on this phone. You can join again later with the household code.", "Turn off", async () => { await SHARE.leave(); toast("Household sharing is off"); settings(); });
})();
