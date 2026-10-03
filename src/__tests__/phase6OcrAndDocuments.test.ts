import { describe, it, expect } from 'vitest';
import {
  validateDocumentQuality,
  classifyDocumentType,
  evaluateLabValue,
  OCRManager,
} from '../services/ocr/ocrAdapters';
import {
  scorePrescriptionExtraction,
  scoreLabExtraction,
} from '../../scripts/scoreOcr';

describe('Phase 6: Medical Document Processing, OCR & Quality Validation', () => {
  // -------------------------------------------------------------------------
  // 1. Document Quality Validation
  // -------------------------------------------------------------------------
  describe('Document Quality & Dimension Verification', () => {
    it('accepts valid JPEG/PNG images with resolution >= 200x200', () => {
      const report = validateDocumentQuality(1024 * 150, 'image/jpeg', 800, 600);
      expect(report.isValid).toBe(true);
      expect(report.qualityIssues.length).toBe(0);
    });

    it('rejects low-resolution image under 200x200 pixels', () => {
      const report = validateDocumentQuality(1024 * 10, 'image/png', 150, 150);
      expect(report.isValid).toBe(false);
      expect(report.qualityIssues.some((i) => i.includes('resolution too low'))).toBe(true);
    });

    it('rejects unsupported file formats', () => {
      const report = validateDocumentQuality(5000, 'text/plain');
      expect(report.isValid).toBe(false);
      expect(report.qualityIssues.some((i) => i.includes('Unsupported file format'))).toBe(true);
    });

    it('rejects 0-byte empty files', () => {
      const report = validateDocumentQuality(0, 'image/jpeg', 500, 500);
      expect(report.isValid).toBe(false);
      expect(report.qualityIssues.some((i) => i.includes('empty'))).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Document Classification Heuristics
  // -------------------------------------------------------------------------
  describe('Document Classification', () => {
    it('classifies prescription documents based on clinical Rx keywords', () => {
      const text = 'Dr. Sharma Clinic\nRx:\nTab Amlodipine 5mg OD\nCap Omeprazole 20mg BD';
      expect(classifyDocumentType(text, 'camera_scan.jpg')).toBe('prescription');
    });

    it('classifies lab reports based on diagnostic analyte keywords', () => {
      const text = 'Clinical Pathology Laboratory\nTest: Fasting Blood Sugar\nResult: 145 mg/dL\nHemoglobin: 12.4 g/dL';
      expect(classifyDocumentType(text, 'blood_test_report.png')).toBe('lab_report');
    });

    it('classifies generic documents as other', () => {
      const text = 'Electricity bill receipt for clinic premises';
      expect(classifyDocumentType(text, 'invoice.pdf')).toBe('other');
    });
  });

  // -------------------------------------------------------------------------
  // 3. Abnormal Value Flags
  // -------------------------------------------------------------------------
  describe('Abnormal Lab Value Flags', () => {
    it('flags high blood sugar as HIGH or CRITICAL', () => {
      expect(evaluateLabValue('Fasting Blood Glucose', 165)).toEqual({
        isAbnormal: true,
        abnormalFlag: 'HIGH',
      });

      expect(evaluateLabValue('Random Blood Sugar', 310)).toEqual({
        isAbnormal: true,
        abnormalFlag: 'CRITICAL',
      });
    });

    it('returns normal status for healthy analyte ranges', () => {
      expect(evaluateLabValue('Fasting Glucose', 92)).toEqual({
        isAbnormal: false,
      });
    });

    it('flags severe anemia as CRITICAL', () => {
      expect(evaluateLabValue('Hemoglobin', 6.2)).toEqual({
        isAbnormal: true,
        abnormalFlag: 'CRITICAL',
      });
    });
  });

  // -------------------------------------------------------------------------
  // 4. Privacy Gating in OCR Processing
  // -------------------------------------------------------------------------
  describe('Privacy Gating in OCR Manager', () => {
    it('strictly forces local offline extraction when localOnlyMode is enabled', async () => {
      const manager = new OCRManager();
      const res = await manager.processDocument(
        'sample_buffer',
        'rx_scan.jpg',
        'image/jpeg',
        true, // consent granted
        true  // localOnlyMode TRUE
      );

      expect(res.privacyMode).toBe('LOCAL_ONLY');
      expect(res.adapterUsed).toBe('local_ocr');
      expect(res.isMock).toBe(true);
      expect(res.prescriptions.length).toBeGreaterThan(0);
      expect(res.prescriptions[0].provenance.source).toBe('DOCUMENT_EXTRACTED');
    });

    it('extracts lab reports with abnormal flags in local-only mode', async () => {
      const manager = new OCRManager();
      const res = await manager.processDocument(
        'sample_buffer',
        'blood_lab_report.jpg',
        'image/jpeg',
        false, // consent denied
        false
      );

      expect(res.documentType).toBe('lab_report');
      expect(res.privacyMode).toBe('LOCAL_ONLY');
      expect(res.labResults.length).toBeGreaterThan(0);
      expect(res.labResults.some((l) => l.isAbnormal)).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 5. OCR Accuracy Scoring Harness
  // -------------------------------------------------------------------------
  describe('OCR Scoring Harness', () => {
    it('scores 100% accuracy on perfect prescription field extraction', () => {
      const expected = [{ medication: 'Amlodipine', dosage: '5mg' }];
      const extracted = [{ medication: 'Amlodipine Besylate', dosage: '5mg' }];

      const score = scorePrescriptionExtraction(expected, extracted);
      expect(score.accuracy).toBe(1.0);
      expect(score.fieldsMatched).toBe(2);
    });

    it('scores lab result field extractions correctly', () => {
      const expected = [{ testName: 'Fasting Blood Sugar', value: '168' }];
      const extracted = [{ testName: 'Blood Sugar Fasting', value: '168' }];

      const score = scoreLabExtraction(expected, extracted);
      expect(score.accuracy).toBe(1.0);
    });
  });
});
