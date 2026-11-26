# Phase 3 and 4 completion ledger (release v3.0-phase3-4, commit 1a7ceeb)

**Statuses:**
- **Verified:** automated test on production, desktop browser.
- **Implemented:** works in desktop or mobile-emulation checks, no dedicated automated test.
- **Partial:** some of it isn't done.
- **Deferred:** not built.

Nothing has been tested on a physical iPhone.

| Requirement | Status | Evidence / notes |
|---|---|---|
| Cooking history (date, rating, make again, times, notes, swaps, changes, worked/didn't, next time, servings, who loved it) | Implemented | History card renders on the recipe (test). The entry form itself was checked manually on desktop only. |
| Personal photos in history | Implemented | IndexedDB, 720 px JPEG. Storage check before saving; the note is kept if the photo can't be stored. Delete in Settings. Included in backup (restore test). |
| Recipe versions (edit, compare, duplicate, delete, restore original) | Verified | Original unchanged after version creation; compare lists removed items. |
| Collections (8 defaults, create, rename, delete, add/remove) | Partial | Defaults present (test). Rename/delete checked manually only. |
| Recommender (mood, time, effort, cuisine, main, equipment, servings, shopping, diet best-guess, familiar/new) | Verified | New user gets 3 with reasons; rejected not re-suggested; affinity only from recorded favorites/history; shuffle; pick-for-me. |
| Decision fatigue: Surprise me / Pick for me | Implemented | Home chips and sheet button. |
| Leftovers by type, storage and handling | Verified | Counter or slow cooling = discard; unknown handling = uncertain with no ideas; day 4 = discard; fresh = ideas. |
| Pantry inventory (qty, unit, bought, opened, use-by, location, low, staple, often bought) | Partial | Use-soon detection tested. Editor checked manually. "Often bought" counts only purchases confirmed after this release. |
| Use What We Have | Verified | Prioritises use-soon items; reasons shown. Dates labeled as quality reminders. |
| Grocery: aisles, consolidation, compatible units, pantry deduction, groups, swaps, manual items, checkboxes, aisle order, meal links, confirm-to-pantry | Verified (core) | Single deduction from combined total; incompatible units not deducted; metric+imperial weights combine. Aisle order and confirm sheet checked manually only. |
| Meal prep plan | Partial | Groups shared prep with storage windows. Doesn't merge cooking of shared proteins. |
| Planner: B/L/D/S, multiple per meal, leftovers meal (not added to groceries), repeat next week, copy last week, copy entry, replace, move (edit) | Verified (core) | Leftover entries excluded from groceries; copy week. **Drag-and-drop deferred**: Move/Copy/Replace buttons are provided instead. |
| Equipment profile; equipment filter; burner-aware timeline; oven conflicts; alternatives text | Verified | 120 generated meals at 4 and 2 burners: no impossible schedules, no oven conflicts. |
| Technique guide (22 techniques) linked from steps and cooking mode | Verified | Links render; overlay keeps cooking progress. |
| Variations | Implemented | 4,214 variations on 1,551 recipes after dropping 275 vague ones. AI-generated. |
| Nutrition | Verified (method) | 1,061 estimated / 401 partial / 89 unavailable. Unit tests against USDA values. |
| Six-destination navigation and For You dashboard | Implemented | All tabs render with no overflow at 375 px (test). |
| Data format v3 migration | Verified | Realistic Phase 2 data preserved; defaults added; pre-upgrade copy kept. |
| Backup/restore | Verified | See SCHEMA.md and the regression list. |
| Isolated regression (`?testenv=1&selftest=full`) and read-only diagnostics (`?diag=1`) | Verified | Production run created only `roses-eats-TEST*` keys; local diagnostics left real data byte-identical. |
| Photo licensing | Plan only | docs/PHOTO-REMEDIATION.md (survey incomplete because of Commons rate limits). |
| Phase 5 architecture | Proposal only | docs/PHASE5-ARCHITECTURE.md. |
