/**
 * Marathi & Indian Language ASR Evaluation Harness (WER / CER)
 * Calculates Levenshtein-based Word Error Rate and Character Error Rate
 * between reference ground truth transcripts and candidate ASR output.
 */

export interface ASRMetrics {
  reference: string;
  hypothesis: string;
  wer: number; // 0.0 to 1.0 (or >1.0 if insertions exceed length)
  cer: number;
  substitutions: number;
  deletions: number;
  insertions: number;
  wordCount: number;
  passedThreshold: boolean; // default threshold: WER <= 0.25 (25%)
}

/**
 * Standard Levenshtein distance matrix calculation
 */
function levenshteinDistance(ref: string[], hyp: string[]): { distance: number; s: number; d: number; i: number } {
  const m = ref.length;
  const n = hyp.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (ref[i - 1] === hyp[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j - 1], // substitution
          dp[i - 1][j],     // deletion
          dp[i][j - 1]      // insertion
        );
      }
    }
  }

  // Backtrack to approximate S, D, I counts
  let i = m, j = n;
  let s = 0, d = 0, ins = 0;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && ref[i - 1] === hyp[j - 1]) {
      i--;
      j--;
    } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      s++;
      i--;
      j--;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      d++;
      i--;
    } else {
      ins++;
      j--;
    }
  }

  return { distance: dp[m][n], s, d, i: ins };
}

/**
 * Computes WER and CER for a pair of reference and hypothesis texts
 */
export function calculateAsrMetrics(
  reference: string,
  hypothesis: string,
  werThreshold: number = 0.25
): ASRMetrics {
  const cleanRef = reference.trim().replace(/\s+/g, ' ');
  const cleanHyp = hypothesis.trim().replace(/\s+/g, ' ');

  const refWords = cleanRef.length > 0 ? cleanRef.split(' ') : [];
  const hypWords = cleanHyp.length > 0 ? cleanHyp.split(' ') : [];

  const wordLev = levenshteinDistance(refWords, hypWords);
  const wer = refWords.length > 0 ? wordLev.distance / refWords.length : (hypWords.length > 0 ? 1.0 : 0.0);

  // Character Error Rate
  const refChars = cleanRef.replace(/\s/g, '').split('');
  const hypChars = cleanHyp.replace(/\s/g, '').split('');
  const charLev = levenshteinDistance(refChars, hypChars);
  const cer = refChars.length > 0 ? charLev.distance / refChars.length : 0.0;

  return {
    reference: cleanRef,
    hypothesis: cleanHyp,
    wer: Number(wer.toFixed(4)),
    cer: Number(cer.toFixed(4)),
    substitutions: wordLev.s,
    deletions: wordLev.d,
    insertions: wordLev.i,
    wordCount: refWords.length,
    passedThreshold: wer <= werThreshold,
  };
}

/**
 * Batch evaluation of multiple samples
 */
export function evaluateBatchAsr(
  testSamples: { id: string; reference: string; hypothesis: string }[],
  targetThreshold: number = 0.25
): {
  totalSamples: number;
  averageWer: number;
  averageCer: number;
  passedSamples: number;
  overallPassed: boolean;
  results: Array<{ id: string } & ASRMetrics>;
} {
  const results = testSamples.map((sample) => ({
    id: sample.id,
    ...calculateAsrMetrics(sample.reference, sample.hypothesis, targetThreshold),
  }));

  const totalWer = results.reduce((sum, r) => sum + r.wer, 0);
  const totalCer = results.reduce((sum, r) => sum + r.cer, 0);
  const avgWer = results.length > 0 ? totalWer / results.length : 0;
  const avgCer = results.length > 0 ? totalCer / results.length : 0;
  const passedCount = results.filter((r) => r.passedThreshold).length;

  return {
    totalSamples: results.length,
    averageWer: Number(avgWer.toFixed(4)),
    averageCer: Number(avgCer.toFixed(4)),
    passedSamples: passedCount,
    overallPassed: avgWer <= targetThreshold,
    results,
  };
}
