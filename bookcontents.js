/* The animated book becomes the primary cookbook:
   - the whole book is ordered by chapter and section (the same order as the Contents),
   - page 3 is a clickable Contents: chapters jump to their first page, sections expand and jump too,
   - the first recipe of each chapter carries a chapter divider,
   - the top-bar picker lists every recipe grouped by chapter, and a Contents button is always there,
   - recipes chosen in the Contents sheet open in the book, not in a separate recipe screen.
   Page arithmetic (two pages per recipe after the front matter) is unchanged. Loaded after nav.js. */
function bookList(part) {
  if (part) return RECIPES.filter(r => r.p === part);
  FLAT = null; _CS = null; /* rebuild so personal recipes added since are included */
  const ids = flatBook().map(x => x.id), seen = new Set(ids);
  return ids.map(id => RID[id]).filter(Boolean).concat(RECIPES.filter(r => !seen.has(r.id)));
}
let _CS = null;
function chapterStarts() {
  if (_CS) return _CS;
  const B = ORG.book(); let k = 0; const out = _CS = [];
  B.chapters.forEach(c => { const secs = []; let sk = k; c.secs.forEach(s => { secs.push({ name: s.name, i: sk, n: s.ids.length }); sk += s.ids.length; }); out.push({ c, i: k, secs }); k += c.count; });
  return out;
}
function bookTocHTML() {
  const CS = chapterStarts();
  return `<div class="scr btoc"><div class="kick">Contents</div><h2>The Cookbook</h2>
<p class="btoc-lead">${RECIPES.length} recipes in ${CS.length} chapters. Tap a chapter to go there; open it to see its sections.</p>
${CS.map(x => `<details class="tch"><summary><button class="tch-go" data-a="bkGo" data-i="${pageOf(x.i)}"><span class="tch-no">${x.c.no}</span><span class="tch-n">${esc(x.c.n)}</span></button><span class="tch-c">${x.c.count}</span></summary>${x.secs.map(s => `<button class="tsec" data-a="bkGo" data-i="${pageOf(s.i)}"><span>${esc(s.name)}</span><span>${s.n}</span></button>`).join("")}</details>`).join("")}
<div class="btoc-more"><button data-a="tocOpen">A–Z index and search</button><button data-a="egypt">Egyptian collection</button></div></div>`;
}
function chapDivHTML(r, k) {
  if (bookPart) return "";
  const x = chapterStarts().find(x => x.i === k);
  return x ? `<div class="chdiv"><small>Chapter ${x.c.no}</small><b>${esc(x.c.n)}</b></div>` : "";
}
const _fillJumpBook = fillJump;
fillJump = function () {
  if (bookPart) return _fillJumpBook();
  const CS = chapterStarts();
  $("#bkJump").innerHTML = `<option value="0">Cover</option><option value="2">Contents</option>` + CS.map(x => `<optgroup label="${x.c.no}. ${esc(x.c.n)}">${x.c.secs.flatMap(s => s.ids).map((id, j) => `<option value="${pageOf(x.i + j)}">${esc(RID[id] ? RID[id].n : "")}</option>`).join("")}</optgroup>`).join("");
};
/* persistent Contents button in the book's top bar */
(function () {
  const j = document.getElementById("bkJump"); if (!j || document.getElementById("bkToc")) return;
  const b = document.createElement("button"); b.id = "bkToc"; b.className = "bk-toc"; b.setAttribute("data-a", "bkGo"); b.setAttribute("data-i", "2"); b.textContent = "Contents";
  j.parentNode.insertBefore(b, j);
})();
/* Contents sheet: recipe rows and "Open chapter" take you into the book */
const _tocHTMLBook = tocHTML;
tocHTML = function () {
  const CS = chapterStarts();
  return _tocHTMLBook.apply(this, arguments)
    .replace(/data-a="gOpen" data-id="(\d+)"/g, 'data-a="bookAt" data-id="$1"')
    .replace(/data-a="gChapter" data-k="([^"]+)"/g, (m, k) => { const x = CS.find(x => x.c.k === k); const first = x && x.c.secs[0] && x.c.secs[0].ids[0]; return first ? `data-a="bookAt" data-id="${first}"` : m; });
};
