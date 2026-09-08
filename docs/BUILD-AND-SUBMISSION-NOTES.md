# V-MAX — Build and submission notes

Supporting detail for the team. Start with the [judge-facing README](../README.md); all essential ideation and mentor content remains there.

These notes retain the detailed capability checks, proposed infrastructure, cost assumptions and submission preparation removed from the longer README. Proposals are not implemented services or approved budgets.

**Public prototype:** [vmax-one.vercel.app](https://vmax-one.vercel.app/). On 8 September 2026, the deployed frontend opened without authentication and exposed the current Hey V-MAX action workspace. Vercel hosts the frontend; journey data still stays in the browser. This is not evidence of a live backend, real authentication or connected AI.

## Prototype capability matrix

| Area | Implemented locally | Simulated, absent or not guaranteed |
| --- | --- | --- |
| Planning | Destination-aware journey creation, date/traveler/budget validation, activity placement and editing | No general-purpose AI itinerary model or live venue inventory |
| Agent coordination | Mention routing, permitted-field replies, availability/transfer/budget checks, approvals and proposal application | Deterministic example replies; no separate running Agents, A2A network or real messages to members |
| Trip updates | Reviewable closure scenario and source link; accepted changes modify the local itinerary | Closure discovery and demonstration clock are fixtures, not monitoring or a live alert |
| Hey V-MAX | Action workspace for flights, coordination and journey tools; optional typed intent routing | No model reasoning, working wake word, realtime microphone, image understanding or voice call |
| Flight comparison | Fictional carrier-neutral KUL → Tokyo round-trip options, baggage/direct filters, per-person and group totals, confirmed wallet shortlist | Not live prices, available seats, provider-verified taxes, a ticket or purchase; no expense is created |
| Profile | Local display name, email-shaped sample and departure preference; local demo sign-in/out | No authentication, verification email, password, real account or cloud session; use sample data |
| Journey state | Plan, next stop, decisions, documents and expenses share data; changes survive a normal refresh | No cross-device sync, concurrent-user conflict handling or server-enforced access control |
| Route and arrival | Static map/photo guidance, manual arrival state and external transport links | No GPS detection, indoor positioning, live navigation or automatic taxi order |
| Budget | Editable receipt items and weighted portions, exact-cent allocation, repeat-safe receipt resaving | No camera OCR, bank connection, payment or currency conversion service |
| Wallet / preparation | Sample document entries, an explicitly unbooked flight note and rule-derived preparation suggestions | A saved note is not a verified booking, offline ticket download or airline boarding pass |

**Security boundary:** all sample members and their data exist in the same browser. Sharing controls demonstrate intended behavior; they are not secure isolation between real people. Do not enter sensitive travel documents or real private information.

## Architecture and feasibility

### Current architecture, verified against source

The browser renders a React application. Hash navigation selects the page and trip context; `useTravelStore` holds shared state. Components call deterministic domain functions, then update that state. The store writes it to browser `localStorage`. There is **no application server, remote database or connected AI/booking API** in this repository.

| Layer | Current choice and source | Rationale / constraint |
| --- | --- | --- |
| Frontend | React + TypeScript + Vite; [package.json](../package.json), [App.tsx](../src/App.tsx) | Rapid, typed iteration on mobile-first flows; static delivery. Not a native mobile app. |
| Interface | CSS, local visual assets, `simple-liquid-glass` pinned to 4.1.0 | Small glass enhancement with fallback styling. Refraction varies by browser; core controls must work without it. |
| State / persistence | [useTravelStore.ts](../src/state/useTravelStore.ts), [Trip types](../src/types/trips.ts) | One source for journey views; validated recovery/migration. Corrupt stored data is not silently overwritten. Browser storage is not a database or security boundary. |
| Proposal rules | [agents.ts](../src/domain/agents.ts) | Permission, approval, scheduling and Undo checks are inspectable and testable. Transfer assumptions are demo rules, not map estimates. |
| Replies / task routing | [group.ts](../src/domain/group.ts), [assistant.ts](../src/domain/assistant.ts) | Explicit bounded behavior avoids implying a general Agent is connected. Unsupported requests can remain unsupported. |
| Cost allocation | [receipt.ts](../src/domain/receipt.ts) | Integer-cent arithmetic and remainder allocation keep portions consistent; no LLM calculates the final sums. |
| Profile | [profile.ts](../src/domain/profile.ts) | Normalized local details and demo-session state; stable member IDs preserve approvals and expenses. |
| Backend / database | None | Test the interaction and local state contract before adding identity and concurrency. |
| APIs / integrations | None for live intelligence, flight inventory, maps or payments | Official-source and transport links are links, not API integrations. Images/maps are reference assets. |
| Hosting | Vite static frontend deployed on [Vercel](https://vmax-one.vercel.app/) | Public access and the current Hey V-MAX workspace were checked on 8 September 2026. Hosting the frontend does not add a backend, shared database or real accounts. |

### What a production pilot needs first

1. **Identity and permissions:** real authentication, verified trip membership, server-enforced field access, secure document storage, revocation and deletion. Never send a full private calendar to a group Agent and rely only on a prompt to hide it.
2. **One authoritative journey:** versioned trip updates, proposal/approval records and transactional, idempotent application. Concurrent edits must force a re-check rather than overwrite another member's changes.
3. **Evidence before recommendations:** a narrowly scoped source adapter with timestamps, stale-data behavior and source links. An LLM may interpret an update; deterministic constraints and explicit authority govern an action.
4. **Limited assistance, then transactions:** add user-reviewed receipt extraction and opt-in voice after shared decisions work. Live fares require supplier access and re-pricing. Any later purchase requires final confirmation of provider, itinerary, total price and payment—not a general “Agent can help” toggle.

### Proposed pilot stack — selected direction, not provisioned

Keep the **existing Vercel frontend** and propose **Supabase** for the first shared pilot's backend. This preserves the current deployment and gives a small team one managed backend rather than several independent Agent services. A move to Cloudflare Pages is not required; its previously researched costs remain below only as a hosting alternative.

| Component | Proposed responsibility and safeguard |
| --- | --- |
| Existing Vercel frontend | Continue serving the Vite app, with backend secrets kept out of the frontend bundle. Confirm the account's plan, pilot eligibility, allowances and costs before expanding usage; this document does not claim a free production tier. |
| Supabase Auth | Google OAuth for invited pilot users, with identity/profile scopes only—not calendar access. Client registration, consent configuration and redirects must be set up before testing. [Google sign-in documentation](https://supabase.com/docs/guides/auth/social-login/auth-google) |
| Supabase Postgres + RLS | Store trip membership, proposals, approvals and expenses. Separate owner-only private details from explicitly shared fields; deny access by default and test each role. Never expose an administrative secret in the browser. [RLS documentation](https://supabase.com/docs/guides/database/postgres/row-level-security) |
| Supabase Realtime | Deliver authorized shared changes so each member sees the committed Journey; subscribe only to shareable records, not private calendar data. [Postgres Changes documentation](https://supabase.com/docs/guides/realtime/postgres-changes) |
| TypeScript Edge Functions + database RPC | Validate the request and prepare a proposal in an Edge Function. Commit through one restricted Postgres function that rechecks identity, trip version, permissions, constraints and approvals, then writes the plan and audit record atomically. Repeated request IDs must not repeat an action. [Edge Functions](https://supabase.com/docs/guides/functions), [database functions and privileges](https://supabase.com/docs/guides/database/functions) |
| Supabase Cron | Schedule short, bounded source-check jobs for active trips; deduplicate unchanged information before notifying. This is not a continuously running Agent. [Cron documentation](https://supabase.com/docs/guides/cron) |

Personal Agents would initially be **logical per-member roles inside one orchestrator**, each receiving only permitted context. An interoperable A2A network is unnecessary for this pilot. The transaction and disclosure rules stay deterministic regardless of the later model choice. The Vercel frontend is deployed, but the Supabase backend and OAuth configuration described here are proposals, not connected services in the current app.

### Phased build scope

These are **planning estimates**, not a claim that staffing is committed or the work is finished. Confirm against the actual team and build-phase duration.

| Phase | Bounded output | Exit condition | Indicative effort |
| --- | --- | --- | --- |
| Submission prototype | One Tokyo/Fuji story; local coordination, approval, wallet and budget; README/video evidence | Rehearsed end-to-end demo, honest labels, completed evidence | Current phase, before 13 September |
| Secure shared pilot | One city, 3–6 members per group, authenticated membership, versioned state and server permissions | Two accounts cannot read unshared fields or overwrite a stale proposal | 3–4 weeks |
| Evidence-backed coordination | One venue source, a narrow reunion workflow, opt-in notifications and stale-source handling | Sources, permissions and constraints checked before a proposed change | 3–4 weeks |
| Evaluate and harden | Small-group task tests, accessibility, recovery and cost measurement | Users understand approvals; benefit and failure cases are documented | 2 weeks |
| Later, not required for pilot | Voice, reviewed OCR, broader sources and supplier flight search | Separate privacy, access and operational checks | Re-estimate after the pilot |

Louise reports **four team members available to contribute**, with frontend/UI/UX, backend, AI and leadership responsibilities listed above. Individual technology experience, weekly availability, post-competition commitment and budget are not yet confirmed. The **8–10 week estimate is an illustrative build plan, not a team-agreed delivery promise**; revise it against those details. Automatic purchasing, autonomous taxi dispatch, global coverage, indoor navigation and a fully interoperable multi-Agent network are outside this pilot.

**NEEDS TEAM INPUT — confirm technical experience, time commitments, continuation plans, budget and the first real integration to prioritize.** Team roles alone do not establish that a live backend or Agent service is already built elsewhere.

### Resources, cost and operational limits

Official limits checked **8 September 2026**; amounts are **USD**, not MYR. These are planning references, not a statement of active subscriptions or a promise of free production operation. The current Vercel account plan and hosting spend have not been confirmed. Cloudflare figures describe an optional alternative, not the deployed app's hosting bill; Supabase figures describe an unimplemented backend.

| Service / stage | Published cost and relevant allowance | Pilot implication |
| --- | --- | --- |
| Cloudflare Pages Free, optional alternative only | Static requests are free; Free allows 500 builds/month, one concurrent build, 20,000 files and 25 MiB per asset. [Pricing](https://developers.cloudflare.com/pages/functions/pricing/), [limits](https://developers.cloudflare.com/pages/platform/limits/) | Potential US$0 static hosting within terms/limits if the team later chooses it; not current Vercel spend or a required migration. Paid Functions, other services and a purchased domain are not included. |
| Supabase Free, development | US$0/month: 500 MB database, 1 GB files, 5 GB egress, 50,000 MAU, 500,000 Edge invocations, 2 million Realtime messages and 200 peak connections. Two active projects maximum; inactivity pause after one week; no automatic backups. [Official pricing](https://supabase.com/pricing) | Suitable for controlled development, not a reliability promise for a live trip. |
| Supabase Pro, proposed active shared pilot | From US$25/month; US$10 compute credit covers one Micro project. Includes 8 GB database, 100,000 MAU, 250 GB egress, 2 million Edge invocations, 5 million Realtime messages/500 peak connections and seven-day daily backups; no inactivity pause. [Official pricing](https://supabase.com/pricing) | Proposed backend base from US$25/month plus tax, excluding frontend hosting, extra projects/compute, add-ons and overages. This is not the app's total monthly cost; budget approval still required. |
| Model, voice, OCR and travel inventory | No selected provider, confirmed commercial access or price | Excluded from the base subtotal and not silently treated as free. Voice/OCR and booking integrations remain later phases. |

Sizing assumption: **20 trips × 14 active days × 2 scheduled checks = 560 check jobs**, plus explicit user actions. At four members per trip this is at most 80 distinct pilot members, not a demonstrated capacity result. Cache unchanged venue data; measure database size, egress and message fan-out, not just user count. Keep jobs short: Edge Functions have a 2-second CPU limit per request and finite worker duration. [Runtime limits](https://supabase.com/docs/guides/functions/limits)

Set application-level quotas and usage alerts before the pilot; require approval before adding paid services or expanding capacity. **NEEDS TEAM INPUT — account/budget owner, Vercel plan and pilot terms, confirmed staffing, data region/retention decision and measured cost per active trip.** Model and supplier pricing must be assessed separately before those integrations are enabled.

## Run and evaluate

### Local setup

Use a Node.js version supported by the locked Vite package: `^20.19.0` or `>=22.12.0`. Install from the committed lockfile:

```bash
npm ci
npm run dev
```

Run from the repository root containing `package.json`. Open the local address printed by Vite. No API key, account or `.env` secret is needed. Use fake details such as `alex@example.com` for the local profile preview.

```bash
npm test
npm run build
npm run preview
```

The manifest uses `latest` for several dependencies; retain `package-lock.json` and use `npm ci` for the reviewed dependency set. Output is `dist/`. Re-test the [deployed prototype](https://vmax-one.vercel.app/), asset paths, mobile layout and final demo sequence after each deployment change.

### A focused demonstration, under five minutes

Target **4:40**, leaving margin for the five-minute limit. Keep detailed ideation evidence in Section 2 of the main README.

| Time | Show | Point to make |
| --- | --- | --- |
| 0:00–0:30 | Repeated-next-stop experience and target group | A plan exists, but one person still carries coordination |
| 0:30–1:00 | Home and Hey V-MAX's action workspace | Journey-aware, inspectable work—not only conversation |
| 1:00–1:55 | Closure demo: source, proposed move, personal approval, explicitly simulated member approvals, updated Plan | An Agent's suggestion is not automatically applied |
| 1:55–3:25 | Day 2: mention a personal Agent; show a sharing boundary, blocked 18:30 and workable 19:00 reunion; confirm and inspect Plan/Route | Different afternoons become an agreed shared evening without unrestricted disclosure |
| 3:25–3:55 | Receipt portions and exact result | Practical consequences remain visible and editable |
| 3:55–4:25 | Architecture and demo/live boundary | Local rules work; identity, real sources and sync are next |
| 4:25–4:40 | Actual findings, or proposed evaluation if not yet run | Return to organizer burden without invented impact statistics |

Rehearse the exact local data state. The **Demo** chapter switch changes the sample clock, not members' real locations. Use a proposal's Undo where safe; do not clear existing user storage to reset a demonstration. See [REVIEW-GUIDE.md](../REVIEW-GUIDE.md) for step-by-step checks.

### Validation evidence and its limits

**Validation recorded on 8 September 2026: 78/78 regression tests passed and the production build passed.** Coverage includes destination isolation, date/budget rules, participant-aware schedules, stale-proposal protection, repeat-safe updates, guarded Undo, permission revocation, targeted mentions, exact receipt allocation, local Profile behavior and sample flight comparison. Re-run the final submission commit after any subsequent changes.

Browser checks at 320px and 390px included local Profile entry and refresh, a confirmed comparison surviving in Trip wallet, and the group flow blocking 18:30 then accepting a valid 19:00 reunion. These are implementation checks, not target-user research or a claim that every browser/device has been tested.

**Public deployment check, 8 September 2026:** [vmax-one.vercel.app](https://vmax-one.vercel.app/) loaded without authentication and showed the current Hey V-MAX action workspace. This verifies public frontend access, not every deployed flow, live AI or secure multi-user operation. Rehearse the final submission on this public URL as well as locally.

Useful acceptance checks:

- An Iceland recommendation cannot be added as an activity to a Tokyo journey.
- An unshared budget or detailed work location is not returned by the member's local Agent.
- One person's approval does not impersonate the other members' agreement.
- An infeasible reunion explains the blocker and does not change the plan.
- Simultaneous activities for different participants do not become false scheduling conflicts; rest adjustments preserve the participants of the affected schedule.
- A stale museum proposal cannot overwrite a visit that was completed, renamed, repriced or reassigned. Someone outside its participants cannot approve it.
- Accepted changes appear in the saved itinerary and next-stop views; repeat confirmation does not duplicate a stop.
- Undo refuses to overwrite a subsequently edited or removed confirmed stop.
- Undo also pauses if returning a moved stop to its previous time would conflict with a newly added activity.
- Pizza MYR 64 with weights `1:2:1:0`, plus water MYR 4 with weights `1:0:1:0`, produces `18, 32, 18, 0`; saving again does not double-charge.
- A flight shortlist remains sample/unbooked and changes neither existing tickets nor expenses.
- An unbooked shortlist does not increase missing-ticket or preparation-document counts.
- Profile demo sign-out preserves journeys and does not imply a real authenticated account existed.
- Small-screen, keyboard and reduced-motion use preserve access to primary actions.

Implementation tests are not usability research, live integration tests or proof of secure multi-user operation. The informal feedback reported in the main README is distinct from these automated checks and has no documented outcome measurements yet. **NEEDS TEAM INPUT — final submission commit and validation record, plus the actual task observations from early testers.**

## Evidence and submission checklist

| Judging area / component weights | Evidence in the main README | What still needs genuine completion |
| --- | --- | --- |
| Impact · 20%: causes/stakeholders 5, target 5, before/after 7, scale 3 | Family/friend organizer experience, specific audience, intended before/after and reported early feedback | Actual tester observations and comparable task results; no invented savings or conflict-reduction claim |
| Ideation · 25% — README only: mapping 8, reasoned iterations 7, mentor integration 7, alternatives 3 | Retrospective maps; team-confirmed alternatives and decisions; Sim Hong Bing's 3 September feedback linked to changes | Original dated sketches/screenshots and a permitted meeting excerpt or note supporting the paraphrased account |
| Creativity · 15%: original combination 7, standout feature 5, differentiation 3 | Personal representation + Split & Sync + shared approval; current competitors | Demonstrate the combination; avoid unsupported first-to-market claims |
| Feasibility · 15%: stack 6, scope 5, resources/cost/time 4 | Current architecture, public Vercel frontend, concrete proposed pilot stack, official cost allowances and bounded phases | Budget/account ownership, actual capacity, measured usage and final deployed-flow validation |
| Design · 10%: consistency 4, usability 4, end-to-end 2 | Consistent hierarchy, progressive disclosure and inspectable decision states; four actual deployed UI screenshots embedded on 8 September 2026, with [capture provenance](assets/README.md) | Report documented usability findings; screenshots alone are not user-test evidence |
| Presentation · 15%: clarity 5, flow 4, delivery 4, persuasion 2 | Focused story, visible outcome, boundaries and sub-five-minute run sheet | Clear voiced recording, readable capture, rehearsed delivery and unlisted link |

This is an evidence checklist, not a predicted score or a claim of full marks.

Before submitting:

- [ ] Replace every **NEEDS TEAM INPUT** with accurate information, or explicitly state evidence is unavailable.
- [ ] Keep essential ideation and mentor evidence in the main README; a video or private board is not a substitute.
- [x] Embed four current screenshots with useful captions — Home, Hey V-MAX, shared decision and receipt split, added 8 September 2026; [capture provenance](assets/README.md).
- [ ] Attach genuine original ideation/iteration artifacts with useful captions; current UI captures do not replace earlier design evidence.
- [ ] Document actual user-test observations and usability findings; implementation checks are not user research.
- [ ] Audit photos, maps, screenshots, logos, fonts and other assets for permission to include in a **public repository**. Record provenance/license/attribution; “found online” or “in public/” is not a license. Replace material without confirmed rights.
- [ ] Credit `simple-liquid-glass` and dependencies according to their licenses; do not imply Apple or Lusion affiliation.
- [ ] Remove real personal data, private documents, secrets and local-only links from submission assets.
- [ ] Test lockfile installation, production build, public deployment and the final demo sequence.
- [ ] Verify public GitHub README/images/diagrams when signed out; verify unlisted YouTube access, audio and duration.
- [ ] Confirm the organizer's timezone; submit the two required URLs before 13 September 2026, 23:59.

The outcome we want to test is simple: **everyone can enjoy the escape without one person having to hold the whole trip together.**
