# MedTrace — Master Build Plan & Autonomous Agent Prompt
### Unified Emergency-Aware Patient Medical History Platform (Full MERN Stack)

> **How to use this file:** This is a single, self-contained document. Paste the entire file into your coding agent (DeepSeek / Cline / any autonomous coding agent) as its system/master prompt. It contains the product spec, the fixed design system, the database schema, the API contract, and a phased, gated build roadmap with mandatory self-testing at every phase. The agent must not skip phases, must not skip tests, and must not invent scope beyond what is written here.

---

## 0. AGENT OPERATING RULES (read first, obey always)

You are an autonomous senior full-stack engineer building **MedTrace** end-to-end in the MERN stack (MongoDB, Express, React, Node.js). You work in **phases**, defined in Section 9. Follow these rules without exception:

1. **Never skip ahead.** Complete a phase fully — including its own tests — before starting the next.
2. **Self-test everything you build.** After every phase: write unit/integration tests, run them, fix failures, run again. Do not report a phase "done" until its tests pass. Do not wait for the human to test manually — you own correctness.
3. **No invented scope.** Build exactly the modules, routes, schemas, and screens defined here. If something is ambiguous, choose the simplest safe interpretation and document the assumption in `/docs/decisions.md`, don't ask and stall.
4. **No placeholder logic in place of real logic.** Hashing, OTP, JWT, the hash-chain, the drug-conflict checker — all must be functionally real and covered by tests, not stubs.
5. **Fixed design system.** Use only the colors, type scale, spacing, and component rules in Section 4. Do not introduce new colors or fonts.
6. **Animation discipline.** Motion is only used where Section 4.6 explicitly allows it. No decorative animation elsewhere.
7. **Commit discipline.** One logical commit per completed, tested unit of work, with a clear message. Never bundle unrelated changes.
8. **Security is not optional.** Every route that should be protected must reject unauthenticated/unauthorized requests — this must be tested, not assumed.
9. **At the end of each phase**, output a short status block:
   ```
   PHASE X COMPLETE
   Built: ...
   Tests: X passed / X total
   Assumptions made: ...
   Ready for Phase X+1
   ```

---

## 1. Project Summary

