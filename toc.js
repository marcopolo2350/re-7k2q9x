/* Clickable cookbook contents by chapter and section (Phase 5B). Works offline: it reads the library and org.js only.
   Recipe links open the same recipe screen as everywhere else; the library itself is not changed. */
"use strict";
let tocSort = "chapter", tocQ = "";
const tocOrderIds = (ids) => tocSort === "alpha" ? [...ids].sort((a, b) => RID[a].n.localeCompare(RID[b].n)) : ids;
function tocHTML(open) {
  const B = ORG.book();
  const q = SEARCH.norm(tocQ);
  const rows = (ids) => tocOrderIds(ids).filter(id => !q || SEARCH.norm(RID[id].n).includes(q)).map(id => `<button class="prow toc-r" data-a="gOpen" data-id="${id}"><span class="pn">${esc(RID[id].n)}</span><small class="mut">${esc(RID[id].cu || "")}${RID[id].t ? " · " + RID[id].t + " min" : ""}</small></button>`).join("");
  const chs = B.chapters.map(c => {
    const secs = c.secs.map(s => { const body = rows(s.ids); return body ? `<details class="toc-s" ${open || q ? "open" : ""}><summary id="sec-${c.k}-${esc(s.name).replace(/\W+/g, "")}">${esc(s.name)} <span class="mut small">${s.ids.length}</span></summary>${body}</details>` : ""; }).join("");
    return secs ? `<details class="toc-c" id="ch-${c.k}" ${open || q ? "open" : ""}><summary>${c.e} <b>${c.no}. ${esc(c.n)}</b> <span class="mut small">${c.count} recipes</span> <button class="link small" data-a="gChapter" data-k="${c.k}">Open chapter</button></summary>${secs}</details>` : "";
  }).join("");
  return `<div class="d-body" style="padding-top:22px"><h2 class="d-t">Contents</h2>
<p class="mut small">${B.total} recipes in ${B.chapters.length} chapters. Tap a recipe to open it; recipes stay in one place, but every chapter and section can be browsed.</p>
<div class="row g8 wrap" style="margin:8px 0"><button class="chip ${tocSort === "chapter" ? "on" : ""}" data-a="tocSort" data-k="chapter">Chapter order</button><button class="chip ${tocSort === "alpha" ? "on" : ""}" data-a="tocSort" data-k="alpha">A–Z</button><button class="chip" data-a="tocAll" data-k="1">Expand all</button><button class="chip" data-a="tocAll" data-k="0">Collapse all</button><button class="chip" data-a="gSearch">🔎 Search</button><button class="chip" data-a="egypt">🇪🇬 Egyptian collection</button></div>
<input class="inp" id="tocIn" type="search" placeholder="Filter the contents…" value="${esc(tocQ)}" autocomplete="off" data-ch="tocQ" aria-label="Filter the contents">
<div id="tocList" style="margin-top:8px">${chs || '<p class="mut">No recipes match.</p>'}</div></div>`;
}
function openToc(open) { sheet(tocHTML(!!open), "toc"); }
A.tocOpen = () => openToc(false);
A.tocSort = el => { tocSort = el.dataset.k; sheetOpenKeep(false); };
A.tocAll = el => sheetOpenKeep(el.dataset.k === "1");
function sheetOpenKeep(open) { const v = tocQ; sheet(tocHTML(open), "toc"); const i = $("#tocIn"); if (i) i.value = v; }
A.gChapter = el => { closeSheet(); openChapter(el.dataset.k); };
function openChapter(k) {
  const B = ORG.book(), c = B.chapters.find(x => x.k === k); if (!c) { toast("That chapter is empty"); return; }
  sheet(`<div class="d-body" style="padding-top:22px"><div class="kick">Chapter ${c.no} of ${B.chapters.length}</div><h2 class="d-t">${c.e} ${esc(c.n)}</h2><p class="mut">${c.count} recipes</p>
${c.secs.map(s => `<h3>${esc(s.name)} <span class="mut small">${s.ids.length}</span></h3>${tocOrderIds(s.ids).map(id => `<button class="prow" data-a="gOpen" data-id="${id}"><span class="pn">${esc(RID[id].n)}</span><small class="mut">${esc(RID[id].cu || "")}${RID[id].t ? " · " + RID[id].t + " min" : ""}</small></button>`).join("")}`).join("")}
<div class="row g8" style="margin-top:12px"><button class="btn ghost" data-a="tocOpen">‹ All contents</button>${c.no > 1 ? `<button class="btn ghost" data-a="gChapter" data-k="${B.chapters[c.no - 2].k}">‹ Previous chapter</button>` : ""}${c.no < B.chapters.length ? `<button class="btn ghost" data-a="gChapter" data-k="${B.chapters[c.no].k}">Next chapter ›</button>` : ""}</div></div>`, "toc");
}
A.egypt = () => {
  const secs = ORG.egypt(), n = secs.reduce((s, x) => s + x.ids.length, 0);
  sheet(`<div class="d-body" style="padding-top:22px"><div class="kick">Featured collection</div><h2 class="d-t">Egyptian cooking</h2><p class="mut">${n} recipes from the library, grouped by how they're eaten. Each recipe appears here and in its chapter; nothing is copied.</p>
${secs.map(s => `<h3>${esc(s.name)} <span class="mut small">${s.ids.length}</span></h3>${s.ids.map(id => `<button class="prow" data-a="gOpen" data-id="${id}"><span class="pn">${esc(RID[id].n)}</span></button>`).join("")}`).join("")}
<div class="row g8" style="margin-top:12px"><button class="btn ghost" data-a="tocOpen">‹ All contents</button></div></div>`, "toc");
};
/* Cookbook tab: contents and Egyptian entry points above the existing part list */
const _cbView = V.cookbook;
V.cookbook = () => { const h = _cbView(); const bar = `<div class="row g8 wrap" style="margin:8px 0 12px"><button class="chip on" data-a="tocOpen">📑 Contents by chapter</button><button class="chip" data-a="egypt">🇪🇬 Egyptian collection</button><button class="chip" data-a="gSearch">🔎 Search</button></div>`; const i = h.indexOf('<div class="'); return i > 0 ? h.slice(0, i) + bar + h.slice(i) : bar + h; };
let tocT = 0;
document.addEventListener("input", e => {
  if (!e.target || e.target.id !== "tocIn") return;
  tocQ = e.target.value; clearTimeout(tocT);
  tocT = setTimeout(() => { if (!$("#tocIn")) return; const v = tocQ, pos = $("#tocIn").selectionStart; sheetOpenKeep(true); const i = $("#tocIn"); if (i) { i.value = v; i.focus(); try { i.setSelectionRange(pos, pos); } catch (x) {} } }, 150);
});

if (/[?&]selftest=org/.test(location.search)) setTimeout(() => { const b = document.createElement("script"); b.src = "selftest-org.js?v=" + Date.now(); document.body.appendChild(b); }, 1500);
