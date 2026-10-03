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
} from '../db/database';
import { ClinicalCase } from '../../src/types/clinicalCase';

export function createKioskRouter(getDb: () => Database.Database): Router {
  const router = Router();
  const requireKiosk = createRequireKioskAuth(getDb);

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

  return router;
}
