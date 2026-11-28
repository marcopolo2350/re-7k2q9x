/* Search quick actions, the recipe importer and personal cookbooks. Loaded last.
   Everything here extends the existing pieces: the search sheet, the "our own recipe" form, the animated book and backups.
   Nothing leaves the phone except a link the user asks to read (fetched directly from that site; no proxy, no paid service). */
"use strict";
if (!Array.isArray(S.books)) S.books = [];

/* ================= 1. search: quick actions on every result, and a way back ================= */
let fromSearch = false;
const qa = (a, id, icon, label, on) => `<button class="qa${on ? " on" : ""}" data-a="${a}" data-id="${id}" aria-label="${label}" title="${label}">${ic(icon)}<span>${label}</span></button>`;
const _gHTML = gHTML;
gHTML = function (qs, filt) {
  return _gHTML(qs, filt).replace(/<button class="btn sm ghost" data-a="gPlan" data-id="(-?\d+)">\+ Plan<\/button>/g, (m, id) => {
    id = +id;
    return `<div class="qas">${qa("bookAt", id, "book", "Book")}${qa("cook", id, "pot", "Cook")}${qa("fav", id, "heart", "Favorite", isFav(id))}${qa("bm", id, "bookmark", "Bookmark", isBm(id))}${qa("gPlan", id, "cal", "Plan")}${qa("addMissing", id, "cart", "Shop", inBasket(id))}</div>`;
  }).replace('<div class="prow" style="align-items:center">', '<div class="prow sres">').split('<div class="prow" style="align-items:center">').join('<div class="prow sres">');
};
function searchRefresh() { if (sheetKind !== "search") return; const sc = $("#sheet").scrollTop; const v = gQ; $("#sheetIn").innerHTML = gHTML(v, gFilt); const n = $("#gq"); if (n) n.value = v; $("#sheet").scrollTop = sc; }
["fav", "bm", "addMissing", "basket"].forEach(k => { const o = A[k]; if (o) A[k] = el => { const r = o(el); searchRefresh(); return r; }; });
const _gOpen = A.gOpen; A.gOpen = el => { fromSearch = true; _gOpen(el); };
const _cookQ = A.cook; A.cook = el => { fromSearch = false; return _cookQ(el); };
A.gBack = () => { fromSearch = false; sheet(gHTML(gQ, gFilt), "search"); const n = $("#gq"); if (n) n.value = gQ; };
const _dDetailS = dDetail;
dDetail = function () { const h = _dDetailS.apply(this, arguments); return fromSearch ? `<button class="backres" data-a="gBack">${ic("search")}<span>Back to results for “${esc(gQ)}”</span></button>` + h : h; };
const _closeSheetS = closeSheet; closeSheet = function () { fromSearch = false; return _closeSheetS.apply(this, arguments); };

