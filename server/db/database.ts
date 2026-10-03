import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { ClinicalCase, CaseStatus } from '../../src/types/clinicalCase';


export interface DbSession {
  token: string;
  session_type: 'kiosk' | 'clinician';
  created_at: string;
  expires_at: string;
  active_case_id: string | null;
  is_active: number;
}

export interface DbAuditEvent {
  id: string;
  case_id: string | null;
  actor_type: 'patient' | 'kiosk' | 'clinician' | 'system';
  actor_id: string | null;
  action: string;
  details_json: string | null;
  timestamp: string;
}

let dbInstance: Database.Database | null = null;

export function closeDatabase(): void {
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch {
      // ignore
    }
    dbInstance = null;
  }
}

export function setDatabaseInstance(db: Database.Database | null): void {
  dbInstance = db;
}

export function getDatabase(dbPath?: string): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  const resolvedPath = dbPath || process.env.MEDSCRIBE_DB_PATH || path.join(process.cwd(), 'server', 'db', 'medscribe.db');
  
  if (resolvedPath !== ':memory:') {
    const dir = path.dirname(resolvedPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new Database(resolvedPath);
  if (resolvedPath !== ':memory:') {
    db.pragma('journal_mode = WAL');
  }
  db.pragma('foreign_keys = ON');

  // Load and execute schema
  const schemaPath = path.join(__dirname, 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schemaSql);
  } else {
    // Fallback if running compiled or different cwd
    const rootSchemaPath = path.join(process.cwd(), 'server', 'db', 'schema.sql');
    if (fs.existsSync(rootSchemaPath)) {
      const schemaSql = fs.readFileSync(rootSchemaPath, 'utf8');
      db.exec(schemaSql);
    }
  }

  dbInstance = db;
  return db;
}


export function resetDatabaseForTesting(db: Database.Database): void {
  db.exec(`
    DELETE FROM audit_events;
    DELETE FROM safety_alerts;
    DELETE FROM soap_notes;
    DELETE FROM documents;
    DELETE FROM clinical_facts;
    DELETE FROM clinical_cases;
    DELETE FROM consents;
    DELETE FROM patients;
    DELETE FROM sessions;
  `);
}

/* =========================================================================
   1. SESSIONS
   ========================================================================= */

export function createSession(
  db: Database.Database,
  session: {
    token: string;
    sessionType: 'kiosk' | 'clinician';
    expiresAt: string;
    activeCaseId?: string | null;
  }
): void {
  const stmt = db.prepare(`
    INSERT INTO sessions (token, session_type, created_at, expires_at, active_case_id, is_active)
    VALUES (?, ?, ?, ?, ?, 1)
  `);
  stmt.run(
    session.token,
    session.sessionType,
    new Date().toISOString(),
    session.expiresAt,
    session.activeCaseId || null
  );
}

export function getSession(db: Database.Database, token: string): DbSession | null {
  const stmt = db.prepare(`SELECT * FROM sessions WHERE token = ?`);
  const row = stmt.get(token) as DbSession | undefined;
  return row || null;
}

export function invalidateSession(db: Database.Database, token: string): void {
  const stmt = db.prepare(`UPDATE sessions SET is_active = 0 WHERE token = ?`);
  stmt.run(token);
}

export function updateSessionCase(db: Database.Database, token: string, caseId: string | null): void {
  const stmt = db.prepare(`UPDATE sessions SET active_case_id = ? WHERE token = ?`);
  stmt.run(caseId, token);
}

/* =========================================================================
   2. PATIENTS & CONSENTS
   ========================================================================= */

export function upsertPatient(
  db: Database.Database,
  patient: { id: string; tempId: string; demographics: any }
): void {
  const stmt = db.prepare(`
    INSERT INTO patients (id, temp_id, created_at, demographics_json)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      demographics_json = excluded.demographics_json
  `);
  stmt.run(
    patient.id,
    patient.tempId,
    new Date().toISOString(),
    JSON.stringify(patient.demographics)
  );
}

