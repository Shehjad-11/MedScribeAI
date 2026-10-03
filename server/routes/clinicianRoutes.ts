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
import { CaseStatus } from '../../src/types/clinicalCase';

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

  // 2. Clinician Queue (Authenticated)
  router.get('/queue', requireClinician, (req: AuthenticatedRequest, res) => {
    try {
      const db = getDb();
      const statusFilter = req.query.status as CaseStatus | undefined;
      const cases = listClinicalCases(db, statusFilter ? { status: statusFilter } : undefined);

      // Return queue summary for doctor review
      const queueItems = cases.map((c) => ({
        id: c.id,
        status: c.status,
        patientName: c.patient?.name?.value || 'Unknown',
        age: c.patient?.age?.value,
        sex: c.patient?.sex?.value,
        chiefComplaint: c.intake?.chiefComplaint?.value || 'Unspecified',
        language: c.language,
        hasRedFlags: (c.intake?.redFlags?.length || 0) > 0,
        redFlagsCount: c.intake?.redFlags?.length || 0,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }));

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

      res.json({ success: true, caseId: req.params.id, status: 'fhir_exported' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to record FHIR export', details: err.message });
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