/* ================= 2. recipe importer ================= */
const normName = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\(.*?\)/g, " ").replace(/\b(the|a|an|easy|best|quick|simple|homemade|classic|my|our|grandma'?s|mom'?s|perfect|ultimate|recipe)\b/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
function findDuplicate(m) {
  const nn = normName(m.n); if (!nn) return null;
  const keys = new Set((m.ing || []).map(x => parseFree(x).item).filter(Boolean));
  let best = null;
  for (const r of RECIPES) {
    if (r.id === m.id) continue;
    const rn = normName(r.n);
    const same = rn === nn;
    let overlap = 0;
    if (keys.size && r.keys && r.keys.length) { const rk = new Set(r.keys); let hit = 0; keys.forEach(k => { if (rk.has(k)) hit++; }); overlap = hit / Math.max(keys.size, rk.size); }
    const near = !same && (rn.includes(nn) || nn.includes(rn)) && Math.min(rn.length, nn.length) >= 6 && overlap >= 0.5;
    if (same || near || overlap >= 0.8 && keys.size >= 4) { const score = (same ? 2 : 0) + overlap; if (!best || score > best.score) best = { r, score, same, overlap }; }
  }
  return best;
}
const _dMineI = dMine;
dMine = function () {
  let h = _dMineI();
  h = h.replace("TikTok link (optional)", "Source link (optional)").replace('placeholder="https://www.tiktok.com/@…" type="url">', 'placeholder="TikTok, Instagram, YouTube or a recipe website" type="url"><button class="btn sm ghost" data-a="impLink" style="margin-top:6px">Read this link</button><div class="mut small">Recipe websites can often be read automatically. TikTok, Instagram and YouTube only share a title, so paste the caption above for the ingredients.</div>');
  const fam = `<div class="fl"><label>Whose recipe is it? (optional)</label><input class="inp" id="mFrom" value="${esc(md.from || "")}" placeholder="Grandma Samia, Aunt Mona…" maxlength="60"></div>
<div class="fl"><label>Family notes or the story behind it (optional)</label><textarea class="inp" id="mStory" rows="3" placeholder="She made this every Eid…" maxlength="600">${esc(md.story || "")}</textarea></div>`;
  return h.replace('<div class="fl"><label>Ingredients', fam + '<div class="fl"><label>Ingredients');
};
const _readMineFormI = readMineForm;
readMineForm = function () { _readMineFormI(); const f = $("#mFrom"), s = $("#mStory"); if (f) md.from = f.value.trim(); if (s) md.story = s.value.trim(); };
const _mineSaveI = A.mineSave;
A.mineSave = () => {
  readMineForm();
  if (!md.id && !md._dupOk && md.n && md.ing.length) {
    const d = findDuplicate(md);
    if (d) {
      const keep = { ...md };
      confirmDlg(`“${d.r.n}” is already in the cookbook`, d.same ? "A recipe with the same name is already here. You can open it, or save yours as a separate recipe." : `It has a similar name and ${Math.round(d.overlap * 100)}% of the same ingredients. You can save yours as a separate recipe.`, "Save mine anyway",
        () => { md = keep; md._dupOk = 1; sheet(dMine(), "mine"); A.mineSave(); });
      const box = document.querySelector("#sheetIn") || document.body;
      setTimeout(() => { const ok = [...document.querySelectorAll("button")].find(b => b.textContent === "Save mine anyway"); if (ok && !document.getElementById("dupOpen")) { const b = document.createElement("button"); b.id = "dupOpen"; b.className = "btn ghost full"; b.style.marginTop = "8px"; b.textContent = "Open the existing recipe"; b.onclick = () => { closeSheet(); openDetail(d.r.id); }; ok.parentNode.appendChild(b); } }, 30);
      return;
    }
  }
  const from = md.from || "", story = md.story || "", src = md.tk || "";
  _mineSaveI();
  const rec = (S.mine || []).find(x => x.id === md.id);
  if (rec && (from || story || rec.from || rec.story)) { rec.from = from.slice(0, 60); rec.story = story.slice(0, 600); if (src) rec.src = src; save(); syncMine(); }
};
const _mineToRI = mineToR;
mineToR = function (m) {
  const r = _mineToRI(m);
  if (m.from) { r.from = m.from; r.gf = "Family recipe from " + m.from; if (!m.d) r.d = "From " + m.from + "."; }
  if (m.story) { r.story = m.story; if (!m.d) r.d = m.story.slice(0, 200); }
  return r;
};
/* reading a link */
const isoMin = s => { const m = String(s || "").match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/); return m ? (+m[1] || 0) * 1440 + (+m[2] || 0) * 60 + (+m[3] || 0) : 0; };
const txt = h => { const d = document.createElement("textarea"); d.innerHTML = String(h || "").replace(/<[^>]+>/g, " "); return d.value.replace(/\s+/g, " ").trim(); };
function ldRecipe(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const all = [];
  doc.querySelectorAll('script[type="application/ld+json"]').forEach(s => { try { const j = JSON.parse(s.textContent); (Array.isArray(j) ? j : [j]).forEach(x => { all.push(x); (x["@graph"] || []).forEach(g => all.push(g)); }); } catch (e) {} });
  const isR = x => x && [].concat(x["@type"] || []).some(t => /recipe/i.test(t));
  const R = all.find(isR); if (!R) return null;
  const steps = []; const walk = x => { if (!x) return; if (typeof x === "string") { txt(x).split(/(?<=\.)\s+(?=[A-Z])/).forEach(s => s && steps.push(s)); return; } if (Array.isArray(x)) return x.forEach(walk); if (x.itemListElement) return walk(x.itemListElement); if (x.text) steps.push(txt(x.text)); else if (x.name) steps.push(txt(x.name)); };
  walk(R.recipeInstructions);
  const y = String([].concat(R.recipeYield || [])[0] || "").match(/\d+/);
  return { n: txt(R.name).slice(0, 80), ing: [].concat(R.recipeIngredient || R.ingredients || []).map(txt).filter(Boolean).slice(0, 60), st: steps.filter(Boolean).slice(0, 40), t: isoMin(R.totalTime) || isoMin(R.cookTime) + isoMin(R.prepTime), s: y ? +y[0] : 0, d: txt(R.description).slice(0, 200) };
}
A.impLink = async () => {
  readMineForm();
  const u = (md.tk || "").trim();
  if (!/^https:\/\/\S+$/.test(u)) { toast("Paste a link that starts with https:// first"); return; }
  const host = (() => { try { return new URL(u).hostname.replace(/^www\.|^m\./, ""); } catch (e) { return ""; } })();
  const done = msg => { sheet(dMine(), "mine"); toast(msg); };
  try {
    if (/tiktok\.com$/.test(host)) { const r = await fetch("https://www.tiktok.com/oembed?url=" + encodeURIComponent(u)); const j = r.ok ? await r.json() : {}; if (j.title && !md.n) md.n = String(j.title).slice(0, 80); return done(j.title ? "Link saved and named. TikTok doesn't share ingredients, so paste the caption above." : "Link saved. Paste the caption above for the ingredients."); }
    if (/youtube\.com$|youtu\.be$/.test(host)) { const r = await fetch("https://www.youtube.com/oembed?format=json&url=" + encodeURIComponent(u)); const j = r.ok ? await r.json() : {}; if (j.title && !md.n) md.n = String(j.title).slice(0, 80); return done(j.title ? "Link saved and named. Paste the video description above for the ingredients." : "Link saved. Paste the video description above for the ingredients."); }
    if (/instagram\.com$/.test(host)) return done("Link saved. Instagram doesn't let apps read posts, so copy the caption and paste it above.");
    const r = await fetch(u, { mode: "cors", credentials: "omit" });
    if (!r.ok) throw new Error("status " + r.status);
    const p = ldRecipe(await r.text());
    if (!p || !p.ing.length) return done("That page has no recipe this app can read. Copy the recipe text and paste it above.");
    if (p.n) md.n = p.n; md.ing = p.ing; if (p.st.length) md.st = p.st; if (p.t) md.t = p.t; if (p.s) md.s = p.s; if (p.d && !md.d) md.d = p.d;
    done(`Read ${p.ing.length} ingredients and ${p.st.length} steps. Check everything, then save.`);
  } catch (e) { done("That website doesn't let other apps read its pages. Open it, copy the recipe and paste it above."); }
};
/* entry points */
A.impNew = () => openMine(0);

