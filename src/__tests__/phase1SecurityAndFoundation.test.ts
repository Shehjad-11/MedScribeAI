// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { app } from '../../server';
import {
  getDatabase,
  closeDatabase,
  resetDatabaseForTesting,
  getClinicalCase,
  getAuditEvents,
} from '../../server/db/database';
import { ClinicalCase, createClinicalFact } from '../types/clinicalCase';

describe('Phase 1 Foundation & Security Skeleton (HTTP Integration Suite)', () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    // Strictly isolate tests: use in-memory SQLite database, NEVER server/db/medscribe.db
    closeDatabase();
    process.env.MEDSCRIBE_DB_PATH = ':memory:';
    process.env.CLINICIAN_USER = 'doctor';
    process.env.CLINICIAN_PASS = 'medscribe2026';

    const db = getDatabase(':memory:');
    resetDatabaseForTesting(db);

    // Spin up ephemeral HTTP server on a random port for true network testing
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    closeDatabase();
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  /* =========================================================================
     TEST 1: ClinicalCase Provenance Model & Validation
     ========================================================================= */
  describe('1. ClinicalCase Domain Model & Provenance', () => {
    it('creates facts with valid provenance sources, confidence, and timestamps', () => {
      const fact = createClinicalFact(
        'chiefComplaint',
        'Chest pain radiating to left arm',
        'PATIENT_REPORTED',
        'touch',
        { confidence: 1.0, rawFragment: 'Severe pressure in chest' }
      );

      expect(fact.field).toBe('chiefComplaint');
      expect(fact.value).toBe('Chest pain radiating to left arm');
      expect(fact.provenance.source).toBe('PATIENT_REPORTED');
      expect(fact.provenance.method).toBe('touch');
      expect(fact.provenance.confidence).toBe(1.0);
      expect(fact.provenance.verificationState).toBe('unverified');
      expect(fact.provenance.rawFragment).toBe('Severe pressure in chest');
      expect(new Date(fact.provenance.timestamp).getTime()).toBeGreaterThan(0);
    });

    it('supports AI_GENERATED and CLINICIAN_VERIFIED provenance states', () => {
      const aiFact = createClinicalFact('extractedMedication', 'Amlodipine 5mg', 'AI_GENERATED', 'llm_extraction', {
        confidence: 0.88,
      });
      expect(aiFact.provenance.source).toBe('AI_GENERATED');
      expect(aiFact.provenance.confidence).toBe(0.88);

      const verifiedFact = createClinicalFact('confirmedMedication', 'Amlodipine 5mg', 'CLINICIAN_VERIFIED', 'doctor_entry', {
        verifiedBy: 'Dr. Verma',
      });
      expect(verifiedFact.provenance.source).toBe('CLINICIAN_VERIFIED');
      expect(verifiedFact.provenance.verificationState).toBe('clinician_verified');
      expect(verifiedFact.provenance.verifiedBy).toBe('Dr. Verma');
    });
  });

  /* =========================================================================
     TEST 2: Security Boundaries — Real HTTP Requests with Bearer Tokens
     ========================================================================= */
  describe('2. Security Boundary Enforcement (Real HTTP Routes)', () => {
    it('strictly rejects kiosk tokens on clinician routes with 403 Forbidden over HTTP', async () => {
      // 1. Obtain a valid kiosk session via HTTP POST
      const startRes = await fetch(`${baseUrl}/api/kiosk/session/start`, { method: 'POST' });
      expect(startRes.status).toBe(201);
      const { token: kioskToken } = await startRes.json();
      expect(kioskToken).toMatch(/^kiosk_/);

      // 2. Attempt to access clinician queue with kiosk token via HTTP GET
      const queueRes = await fetch(`${baseUrl}/api/clinician/queue`, {
        headers: { Authorization: `Bearer ${kioskToken}` },
      });
      expect(queueRes.status).toBe(403);
      const errorJson = await queueRes.json();
      expect(errorJson.error).toContain('Forbidden: Kiosk tokens cannot access clinician endpoints');

      // 3. Attempt to approve a case with kiosk token via HTTP POST
      const approveRes = await fetch(`${baseUrl}/api/clinician/cases/fake_case/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${kioskToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approvedBy: 'Attacker' }),
      });
      expect(approveRes.status).toBe(403);
    });

    it('clinician routes reject unauthenticated requests with 401 Unauthorized over HTTP', async () => {
      // Missing Authorization header
      const unauthRes = await fetch(`${baseUrl}/api/clinician/queue`);
      expect(unauthRes.status).toBe(401);

      // Invalid token
      const invalidRes = await fetch(`${baseUrl}/api/clinician/queue`, {
        headers: { Authorization: 'Bearer doc_nonexistent_token' },
      });
      expect(invalidRes.status).toBe(401);
    });

    it('allows valid clinician login and grants access to clinician routes over HTTP', async () => {
      const loginRes = await fetch(`${baseUrl}/api/clinician/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'doctor', password: 'medscribe2026' }),
      });
      expect(loginRes.status).toBe(200);
      const loginData = await loginRes.json();
      expect(loginData.token).toMatch(/^doc_/);
      expect(loginData.displayName).toBe('Dr. Primary Care');

      // Call clinician queue with doctor token over HTTP
      const queueRes = await fetch(`${baseUrl}/api/clinician/queue`, {
        headers: { Authorization: `Bearer ${loginData.token}` },
      });
      expect(queueRes.status).toBe(200);
      const queueData = await queueRes.json();
      expect(Array.isArray(queueData.queue)).toBe(true);
    });
  });

  /* =========================================================================
     TEST 3: Session Reset Semantics
     ========================================================================= */
  describe('3. Session Reset Semantics & Cross-Patient Isolation', () => {
    it('(a) reset before submit deletes the unsubmitted draft case and its facts from SQLite', async () => {
      // 1. Start kiosk session
      const startRes = await fetch(`${baseUrl}/api/kiosk/session/start`, { method: 'POST' });
      const { token: draftToken } = await startRes.json();

      // 2. Create unsubmitted draft case
      const draftCase: ClinicalCase = {
        id: 'case_unsubmitted_draft',
        status: 'intake_draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        language: 'en',
        consent: {
          granted: true,
          timestamp: new Date().toISOString(),
          language: 'en',
          method: 'touch_checkbox',
          version: '1.0',
          scopes: { historyCollection: true, voiceRecording: false, documentProcessing: true, cloudAI: true, interoperabilityFHIR: true },
        },
        patient: {
          tempId: 'pt_abandoned_01',
          name: createClinicalFact('name', 'Abandoned Intake Patient', 'PATIENT_REPORTED', 'touch'),
          age: createClinicalFact('age', 40, 'PATIENT_REPORTED', 'touch'),
          sex: createClinicalFact('sex', 'Male', 'PATIENT_REPORTED', 'touch'),
        },
        intake: {
          chiefComplaint: createClinicalFact('chiefComplaint', 'Temporary Draft Complaint', 'PATIENT_REPORTED', 'touch'),
          symptomOnset: createClinicalFact('symptomOnset', '1 day', 'PATIENT_REPORTED', 'touch'),
          questionResponses: {},
          redFlags: [],
        },
        documents: [],
        auditTrail: [],
      };

      const saveRes = await fetch(`${baseUrl}/api/kiosk/case`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${draftToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(draftCase),
      });
      expect(saveRes.status).toBe(200);

      // Verify case exists in DB prior to reset
      const db = getDatabase(':memory:');
      expect(getClinicalCase(db, 'case_unsubmitted_draft')).not.toBeNull();

      // 3. Reset kiosk session BEFORE submitting
      const resetRes = await fetch(`${baseUrl}/api/kiosk/session/reset`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${draftToken}` },
      });
      expect(resetRes.status).toBe(200);

      // 4. Verify draft case was deleted from database
      expect(getClinicalCase(db, 'case_unsubmitted_draft')).toBeNull();

      // Verify associated clinical facts were cascade-deleted
      const factsStmt = db.prepare(`SELECT count(*) as count FROM clinical_facts WHERE case_id = ?`);
      const factsRow = factsStmt.get('case_unsubmitted_draft') as { count: number };
      expect(factsRow.count).toBe(0);
    });

    it('(b) reset after submit ends kiosk session but submitted case remains readable by clinician', async () => {
      // 1. Start kiosk session
      const startRes = await fetch(`${baseUrl}/api/kiosk/session/start`, { method: 'POST' });
      const { token: submittedToken } = await startRes.json();

      // 2. Create case and submit/confirm it
      const submittedCase: ClinicalCase = {
        id: 'case_completed_submit',
        status: 'intake_draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        language: 'en',
        consent: {
          granted: true,
          timestamp: new Date().toISOString(),
          language: 'en',
          method: 'touch_checkbox',
          version: '1.0',
          scopes: { historyCollection: true, voiceRecording: false, documentProcessing: true, cloudAI: true, interoperabilityFHIR: true },
        },
        patient: {
          tempId: 'pt_submitted_02',
          name: createClinicalFact('name', 'Confirmed Patient Rajesh', 'PATIENT_REPORTED', 'touch'),
          age: createClinicalFact('age', 52, 'PATIENT_REPORTED', 'touch'),
          sex: createClinicalFact('sex', 'Male', 'PATIENT_REPORTED', 'touch'),
        },
        intake: {
          chiefComplaint: createClinicalFact('chiefComplaint', 'Chest Pain', 'PATIENT_REPORTED', 'touch'),
          symptomOnset: createClinicalFact('symptomOnset', '2 hours', 'PATIENT_REPORTED', 'touch'),
          questionResponses: {},
          redFlags: [],
        },
        documents: [],
        auditTrail: [],
      };

      await fetch(`${baseUrl}/api/kiosk/case`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${submittedToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submittedCase),
      });

      // Submit/confirm case
      const confirmRes = await fetch(`${baseUrl}/api/kiosk/case/confirm`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${submittedToken}` },
      });
      expect(confirmRes.status).toBe(200);

      // 3. Reset kiosk session AFTER submit (kiosk wipes for next patient)
      const resetRes = await fetch(`${baseUrl}/api/kiosk/session/reset`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${submittedToken}` },
      });
      expect(resetRes.status).toBe(200);

      // 4. Authenticated clinician logs in and reads the submitted case
      const loginRes = await fetch(`${baseUrl}/api/clinician/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'doctor', password: 'medscribe2026' }),
      });
      const { token: docToken } = await loginRes.json();

      const caseRes = await fetch(`${baseUrl}/api/clinician/cases/case_completed_submit`, {
        headers: { Authorization: `Bearer ${docToken}` },
      });
      expect(caseRes.status).toBe(200);
      const caseData = await caseRes.json();
      expect(caseData.case.status).toBe('patient_confirmed');
      expect(caseData.case.patient.name.value).toBe('Confirmed Patient Rajesh');
    });

    it('(c) a reused token after reset returns 401 Unauthorized', async () => {
      // 1. Start session
      const startRes = await fetch(`${baseUrl}/api/kiosk/session/start`, { method: 'POST' });
      const { token } = await startRes.json();

      // 2. Reset session
      await fetch(`${baseUrl}/api/kiosk/session/reset`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      // 3. Reusing the token returns 401 Unauthorized
      const readRes = await fetch(`${baseUrl}/api/kiosk/case`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(readRes.status).toBe(401);
      const err = await readRes.json();
      expect(err.error).toContain('Unauthorized: Kiosk session is invalid or has been reset');
    });
  });

  /* =========================================================================
     TEST 4: Minimal Audit Trail Verification
     ========================================================================= */
  describe('4. Minimal Audit Trail Logging', () => {
    it('records critical clinical and security events in SQLite', async () => {
      const db = getDatabase(':memory:');
      const events = getAuditEvents(db);

      const actionTypes = events.map((e) => e.action);
      expect(actionTypes).toContain('SESSION_CREATED');
      expect(actionTypes).toContain('SESSION_RESET');
      expect(actionTypes).toContain('CASE_SUBMITTED');
    });
  });
});
