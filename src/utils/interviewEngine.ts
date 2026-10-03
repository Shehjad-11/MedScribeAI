/**
 * Deterministic Clinical Interview & Question Graph Engine (Tier 1 SIH Spec)
 * Enforces question sequence, required fields, branching, confirmation policy,
 * and provenance tracking. Gemini is used only for slot extraction / rephrasing.
 */

import { INTERVIEW_TEMPLATES, QuestionNode, ComplaintInterviewTemplate } from '../data/interviewTemplates';
import { ClinicalFact } from '../types/clinicalCase';

export interface InterviewSessionState {
  complaintCode: string;
  template: ComplaintInterviewTemplate;
  currentQuestionIndex: number;
  answers: Record<string, any>; // questionId -> value
  facts: ClinicalFact[];
  pendingConfirmationFact: ClinicalFact | null;
  batchConfirmationsPending: ClinicalFact[];
  isComplete: boolean;
}

/**
 * Initializes a deterministic interview session for a given complaint
 */
export function startInterview(complaintCode: string): InterviewSessionState {
  const template = INTERVIEW_TEMPLATES[complaintCode] || INTERVIEW_TEMPLATES.FEVER;
  return {
    complaintCode,
    template,
    currentQuestionIndex: 0,
    answers: {},
    facts: [],
    pendingConfirmationFact: null,
    batchConfirmationsPending: [],
    isComplete: false,
  };
}

/**
 * Retrieves the current question node, evaluating any conditional branching
 */
export function getCurrentQuestion(state: InterviewSessionState): QuestionNode | null {
  if (state.isComplete || state.currentQuestionIndex >= state.template.questions.length) {
    return null;
  }

  const question = state.template.questions[state.currentQuestionIndex];

  // Evaluate branching condition if present
  if (question.condition) {
    const dependentValue = state.answers[question.condition.dependsOnField];
    let conditionMet = true;

    switch (question.condition.operator) {
      case 'equals':
        conditionMet = dependentValue === question.condition.value;
        break;
      case 'not_equals':
        conditionMet = dependentValue !== question.condition.value;
        break;
      case 'contains':
        conditionMet = Array.isArray(dependentValue)
          ? dependentValue.includes(question.condition.value)
          : String(dependentValue || '').includes(String(question.condition.value));
        break;
      case 'greater_than':
        conditionMet = Number(dependentValue) > Number(question.condition.value);
        break;
    }

    if (!conditionMet) {
      // Condition not met, skip to next question
      const nextIndex = state.currentQuestionIndex + 1;
      if (nextIndex < state.template.questions.length) {
        return getCurrentQuestion({ ...state, currentQuestionIndex: nextIndex });
      }
      return null;
    }
  }

  return question;
}

/**
 * Deterministic offline slot extraction from patient text/speech
 */
export function extractSlotsOffline(question: QuestionNode, rawText: string): any {
  if (!rawText || !rawText.trim()) {
    return question.required ? null : 'Not documented';
  }

  const clean = rawText.toLowerCase().trim();

  // Yes / No questions
  if (question.type === 'yes_no') {
    if (clean.includes('yes') || clean.includes('हाँ') || clean.includes('होय') || clean.includes('sí') || clean.includes('true')) {
      return true;
    }
    if (clean.includes('no') || clean.includes('नहीं') || clean.includes('नाही') || clean.includes('false')) {
      return false;
    }
  }

  // Duration extraction
  if (question.type === 'duration') {
    // Map Devanagari numerals (०-९) to western digits (0-9)
    const normalized = clean.replace(/[\u0966-\u096F]/g, (d) => String(d.charCodeAt(0) - 0x0966));
    const dayMatch = normalized.match(/(\d+)\s*(day|दिन|दिवस|días?)/i);
    if (dayMatch) {
      return `${dayMatch[1]} days`;
    }
    const numMatch = normalized.match(/\b(\d+)\b/);
    if (numMatch) {
      return `${numMatch[1]} days`;
    }
  }

  // Numeric scale (1-10)
  if (question.type === 'numeric_scale') {
    const numMatch = clean.match(/\b([1-9]|10)\b/);
    if (numMatch) {
      return parseInt(numMatch[1], 10);
    }
  }

  // Single choice matching against options
  if (question.type === 'single_choice' && question.options) {
    for (const opt of question.options) {
      if (clean.includes(opt.value.toLowerCase())) {
        return opt.value;
      }
      for (const lang of Object.values(opt.label)) {
        if (clean.includes(lang.toLowerCase())) {
          return opt.value;
        }
      }
    }
  }

  return rawText.trim();
}

