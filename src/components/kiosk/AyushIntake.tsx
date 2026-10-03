import React, { useState } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import {
  PRAKRITI_QUESTIONS,
  AGNI_QUESTIONS,
  evaluateAyushAssessment,
  AyushScoreResult,
  AYUSH_REVIEW_STATUS,
  AYUSH_DISCLAIMER,
} from '../../data/ayush/prakritiAgniRules';
import {
  Flower2,
  Flame,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  AlertCircle,
  ShieldAlert,
  Info,
} from 'lucide-react';

interface AyushIntakeProps {
  onComplete?: (result: AyushScoreResult, responses: Record<string, string>) => void;
  onCancel?: () => void;
}

export const AyushIntake: React.FC<AyushIntakeProps> = ({ onComplete, onCancel }) => {
  const { language } = useTranslation();
  const currentLang = (language === 'hi' || language === 'mr') ? language : 'en';

  const [activeTab, setActiveTab] = useState<'prakriti' | 'agni' | 'results'>('prakriti');
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [scoreResult, setScoreResult] = useState<AyushScoreResult | null>(null);

  const activeQuestions = activeTab === 'prakriti' ? PRAKRITI_QUESTIONS : AGNI_QUESTIONS;
  const currentQ = activeQuestions[currentQuestionIdx];

  const handleSelectOption = (questionId: string, optionId: string) => {
    setResponses((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleNext = () => {
    if (currentQuestionIdx < activeQuestions.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
    } else {
      if (activeTab === 'prakriti') {
        setActiveTab('agni');
        setCurrentQuestionIdx(0);
      } else {
        const evaluated = evaluateAyushAssessment(responses);
        setScoreResult(evaluated);
        setActiveTab('results');
      }
    }
  };

  const handlePrev = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx((prev) => prev - 1);
    } else {
      if (activeTab === 'agni') {
        setActiveTab('prakriti');
        setCurrentQuestionIdx(PRAKRITI_QUESTIONS.length - 1);
      } else if (onCancel) {
        onCancel();
      }
    }
  };

  const calculateProgress = () => {
    const totalQ = PRAKRITI_QUESTIONS.length + AGNI_QUESTIONS.length;
    const answeredCount = Object.keys(responses).length;
    return Math.round((answeredCount / totalQ) * 100);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6" data-testid="ayush-intake-module">
      {/* Top Review Status Banner - Non-Negotiable */}
      <div className="mb-6 p-4 rounded-2xl bg-amber-950/50 border border-amber-600/50 text-amber-200">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-bold text-amber-300 text-sm tracking-wide uppercase">
                AYUSH Clinical Intake Prototype
              </span>
              <span
                data-testid="bams-review-badge"
                className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-900/80 text-rose-200 border border-rose-600"
              >
                {AYUSH_REVIEW_STATUS}
              </span>
            </div>
            <p className="text-xs text-amber-300/90 leading-relaxed font-sans">
              {AYUSH_DISCLAIMER}
            </p>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 backdrop-blur shadow-2xl">
        {/* Navigation Tabs Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-900/40 border border-teal-700/50 text-teal-300">
              {activeTab === 'prakriti' ? <Flower2 className="w-6 h-6" /> : <Flame className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <span>
                  {activeTab === 'prakriti'
                    ? 'Prakriti Assessment (प्रकृति)'
                    : activeTab === 'agni'
                    ? 'Agni Assessment (अग्नि)'
                    : 'AYUSH Intake Summary'}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-amber-900/60 text-amber-300 border border-amber-700/60 font-mono">
                  {AYUSH_REVIEW_STATUS}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeTab === 'prakriti'
                  ? 'Phenotypic dosha assessment (Vata, Pitta, Kapha) per Charaka Samhita'
                  : activeTab === 'agni'
                  ? 'Metabolic digestive fire evaluation per Charaka Grahani Chikitsa'
                  : 'Synthesized provisional tally for the treating physician'}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 font-mono">Progress: {calculateProgress()}%</span>
            <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-teal-500 transition-all duration-300"
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>
          </div>
        </div>

        {/* QUESTION DISPLAY SCREEN */}
        {activeTab !== 'results' && currentQ && (
          <div>
            <div className="mb-6">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-semibold uppercase tracking-wider text-teal-400">
                  Question {currentQuestionIdx + 1} of {activeQuestions.length} ({activeTab.toUpperCase()})
                </span>
                <span className="text-slate-500 italic">{currentQ.clinicalRationale}</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">
                {currentQ.title[currentLang] || currentQ.title.en}
              </h3>
            </div>

            {/* Answer Choices: Touch-first targets >= 56px */}
            <div className="space-y-3 mb-8">
              {currentQ.options.map((opt) => {
                const isSelected = responses[currentQ.id] === opt.id;
                const optText = opt.label[currentLang] || opt.label.en;

                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(currentQ.id, opt.id)}
                    className={`w-full min-h-[58px] p-4 rounded-2xl border text-left transition-all flex items-start justify-between gap-4 ${
                      isSelected
                        ? 'bg-teal-950/70 border-teal-400 ring-2 ring-teal-400/30 text-white'
                        : 'bg-slate-850/80 border-slate-700/80 text-slate-200 hover:border-slate-500 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-base sm:text-lg leading-relaxed">{optText}</p>
                      {opt.classicalReference && (
                        <span className="text-[11px] text-teal-400 font-mono block mt-1">
                          Ref: {opt.classicalReference}
                        </span>
                      )}
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${
                        isSelected
                          ? 'border-teal-400 bg-teal-500 text-slate-950'
                          : 'border-slate-600 bg-slate-800'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-4 h-4" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Button Actions */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={handlePrev}
                className="min-h-[50px] px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                onClick={handleNext}
                disabled={!responses[currentQ.id]}
                className={`min-h-[50px] px-8 rounded-xl font-bold text-base flex items-center gap-2 transition-all ${
                  responses[currentQ.id]
                    ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-900/40'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <span>
                  {currentQuestionIdx === activeQuestions.length - 1 && activeTab === 'agni'
                    ? 'Calculate Assessment'
                    : 'Next Question'}
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* RESULTS SCREEN */}
        {activeTab === 'results' && scoreResult && (
          <div data-testid="ayush-results-screen">
            <div className="bg-slate-850/60 border border-slate-700 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase font-semibold text-teal-400 tracking-wider">
                  Provisional Tally Breakdown
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-950 text-rose-300 border border-rose-800">
                  {AYUSH_REVIEW_STATUS}
                </span>
              </div>

              {/* Prakriti Breakdown */}
              <div className="mb-6 p-4 rounded-xl bg-slate-900/90 border border-slate-750">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white text-base flex items-center gap-2">
                    <Flower2 className="w-5 h-5 text-teal-400" />
                    Dominant Prakriti
                  </span>
                  <span className="text-xs text-amber-400 font-mono">[PENDING BAMS REVIEW]</span>
                </div>
                <div className="text-xl font-extrabold text-teal-300 mb-3">
                  {scoreResult.prakriti.dominantDosha}
                </div>
                <div className="grid grid-cols-3 gap-3 text-center text-xs font-mono">
                  <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">
                    <span className="text-slate-400 block">Vata</span>
                    <span className="text-base font-bold text-white">{scoreResult.prakriti.tally.vata} / 5</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">
                    <span className="text-slate-400 block">Pitta</span>
                    <span className="text-base font-bold text-white">{scoreResult.prakriti.tally.pitta} / 5</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">
                    <span className="text-slate-400 block">Kapha</span>
                    <span className="text-base font-bold text-white">{scoreResult.prakriti.tally.kapha} / 5</span>
                  </div>
                </div>
              </div>

              {/* Agni Breakdown */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-750">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white text-base flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-400" />
                    Digestive Capacity (Agni)
                  </span>
                  <span className="text-xs text-amber-400 font-mono">[PENDING BAMS REVIEW]</span>
                </div>
                <div className="text-xl font-extrabold text-orange-300 mb-3">
                  {scoreResult.agni.primaryAgni}
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
                  <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">
                    <span className="text-slate-400 block">Vishama</span>
                    <span className="text-sm font-bold text-white">{scoreResult.agni.tally.vishama}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">
                    <span className="text-slate-400 block">Tikshna</span>
                    <span className="text-sm font-bold text-white">{scoreResult.agni.tally.tikshna}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">
                    <span className="text-slate-400 block">Manda</span>
                    <span className="text-sm font-bold text-white">{scoreResult.agni.tally.manda}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">
                    <span className="text-slate-400 block">Sama</span>
                    <span className="text-sm font-bold text-white">{scoreResult.agni.tally.sama}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-800">
              <button
                onClick={() => {
                  setActiveTab('prakriti');
                  setCurrentQuestionIdx(0);
                }}
                className="min-h-[50px] px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Re-take Intake</span>
              </button>

              <button
                onClick={() => {
                  if (onComplete) {
                    onComplete(scoreResult, responses);
                  }
                }}
                className="min-h-[50px] flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Save AYUSH Assessment to Case</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
