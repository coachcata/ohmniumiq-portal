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

*— End of Part 1 of 3 —*
