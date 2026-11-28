/* Cookbook reader navigation tests. Run with ?testenv=1&selftest=reader. Results: window.__readertest.
   Reads the library; the only write is the bookmark toggle, which is undone before the run ends. */
(async function () {
  if (!TESTENV) { alert("Reader tests only run with ?testenv=1"); return; }
  const out = [], t0 = performance.now();
  const ok = (name, pass, info) => out.push({ name, pass: !!pass, info: info == null ? "" : String(info) });
  const F = flatBook();
  const ids = F.map(x => x.id);

  ok("reading order covers every recipe exactly once", new Set(ids).size === ids.length && ids.length === RECIPES.length, ids.length + " of " + RECIPES.length);

  let badPrev = 0, badNext = 0;
  for (let k = 0; k < F.length; k++) {
    const g = navOf(F[k].id);
    if (k > 0 && g.prev !== F[k - 1].id) badPrev++;
    if (k < F.length - 1 && g.next !== F[k + 1].id) badNext++;
  }
  ok("previous and next recipe match the reading order", badPrev === 0 && badNext === 0, "bad prev " + badPrev + ", bad next " + badNext);

  const first = F[0].id, last = F[F.length - 1].id;
  ok("first recipe has no previous, last has no next", navOf(first).prev === null && navOf(last).next === null);

  let chapterOk = true;
  for (const ch of ORG.book().chapters) {
    const firstId = ch.secs[0].ids[0];
    const g = navOf(firstId);
    if (g.pch !== null && navOf(g.pch) && navOf(g.pch).chName === ch.n) chapterOk = false;
  }
  ok("previous-chapter jump lands in a different chapter", chapterOk);

  const nextChapterDiff = ORG.book().chapters.slice(0, -1).every((ch, i, arr) => {
    const g = navOf(ch.secs[0].ids[0]); return g.nch === null || navOf(g.nch).chName !== ch.n;
  });
  ok("next-chapter jump lands in a different chapter", nextChapterDiff);

  const before = JSON.stringify(S.bm || []);
  det = { id: first, s: RID[first].s, tk: false };
  const bmHtml = navBar(first);
  ok("reader bar renders with a bookmark control", /data-a="bm"/.test(bmHtml) && /data-a="rnext"/.test(bmHtml));
  ok("previous recipe is disabled on the first recipe", /data-a="rprev"[^>]*disabled/.test(navBar(first)));

  const probe = 7001;
  const rBefore = (S.recent || []).slice();
  noteRecent(probe);
  ok("opening a recipe records it as recently viewed", S.recent[0] === probe && S.recent.filter(x => x === probe).length === 1);
  noteRecent(probe);
  ok("recently viewed has no duplicates", S.recent.filter(x => x === probe).length === 1);
  S.recent = rBefore; save();

  S.bm = (S.bm || []).filter(x => x !== probe);
  if (!Array.isArray(S.bm)) S.bm = [];
  S.bm = [probe, ...S.bm]; save();
  ok("bookmark toggle reads back as bookmarked", isBm(probe));
  S.bm = S.bm.filter(x => x !== probe); save();
  ok("bookmark removed restores the previous state", !isBm(probe) && JSON.stringify(S.bm) === before);

  /* Stage 1 completion: resume, bookmarks list, recently viewed, defaults and backward compatibility */
  const keepResume = S.resume, keepBm = S.bm, keepRecent = S.recent;
  S.resume = undefined; S.bm = []; S.recent = [];
  ok("fresh data has empty bookmarks and recent lists, no resume point", (() => { const f = fresh(); return Array.isArray(f.bm) && Array.isArray(f.recent) && f.resume === undefined; })());
  const oldShape = Object.assign({}, JSON.parse(JSON.stringify(fresh())));
  delete oldShape.bm; delete oldShape.recent;
  localStorage.setItem(KEY + "-readertest", JSON.stringify(oldShape));
  ok("data saved before this release loads with empty reader fields", (() => { const d = JSON.parse(localStorage.getItem(KEY + "-readertest")); return d.bm === undefined && Array.isArray(fresh().bm); })());
  localStorage.removeItem(KEY + "-readertest");
  saveResume(0, first); ok("reading position is saved when a page is turned", S.resume && S.resume.id === first && S.resume.part === 0);
  ok("Continue reading appears on the home screen", /data-a="resume"/.test(readingBox()));
  S.resume = { part: 0, id: 99999999, at: 1 }; ok("a stale resume point does not produce a broken button", !/data-a="resume"/.test(readingBox()));
  S.resume = keepResume;
  S.bm = [first]; S.recent = [first, 7001];
  const rb = readingBox();
  ok("bookmarks appear as a labelled list with direct recipe buttons", /aria-label="Bookmarks"/.test(rb) && new RegExp('data-a="open" data-id="' + first + '"').test(rb));
  ok("recently viewed appears as a labelled list", /aria-label="Recently viewed"/.test(rb) && /data-id="7001"/.test(rb));
  S.bm = keepBm || []; S.recent = keepRecent || [];

  const pass = out.filter(x => x.pass).length;
  window.__readertest = { pass, fail: out.length - pass, total: out.length, ms: Math.round(performance.now() - t0), results: out };
  const box = document.createElement("div");
  box.style.cssText = "position:fixed;inset:0;z-index:99999;background:#fff;color:#222;overflow:auto;padding:16px;font:13px -apple-system,system-ui";
  box.innerHTML = `<h2>Reader tests: ${pass}/${out.length}</h2>` + out.map(x => `<div style="color:${x.pass ? "#1a7f37" : "#c00"}">${x.pass ? "✓" : "✗"} ${esc(x.name)} <span style="color:#888">${esc(x.info)}</span></div>`).join("") + `<p><a href="./?testenv=1">Close</a></p>`;
  document.body.appendChild(box);
})();