/* ================= 3. personal cookbooks ================= */
let MYB = null, MBE = 0;
const bookById = id => S.books.find(b => b.id === id);
const COVERS = [["classic", "Cream"], ["terracotta", "Terracotta"], ["olive", "Olive"], ["ink", "Ink"]];
function coverHTML(b, small) {
  const st = b.cover || "classic";
  return `<div class="mbcover mbc-${st}${small ? " sm" : ""}">${b.img ? `<i style="background-image:url('${b.img}')"></i>` : ""}<div class="mbc-in"><span class="mbc-k">A Rose's EATS cookbook</span><b>${esc(b.title || "Untitled")}</b>${b.sub ? `<span class="mbc-s">${esc(b.sub)}</span>` : ""}<span class="mbc-r"></span><span class="mbc-n">${bookCount(b)} recipes</span></div></div>`;
}
const bookCount = b => b.chapters.reduce((s, c) => s + c.ids.filter(id => RID[id]).length, 0);
function mbList() {
  return `<div class="d-body" style="padding-top:22px"><div class="kick">Your own</div><h2 class="d-t">My cookbooks</h2>
<p class="mut">Make a cookbook from any recipes: family recipes, your own and favorites from the library. It opens in the page-turning book and prints as a PDF.</p>
${S.books.length ? S.books.map(b => `<div class="mbrow">${coverHTML(b, 1)}<div class="mbrow-t"><b>${esc(b.title)}</b><span class="mut small">${b.chapters.length} chapter${b.chapters.length === 1 ? "" : "s"} · ${bookCount(b)} recipes</span><div class="row g8 wrap"><button class="btn sm" data-a="mbRead" data-id="${b.id}">Open the book</button><button class="btn sm ghost" data-a="mbEdit" data-id="${b.id}">Edit</button><button class="btn sm ghost" data-a="mbPdf" data-id="${b.id}">PDF</button></div></div></div>`).join("") : `<p class="mbempty">No cookbooks yet.</p>`}
<button class="btn full big" data-a="mbNew">Start a new cookbook</button>
<div class="row g8 wrap" style="margin-top:10px"><button class="btn sm ghost" data-a="mbImport">Open a cookbook file</button></div></div>`;
}
function mbEditor() {
  const b = bookById(MBE); if (!b) return mbList();
  const pick = mbPickHTML(b);
  return `<div class="d-body" style="padding-top:22px"><button class="backres" data-a="mbHome">${ic("book")}<span>All my cookbooks</span></button>
${coverHTML(b)}
<div class="fl"><label>Title</label><input class="inp" id="mbTitle" value="${esc(b.title)}" maxlength="60"></div>
<div class="fl"><label>Subtitle (optional)</label><input class="inp" id="mbSub" value="${esc(b.sub || "")}" maxlength="80" placeholder="Recipes from our kitchen"></div>
<div class="fl"><label>Dedication (optional)</label><textarea class="inp" id="mbDed" rows="3" maxlength="400" placeholder="For Mama, who taught us all of these.">${esc(b.ded || "")}</textarea></div>
<div class="fl"><label>Cover</label><div class="row g8 wrap">${COVERS.map(([k, n]) => `<button class="chip ${(b.cover || "classic") === k ? "on" : ""}" data-a="mbCover" data-k="${k}">${n}</button>`).join("")}<label class="chip">${b.img ? "Change photo" : "Add a photo"}<input type="file" accept="image/*" id="mbImg" style="display:none"></label>${b.img ? `<button class="chip" data-a="mbImgDel">Remove photo</button>` : ""}</div></div>
<h3 class="mbh">Chapters</h3>
${b.chapters.map((c, ci) => `<div class="mbch"><div class="mbch-h"><span class="mbch-no">${ci + 1}</span><input class="inp" data-mbch="${ci}" value="${esc(c.name)}" maxlength="50" aria-label="Chapter name"><button class="ib" data-a="mbChMove" data-i="${ci}" data-d="-1" aria-label="Move chapter up" ${ci ? "" : "disabled"}>${ic("up")}</button><button class="ib" data-a="mbChMove" data-i="${ci}" data-d="1" aria-label="Move chapter down" ${ci < b.chapters.length - 1 ? "" : "disabled"}>${ic("down")}</button><button class="ib" data-a="mbChDel" data-i="${ci}" aria-label="Delete chapter">${ic("x")}</button></div>
${c.ids.filter(id => RID[id]).map((id, ri) => `<div class="mbr"><span class="mbr-n">${esc(RID[id].n)}${RID[id].mine ? ` <small>${RID[id].from ? "family" : "ours"}</small>` : ""}</span><button class="ib" data-a="mbRMove" data-i="${ci}" data-j="${ri}" data-d="-1" aria-label="Move up" ${ri ? "" : "disabled"}>${ic("up")}</button><button class="ib" data-a="mbRMove" data-i="${ci}" data-j="${ri}" data-d="1" aria-label="Move down" ${ri < c.ids.length - 1 ? "" : "disabled"}>${ic("down")}</button><button class="ib" data-a="mbRDel" data-i="${ci}" data-j="${ri}" aria-label="Remove">${ic("x")}</button></div>
<textarea class="inp mbnote" data-mbnote="${id}" rows="1" placeholder="Cooking note for this recipe (optional)">${esc(S.notes[id] || "")}</textarea>`).join("") || `<p class="mut small">No recipes in this chapter yet.</p>`}</div>`).join("")}
<button class="btn sm ghost" data-a="mbChAdd">Add a chapter</button>
<h3 class="mbh">Add recipes</h3>${pick}
<div class="mbfoot"><button class="btn full big" data-a="mbRead" data-id="${b.id}">Open the book</button><div class="row g8 wrap" style="margin-top:8px"><button class="btn sm ghost" data-a="mbPdf" data-id="${b.id}">Print or save as PDF</button><button class="btn sm ghost" data-a="mbExport" data-id="${b.id}">Save a cookbook file</button><button class="btn sm ghost" data-a="mbDel" data-id="${b.id}">Delete cookbook</button></div></div></div>`;
}
let mbQ = "", mbTo = 0;
function mbPickHTML(b) {
  if (!b.chapters.length) return `<p class="mut small">Add a chapter first.</p>`;
  const inBook = new Set(b.chapters.flatMap(c => c.ids));
  const q = normName(mbQ);
  const list = q ? RECIPES.filter(r => normName(r.n).includes(q)).slice(0, 25) : [];
  return `<div class="row g8 wrap"><select class="inp" id="mbTo" style="flex:1">${b.chapters.map((c, i) => `<option value="${i}" ${mbTo === i ? "selected" : ""}>Into: ${esc(c.name)}</option>`).join("")}</select></div>
<input class="inp" id="mbQ" type="search" placeholder="Search recipes to add" value="${esc(mbQ)}" autocomplete="off" style="margin-top:8px">
<div class="row g8 wrap" style="margin-top:8px"><button class="chip" data-a="mbAddSet" data-k="mine">All our own recipes (${(S.mine || []).length})</button><button class="chip" data-a="mbAddSet" data-k="fav">All favorites (${S.fav.filter(id => RID[id]).length})</button><button class="chip" data-a="impNew">Write a new recipe</button></div>
<div id="mbRes">${list.map(r => `<button class="mbpick ${inBook.has(r.id) ? "in" : ""}" data-a="mbAdd" data-id="${r.id}"><span>${esc(r.n)}</span><small>${inBook.has(r.id) ? "In the book" : "Add"}</small></button>`).join("")}${q && !list.length ? `<p class="mut small">No recipes match.</p>` : ""}</div>`;
}
function mbShow() { const sc = $("#sheet") ? $("#sheet").scrollTop : 0; sheet(MBE ? mbEditor() : mbList(), "mybooks"); if ($("#sheet")) $("#sheet").scrollTop = sc; }
const mbB = () => bookById(MBE);
A.mbHome = () => { MBE = 0; mbShow(); };
A.myBooks = () => { MBE = 0; sheet(mbList(), "mybooks"); };
A.mbNew = () => { const id = Date.now(); S.books.push({ id, title: "Our Family Cookbook", sub: "", ded: "", cover: "classic", img: "", chapters: [{ name: "Family favorites", ids: [] }] }); save(); MBE = id; mbQ = ""; mbTo = 0; sheet(mbEditor(), "mybooks"); };
A.mbEdit = el => { MBE = +el.dataset.id; mbQ = ""; mbTo = 0; sheet(mbEditor(), "mybooks"); };
A.mbCover = el => { mbB().cover = el.dataset.k; save(); mbShow(); };
A.mbImgDel = () => { mbB().img = ""; save(); mbShow(); };
A.mbChAdd = () => { const b = mbB(); b.chapters.push({ name: "Chapter " + (b.chapters.length + 1), ids: [] }); mbTo = b.chapters.length - 1; save(); mbShow(); };
A.mbChDel = el => { const b = mbB(), i = +el.dataset.i, c = b.chapters[i]; const go = () => { b.chapters.splice(i, 1); mbTo = 0; save(); mbShow(); }; if (c.ids.length) confirmDlg("Delete the chapter “" + c.name + "”?", "Its recipes are taken out of this cookbook. The recipes themselves are not deleted.", "Delete chapter", () => { go(); }); else go(); };
const mv = (a, i, d) => { const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; };
A.mbChMove = el => { mv(mbB().chapters, +el.dataset.i, +el.dataset.d); save(); mbShow(); };
A.mbRMove = el => { mv(mbB().chapters[+el.dataset.i].ids, +el.dataset.j, +el.dataset.d); save(); mbShow(); };
A.mbRDel = el => { mbB().chapters[+el.dataset.i].ids.splice(+el.dataset.j, 1); save(); mbShow(); };
A.mbAdd = el => { const b = mbB(), id = +el.dataset.id; if (b.chapters.some(c => c.ids.includes(id))) { toast("Already in this cookbook"); return; } (b.chapters[mbTo] || b.chapters[0]).ids.push(id); save(); toast("Added " + RID[id].n); mbShow(); };
A.mbAddSet = el => { const b = mbB(), c = b.chapters[mbTo] || b.chapters[0], have = new Set(b.chapters.flatMap(x => x.ids)); const ids = (el.dataset.k === "mine" ? (S.mine || []).map(m => m.id) : S.fav).filter(id => RID[id] && !have.has(id)); c.ids.push(...ids); save(); toast(ids.length ? `Added ${ids.length} recipe${ids.length === 1 ? "" : "s"}` : "Nothing new to add"); mbShow(); };
A.mbDel = el => { const b = bookById(+el.dataset.id); confirmDlg("Delete “" + b.title + "”?", "Only this cookbook is deleted. Every recipe stays in the main cookbook.", "Delete cookbook", () => { S.books = S.books.filter(x => x !== b); MBE = 0; save(); sheet(mbList(), "mybooks"); }); };
document.addEventListener("input", e => {
  const t = e.target; if (!t || !MBE || !mbB()) return; const b = mbB();
  if (t.id === "mbTitle") { b.title = t.value.slice(0, 60); save(); }
  else if (t.id === "mbSub") { b.sub = t.value.slice(0, 80); save(); }
  else if (t.id === "mbDed") { b.ded = t.value.slice(0, 400); save(); }
  else if (t.dataset && t.dataset.mbch != null) { b.chapters[+t.dataset.mbch].name = t.value.slice(0, 50) || "Untitled chapter"; save(); }
  else if (t.dataset && t.dataset.mbnote) { const id = +t.dataset.mbnote; if (t.value.trim()) S.notes[id] = t.value.slice(0, 500); else delete S.notes[id]; save(); }
  else if (t.id === "mbQ") { mbQ = t.value; const r = $("#mbRes"); if (r) { const tmp = document.createElement("div"); tmp.innerHTML = mbPickHTML(b); r.innerHTML = tmp.querySelector("#mbRes").innerHTML; } }
});
document.addEventListener("change", e => {
  const t = e.target; if (!t) return;
  if (t.id === "mbTo") mbTo = +t.value;
  if (t.id === "mbImg" && t.files[0] && mbB()) { shrink(t.files[0], 900).then(u => { mbB().img = u; save(); mbShow(); }).catch(() => toast("That photo couldn't be read")); }
});
function shrink(file, max) { return new Promise((ok, no) => { const rd = new FileReader(); rd.onerror = no; rd.onload = () => { const im = new Image(); im.onerror = no; im.onload = () => { const k = Math.min(1, max / Math.max(im.width, im.height)); const c = document.createElement("canvas"); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); ok(c.toDataURL("image/jpeg", 0.78)); }; im.src = rd.result; }; rd.readAsDataURL(file); }); }

