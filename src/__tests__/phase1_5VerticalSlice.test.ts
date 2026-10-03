// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { app } from '../../server';
import { getDatabase, closeDatabase, resetDatabaseForTesting } from '../../server/db/database';
import { ClinicalCase, createClinicalFact } from '../types/clinicalCase';

describe('Phase 1.5 Vertical Slice — Chest Pain (End-to-End)', () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    closeDatabase();
    process.env.MEDSCRIBE_DB_PATH = ':memory:';
    process.env.CLINICIAN_USER = 'doctor';
    process.env.CLINICIAN_PASS = 'medscribe2026';

    const db = getDatabase(':memory:');
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
    closeDatabase();
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('completes the full synthetic patient journey: kiosk intake -> red flag -> prescription -> SOAP -> safety -> approval -> FHIR export', async () => {
    // -----------------------------------------------------------------------
    // STEP 1: KIOSK START & CONSENT
    // -----------------------------------------------------------------------
    const sessionRes = await fetch(`${baseUrl}/api/kiosk/session/start`, { method: 'POST' });
    expect(sessionRes.status).toBe(201);
    const { token: kioskToken } = await sessionRes.json();
    expect(kioskToken).toMatch(/^kiosk_/);

    const consentRes = await fetch(`${baseUrl}/api/kiosk/consent`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${kioskToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        patientId: 'pt_synth_rajesh_52',
        granted: true,
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
      }),
    });
    expect(consentRes.status).toBe(201);

    // -----------------------------------------------------------------------
    // STEP 2: LOAD SYNTHETIC PRESCRIPTION FIXTURE
    // -----------------------------------------------------------------------
    const fixturePath = path.join(process.cwd(), 'fixtures', 'prescriptions', 'synthetic_prescription_chest_pain.json');
    expect(fs.existsSync(fixturePath)).toBe(true);
    const prescriptionFixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

    // -----------------------------------------------------------------------
    // STEP 3: ASSEMBLE CHEST-PAIN INTAKE CASE & SAVE TO KIOSK
    // -----------------------------------------------------------------------
    const caseId = `case_slice_${Date.now()}`;
    const clinicalCasePayload: ClinicalCase = {
      id: caseId,
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
        tempId: 'pt_synth_rajesh_52',
        name: createClinicalFact('name', 'Rajesh Sharma', 'PATIENT_REPORTED', 'touch'),
        age: createClinicalFact('age', 52, 'PATIENT_REPORTED', 'touch'),
        sex: createClinicalFact('sex', 'Male', 'PATIENT_REPORTED', 'touch'),
      },
      intake: {
        chiefComplaint: createClinicalFact('chiefComplaint', 'Crushing chest pain radiating to left arm', 'PATIENT_REPORTED', 'touch'),
        symptomOnset: createClinicalFact('symptomOnset', '2 hours ago', 'PATIENT_REPORTED', 'touch'),
        questionResponses: {
          breathlessness: createClinicalFact('breathlessness', true, 'PATIENT_REPORTED', 'touch'),
          sweating: createClinicalFact('sweating', true, 'PATIENT_REPORTED', 'touch'),
          radiation: createClinicalFact('radiation', 'Left arm and shoulder', 'PATIENT_REPORTED', 'touch'),
          pastHistory: createClinicalFact('pastHistory', 'Hypertension for 5 years', 'PATIENT_REPORTED', 'touch'),
        },
        redFlags: [],
        pastMedicalHistory: createClinicalFact('pastMedicalHistory', 'Hypertension, Dyslipidemia', 'PATIENT_REPORTED', 'touch'),
        currentMedications: createClinicalFact('currentMedications', ['Atorvastatin 20mg', 'Aspirin 75mg'], 'DOCUMENT_EXTRACTED', 'ocr'),
        allergies: createClinicalFact('allergies', ['NKDA'], 'PATIENT_REPORTED', 'touch'),
      },
      documents: [
        {
          id: 'doc_synth_rx_01',
          documentType: 'prescription',
          fileName: 'synthetic_prescription_chest_pain.svg',
          uploadedAt: new Date().toISOString(),
          extractedPrescriptions: prescriptionFixture.extractedMedications,
        },
      ],
      auditTrail: [],
    };

    const saveCaseRes = await fetch(`${baseUrl}/api/kiosk/case`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${kioskToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(clinicalCasePayload),
    });
    expect(saveCaseRes.status).toBe(200);
    const saveCaseData = await saveCaseRes.json();
    expect(saveCaseData.success).toBe(true);

    // -----------------------------------------------------------------------
    // STEP 4: VERIFY DETERMINISTIC RED FLAG TRIGGERED
    // -----------------------------------------------------------------------
    expect(saveCaseData.redFlagsCount).toBeGreaterThanOrEqual(1);

    const checkCaseRes = await fetch(`${baseUrl}/api/kiosk/case`, {
      headers: { Authorization: `Bearer ${kioskToken}` },
    });
    const { case: savedCase } = await checkCaseRes.json();
    expect(savedCase.intake.redFlags.length).toBeGreaterThanOrEqual(1);
    expect(savedCase.intake.redFlags[0].ruleId).toBe('RF-CARD-001');
    expect(savedCase.intake.redFlags[0].severity).toBe('EMERGENCY');

    // -----------------------------------------------------------------------
    // STEP 5: PATIENT CONFIRMS & SUBMITS CASE
    // -----------------------------------------------------------------------
    const confirmRes = await fetch(`${baseUrl}/api/kiosk/case/confirm`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${kioskToken}` },
    });
    expect(confirmRes.status).toBe(200);

    // -----------------------------------------------------------------------
    // STEP 6: KIOSK SESSION WIPED
    // -----------------------------------------------------------------------
    const resetRes = await fetch(`${baseUrl}/api/kiosk/session/reset`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${kioskToken}` },
    });
    expect(resetRes.status).toBe(200);

    // Verify kiosk token is invalidated
    const verifyWipeRes = await fetch(`${baseUrl}/api/kiosk/case`, {
      headers: { Authorization: `Bearer ${kioskToken}` },
    });
    expect(verifyWipeRes.status).toBe(401);

    // -----------------------------------------------------------------------
    // STEP 7: CLINICIAN LOGIN & QUEUE VIEW
    // -----------------------------------------------------------------------
    const loginRes = await fetch(`${baseUrl}/api/clinician/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'doctor', password: 'medscribe2026' }),
    });
    expect(loginRes.status).toBe(200);
    const { token: doctorToken } = await loginRes.json();

    const queueRes = await fetch(`${baseUrl}/api/clinician/queue`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    expect(queueRes.status).toBe(200);
    const queueData = await queueRes.json();
    const queuedPatient = queueData.queue.find((q: any) => q.id === caseId);
    expect(queuedPatient).toBeDefined();
    expect(queuedPatient.patientName).toBe('Rajesh Sharma');
    expect(queuedPatient.hasRedFlags).toBe(true);

    // -----------------------------------------------------------------------
    // STEP 8: SOAP NOTE GENERATION & DETERMINISTIC SAFETY ENGINE
    // -----------------------------------------------------------------------
    const soapRes = await fetch(`${baseUrl}/api/clinician/cases/${caseId}/generate-soap`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${doctorToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    expect(soapRes.status).toBe(200);
    const soapData = await soapRes.json();
    expect(soapData.soapNote).toBeDefined();
    expect(soapData.soapNote.subjective.chief_complaint.toLowerCase()).toContain('chest');
    expect(soapData.soapNote.plan.prescriptions.length).toBeGreaterThan(0);
    expect(Array.isArray(soapData.safetyAlerts)).toBe(true);

    // -----------------------------------------------------------------------
    // STEP 9: CLINICIAN APPROVAL GATE
    // -----------------------------------------------------------------------
    const approveRes = await fetch(`${baseUrl}/api/clinician/cases/${caseId}/approve`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${doctorToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        approvedBy: 'Dr. Primary Care, MBBS',
        clinicianNotes: 'Emergency 12-lead ECG ordered. Confirmed chronic Atorvastatin and Aspirin.',
      }),
    });
    expect(approveRes.status).toBe(200);
    const approveData = await approveRes.json();
    expect(approveData.status).toBe('clinician_approved');

    // -----------------------------------------------------------------------
    // STEP 10: HL7 FHIR R4 EXPORT
    // -----------------------------------------------------------------------
    const fhirRes = await fetch(`${baseUrl}/api/clinician/cases/${caseId}/fhir`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    expect(fhirRes.status).toBe(200);
    const { bundle } = await fhirRes.json();

    expect(bundle.resourceType).toBe('Bundle');
    expect(bundle.type).toBe('collection');

    const resourceTypes = bundle.entry.map((e: any) => e.resource.resourceType);
    expect(resourceTypes).toContain('Patient');
    expect(resourceTypes).toContain('Encounter');
    expect(resourceTypes).toContain('Composition');

    // Confirm provenance metadata is preserved in FHIR extension
    const patientResource = bundle.entry.find((e: any) => e.resource.resourceType === 'Patient');
    expect(patientResource.resource.extension).toBeDefined();
    expect(patientResource.resource.extension.some((ext: any) => ext.url.includes('provenance'))).toBe(true);

    // Record FHIR export event
    const exportEventRes = await fetch(`${baseUrl}/api/clinician/cases/${caseId}/fhir-export`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    expect(exportEventRes.status).toBe(200);
  });
});
