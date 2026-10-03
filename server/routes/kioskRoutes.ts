import path from 'node:path';
import { Router } from 'express';
import Database from 'better-sqlite3';
import {
  AuthenticatedRequest,
  startKioskSession,
  resetKioskSession,
  createRequireKioskAuth,
} from '../security/auth';
import {
  recordConsent,
  upsertPatient,
  saveClinicalCase,
  getClinicalCase,
  updateSessionCase,
  recordAuditEvent,
  saveDocumentRecord,
} from '../db/database';
import { validateUploadBuffer, createSecureTempFile } from '../security/fileUploadSecurity';
import { encryptPayload } from '../security/encryption';

import { ClinicalCase } from '../../src/types/clinicalCase';
import { TEN_COMPLAINTS } from '../../src/data/complaintsCatalog';
import {
  PRAKRITI_QUESTIONS,
  AGNI_QUESTIONS,
  evaluateAyushAssessment,
  buildAyushClinicalFacts,
  AYUSH_REVIEW_STATUS,
  AYUSH_DISCLAIMER,
} from '../../src/data/ayush/prakritiAgniRules';

export function createKioskRouter(getDb: () => Database.Database): Router {
  const router = Router();
  const requireKiosk = createRequireKioskAuth(getDb);

  // 0. Mock ABHA Verification Adapter (Demo Mode Only - No Real ABDM)
  router.post('/abha/verify', (req, res) => {
    try {
      const { abhaId } = req.body;
      if (!abhaId || typeof abhaId !== 'string') {
        return res.status(400).json({ error: 'ABHA ID / PHR address is required' });
      }

      const cleanId = abhaId.trim();
      const isDigits = cleanId.replace(/[-\s]/g, '').match(/^\d{14}$/);
      const isPhr = cleanId.includes('@');

      if (!isDigits && !isPhr) {
        return res.status(422).json({
          verified: false,
          error: 'Invalid ABHA format. Expected 14-digit ABHA number (e.g. 91-1234-5678-9012) or ABHA address (e.g. patient@abdm)',
        });
      }

      // Generate realistic synthetic profile
      const syntheticProfile = {
        abhaNumber: isDigits ? cleanId : '91-5544-3322-1100',
        abhaAddress: isPhr ? cleanId : 'patient.demo@abdm',
        name: isPhr && cleanId.toLowerCase().startsWith('rahul') ? 'Rahul Sharma' : 'Ramesh Kumar Patil',
        gender: 'M',
        dob: '1974-06-15',
        age: 52,
        mobile: 'XXXXXX9821',
        address: 'Wagholi, Pune, Maharashtra',
        state: 'Maharashtra',
        district: 'Pune',
      };

      res.json({
        verified: true,
        isMock: true,
        disclaimer: 'MOCK ABHA ADAPTER — SYNTHETIC DATA ONLY (NO REAL ABDM/NHA CONNECTION)',
        profile: syntheticProfile,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Mock ABHA verification failed', details: err.message });
    }
  });

  // Kiosk Configuration & Local-Only Mode Status
  router.get('/config', (_req, res) => {
    const isLocalOnly = process.env.LOCAL_ONLY_MODE === 'true';
    res.json({
      localOnlyMode: isLocalOnly,
      supportedLanguages: ['en', 'hi', 'mr', 'es'],
      cloudAiAvailable: !isLocalOnly && !!process.env.GEMINI_API_KEY,
      offlineEngineAvailable: true,
      complaintTemplatesCount: TEN_COMPLAINTS.length,
    });
  });

  // Ten Complaints Stubs Endpoint
  router.get('/complaints', (_req, res) => {
    res.json({
      complaints: TEN_COMPLAINTS,
    });
  });

  // AYUSH Questions Endpoint (Thin Slice: Prakriti & Agni)
  router.get('/ayush/questions', (_req, res) => {
    res.json({
      reviewStatus: AYUSH_REVIEW_STATUS,
      disclaimer: AYUSH_DISCLAIMER,
      prakriti: PRAKRITI_QUESTIONS,
      agni: AGNI_QUESTIONS,
    });
  });

  // AYUSH Deterministic Evaluation Endpoint
  router.post('/ayush/evaluate', (req, res) => {
    try {
      const responses = req.body.responses || {};
      const scoreResult = evaluateAyushAssessment(responses);
      res.json(scoreResult);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to evaluate AYUSH assessment', details: err.message });
    }
  });

  // Save AYUSH Assessment onto Active Clinical Case
  router.post('/ayush/save', requireKiosk, (req: AuthenticatedRequest, res) => {
    try {
      const db = getDb();
      const activeCaseId = req.kioskSession!.active_case_id;
      if (!activeCaseId) {
        return res.status(404).json({ error: 'No active clinical case for this session' });
      }

      const clinicalCase = getClinicalCase(db, activeCaseId);
      if (!clinicalCase) {
        return res.status(404).json({ error: 'Active case not found in database' });
      }

      const responses = req.body.responses || {};
      const scoreResult = evaluateAyushAssessment(responses);
      const ayushAssessment = buildAyushClinicalFacts(scoreResult, true);

      clinicalCase.intake.ayushAssessment = ayushAssessment;
      clinicalCase.updatedAt = new Date().toISOString();

      saveClinicalCase(db, clinicalCase);

      recordAuditEvent(db, {
        caseId: activeCaseId,
        actorType: 'patient',
        actorId: req.kioskSession!.token,
        action: 'AYUSH_ASSESSMENT_RECORDED',
        details: {
          prakriti: scoreResult.prakriti.dominantDosha,
          agni: scoreResult.agni.primaryAgni,
          reviewStatus: AYUSH_REVIEW_STATUS,
        },
      });

      res.json({
        success: true,
        caseId: activeCaseId,
        reviewStatus: AYUSH_REVIEW_STATUS,
        ayushAssessment,
        summary: {
          dominantDosha: scoreResult.prakriti.dominantDosha,
          primaryAgni: scoreResult.agni.primaryAgni,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to save AYUSH assessment', details: err.message });
    }
  });

  // Cloud AI Gating Check (Strictly blocks Cloud AI if local-only is active or patient denied cloudAi consent)
  router.post('/ai-gate-check', requireKiosk, (req: AuthenticatedRequest, res) => {
    const localOnlyEnv = process.env.LOCAL_ONLY_MODE === 'true';
    const clientLocalOnly = req.body.localOnly === true;
    const consentCloudAi = req.body.consentCloudAi !== false;

    if (localOnlyEnv || clientLocalOnly || !consentCloudAi) {
      return res.status(403).json({
        allowed: false,
        reason: localOnlyEnv
          ? 'BLOCKED_BY_SERVER_POLICY: Server running in forced LOCAL_ONLY_MODE'
          : clientLocalOnly
          ? 'BLOCKED_BY_KIOSK_FLAG: Kiosk local-only privacy flag is active'
          : 'BLOCKED_BY_PATIENT_CONSENT: Patient explicitly denied cloud AI consent',
        mode: 'OFFLINE_ONLY',
      });
    }

    res.json({
      allowed: true,
      mode: 'CLOUD_AI_ALLOWED',
    });
  });

  // 1. Start a fresh kiosk session (unauthenticated initial step)
  router.post('/session/start', (req, res) => {
    try {
      const db = getDb();
      const session = startKioskSession(db);
      res.status(201).json(session);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to start kiosk session', details: err.message });
    }
  });

  // 2. Reset the kiosk session (wipes session state from server)
  router.post('/session/reset', requireKiosk, (req: AuthenticatedRequest, res) => {
    try {
      const db = getDb();
      const token = req.kioskSession!.token;
      resetKioskSession(db, token);
      res.json({ success: true, message: 'Kiosk session successfully wiped and reset' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to reset kiosk session', details: err.message });
    }
  });

  // 3. Record patient consent
  router.post('/consent', requireKiosk, (req: AuthenticatedRequest, res) => {
    try {
      const db = getDb();
      const { patientId, granted, scopes, language, method, version } = req.body;

      if (typeof granted !== 'boolean' || !patientId) {
        return res.status(400).json({ error: 'Missing required consent parameters (patientId, granted)' });
      }

      // Ensure patient placeholder exists for foreign key constraint
      upsertPatient(db, {
        id: patientId,
        tempId: patientId,
        demographics: {},
      });

      const consentId = `consent_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const timestamp = new Date().toISOString();

      recordConsent(db, {

        id: consentId,
        patientId,
        granted,
        scopes: scopes || {},
        language: language || 'en',
        method: method || 'touch_checkbox',
        version: version || '1.0',
        timestamp,
      });

      recordAuditEvent(db, {
        caseId: req.kioskSession?.active_case_id || null,
        actorType: 'patient',
        actorId: patientId,
        action: 'CONSENT_RECORDED',
        details: { consentId, granted, version },
      });

      res.status(201).json({ success: true, consentId, granted });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to record consent', details: err.message });
    }
  });

  // 4. Save/Update draft ClinicalCase for THIS session only
  router.post('/case', requireKiosk, (req: AuthenticatedRequest, res) => {
    try {
      const db = getDb();
      const clinicalCase = req.body as ClinicalCase;

      if (!clinicalCase || !clinicalCase.id || !clinicalCase.patient) {
        return res.status(400).json({ error: 'Malformed ClinicalCase payload' });
      }

      // Security boundary: If session already has an active case, verify ID matches
      const activeCaseId = req.kioskSession!.active_case_id;
      if (activeCaseId && activeCaseId !== clinicalCase.id) {
        return res.status(403).json({
          error: 'Forbidden: Kiosk session cannot modify a case outside its session scope',
        });
      }

      // Deterministic Red-Flag Evaluation for Chest Symptoms (Section 12, Phase 1.5)
      const complaintText = (clinicalCase.intake?.chiefComplaint?.value || '').toLowerCase();

      const responses = JSON.stringify(clinicalCase.intake?.questionResponses || {}).toLowerCase();
      const combinedIntake = `${complaintText} ${responses}`;

      const isChestPain = combinedIntake.includes('chest pain') || combinedIntake.includes('pressure');
      const hasBreathlessness = combinedIntake.includes('breathless') || combinedIntake.includes('shortness of breath') || combinedIntake.includes('dyspnea');
      const hasSweating = combinedIntake.includes('sweat') || combinedIntake.includes('diaphoresis') || combinedIntake.includes('perspiration');
      const hasRadiation = combinedIntake.includes('arm') || combinedIntake.includes('jaw') || combinedIntake.includes('radiat');

      if (isChestPain && (hasBreathlessness || hasSweating || hasRadiation)) {
        if (!clinicalCase.intake.redFlags) {
          clinicalCase.intake.redFlags = [];
        }
        if (!clinicalCase.intake.redFlags.some(rf => rf.ruleId === 'RF-CARD-001')) {
          clinicalCase.intake.redFlags.push({
            id: `rf_card_${Date.now()}`,
            ruleId: 'RF-CARD-001',
            severity: 'EMERGENCY',
            title: 'High Priority Acute Chest Symptoms (Triage Warning)',
            description: 'Acute chest pain associated with breathlessness, diaphoresis, or radiation detected. Immediate clinical assessment advised.',
            triggeredAt: new Date().toISOString(),
            actionRequired: 'Stat ECG and emergency physician evaluation',
            acknowledgedByClinician: false,
            triggeringFacts: ['acute chest pain', hasBreathlessness ? 'breathlessness' : '', hasSweating ? 'sweating' : '', hasRadiation ? 'radiation to arm' : ''].filter(Boolean),
          });
        }
      }

      saveClinicalCase(db, clinicalCase);
      updateSessionCase(db, req.kioskSession!.token, clinicalCase.id);

      res.json({
        success: true,
        caseId: clinicalCase.id,
        status: clinicalCase.status,
        redFlagsCount: clinicalCase.intake.redFlags?.length || 0,
      });

    } catch (err: any) {
      res.status(500).json({ error: 'Failed to save clinical case', details: err.message });
    }
  });

  // 5. Get current active case for THIS session only
  router.get('/case', requireKiosk, (req: AuthenticatedRequest, res) => {
    try {
      const db = getDb();
      const caseId = req.kioskSession!.active_case_id;
      if (!caseId) {
        return res.status(404).json({ error: 'No active clinical case for this session' });
      }

      const caseData = getClinicalCase(db, caseId);
      if (!caseData) {
        return res.status(404).json({ error: 'Clinical case not found' });
      }

      res.json({ case: caseData });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve clinical case', details: err.message });
    }
  });

  // 6. Confirm and submit case (patient finalizes intake)
  router.post('/case/confirm', requireKiosk, (req: AuthenticatedRequest, res) => {
    try {
      const db = getDb();
      const caseId = req.kioskSession!.active_case_id;
      if (!caseId) {
        return res.status(400).json({ error: 'No active case associated with this session to confirm' });
      }

      const existingCase = getClinicalCase(db, caseId);
      if (!existingCase) {
        return res.status(404).json({ error: 'Case not found' });
      }

      existingCase.status = 'patient_confirmed';
      existingCase.updatedAt = new Date().toISOString();
      saveClinicalCase(db, existingCase);

      recordAuditEvent(db, {
        caseId,
        actorType: 'patient',
        actorId: req.kioskSession!.token,
        action: 'CASE_SUBMITTED',
        details: { caseId, status: 'patient_confirmed' },
      });

      // Automatically unlink case from kiosk session to prepare for wipe
      updateSessionCase(db, req.kioskSession!.token, null);

      res.json({ success: true, caseId, status: 'patient_confirmed' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to confirm case', details: err.message });
    }
  });

  // 7. Secure Document Upload with Validation & Encryption-at-Rest
  router.post('/documents/upload', requireKiosk, async (req: AuthenticatedRequest, res) => {
    try {
      const db = getDb();
      const activeCaseId = req.kioskSession!.active_case_id;
      if (!activeCaseId) {
        return res.status(400).json({ error: 'No active clinical case for this session' });
      }

      const { fileName, mimeType, fileBase64, documentType, ocrRawText, extractedData } = req.body;
      if (!fileName || !mimeType || !fileBase64) {
        return res.status(400).json({ error: 'Missing required parameters: fileName, mimeType, and fileBase64' });
      }

      const buffer = Buffer.from(fileBase64, 'base64');
      const validation = validateUploadBuffer(buffer, fileName, mimeType);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }

      // Secure temp file handling with automated cleanup
      const tempHandle = await createSecureTempFile('kiosk_doc', path.extname(validation.sanitizedFileName!), buffer);
      await tempHandle.cleanup(); // Clean up temp file immediately after processing

      // Authenticated Encryption at Rest (AES-256-GCM)
      const encryptedPayloadString = encryptPayload({
        rawBase64: fileBase64,
        extractedData: extractedData || null,
      });

      const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      saveDocumentRecord(db, {
        id: docId,
        caseId: activeCaseId,
        documentType: documentType === 'lab_report' ? 'lab_report' : 'prescription',
        fileName: validation.sanitizedFileName!,
        ocrRawText: ocrRawText || null,
        extractedData: encryptedPayloadString, // Stored encrypted at rest
      });

      recordAuditEvent(db, {
        caseId: activeCaseId,
        actorType: 'patient',
        actorId: req.kioskSession!.token,
        action: 'DOCUMENT_UPLOADED',
        details: {
          docId,
          fileName: validation.sanitizedFileName,
          encryptedAtRest: true,
          algorithm: 'aes-256-gcm',
        },
      });

      res.status(201).json({
        success: true,
        documentId: docId,
        fileName: validation.sanitizedFileName,
        documentType: documentType || 'prescription',
        encryptedAtRest: true,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Document upload failed', details: err.message });
    }
  });

  return router;
}

