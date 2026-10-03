import { describe, it, expect } from 'vitest';
import {
  BhashiniASRAdapter,
  LocalWhisperASRAdapter,
  WebSpeechASRAdapter,
  ManualFallbackASRAdapter,
  ASRManager,
  TTSService,
} from '../services/asr/asrAdapters';
import { calculateAsrMetrics, evaluateBatchAsr } from '../../scripts/scoreAsr';

describe('Phase 4: Layered ASR Adapters, TTS & Marathi Gate Harness', () => {
  // -------------------------------------------------------------------------
  // 1. Bhashini ASR Adapter
  // -------------------------------------------------------------------------
  describe('Bhashini ASR Adapter', () => {
    it('returns labeled mock with disclaimer when credentials are not configured', async () => {
      const bhashini = new BhashiniASRAdapter();
      const res = await bhashini.transcribe('test_audio_buffer', 'mr');

      expect(res.isMock).toBe(true);
      expect(res.adapterUsed).toBe('bhashini');
      expect(res.language).toBe('mr');
      expect(res.disclaimer).toContain('MOCK BHASHINI ASR ADAPTER');
      expect(res.transcript).toContain('ताप');
    });

    it('returns Hindi mock transcript when requested language is Hindi', async () => {
      const bhashini = new BhashiniASRAdapter();
      const res = await bhashini.transcribe('test_audio_buffer', 'hi');

      expect(res.isMock).toBe(true);
      expect(res.transcript).toContain('बुखार');
    });
  });

  // -------------------------------------------------------------------------
  // 2. Local Whisper Feasibility Evaluation
  // -------------------------------------------------------------------------
  describe('Local Whisper Feasibility', () => {
    it('formally states Whisper is not feasible in pure browser/Node without native binary', async () => {
      const whisper = new LocalWhisperASRAdapter();
      const report = await whisper.getFeasibilityReport();

      expect(report.feasible).toBe(false);
      expect(report.reason).toContain('FEASIBILITY REJECTED');
      expect(report.reason).toContain('NOT RUN');
    });
  });

  // -------------------------------------------------------------------------
  // 3. Web Speech & Manual Fallbacks
  // -------------------------------------------------------------------------
  describe('Web Speech and Manual Fallbacks', () => {
    it('handles headless / non-browser environment safely', async () => {
      const webSpeech = new WebSpeechASRAdapter();
      const res = await webSpeech.transcribe('audio', 'en');
      expect(res.adapterUsed).toBe('web_speech');
    });

    it('manual fallback reliably echoes typed input with full confidence', async () => {
      const manual = new ManualFallbackASRAdapter();
      const res = await manual.transcribe('Patient reports sharp chest tightness', 'en');

      expect(res.adapterUsed).toBe('manual');
      expect(res.confidence).toBe(1.0);
      expect(res.transcript).toBe('Patient reports sharp chest tightness');
      expect(res.isMock).toBe(false);
    });

    it('ASRManager routes through fallback hierarchy without throwing', async () => {
      const manager = new ASRManager();
      const result = await manager.transcribeWithFallback('raw_audio_input', 'mr');

      expect(result).toBeDefined();
      expect(result.transcript.length).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // 4. TTS Service
  // -------------------------------------------------------------------------
  describe('Browser TTS Service', () => {
    it('operates safely without throwing in headless test runner', () => {
      const tts = new TTSService();
      expect(() => tts.speak('Take medicine twice daily', 'en')).not.toThrow();
      expect(() => tts.stop()).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // 5. Marathi ASR Gate Scoring Harness (WER / CER)
  // -------------------------------------------------------------------------
  describe('ASR Scoring Engine (WER / CER)', () => {
    it('calculates 0.0 WER on identical ground truth match', () => {
      const ref = 'मला तीन दिवसांपासून ताप आहे';
      const hyp = 'मला तीन दिवसांपासून ताप आहे';

      const metrics = calculateAsrMetrics(ref, hyp);
      expect(metrics.wer).toBe(0.0);
      expect(metrics.cer).toBe(0.0);
      expect(metrics.passedThreshold).toBe(true);
      expect(metrics.substitutions).toBe(0);
    });

    it('calculates accurate Word Error Rate for substitutions and deletions', () => {
      const ref = 'patient has severe acute chest pain'; // 6 words
      const hyp = 'patient has mild acute pain'; // 1 substitution, 1 deletion -> 2 errors / 6 words = 0.3333

      const metrics = calculateAsrMetrics(ref, hyp, 0.25);
      expect(metrics.wer).toBeGreaterThan(0.3);
      expect(metrics.passedThreshold).toBe(false); // 33% > 25% threshold
    });

    it('correctly evaluates batch runs and calculates aggregate pass/fail', () => {
      const samples = [
        { id: '1', reference: 'doctor patient interview', hypothesis: 'doctor patient interview' }, // 0%
        { id: '2', reference: 'fever chills cough', hypothesis: 'fever chills cold' }, // 33.3%
      ];

      const batch = evaluateBatchAsr(samples, 0.25);
      expect(batch.totalSamples).toBe(2);
      expect(batch.passedSamples).toBe(1);
      // Average WER = (0 + 0.3333)/2 = ~0.1667 <= 0.25
      expect(batch.overallPassed).toBe(true);
    });
  });
});
