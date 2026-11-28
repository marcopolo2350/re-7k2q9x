/* Self-test for chapters, search quick actions, importer, personal cookbooks, PDF and backups.
   Runs only with ?testenv=1 (separate storage key); the test state is put back exactly as it was at the end. */
(async () => {
  const R = [], ok = (name, pass, info) => R.push({ name, pass: !!pass, info: info == null ? "" : String(info) });
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const until = async (f, ms = 8000) => { const t = Date.now(); while (Date.now() - t < ms) { try { if (f()) return true; } catch (e) {} await wait(100); } return false; };
  if (KEY !== "roses-eats-TEST") { window.__finishtest = { pass: 0, fail: 1, results: [{ name: "runs only in the test environment", pass: false }] }; return; }
  const snap = JSON.stringify(S);
  const t0 = Date.now();
  try {
    /* ---- chapters ---- */
    const WANT = ["Breakfast & Brunch", "Appetizers & Small Plates", "Soups & Stews", "Salads & Light Meals", "Chicken & Poultry", "Beef & Lamb", "Fish & Seafood", "Pasta & Noodles", "Rice & Grains", "Vegetarian & Plant-Based", "Sandwiches, Wraps & Burgers", "Side Dishes", "Bread & Baking", "Sauces, Dressings & Marinades", "Desserts & Sweets", "Drinks & Beverages"];
    const B = ORG.book();
    ok("the cookbook has the 16 specified chapters in order", JSON.stringify(B.chapters.map(c => c.n)) === JSON.stringify(WANT), B.chapters.map(c => c.n).join(" | "));
    const seen = new Map(); B.chapters.forEach(c => c.secs.forEach(s => s.ids.forEach(id => seen.set(id, (seen.get(id) || 0) + 1))));
    ok("every recipe sits in exactly one chapter section", RECIPES.every(r => seen.get(r.id) === 1) && seen.size === RECIPES.length, seen.size + " of " + RECIPES.length);
    ok("no chapter or section name carries an emoji", !/\p{Extended_Pictographic}/u.test(JSON.stringify(B.chapters.map(c => [c.n, c.secs.map(s => s.name)]))));
    const biggestCatchAll = Math.max(...B.chapters.flatMap(c => c.secs.filter(s => /^More /.test(s.name)).map(s => s.ids.length)), 0);
    ok("no 'More …' catch-all section holds more than 25 recipes", biggestCatchAll <= 25, biggestCatchAll);
    const mis = [["Frog Legs in Garlic Butter", "seafood"], ["Cacio e Pepe", "pasta"], ["Samosas", "apps"], ["Borsch", "soups"], ["Vegan Chocolate Cake", "desserts"], ["Pizza Express Margherita", "baking"]].filter(([n]) => RECIPES.some(r => r.n === n));
    ok("recipes found misfiled in review now sit in the right chapter", mis.every(([n, ch]) => ORG.place(RECIPES.find(r => r.n === n)).ch === ch), mis.map(([n]) => n + "→" + ORG.place(RECIPES.find(r => r.n === n)).ch).join(", "));
    ok("pasta and rice are separate chapters (no spaghetti in Rice & Grains)", !RECIPES.some(r => /spaghetti|lasagn|noodle/i.test(r.n) && ORG.place(r).ch === "grains"));
    const toc = bookTocHTML();
    ok("the book's contents page lists every chapter with its page number", B.chapters.every(c => toc.includes(esc(c.n))) && (toc.match(/class="tch-p"/g) || []).length === B.chapters.length);
    /* ---- search quick actions ---- */
    A.gSearch(); gQ = "chicken soup"; $("#gq").value = gQ; $("#sheetIn").innerHTML = gHTML(gQ, "all");
    const rows = document.querySelectorAll("#sheetIn .sres");
    const first = rows[0] && rows[0].querySelector("[data-a=gOpen]");
    ok("search results show Book, Cook, Favorite, Bookmark, Plan and Shop actions", rows.length > 0 && [...rows].every(r => ["bookAt", "cook", "fav", "bm", "gPlan", "addMissing"].every(a => r.querySelector(`[data-a=${a}]`))), rows.length + " rows");
    const fid = first ? +first.dataset.id : 0; const wasFav = isFav(fid);
    A.fav(rows[0].querySelector("[data-a=fav]"));
    ok("favoriting from search keeps the search open and shows the change", sheetKind === "search" && isFav(fid) !== wasFav && $("#gq") && $("#gq").value === "chicken soup" && !!document.querySelector(`#sheetIn [data-a=fav][data-id="${fid}"].on`) === isFav(fid));
    A.gOpen(first);
    ok("a recipe opened from search offers a way back to the results", sheetKind === "detail" && !!document.querySelector("#sheetIn .backres[data-a=gBack]"));
    A.gBack();
    ok("going back restores the same search and results", sheetKind === "search" && $("#gq").value === "chicken soup" && document.querySelectorAll("#sheetIn .sres").length === rows.length);
    closeSheet();
    /* ---- importer ---- */
    openMine(0);
    ok("the add-recipe form has source link reading and family fields", !!$("#mFrom") && !!$("#mStory") && !!document.querySelector("[data-a=impLink]") && !!$("#mPaste"));
    const ld = `<html><head><script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"WebPage"},{"@type":["Recipe"],"name":"Test Lentil Soup &amp; Lemon","recipeIngredient":["1 cup red lentils","1 onion","4 cups water"],"recipeInstructions":[{"@type":"HowToSection","itemListElement":[{"@type":"HowToStep","text":"Simmer the lentils."},{"@type":"HowToStep","text":"Blend and add lemon."}]}],"totalTime":"PT1H5M","recipeYield":"6 servings"}]}</script></head></html>`;
    const p = ldRecipe(ld);
    ok("a recipe website's structured data is read (name, ingredients, steps, time, serves)", p && p.n === "Test Lentil Soup & Lemon" && p.ing.length === 3 && p.st.length === 2 && p.t === 65 && p.s === 6, p && JSON.stringify(p));
    ok("a page without a recipe is reported, not invented", ldRecipe("<html><body>Nothing here</body></html>") === null);
    const lib = RECIPES.find(r => !r.mine && r.i.length >= 4);
    ok("a recipe already in the library is detected as a duplicate", !!findDuplicate({ n: lib.n, ing: lib.i.map(g => g.item) }), lib.n);
    ok("a genuinely new recipe is not flagged as a duplicate", !findDuplicate({ n: "Teta Samia's Saturday Zucchini", ing: ["2 zucchini", "1 cup rice", "3 tomatoes"] }));
    closeSheet();
    md = { id: 0, n: "Teta Samia's Saturday Zucchini", c: "comfort", t: 50, s: 4, cz: 9, d: "", ing: ["2 zucchini", "1 cup rice", "3 tomatoes"], st: ["Cook the rice.", "Stuff and bake the zucchini."], img: "", tk: "", gf: "", from: "Teta Samia", story: "Every Saturday at her flat." };
    sheet(dMine(), "mine"); A.mineSave();
    const fam = (S.mine || []).find(m => m.n === "Teta Samia's Saturday Zucchini");
    ok("a family recipe saves with whose recipe it is and its story", fam && fam.from === "Teta Samia" && fam.story === "Every Saturday at her flat." && RID[fam.id] && RID[fam.id].from === "Teta Samia");
    ok("the new recipe joins the library, the cookbook and search", fam && RECIPES.some(r => r.id === fam.id) && ORG.book().order.includes(fam.id) && SEARCH.run("saturday zucchini", "all").recipes.some(x => x.e.r.id === fam.id));
    md = { id: 0, n: lib.n, c: "comfort", t: 30, s: 4, cz: 9, d: "", ing: lib.i.map(g => g.item), st: ["x"], img: "", tk: "", gf: "" };
    sheet(dMine(), "mine"); const before = S.mine.length; A.mineSave(); await wait(60);
    ok("saving a duplicate asks first and offers to open the existing recipe", S.mine.length === before && /already in the cookbook/.test($("#sheetIn").textContent) && !!document.getElementById("dupOpen"));
    closeSheet();
    /* ---- personal cookbook ---- */
    A.mbNew(); const b = S.books[S.books.length - 1]; MBE = b.id;
    b.title = "Test Family Book"; b.ded = "For the test."; b.cover = "olive";
    const ids = RECIPES.filter(r => !r.mine).slice(0, 5).map(r => r.id);
    mbTo = 0; ids.slice(0, 3).forEach(id => A.mbAdd({ dataset: { id } }));
    A.mbChAdd(); mbTo = 1; A.mbAdd({ dataset: { id: fam.id } }); A.mbAdd({ dataset: { id: ids[3] } });
    A.mbChMove({ dataset: { i: 1, d: -1 } });
    A.mbRMove({ dataset: { i: 0, j: 0, d: 1 } });
    ok("chapters and recipes can be added and reordered", b.chapters.length === 2 && b.chapters[0].ids[0] === ids[3] && b.chapters[0].ids[1] === fam.id && b.chapters[1].ids.length === 3, JSON.stringify(b.chapters.map(c => c.ids)));
    A.mbAdd({ dataset: { id: ids[0] } });
    ok("a recipe can't be added to the same cookbook twice", b.chapters.flatMap(c => c.ids).filter(x => x === ids[0]).length === 1);
    ok("the editor shows the cover, chapters, notes and recipe search", (() => { sheet(mbEditor(), "mybooks"); return !!document.querySelector("#sheetIn .mbcover.mbc-olive") && document.querySelectorAll("#sheetIn .mbch").length === 2 && document.querySelectorAll("#sheetIn .mbnote").length === 5 && !!$("#mbQ"); })());
    S.notes[ids[3]] = "Less salt next time";
    const mainLen = bookList(0).length;
    A.mbRead({ dataset: { id: b.id } });
    const opened = await until(() => pf && document.querySelectorAll("#stage .bpg").length > 0);
    ok("the personal cookbook opens in the animated page-turn book", opened && $("#book").classList.contains("open"));
    ok("the book holds exactly the chosen recipes in the chosen order", JSON.stringify(BL.map(r => r.id)) === JSON.stringify(b.chapters.flatMap(c => c.ids)), BL.map(r => r.id).join(","));
    const pagesTxt = $("#stage").textContent;
    ok("its cover, dedication and contents are the personal ones", pagesTxt.includes("Test Family Book") && pagesTxt.includes("For the test.") && pagesTxt.includes(b.chapters[0].name));
    ok("its contents entries jump to each recipe's page", document.querySelectorAll("#stage .mytch .tsec[data-a=bkGo]").length === BL.length);
    ok("the recipe picker in the book lists only this cookbook", document.querySelectorAll("#bkJump optgroup option").length === BL.length);
    closeBook();
    ok("closing returns to the editor and the main cookbook is unchanged", sheetKind === "mybooks" && !MYB && bookList(0).length === mainLen);
    /* ---- PDF ---- */
    const ph = printHTML(b); const d = document.createElement("div"); d.innerHTML = ph;
    const links = [...d.querySelectorAll(".pr-toc a")].map(a => a.getAttribute("href").slice(1)), secs = [...d.querySelectorAll(".pr-rec")].map(s => s.id);
    ok("the printable cookbook has a clickable contents linking to every recipe", links.length === BL.length && links.every(x => secs.includes(x)));
    ok("the printable cookbook has the cover, dedication, chapter pages, notes and the family story", !!d.querySelector(".pr-cover .mbcover") && d.querySelector(".pr-ded").textContent.includes("For the test.") && d.querySelectorAll(".pr-chap").length === 2 && ph.includes("Less salt next time") && ph.includes("Every Saturday at her flat."));
    let printed = 0; const op = window.print; window.print = () => { printed++; ok("print shows only the cookbook", document.body.classList.contains("printing") && !!$("#printBook .pr-toc")); window.dispatchEvent(new Event("afterprint")); };
    A.mbPdf({ dataset: { id: b.id } }); await until(() => printed > 0, 2000); window.print = op;
    ok("after printing the app returns to normal", printed === 1 && !document.body.classList.contains("printing"));
    /* ---- cookbook file and backups ---- */
    const file = JSON.stringify({ kind: "roses-eats-cookbook", v: 1, book: b, mine: S.mine.filter(m => m.id === fam.id), notes: { [ids[3]]: S.notes[ids[3]] } });
    const nb = importCookbook(file);
    ok("a cookbook file opens as a new cookbook with the same chapters, reusing the family recipe already here", JSON.stringify(nb.chapters.map(c => c.ids)) === JSON.stringify(b.chapters.map(c => c.ids)) && S.mine.filter(m => m.n === fam.n).length === 1);
    let bad = false; try { importCookbook('{"kind":"other"}'); } catch (e) { bad = true; }
    ok("a file that isn't a cookbook is refused without changes", bad);
    const code = "ROSESEATS1:" + btoa(unescape(encodeURIComponent(JSON.stringify(S))));
    const back = cleanImport(code);
    ok("a backup code keeps cookbooks and family details", Array.isArray(back.books) && back.books.length === S.books.length && back.books.some(x => x.title === "Test Family Book") && (back.mine || []).some(m => m.from === "Teta Samia" && m.story));
    const full = JSON.parse(JSON.stringify(S)); const ns = migrate(Object.assign(fresh(), full));
    ok("a full backup file keeps cookbooks and family details", ns.books.length === S.books.length && ns.mine.some(m => m.from === "Teta Samia"));
    /* ---- cooking assistant: no equipment conflicts ---- */
    if (window.__cookflow && __cookflow.parallelFor) {
      const ck0 = ck; ck = { done: {} };
      try {
        const fake = { st: ["Simmer the sauce in the skillet for 20 minutes.", "Meanwhile, fry the onions in a skillet until golden.", "Meanwhile, chop the parsley.", "Grate the cheese."] };
        const L = __cookflow.parallelFor(fake, 0).list.map(x => x.k);
        ok("While you wait never suggests a task needing the pan that is already in use", !L.includes(1) && L.includes(2) && L.includes(3), L.join(","));
        const fry = { st: ["Fry the chicken in hot oil for 8 minutes, turning often.", "Chop the parsley."] };
        ok("nothing is suggested during attended frying", __cookflow.parallelFor(fry, 0).list.length === 0);
      } finally { ck = ck0; }
    } else ok("cooking assistant exposes its planner for testing", false);
    /* ---- covers and emoji ---- */
    const noPhoto = k => RECIPES.find(r => !realImg(r) && k(r));
    const eg = noPhoto(r => r.cu === "Egyptian"), sp = noPhoto(r => ORG.place(r).ch === "soups" && r.cu !== "Egyptian"), ds = noPhoto(r => ORG.place(r).ch === "desserts" && r.cu !== "Egyptian");
    ok("typographic covers are composed for Egyptian dishes, soups and desserts", (!eg || art(eg).includes("k-egypt")) && (!sp || art(sp).includes("k-soup")) && (!ds || art(ds).includes("k-sweet")), [eg, sp, ds].map(x => x ? x.n : "-").join(", "));
    ok("family recipes get their own cover", art(RID[fam.id]).includes("k-family"));
    go("cookbook"); await wait(50);
    ok("the Cookbook screen offers Search, Add a recipe and My cookbooks", ["gSearch", "impNew", "myBooks"].every(a => document.querySelector(`#view .cbtools [data-a=${a}]`)));
    ok("no emoji is visible on the Cookbook screen", !/\p{Extended_Pictographic}/u.test($("#view").textContent + $("#tabs").textContent));
  } catch (e) { ok("test run finished without an exception", false, e && e.stack || e); }
  /* put the test state back exactly */
  try { if (typeof closeBook === "function" && $("#book").classList.contains("open")) closeBook(); } catch (e) {}
  S = JSON.parse(snap); save(); syncMine(); closeSheet(); render(true);
  ok("the test environment's data is restored exactly", JSON.stringify(S) === snap);
  const pass = R.filter(x => x.pass).length;
  window.__finishtest = { pass, fail: R.length - pass, total: R.length, ms: Date.now() - t0, results: R };
  console.log("[finish selftest]", pass + "/" + R.length);
})();
