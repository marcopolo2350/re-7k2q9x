/* Navigation restore, SVG icons, version display. Loaded after every other app script.
   - Restores direct tabs for the animated Cookbook and the Pantry (v3.0 had folded them away: the page-turn book was
     reachable from nowhere and Pantry was labelled "Kitchen").
   - Replaces decorative interface emojis with local SVG icons (food emojis used as recipe art are left alone).
   - Shows the running release/build under Settings and offers a data-safe update. */
const RELEASE = "v5.7-nav-restore";
const ICONS = {
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  book: '<path d="M12 6c-2-1.5-5-2-8-2v14c3 0 6 .5 8 2 2-1.5 5-2 8-2V4c-3 0-6 .5-8 2zM12 6v14"/>',
  jar: '<path d="M8 3h8v3H8zM6 8c0-1 1-2 2-2h8c1 0 2 1 2 2v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z"/><path d="M6 12h12"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  cart: '<path d="M3 4h2l2.5 11h10l2-8H6.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>',
  pot: '<path d="M4 10h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM2 10h20M9 6c0-2 2-2 2-4M14 6c0-2 2-2 2-4"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/>',
  knife: '<path d="M4 20l9-9M13 11l5-8c2 4 1 8-3 11z"/>',
  bowl: '<path d="M3 11h18a9 9 0 0 1-18 0zM8 7c0-1.5 1.5-1.5 1.5-3"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  warn: '<path d="M12 3l10 18H2zM12 10v5M12 18h.01"/>',
  bookmark: '<path d="M6 3h12v18l-6-4-6 4z"/>',
  dice: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 9h.01M15 15h.01M9 15h.01M15 9h.01"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  flame: '<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 2 1 2 0-3 1-5 2-8z"/>',
  star: '<path d="M12 3l2.7 6 6.3.6-4.8 4.3 1.5 6.3L12 17l-5.7 3.2 1.5-6.3L3 9.6 9.3 9z"/>',
  signal: '<path d="M5 20v-4M10 20v-8M15 20V8M20 20V4"/>',
  heart: '<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1L7 17M17 7l2.1-2.1"/>'
};
const ic = (n, c) => `<svg class="ico ${c || ""}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[n] || ""}</svg>`;

/* ---- tabs: Home, Cookbook (the animated book), Pantry, Plan, Shop, Cook ---- */
TABS.splice(0, TABS.length, ["home", ic("home"), "Home"], ["cookbook", ic("book"), "Cookbook"], ["pantry", ic("jar"), "Pantry"], ["plan", ic("cal"), "Plan"], ["groceries", ic("cart"), "Shop"], ["cook", ic("pot"), "Cook"]);

/* ---- Cookbook tab keeps a way to the searchable recipe list ---- */
const _vCookbook = V.cookbook;
V.cookbook = () => _vCookbook() + `<button class="btn full ghost" style="margin-top:12px" data-a="go" data-t="recipes">${ic("signal")} Browse and search all recipes</button>`;

/* ---- Home: two direct doors at the top ---- */
const _vHomeNav = V.home;
V.home = function () {
  let h = _vHomeNav();
  const resume = S.resume && RID[S.resume.id];
  const cook = resume
    ? `<button class="nt" data-a="resume">${ic("book")}<b>Cookbook</b><small>Continue: ${esc(RID[S.resume.id].n)}</small></button>`
    : `<button class="nt" data-a="go" data-t="cookbook">${ic("book")}<b>Cookbook</b><small>Open the book</small></button>`;
  const pn = (S.pantry || []).length;
  const tiles = `<div class="nav-tiles">${cook}<button class="nt" data-a="go" data-t="pantry">${ic("jar")}<b>Pantry</b><small>${pn} ingredient${pn === 1 ? "" : "s"} · what can I make</small></button></div>`;
  return h.includes('<section class="dash">') ? h.replace('<section class="dash">', () => tiles + '<section class="dash">') : tiles + h;
};