export function recordConsent(
  db: Database.Database,
  consent: {
    id: string;
    patientId: string;
    granted: boolean;
    scopes: any;
    language: string;
    method: string;
    version: string;
    timestamp: string;
  }
): void {
  const stmt = db.prepare(`
    INSERT INTO consents (id, patient_id, granted, scopes_json, language, method, version, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    consent.id,
    consent.patientId,
    consent.granted ? 1 : 0,
    JSON.stringify(consent.scopes),
    consent.language,
    consent.method,
    consent.version,
    consent.timestamp
  );
}

/* =========================================================================
   3. CLINICAL CASES & FACTS
   ========================================================================= */

export function saveClinicalCase(db: Database.Database, clinicalCase: ClinicalCase): void {
  const patientId = clinicalCase.patient.tempId || clinicalCase.id;

  // 1. Ensure patient record exists
  upsertPatient(db, {
    id: patientId,
    tempId: clinicalCase.patient.tempId,
    demographics: {
      name: clinicalCase.patient.name.value,
      age: clinicalCase.patient.age.value,
      sex: clinicalCase.patient.sex.value,
      phone: clinicalCase.patient.phone?.value,
    },
  });

  // 2. Insert or update clinical_cases
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO clinical_cases (id, patient_id, status, language, created_at, updated_at, data_json)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      status = excluded.status,
      language = excluded.language,
      updated_at = excluded.updated_at,
      data_json = excluded.data_json
  `);

  stmt.run(
    clinicalCase.id,
    patientId,
    clinicalCase.status,
    clinicalCase.language || 'en',
    clinicalCase.createdAt || now,
    now,
    JSON.stringify(clinicalCase)
  );

  // 3. Sync structured clinical facts
  const deleteFacts = db.prepare(`DELETE FROM clinical_facts WHERE case_id = ?`);
  deleteFacts.run(clinicalCase.id);

  const insertFact = db.prepare(`
    INSERT INTO clinical_facts (id, case_id, field, value_json, provenance_source, provenance_method, confidence, verification_state, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const factsToInsert = [
    { field: 'patient.name', fact: clinicalCase.patient.name },
    { field: 'patient.age', fact: clinicalCase.patient.age },
    { field: 'patient.sex', fact: clinicalCase.patient.sex },
    { field: 'intake.chiefComplaint', fact: clinicalCase.intake.chiefComplaint },
    { field: 'intake.symptomOnset', fact: clinicalCase.intake.symptomOnset },
  ];

  for (const { field, fact } of factsToInsert) {
    if (fact) {
      insertFact.run(
        `fact_${clinicalCase.id}_${field.replace('.', '_')}`,
        clinicalCase.id,
        field,
        JSON.stringify(fact.value),
        fact.provenance?.source || 'PATIENT_REPORTED',
        fact.provenance?.method || 'touch',
        fact.provenance?.confidence ?? 1.0,
        fact.provenance?.verificationState || 'unverified',
        fact.provenance?.timestamp || now
      );
    }
  }

  // Question responses
  for (const [qKey, qFact] of Object.entries(clinicalCase.intake.questionResponses || {})) {
    insertFact.run(
      `fact_${clinicalCase.id}_q_${qKey}`,
      clinicalCase.id,
      `question.${qKey}`,
      JSON.stringify(qFact.value),
      qFact.provenance?.source || 'PATIENT_REPORTED',
      qFact.provenance?.method || 'touch',
      qFact.provenance?.confidence ?? 1.0,
      qFact.provenance?.verificationState || 'unverified',
      qFact.provenance?.timestamp || now
    );
  }


  // 4. Sync red flag alerts
  const deleteAlerts = db.prepare(`DELETE FROM safety_alerts WHERE case_id = ?`);
  deleteAlerts.run(clinicalCase.id);

  const insertAlert = db.prepare(`
    INSERT INTO safety_alerts (id, case_id, alert_type, severity, message, acknowledged, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const redFlag of clinicalCase.intake.redFlags || []) {
    insertAlert.run(
      redFlag.id,
      clinicalCase.id,
      'RedFlagAlert',
      redFlag.severity,
      `${redFlag.title}: ${redFlag.description}`,
      redFlag.acknowledgedByClinician ? 1 : 0,
      redFlag.triggeredAt || now
    );
  }
}

export function getClinicalCase(db: Database.Database, id: string): ClinicalCase | null {
  const stmt = db.prepare(`SELECT data_json FROM clinical_cases WHERE id = ?`);
  const row = stmt.get(id) as { data_json: string } | undefined;
  if (!row) return null;
  try {
    return JSON.parse(row.data_json) as ClinicalCase;
  } catch {
    return null;
  }
}

export function listClinicalCases(
  db: Database.Database,
  filter?: { status?: CaseStatus }
): ClinicalCase[] {
  let query = `SELECT data_json FROM clinical_cases`;
  const params: any[] = [];
  if (filter?.status) {
    query += ` WHERE status = ?`;
    params.push(filter.status);
  }
  query += ` ORDER BY created_at DESC`;

  const stmt = db.prepare(query);
  const rows = stmt.all(...params) as Array<{ data_json: string }>;
  return rows.map((r) => JSON.parse(r.data_json) as ClinicalCase);
}

export function updateCaseStatus(
  db: Database.Database,
  caseId: string,
  newStatus: CaseStatus
): void {
  const existing = getClinicalCase(db, caseId);
  if (!existing) {
    throw new Error(`Case ${caseId} not found`);
  }
  existing.status = newStatus;
  existing.updatedAt = new Date().toISOString();
  saveClinicalCase(db, existing);
}

export function deleteClinicalCase(db: Database.Database, caseId: string): void {
  const stmt = db.prepare(`DELETE FROM clinical_cases WHERE id = ?`);
  stmt.run(caseId);
}


/* =========================================================================
   4. AUDIT EVENTS
   ========================================================================= */

export function recordAuditEvent(
  db: Database.Database,
  event: {
    caseId?: string | null;
    actorType: 'patient' | 'kiosk' | 'clinician' | 'system';
    actorId?: string | null;
    action: string;
    details?: any;
  }
): string {
  const id = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const timestamp = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO audit_events (id, case_id, actor_type, actor_id, action, details_json, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    id,
    event.caseId || null,
    event.actorType,
    event.actorId || null,
    event.action,
    event.details ? JSON.stringify(event.details) : null,
    timestamp
  );
  return id;
}

export function getAuditEvents(
  db: Database.Database,
  caseId?: string
): DbAuditEvent[] {
  let query = `SELECT * FROM audit_events`;
  const params: any[] = [];
  if (caseId) {
    query += ` WHERE case_id = ?`;
    params.push(caseId);
  }
  query += ` ORDER BY timestamp ASC`;
  const stmt = db.prepare(query);
  return stmt.all(...params) as DbAuditEvent[];
}

/* =========================================================================
   5. DOCUMENTS REPOSITORY (ENCRYPTION-AT-REST CAPABLE)
   ========================================================================= */

export interface DbDocument {
  id: string;
  case_id: string;
  document_type: 'prescription' | 'lab_report';
  file_name: string;
  ocr_raw_text?: string | null;
  extracted_data_json?: string | null;
  created_at: string;
}

export function saveDocumentRecord(
  db: Database.Database,
  doc: {
    id: string;
    caseId: string;
    documentType: 'prescription' | 'lab_report';
    fileName: string;
    ocrRawText?: string | null;
    extractedData?: any;
  }
): void {
  const stmt = db.prepare(`
    INSERT INTO documents (id, case_id, document_type, file_name, ocr_raw_text, extracted_data_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      document_type = excluded.document_type,
      file_name = excluded.file_name,
      ocr_raw_text = excluded.ocr_raw_text,
      extracted_data_json = excluded.extracted_data_json
  `);

  stmt.run(
    doc.id,
    doc.caseId,
    doc.documentType,
    doc.fileName,
    doc.ocrRawText || null,
    doc.extractedData ? (typeof doc.extractedData === 'string' ? doc.extractedData : JSON.stringify(doc.extractedData)) : null,
    new Date().toISOString()
  );
}

export function getDocumentsForCase(db: Database.Database, caseId: string): DbDocument[] {
  const stmt = db.prepare(`SELECT * FROM documents WHERE case_id = ? ORDER BY created_at ASC`);
  return stmt.all(caseId) as DbDocument[];
}

