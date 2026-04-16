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