/* ---- replace decorative emojis with SVG icons ---- */
const EMOJI = [["👩‍🍳", "pot"], ["🗓", "cal"], ["🏠", "home"], ["📖", "book"], ["📚", "book"], ["🧺", "jar"], ["🛒", "cart"], ["⏱", "timer"], ["🆘", "help"], ["🔪", "knife"],
  ["🥣", "bowl"], ["🛟", "shield"], ["✅", "check"], ["⚠", "warn"], ["⛔", "warn"], ["🔖", "bookmark"], ["🎰", "dice"], ["🌍", "globe"], ["🔥", "flame"], ["⭐", "star"],
  ["📶", "signal"], ["💛", "heart"], ["🔎", "search"], ["🔍", "search"], ["⚙", "gear"], ["🤔", ""]];
const EMAP = Object.fromEntries(EMOJI);
const ERE = new RegExp("(" + EMOJI.map(e => e[0]).join("|") + ")\\uFE0F?", "g");
function iconify(root) {
  if (!root) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => {
    if (!ERE.test(n.nodeValue)) { ERE.lastIndex = 0; return NodeFilter.FILTER_REJECT; } ERE.lastIndex = 0;
    const p = n.parentNode; if (!p || /^(SCRIPT|STYLE|TEXTAREA|OPTION|TITLE|SELECT)$/.test(p.nodeName) || (p.closest && p.closest("#book,#stage"))) return NodeFilter.FILTER_REJECT;
    return NodeFilter.FILTER_ACCEPT; } });
  const nodes = []; while (w.nextNode()) nodes.push(w.currentNode);
  nodes.forEach(n => {
    const t = n.nodeValue, frag = document.createDocumentFragment(); let last = 0, m; ERE.lastIndex = 0;
    while ((m = ERE.exec(t))) { frag.appendChild(document.createTextNode(t.slice(last, m.index))); const k = EMAP[m[1]]; if (k) { const s = document.createElement("span"); s.className = "ei"; s.innerHTML = ic(k); frag.appendChild(s); } last = m.index + m[0].length; }
    frag.appendChild(document.createTextNode(t.slice(last))); n.parentNode.replaceChild(frag, n);
  });
}
let _iq = 0;
new MutationObserver(() => { if (_iq) return; _iq = requestAnimationFrame(() => { _iq = 0; iconify(document.body); }); }).observe(document.body, { childList: true, subtree: true });

/* ---- version display and data-safe update ---- */
async function appBuild() {
  let running = "", latest = "";
  try { const k = (await caches.keys()).filter(x => x.startsWith("shell-")); running = k.length ? k[k.length - 1].slice(6) : ""; } catch (e) {}
  try { const t = await (await fetch("sw.js", { cache: "no-store" })).text(); latest = (t.match(/const VERSION="([^"]+)"/) || [])[1] || ""; } catch (e) {}
  return { running, latest };
}
const _settingsNav = settings;
settings = function () {
  _settingsNav();
  const host = document.querySelector("#sheetIn .d-body"); if (!host) return;
  const box = document.createElement("section"); box.className = "verbox"; box.setAttribute("aria-label", "App version");
  box.innerHTML = `<h3>About this app</h3><div class="small">Release <b>${RELEASE}</b> · ${RECIPES.length} recipes</div><div class="small" id="verLine">Checking build…</div>`;
  host.appendChild(box);
  appBuild().then(({ running, latest }) => {
    const el = document.getElementById("verLine"); if (!el) return;
    if (running && latest && running !== latest) { el.innerHTML = `Running build ${esc(running)}; a newer build ${esc(latest)} is available. <button class="btn sm" data-a="appUpdate">Update now (keeps your data)</button>`; }
    else el.textContent = running ? `Build ${running} · up to date` : "Build information unavailable offline";
  });
};
A.appUpdate = async () => {
  toast("Updating…");
  try { const r = await navigator.serviceWorker.getRegistration(); if (r) await r.update(); } catch (e) {}
  location.reload();
};
/* if a newer build is waiting at launch, say so once per session */
appBuild().then(({ running, latest }) => { if (running && latest && running !== latest && !sessionStorage.getItem("upd")) { try { sessionStorage.setItem("upd", "1"); } catch (e) {} toast("A newer version is ready: Settings → Update now"); } });

const _renderNav = render;
render = function (k) { _renderNav(k); iconify(document.body); };
if (!TABS.some(t => t[0] === tab)) tab = "home";
render(true);

if (/[?&]selftest=nav/.test(location.search)) setTimeout(() => { const b = document.createElement("script"); b.src = "selftest-nav.js?v=" + Date.now(); document.body.appendChild(b); }, 1500);