/* --- reading a personal cookbook in the real animated book --- */
const _bookListMB = bookList;
bookList = function (part) { if (MYB && !part) { return MYB.chapters.flatMap(c => c.ids).map(id => RID[id]).filter(Boolean); } return _bookListMB(part); };
const _chapterStartsMB = chapterStarts;
chapterStarts = function () {
  if (!MYB) return _chapterStartsMB();
  let k = 0; return MYB.chapters.map((c, i) => { const ids = c.ids.filter(id => RID[id]); const x = { c: { k: "my" + i, n: c.name, no: i + 1, count: ids.length, secs: [{ name: c.name, ids }] }, i: k, secs: [] }; k += ids.length; return x; }).filter(x => x.c.count);
};
const _bookTocMB = bookTocHTML;
bookTocHTML = function () {
  if (!MYB) return _bookTocMB();
  const CS = chapterStarts(); let n = 0;
  return `<div class="scr btoc"><div class="kick">Contents</div><h2>${esc(MYB.title)}</h2>${MYB.sub ? `<p class="btoc-lead">${esc(MYB.sub)}</p>` : ""}
${CS.map(x => `<div class="tch mytch"><button class="tch-go" data-a="bkGo" data-i="${pageOf(x.i)}"><span class="tch-no">${x.c.no}</span><span class="tch-n">${esc(x.c.n)}</span><span class="tch-c">${pageOf(x.i) + 1}</span></button>${x.c.secs[0].ids.map((id, j) => `<button class="tsec" data-a="bkGo" data-i="${pageOf(x.i + j)}"><span>${esc(RID[id].n)}</span><span>${pageOf(x.i + j) + 1}</span></button>`).join("")}</div>`).join("")}</div>`;
};
const _bookPagesMB = bookPages;
bookPages = function () {
  const h = _bookPagesMB(); if (!MYB) return h;
  const P = h.split(/(?=<div class="bpg )/);
  P[0] = pw("R", `<div class="cover mycover">${coverHTML(MYB)}</div>`, 1);
  P[1] = pw("L", `<div class="endp myded">${MYB.ded ? `<div class="ded-k">Dedication</div><p class="ded">${esc(MYB.ded).replace(/\n/g, "<br>")}</p>` : `<div class="ded-k">This book belongs to</div><p class="ded">Our kitchen</p>`}</div>`, 0, "");
  return P.join("");
};
A.mbRead = el => { const b = bookById(+el.dataset.id); if (!b || !bookCount(b)) { toast("Add a recipe to this cookbook first"); return; } MYB = b; _CS = null; closeSheet(); openBook(0); };
const _closeBookMB = closeBook;
closeBook = function () { const was = MYB; MYB = null; _CS = null; const r = _closeBookMB.apply(this, arguments); if (was) { MBE = was.id; sheet(mbEditor(), "mybooks"); } return r; };
const _saveResumeMB = saveResume; saveResume = function () { if (MYB) return; return _saveResumeMB.apply(this, arguments); };

/* --- printable PDF (the phone's own Print → Save as PDF) --- */
function printHTML(b) {
  const CH = b.chapters.map(c => ({ name: c.name, rs: c.ids.map(id => RID[id]).filter(Boolean) })).filter(c => c.rs.length);
  const rec = r => { const u = realImg(r); return `<section class="pr-rec" id="pr-${r.id}">${u ? `<img class="pr-img" src="${u}" alt="">` : ""}<div class="pr-kick">${esc(r.from ? "From " + r.from : r.cu || (CATS[r.c] ? CATS[r.c].n : ""))}</div><h2>${esc(r.n)}</h2>${r.d ? `<p class="pr-d">${esc(r.d)}</p>` : ""}<p class="pr-meta">Serves ${r.s} · ${r.t >= 120 ? Math.round(r.t / 60) + " hours" : r.t + " minutes"}</p><div class="pr-cols"><div><h3>Ingredients</h3><ul>${ingLi(r, r.s)}</ul></div><div><h3>Method</h3><ol>${r.st.map(s => `<li>${esc(s)}</li>`).join("")}</ol></div></div>${r.story ? `<div class="pr-note"><b>The story</b> ${esc(r.story)}</div>` : ""}${S.notes[r.id] ? `<div class="pr-note"><b>Our notes</b> ${esc(S.notes[r.id])}</div>` : ""}</section>`; };
  return `<section class="pr-cover">${coverHTML(b)}</section>${b.ded ? `<section class="pr-ded"><p>${esc(b.ded).replace(/\n/g, "<br>")}</p></section>` : ""}
<section class="pr-toc"><h1>Contents</h1>${CH.map((c, i) => `<div class="pr-tc"><b>${i + 1}. ${esc(c.name)}</b>${c.rs.map(r => `<a href="#pr-${r.id}">${esc(r.n)}</a>`).join("")}</div>`).join("")}</section>
${CH.map((c, i) => `<section class="pr-chap"><span>Chapter ${i + 1}</span><h1>${esc(c.name)}</h1></section>${c.rs.map(rec).join("")}`).join("")}`;
}
A.mbPdf = el => {
  const b = bookById(+el.dataset.id); if (!b || !bookCount(b)) { toast("Add a recipe to this cookbook first"); return; }
  let p = $("#printBook"); if (!p) { p = document.createElement("div"); p.id = "printBook"; document.body.appendChild(p); }
  p.innerHTML = printHTML(b); document.body.classList.add("printing");
  const t = document.title; document.title = b.title;
  const end = () => { document.body.classList.remove("printing"); document.title = t; window.removeEventListener("afterprint", end); };
  window.addEventListener("afterprint", end);
  setTimeout(() => { try { window.print(); } catch (e) { end(); toast("Printing isn't available here"); } }, 60);
};

/* --- portable cookbook file: the book plus copies of the personal recipes in it --- */
A.mbExport = el => {
  const b = bookById(+el.dataset.id); if (!b) return;
  const ids = new Set(b.chapters.flatMap(c => c.ids));
  const mine = (S.mine || []).filter(m => ids.has(m.id));
  const blob = new Blob([JSON.stringify({ kind: "roses-eats-cookbook", v: 1, book: b, mine, notes: Object.fromEntries([...ids].filter(id => S.notes[id]).map(id => [id, S.notes[id]])) }, null, 1)], { type: "application/json" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = (b.title || "cookbook").replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-") + ".cookbook.json"; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  toast("Cookbook file saved");
};
function importCookbook(text) {
  const o = JSON.parse(text);
  if (!o || o.kind !== "roses-eats-cookbook" || !o.book || !Array.isArray(o.book.chapters)) throw new Error("not a cookbook file");
  const map = {};
  S.mine = S.mine || [];
  for (const m of o.mine || []) {
    if (!m || !m.n || !Array.isArray(m.ing)) continue;
    const same = S.mine.find(x => x.n === m.n && JSON.stringify(x.ing) === JSON.stringify(m.ing));
    if (same) { map[m.id] = same.id; continue; }
    const id = 1000 + S.mine.reduce((a, x) => Math.max(a, x.id - 1000), 0) + 1;
    S.mine.push({ id, n: String(m.n).slice(0, 80), c: m.c, t: +m.t || 30, s: +m.s || 4, d: String(m.d || "").slice(0, 200), ing: m.ing.slice(0, 60).map(String), st: (m.st || []).slice(0, 40).map(String), img: /^data:image\//.test(m.img || "") ? m.img : "", from: String(m.from || "").slice(0, 60), story: String(m.story || "").slice(0, 600) });
    map[m.id] = id;
  }
  syncMine();
  const B = o.book;
  const nb = { id: Date.now(), title: String(B.title || "Cookbook").slice(0, 60), sub: String(B.sub || "").slice(0, 80), ded: String(B.ded || "").slice(0, 400), cover: COVERS.some(c => c[0] === B.cover) ? B.cover : "classic", img: /^data:image\//.test(B.img || "") ? B.img : "",
    chapters: B.chapters.slice(0, 40).map(c => ({ name: String(c.name || "Chapter").slice(0, 50), ids: (c.ids || []).map(id => map[id] || id).filter(id => RID[id]) })) };
  for (const [id, n] of Object.entries(o.notes || {})) { const k = map[id] || +id; if (RID[k] && !S.notes[k]) S.notes[k] = String(n).slice(0, 500); }
  S.books.push(nb); save(); return nb;
}
A.mbImport = () => { const i = document.createElement("input"); i.type = "file"; i.accept = ".json,application/json"; i.onchange = () => { const f = i.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { try { const nb = importCookbook(rd.result); MBE = nb.id; sheet(mbEditor(), "mybooks"); toast("Opened “" + nb.title + "”"); } catch (e) { toast("That file isn't a Rose's EATS cookbook"); } }; rd.readAsText(f); }; i.click(); };

/* backups made with the text code keep cookbooks and family details too */
const _cleanImportMB = cleanImport;
cleanImport = function (t) {
  const f = _cleanImportMB(t);
  let o = null; try { const s = (t || "").trim(); o = s.startsWith("ROSESEATS1:") ? JSON.parse(decodeURIComponent(escape(atob(s.slice(11))))) : JSON.parse(s); if (o && o.state) o = o.state; } catch (e) { return f; }
  if (Array.isArray(o.books)) f.books = o.books.filter(b => b && Array.isArray(b.chapters)).map(b => ({ id: +b.id || Date.now(), title: String(b.title || "Cookbook").slice(0, 60), sub: String(b.sub || "").slice(0, 80), ded: String(b.ded || "").slice(0, 400), cover: COVERS.some(c => c[0] === b.cover) ? b.cover : "classic", img: /^data:image\//.test(b.img || "") ? b.img : "", chapters: b.chapters.map(c => ({ name: String(c.name || "Chapter").slice(0, 50), ids: (c.ids || []).map(Number).filter(Number.isFinite) })) }));
  if (Array.isArray(o.mine) && Array.isArray(f.mine)) f.mine.forEach(m => { const src = o.mine.find(x => x && x.id === m.id); if (src) { if (src.from) m.from = String(src.from).slice(0, 60); if (src.story) m.story = String(src.story).slice(0, 600); } });
  return f;
};

/* ================= 4. typographic covers composed by kind of dish ================= */
const _artF = art;
art = function (r, cls) {
  const h = _artF(r, cls);
  if (!r || h.indexOf('class="art cover') < 0) return h;
  let k = "main"; try { k = ORG.place(r).ch; } catch (e) {}
  const kind = r.cu === "Egyptian" ? "egypt" : r.mine ? "family" : { soups: "soup", desserts: "sweet", baking: "sweet", drinks: "drink", breakfast: "morning", salads: "fresh", veg: "fresh", sides: "fresh", apps: "small", sauces: "small" }[k] || (r.c === "comfort" ? "comfort" : "main");
  return h.replace('class="art cover', 'class="art cover k-' + kind);
};

/* ================= 5. entry points on the Cookbook screen ================= */
const _vCookbookF = V.cookbook;
V.cookbook = function () {
  const h = _vCookbookF.apply(this, arguments);
  const bar = `<div class="cbtools"><button class="cbtool" data-a="gSearch">${ic("search")}<span>Search</span></button><button class="cbtool" data-a="impNew">${ic("plus")}<span>Add a recipe</span></button><button class="cbtool" data-a="myBooks">${ic("book")}<span>My cookbooks</span></button></div>`;
  return bar + h;
};
if (tab === "cookbook") render(true);

/* in the test environment, finished self-test results are also written into the page (for headless browser runs) */
if (/[?&]selftest=/.test(location.search) && /[?&]testenv=1/.test(location.search)) {
  const iv = setInterval(() => { const k = Object.keys(window).find(k => /^__\w*test$/.test(k) && window[k] && window[k].pass !== undefined && window[k].total !== undefined || /^__\w*test$/.test(k) && window[k] && window[k].fail !== undefined && window[k].pass !== undefined && !window[k].running); if (!k) return; clearInterval(iv); const t = window[k]; const p = document.createElement("pre"); p.id = "testout"; p.hidden = true; p.textContent = JSON.stringify({ suite: k, pass: t.pass, fail: t.fail, failed: (t.results || t.tests || []).filter(x => x.pass === false || x.ok === false).map(x => (x.name || x.n) + (x.info ? " :: " + x.info : "")) }); document.body.appendChild(p); }, 500);
}
if (/[?&]selftest=finish/.test(location.search)) setTimeout(() => { const s = document.createElement("script"); s.src = "selftest-finish.js?v=" + Date.now(); document.body.appendChild(s); }, 1500);
