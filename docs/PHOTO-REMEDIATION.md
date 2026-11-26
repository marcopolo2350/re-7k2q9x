# Photo licensing: survey and remediation plan

Status: **plan only.** No money has been spent, no history has been rewritten and the repository's visibility hasn't changed. No new unlicensed images have been added since the manifest was created.

## Current state (from `photo-manifest.json`)
| Group | Images | Status |
|---|---|---|
| Wikimedia Commons, CC BY-SA 4.0 (Ful Medames, stuffed figs) | 2 | Verified licence; credit shown in the app |
| Local images from web image search | 776 | Unverified, all rights reserved by default. **Flagged for replacement.** |
| TheMealDB, hotlinked (not stored in the repo) | 773 | Conditional. TheMealDB's terms say most artwork is user-submitted, and none of these meals has its Creative Commons flag set. The free key is for development use. Their paid key does **not** clearly grant redistribution or public-hosting rights for user-submitted images, so buying it is not a fix. |

## Wikimedia Commons coverage survey
- **Method:** for each recipe name, an automated Commons search filtered to images at least 800 px wide, licensed CC0, CC BY, CC BY-SA or public domain, with a title matching the dish name.
- **Result:** Commons rate-limited the survey (HTTP 429) after **210 of 1,551 recipes**. Those 210 are mostly the original American comfort-food recipes.
  - 106 of the 210 (50%) had at least one licence-compatible candidate: 64 CC BY-SA, 22 CC BY, 16 CC0 and 4 public domain.
  - 104 had none.
  - The other 1,341 recipes weren't surveyed.
- **Caveat:** a candidate means a filename match, not a checked photo. Earlier hand review found that well under half of automated candidates actually show the right dish at good quality.
- **Estimate:** expect roughly **20 to 35%** of recipes to get a good Commons photo after visual review. Popular international dishes do better; generic American recipes ("Easy Chicken Pesto Pasta Lunch") do worse.

## Options for the rest
1. **Openverse** (Flickr CC and others). Same licence rules as Commons. It might add about 10% more coverage, but quality varies and attribution is per photo.
2. **Your own photos.** The app already lets you add a photo to any recipe and keeps it on your phone. That is fully authorized and the most authentic option, but slow.
3. **Original generated illustrations,** clearly labeled as generated. This needs an image-generation tool, which isn't available in this environment and was not authorized (no paid AI services). If you approve a free or local generator, each image must be checked against the recipe and labeled "Illustration (generated)".
4. **Neutral placeholder.** The app's existing category tile (emoji on a colored card) is used whenever a photo is removed. It is never an inaccurate photo.

## Recommended plan
1. **Stop serving the 776 unverified local images.** Replace them with the neutral placeholder, or with verified Commons or Openverse photos where found. This is a large visible change, so it needs your go-ahead.
2. **Commons and Openverse pass, done in batches.** Search, hand-review contact sheets, keep only accurate photos, and record creator, licence, source and checksum in the manifest. Show a credit line in the app.
   - Effort: about 2 to 3 sessions per 300 recipes.
   - Storage: about 100 KB per photo at 800×600, so 400 photos is about 40 MB. That is less than today's 75 MB of unverified images.
   - Cost: $0.
3. **TheMealDB's 773 hotlinked photos.** Keep them only if you accept the remaining uncertainty for a household app, with "Photo: TheMealDB" attribution. Otherwise give them the same Commons, Openverse or placeholder treatment. Don't buy the paid key for this purpose.
4. **Your own photos** for favorites over time.

## Git history
The 776 unverified images are in the public repository's history. Replacing them in new commits stops serving them on the site, but they stay in history until the history is rewritten (for example with `git filter-repo`) and force-pushed.

A rewrite changes every commit hash, needs a backup first, and invalidates the tags. Making the repository private would hide the source, but it doesn't make the images licensed, and Pages on a private repository needs a paid plan.

**Each of these needs your explicit approval.**