/**
 * Processes an answer to the current question, applying the confirmation policy:
 * - HIGH-RISK facts: Individual confirmation required immediately
 * - LOW-RISK facts: Queued for batch confirmation at summary
 * - Missing non-required: Recorded explicitly as "Not documented"
 */
export function processAnswer(
  state: InterviewSessionState,
  questionId: string,
  rawAnswer: any,
  method: 'touch_select' | 'voice_extracted' | 'typed' = 'touch_select'
): {
  nextState: InterviewSessionState;
  confirmationRequired: boolean;
  fact: ClinicalFact;
} {
  const question = state.template.questions.find((q) => q.id === questionId);
  if (!question) {
    throw new Error(`Question ${questionId} not found in template ${state.complaintCode}`);
  }

  const finalValue = rawAnswer !== undefined && rawAnswer !== null && rawAnswer !== ''
    ? rawAnswer
    : question.required
    ? null
    : 'Not documented';

  if (question.required && (finalValue === null || finalValue === 'Not documented')) {
    throw new Error(`Field '${question.fieldKey}' is required for clinical safety`);
  }

  const isHighRisk = question.riskCategory === 'HIGH' || question.redFlagRisk === true;

  const fact: ClinicalFact = {
    id: `fact_${question.fieldKey}_${Date.now()}`,
    field: question.fieldKey,
    value: finalValue,
    category: 'hpi',
    provenance: {
      source: 'PATIENT_REPORTED',
      confidence: method === 'voice_extracted' ? 0.88 : 1.0,
      timestamp: new Date().toISOString(),
      method: method === 'voice_extracted' ? 'voice_asr' : 'touch',
      verificationState: isHighRisk ? 'unverified' : 'patient_confirmed',
      rawFragment: typeof rawAnswer === 'string' ? rawAnswer : JSON.stringify(rawAnswer),
    },
  };

  const updatedAnswers = { ...state.answers, [question.id]: finalValue, [question.fieldKey]: finalValue };

  if (isHighRisk) {
    // Individual confirmation gate
    return {
      nextState: {
        ...state,
        answers: updatedAnswers,
        pendingConfirmationFact: fact,
      },
      confirmationRequired: true,
      fact,
    };
  }

  // Low-risk fact: auto-confirm or queue for batch summary
  const updatedFacts = [...state.facts, fact];
  const nextQuestionIndex = state.currentQuestionIndex + 1;
  const isComplete = nextQuestionIndex >= state.template.questions.length;

  return {
    nextState: {
      ...state,
      currentQuestionIndex: nextQuestionIndex,
      answers: updatedAnswers,
      facts: updatedFacts,
      batchConfirmationsPending: [...state.batchConfirmationsPending, fact],
      isComplete,
    },
    confirmationRequired: false,
    fact,
  };
}

/**
 * Confirms an individual high-risk fact after patient verification
 */
export function confirmHighRiskFact(
  state: InterviewSessionState,
  confirmedValue: any
): InterviewSessionState {
  if (!state.pendingConfirmationFact) {
    return state;
  }

  const confirmedFact: ClinicalFact = {
    ...state.pendingConfirmationFact,
    value: confirmedValue,
    provenance: {
      ...state.pendingConfirmationFact.provenance,
      verificationState: 'patient_confirmed',
      timestamp: new Date().toISOString(),
    },
  };

  const nextQuestionIndex = state.currentQuestionIndex + 1;
  const isComplete = nextQuestionIndex >= state.template.questions.length;

  return {
    ...state,
    currentQuestionIndex: nextQuestionIndex,
    facts: [...state.facts, confirmedFact],
    pendingConfirmationFact: null,
    isComplete,
  };
}

/**
 * Confirms all low-risk facts in a single batch at the end of intake
 */
export function confirmBatchSummary(state: InterviewSessionState): InterviewSessionState {
  const confirmedFacts = state.facts.map((fact) => ({
    ...fact,
    provenance: {
      ...fact.provenance,
      verificationState: 'patient_confirmed' as const,
    },
  }));

  return {
    ...state,
    facts: confirmedFacts,
    batchConfirmationsPending: [],
    isComplete: true,
  };
}
