# MedTrace — UI Polish Pass (Standalone Agent Prompt)
### Goal: every screen and component looks like a real, shipped, professional healthcare product — not an AI-generated scaffold.

> **How to use:** Run this AFTER the main build (or as a dedicated polish phase). Paste this whole file to your coding agent. It does not change features or data — it only makes the existing UI look and feel professional. Design system (Section 4 of the master plan, "Trustline") stays fixed — this file tells the agent *how* to apply it well, not what colors to use.

---

## 0. Agent Rules for This Pass

1. Do not invent new colors, fonts, or animations outside the Trustline system already defined.
2. Fix **every** screen, not just the flashy ones — approval queues and empty states matter as much as the landing page.
3. Nothing ships with lorem-ipsum, "Lorem", placeholder avatars, or fake-looking dummy text. Use realistic, domain-correct sample data (real-sounding names, real drug names, real hospital names) everywhere a preview/seed/demo is needed.
4. If a screen has no data yet, it must show a designed **empty state**, never a blank page or a raw "no data" string.
5. Every interactive element must have visible **hover, focus, active, disabled, and loading** states — no exceptions.
6. Test at 375px, 768px, 1024px, 1280px after every screen — a screen isn't done until it's clean at all four.
7. At the end, run an accessibility pass (axe-core) and a "does this look like a template" self-check (Section 7).

---

## 1. What Makes UI Look "Real" vs "AI-Generated" (apply everywhere)

- **Density over whitespace-for-its-own-sake.** Real products pack useful information tightly but legibly. Don't pad a table row to 80px just to look "clean" — use 48–56px rows with proper vertical rhythm.
- **Alignment discipline.** Every icon, label, and value in a row must sit on the same baseline. No component should have its own one-off padding value — pull from the 4/8/12/16/24/32 spacing scale only.
- **Real micro-copy, not generic copy.** Never "Submit" alone — "Approve Doctor", "Request Access", "Confirm Glass-Break". Never "Error occurred" — "We couldn't send the OTP. Check the patient's email and try again."
- **Consistent iconography.** Pick one icon set (`lucide-react`) and use it everywhere — never mix icon styles, never use emoji as UI icons.
- **Numbers formatted like a real product.** Dates as `12 Jul 2026, 4:03 PM` not raw ISO strings. Health IDs and hashes in monospace, grouped for readability (e.g. `1234-5678-9012-34`). Truncate long hashes with a copy-to-clipboard affordance, not a wall of hex.
- **Shadows and borders are restrained.** One shadow for resting cards, one for elevated modals — never both a border AND a heavy shadow on the same element.
- **Nothing centered vertically-and-horizontally for no reason.** Forms and content align to a real grid, not a single centered box floating on a big empty page.

---

## 2. Component-by-Component Polish Checklist

### Buttons
- Primary/secondary/danger/ghost all visually distinct at a glance, not just color swap.
- Loading state: spinner replaces label, button keeps its width (no layout shift), disabled during request.
- Danger button (used for Glass-Break confirm, reject-doctor, delete-nominee) always requires the two-step or hold pattern from the master plan — never a plain one-click danger button.
- Icon+label buttons: icon and label vertically centered together, consistent 8px gap.