**MedTrace** is a consent-based, emergency-capable digital medical-history platform for a clinic/hospital network. It solves two problems public health-ID systems (like India's ABHA/ABDM) don't fully specify at the clinic level:

- What happens when a patient is **unconscious** and cannot consent to record access.
- How to catch a **dangerous prescription** (allergy or drug-interaction conflict) before it reaches the patient.

Three roles: **Patient**, **Doctor**, **Hospital Admin**. Two access pathways: **Normal OTP-consent access** and **Glass-Break emergency access**. Every access event is written to a **tamper-evident, hash-chained audit log**. A **drug-safety checker** warns doctors in real time when prescribing.

---

## 2. Full Feature Set (baseline + advanced)

### 2.1 Baseline (from the original spec — must all be built)
- Patient registration with unique 14-digit Health ID
- Doctor registration with hospital-admin approval workflow (Pending/Approved/Rejected)
- Hospital + Hospital Admin registration
- Nominee management (patient adds family, nominee must confirm)
- Normal visit access: doctor requests → patient gets Email OTP → time-bound access token
- Medical history read (all roles with access) / append (doctor only) — patients cannot edit
- Glass-Break emergency access: identity lookup → confirmation gate → minimum-necessary field release → nominee email alert or admin review flag
- Hash-chained (SHA-256) tamper-evident audit log, chain-verifiable end to end
- Patient-facing access transparency log ("who viewed my data, when, how")
- Drug allergy/interaction checker at point of prescribing
- Email-based MFA on login
- AES-256 encryption of sensitive fields at rest

### 2.2 Advanced features (added for this build — implement all)
- **JWT access + refresh token rotation**, with refresh-token reuse detection (security hardening)
- **Rate limiting & brute-force protection** on auth, OTP, and Glass-Break endpoints (`express-rate-limit`)
- **Socket.io real-time layer**: live "Glass-Break in progress" alert to hospital admin dashboard; live nominee-alert delivery confirmation
- **QR-code Health ID**: generated at registration (`qrcode` npm package), scannable to pre-fill doctor's access-request form
- **PDF export** of a patient's own medical history and access log (`pdfkit` or `puppeteer`)
- **Full-chain audit verification tool**: an admin-facing endpoint/button that walks the entire hash chain and reports the exact break-point if tampering is found
- **Role-based dashboards** with real, populated data visualizations (Recharts): admin sees doctor-approval queue + Glass-Break frequency; doctor sees their patient access history; patient sees their own access log timeline
- **Progressive Web App (PWA)**: installable, works offline for viewing previously-loaded own data (patient side only)
- **Accessibility**: WCAG 2.1 AA — keyboard nav, ARIA labels, color-contrast-checked palette (already satisfied by Section 4 palette), focus states
- **Dark mode** (system-detect + manual toggle), built on CSS variables so it costs zero extra design work
- **Dockerized** dev environment (`docker-compose.yml`: mongo, api, client)
- **CI-ready test suite**: Jest + Supertest (API), React Testing Library (components), Playwright (critical E2E flows: registration → approval → OTP visit → Glass-Break)
- **Input validation & sanitization** everywhere with `zod` (or `express-validator`) on the API boundary
- **Structured logging** (`pino`) separate from the medical audit log — this is operational/debug logging, not the tamper-evident chain

### 2.3 Explicitly out of scope (do not build — matches original proposal's "Future Scope")
- Pharmacy/medical-store role and dispensing enforcement
- SMS OTP (email OTP only)
- Real NMC registry cross-check for doctor verification
- Insurance integration beyond a static reference field

---

## 3. Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React 18 (Vite), React Router v6, TanStack Query, Zustand (light client state), Tailwind CSS |
| Charts | Recharts |
| Backend | Node.js 20, Express 4 |
| Database | MongoDB Atlas (Mongoose ODM) |
| Auth | JWT (access + refresh), bcrypt, speakeasy-style TOTP not needed — Email OTP via Nodemailer |
| Real-time | Socket.io |
| Validation | zod |
| Testing | Jest, Supertest, React Testing Library, Playwright |
| Email | Nodemailer + free Gmail SMTP (dev), swappable provider interface |
| PDF/QR | pdfkit, qrcode |
| Images | Cloudinary (signed uploads, no raw files on server/DB) |
| Logging | pino |
| Containerization | Docker + docker-compose |
| Hosting target | Render/Railway (API), Vercel/Netlify (client), MongoDB Atlas (DB) |

---

## 4. Design System — "Trustline" (fixed, do not deviate)

The visual identity has to do two contradictory things at once: feel **calm and clinical** for everyday use, and turn **unmistakably urgent** the instant Glass-Break is invoked. Trustline solves this with a restrained neutral/blue base and a single reserved red that appears *only* in emergency contexts — so when the user sees red, it means something.

### 4.1 Color Palette (fixed hex values)

```css
:root {
  /* Core brand */
  --color-primary-900: #0B2545;   /* deep clinical navy — headers, nav, primary text on light */
  --color-primary-700: #13315C;   /* hover/active states on primary */
  --color-primary-500: #1B4B91;   /* primary buttons, links, active nav */
  --color-primary-100: #E7EEF9;   /* primary-tinted backgrounds, selected rows */

  /* Emergency accent — RESERVED. Only for Glass-Break UI, critical alerts, allergy conflicts */
  --color-emergency-700: #A31621;
  --color-emergency-500: #E63946;
  --color-emergency-100: #FDECEE;

  /* Safety / success */
  --color-success-700: #146356;
  --color-success-500: #2A9D8F;
  --color-success-100: #E3F5F2;

  /* Warning (drug-interaction, pending states) */
  --color-warning-700: #B0710A;
  --color-warning-500: #F4A261;
  --color-warning-100: #FDF1E4;

  /* Neutrals */
  --color-ink: #1B263B;
  --color-slate-600: #4A5568;
  --color-slate-400: #8B95A5;
  --color-slate-200: #E2E7EF;
  --color-slate-100: #F1F4F9;
  --color-surface: #FFFFFF;
  --color-bg: #F8FAFC;

  /* Dark mode overrides (applied via [data-theme="dark"]) */
}

[data-theme="dark"] {
  --color-bg: #0A1220;
  --color-surface: #101B2D;
  --color-ink: #E7EEF9;
  --color-slate-600: #A9B4C4;
  --color-slate-200: #22304A;
  --color-primary-100: #16223B;
  --color-emergency-100: #2A1518;
  --color-success-100: #12261F;
  --color-warning-100: #2A1E0F;
}
```

**Usage rules (non-negotiable):**
- `--color-emergency-*` is used **only** for: the Glass-Break button/flow, active allergy/interaction warnings, and destructive/irreversible confirmations. It never appears as decoration.
- `--color-primary-500` is the only interactive-element color outside those contexts (links, primary buttons, active nav, focus rings).
- `--color-success-500` is used only for confirmed/positive states (approved doctor, confirmed nominee, verified chain).
- All text/background pairs must meet WCAG AA contrast — the pairs above were chosen to satisfy this already; do not lighten `--color-slate-400` for body text.

### 4.2 Typography

- **UI font:** `Inter` (variable weight) — all interface text.
- **Monospace (Health IDs, audit-log hashes, timestamps):** `JetBrains Mono` — reinforces the "this is a verifiable record" feeling, mirrors the audit-trail concept visually.
- Scale: `12 / 14 / 16 / 18 / 22 / 28 / 36` px, line-height 1.5 for body, 1.2 for headings.
- Headings use `--color-primary-900`; body uses `--color-ink`.

### 4.3 Spacing & Grid

- 4px base unit. Standard spacing scale: 4, 8, 12, 16, 24, 32, 48, 64.
- Max content width 1280px, 12-column grid on desktop, single column under 768px.
- Card radius: 12px. Button radius: 8px. Input radius: 8px.
- Elevation: two shadow tokens only — `--shadow-sm` (cards) and `--shadow-md` (modals/popovers). No deep drop-shadows.

### 4.4 Components (consistent library, build once in `/client/src/components/ui`)

Button (primary/secondary/danger/ghost), Input, Select, Modal, Toast, Badge (status: pending/approved/rejected/active/expired), Table (sortable, paginated), Tabs, StepIndicator (for multi-step Glass-Break flow), Timeline (for access log), StatCard (dashboards), QRDisplay, EmptyState, Skeleton loaders.

Every component must have a `.stories`-style usage example or a component test — pick one and be consistent.

### 4.5 Landing Page (public, unauthenticated)

Sections, in order:
1. **Hero** — Headline: *"Your medical history, ready the moment it's needed most."* Sub-line explaining consent-based + emergency access. Two CTAs: "Get your Health ID" (patient signup) and "For Hospitals & Doctors" (secondary, routes to hospital/doctor onboarding).
2. **The Problem** — three-icon row: unconscious patient / unknown allergies / no visibility, in a restrained, non-graphic illustrative style (never depict distressing medical imagery).
3. **How MedTrace Works** — horizontal 3-step visual: Register → Consent or Glass-Break → Tamper-evident record, using `--color-primary-500` and `--color-emergency-500` only in the Glass-Break step icon.
4. **Glass-Break explainer** — a focused section on the emergency protocol, since it's the differentiator. Show the 4 safeguards (approved doctor only / explicit confirm / minimum-necessary fields / logged + nominee-notified) as a checklist.
5. **Trust & Security** — hash-chained audit log, AES-256 at rest, MFA — three StatCard-style badges, not marketing fluff, factual.
6. **For Hospitals** — brief admin-workflow pitch (verify doctors, review flagged emergencies).
7. **Footer** — role-based sign-in links, minimal.

Landing page is fully responsive, static-content-first (fast first paint), no heavy hero video.

### 4.6 Animation — allow-list (nothing outside this list)

Motion is used **only** where it communicates state change or guides attention in a moment that matters. Everything else is static.

Allowed:
- **Glass-Break confirmation step**: the "BREAKGLASS" button has a deliberate press-and-hold or two-step confirm with a filling progress ring (`--color-emergency-500`) — this is the one place friction is *intentional*.
- **OTP input**: digit-box focus transition and success checkmark micro-animation (150–200ms) on verify.
- **Toast notifications**: slide-in/fade (200ms), standard for success/error/info.
- **Audit chain verification**: a subtle sequential "checking…" pulse down the timeline as each hash is verified live, and a clear red break-point flash if tampering is found.
- **Page/route transitions**: simple 150ms fade, nothing more.
- **Skeleton loaders**: standard shimmer while data loads.

Not allowed: parallax, scroll-jacking, decorative hover-bounce, animated gradients, confetti, auto-playing carousels, spinner-heavy dashboards.

### 4.7 Responsiveness

Breakpoints: `sm 480 / md 768 / lg 1024 / xl 1280`. Every screen (including the Glass-Break flow, which may be used on a phone at a bedside) must be fully usable at 375px width. Dashboards collapse tables to stacked cards below `md`.

---

## 5. Database Schema (MongoDB / Mongoose)

Use the collections and fields exactly as specified below; add indexes as noted.

```js
// patients
{
  _id, healthId: { type: String, unique: true, index: true }, // 14-digit
  name, dob, gender, mobile, email: { type: String, unique: true },
  bloodGroup, passwordHash,
  allergies: [String], chronicConditions: [String], currentMedications: [String],
  emergencyContact: { name, relation, mobile },
  mfaEnabled: { type: Boolean, default: true },
  profilePhotoUrl, profilePhotoPublicId, // Cloudinary, optional — used only for Glass-Break visual identity match
  createdAt, updatedAt
}

// hospitals
{ _id, name, address, contact, logoUrl, logoPublicId, createdAt } // logoUrl via Cloudinary, optional

// hospitalAdmins
{ _id, hospitalId: { type: ObjectId, ref: 'Hospital', index: true }, name, email: { unique: true }, passwordHash, createdAt }

// doctors
{
  _id, name, specialization, hospitalId: { type: ObjectId, ref: 'Hospital', index: true },
  registrationNumber, // self-declared, format-validated (regex per state council format)
  email: { unique: true }, mobile, passwordHash,
  verificationStatus: { type: String, enum: ['Pending','Approved','Rejected'], default: 'Pending', index: true },
  certificateUrl, certificatePublicId, // Cloudinary — registration proof for admin review
  createdAt
}

// nominees
{ _id, patientId: { type: ObjectId, ref: 'Patient', index: true }, name, relation, mobile, email,
  status: { type: String, enum: ['Pending','Confirmed'], default: 'Pending' }, createdAt }

// medicalHistoryEntries
{ _id, patientId: { index: true }, doctorId, hospitalId, diagnosis,
  prescribedMedicines: [String], notes, visitDate, createdAt }

// accessSessions
{ _id, patientId: { index: true }, doctorId, otpHash, otpExpiresAt,
  accessTokenExpiresAt, accessType: { type: String, enum: ['Normal'] },
  status: { type: String, enum: ['Pending','Active','Expired'], index: true } }

// accessAuditLog  (hash-chained, append-only — enforce no update/delete at the DB access layer)
{ _id, patientId: { index: true }, doctorId, hospitalId,
  accessType: { type: String, enum: ['Normal-OTP','Glass-Break'] },
  fieldsAccessed: [String], timestamp,
  previousEntryHash, currentEntryHash, reviewFlag: { type: Boolean, default: false, index: true } }

// drugReference
{ _id, drugName: { index: true }, relatedDrugClass, knownAllergyTriggers: [String], interactsWith: [String] }
```

Seed `drugReference` with a small realistic dataset (30–50 common drugs) so the conflict checker is demonstrable — do not ship it empty.

---

## 6. Core Algorithms (implement exactly, then test against edge cases)

### 6.1 Hash-Chained Audit Log
```
currentEntryHash = SHA256(previousEntryHash + patientId + doctorId + accessType + fieldsAccessed + timestamp)
```
- Genesis entry uses `previousEntryHash = '0'.repeat(64)`.
- Provide a `verifyChain()` service function that walks from genesis, recomputes every hash, and returns `{ valid: boolean, breakAtEntryId?: string }`.
- **Test requirement:** write a test that deliberately mutates one historical entry in a test DB and asserts `verifyChain()` correctly reports the exact break-point.

### 6.2 Glass-Break Emergency Access Protocol
Enforce, in order, and test each gate independently:
1. Doctor must have `verificationStatus === 'Approved'` → else 403.
2. Explicit two-step confirmation UI (no single-click emergency access).
3. Response payload contains **only**: bloodGroup, allergies, currentMedications, chronicConditions, emergencyContact — never the full history.
4. On success: write audit entry, notify all `status: 'Confirmed'` nominees by email; if zero confirmed nominees exist, set `reviewFlag: true` and surface it on the admin dashboard.

### 6.3 Drug Allergy/Interaction Check
```js
function checkConflict(drugName, patient, drugReference) {
  const ref = drugReference.find(d => d.drugName === drugName);
  if (!ref) return { found: false, allergyHit: false, interactionHit: false };
  const allergyHit = ref.knownAllergyTriggers.some(t => patient.allergies.includes(t));
  const interactionHit = ref.interactsWith.some(d => patient.currentMedications.includes(d));
  return { found: true, allergyHit, interactionHit };
}
```
Must run **before** a `medicalHistoryEntries` write commits, and must require explicit doctor confirmation if either flag is true — this confirmation itself is captured in `notes` metadata for accountability.

---

## 7. API Contract

```
POST   /api/patients/register
POST   /api/doctors/register
POST   /api/hospital-admin/approve-doctor/:id
POST   /api/auth/login              (email+password → triggers MFA OTP)
POST   /api/auth/verify-mfa
POST   /api/auth/refresh
POST   /api/auth/logout
POST   /api/nominees                (patient adds nominee)
POST   /api/nominees/:id/confirm
POST   /api/access/request          (doctor → patient healthId, triggers Email OTP)
POST   /api/access/verify-otp       (→ issues time-bound access token)
GET    /api/patients/:id/history    (requires active access token)
POST   /api/patients/:id/history    (doctor appends entry; runs drug-check first)
POST   /api/drug-check
POST   /api/emergency/lookup        (identity-doc based patient search)
POST   /api/emergency/breakglass/:patientId
GET    /api/emergency/summary/:patientId
GET    /api/patients/:id/access-log
GET    /api/admin/audit/verify      (full chain verification)
GET    /api/admin/doctors?status=Pending
GET    /api/patients/:id/qr
GET    /api/patients/:id/export-pdf
POST   /api/uploads/sign             (returns signed Cloudinary upload params — server never touches raw file)
POST   /api/doctors/:id/certificate  (save returned Cloudinary url+publicId to doctor record)
POST   /api/hospitals/:id/logo
POST   /api/patients/:id/photo
DELETE /api/uploads/:publicId        (auth-checked, only owner or admin)
```

All mutating routes: zod-validated body, rate-limited, auth-checked, and covered by a Supertest that asserts both the happy path and the 401/403 rejection path.

---

## 8. Testing Strategy (agent must implement and run these itself)

- **Unit (Jest):** hash-chain generation + tamper detection, OTP generate/expire, drug-conflict logic, Health ID uniqueness/format, JWT issuance/refresh-rotation/reuse-detection.
- **API/Integration (Supertest):** every endpoint above — status codes, auth rejection for unverified doctors, expired-token rejection, full Glass-Break flow end-to-end including nominee-email-mocked assertion.
- **Component (React Testing Library):** OTP input, Glass-Break confirmation flow, drug-conflict warning modal, access-log timeline.
- **E2E (Playwright):** registration → admin approval → OTP visit → history append with a drug conflict → Glass-Break with and without a confirmed nominee.
- **Security tests:** no-token / expired-token / cross-patient-token access attempts; doctor hitting admin-only routes; basic injection/input-fuzz on all POST bodies.
- **Load (Artillery, lightweight):** confirm the app doesn't fail under ~50 concurrent simulated Glass-Break requests.

Agent must run the full suite at the end of every phase and again at the very end of the build, and must not mark the project complete with any failing or skipped test.

---

## 9. Phased Build Roadmap (gated — do not proceed to next phase until current phase's tests pass)

**Phase 0 — Scaffolding**
Monorepo structure (`/client`, `/server`, `/docs`), Docker Compose, env config, lint/format config, base CI test script. Test: containers boot, health-check endpoint returns 200.

**Phase 1 — Data Layer & Auth Core**
All Mongoose schemas from Section 5, seed script (incl. `drugReference` dataset), JWT auth (access+refresh+rotation), bcrypt password hashing, Email OTP service (Nodemailer, mockable in tests), **all of Section 11's security middleware (helmet/CORS/sanitize/rate-limit/lockout) wired in now, not later**. Test: full unit coverage of auth + OTP + hash-chain utilities + security-test subset.

**Phase 2 — Registration & Approval Flows**
Patient/Doctor/Hospital/Admin registration endpoints + UI forms, Health ID generation, doctor approval queue (admin UI + API), **Cloudinary signed-upload flow (Section 10) built here for doctor certificate + hospital logo**. Test: Supertest + RTL for every form and its validation states, plus upload type/size rejection tests.

**Phase 3 — Normal Access Flow**
Access-request → OTP → access-token issuance → history read/append, with the drug-conflict checker wired into the append path. Test: full Supertest flow + conflict-warning RTL test.

**Phase 4 — Audit Log & Transparency**
Hash-chained logger wired into every access event (normal + emergency once Phase 5 lands), patient-facing access-log timeline UI, admin chain-verification tool with break-point reporting. Test: tamper-and-detect test from Section 6.1.

**Phase 5 — Glass-Break Emergency Protocol**
Identity lookup, two-step confirm UI (with the allowed hold/progress-ring animation), minimum-necessary-field response (incl. optional patient photo per Section 10), nominee email alert + review-flag fallback, Socket.io live alert to admin dashboard. Test: full Glass-Break E2E, with and without nominees, with and without patient photo.

**Phase 6 — Dashboards & Data Viz**
Role-based dashboards (admin/doctor/patient) with Recharts visualizations pulling real data from the above phases. Test: RTL rendering tests with mocked API data.

**Phase 7 — Landing Page & Design System Pass**
Build the landing page per Section 4.5, apply the Trustline design system consistently across every screen built so far, dark mode toggle, responsive QA at all breakpoints. Test: Playwright visual smoke test at 375/768/1280 widths.

**Phase 8 — Advanced Features Pass**
QR Health ID, PDF export, PWA config, rate limiting, structured logging, accessibility pass (axe-core automated check). Test: axe-core reports zero critical violations; PDF/QR generation unit tests.

**Phase 9 — Hardening & Full Regression**
Run the entire Section 8 test suite together, run the security-test subset explicitly (Section 11), run `npm audit` and fix high/critical, run the lightweight load test, fix anything red. Produce a final `/docs/test-report.md` summarizing pass counts per category.

**Phase 10 — Deployment Readiness**
Production env config, Dockerfiles finalized, deployment instructions for Render/Railway + Vercel/Netlify + Atlas in `/docs/deploy.md`, final README with setup, architecture summary, and a screenshots section.

---

## 10. Image Handling — Cloudinary (addendum, mandatory where images appear)

Only 3 image use-cases exist. Do not add more.

1. **Doctor registration certificate** — uploaded at signup, shown to hospital admin during approval review.
2. **Hospital logo** — optional, shown on that hospital's dashboard/branding only.
3. **Patient profile photo** — optional, shown only in the Glass-Break summary screen so an attending doctor can visually confirm identity at the bedside.

**Rules:**
- Use **signed uploads**: client requests a signature from `POST /api/uploads/sign`, uploads directly to Cloudinary from the browser, then sends back `{url, publicId}` to save on the record. The server must never receive or store raw image bytes.
- Enforce on the signed-upload endpoint: max 5MB, allowed types `jpg/jpeg/png/pdf` only (certificate may be a PDF), folder-scoped by use-case (`doctors/certificates`, `hospitals/logos`, `patients/photos`).
- Store only `url` + `publicId` in MongoDB — never binary data.
- Deleting a record (e.g. rejected doctor re-upload) must also call Cloudinary delete via `publicId`, not just unlink in the DB.
- Patient profile photo is never included in the Normal-OTP access response — only in the Glass-Break minimum-necessary payload, and it counts as one of the "fields accessed" logged in the audit entry.
- UI: use the existing `Badge`/`Skeleton` components for upload state; no new visual style, just a simple drag-or-click upload box using primary palette, with a small preview thumbnail.

## 11. Security Hardening (addendum, mandatory — build these alongside Phase 1 and re-check in Phase 9)

Short, direct rules — implement each one literally, do not interpret loosely:

- `helmet` on every Express app — no exceptions.
- CORS: explicit origin whitelist from env var, never `*`.
- `express-mongo-sanitize` + `express-validator`/`zod` on every input — block NoSQL injection.
- `express-rate-limit`: strict limits on `/auth/*`, `/access/*`, `/emergency/*` (already required in Section 2.2 — this makes it non-optional and testable).
- Passwords: bcrypt cost factor ≥ 12, minimum policy (8+ chars, not in common-password list).
- Account lockout: 5 failed logins → 15-minute lock, logged.
- JWT secrets and Cloudinary/Mongo/Email credentials only via env vars — never hardcoded, never committed. `.env.example` provided, `.env` gitignored.
- On password change or logout-everywhere: invalidate all refresh tokens for that user immediately.
- `accessAuditLog` collection: enforce append-only at the schema/service layer — block all `update`/`delete` calls against it in code, not just by convention.
- All file uploads go through Section 10's signed-Cloudinary flow only — no direct multipart file handling on the server.
- HTTPS enforced in production config (redirect + HSTS header via helmet).
- Dependency check: run `npm audit` at the end of Phase 9 and fix high/critical findings before declaring done.
- Test requirement: add these to Section 8's security-test subset — rate-limit trigger, lockout trigger, injection payload rejection, upload-type/size rejection.

## 12. Design Refinements (addendum — does not replace Section 4, only tightens it)

- Upload boxes and image previews use `--color-slate-200` border, `--color-primary-500` on drag-hover — no new colors.
- Doctor certificate thumbnail and hospital logo are the only two places a raw image renders outside the patient's own profile — keep both small and consistently sized (see `StatCard`/`Badge` sizing) so they never dominate a screen.
- Patient profile photo in the Glass-Break screen is deliberately small and secondary to the medical data — identity confirmation, not a profile page.



- [ ] All Section 2.1 and 2.2 features implemented and demonstrable
- [ ] Fixed Trustline color palette used with zero deviation, dark mode working
- [ ] Landing page complete, fully responsive, animation limited to Section 4.6 allow-list
- [ ] Hash-chain tamper-detection provably works (test + manual demo script in `/docs`)
- [ ] Glass-Break protocol enforces all 4 safeguards, tested with/without nominees
- [ ] Drug-conflict checker blocks/warns correctly, tested against seeded `drugReference`
- [ ] Full test suite green: unit, integration, component, E2E, security, load
- [ ] `/docs/decisions.md` lists every assumption made during the build
- [ ] `/docs/test-report.md` present with final pass/fail counts
- [ ] `/docs/deploy.md` present and accurate
- [ ] No console errors/warnings on any core screen at any breakpoint
- [ ] All Section 11 security rules implemented and covered by tests, `npm audit` clean of high/critical
- [ ] All 3 Cloudinary use-cases (Section 10) working via signed upload only, no raw files ever hit MongoDB or server disk

---

*End of master plan. Agent: begin at Phase 0.*