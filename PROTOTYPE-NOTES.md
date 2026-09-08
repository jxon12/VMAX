# V-MAX prototype — journey & season update

> Historical implementation notes from the earlier Journey/Season iteration. For the current Agent/Profile/Journey behavior, demo boundaries and verification, use [REVIEW-GUIDE.md](./REVIEW-GUIDE.md). Navigation, current-time selection and route presentation below describe that earlier version.

## What now works locally

- This Season: minimal photo-card deck. Swipe left (or press the Right arrow key) for the next place; swipe right (or press the Left arrow key) for the previous place. First/last cards stay at the boundary. Browsing never changes Saved; only the on-card bookmark toggles collection membership. Categories, details and the top-right Saved shortcut remain. Editorial masthead, footer actions and instructional copy were removed; screen-reader status announcements remain.
- Saving inspiration never inserts it into an existing trip. “Plan a trip here” goes directly to setup and creates a separate trip ID.
- Setup carries exact dates, inclusive day/night counts, member count, MYR budget, multiple mobility/dietary requests, traveller types and interests into the trip.
- The selected inspiration becomes an actual scheduled activity. Unplanned days are explicitly empty rather than populated with unrelated destinations.
- Overview, Plan and Route read the same selected day and stops. Edits, completion, removal and reorder all update that shared model.
- Activity insertion is destination- and trip-specific; day/time/duration can be chosen and edited. Timing, seasonal and suitability warnings are shown before draft insertion.
- Documents open an editable local notes panel and a clearly labelled sample pass. The checklist saves its checked state and custom items.
- Group messages persist per trip. @V-MAX can propose a rule-based 30-minute break; the itinerary changes only after confirmation and the action is idempotent.
- Expenses have an input form, categories, payer and equal-split participants. Totals, Overview balance and member net balances derive from the same records.
- Trips, Saved and Travel DNA defaults persist in versioned local storage. Bad stored data is not silently overwritten. Browser navigation, invalid links, search results and filter-return state are handled.
- Navigation exposes Home, Discover, V-MAX, Trips and Profile. Profile contains Travel DNA defaults and a Saved places entry with the actual collection count. The This Season shortcut also opens that same collection.
- Dialogs have accessible labels, keyboard trapping, Escape dismissal and focus restoration. Reduced-motion preferences are respected.

## Explicit prototype boundaries

- Demo clock: **13 September 2026**. Photos are illustrations of the destination, not live conditions.
- Suggestions and gentler-day changes are local rules, not an LLM backend. New journeys are editable starting drafts, not fully generated/booked vacations.
- Route is a **not-to-scale sequence with sample connection estimates**, not a geographic map, live directions or GPS. No access, dietary safety, weather or ticket availability is verified.
- Voice input and group calls are simulations: no microphone or real participant connection. The introduction remains an animation, not an uploaded demo video.
- Members are local demo profiles. There are no join links, authentication, private member records or multi-device synchronization. “Copy trip summary” is not an invitation.
- Documents store sample notes only; there is no real ticket retrieval, file wallet or offline document download.
- Expense records are local arithmetic, not payments. Activity estimates are separate from paid expenses. Removed the previous repeatable fake savings deduction.
- No unrelated source files or existing approved home photo/logo assets were removed.

## Verification

`npm run build` — TypeScript and production build.

`npm test` — ten domain regression tests covering destination isolation, correct dates/budgets, seed insertion, same-city trip identity, immutable/idempotent rest proposals, reorder timing, warnings, seasonal windows and invalid input.

Browser checks used a separate local origin on port 5175 so test trips, messages and expenses did not modify the main prototype’s storage. Checked save/undo/reload, 320/390px layouts, dialogs/checklist, selected-day route synchronization, Tokyo-only insertion, group proposal/confirmation/reload, MYR expense/Overview balance, an eight-day two-person Shanghai trip, and return-to-Discover filters.
