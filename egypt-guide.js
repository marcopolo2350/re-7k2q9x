/* Kitchen guidance for the Egyptian batch 1 (Phase 5B.3). Loaded after guide.js and before app.js.
   Each recipe gets: how to tell it is done, what to expect, two common mistakes, storage advice and two fix-it
   notes built from a standard template for its kind of dish. Written as general guidance, not yet reviewed by a cook.
   Listed in docs/EGYPT-BATCH-1.md. */
(function () {
  // [done, expect, mistake 1, mistake 2]
  const NOTES = {
    7001: ["Beans are hot all the way through and the garlic smells cooked, not raw.", "A warm, earthy, lemony bowl of fava with a soft, slightly chunky texture.", "Adding lemon while the pot is still boiling makes it taste sharp and dull.", "Using too much water leaves the beans runny."],
    7002: ["Beans are hot and the tahini sauce is smooth and pale with no grainy bits.", "Creamy fava with a nutty, lemony tahini sauce on top.", "Adding hot water to tahini makes it stiff and grainy.", "Letting the beans cool before serving dulls the flavour."],
    7003: ["The sauce is thick and the egg whites are opaque and fully set.", "Eggs gently cooked in a savoury, spiced tomato sauce.", "A watery sauce makes the eggs slide and the bread soggy.", "Overcooking the eggs makes the yolks chalky."],
    7004: ["Cucumbers are bright green and firm with the brine clear and pickled in flavour after 3 days.", "Crisp, sour, garlicky spears that get better after a few days.", "Using soft or old cucumbers makes the pickles soggy.", "Leaving the cucumbers above the brine lets mould grow."],
    7005: ["The eggplant is very soft with no firm lumps when mashed.", "Smoky, creamy and bright with lemon and garlic.", "Not roasting the eggplant long enough leaves a bitter, watery salad.", "Dressing the salad too early makes the tomato release water."],
    7006: ["The sauce is smooth, thick but pourable, and not grainy.", "A thick, nutty, lemony sauce that loosens as it sits.", "Adding all the water at once makes it split.", "Using old tahini can make the sauce bitter."],
    7007: ["The yogurt is smooth and the mint smells fresh when rubbed.", "Cool, tangy, creamy yogurt with a fresh minty finish.", "Using low-fat yogurt makes it thin and watery.", "Salting too heavily hides the mint."],
    7008: ["The cabbage is crisp and the dressing has softened the edges without going limp.", "Crunchy, bright and tangy with a little mint.", "Dressing the salad an hour early makes it soggy.", "Not salting the cabbage leaves it tough."],
    7009: ["The soup is thick, smooth and the kishk has fully softened into the broth.", "A tangy, savoury, creamy soup with a rich, sour note.", "Adding the broth all at once makes lumps that are hard to whisk out.", "Using too much salt, since kishk is already salty."],
    7010: ["The tomatoes have broken down and the soup is smooth and glossy.", "A bright, sweet-savoury tomato soup with a gentle cumin note.", "Not cooking the tomatoes first leaves a raw, sharp taste.", "Blending hot soup without venting the lid can spatter."],
    7011: ["The chicken is cooked through, with no pink near the bone and the sauce is glossy.", "Tender chicken in a rich, savoury tomato sauce.", "Crowding the pan makes the chicken steam instead of brown.", "Simmering too hard breaks the sauce and dries the meat."],
    7012: ["The chicken is cooked through and the coriander sauce is deep green and fragrant.", "Fresh, herby, lemony chicken with a green sauce.", "Adding the coriander too early turns the sauce dull and bitter.", "Skipping the lemon leaves the sauce flat."],
    7013: ["The okra is tender but still holds its shape and the chicken is fully cooked.", "Tender chicken and okra in a mild tomato sauce.", "Cutting the okra too early makes it release slime.", "Overcooking the okra makes it mushy."],
    7014: ["The chicken is charred in places and cooked through, with no pink at the bone.", "Smoky, lemony chicken with a cool, creamy sauce.", "Grilling on high heat burns the outside before the middle cooks.", "Pouring cold tahini straight from the jar makes it thick."],
    7015: ["The beef is fork-tender and the cabbage is soft but still holds its shape.", "A hearty, savoury stew with soft beef and sweet cabbage.", "Adding cabbage too early leaves the stew watery and overcooked.", "Stewing on too high heat toughens the beef."],
    7016: ["The liver is just cooked through and no longer pink in the middle.", "Tender, rich liver with sweet, dark onions.", "Overcooking the liver makes it grainy and tough.", "Crowding the pan makes the liver steam and turn grey."],
    7017: ["The meat is browned on the outside and cooked through.", "Juicy, smoky, lightly spiced meat with a crisp edge.", "Using lean, dry meat without fat makes the skewers tough.", "Packing the skewers tightly stops the heat reaching the centre."],
    7018: ["The fish flakes easily and is opaque all the way through.", "Tender, lightly smoky fish with a lemony sauce.", "Moving the fish too early on the tray makes it stick.", "Using wet fish makes it steam rather than roast."],
    7019: ["The shrimp is opaque and the coating is golden and crisp.", "Crisp, golden, spiced shrimp that stay juicy inside.", "Frying in oil that is too cool makes the coating soak up oil.", "Overcrowding the pan drops the oil temperature."],
    7020: ["The sardines are crisp and golden with the flesh opaque right through.", "Crisp, salty, slightly smoky fish with a soft centre.", "Using old fish gives a strong, unpleasant flavour.", "Frying too long dries out the fish."],
    7021: ["The cabbage is tender and the rice in each roll is fully cooked.", "Soft, lemony, herby rolls in a tangy tomato sauce.", "Rolling too loosely lets the filling fall out while cooking.", "Boiling hard breaks the rolls apart."],
    7022: ["The eggplant is soft all the way through and the rice is tender.", "Soft eggplant with a fragrant, herby rice filling in tomato sauce.", "Scooping the shells too thin makes them collapse.", "Leaving the rice undercooked gives a hard centre."],
    7023: ["The meat is very tender and the rice is fully cooked and fluffy.", "A rich, layered dish of soft meat, rice and bread soaked in broth.", "Using dry bread makes the dish dry rather than soaked.", "Letting the rice sit in the pot too long makes it sticky."],
    7024: ["The pasta is just tender with a little bite and the sauce coats the back of a spoon.", "Sweet, savoury tomato pasta with a gentle cumin flavour.", "Overcooking the pasta makes it soft and mushy.", "Skipping the sugar can leave the sauce sharp."],
    7025: ["The rice and lentils are tender and the topping onions are dark brown and crisp.", "A savoury, earthy one-pot dish with sweet, crisp onions on top.", "Burning the onions makes the whole dish bitter.", "Adding too much water makes it soggy."],
    7026: ["The cabbage is tender but still a little bright in colour.", "Soft, lemony cabbage with a gentle cumin flavour.", "Cooking on high heat leaves it brown and bitter.", "Adding lemon too early makes the cabbage tough."],
    7027: ["The eggplant is tender and holds its shape in the sauce.", "Soft, saucy eggplant with a gentle cumin tomato flavour.", "Not frying the eggplant first makes it soak up too much liquid.", "Simmering too hard breaks it into a purée."],
    7028: ["The patties are deep golden and cooked through in the centre.", "Crisp outside, soft and herby inside, with a fresh filling.", "Overworking the batter makes dense, heavy patties.", "Frying at too low a temperature soaks up oil."],
    7029: ["The rings are golden brown and sound hollow when tapped.", "Soft, slightly sweet bread with a crunchy sesame crust.", "Shaping the rings unevenly makes some dry before others are cooked.", "Skipping the egg glaze means the sesame falls off."],
    7030: ["The top is deep golden and crisp and the syrup has soaked in.", "Crisp, buttery, nutty pastry soaked in sweet lemon syrup.", "Pouring hot syrup on hot konafa makes it soggy.", "Using too little butter leaves the pastry dry and pale."],
    7031: ["The halva holds its shape when cut and the surface is glossy.", "Dense, sweet and nutty with a smooth, sliceable texture.", "Stirring tahini into syrup that is too hot can make it split.", "Not pressing the mix firmly leaves air pockets."],
    7032: ["The tea is deep red and the hibiscus flavour is tart but pleasant.", "Tart, floral, deep red and refreshing.", "Boiling the petals makes the drink bitter.", "Adding too much sugar hides the tart character."],
    7033: ["The drink is smooth, thick and tangy without seeds or fibres.", "Sweet, sour, brown and refreshing.", "Not straining well leaves grit in the drink.", "Using very hot water to soak makes the flavour harsh."],
    7034: ["The tea is fragrant with anise and has a light, sweet taste.", "A warm, sweet, liquorice-like aroma.", "Boiling anise too hard can make it bitter.", "Using old anise seeds gives a weak flavour."],
    7035: ["The tea is amber in colour with a fresh mint aroma.", "Refreshing, lightly sweet tea with a clear minty finish.", "Steeping mint too long makes the tea bitter.", "Adding mint at the start loses its freshness."],
    7036: ["The lemonade is bright, sweet and well chilled.", "Tart, sweet and minty with a fresh finish.", "Muddling mint hard can make it bitter.", "Using too much sugar hides the lemon."]
  };

  const STORE = {
    stew: { fridge: "Refrigerate within 2 hours in a covered container; keeps 3 days. Rice and bread soften overnight.", freeze: "Freezes up to 2 months, though fresh herbs lose colour.", reheat: "Reheat gently with a splash of water or broth until steaming.", ahead: "Cook a day ahead; the flavours deepen overnight." },
    fried: { fridge: "Keep in an airtight container for up to 1 day; they soften as they cool.", freeze: "Freezes poorly once fried.", reheat: "Reheat in a hot oven for 5 to 8 minutes to re-crisp.", ahead: "Fry just before serving for the best crunch." },
    salad: { fridge: "Keep covered up to 2 days; dress just before serving for best texture.", freeze: "Does not freeze well.", reheat: "Serve cold; do not reheat.", ahead: "Prepare the vegetables a day ahead and dress when serving." },
    soup: { fridge: "Refrigerate within 2 hours; keeps 3 days.", freeze: "Freezes up to 2 months; thaw in the fridge.", reheat: "Reheat gently, stirring, until steaming.", ahead: "Make a day ahead and reheat." },
    dessert: { fridge: "Keep in an airtight container in the fridge up to 3 days.", freeze: "Freezes up to 1 month, though texture can change.", reheat: "Serve at room temperature or chilled.", ahead: "Make a day ahead so it can set or soak." },
    drink: { fridge: "Keep chilled and drink within 2 days.", freeze: "Freeze as ice cubes to chill without diluting.", reheat: "Serve warm or chilled as you like.", ahead: "Make ahead and chill." }
  };
  const KINDS = {
    7001: "stew", 7002: "stew", 7003: "stew", 7004: "salad", 7005: "salad", 7006: "salad", 7007: "salad", 7008: "salad",
    7009: "soup", 7010: "soup", 7011: "stew", 7012: "stew", 7013: "stew", 7014: "fried", 7015: "stew", 7016: "fried", 7017: "fried",
    7018: "fried", 7019: "fried", 7020: "fried", 7021: "stew", 7022: "stew", 7023: "stew", 7024: "stew", 7025: "stew", 7026: "salad",
    7027: "stew", 7028: "fried", 7029: "bread", 7030: "dessert", 7031: "dessert", 7032: "drink", 7033: "drink", 7034: "drink", 7035: "drink", 7036: "drink"
  };
  const RESCUE = {
    stew: { thick: { f: "Stir in 1/2 cup warm broth or water at a time until it loosens.", ok: true }, watery: { f: "Simmer uncovered for 5 to 10 minutes so it reduces.", ok: true }, bland: { f: "Add salt a pinch at a time, then a squeeze of lemon.", ok: true } },
    fried: { soggy: { f: "Re-crisp in a hot oven for 5 minutes on a rack.", ok: true }, greasy: { f: "Drain on paper towel and blot the surface.", ok: true } },
    salad: { watery: { f: "Drain off the liquid and re-dress with a little fresh lemon and oil.", ok: true }, bland: { f: "Add salt and a squeeze of lemon, then taste again.", ok: true } },
    soup: { thick: { f: "Thin with warm broth a little at a time.", ok: true }, bland: { f: "Add salt and a squeeze of lemon, then taste.", ok: true } },
    dessert: { dry: { f: "Brush with a little warm syrup to moisten it.", ok: true }, sweet: { f: "Serve with unsweetened yogurt or a squeeze of lemon to balance it.", ok: true } },
    drink: { sweet: { f: "Dilute with cold water and add a squeeze of lemon.", ok: true }, bland: { f: "Steep a little longer or add more of the main flavouring.", ok: true } },
    bread: { dry: { f: "Brush with a little water and warm briefly in a low oven.", ok: true }, undercooked: { f: "Return to the oven in 3-minute bursts until the centre sounds hollow.", ok: true } }
  };

  if (typeof EGYPT === "undefined" || typeof GUIDE === "undefined") return;
  EGYPT.forEach(a => {
    const id = a[0], kind = KINDS[id] || "stew", n = NOTES[id];
    if (!n) return;
    GUIDE[id] = {
      store: STORE[kind],
      done: n[0],
      expect: n[1],
      mistakes: [n[2], n[3]],
      rescue: RESCUE[kind] || {}
    };
  });
})();
