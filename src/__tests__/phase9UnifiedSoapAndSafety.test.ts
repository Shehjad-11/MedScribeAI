/**
 * MedScribeAI — Phase 9: Unified SOAP, Safety Engine & Mock ABDM Test Suite
 *
 * Verifies:
 * 1. SOAP synthesis combining ClinicalCase intake facts, documents, and doctor transcript.
 * 2. Deterministic safety engine evaluating structured medications against curated rules.
 * 3. Extended FHIR R4 export with first-class Provenance resource.
 * 4. Mock ABDM health data push with MOCK labeling and synthetic disclaimer.
 * 5. Clinician approval gate storing original AI output, edited output, reviewer, and timestamp.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import http from 'http';
import { getDatabase, closeDatabase, saveClinicalCase, getClinicalCase } from '../../server/db/database';
import { createClinicianRouter } from '../../server/routes/clinicianRoutes';
import { ClinicalCase } from '../types/clinicalCase';
import { exportClinicalCaseToFHIR } from '../utils/fhirConverter';
import { checkDrugInteractions } from '../utils/drugInteractionChecker';
import { ABDM_MOCK_DISCLAIMER } from '../../server/services/abdm/mockAbdmAdapter';

describe('Phase 9: Unified SOAP, Safety Engine & Mock ABDM', () => {
  let app: express.Express;
  let server: http.Server;
  let baseUrl: string;
  let clinicianToken: string;

  beforeAll(async () => {
    process.env.MEDSCRIBE_DB_PATH = ':memory:';
    process.env.CLINICIAN_USER = 'dr_phase9';
    process.env.CLINICIAN_PASS = 'pass_phase9';

    const db = getDatabase(':memory:');

    app = express();
    app.use(express.json());
    app.use('/api/clinician', createClinicianRouter(() => db));

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address() as any;
        baseUrl = `http://localhost:${addr.port}`;
        resolve();
      });
    });

    // Obtain clinician session token
    const loginRes = await fetch(`${baseUrl}/api/clinician/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'dr_phase9',
        password: 'pass_phase9',
      }),
    });
    const loginData = await loginRes.json();
    clinicianToken = loginData.token;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
    closeDatabase();
  });

  const testCase: ClinicalCase = {
    id: 'case_phase9_001',
    status: 'doctor_reviewing',
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
        cloudAI: false,
        interoperabilityFHIR: true,
      },
    },
    patient: {
      tempId: 'pt_p9_01',
      name: { field: 'name', value: 'Harish Mehta', provenance: { source: 'PATIENT_REPORTED', method: 'touch', timestamp: new Date().toISOString(), verificationState: 'patient_confirmed' } },
      age: { field: 'age', value: 54, provenance: { source: 'PATIENT_REPORTED', method: 'touch', timestamp: new Date().toISOString(), verificationState: 'patient_confirmed' } },
      sex: { field: 'sex', value: 'Male', provenance: { source: 'PATIENT_REPORTED', method: 'touch', timestamp: new Date().toISOString(), verificationState: 'patient_confirmed' } },
    },
    intake: {
      chiefComplaint: { field: 'chiefComplaint', value: 'Acute retrosternal chest pain with diaphoresis', provenance: { source: 'PATIENT_REPORTED', method: 'touch', timestamp: new Date().toISOString(), verificationState: 'patient_confirmed' } },
      symptomOnset: { field: 'symptomOnset', value: '2 hours ago', provenance: { source: 'PATIENT_REPORTED', method: 'touch', timestamp: new Date().toISOString(), verificationState: 'patient_confirmed' } },
      pastMedicalHistory: { field: 'pastMedicalHistory', value: 'Essential Hypertension, Dyslipidemia', provenance: { source: 'PATIENT_REPORTED', method: 'touch', timestamp: new Date().toISOString(), verificationState: 'patient_confirmed' } },
      currentMedications: { field: 'currentMedications', value: ['Amlodipine 5mg', 'Atorvastatin 20mg'], provenance: { source: 'PATIENT_REPORTED', method: 'touch', timestamp: new Date().toISOString(), verificationState: 'patient_confirmed' } },
      allergies: { field: 'allergies', value: ['NKDA'], provenance: { source: 'PATIENT_REPORTED', method: 'touch', timestamp: new Date().toISOString(), verificationState: 'patient_confirmed' } },
      questionResponses: {},
      redFlags: [
        {
          id: 'rf_01',
          ruleId: 'RF-CARD-001',
          ruleVersion: '1.0.0',
          severity: 'EMERGENCY',
          title: 'Acute Coronary Syndrome Risk Indicator',
          description: 'Retrosternal chest pain radiating to arm. Stat ECG indicated.',
          actionRequired: 'Stat ECG',
          triggeredAt: new Date().toISOString(),
          acknowledgedByClinician: false,
        },
      ],
      ayushAssessment: {
        prakriti: { field: 'prakriti', value: 'Pitta Dominant Prakriti [PENDING BAMS REVIEW]', category: 'ayush', provenance: { source: 'PATIENT_REPORTED', method: 'touch', timestamp: new Date().toISOString(), verificationState: 'patient_confirmed' } },
        agni: { field: 'agni', value: 'Tikshna Agni (Intense/Pitta Type) [PENDING BAMS REVIEW]', category: 'ayush', provenance: { source: 'PATIENT_REPORTED', method: 'touch', timestamp: new Date().toISOString(), verificationState: 'patient_confirmed' } },
      },
    },
    documents: [
      {
        id: 'doc_rx_01',
        documentType: 'prescription',
        fileName: 'prior_prescription_amlodipine.pdf',
        uploadedAt: new Date().toISOString(),
        extractedPrescriptions: [
          {
            medication: 'Amlodipine',
            dosage: '5mg',
            frequency: 'OD',
            duration: '30 days',
            provenance: { source: 'DOCUMENT_EXTRACTED', method: 'ocr', timestamp: new Date().toISOString(), verificationState: 'unverified' },
          },
        ],
      },
    ],
    auditTrail: [],
  };

  describe('1. Unified SOAP Synthesis from ClinicalCase + Transcript', () => {
    it('synthesizes consultation transcript and clinical case into structured SOAP note', async () => {
      const db = getDatabase(':memory:');
      saveClinicalCase(db, testCase);

      const res = await fetch(`${baseUrl}/api/clinician/cases/${testCase.id}/generate-soap`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${clinicianToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: `Doctor: Good day Mr. Mehta. Tell me about the chest pain.
Patient: It started suddenly 2 hours ago while sitting. A heavy squeezing pressure in the center of my chest.
Doctor: I see from your kiosk record you take Amlodipine and Atorvastatin. Let us perform an immediate ECG and start sublingual nitrates.`,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.soapNote).toBeDefined();
      expect(data.soapNote.subjective.chief_complaint).toContain('chest pain');
      expect(data.soapNote.plan.prescriptions.length).toBeGreaterThan(0);
      expect(data.caseId).toBe(testCase.id);
    });
  });

  describe('2. Deterministic Safety Engine & Dataset Scope Disclosure', () => {
    it('evaluates prescribed medications against curated primary care interaction rules', () => {
      // Test duplicate Amlodipine detection
      const alerts = checkDrugInteractions(
        [
          { medication: 'Amlodipine', dosage: '5mg', frequency: 'OD', duration: '30 days', instructions: 'Morning' },
          { medication: 'Amlodipine', dosage: '5mg', frequency: 'OD', duration: '30 days', instructions: 'Morning' },
        ],
        'Amlodipine 5mg',
        'Hypertension',
        'NKDA'
      );

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.some((a) => a.message.includes('DUPLICATE PRESCRIPTION DETECTED'))).toBe(true);
    });

    it('flags uncurated medications to prevent false sense of safety', () => {
      const alerts = checkDrugInteractions(
        [
          { medication: 'ExperimentalInvestigationalCompoundX', dosage: '10mg', frequency: 'OD', duration: '7 days', instructions: 'Trial' },
        ],
        'None',
        'None',
        'NKDA'
      );

      expect(alerts.some((a) => a.message.includes('Unchecked Medication'))).toBe(true);
    });
  });

  describe('3. Extended FHIR R4 Bundle with Provenance', () => {
    it('includes first-class FHIR Provenance resource linking patient and verifier', () => {
      const bundle = exportClinicalCaseToFHIR(testCase);

      expect(bundle.resourceType).toBe('Bundle');
      expect(bundle.type).toBe('collection');

      const provenanceEntry = bundle.entry.find((e) => e.resource.resourceType === 'Provenance');
      expect(provenanceEntry).toBeDefined();
      expect(provenanceEntry?.resource.target[0].reference).toContain('Patient/');
      expect(provenanceEntry?.resource.agent[0].type.coding[0].code).toBe('author');
    });
  });

  describe('4. Mock ABDM Health Data Push Adapter', () => {
    it('POST /api/clinician/cases/:id/abdm-push returns mock transaction ID and explicit disclaimer', async () => {
      const res = await fetch(`${baseUrl}/api/clinician/cases/${testCase.id}/abdm-push`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${clinicianToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          abhaId: '91-5544-3322-1100',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(data.isMock).toBe(true);
      expect(data.disclaimer).toBe(ABDM_MOCK_DISCLAIMER);
      expect(data.linkResult.careContext.careContextReference).toContain('CC_case_phase9_001');
      expect(data.pushResult.transactionId).toMatch(/^push_txn_/);
      expect(data.pushResult.status).toBe('DELIVERED_TO_MOCK_GATEWAY');
    });
  });

  describe('5. Clinician Approval Gate', () => {
    it('stores original AI output, edited output, reviewer, and timestamp in SQLite', async () => {
      const originalAiOutput = {
        summary: 'AI suggested Acute Coronary Syndrome workup',
        assessment: 'Rule-based ACS priority triage',
      };
      const editedOutput = 'Dr. Clinician verified: Immediate Stat 12-lead ECG completed. Normal sinus rhythm with ST elevation in V1-V3. Transfer to cardiology arranged.';
      const reviewer = 'Dr. Aarti Sharma, MD (Cardiology)';

      const approveRes = await fetch(`${baseUrl}/api/clinician/cases/${testCase.id}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${clinicianToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalAiOutput,
          editedOutput,
          clinicianNotes: editedOutput,
          approvedBy: reviewer,
        }),
      });

      expect(approveRes.status).toBe(200);
      const data = await approveRes.json();
      expect(data.success).toBe(true);
      expect(data.status).toBe('clinician_approved');
      expect(data.reviewer).toBe(reviewer);
      expect(data.originalAiOutput).toEqual(originalAiOutput);
      expect(data.editedOutput).toBe(editedOutput);
      expect(data.approvedAt).toBeTruthy();

      // Verify persistence in SQLite
      const db = getDatabase(':memory:');
      const retrieved = getClinicalCase(db, testCase.id);
      expect(retrieved?.status).toBe('clinician_approved');
      expect(retrieved?.consultation?.approvedBy).toBe(reviewer);
      expect((retrieved?.consultation as any)?.originalAiOutput).toEqual(originalAiOutput);
      expect((retrieved?.consultation as any)?.editedOutput).toBe(editedOutput);
    });
  });
});
