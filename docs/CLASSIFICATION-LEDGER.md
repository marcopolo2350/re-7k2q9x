# Classification ledger (Phase 5B.2)

Status: **started, not complete.** The full review of all 1,551 original placements is not done.

## What changed in this pass
1. **Main-ingredient tag bug fixed at the source** (`app.js`, `mainOf`). The beef rule matched the word "chili", so a
   pepper or a chili sauce could be tagged beef. Shatta and ful medames were tagged beef this way. After the fix,
   **97 recipes that had a beef tag with no beef in their name or ingredients** no longer carry it. Beef
   recipes that name or list beef, brisket, oxtail, veal, meatball, burger, meatloaf or bolognese keep the tag.
2. **Drinks rule fixed** (`org.js`, `chapterOf`). A word like "cider" no longer makes a dish a drink when the
   dish contains meat or fish. "Coddled pork with cider" now sits in the meat chapter.
3. **Reviewed corrections table** (`classify-fixes.js`, `CLS_FIX`). Each entry has a chapter, a section, optional
   main-ingredient tags and a reason. Personal placements still override these entries.

## Corrections (reviewed by reading the name and ingredients)
| Id | Recipe | Before | After | Reason |
|---|---|---|---|---|
| 53025 | Ful Medames | mn: beef | mn: veg; breakfast | Fava dish; "chili" matched beef |
| 3297 | Shatta (Egyptian Hot Sauce) | mn: beef; sauces | mn: none; sauces | Chili sauce |
| 52963 | Shakshuka | mn: beef | mn: veg; breakfast | Eggs in tomato sauce |
| 7005–7032 | Batch 1 Egyptian recipes | automatic first pass | reviewed section | See `docs/EGYPT-BATCH-1.md` |

Batch 1 corrections were needed because the automatic first pass put several recipes in wrong sections:
- Tahina sauce and yogurt dip ended up in "More vegetarian dishes" (the word "style" in one title blocked the sauce rule).
- Chicken with okra and beef with cabbage were placed under "soups".
- Fatta with rice and meat was placed under "More meat dinners".
- Ka'ak was placed under "More sweets".
- Stuffed eggplant and eggplant in tomato sauce were placed under "Tofu, eggs & cheese".

## Known remaining problems (not yet fixed)
- **Catch-all sections remain:** "More meat dinners", "More sides", "More sweets & snacks", "More chicken dinners",
  "More fish dinners" and "More vegetarian dishes". They hold recipes the name rules did not match. Next step: review each
  section's list and give each recipe a specific section.
- **Stews sit under "Soups & Stews"**. Several beef and chicken stews are in the soups chapter. The review should decide
  whether stews belong with the meat or chicken chapters.
- **Egyptian label accuracy:** Shakshuka and Shawarma are tagged Egyptian but are shared with other cuisines. Egyptian Goulash is an adaptation. These should carry a "shared" or "adapted" note.
- **Original 1,551 recipes:** only the three named corrections above are reviewed. The other ~1,545 still rely on the automatic rules.
- **Ledger format:** the full ledger the brief asks for (every recipe id, current and proposed chapter, corrected main
  ingredient, reason, ambiguity flag) is not generated yet. It needs a script that lists every recipe. Only the reviewed
  corrections above are recorded so far.

## How to add a correction
Add one line to `CLS_FIX` in `classify-fixes.js` with the recipe id, `ch`, `sub`, optional `mn` and a `why`. The
selftest checks that the chapter and section exist and that the placement matches.