### Forms & Inputs
- Label above input, not placeholder-as-label (placeholders disappear on type — real products don't do that for required fields).
- Inline validation: error message appears under the field the instant it's invalid on blur, not only on submit.
- Password fields: show/hide toggle, strength meter for registration (ties to the 8+ char / lockout policy already defined).
- OTP input: 6 separate boxes, auto-advance, auto-submit on complete, paste support.
- Every form has a clear primary action and a secondary "Cancel"/"Back" — never a lone button floating with no escape.

### Tables (approval queues, audit logs, history lists)
- Sticky header on scroll.
- Sortable columns with a visible sort-direction indicator.
- Row hover state, zebra-striping only if the palette allows it without breaking contrast (test first).
- Status shown as a `Badge`, never raw text ("Pending" as pill with `--color-warning-*`, "Approved" with `--color-success-*`, "Rejected" with `--color-emergency-*` at low emphasis).
- Below `md` breakpoint: table becomes stacked cards, each card showing the same info in label:value pairs — never horizontal-scroll a table on mobile as the only fallback.
- Pagination or infinite scroll for anything that could exceed ~20 rows — never a table that could theoretically render 500 unpaginated rows.

### Dashboards (Admin / Doctor / Patient)
- `StatCard`s show a number, a label, and a small trend/context line (e.g. "3 pending" not just "3").
- Charts have axis labels, a legend where more than one series exists, and a designed empty state ("No Glass-Break events yet" with a subdued icon) instead of a blank chart when data is zero.
- Dashboard layout: most important/urgent info top-left (admin's pending Glass-Break review flags belong here, not buried).
- Real-time Socket.io alerts appear as a distinct, dismissible banner/toast — not a jarring full-screen interrupt.

### Modals
- Always dismissible via Escape key, backdrop click (except the Glass-Break confirmation modal, which must be deliberate-exit-only), and an explicit close button.
- Focus trapped inside modal while open; focus returns to the triggering element on close.
- Title + supporting one-line description + action row — consistent structure across every modal in the app.

### Glass-Break Flow specifically
- This is the single most important screen in the product — it must feel serious, not cute. Minimal copy, high contrast, the reserved emergency red used with intent, generous tap targets (this may be used one-handed, urgently, on a phone).
- Each of the 4 safeguards (approved-doctor-only, explicit confirm, minimum-necessary fields, logged+notified) should be visibly communicated in the flow itself, not just enforced silently in the backend — the doctor should see *why* this is slow/deliberate.
- Success screen clearly states what was shared, with whom it was shared (audit entry reference), and whether nominees were notified or the event was flagged for review.

### Landing Page
- Hero must not look like a generic SaaS template: use MedTrace's actual value prop language from the master plan, real section content (no "Feature One / Feature Two" filler).
- Use real, specific numbers/claims where they're true from the design ("SHA-256 hash-chained," "AES-256 at rest") rather than vague marketing ("bank-level security").
- Section spacing consistent (use one vertical rhythm value, e.g. 96px between major sections on desktop, 56px on mobile) — inconsistent section spacing is the #1 tell of an unpolished landing page.
- Nav bar: sticky, condenses on scroll, active-state indicator on current section if using anchor links.

### Empty States
- Every list/table/dashboard chart needs one: short icon + one sentence + (if applicable) a primary action ("No nominees yet — Add your first nominee").
- Never reuse the exact same empty-state illustration/copy for unrelated screens — tailor the sentence to context even if the icon is shared.

### Loading States
- Skeleton loaders match the actual shape of the content that will load (a table skeleton looks like table rows, not a generic spinner) — use skeletons for anything that takes >300ms.
- Global route-level loading uses the existing 150ms fade, not a full-page spinner unless the whole shell is loading.

### Notifications / Toasts
- Success (green), error (red/emergency scale only if truly an error — not for validation, which is inline), info (primary blue) — visually distinct, auto-dismiss with a manual close option, stack sensibly if more than one fires.

---

## 3. Photography / Imagery (Cloudinary assets)

- Doctor certificate thumbnail: consistent aspect-ratio crop, subtle border, click-to-expand in a lightbox modal — never full-bleed.
- Hospital logo: constrained to a max-height box so odd aspect ratios never break the header layout.
- Patient photo in Glass-Break screen: fixed circular crop, consistent size, graceful fallback (initials avatar in `--color-primary-100`) when no photo exists — never a broken image icon.

---

## 4. Motion Polish (within the existing allow-list only)

- Every allowed animation (Section 4.6 of the master plan) should feel "just right" in duration — 150–250ms for UI feedback, nothing longer except the deliberate Glass-Break hold/progress-ring.
- Easing: use a standard ease-out for entrances, ease-in for exits — never linear, which reads as robotic/unpolished.
- No animation should block interaction — if a toast is animating in, the page underneath must already be interactive.

---

## 5. Responsive QA Pass

For every screen, confirm at 375 / 768 / 1024 / 1280px:
- No horizontal scroll anywhere except intentionally within a data table's own scroll container.
- Tap targets ≥ 44px on mobile.
- Text never truncates awkwardly mid-word (use ellipsis with full value on hover/tap, or wrap).
- Modals become full-screen sheets on mobile rather than a tiny centered box.

---

## 6. Dark Mode QA Pass

- Re-check every screen in dark mode specifically — don't assume the CSS variables alone guarantee it looks good. Check chart colors, badge contrast, and image borders/backgrounds explicitly in dark mode.
- Toggle must persist (localStorage/user preference), not reset every reload.

---

## 7. Final Self-Check — "Does This Look Like a Template?"

Before declaring the polish pass done, the agent must honestly answer these and fix anything that's "no":

- [ ] Would a healthcare product manager mistake this for a real, funded startup's app?
- [ ] Does every screen have realistic, specific content — nothing generic or placeholder?
- [ ] Is there a single screen with visible layout shift, misalignment, or inconsistent spacing?
- [ ] Does the Glass-Break flow feel appropriately serious rather than "cute" or "gamified"?
- [ ] Is dark mode actually good, not just "technically works"?
- [ ] Does every table/list/chart have a designed empty state?
- [ ] Are all interactive elements keyboard-navigable with visible focus rings?

Output at the end:
```
UI POLISH PASS COMPLETE
Screens reviewed: [list]
Issues found & fixed: [list]
Remaining known issues (if any): [list]
```