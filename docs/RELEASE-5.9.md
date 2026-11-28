# Release v5.9-cookbooks (2026-11-28)

Not a final acceptance. The owner reviews the live app before anything is called finished.

## What changed

- **16 chapters**, exactly as specified, with Pasta & Noodles and Rice & Grains separate. Recipes found misfiled while reading
  every catch-all section were corrected (for example frog legs and barramundi were under Vegetarian; samosas and spinach dip
  under Desserts; borscht under Beef). The large "More …" sections were split into real subchapters. Pork dishes are a section
  of Beef & Lamb because the specified list has no pork chapter.
- **Contents page** set like a printed cookbook: numbered chapters, dotted leaders, page numbers, expandable sections.
  The first page of each chapter is a full chapter opener. Animation, swipe and corner-drag are unchanged.
- **Typographic covers** composed by kind of dish (soups, sweets, Egyptian, comfort, fresh, breakfast, drinks, small plates,
  family recipes). The 103 verified photographs are kept; the 21 mismatched ones stay hidden.
- **Search**: every result has Book, Cook, Favorite, Bookmark, Plan and Shop. Opening a recipe from search offers
  "Back to results" with the same query.
- **Importer** (built on the existing "Add our own recipe" form): paste text, ingredient lists and steps; personal photo;
  whose recipe it is and its story; source link. Recipe websites that publish standard recipe data (schema.org) are read
  directly from the phone. TikTok and YouTube give only a title; Instagram gives nothing, so the caption is pasted.
  A site that blocks other apps is reported, never guessed. Duplicates are detected before saving.
- **Personal cookbooks**: title, subtitle, dedication, four cover styles or a photo, chapters, ordering, per-recipe notes;
  opens in the same animated book; prints as a PDF (phone's Print → Save as PDF) with a linked contents page;
  exports and imports a cookbook file; included in both backup formats.
- **Cooking**: While you wait never suggests a task that needs equipment already in use.
- **Repair**: nav.js and index.html had been garbled by an encoding-unsafe version bump in the two previous deploys
  (70e7aa6, 403318d). This is what let one emoji through on the live home screen, and it could make the page hang.

## The 1,587 / 1,588 count

The library has 1,587 recipes (fresh profile: 1,587). 1,588 appears only on a device that also has one personal recipe.
The one seen during testing ("Our soup") lives in the test environment's separate storage key (`roses-eats-TEST`),
created by the regression suite. Household data (`roses-eats-v1`) is never touched by tests.

## Verified (headless Edge, isolated profiles, not a physical iPhone)

- All suites on production build de2f9cc45b: see the run log in the session report.
- Offline: with the server stopped, the app opens with all recipes, 16 chapters, the page-turn book, search and the
  seeded household data intact.
- Update now: a newer build is detected, installed and loaded; seeded favorites, plan, pantry, notes, bookmarks, grocery
  selection, a family recipe and a personal cookbook are byte-for-byte unchanged.

## Not verified

- A physical iPhone (Safari and the installed Home Screen app), including Print → Save as PDF on iOS.
- Entering the passcode (the gate was hidden in test copies; no passcode was entered).
- Reading real recipe websites from a phone: depends on each site allowing it.
