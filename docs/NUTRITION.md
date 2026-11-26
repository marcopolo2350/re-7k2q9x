# How Rose's EATS estimates nutrition

Estimates only. Not professionally verified and not a nutrition label.

## Source data
USDA FoodData Central, **SR Legacy** (April 2018 release, public domain). For each matched food the app uses, per 100 g of edible portion: energy (kcal, nutrient 1008), protein (1003), carbohydrate by difference (1005), total fat (1004), fiber (1079), total sugars (2000) and sodium (1093). The table of matched foods is `nutdb.js` (`NUTDB.foods[fdc_id]` lists the seven values and the USDA description; `NUTDB.items[ingredient] = [fdc_id, {unit: grams}]`).

## Ingredient matching
1,210 distinct ingredient names were matched by hand (AI-assisted, one by one) to SR Legacy foods. 1,088 have a match and 122 do not (branded sauces, unusual regional items). Matches use the food as purchased (raw unless the ingredient is sold canned, dried or cooked). Some are close stand-ins (for example gochugaru → cayenne); these are listed in the source matching files, not shown in the app.

## Converting quantities to grams
- Weight units (g, kg, oz, lb) convert directly.
- Volume units (tsp, tbsp, cup, pint, ml, l) use **that food's own cup weight** from USDA household portions, never a universal density. If a food has no volume portion, volume amounts are not converted and the ingredient counts as missing.
- Count units ("2 onions", "3 cloves", "1 can") use USDA household portions for that food when available, otherwise a standard weight recorded in the table (e.g. garlic clove 3 g, 15-oz can of beans or tomatoes 400 g). A unit with no known weight makes the ingredient count as missing.
- Pinch/dash: 0.4 g.

## Per-serving calculation
Sum over counted ingredients of (grams × nutrient per 100 g / 100), divided by the recipe's serving count. Changing servings does not change per-serving values. Personal versions are calculated from their own ingredient lists.

Not counted, and listed under the estimate:
- **Optional** ingredients (garnishes, toppings).
- **"To taste"** ingredients with no quantity (usually salt and pepper), so sodium is understated.
- **Water**.
- **Unmatched** ingredients or units, which are never treated as zero. They are named, and they lower the status.

## Status
- **Estimated**: every counted ingredient was matched and converted.
- **Partial estimate**: one or two ingredients are missing and at least 80% were counted. The missing ones are named; the real values are higher.
- **Unavailable**: more missing than that, or no usable quantities.

Library coverage at release: 1,061 estimated, 401 partial, 89 unavailable (of 1,551).

## Assumptions and limits
- Raw, as-listed weights. No adjustment for cooking losses, fat drained from browned meat, oil left in the pan after frying, or marinade discarded. Deep-fried and marinated dishes are therefore overstated for fat.
- Bone-in cuts are weighed with the bone, while USDA values are for edible meat, so these are overstated.
- Substitutions are not reflected unless you save a personal version with the substitute.
- Sodium excludes salt "to taste".

## Checks (regression suite)
- 100 g butter equals the USDA value.
- 1 cup uses the food's own cup weight.
- Unmatched ingredients make the result Partial or Unavailable, never zero.
- Optional ingredients are excluded and listed.
