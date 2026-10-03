-- MedScribeAI SQLite Schema for Tier 1 Foundation
-- Specification: docs/MASTER_PROMPT.md (Sections 28, 29) & docs/audit/PHASE_1_PROPOSAL.md
-- All 9 Tier 1 Required Tables:
-- 1. sessions
-- 2. patients
-- 3. consents
-- 4. clinical_cases
-- 5. clinical_facts
-- 6. documents
-- 7. soap_notes
-- 8. safety_alerts
-- 9. audit_events

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  session_type TEXT NOT NULL CHECK(session_type IN ('kiosk', 'clinician')),
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  active_case_id TEXT,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  temp_id TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL,
  demographics_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS consents (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  granted INTEGER NOT NULL,
  scopes_json TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  method TEXT NOT NULL,
  version TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS clinical_cases (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  status TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  data_json TEXT NOT NULL,
  FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS clinical_facts (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL,
  field TEXT NOT NULL,
  value_json TEXT NOT NULL,
  provenance_source TEXT NOT NULL,
  provenance_method TEXT NOT NULL,
  confidence REAL,
  verification_state TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(case_id) REFERENCES clinical_cases(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK(document_type IN ('prescription', 'lab_report')),
  file_name TEXT NOT NULL,
  ocr_raw_text TEXT,
  extracted_data_json TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY(case_id) REFERENCES clinical_cases(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS soap_notes (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL,
  subjective TEXT NOT NULL,
  objective TEXT NOT NULL,
  assessment TEXT NOT NULL,
  plan TEXT NOT NULL,
  generated_by TEXT NOT NULL,
  confidence_score INTEGER,
  created_at TEXT NOT NULL,
  FOREIGN KEY(case_id) REFERENCES clinical_cases(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS safety_alerts (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  acknowledged INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY(case_id) REFERENCES clinical_cases(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  case_id TEXT,
  actor_type TEXT NOT NULL CHECK(actor_type IN ('patient', 'kiosk', 'clinician', 'system')),
  actor_id TEXT,
  action TEXT NOT NULL,
  details_json TEXT,
  timestamp TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_cases_patient ON clinical_cases(patient_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON clinical_cases(status);
CREATE INDEX IF NOT EXISTS idx_facts_case ON clinical_facts(case_id);
CREATE INDEX IF NOT EXISTS idx_audit_case ON audit_events(case_id);
