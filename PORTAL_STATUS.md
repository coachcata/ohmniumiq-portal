# OhmniumIQ Compliance Portal — Full Development Status Document

> **Purpose:** This document is a complete reference for the current state of the OhmniumIQ portal, intended for use in planning future development. It covers architecture, data models, user roles, pages, business logic, and recent changes.
>
> **Last updated:** April 2026 | **Latest commit:** fd72ab5 | **Build version:** v7.0.0 (code) / v20.0 (feature version)

---

## 1. PROJECT OVERVIEW

OhmniumIQ is a web-based electrical compliance management portal built for **Ohmnium Electrical** (the contractor) and their client **letting agencies**. It manages the full lifecycle of periodic electrical inspections (EICRs) on rental properties — from job creation through to certificate storage and compliance tracking.

**Core workflow:**
1. A letting agency adds a property and requests an EICR job
2. An admin assigns an engineer and schedules the job
3. The engineer visits the property and completes the EICR form in the portal
4. A supervisor reviews and signs off the certificate (for junior engineers)
5. A certificate is uploaded and the property's compliance status updates automatically
6. The dashboard shows the agency a real-time compliance overview

---

## 2. TECH STACK

| Layer | Technology |
|-------|-----------|
| Frontend framework | React 18.3.1 + Vite 6.0 |
| UI styling | Inline styles only (no CSS framework) |
| Backend / DB | Supabase (PostgreSQL + Auth + Storage) |
| Auth | Supabase Auth (email/password) |
| File storage | Supabase Storage (`certificates` private bucket) |
| PDF generation | jsPDF v4.2.1 + html2canvas v1.4.1 |
| AI feature | Anthropic Claude API (claude-sonnet-4-20250514) |
| Fonts | Google Fonts — Sora (UI) + JetBrains Mono (code/refs) |
| Hosting | Netlify (auto-deploy via netlify.toml) |
| External data | postcodes.io (free, no API key — postcode/UPRN lookup) |

**Architecture notes:**
- The entire frontend lives in a single monolithic `App.jsx` file (~492KB). There is no component file splitting — all pages, modals, and logic are co-located.
- State management is via React Context API (`AuthContext`, `DataContext`) — no Redux or Zustand.
- Navigation is managed by a `page` state variable (string-based router), not React Router.
- Supabase client is initialised once and passed via context.
- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (in `.env`)

---

## 3. DATABASE SCHEMA

All tables live in Supabase (PostgreSQL). Row-Level Security (RLS) is enabled on all tables.

### `organisations`
Represents both the contractor company and client letting agencies.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| name | text | e.g. "Kellett Lettings", "Ohmnium Electrical" |
| type | text | `agency` or `contractor` |
| created_at | timestamptz | |

Seed data: Kellett Lettings, Marsh & Co (agencies), Ohmnium Electrical (contractor)

---

### `profiles`
Extends `auth.users`. Created automatically via trigger on new signup.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | FK → auth.users |
| full_name | text | |
| role | text | `admin`, `agent`, `supervisor`, `engineer`, `junior` |
| organisation_id | UUID | FK → organisations |
| phone | text | optional |
| signature_url | text | URL to engineer's signature image in Storage |
| created_at | timestamptz | |

---

### `properties`
A rental property managed by an agency.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| ref | text | Auto-generated: P001, P002... |
| address | text | Full address string |
| tenant_name | text | |
| tenant_phone | text | |
| landlord_name | text | Added recently |
| agency_id | UUID | FK → organisations |
| last_eicr | date | Date of last EICR inspection |
| expiry_date | date | last_eicr + 5 years (auto-calculated) |
| smoke_expiry | date | Smoke & CO certificate expiry |
| last_smoke | date | |
| pat_expiry | date | PAT test certificate expiry |
| last_pat | date | |
| created_by | UUID | FK → profiles |
| created_at / updated_at | timestamptz | updated_at auto-managed by trigger |

---

