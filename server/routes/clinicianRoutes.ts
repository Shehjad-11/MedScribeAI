import { Router } from 'express';
import Database from 'better-sqlite3';
import {
  AuthenticatedRequest,
  loginClinician,
  createRequireClinicianAuth,
} from '../security/auth';
import {
  getClinicalCase,
  listClinicalCases,
  saveClinicalCase,
  updateCaseStatus,
  recordAuditEvent,
  getAuditEvents,
} from '../db/database';
import { CaseStatus, ClinicalCase } from '../../src/types/clinicalCase';
import { generateOfflineSOAPNote } from '../../src/utils/offlineLocalEngine';
import { checkDrugInteractions } from '../../src/utils/drugInteractionChecker';
import { exportClinicalCaseToFHIR } from '../../src/utils/fhirConverter';


export function createClinicianRouter(getDb: () => Database.Database): Router {
  const router = Router();
  const requireClinician = createRequireClinicianAuth(getDb);

  // 1. Clinician Login (unauthenticated)
  router.post('/login', (req, res) => {
    try {
      const db = getDb();
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
      }

      const session = loginClinician(db, username, password);
      if (!session) {
        return res.status(401).json({ error: 'Invalid clinician credentials' });
      }

      res.json(session);
    } catch (err: any) {
      res.status(500).json({ error: 'Login failed', details: err.message });
    }
  });

  // 2. Clinician Queue (Authenticated with Priority Sorting)
  router.get('/queue', requireClinician, (req: AuthenticatedRequest, res) => {
    try {
      const db = getDb();
      const statusFilter = req.query.status as CaseStatus | undefined;
      const cases = listClinicalCases(db, statusFilter ? { status: statusFilter } : undefined);

      function computeCasePriority(c: ClinicalCase): { priority: number; label: string } {
        const flags = c.intake?.redFlags || [];
        if (flags.some((f) => f.severity === 'EMERGENCY')) {
          return { priority: 1, label: 'EMERGENCY' };
        }
        if (flags.some((f) => f.severity === 'URGENT')) {
          return { priority: 2, label: 'URGENT' };
        }
        if (flags.some((f) => f.severity === 'WARNING')) {
          return { priority: 3, label: 'WARNING' };
        }
        return { priority: 4, label: 'NORMAL' };
      }

      // Map and sort: Priority 1 first, then newest first
      const queueItems = cases
        .map((c) => {
          const { priority, label } = computeCasePriority(c);
          return {
            id: c.id,
            status: c.status,
            patientName: c.patient?.name?.value || 'Unknown',
            age: c.patient?.age?.value,
            sex: c.patient?.sex?.value,
            chiefComplaint: c.intake?.chiefComplaint?.value || 'Unspecified',
            language: c.language,
            priority,
            priorityLabel: label,
            hasRedFlags: (c.intake?.redFlags?.length || 0) > 0,
            redFlagsCount: c.intake?.redFlags?.length || 0,
            redFlags: c.intake?.redFlags || [],
            hasDocuments: (c.documents?.length || 0) > 0,
            hasAyush: !!c.intake?.ayushAssessment,
            ayushPrakriti: c.intake?.ayushAssessment?.prakriti?.value,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
          };
        })
        .sort((a, b) => {
          if (a.priority !== b.priority) {
            return a.priority - b.priority; // 1 (EMERGENCY) before 4 (NORMAL)
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

      res.json({ count: queueItems.length, queue: queueItems });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve queue', details: err.message });
    }
  });

  // 3. Get Full Case by ID (Authenticated)
  router.get('/cases/:id', requireClinician, (req: AuthenticatedRequest, res) => {
    try {
      const db = getDb();
      const clinicalCase = getClinicalCase(db, req.params.id);
      if (!clinicalCase) {
        return res.status(404).json({ error: `Case ${req.params.id} not found` });
      }
      res.json({ case: clinicalCase });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve case', details: err.message });
    }
  });

  // 4. Update Case Status (Authenticated)
  router.post('/cases/:id/status', requireClinician, (req: AuthenticatedRequest, res) => {
    try {
      const db = getDb();
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ error: 'New status is required' });
      }

      updateCaseStatus(db, req.params.id, status as CaseStatus);
      res.json({ success: true, caseId: req.params.id, status });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update case status', details: err.message });
    }
  });

  // 5. Clinician Approval Gate (Authenticated)
  router.post('/cases/:id/approve', requireClinician, (req: AuthenticatedRequest, res) => {
    try {
      const db = getDb();
      const clinicalCase = getClinicalCase(db, req.params.id);
      if (!clinicalCase) {
        return res.status(404).json({ error: `Case ${req.params.id} not found` });
      }

      const approvedAt = new Date().toISOString();
      const approvedBy = req.body.approvedBy || 'Dr. Clinician';

      clinicalCase.status = 'clinician_approved';
      clinicalCase.updatedAt = approvedAt;
      if (!clinicalCase.consultation) {
        clinicalCase.consultation = {};
      }
      clinicalCase.consultation.approvedAt = approvedAt;
      clinicalCase.consultation.approvedBy = approvedBy;
      if (req.body.clinicianNotes) {
        clinicalCase.consultation.clinicianNotes = req.body.clinicianNotes;
      }

      saveClinicalCase(db, clinicalCase);

      recordAuditEvent(db, {
        caseId: req.params.id,
        actorType: 'clinician',
        actorId: approvedBy,
        action: 'CLINICIAN_APPROVAL',
        details: { caseId: req.params.id, approvedAt, approvedBy },
      });

      res.json({ success: true, caseId: req.params.id, status: 'clinician_approved', approvedAt });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to record clinician approval', details: err.message });
    }
  });

  // 6. FHIR Export Event (Authenticated)
  router.post('/cases/:id/fhir-export', requireClinician, (req: AuthenticatedRequest, res) => {
    try {
      const db = getDb();
      const clinicalCase = getClinicalCase(db, req.params.id);
      if (!clinicalCase) {
        return res.status(404).json({ error: `Case ${req.params.id} not found` });
      }

      clinicalCase.status = 'fhir_exported';
      clinicalCase.updatedAt = new Date().toISOString();
      saveClinicalCase(db, clinicalCase);

      recordAuditEvent(db, {
        caseId: req.params.id,
        actorType: 'clinician',
        actorId: req.actorId || 'clinician',
        action: 'FHIR_EXPORT',
        details: { caseId: req.params.id, bundleType: 'collection' },
      });

      const bundle = exportClinicalCaseToFHIR(clinicalCase, (clinicalCase.consultation as any)?.soapNote);

      res.json({ success: true, caseId: req.params.id, status: 'fhir_exported', bundle });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to record FHIR export', details: err.message });
    }
  });

  // 7. Generate SOAP Note from ClinicalCase (Authenticated)
  router.post('/cases/:id/generate-soap', requireClinician, (req: AuthenticatedRequest, res) => {
    try {
      const db = getDb();
      const clinicalCase = getClinicalCase(db, req.params.id);
      if (!clinicalCase) {
        return res.status(404).json({ error: `Case ${req.params.id} not found` });
      }

      const patientInfo = {
        name: clinicalCase.patient?.name?.value || 'Anonymous',
        age: clinicalCase.patient?.age?.value || 'Unspecified',
        sex: clinicalCase.patient?.sex?.value || 'Other',
        medicalHistory: clinicalCase.intake?.pastMedicalHistory?.value || 'Hypertension',
        currentMedications: clinicalCase.intake?.currentMedications?.value?.join(', ') || 'Atorvastatin 20mg, Aspirin 75mg',
        knownAllergies: clinicalCase.intake?.allergies?.value?.join(', ') || 'NKDA',
      };

      const transcript = req.body.transcript ||
        `Doctor: Good day. What brings you to the clinic?
Patient: I have had bad chest pain for the last 2 hours. It feels like a heavy weight and is radiating down my left arm. I am sweating and feel breathless.
Doctor: Do you have a history of hypertension or heart trouble?
Patient: Yes, hypertension for 5 years. I take Atorvastatin and Aspirin regularly.`;

      // Generate structured SOAP note using the deterministic engine
      const soapNote = generateOfflineSOAPNote(patientInfo as any, transcript);

      // Extract prescriptions from intake documents if available
      const docPrescriptions = clinicalCase.documents?.flatMap(d => d.extractedPrescriptions || []).map(p => ({
        medication: p.medication,
        dosage: p.dosage,
        frequency: p.frequency,
        instructions: 'Take as directed',
        duration: p.duration,
      })) || [];

      if (docPrescriptions.length > 0) {
        soapNote.plan.prescriptions = [...soapNote.plan.prescriptions, ...docPrescriptions];
      }

      // Run deterministic safety engine
      const safetyAlerts = checkDrugInteractions(
        soapNote.plan.prescriptions,
        patientInfo.currentMedications,
        patientInfo.medicalHistory,
        patientInfo.knownAllergies
      );

      // Update case consultation state
      if (!clinicalCase.consultation) {
        clinicalCase.consultation = {};
      }
      (clinicalCase.consultation as any).soapNote = soapNote;
      (clinicalCase.consultation as any).safetyAlerts = safetyAlerts;
      clinicalCase.status = 'doctor_reviewing';
      clinicalCase.updatedAt = new Date().toISOString();

      saveClinicalCase(db, clinicalCase);

      // Persist to soap_notes table
      const insertSoap = db.prepare(`
        INSERT INTO soap_notes (id, case_id, subjective, objective, assessment, plan, generated_by, confidence_score, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertSoap.run(
        `soap_${Date.now()}`,
        clinicalCase.id,
        JSON.stringify(soapNote.subjective),
        JSON.stringify(soapNote.objective),
        JSON.stringify(soapNote.assessment),
        JSON.stringify(soapNote.plan),
        'offline_engine',
        85,
        new Date().toISOString()
      );

      recordAuditEvent(db, {
        caseId: clinicalCase.id,
        actorType: 'clinician',
        actorId: req.actorId || 'doctor',
        action: 'SOAP_GENERATED',
        details: { engine: 'offline_engine', prescriptionsCount: soapNote.plan.prescriptions.length },
      });

      res.json({ success: true, caseId: clinicalCase.id, soapNote, safetyAlerts });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to generate SOAP note', details: err.message });
    }
  });

  // 8. Get FHIR Bundle (Authenticated)
  router.get('/cases/:id/fhir', requireClinician, (req: AuthenticatedRequest, res) => {
    try {
      const db = getDb();
      const clinicalCase = getClinicalCase(db, req.params.id);
      if (!clinicalCase) {
        return res.status(404).json({ error: `Case ${req.params.id} not found` });
      }

      const bundle = exportClinicalCaseToFHIR(clinicalCase, (clinicalCase.consultation as any)?.soapNote);
      res.json({ bundle });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to export FHIR bundle', details: err.message });
    }
  });


  // 7. Audit Events Viewer (Authenticated)
  router.get('/audit-events', requireClinician, (req: AuthenticatedRequest, res) => {
    try {
      const db = getDb();
      const caseId = req.query.caseId as string | undefined;
      const events = getAuditEvents(db, caseId);
      res.json({ count: events.length, events });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch audit events', details: err.message });
    }
  });

  return router;
}
