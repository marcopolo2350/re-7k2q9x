# Egyptian expansion, batch 1 (Phase 5B.3)

Status: **added to the library, tested, not yet culinary-reviewed.**

## Counts
- Egyptian recipes before this batch: 74
- Added in batch 1: **36** (ids 7001–7036)
- Egyptian recipes now: **110** of the 250+ minimum (44%); **140** still to add
- Batch size was below the 50–75 range on purpose. Each dish in the batch is one I can describe with a traditional
  form, method and ingredients. I did not add dishes to reach a number.

## Where the recipes live
- `egypt.js`: the 36 records (same compact format as `newrecipes.js`).
- `egypt-chef.js`: chef notes. Ingredient roles and levels are **inferred by rule** from each ingredient's name, plus two written tips per recipe.
- `egypt-guide.js`: kitchen guidance. Done-cues, expectations, two common mistakes, storage text and fix-it notes come from a template for each kind of dish.
- `classify-fixes.js`: the chapter and section for each new recipe (corrections are listed in `docs/CLASSIFICATION-LEDGER.md`).

## Provenance
- All 36 were written from general Egyptian home-cooking knowledge. **They are not copied from any named book, site or recipe.**
- No nutrition figures, photographs or source links were added. Nutrition and photos remain blank for these recipes.
- Where a dish is shared with another cuisine, the description says so: Tahina Sauce, Mudardara, Konafa.
- The quantities are typical home amounts. They have not been tested in a kitchen.

## Recipes in batch 1
| Id | Recipe | Section |
|---|---|---|
| 7001 | Ful bil Zeit (Fava Beans with Olive Oil and Cumin) | Breakfast |
| 7002 | Ful bil Tahina (Fava Beans with Tahini) | Breakfast |
| 7003 | Beid bil Tamatem (Eggs in Tomato Sauce) | Breakfast |
| 7004 | Torshi Khiar (Egyptian Pickled Cucumbers) | Mezze & pickles |
| 7005 | Salatet Batinjan (Roasted Eggplant Salad) | Mezze & salads |
| 7006 | Tahina Sauce (Egyptian-Style Tarator), shared with Levantine cooking | Mezze & sauces |
| 7007 | Zabadi bil Na'ana (Yogurt with Dried Mint) | Mezze & dips |
| 7008 | Salatet Malfouf (Egyptian Cabbage Salad) | Mezze & salads |
| 7009 | Shorbet Kishk (Egyptian Kishk Soup). Kishk contains wheat. | Soups |
| 7010 | Shorbet Tomatem (Egyptian Tomato Soup) | Soups |
| 7011 | Firakh bil Tomatem (Chicken in Tomato Sauce) | Chicken |
| 7012 | Firakh bil Kuzbara (Chicken with Fresh Coriander) | Chicken |
| 7013 | Firakh bil Bamia (Chicken with Okra) | Chicken |
| 7014 | Firakh Mashwi bil Taratoor (Grilled Chicken with Tahini Sauce) | Chicken |
| 7015 | Lahma bil Kromb (Beef and Cabbage Stew) | Beef & lamb |
| 7016 | Kebda bil Basal (Liver with Caramelized Onions) | Offal |
| 7017 | Kebab Mashwi (Egyptian Grilled Meat Skewers) | Beef & lamb |
| 7018 | Samak bil Taratoor (Fish with Tahini Sauce) | Fish |
| 7019 | Gambari Makly (Fried Shrimp) | Fish |
| 7020 | Sardin Makly (Fried Fresh Sardines) | Fish |
| 7021 | Mahshi Kromb (Stuffed Cabbage Leaves) | Mahshi |
| 7022 | Mahshi Batinjan (Stuffed Eggplant) | Mahshi |
| 7023 | Fatta bil Lahma (Rice, Bread and Meat Fatta) | Rice & grains |
| 7024 | Makarona bil Sos (Egyptian Tomato Spaghetti) | Pasta |
| 7025 | Mudardara (Lentils, Rice and Caramelized Onions), shared with Levantine cooking | Lentils & beans |
| 7026 | Kromb bil Zeit (Cabbage Cooked in Olive Oil) | Vegetables |
| 7027 | Batinjan bil Tomatem (Eggplant in Tomato Sauce) | Vegetables |
| 7028 | Ta'meya Sandwich (Fava Falafel Sandwich) | Street food |
| 7029 | Ka'ak bil Simsim (Sesame Bread Rings) | Breads |
| 7030 | Konafa (Shredded Pastry with Nuts and Syrup), Levantine origin, very common in Egypt | Desserts |
| 7031 | Halawet el Tahina (Tahini Halva) | Desserts |
| 7032 | Karkade (Hibiscus Tea) | Drinks |
| 7033 | Tamr Hindi (Tamarind Drink) | Drinks |
| 7034 | Yansoon Tea (Anise Tea) | Drinks |
| 7035 | Shay bil Na'ana (Egyptian Mint Tea) | Drinks |
| 7036 | Limonada bil Na'ana (Mint Lemonade) | Drinks |

## Known gaps before this batch is final
- **Culinary review is needed for every recipe.** The quantities, timings and fix-it notes need a cook's check, and some
  dish names (Mahshi Batinjan, Kromb bil Zeit) need a source for the spelling used in Egypt.
- **Chef notes and guidance are generated**, not hand-written per ingredient. Roles and levels are rule-based and may be wrong for some ingredients.
- **Not yet in this batch:** breakfasts beyond the three listed, the Upper Egypt and Alexandria regional dishes, most
  mezze and dips, Egyptian soups beyond the two listed, and most sweets.
- **Image:** none. Photograph work for these ids has not started.

## Tests
`?testenv=1&selftest=egypt` — **35/35**. It checks the batch format, unique ids, placement in one chapter, that every
recipe opens from the contents, that the Arabic and English names and spelling variants are searchable (for example
"kunafa", "kaak", "tamarind", "karkade"), the dietary disclaimer, the classification fixes, and that no personal data changes.
