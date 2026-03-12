-- ============================================================
-- OhmniumIQ — Supabase Database Schema
-- Phase 2a: Tables, Row-Level Security, Storage
-- ============================================================
-- HOW TO USE: Copy this entire file and paste it into the
-- Supabase SQL Editor (Database > SQL Editor > New Query)
-- Then click "Run" to create everything.
-- ============================================================

-- ─── 1. ORGANISATIONS (agencies / companies) ───
CREATE TABLE organisations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('agency', 'contractor')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed the two agencies + Ohmnium
INSERT INTO organisations (name, type) VALUES
  ('Kellett Lettings', 'agency'),
  ('Marsh & Co', 'agency'),
  ('Ohmnium Electrical', 'contractor');

-- ─── 2. PROFILES (extends Supabase auth.users) ───
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'agent', 'supervisor', 'engineer', 'junior')),
  organisation_id UUID REFERENCES organisations(id),
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'agent')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── 3. PROPERTIES ───
CREATE TABLE properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ref TEXT UNIQUE NOT NULL,              -- e.g. P001, P002
  address TEXT NOT NULL,
  tenant_name TEXT NOT NULL,
  tenant_phone TEXT,
  last_eicr DATE,
  expiry_date DATE,
  agency_id UUID REFERENCES organisations(id),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 4. JOBS ───
CREATE TABLE jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ref TEXT UNIQUE NOT NULL,              -- e.g. J001, J002
  property_id UUID REFERENCES properties(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('EICR', 'Remedial', 'Smoke Alarm', 'PAT')),
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Scheduled', 'In Progress', 'Awaiting Sign-Off', 'Completed')),
  engineer_id UUID REFERENCES profiles(id),
  scheduled_date DATE,
  notes TEXT,
  eicr_data JSONB,                       -- stores observations, overall result etc.
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 5. DOCUMENTS (certificates) ───
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ref TEXT UNIQUE NOT NULL,              -- e.g. D001
  job_id UUID REFERENCES jobs(id),
  property_id UUID REFERENCES properties(id) NOT NULL,
  type TEXT NOT NULL,                    -- EICR, Smoke Alarm Certificate, etc.
  file_path TEXT,                        -- path in Supabase Storage
  file_name TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  expiry_date DATE,
  uploaded_by UUID REFERENCES profiles(id)
);

-- ─── 6. AUDIT TRAIL ───
CREATE TABLE audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id),
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 7. AUTO-UPDATE TIMESTAMPS ───
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── 8. AUTO-GENERATE REF NUMBERS ───
-- Properties: P001, P002, etc.
CREATE OR REPLACE FUNCTION generate_property_ref()
RETURNS TRIGGER AS $$
DECLARE next_num INT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(ref FROM 2) AS INT)), 0) + 1
  INTO next_num FROM properties;
  NEW.ref := 'P' || LPAD(next_num::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER property_ref_trigger
  BEFORE INSERT ON properties
  FOR EACH ROW
  WHEN (NEW.ref IS NULL OR NEW.ref = '')
  EXECUTE FUNCTION generate_property_ref();

-- Jobs: J001, J002, etc.
CREATE OR REPLACE FUNCTION generate_job_ref()
RETURNS TRIGGER AS $$
DECLARE next_num INT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(ref FROM 2) AS INT)), 0) + 1
  INTO next_num FROM jobs;
  NEW.ref := 'J' || LPAD(next_num::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER job_ref_trigger
  BEFORE INSERT ON jobs
  FOR EACH ROW
  WHEN (NEW.ref IS NULL OR NEW.ref = '')
  EXECUTE FUNCTION generate_job_ref();

-- Documents: D001, D002, etc.
CREATE OR REPLACE FUNCTION generate_doc_ref()
RETURNS TRIGGER AS $$
DECLARE next_num INT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(ref FROM 2) AS INT)), 0) + 1
  INTO next_num FROM documents;
  NEW.ref := 'D' || LPAD(next_num::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER doc_ref_trigger
  BEFORE INSERT ON documents
  FOR EACH ROW
  WHEN (NEW.ref IS NULL OR NEW.ref = '')
  EXECUTE FUNCTION generate_doc_ref();


-- ============================================================
-- ROW-LEVEL SECURITY (RLS)
-- Controls who can see and edit what
-- ============================================================

ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: get current user's organisation
CREATE OR REPLACE FUNCTION get_user_org()
RETURNS UUID AS $$
  SELECT organisation_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ORGANISATIONS: everyone can read
CREATE POLICY "orgs_read" ON organisations FOR SELECT USING (true);

-- PROFILES: users see own profile + admins see all
CREATE POLICY "profiles_read_own" ON profiles FOR SELECT
  USING (id = auth.uid() OR get_user_role() = 'admin');
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  USING (id = auth.uid());

-- PROPERTIES:
-- Admin sees all. Agent sees own agency's properties.
-- Engineers see properties linked to their jobs.
CREATE POLICY "properties_read" ON properties FOR SELECT USING (
  get_user_role() = 'admin'
  OR agency_id = get_user_org()
  OR EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.property_id = properties.id
    AND jobs.engineer_id = auth.uid()
  )
);
CREATE POLICY "properties_insert" ON properties FOR INSERT
  WITH CHECK (get_user_role() IN ('admin', 'agent'));
