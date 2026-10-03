import crypto from 'node:crypto';
import { Request, Response, NextFunction } from 'express';
import Database from 'better-sqlite3';
import {
  createSession,
  getSession,
  invalidateSession,
  updateSessionCase,
  recordAuditEvent,
  DbSession,
} from '../db/database';

export interface AuthenticatedRequest extends Request {
  kioskSession?: DbSession;
  clinicianSession?: DbSession;
  actorId?: string;
}

const KIOSK_TTL_MS = 30 * 60 * 1000; // 30 minutes
const CLINICIAN_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

export const DEMO_CLINICIAN_USER = process.env.CLINICIAN_USER || 'doctor';
export const DEMO_CLINICIAN_PASS = process.env.CLINICIAN_PASS || 'medscribe2026';

/**
 * Generates a cryptographically random session token
 */
export function generateToken(prefix: 'kiosk' | 'doc'): string {
  const randomHex = crypto.randomBytes(24).toString('hex');
  return `${prefix}_${randomHex}`;
}

/**
 * Creates a new session for patient kiosk
 */
export function startKioskSession(db: Database.Database): { token: string; expiresAt: string } {
  const token = generateToken('kiosk');
  const expiresAt = new Date(Date.now() + KIOSK_TTL_MS).toISOString();

  createSession(db, {
    token,
    sessionType: 'kiosk',
    expiresAt,
  });

  recordAuditEvent(db, {
    actorType: 'kiosk',
    actorId: token,
    action: 'SESSION_CREATED',
    details: { expiresAt },
  });

  return { token, expiresAt };
}

/**
 * Invalidates and resets a kiosk session immediately
 */
export function resetKioskSession(db: Database.Database, token: string): void {
  const session = getSession(db, token);
  invalidateSession(db, token);

  recordAuditEvent(db, {
    caseId: session?.active_case_id || null,
    actorType: 'kiosk',
    actorId: token,
    action: 'SESSION_RESET',
    details: { previousCaseId: session?.active_case_id },
  });
}

/**
 * Authenticates a clinician and creates a clinician session
 */
export function loginClinician(
  db: Database.Database,
  username: string,
  pass: string
): { token: string; expiresAt: string; displayName: string } | null {
  if (username !== DEMO_CLINICIAN_USER || pass !== DEMO_CLINICIAN_PASS) {
    return null;
  }

  const token = generateToken('doc');
  const expiresAt = new Date(Date.now() + CLINICIAN_TTL_MS).toISOString();

  createSession(db, {
    token,
    sessionType: 'clinician',
    expiresAt,
  });

  recordAuditEvent(db, {
    actorType: 'clinician',
    actorId: username,
    action: 'CLINICIAN_LOGIN',
    details: { username },
  });

  return { token, expiresAt, displayName: 'Dr. Primary Care' };
}

/**
 * Middleware: Requires a valid, active, non-expired kiosk session.
 * Rejects requests with missing or invalid tokens, or clinician tokens on kiosk routes.
 */
export function createRequireKioskAuth(getDb: () => Database.Database) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized: Missing or malformed Bearer token for kiosk route',
      });
    }

    const token = authHeader.substring(7).trim();
    const db = getDb();
    const session = getSession(db, token);

    if (!session || !session.is_active) {
      return res.status(401).json({
        error: 'Unauthorized: Kiosk session is invalid or has been reset',
      });
    }

    if (session.session_type !== 'kiosk') {
      return res.status(403).json({
        error: 'Forbidden: Invalid token type for kiosk route',
      });
    }

    if (new Date(session.expires_at).getTime() < Date.now()) {
      invalidateSession(db, token);
      return res.status(401).json({
        error: 'Unauthorized: Kiosk session has expired',
      });
    }

    req.kioskSession = session;
    req.actorId = session.token;
    next();
  };
}

/**
 * Middleware: Requires a valid, active clinician session.
 * STRICT SECURITY REQUIREMENT:
 * Kiosk tokens MUST BE EXPLICITLY REJECTED with 403 Forbidden!
 */
export function createRequireClinicianAuth(getDb: () => Database.Database) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized: Clinician authentication required',
      });
    }

    const token = authHeader.substring(7).trim();
    const db = getDb();
    const session = getSession(db, token);

    if (!session || !session.is_active) {
      return res.status(401).json({
        error: 'Unauthorized: Clinician session is invalid or expired',
      });
    }

    // STRICT CHECK: Reject kiosk token from clinician route
    if (session.session_type === 'kiosk') {
      recordAuditEvent(db, {
        actorType: 'kiosk',
        actorId: token,
        action: 'SECURITY_VIOLATION_ATTEMPT',
        details: { path: req.path, method: req.method },
      });
      return res.status(403).json({
        error: 'Forbidden: Kiosk tokens cannot access clinician endpoints',
      });
    }

    if (session.session_type !== 'clinician') {
      return res.status(403).json({
        error: 'Forbidden: Clinician role required',
      });
    }

    if (new Date(session.expires_at).getTime() < Date.now()) {
      invalidateSession(db, token);
      return res.status(401).json({
        error: 'Unauthorized: Clinician session has expired',
      });
    }

    req.clinicianSession = session;
    req.actorId = 'clinician';
    next();
  };
}
