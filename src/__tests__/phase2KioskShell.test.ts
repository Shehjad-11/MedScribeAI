// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import http from 'http';
import { AddressInfo } from 'net';
import { getDatabase, closeDatabase } from '../../server/db/database';
import { createKioskRouter } from '../../server/routes/kioskRoutes';
import { TEN_COMPLAINTS } from '../data/complaintsCatalog';
import { en } from '../i18n/locales/en';
import { es } from '../i18n/locales/es';
import { hi } from '../i18n/locales/hi';
import { mr } from '../i18n/locales/mr';

describe('Phase 2: Patient Kiosk Shell & Multilingual Foundation', () => {
  let server: http.Server;
  let baseUrl: string;
  let kioskToken: string;

  beforeAll(async () => {
    process.env.MEDSCRIBE_DB_PATH = ':memory:';
    closeDatabase();
    const db = getDatabase(':memory:');

    const app = express();
    app.use(express.json());
    app.use('/api/kiosk', createKioskRouter(() => db));

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const address = server.address() as AddressInfo;
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });

    // Start a kiosk session
    const res = await fetch(`${baseUrl}/api/kiosk/session/start`, { method: 'POST' });
    const data = await res.json();
    kioskToken = data.token;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
    closeDatabase();
  });

  // -------------------------------------------------------------------------
  // 1. Multilingual Localization Integrity
  // -------------------------------------------------------------------------
  describe('Multilingual Localization Integrity (en, hi, mr, es)', () => {
    it('provides complete translation dictionaries for all 4 supported languages', () => {
      expect(en.kiosk).toBeDefined();
      expect(es.kiosk).toBeDefined();
      expect(hi.kiosk).toBeDefined();
      expect(mr.kiosk).toBeDefined();

      expect(hi.kiosk.abhaTitle).toContain('आयुष्मान');
      expect(mr.kiosk.abhaTitle).toContain('आयुष्मान');
      expect(es.kiosk.abhaTitle).toContain('Ayushman');
    });

    it('defines exactly 10 complaint templates with titles and descriptions across all 4 languages', () => {
      expect(TEN_COMPLAINTS.length).toBe(10);

      TEN_COMPLAINTS.forEach((complaint) => {
        expect(complaint.id).toBeTruthy();
        expect(complaint.title.en).toBeTruthy();
        expect(complaint.title.hi).toBeTruthy();
        expect(complaint.title.mr).toBeTruthy();
        expect(complaint.title.es).toBeTruthy();

        expect(complaint.shortDescription.en).toBeTruthy();
        expect(complaint.shortDescription.hi).toBeTruthy();
        expect(complaint.shortDescription.mr).toBeTruthy();
        expect(complaint.shortDescription.es).toBeTruthy();
      });
    });
  });

  // -------------------------------------------------------------------------
  // 2. Mock ABHA Identification Adapter
  // -------------------------------------------------------------------------
  describe('Mock ABHA Verification Adapter', () => {
    it('verifies 14-digit numeric ABHA ID and returns mock profile with disclaimer', async () => {
      const res = await fetch(`${baseUrl}/api/kiosk/abha/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ abhaId: '91-1234-5678-9012' }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.verified).toBe(true);
      expect(data.isMock).toBe(true);
      expect(data.disclaimer).toContain('MOCK ABHA ADAPTER');
      expect(data.profile.abhaNumber).toBe('91-1234-5678-9012');
      expect(data.profile.name).toBe('Ramesh Kumar Patil');
    });

    it('verifies valid PHR address (@abdm) and returns synthetic profile', async () => {
      const res = await fetch(`${baseUrl}/api/kiosk/abha/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ abhaId: 'rahul.patient@abdm' }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.verified).toBe(true);
      expect(data.profile.abhaAddress).toBe('rahul.patient@abdm');
      expect(data.profile.name).toBe('Rahul Sharma');
    });

    it('rejects invalid ABHA formatting with 422 Unprocessable Entity', async () => {
      const res = await fetch(`${baseUrl}/api/kiosk/abha/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ abhaId: '12345' }),
      });

      expect(res.status).toBe(422);
      const data = await res.json();
      expect(data.verified).toBe(false);
      expect(data.error).toContain('Invalid ABHA format');
    });

    it('returns 400 when abhaId is missing', async () => {
      const res = await fetch(`${baseUrl}/api/kiosk/abha/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
    });
  });

  // -------------------------------------------------------------------------
  // 3. Kiosk Config & Complaints Catalog Endpoints
  // -------------------------------------------------------------------------
  describe('Kiosk Configuration & Complaint Stubs', () => {
    it('returns kiosk configuration flags and supported languages', async () => {
      const res = await fetch(`${baseUrl}/api/kiosk/config`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data.supportedLanguages)).toBe(true);
      expect(data.supportedLanguages).toContain('en');
      expect(data.supportedLanguages).toContain('hi');
      expect(data.supportedLanguages).toContain('mr');
      expect(data.complaintTemplatesCount).toBe(10);
    });

    it('serves the ten complaint stubs with categories and risk levels', async () => {
      const res = await fetch(`${baseUrl}/api/kiosk/complaints`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data.complaints)).toBe(true);
      expect(data.complaints.length).toBe(10);

      const codes = data.complaints.map((c: any) => c.code);
      expect(codes).toContain('FEVER');
      expect(codes).toContain('CHEST_PAIN');
      expect(codes).toContain('COUGH');
      expect(codes).toContain('BREATHLESSNESS');
    });
  });

  // -------------------------------------------------------------------------
  // 4. Cloud AI Gating & Local-Only Privacy Enforcement
  // -------------------------------------------------------------------------
  describe('Cloud AI Gate & Local-Only Privacy Flag', () => {
    it('blocks cloud AI requests when client enables local-only mode flag', async () => {
      const res = await fetch(`${baseUrl}/api/kiosk/ai-gate-check`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${kioskToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ localOnly: true }),
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.allowed).toBe(false);
      expect(data.mode).toBe('OFFLINE_ONLY');
      expect(data.reason).toContain('BLOCKED_BY_KIOSK_FLAG');
    });

    it('blocks cloud AI requests when patient denies cloud AI consent', async () => {
      const res = await fetch(`${baseUrl}/api/kiosk/ai-gate-check`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${kioskToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ consentCloudAi: false }),
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.allowed).toBe(false);
      expect(data.mode).toBe('OFFLINE_ONLY');
      expect(data.reason).toContain('BLOCKED_BY_PATIENT_CONSENT');
    });

    it('allows cloud AI when local-only is false and cloud AI consent is granted', async () => {
      const res = await fetch(`${baseUrl}/api/kiosk/ai-gate-check`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${kioskToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ localOnly: false, consentCloudAi: true }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.allowed).toBe(true);
      expect(data.mode).toBe('CLOUD_AI_ALLOWED');
    });
  });

  // -------------------------------------------------------------------------
  // 5. Separate Consent Toggles Storage
  // -------------------------------------------------------------------------
  describe('Granular Consent Storage with 5 Separate Scopes', () => {
    it('records consent with all 5 distinct permission scopes', async () => {
      const scopes = {
        historyStorage: true,
        voiceProcessing: true,
        documentScan: true,
        cloudAi: false, // Patient explicitly opted out of cloud AI
        fhirExport: true,
      };

      const res = await fetch(`${baseUrl}/api/kiosk/consent`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${kioskToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: 'patient_p2_test',
          granted: true,
          scopes,
          language: 'mr',
          method: 'touch_checkbox',
          version: '1.0',
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.consentId).toBeDefined();
    });
  });
});