CREATE POLICY "properties_update" ON properties FOR UPDATE
  USING (get_user_role() = 'admin' OR agency_id = get_user_org());

-- JOBS:
-- Admin sees all. Agent sees jobs on their properties.
-- Engineers see their own assigned jobs.
CREATE POLICY "jobs_read" ON jobs FOR SELECT USING (
  get_user_role() = 'admin'
  OR EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = jobs.property_id
    AND properties.agency_id = get_user_org()
  )
  OR engineer_id = auth.uid()
);
CREATE POLICY "jobs_insert" ON jobs FOR INSERT
  WITH CHECK (get_user_role() IN ('admin', 'agent'));
CREATE POLICY "jobs_update" ON jobs FOR UPDATE USING (
  get_user_role() = 'admin'
  OR engineer_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = jobs.property_id
    AND properties.agency_id = get_user_org()
  )
);

-- DOCUMENTS: same visibility as jobs
CREATE POLICY "docs_read" ON documents FOR SELECT USING (
  get_user_role() = 'admin'
  OR EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = documents.property_id
    AND properties.agency_id = get_user_org()
  )
  OR EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = documents.job_id
    AND jobs.engineer_id = auth.uid()
  )
);
CREATE POLICY "docs_insert" ON documents FOR INSERT
  WITH CHECK (get_user_role() IN ('admin', 'engineer', 'junior', 'supervisor'));

-- AUDIT LOG: admin sees all, others see entries related to their role
CREATE POLICY "audit_read" ON audit_log FOR SELECT USING (
  get_user_role() = 'admin' OR user_id = auth.uid()
);
CREATE POLICY "audit_insert" ON audit_log FOR INSERT
  WITH CHECK (true);  -- any logged-in user can write audit entries


-- ============================================================
-- STORAGE BUCKET (for certificate PDFs)
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', false);

-- Upload: admin, engineers, supervisors
CREATE POLICY "cert_upload" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'certificates'
    AND auth.role() = 'authenticated'
  );

-- Download: anyone who can see the related document
CREATE POLICY "cert_download" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'certificates'
    AND auth.role() = 'authenticated'
  );


-- ============================================================
-- SEED DATA (matches the demo data from the portal)
-- ============================================================
-- Note: Run this AFTER creating your first admin user.
-- Replace the UUIDs below with real user IDs from your
-- Supabase auth.users table after signing up.
--
-- For now, these are placeholder inserts you can run
-- from the SQL editor to populate the demo view.
-- ============================================================

-- You'll run these after setup — see the Setup Guide.
