/**
 * MedScribeAI — Phase 10: Tier 2 Documentation Confidence, ICD-10 & Analytics Test Suite
 *
 * Verifies:
 * 1. Case documentation completeness & confidence scoring (overall score, section breakdown, missing items).
 * 2. Deterministic ICD-10 primary care diagnostic code suggestions.
 * 3. Strict enforcement that CPT coding stays off / disabled with SIH disclaimer.
 * 4. Immutable audit log retrieval (GET /api/clinician/audit-logs).
 * 5. Clinic-wide operational analytics (GET /api/clinician/analytics).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import http from 'http';
import { getDatabase, closeDatabase, saveClinicalCase, recordAuditEvent } from '../../server/db/database';
import { createClinicianRouter } from '../../server/routes/clinicianRoutes';
import { ClinicalCase } from '../types/clinicalCase';
import { calculateCaseConfidence, suggestICD10ForCase } from '../utils/tier2Documentation';

describe('Phase 10: Tier 2 Documentation Confidence, ICD-10 & Analytics', () => {
  let app: express.Express;
  let server: http.Server;
  let baseUrl: string;
  let clinicianToken: string;

  beforeAll(async () => {
    process.env.MEDSCRIBE_DB_PATH = ':memory:';
    process.env.CLINICIAN_USER = 'dr_phase10';
    process.env.CLINICIAN_PASS = 'pass_phase10';

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
        username: 'dr_phase10',
        password: 'pass_phase10',
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

  const completeCase: ClinicalCase = {
    id: 'case_p10_complete',
    status: 'doctor_reviewing',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    language: 'hi',
    consent: {
      granted: true,
      timestamp: new Date().toISOString(),
      language: 'hi',
      method: 'touch_checkbox',
      version: '1.0',
      scopes: {
        historyCollection: true,
        voiceRecording: true,
        documentProcessing: true,
        cloudAI: false,
        interoperabilityFHIR: true,
      },
    },
    patient: {
      tempId: 'pt_p10_01',
      name: { field: 'name', value: 'Rajesh Sharma', provenance: { source: 'PATIENT_REPORTED', method: 'touch', timestamp: new Date().toISOString(), verificationState: 'patient_confirmed' } },
      age: { field: 'age', value: 49, provenance: { source: 'PATIENT_REPORTED', method: 'touch', timestamp: new Date().toISOString(), verificationState: 'patient_confirmed' } },
      sex: { field: 'sex', value: 'Male', provenance: { source: 'PATIENT_REPORTED', method: 'touch', timestamp: new Date().toISOString(), verificationState: 'patient_confirmed' } },
    },
    intake: {
      chiefComplaint: { field: 'chiefComplaint', value: 'High grade fever with severe body aches and chills', provenance: { source: 'PATIENT_REPORTED', method: 'touch', timestamp: new Date().toISOString(), verificationState: 'patient_confirmed' } },
      symptomOnset: { field: 'symptomOnset', value: '4 days', provenance: { source: 'PATIENT_REPORTED', method: 'touch', timestamp: new Date().toISOString(), verificationState: 'patient_confirmed' } },
      pastMedicalHistory: { field: 'pastMedicalHistory', value: 'Type 2 Diabetes', provenance: { source: 'PATIENT_REPORTED', method: 'touch', timestamp: new Date().toISOString(), verificationState: 'patient_confirmed' } },
      currentMedications: { field: 'currentMedications', value: ['Metformin 500mg BD'], provenance: { source: 'PATIENT_REPORTED', method: 'touch', timestamp: new Date().toISOString(), verificationState: 'patient_confirmed' } },
      allergies: { field: 'allergies', value: ['NKDA'], provenance: { source: 'PATIENT_REPORTED', method: 'touch', timestamp: new Date().toISOString(), verificationState: 'patient_confirmed' } },
      questionResponses: {},
      redFlags: [],
    },
    documents: [
      {
        id: 'doc_p10_01',
        documentType: 'lab_report',
        fileName: 'cbc_report.pdf',
        uploadedAt: new Date().toISOString(),
      },
    ],
    auditTrail: [],
  };

  const partialCase: ClinicalCase = {
    id: 'case_p10_partial',
    status: 'intake_draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    language: 'mr',
    consent: {
      granted: true,
      timestamp: new Date().toISOString(),
      language: 'mr',
      method: 'touch_checkbox',
      version: '1.0',
      scopes: {
        historyCollection: true,
        voiceRecording: false,
        documentProcessing: false,
        cloudAI: false,
        interoperabilityFHIR: true,
      },
    },
    patient: {
      tempId: 'pt_p10_02',
      name: { field: 'name', value: 'Anonymous Patient', provenance: { source: 'PATIENT_REPORTED', method: 'touch', timestamp: new Date().toISOString(), verificationState: 'unverified' } },
      age: { field: 'age', value: 0, provenance: { source: 'PATIENT_REPORTED', method: 'touch', timestamp: new Date().toISOString(), verificationState: 'unverified' } },
      sex: { field: 'sex', value: 'Other', provenance: { source: 'PATIENT_REPORTED', method: 'touch', timestamp: new Date().toISOString(), verificationState: 'unverified' } },
    },
    intake: {
      chiefComplaint: { field: 'chiefComplaint', value: 'Mild headache', provenance: { source: 'PATIENT_REPORTED', method: 'touch', timestamp: new Date().toISOString(), verificationState: 'unverified' } },
      symptomOnset: { field: 'symptomOnset', value: 'Not documented', provenance: { source: 'PATIENT_REPORTED', method: 'touch', timestamp: new Date().toISOString(), verificationState: 'unverified' } },
      questionResponses: {},
      redFlags: [],
    },
    documents: [],
    auditTrail: [],
  };

  describe('1. Documentation Completeness & Confidence Engine', () => {
    it('scores high confidence for thoroughly documented case', () => {
      const report = calculateCaseConfidence(completeCase);
      expect(report.overallScore).toBeGreaterThanOrEqual(80);
      expect(report.rating).toBe('HIGH');
      expect(report.sections.demographics.status).toBe('COMPLETE');
      expect(report.sections.intakeComplaint.status).toBe('COMPLETE');
      expect(report.missingInformationSummary.length).toBe(0);
    });

    it('identifies missing clinical fields in partial case', () => {
      const report = calculateCaseConfidence(partialCase);
      expect(report.overallScore).toBeLessThan(60);
      expect(report.rating).not.toBe('HIGH');
      expect(report.missingInformationSummary).toContain('Patient legal / official name');
      expect(report.missingInformationSummary).toContain('Symptom onset duration');
    });

    it('GET /api/clinician/cases/:id/confidence serves report over HTTP', async () => {
      const db = getDatabase(':memory:');
      saveClinicalCase(db, completeCase);

      const res = await fetch(`${baseUrl}/api/clinician/cases/${completeCase.id}/confidence`, {
        headers: { Authorization: `Bearer ${clinicianToken}` },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.caseId).toBe(completeCase.id);
      expect(data.confidenceReport.overallScore).toBeGreaterThanOrEqual(80);
      expect(data.confidenceReport.rating).toBe('HIGH');
    });
  });

  describe('2. ICD-10 Suggestions & CPT Disabled Policy', () => {
    it('suggests relevant primary care codes for febrile illness and diabetes comorbidity', () => {
      const suggestions = suggestICD10ForCase(completeCase);

      expect(suggestions.primaryCode.code).toBe('R50.9'); // Fever unspecified
      expect(suggestions.differentialCodes.some((c) => c.code === 'A90')).toBe(true); // Dengue
      expect(suggestions.differentialCodes.some((c) => c.code === 'B54')).toBe(true); // Malaria
      expect(suggestions.differentialCodes.some((c) => c.code === 'E11.9')).toBe(true); // Type 2 DM comorbidity
    });

    it('strictly turns off CPT billing with Indian Primary Care disclaimer', () => {
      const suggestions = suggestICD10ForCase(completeCase);

      expect(suggestions.cptBilling.enabled).toBe(false);
      expect(suggestions.cptBilling.disclaimer).toBe(
        'CPT Coding Disabled (Indian Primary Care Context / SIH Spec)'
      );
    });

    it('GET /api/clinician/cases/:id/icd10-suggestions returns suggestions over HTTP', async () => {
      const res = await fetch(`${baseUrl}/api/clinician/cases/${completeCase.id}/icd10-suggestions`, {
        headers: { Authorization: `Bearer ${clinicianToken}` },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.suggestions.primaryCode.code).toBe('R50.9');
      expect(data.suggestions.cptBilling.enabled).toBe(false);
    });
  });

  describe('3. Audit Logs Viewer Endpoint', () => {
    it('GET /api/clinician/audit-logs returns recorded audit trail events', async () => {
      const db = getDatabase(':memory:');
      recordAuditEvent(db, {
        caseId: completeCase.id,
        actorType: 'clinician',
        actorId: 'dr_phase10',
        action: 'CASE_INSPECTED',
        details: { caseId: completeCase.id },
      });

      const res = await fetch(`${baseUrl}/api/clinician/audit-logs?caseId=${completeCase.id}`, {
        headers: { Authorization: `Bearer ${clinicianToken}` },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.count).toBeGreaterThanOrEqual(1);
      expect(data.logs.some((l: any) => l.action === 'CASE_INSPECTED')).toBe(true);
    });
  });

  describe('4. Clinic-Wide Analytics Aggregator', () => {
    it('GET /api/clinician/analytics computes case counts, languages, and confidence averages', async () => {
      const db = getDatabase(':memory:');
      saveClinicalCase(db, completeCase);
      saveClinicalCase(db, partialCase);

      const res = await fetch(`${baseUrl}/api/clinician/analytics`, {
        headers: { Authorization: `Bearer ${clinicianToken}` },
      });

      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.totalCases).toBeGreaterThanOrEqual(2);
      expect(data.languageDistribution.hi).toBeGreaterThanOrEqual(1);
      expect(data.languageDistribution.mr).toBeGreaterThanOrEqual(1);
      expect(data.averageDocumentationConfidence).toBeGreaterThan(0);
      expect(data.averageDocumentationConfidence).toBeLessThanOrEqual(100);
    });
  });
});
