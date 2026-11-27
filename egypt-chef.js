/* Chef notes for the Egyptian batch 1 (Phase 5B.3). Loaded after egypt.js and before app.js.
   Roles (rl) and levels (lv) are inferred from each ingredient's name and note by the rules below, then
   two short cooking tips are written per recipe. They are not yet reviewed by a cook; see docs/EGYPT-BATCH-1.md. */
(function () {
  const TIPS = {
    7001: ["Mash only part of the beans so the dish keeps some texture.", "Add the lemon off the heat so its flavour stays bright."],
    7002: ["Whisk the tahini with cold water rather than hot to keep it smooth.", "Warm the beans gently; overheating makes them dry."],
    7003: ["Cook the tomatoes until the sauce thickens, or the eggs will sit in a watery sauce.", "Cover the pan so the whites set without overcooking the yolks."],
    7004: ["Use firm, fresh cucumbers; soft ones turn mushy in brine.", "Keep the cucumbers fully covered by brine so the top does not spoil."],
    7005: ["Roast the eggplant until fully collapsed so it is smooth and not watery.", "Salt lightly after mashing and add more lemon if it tastes flat."],
    7006: ["Add the water slowly; tahini tightens sharply at first and then loosens.", "Use fresh lemon for a clean, bright flavour."],
    7007: ["Rub the dried mint between your palms to wake its aroma before sprinkling.", "Full-fat yogurt gives a richer, creamier result."],
    7008: ["Salt the cabbage first so the salad stays crisp rather than soggy.", "Dress just before serving for the best crunch."],
    7009: ["Kishk is salty and sour, so taste before adding more salt.", "Whisk the broth in gradually to avoid lumps."],
    7010: ["Adjust thickness with broth rather than water for more flavour.", "Blend until fully smooth for the classic texture."],
    7011: ["Brown the chicken well for colour; it adds flavour to the sauce.", "If the sauce looks thin, let it reduce uncovered for the last 10 minutes."],
    7012: ["Use plenty of fresh coriander; the sauce depends on it.", "Add the lemon at the end so it stays fresh."],
    7013: ["Fry the okra briefly before simmering to reduce sliminess.", "Choose small, bright okra pods."],
    7014: ["Marinate for at least 2 hours for the best flavour.", "Keep the tahini sauce loose so it spoons over easily."],
    7015: ["Cook the beef until tender before adding the cabbage, or the cabbage will overcook.", "Wedges hold their shape better than shredded cabbage in this stew."],
    7016: ["Do not overcook liver; it turns grainy and tough.", "Sweet caramelised onions balance the richness of the liver."],
    7017: ["Keep the cubes a similar size so they cook evenly.", "Leave a small gap between pieces so the heat reaches the centre."],
    7018: ["Pat the fish dry for better browning.", "Use firm fish so it does not break apart on the tray."],
    7019: ["Keep the oil near 350°F; hot oil burns the coating and cold oil makes it greasy.", "Fry in batches so the oil stays hot."],
    7020: ["Fry whole sardines quickly so they stay moist inside.", "Use very fresh fish for the best flavour."],
    7021: ["Blanch the leaves to make them flexible for rolling.", "Pack the rolls tightly so they do not open while cooking."],
    7022: ["Fry the eggplant lightly so the shells keep their shape.", "Let the dish rest a few minutes after cooking so the filling sets."],
    7023: ["Toast the bread well so it does not turn soggy.", "Skim the broth well for a clean flavour."],
    7024: ["Cook the pasta just until tender; it will soften in the sauce.", "A pinch of sugar balances the tomato acidity."],
    7025: ["Fry the onions slowly until deeply browned for the topping.", "Add the rice only after the spices smell fragrant."],
    7026: ["Cook the cabbage gently so it softens without browning.", "A squeeze of lemon at the end brightens it."],
    7027: ["Fry the eggplant until golden before adding the sauce so it holds its shape.", "Simmer gently so the eggplant does not break down."],
    7028: ["Do not overwork the fava mixture; a coarse texture keeps the patties light.", "Fry at a steady temperature so the centre cooks through."],
    7029: ["Shape the rings evenly so they bake at the same rate.", "Brush with egg before adding the sesame so the seeds stick."],
    7030: ["Cool the syrup completely before pouring it over hot konafa for a crisp top.", "Toast the nuts lightly before using for more flavour."],
    7031: ["Stir the tahini in off the heat so it stays creamy.", "Press the halva firmly into the pan for an even slice."],
    7032: ["Steep the hibiscus, do not boil it, for a clean flavour.", "Taste before adding all the sugar, since hibiscus is naturally tart."],
    7033: ["Soak in hot water and mash well to release the flavour.", "Strain well to remove seeds and fibres."],
    7034: ["Use fresh anise seeds for the best aroma.", "Serve warm, not boiling."],
    7035: ["Add the mint at the end so it stays fresh and green.", "Strain before serving to keep the tea clear."],
    7036: ["Muddle the mint gently so it releases its oil without bitterness.", "Chill well so the lemonade is refreshing."]
  };

  // Level: O = optional or garnish, S = substitutable, E = essential
  const lvOf = g => {
    const note = (g.note || "") + " " + (g.item || "");
    if (/optional|to serve/i.test(note)) return "O";
    if (/parsley|dill|coriander|mint|pistachio|nut|cheese|pepper|chil|tomato|cucumber|carrot|lemon|lime|rose water|vanilla|sesame|breadcrumb|cumin|paprika|allspice|cinnamon|anise|bay leaf|torshi/i.test(g.item)) return "S";
    return "E";
  };
  // Role letters, as used in kitchen.js ROLE (P protein, B base, V vegetable, F fat, A acid, W sweetener, M liquid, X flavour, Z seasoning, G garnish, L leavening, T thickener)
  const rlOf = g => {
    const it = (g.item || "").toLowerCase(), note = (g.note || "").toLowerCase();
    if (/^salt|pepper$|black pepper/.test(it)) return "Z";
    if (/garlic|cumin|paprika|cinnamon|allspice|coriander|bay leaf|mint|parsley|dill|chil|rose water|vanilla|anise|tea|hibiscus|tamarind|sesame|pistachio|nut|cheese|torshi|shatta|kishk/.test(it)) return (/serve|optional|top/.test(note) ? "G" : (/kishk/.test(it) ? "B" : "X"));
    if (/chicken|beef|lamb|liver|fish|shrimp|sardine|egg|fava|lentil/.test(it)) return "P";
    if (/rice|pasta|spaghetti|penne|bread|pita|flatbread|kunafa|dough/.test(it)) return "B";
    if (/flour/.test(it)) return "T";
    if (/baking powder|yeast/.test(it)) return "L";
    if (/oil|butter|ghee|tahini/.test(it)) return "F";
    if (/lemon|vinegar|lime/.test(it)) return "A";
    if (/sugar|honey|syrup/.test(it)) return "W";
    if (/water|broth|milk|yogurt|stock/.test(it)) return "M";
    if (/tomato|onion|cabbage|eggplant|okra|cucumber|carrot|pepper|bean|potato|green/.test(it)) return "V";
    return "X";
  };

  if (typeof EGYPT === "undefined" || typeof CHEF === "undefined") return;
  EGYPT.forEach(a => {
    const id = a[0], parts = a[9].split(";").map(s => { const p = s.split("|"); return { item: (p[1] || "").trim(), note: (p[2] || "").trim() }; });
    CHEF[id] = {
      lv: parts.map(lvOf).join(""),
      rl: parts.map(rlOf).join(""),
      tips: (TIPS[id] || []).map(t => ({ t, s: 0 }))
    };
  });
})();
