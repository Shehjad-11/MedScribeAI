// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import http from 'http';
import { app } from '../../server';
import { getDatabase, resetDatabaseForTesting, getClinicalCase, getAuditEvents } from '../../server/db/database';
import { ClinicalCase, createClinicalFact } from '../types/clinicalCase';

describe('Phase 1 Foundation & Security Skeleton', () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    const db = getDatabase();
    resetDatabaseForTesting(db);

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
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
     TEST 2: Security Boundaries — Kiosk Token Rejected on Clinician Routes
     ========================================================================= */
  describe('2. Security Boundary Enforcement', () => {
    it('strictly rejects kiosk tokens on clinician routes with 403 Forbidden', async () => {
      // 1. Obtain a valid kiosk session
      const startRes = await fetch(`${baseUrl}/api/kiosk/session/start`, { method: 'POST' });
      expect(startRes.status).toBe(201);
      const { token: kioskToken } = await startRes.json();
      expect(kioskToken).toMatch(/^kiosk_/);

      // 2. Attempt to access clinician queue with kiosk token
      const queueRes = await fetch(`${baseUrl}/api/clinician/queue`, {
        headers: { Authorization: `Bearer ${kioskToken}` },
      });
      expect(queueRes.status).toBe(403);
      const errorJson = await queueRes.json();
      expect(errorJson.error).toContain('Forbidden: Kiosk tokens cannot access clinician endpoints');

      // 3. Attempt to approve a case with kiosk token
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

    it('clinician routes reject unauthenticated requests with 401 Unauthorized', async () => {
      // Missing Authorization header
      const unauthRes = await fetch(`${baseUrl}/api/clinician/queue`);
      expect(unauthRes.status).toBe(401);

      // Invalid token
      const invalidRes = await fetch(`${baseUrl}/api/clinician/queue`, {
        headers: { Authorization: 'Bearer doc_nonexistent_token' },
      });
      expect(invalidRes.status).toBe(401);
    });

    it('allows valid clinician login and grants access to clinician routes', async () => {
      const loginRes = await fetch(`${baseUrl}/api/clinician/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'doctor', password: 'medscribe2026' }),
      });
      expect(loginRes.status).toBe(200);
      const loginData = await loginRes.json();
      expect(loginData.token).toMatch(/^doc_/);
      expect(loginData.displayName).toBe('Dr. Primary Care');

      // Call clinician queue with doctor token
      const queueRes = await fetch(`${baseUrl}/api/clinician/queue`, {
        headers: { Authorization: `Bearer ${loginData.token}` },
      });
      expect(queueRes.status).toBe(200);
      const queueData = await queueRes.json();
      expect(Array.isArray(queueData.queue)).toBe(true);
    });
  });

  /* =========================================================================
     TEST 3: Cross-Patient Isolation — Patient A -> Reset -> Patient B
     ========================================================================= */
  describe('3. Patient Session Isolation & Wipe Guarantee', () => {
    it('guarantees Patient A session -> reset -> Patient B cannot read Patient A data', async () => {
      // Step A: Patient A starts kiosk session
      const startResA = await fetch(`${baseUrl}/api/kiosk/session/start`, { method: 'POST' });
      const { token: tokenA } = await startResA.json();

      // Patient A records consent
      await fetch(`${baseUrl}/api/kiosk/consent`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: 'pt_A_001',
          granted: true,
          method: 'touch_checkbox',
          version: '1.0',
        }),
      });

      // Patient A creates draft ClinicalCase
      const caseA: ClinicalCase = {
        id: 'case_ptA_test',
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
          scopes: {
            historyCollection: true,
            voiceRecording: false,
            documentProcessing: true,
            cloudAI: true,
            interoperabilityFHIR: true,
          },
        },
        patient: {
          tempId: 'pt_A_001',
          name: createClinicalFact('name', 'Patient Alice Sensitive Data', 'PATIENT_REPORTED', 'touch'),
          age: createClinicalFact('age', 48, 'PATIENT_REPORTED', 'touch'),
          sex: createClinicalFact('sex', 'Female', 'PATIENT_REPORTED', 'touch'),
        },
        intake: {
          chiefComplaint: createClinicalFact('chiefComplaint', 'Confidential Medical Issue', 'PATIENT_REPORTED', 'touch'),
          symptomOnset: createClinicalFact('symptomOnset', '3 days', 'PATIENT_REPORTED', 'touch'),
          questionResponses: {},
          redFlags: [],
        },
        documents: [],
        auditTrail: [],
      };

      const saveResA = await fetch(`${baseUrl}/api/kiosk/case`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(caseA),
      });
      expect(saveResA.status).toBe(200);

      // Verify Patient A can read their own case
      const readResA = await fetch(`${baseUrl}/api/kiosk/case`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      expect(readResA.status).toBe(200);
      const readDataA = await readResA.json();
      expect(readDataA.case.patient.name.value).toBe('Patient Alice Sensitive Data');

      // Step B: Kiosk Session Reset (Patient A finishes or walks away)
      const resetResA = await fetch(`${baseUrl}/api/kiosk/session/reset`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      expect(resetResA.status).toBe(200);

      // Step C: Patient B arrives at the same kiosk terminal and starts new session
      const startResB = await fetch(`${baseUrl}/api/kiosk/session/start`, { method: 'POST' });
      const { token: tokenB } = await startResB.json();
      expect(tokenB).not.toBe(tokenA);

      // 1. Patient B attempts to get active case on the new session -> must be 404 (No active case)
      const readResB = await fetch(`${baseUrl}/api/kiosk/case`, {
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      expect(readResB.status).toBe(404);

      // 2. Attempt to use old token A -> must be 401 Unauthorized (invalidated session)
      const reuseTokenARes = await fetch(`${baseUrl}/api/kiosk/case`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      expect(reuseTokenARes.status).toBe(401);

      // 3. Patient B cannot hijack or mutate Patient A's case
      const hijackRes = await fetch(`${baseUrl}/api/kiosk/case`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenB}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: 'case_ptA_test', // trying to overwrite Alice's case
          status: 'intake_draft',
          patient: { tempId: 'pt_B_002', name: createClinicalFact('name', 'Bob', 'PATIENT_REPORTED', 'touch') },
        }),
      });
      // Should succeed only in binding to Bob or creating fresh, but let's confirm DB persistence for Alice is secure
      const db = getDatabase();
      const aliceInDb = getClinicalCase(db, 'case_ptA_test');
      expect(aliceInDb).not.toBeNull();
      // Alice's data was saved in SQLite
      expect(aliceInDb?.patient.name.value).toBe('Patient Alice Sensitive Data');
    });
  });

  /* =========================================================================
     TEST 4: Minimal Audit Trail Verification
     ========================================================================= */
  describe('4. Minimal Audit Trail Logging', () => {
    it('records critical clinical and security events in SQLite', async () => {
      const db = getDatabase();
      const events = getAuditEvents(db);

      // Should have recorded session creation and reset events
      const actionTypes = events.map((e) => e.action);
      expect(actionTypes).toContain('SESSION_CREATED');
      expect(actionTypes).toContain('SESSION_RESET');
      expect(actionTypes).toContain('CONSENT_RECORDED');
    });
  });
});
