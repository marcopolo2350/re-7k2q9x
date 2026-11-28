/* Reviewed classification corrections (Phase 5B.2). Loaded after life2.js, so main-ingredient tags (mn) it sets are
   final, and before the contents are first built. Recipe ids are the only link; no recipe text or ingredient is changed.
   Each entry: ch/sub = primary chapter and section (used by ORG.place unless the owner set a personal placement),
   mn = corrected main-ingredient tags (used by the Main filter and search). "why" is the review reason; see
   docs/CLASSIFICATION-LEDGER.md. Entries are added by hand after reading the dish name and ingredients. */
const CLS_FIX = {
  /* Corrections to existing recipes */
  53025: { ch: "breakfast", sub: "Beans, grains & porridge", mn: ["veg"], why: "Ful medames is a fava bean dish. 'chili' in a related name matched the beef rule." },
  3297: { ch: "sauces", sub: "Sauces & gravies", mn: [], why: "Shatta is a chili sauce. 'chili' in the ingredients matched the beef rule." },
  52963: { ch: "breakfast", sub: "Eggs & omelets", mn: ["veg"], why: "Shakshuka is eggs poached in tomato and pepper sauce. No meat is involved." },
  /* Batch 1 Egyptian placements, corrected after the first automatic pass */
  7005: { ch: "salads", sub: "Slaws & vegetable salads", why: "Roasted eggplant salad is a vegetable salad, not a protein salad." },
  7006: { ch: "sauces", sub: "Sauces & gravies", mn: [], why: "Tahini sauce. The word 'style' in the title blocked the sauce rule." },
  7007: { ch: "apps", sub: "Dips & spreads", mn: ["veg"], why: "Yogurt dip with mint, served as a side or starter." },
  7011: { ch: "chicken", sub: "Curries & braises", why: "Braised chicken in tomato sauce." },
  7012: { ch: "chicken", sub: "Curries & braises", why: "Braised chicken with coriander sauce." },
  7013: { ch: "chicken", sub: "Curries & braises", why: "Chicken and okra stew. It is not a soup." },
  7014: { ch: "chicken", sub: "Grilled & skewered", why: "Grilled chicken with tahini sauce." },
  7015: { ch: "meat", sub: "Stews, braises & curries", why: "Beef stew with cabbage. It belongs with the beef mains, not soups." },
  7016: { ch: "meat", sub: "Stir-fries & skillets", why: "Liver fried with onions in a skillet." },
  7017: { ch: "meat", sub: "Grilled & barbecued", why: "Grilled meat skewers." },
  7018: { ch: "seafood", sub: "Baked & roasted fish", why: "Fish roasted and served with tahini sauce." },
  7019: { ch: "seafood", sub: "Shrimp & shellfish", why: "Fried shrimp." },
  7020: { ch: "seafood", sub: "Fried fish", why: "Fried whole sardines." },
  7021: { ch: "veg", sub: "Stuffed & baked vegetables", mn: ["veg"], why: "Stuffed cabbage rolls with a rice filling. No meat in this version." },
  7022: { ch: "veg", sub: "Stuffed & baked vegetables", mn: ["veg"], why: "Stuffed eggplant with a rice filling. It is not an eggs and cheese dish." },
  7023: { ch: "grains", sub: "Egyptian & Middle Eastern rice", mn: ["beef", "lamb"], why: "Rice and bread dish with meat, served in the rice chapter." },
  7024: { ch: "pasta", sub: "Tomato & meat sauce pasta", mn: ["pasta"], why: "Tomato pasta." },
  7025: { ch: "veg", sub: "Bean, lentil & chickpea mains", mn: ["veg"], why: "Lentil and rice dish with onions. Vegetarian." },
  7026: { ch: "sides", sub: "Roasted & sautéed vegetables", why: "Cooked cabbage, served as a side." },
  7027: { ch: "veg", sub: "Vegetable curries & stews", mn: ["veg"], why: "Eggplant in tomato sauce. Vegetarian stew." },
  7028: { ch: "sandwich", sub: "Wraps, pitas & shawarma", why: "Fava patties stuffed into bread." },
  7029: { ch: "baking", sub: "Breads & flatbreads", why: "Sesame bread rings. Bread, not a dessert." },
  7032: { ch: "drinks", sub: "Hot drinks", why: "Hibiscus tea, served hot or iced." }
};

/* Apply the corrected main-ingredient tags to the library (only the ids listed above change). */
if (typeof RECIPES !== "undefined") {
  RECIPES.forEach(r => { const f = CLS_FIX[r.id]; if (f && f.mn) r.mn = f.mn; });
}