### `jobs`
A single piece of work on a property (EICR, Remedial, Smoke Alarm, PAT).

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| ref | text | Auto-generated: J001, J002... |
| property_id | UUID | FK → properties |
| organisation_id | UUID | FK → organisations (property's agency) |
| type | text | `EICR`, `Remedial`, `Smoke Alarm`, `PAT` |
| status | text | `Pending`, `Scheduled`, `In Progress`, `Awaiting Sign-Off`, `Completed`, `Cancelled` |
| engineer_id | UUID | FK → profiles (assigned engineer) |
| scheduled_date | date | |
| notes | text | |
| eicr_data | JSONB | Full EICR form state (see §6) |
| crn | text | 7-digit Certificate Reference Number (sequential) |
| has_cert | boolean | True once certificate uploaded |
| created_by | UUID | FK → profiles |
| created_at / updated_at | timestamptz | |

---

### `documents`
Certificate files uploaded to Supabase Storage.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| ref | text | Auto-generated: D001, D002... |
| job_id | UUID | FK → jobs |
| property_id | UUID | FK → properties |
| organisation_id | UUID | FK → organisations |
| type | text | `EICR`, `Smoke Alarm`, `PAT`, `Remedial`, etc. |
| file_path | text | Path in Supabase Storage |
| file_name | text | Original filename |
| expiry_date | date | Certificate expiry |
| uploaded_by | UUID | FK → profiles |
| uploaded_at | timestamptz | |

---

### `audit_log`
Immutable activity log for all user and system actions.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| action | text | Human-readable description of the action |
| user_id | UUID | FK → profiles |
| user_name | text | Denormalised for display |
| user_role | text | Denormalised for display |
| organisation_id | UUID | FK → organisations |
| created_at | timestamptz | |

System-generated entries (e.g. auto-created Remedial jobs) use role `Auto`.

---

### `job_comments`
Comments attached to individual jobs.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| job_id | UUID | FK → jobs |
| author_id | UUID | FK → profiles |
| author_name | text | Denormalised |
| body | text | Comment text |
| organisation_id | UUID | FK → organisations |
| created_at | timestamptz | |

---

### Database triggers & functions
- `generate_property_ref()` — auto-increments P001, P002...
- `generate_job_ref()` — auto-increments J001, J002...
- `generate_document_ref()` — auto-increments D001, D002...
- `set_updated_at()` — updates `updated_at` on any row change
- `handle_new_user()` — creates a `profiles` row when a new auth user is created
- `get_next_crn()` — returns next sequential 7-digit CRN for EICR certificates

### Row-Level Security summary
- **organisations**: readable by all authenticated users
- **profiles**: users see own profile; admins see all
- **properties**: admins see all; agents see their agency's; engineers see properties with their assigned jobs
- **jobs / documents**: same as properties
- **audit_log**: admins see all; others see own entries
- **job_comments**: scoped by organisation_id

---

## 4. USER ROLES & PERMISSIONS

Five roles exist in the system. Role is stored in `profiles.role`.

### Admin
- Full read/write access across all organisations
- Can manage team: create users, edit users, create/rename agencies
- Can sign off EICRs (same as supervisor)
- Can view and filter across all agencies on the Team page
- Can re-open completed or awaiting-sign-off jobs

### Agent
- Scoped to their own agency's properties
- Creates and manages properties (individual + CSV bulk import)
- Creates jobs and assigns engineers
- Uploads certificates
- Views agency compliance dashboard
- Cannot sign off EICRs

### Supervisor
- Can view all jobs (cross-org visibility for contractor admin context)
- Reviews Sign-Off Queue (Awaiting Sign-Off jobs from junior engineers)
- Approves EICRs → marks Completed; auto-creates Remedial if Unsatisfactory
- Rejects EICRs with a reason → returns to engineer (In Progress)
- Can re-open completed/awaiting-sign-off jobs

### Engineer
- Sees only their assigned jobs
- Fills in and submits full EICR forms
- Submits directly to **Completed** (no sign-off queue step)
- Can upload certificates

### Junior
- Same as engineer for form access
- Submits to **Awaiting Sign-Off** instead of Completed
- A supervisor must review before the job is finalised

---

---

## 5. PAGES & ROUTES

Navigation is driven by a `page` state variable (string). There is no URL-based router — all views are rendered conditionally in a single `App.jsx`.

### Dashboard (`page === "dashboard"`)
- **Access:** All roles
- **Engineer/Junior view:** Today's jobs, upcoming jobs, awaiting sign-off count
- **Admin/Agent/Supervisor view:** 4 stat cards (Total Properties, Compliant, Expiring Soon, Overdue), list of expiring/overdue properties, EICRs awaiting sign-off count
- **Actions:** Click property to navigate to Property Detail

### Properties (`page === "properties"`)
- **Access:** All roles (Admin/Agent can create properties and request jobs)
- **Display:** Property cards with compliance status indicator (green/amber/red), address, tenant, EICR expiry, reference
- **Filters:** Status (All/OK/Soon/Overdue), Client dropdown, Sort (Default/Status/Expiry/A-Z), text search (address, tenant, ref)
- **Actions:** Add Property, CSV Import (Admin/Agent), "+ Job" button per card, click to open Property Detail

### Property Detail (`page === "propertyDetail"`)
- **Access:** All roles
- **Display:** Property header (address, ref, tenant, phone, landlord name), 3 compliance pills (EICR, Smoke & CO, PAT with expiry + colour), jobs list, documents list, comments per job
- **Actions:** Edit Property, + Job, Download certificates, Add comments, Cancel jobs (Admin), Upload/generate certificates

### Jobs (`page === "jobs"`)
- **Access:** All roles
- **Display:** Job list with status badge, reference, property, engineer, scheduled date
- **Filters:** Status (All/Pending/Scheduled/In Progress/Completed/Cancelled/Awaiting Sign-Off), Client dropdown, text search
- **Actions (Admin only):** Edit job (type/notes), Assign engineer + scheduled date, Reschedule

### EICR Form (`page === "eicr"`)
- **Access:** Engineer, Junior, Supervisor, Admin
- **Display:** Full BS 7671 EICR form — multi-part with job selector dropdown (In Progress jobs only)
- **Sections:** Contractor info, Client/Landlord, Installation address, Purpose, Condition assessment, Supply characteristics, Distribution board, Inspection schedule (Part 9: 80+ items), Observations (Part 5), Circuit details (Part 11A), Test results (Part 11B), Declaration
- **Smart features:** Postcode/UPRN lookup, previous EICR carry-forward, mark all pass, auto-calculations, common observations, sticky nav, floating save, progress bar
- **Actions:** Save Draft, Submit (Junior → Awaiting Sign-Off; Engineer → Completed)

### Fire Alarm — DFPM25 (`page === "dfpm25"`)
- **Access:** Engineer, Junior, Supervisor, Admin
- **Display:** Domestic fire/smoke alarm inspection certificate form
- **Sections:** Contractor, Client/Landlord, Installation, System Grade & Category, Detector counts, 10-item inspection checklist, Sound level instruments, Declaration/Outcome
- **Actions:** Select job (Smoke Alarm/Fire Alarm type), complete checklist (✓/✗/N/A), submit

### Emergency Lighting — EPM25 (`page === "epm25"`)
- **Access:** Engineer, Junior, Supervisor, Admin
- **Display:** Emergency lighting periodic inspection certificate form
- **Sections:** Contractor, Client/Landlord, Installation, System description, Classification, 19-item inspection checklist, Test instruments, Declaration
- **Actions:** Select job, complete checklist, submit

### Installation Certificate — EIC183C (`page === "eic183c"`)
- **Access:** Engineer, Junior, Supervisor, Admin
- **Display:** Electrical Installation Certificate for new work, alterations, or DB replacements
- **Sections:** Contractor registration, Client/Landlord, Installation, Work details, Comments on existing installation, Declaration & departures, Supply characteristics, Earthing/bonding/main switch, 14-item inspection schedule, Test results
- **Actions:** Select job (Remedial/New Installation/Alteration types), complete form, submit

### Sign-Off Queue (`page === "signoff"`)
- **Access:** Supervisor, Admin only
- **Display:** Queue of jobs with status "Awaiting Sign-Off", expandable to show full EICR data, engineer name, submission date
- **Actions:** Approve (→ Completed; auto-creates Remedial job if Unsatisfactory), Reject with reason (→ In Progress, returned to engineer)

### Documents / Certificate Vault (`page === "documents"`)
- **Access:** All roles (read); Admin/Agent/Engineer/Supervisor (upload/generate)
- **Display:** All uploaded certificates, searchable by property/tenant, filterable by type (EICR, Smoke Alarm, PAT, etc.), alert banner for pending uploads
- **Actions:** Upload certificate, Download (signed URL), Auto-generate certificate from form data, "Generate All" pending certificates at once

### Audit Trail (`page === "audit"`)
- **Access:** All roles (read-only)
- **Display:** Activity log with timestamp, action, user name, role
- **Filters:** Role (All/Admin/Engineer/Supervisor/etc.), text search
- **Pagination:** First 30 entries, then "Load all" button

### Team Management (`page === "team"`)
- **Access:** Admin only
- **Display:** All team members with name, email, role badge (colour-coded), organisation name, filterable by organisation
- **Actions:** Add User (direct creation), Invite User (email), Add Agency, Edit Agency, Edit User (role/org), Upload/update signature

### More (`page === "more"`)
- **Access:** All roles (content varies by role)
- **Display:** Menu of additional pages and settings
- **Items:** Form pages (Engineer/Junior/Supervisor), Sign-Off Queue (Supervisor/Admin, with badge), Audit Trail, Team (Admin), Edit Name, Change Password, Sign Out

---

## 6. MODAL COMPONENTS

All modals use a shared `Modal` base component (slide-up bottom sheet on mobile, centred dialog on desktop).

| Modal | Purpose | Access |
|-------|---------|--------|
| AddPropertyModal | Create single property (address, tenant, phone, landlord, last EICR date) | Admin, Agent |
| CSVImportModal | Bulk import properties from CSV with duplicate detection (5000-row limit) | Admin, Agent |
| EditPropertyModal | Edit property details (address, tenant, landlord, etc.) | Admin, Agent |
| RequestJobModal | Request new job — select service type (EICR/Remedial/Smoke Alarm/Fire Alarm/Emergency Lighting/PAT/New Installation/Alteration) + notes | Admin, Agent |
| EditJobModal | Change job type and notes for pending jobs | Admin |
| AssignModal | Assign engineer + scheduled date (or reassign/reschedule) | Admin |
| UploadCertModal | Upload certificate PDF/image for a job (max 50MB) | Admin, Agent, Engineer, Supervisor |
| AddUserModal | Create user with name, email, password, role (radio buttons with descriptions), org | Admin |
| InviteUserModal | Send email invite with magic link | Admin |
| EditUserModal | Edit user's name, role, organisation | Admin |
| AddAgencyModal | Create new client organisation | Admin |
| EditAgencyModal | Rename an organisation | Admin |
| SignatureModal | Upload digital signature image (PNG/JPEG/SVG, max 2MB) for an engineer | Admin |
| ChangePasswordModal | Change own password (validates current password, signs out other sessions) | All roles |
| EditNameModal | Update own display name | All roles |
| Reject EICR (inline) | Reject submitted EICR with reason textarea; returns to engineer | Supervisor, Admin |

---

## 7. NAVIGATION & LAYOUT

### Desktop
- **Sidebar** (fixed left, 240px): OhmniumIQ logo, logged-in user card (name + role), full navigation menu, Sign Out button with version info
- Sign-Off Queue menu item shows badge count of awaiting jobs
- Form pages (EICR, DFPM25, EPM25, EIC183C) only visible to Engineer/Junior/Supervisor

### Mobile
- **MobileTopBar** (fixed top): Logo, user name badge, global property search bar (Admin/Agent only — live results with status colours, max 6 results)
- **BottomNav** (fixed bottom): 5 tabs — Home, Properties, Jobs, Docs, More. Purple notification dot on "More" if jobs awaiting sign-off

### Responsive breakpoints
- `BP.mobile` = 640px
- `BP.tablet` = 1024px

*— End of Part 2A — Pages, Modals, Navigation —*

---

## 8. EICR FORM — DEEP DIVE

The EICR form is the core feature of the portal. It implements a full **BS 7671 / IET 18th Edition Electrical Installation Condition Report** and is the most complex part of the codebase.

---

### Form Sections Overview

| Part | Title | Key Fields |
|------|-------|-----------|
| Part 1 | Client & Installation Details | Contractor (auto), landlord, agent, installation address, postcode, UPRN |
| Part 2 | Purpose of Report | Purpose dropdown, inspection date, previous report |
| Part 3 | Summary of Condition | General condition, premises type, estimated age, alterations |
| Part 4 | Declaration | Inspector name/date, reviewer name/date, BS 7671 edition, next inspection date |
| Part 5 | Observations & Recommendations | Dynamic observation rows (C1/C2/C3/FI), no-remedial toggle |
| Part 6 | Extent & Limitations | Extent dropdown, limitations dropdown, agreed-with, sampling extent |
| Part 7 | Supply Characteristics | Earthing system, phase, voltages, frequency, Ze, Ipf, supply protective device |
| Part 8 | Distribution Board Particulars | Max demand, earthing/bonding conductors, bonding connections, main switch, DB details |
| Part 9 | Inspection Schedule | 10 sections, 81+ items, each toggled ✓/N/A/LIM/C1/C2/C3/FI |
| Part 11A | Circuit Details | Per-circuit: description, wiring type, CSA, OCP, RCD details |
| Part 11B | Test Results | Per-circuit: r1/r2/R1+R2, IR, Zs, polarity, RCD time; test instruments; tested-by |

---

### Constants & Lookup Tables

**PURPOSE_OPTIONS**
`change_of_tenancy` | `general_periodic` | `sale_purchase` | `after_works`

**CONDITION_OPTIONS**
`satisfactory_standard` | `satisfactory_recommendations` (C3s only) | `unsatisfactory_c2` | `unsatisfactory_multiple` | `unsatisfactory_specific` | `older_installation`

**EXTENT_OPTIONS** — `full_property` | `flat_only`

**LIMITATIONS_OPTIONS** — `na` | `standard`

**ESTIMATED_AGE_OPTIONS** — 0–5, 5–10, 10–15, 15–20, 20–25, 25–30, 30–40, 40–50, 50+

**CABLE_SIZES** — 0.75, 1.0, 1.5, 2.5, 4.0, 6.0, 10.0, 16.0, 25.0, 35.0, 50.0 (mm²)

**WIRING_TYPES**
N/A, LIM, A (thermoplastic sheathed), B (thermoplastic in metallic conduit), C (non-metallic conduit), D (metallic trunking), E (non-metallic trunking), F (thermoplastic/SWA), G (thermosetting/SWA), H (mineral-insulated), O (other)

**OCP_TYPES** — B, C, D, BS 3036, N/A
**OCP_RATINGS** — 6, 10, 13, 16, 20, 25, 32, 40, 45, 50, 63, 80, 100, N/A (amps)

**MAX_ZS_LOOKUP** — Auto-populates max earth fault loop impedance from OCP type + rating:

| Type | 6A | 10A | 16A | 20A | 32A | 40A | 50A | 63A |
|------|----|-----|-----|-----|-----|-----|-----|-----|
| B | 5.82 | 3.49 | 2.18 | 1.75 | 1.09 | 0.87 | 0.70 | 0.55 |
| C | 2.91 | 1.75 | 1.09 | 0.87 | 0.54 | 0.44 | 0.35 | 0.27 |
| D | 1.45 | 0.87 | 0.54 | 0.44 | 0.27 | 0.22 | 0.17 | 0.13 |

**REF_METHODS** — 100, 101, 102, 103, A, B, C, D, E, F, G, N/A

**MAX_DISCONNECT_TIMES** — 0.1, 0.2, 0.4, 1, 5, N/A (seconds)

**RCD_TYPES** — AC, A, F, B, N/A
**RCD_RATINGS_A** — 6, 10, 16, 20, 25, 32, 40, 63, N/A (amps)
**RCD_RATINGS (mA)** — 10, 30, 100, 300

**TEST_VOLTAGES** — 250V, 500V, 1000V

**TOGGLE_OPTIONS** — ✓, N/A, LIM, X

**BS_EN_OPTIONS** — MCB BS EN 60898-1, RCBO BS EN 61009-1, RCCB BS EN 61008-1, AFDD BS EN 62606, MCCB BS EN 60947-2, Fuses (HRC) BS EN 60269, Rewirable Fuse BS 3036, Switch Disconnector BS EN 60947-3, SPD BS EN 61643-11

**CIRCUIT_DESCRIPTIONS** — Grouped dropdown with 35+ options across 8 categories:
Lighting Circuits, Socket Circuits, Dedicated Appliance Circuits, Heating & Ventilation, Special Installations, Outdoor/Ancillary, Misc/Common, Distribution/Protection

**Text Constants**
- `INSPECTOR_DECLARATION_TEXT` — Full BS 7671 compliant inspector declaration
- `REVIEWER_DECLARATION_TEXT` — QS reviewer declaration
- `OPERATIONAL_LIMITATIONS` — Standard limitations text (read-only)
- `NOTES_FOR_RECIPIENT` — 5 sections: Purpose, What to do, Remedial action, Re-inspection guidance, RCD testing
- `CLASSIFICATION_GUIDANCE` — C1 (Danger), C2 (Potentially Dangerous), C3 (Improvement Recommended), FI (Further Investigation)

---

### Full `eicr_data` JSONB Field Reference

**Metadata**
- `formType` — `"EICR183C"`
- `isDraft` — boolean
- `submittedAt` / `submittedBy` — ISO timestamp / user ID
- `rejectionReason` / `rejectedBy` / `rejectedAt` — set on supervisor rejection

**Part 1 — Contractor (auto-filled)**
`tradingTitle`, `contractorAddress`, `contractorTel`, `company`

**Part 1 — Client**
`landlordName`, `landlordDetails`, `agentName`, `agencyAddress`, `clientAddress`, `clientPostcode`, `occupiedBy`

**Part 1 — Installation**
`installationAddress`, `installationPostcode`, `installationTel`, `uprn`

**Part 2**
`purposeKey`, `inspectionDate`, `recordsAvailable`, `previousReportAvailable`, `previousReportDate`

**Part 3**
`conditionKey`, `generalCondition`, `premisesType`, `premisesOther`, `estimatedAgeRange`, `evidenceOfAlterations`, `alterationsAge`

**Part 4**
`inspectorName`, `inspectorDate`, `nextInspectionDate`, `nextInspectionReason`, `reviewerName`, `reviewerDate`, `bs7671AmendedTo`

**Part 5**
`observations` (array — see below), `noRemedialRequired`, `c1Items`, `c2Items`, `c3Items`, `fiItems`

Observation object: `{ itemNo, ref, observation, code, location, linkedFromPart9, linkedRef }`

**Part 6**
`extentKey`, `limitationsKey`, `agreedWith`, `extentOfSampling`

**Part 7**
`earthingSystem`, `supplyPhase`, `nominalVoltageLines`, `nominalVoltageEarth`, `nominalFrequency`, `prospectiveFaultCurrent`, `externalEarthFaultLoop`, `supplyProtectiveBSEN`, `supplyProtectiveType`, `supplyProtectiveRating`

**Part 8**
`maxDemand`, `earthingDistributor`, `earthingElectrode`, `earthElectrodeType`, `earthElectrodeLocation`, `earthElectrodeResistance`, `earthingConductorMaterial`, `earthingConductorCSA`, `earthingConductorVerified`, `bondingConductorMaterial`, `bondingConductorCSA`, `bondingConductorVerified`, `bondingWater`, `bondingGas`, `bondingSteel`, `bondingOil`, `bondingLightning`, `mainSwitchLocation`, `mainSwitchBSEN`, `mainSwitchType`, `mainSwitchRating`, `mainSwitchPoles`, `mainSwitchCurrentRating`, `mainSwitchVoltage`, `dbDesignation`, `dbLocation`, `dbZdb`, `dbIpf`

**Part 9** — 81+ toggle fields (see inspection schedule below)

**Part 11A**
`dbDesignation`, `dbLocation`, `dbZdb`, `dbIpf`, `dbPolarityConfirmed`, `spdT1`, `spdT2`, `spdT3`, `spdNA`

`circuits` array: `{ num, description, wiringType, refMethod, points, liveCsa, cpcCsa, maxDisconnect, ocpBSEN, ocpType, ocpRating, ocpKA, ocpMaxZs, rcdBSEN, rcdType, rcdRating, rcdImA }`

**Part 11B**
`testResults` array: `{ num, r1, rn, r2, r1r2, r2only, irLL, irLE, testV, polarity, zs, rcdTime, rcdTestBtn, afddTestBtn, comments }`

`testInstrumentMulti`, `testInstrumentContinuity`, `testInstrumentInsulation`, `testInstrumentLoop`, `testInstrumentEarth`, `testInstrumentRCD`, `testedByName`, `testedByPosition`, `testedByDate`, `vulnerableCircuits`, `scheduleInspectedBy`, `scheduleInspectedDate`

---

### Part 9 Inspection Schedule — All Sections & Items

**Section 1 — Intake Equipment (8 items)**
Service cable, service head, earthing arrangement, meter tails, metering equipment, isolator, consumer's isolator, consumer's meter tails

**Section 2 — Alternative Sources (2 items)**
Generating set (switched alternative), generating set (parallel with supply)

**Section 3 — Methods of Protection (16 items)**
*Earthing & Bonding (10):* Main arrangement, distributor's arrangement, conductor size, connections, accessibility ×3, labels, FELV
*Additional Protection (6):* RCD ≤30mA for sockets, concealed cables, bath/shower, outdoor, heating cables; AFDD

**Section 4 — Consumer Unit / Distribution Board (25 items)**
Working space, security, insulation of live parts, barriers, IP rating, fire rating, enclosure damage, obstacles, main switches present/operation, CB/RCD/AFDD operation, RCD test button, RCD fault/additional protection, RCD 6-monthly notice, AFDD test button, diagrams/charts, alternative supply warning notice, next inspection label, other labelling, compatibility, single-pole switching, mechanical damage, electromagnetic effects, connections tight

**Section 5 — Distribution Circuits / Submains (24 items)**
Conductor identification, cable support, insulation condition, non-sheathed cables, containment, terminations, cable damage, current capacity, voltage drop, thermal effects, cables in parallel, cable routes, CSA adequacy, insulation condition (visual), fire barriers, radiant heat, electromagnetic effects, working space, CPC adequacy, correct wiring system, harmful substances, mutual heating, concealed routes, earth/bonding

**Section 6 — Final Circuits (20 items)**
Conductor identification, cable support, insulation condition, non-sheathed, terminations, current capacity, protective devices, CPC, voltage drop, thermal effects, mechanical damage (×2), RCD ≤30mA for sockets/outdoor/concealed/luminaires (4 items), ring conductor continuity, socket count, lighting, fixed equipment (×4), accessories (×2), SPD provided, wiring & accessories condition

**Section 7 — Isolation & Switching (16 items)**
*Isolators (6):* Provision, location, accessibility, rating, labelling, operation
*Mechanical maintenance (4):* Provision, location, inadvertent reconnection prevention, labelling
*Emergency switching (4):* Provision, location, accessibility, labelling
*Functional switching (4):* Provision, location, type/suitability, labelling

**Section 8 — Current-Using Equipment (11 items)**
IP rating, fire hazard, enclosure damage, environment suitability, security of fixing, luminaire type/suitability, luminaire list (text field), recessed luminaires: fire protection, thermal clearances, wiring terminations, maintenance accessibility

**Section 9 — Special Locations / Bath & Shower (8 items)**
RCD provision, SELV/PELV requirements, shaver supply unit, supplementary bonding, socket distance from bath, IP rating, equipment suitability for zone, zone accessories

**Section 10 — Prosumer Installation (1 item)**
Prosumer's low voltage installation

---

### Smart / Automation Features

| Feature | How it works |
|---------|-------------|
| Auto R1+R2 | When r1 or r2 entered → `(r1 + r2) / 4` |
| Auto R1+R2 from Zs | When Zs entered → `Zs − Zdb` → populates R1+R2 (only when Zs ≥ Zdb) |
| Auto Max Zs | When OCP type + rating selected → looks up MAX_ZS_LOOKUP table |
| Part 9 → Part 5 link | When Part 9 item set to C1/C2/C3/FI → auto-creates observation row in Part 5 |
| Part 9 → Part 5 unlink | When classification cleared → removes linked observation |
| Zs pass/fail badge | Compares measured Zs to ocpMaxZs → green PASS / red FAIL shown inline |
| Mark All Pass | Sets all 81+ Part 9 items to ✓, clears all linked Part 5 observations |
| Fill All N/A | Fills only blank Part 9 fields with "N/A" (with confirmation dialog) |
| Copy IR to all | Copies irLL, irLE, testV from circuit 1 to all test result rows |
| Copy polarity to all | Copies polarity from circuit 1 to all test result rows |
| Domestic template | Loads 7 pre-built circuits: Lights GF, Lights FF, Sockets GF, Sockets FF, Cooker, Boiler, Smoke alarm |
| Clone circuits | Duplicates last circuit N times (1–20), blanks description field on each clone |
| Previous EICR carry-forward | Detects prior Completed EICR on same property → offers one-tap load of form data |
| Auto next inspection date | Fills 5 years from inspection date if next inspection date field is blank |
| Live observation counts | C1/C2/C3/FI badge counts update live in Part 5 header |
| Form progress bar | Percentage of key fields completed, shown below sticky nav |
| Sticky section nav | Parts 1–9, 11A, 11B tabs fixed at top of page while scrolling |
| Floating Save Draft | Save button fixed bottom-right, always visible |
| Common obs suggestions | Quick dropdown of 10 pre-written C1/C2/C3/FI observation texts |
| Postcode/UPRN lookup | Calls postcodes.io — enter postcode or UPRN to auto-fill installation postcode |
| Re-open job | Supervisor/Admin button resets Completed/Awaiting jobs back to In Progress |
| Reference method dropdown | Per-circuit dropdown for reference method (100, 101, A, B, C…) |

---

### Draft vs Submitted State

| State | `isDraft` | Job status | Who can set |
|-------|----------|-----------|------------|
| Saved draft | `true` | In Progress | Any form user |
| Submitted (Junior) | `false` | Awaiting Sign-Off | Junior engineer |
| Submitted (Engineer) | `false` | Completed | Engineer, Supervisor, Admin |
| Rejected | `false` + `rejectionReason` set | In Progress | Supervisor, Admin |
| Re-opened | metadata stripped | In Progress | Supervisor, Admin |

On rejection, `rejectionReason`, `rejectedBy`, `rejectedAt` are added to `eicr_data`. The engineer sees a warning banner with the reason when they re-open the form.

On re-open, all metadata fields are stripped but all form field data is preserved.

---

### PDF Certificate — 7-Page Structure

| Page | Content |
|------|---------|
| 1 | Title, CRN, contractor block, Parts 1–4 (client, purpose, condition, declarations + signatures) |
| 2 | Part 5 (observations table with colour-coded badges), Parts 6–8 (extent, supply, DB particulars) |
| 3 | Part 9 Sections 1–5 (two-column layout, pass/C1/C2/C3/FI/NA badges) |
| 4 | Part 9 Sections 6–10 (two-column), inspected-by block |
| 5 | Part 11A circuit details table (17 columns) |
| 6 | Part 11B test results table (15 columns), vulnerable circuits, test instruments, tested-by + signature |
| 7 | Notes for Recipients (5 guidance sections) + Classification Guidance grid (C1/C2/C3/FI) |

Margins: 12mm all sides. Signature images fetched from `profiles.signature_url` and rendered into declaration blocks.

---

### CRN Generation

```
getNextCRN():
  SELECT crn FROM jobs WHERE crn IS NOT NULL ORDER BY crn DESC LIMIT 1
  → if none found: return "1000000"
  → else: return String(parseInt(last) + 1)
```

7-digit sequential number. Stored in `jobs.crn` on form submission.

*— End of Part 2B — EICR Form Deep Dive —*

---

## 9. KEY BUSINESS LOGIC

### Job Lifecycle / Workflow

Jobs move through a strict status machine. The allowed transitions are:

```
Pending → Scheduled → In Progress → Awaiting Sign-Off → Completed
                                 ↘ (engineer)          ↗ (supervisor approves)
                                   Completed (direct)    ← engineer role only
                              Awaiting Sign-Off ← rejected back to In Progress
                              Completed → In Progress   (re-open by supervisor/admin)
```

**Step-by-step:**

1. **Pending** — Agent/Admin creates a job via RequestJobModal. No engineer assigned yet.
2. **Scheduled** — Admin assigns an engineer + scheduled date via AssignModal.
3. **In Progress** — Engineer opens the job in the EICR form and saves a draft. Status auto-updates to In Progress on first save.
4. **Awaiting Sign-Off** — Junior engineer submits the completed EICR. Lands in the Sign-Off Queue.
5. **Completed** (direct) — Full Engineer/Supervisor/Admin submits → bypasses queue, goes straight to Completed.
6. **Approved** — Supervisor approves from Sign-Off Queue → status = Completed.
   - If `outcome = Unsatisfactory`: system auto-creates a new Remedial job (Pending) on the same property.
7. **Rejected** — Supervisor rejects with a reason → status returns to In Progress. Engineer sees the reason in the form.
8. **Re-opened** — Supervisor/Admin can reopen a Completed or Awaiting Sign-Off job → status = In Progress, form data preserved, metadata cleared.
9. **Cancelled** — Admin can cancel any job. Cancelled jobs are hidden from most views but kept in the database.

**Auto-created Remedial jobs:**
- Triggered when: supervisor approves an EICR with `outcome = Unsatisfactory`, OR when a certificate is uploaded and the job's EICR data shows Unsatisfactory outcome.
- Created with: `type = "Remedial"`, `status = "Pending"`, `notes = "Auto-created from unsatisfactory EICR — [job ref]"`.
- Audit entry logged with role `Auto`.

---

### Compliance Calculation

Properties have three independent compliance tracks: EICR, Smoke & CO, PAT.

```
calcStatus(expiryDate):
  if no date        → "red"   (no certificate on record)
  if date < today   → "red"   (expired)
  if date < today + 60 days → "amber"  (expiring soon)
  otherwise         → "green" (compliant)

overallStatus(property):
  worst of calcStatus(expiry_date), calcStatus(smoke_expiry), calcStatus(pat_expiry)
```

**Dashboard compliance donuts** (Admin/Agent view):
- Count properties by `overallStatus` → green / amber / red totals
- "Needs Attention" list = all amber + red properties, sorted by urgency

**EICR expiry rule:** Last EICR date + 5 years = expiry date. This is auto-calculated whenever a certificate is uploaded or a property is created/edited.

---

### Certificate Upload Workflow

When a certificate PDF is uploaded via UploadCertModal:

1. File validated: max 50MB, must be PDF or image.
2. File uploaded to Supabase Storage: `{orgId}/{jobId}/{timestamp}_{filename}`.
3. `documents` row created with `file_path`, `type`, `expiry_date`, `job_id`, `property_id`.
4. Property compliance dates auto-updated:
   - **EICR upload** → `properties.expiry_date = uploaded expiry`, `properties.last_eicr = expiry − 5 years`
   - **Smoke upload** → `properties.smoke_expiry = uploaded expiry`, `properties.last_smoke = today`
   - **PAT upload** → `properties.pat_expiry = uploaded expiry`, `properties.last_pat = today`
5. Job marked `has_cert = true`.
6. If job's `eicr_data.outcome = Unsatisfactory` → auto-create Remedial job (same as sign-off approval path).
7. Audit log entry written.

**Downloads:** Supabase signed URLs are generated on demand (60-minute validity). No files are ever served directly from the app.

---

### Multi-Tenancy & Organisation Scoping

The portal supports multiple letting agencies as clients of one contractor (Ohmnium Electrical).

**Data isolation rules:**
- Every property has an `agency_id` pointing to an `organisations` row of type `agency`.
- Every job, document, comment, and audit entry carries an `organisation_id` — always derived from the **property's** `agency_id`, never the creating user's own org. This ensures agency users can see data created by Ohmnium engineers on their properties.
- Fallback chain for `organisation_id`: `property.agency_id` → explicit param → `user.organisation_id`.

**Query scoping by role:**
- **Admin:** No org filter — sees all data across all organisations.
- **Agent:** Queries filtered by `organisation_id = user.organisation_id`.
- **Engineer/Junior:** Queries filtered by `engineer_id = user.id` (only their assigned jobs and the properties those jobs belong to).
- **Supervisor:** Sees all jobs (contractor-wide), scoped to the contractor's organisation context.

**RLS on Supabase** enforces these rules at the database level as a second layer of security.

---

### CSV Bulk Import

Agents and Admins can bulk-import properties from a CSV file.

**Expected columns:** `address`, `tenant name`, `phone`, `last eicr date`, `smoke expiry`, `pat expiry`

**Process:**
1. Parse CSV client-side. Reject files over 5,000 rows (DoS protection).
2. Normalise addresses (lowercase, trim) and compare against existing properties to detect duplicates.
3. Show preview: new rows vs skipped duplicates.
4. On confirm: insert all new properties, auto-calculate EICR expiry (last_eicr + 5 years).
5. Single audit log entry: `"CSV import: N properties added"`.

---

### Team Management Logic

**Creating a user (AddUserModal):**
1. Calls `supabase.auth.admin.createUser()` (requires service role key).
2. Fallback: `supabase.auth.signUp()` if admin API is unavailable.
3. Upserts a `profiles` row with name, role, and `organisation_id`.

**Inviting a user (InviteUserModal):**
1. Calls `supabase.auth.admin.inviteUserByEmail()`.
2. User receives a magic link email; sets their own password on first sign-in.
3. `handle_new_user` DB trigger auto-creates a `profiles` row on sign-up.

**Signature management:**
- Admin uploads a PNG/JPEG/SVG (max 2MB) via SignatureModal.
- File stored in Supabase Storage.
- URL saved to `profiles.signature_url`.
- Signature is rendered into the declaration blocks of generated PDF certificates.

---

### AI Remedial Scope Generation

Triggered from the EICR form when the observations field contains more than 20 characters.

- **Model:** `claude-sonnet-4-20250514` via Anthropic API (`/v1/messages`)
- **System prompt:** "You are a qualified electrical engineer writing remedial work scopes based on EICR observations..."
- **Input:** The text content of the observations field
- **Output:** Populates the recommendations/remedial scope field
- **API key:** Stored server-side (not in the Vite env — called via a Netlify function or similar proxy to avoid exposing key in client bundle)

---

### Audit Logging

Every significant action writes a row to `audit_log`. Key logged events:

| Action | Triggered by |
|--------|-------------|
| Property added / edited / deleted | Admin, Agent |
| Job created / assigned / cancelled | Admin, Agent |
| EICR saved as draft | Engineer, Junior |
| EICR submitted | Engineer, Junior |
| EICR approved / rejected | Supervisor, Admin |
| Certificate uploaded | Admin, Agent, Engineer |
| Remedial job auto-created | System (role: Auto) |
| CSV import: N properties | Admin, Agent |
| User invited / created | Admin |
| Password changed | Any user |

Entries are immutable — there is no delete or edit on audit records.

---

### DataContext — Key Mutations Reference

All data mutations go through `DataContext` functions, which handle Supabase calls, org scoping, and audit logging:

| Function | What it does |
|----------|-------------|
| `addProperty(prop)` | Insert property, auto-generate ref, log audit |
| `updateProperty(id, updates)` | Update property fields, recalculate expiry if needed |
| `deleteProperty(id)` | Delete property and cascade-related records |
| `addJob(job)` | Insert job, derive org_id from property, auto-generate ref |
| `updateJob(id, updates)` | Update job fields including eicr_data JSONB |
| `deleteJob(id)` | Delete job |
| `addDoc(doc)` | Insert document record, update property compliance dates |
| `uploadFile(file, path)` | Upload file to Supabase Storage |
| `addAudit(entry)` | Insert audit_log row |
| `addComment(comment)` | Insert job_comments row with org_id from job |
| `getNextCRN()` | Query max CRN, return next sequential number |

*— End of Part 2C — Key Business Logic —*
