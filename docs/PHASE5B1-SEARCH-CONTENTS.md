# Phase 5B.1 (first batch): universal search and clickable contents

Status: **partly done.** Search and the chapter contents are live; the chapter pages, the reading-book navigation, the
5,000-recipe expansion and the Egyptian expansion are **not** done yet.

## What works (tested)
- **Universal search** (🔎 in the header, on every screen). Searches recipes, chapters, cuisines, pantry, grocery list,
  meal plan, cooked history and your own recipes. Results are grouped and can be filtered by type.
  - Spelling and dish-name aliases (koshari/koshary/kushari, molokhia/mulukhiyah, kofta/kefta, basbousa, kunafa/konafa, shorba/shorbet, and more).
  - Typing mistakes, plurals, partial words, multi-word queries, exact-title first.
  - Time filter ("under 30 minutes"), exclusions ("no dairy", "without eggs").
  - Recent searches and clear history. "Try" suggestions.
  - Offline: no network calls. Dietary results keep the ingredient-based disclaimer.
- **Contents by chapter** (Cookbook tab → 📑). 15 chapters, expandable sections, recipe counts, Expand All and
  Collapse All, filter, chapter order or A–Z, and recipe links that open the recipe.
- **Egyptian collection** (Cookbook tab → 🇪🇬): all 74 Egyptian recipes, grouped into 10 sections. Nothing is copied.
- Chapter placement rules are in `org.js`. Each recipe has exactly one place and additional browse tags.

## Tests
- Organization and search: **40/40** (`?testenv=1&selftest=org`).
- Application regression: **88/88** (`?testenv=1&selftest=full&images=1`).
- Household sharing: **100/100** (`?testenv=1&selftest=share`).

## Known limits (honest)
- **Chapter placement is an automatic first pass.** It is about right for most recipes, but a manual review is still
  needed: some sections are catch-all ("More meat dinners", "More sides", "More sweets"), a few dishes are misplaced
  (for example some pasta and chicken dishes), and some drinks are only partly identified. Nothing was forced into a
  chapter without a rule, and no empty chapters are shown.
- **Not yet:** search "contextual" inside each screen (the header button is global; the planner's and grocery list's own
  search boxes are not built yet). Adding a result straight to the meal plan from search works; adding to the grocery list
  and favourites from search results is not yet a button.
- **Not yet:** "eggs prioritised by pantry" ranking, pantry-match scores, cozy-level sorting controls, and "Recently viewed"
  or "Recently cooked" lists.
- **Not yet:** previous and next recipe and chapter buttons inside the recipe screen, the flip-page reader changes,
  bookmarks and resume.
- **Not yet:** the recipe expansion (3,449 new recipes) and the extra Egyptian recipes (target 250). No new recipes have
  been added in this batch.
- Tested in desktop Chromium with phone-width emulation only; not on a physical iPhone.
