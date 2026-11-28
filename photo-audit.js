/* Photo audit, 2026-11-27: every one of the 124 displayed library photographs was looked at next to its recipe name.
   These did not clearly show the named dish, so they are no longer displayed; the recipe gets its typographic cover.
   Image files and attribution stay in the repository untouched, so a hidden photo can be restored by deleting its line.
   A photo the user added themselves is always shown. Details: docs/PHOTO-AUDIT.md */
const PHOTO_HIDE = new Map([
  [7, "cafeteria tray with several dishes, not butter chicken and rice"],
  [9, "a soup, while the recipe is a creamy skillet dish"],
  [108, "tomato flatbread with no visible pesto or chicken"],
  [3043, "tray of salad and broth; no tacos visible"],
  [3047, "wrapped sandwich, not chicken tinga"],
  [3088, "looks like noodles, not pepper steak"],
  [3099, "paper cone wrap, not moo shu pork"],
  [3100, "shredded beef with no rice noodles"],
  [3103, "thick grilled strips that look like galbi, not bulgogi"],
  [3135, "rice and mixed vegetables; no Salisbury steak visible"],
  [3156, "pale cream soup, not a dark-roux gumbo"],
  [3158, "restaurant table, dish not identifiable"],
  [3163, "mostly fries and chips; catfish not identifiable"],
  [3177, "plain chicken pieces with no korma sauce"],
  [3186, "looks like a rice dish, not keema matar"],
  [3502, "plated vegetables and meat; no pie visible"],
  [3517, "meatballs on mashed potato, not in salsa"],
  [52808, "dark restaurant photo, dish not identifiable"],
  [52847, "tomato stew without the beans of a cassoulet"],
  [52850, "dish not identifiable as chicken couscous"],
  [53036, "fry-up plate; no boxty visible"]
]);
