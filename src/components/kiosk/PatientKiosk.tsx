import React, { useState, useEffect, useRef } from 'react';
import { useTranslation, SupportedLanguage } from '../../i18n/LanguageContext';
import { TEN_COMPLAINTS, ComplaintStub } from '../../data/complaintsCatalog';
import {
  Shield,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Cloud,
  CloudOff,
  UserCheck,
  ChevronRight,
  Heart,
  Thermometer,
  Wind,
  Droplets,
  Crosshair,
  Zap,
  RefreshCw,
  Clock,
  ShieldAlert,
} from 'lucide-react';

interface PatientKioskProps {
  onCaseSubmitted?: (caseId: string) => void;
  onExitKiosk?: () => void;
}

export interface KioskConsentState {
  historyStorage: boolean;
  voiceProcessing: boolean;
  documentScan: boolean;
  cloudAi: boolean;
  fhirExport: boolean;
}

export const PatientKiosk: React.FC<PatientKioskProps> = ({ onCaseSubmitted, onExitKiosk }) => {
  const { language, setLanguage, t } = useTranslation();

  // Kiosk step management: 1: Language & ABHA -> 2: Consent -> 3: 10 Complaints -> 4: Review & Submit
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // ABHA Registration State
  const [abhaInput, setAbhaInput] = useState('');
  const [isVerifyingAbha, setIsVerifyingAbha] = useState(false);
  const [abhaProfile, setAbhaProfile] = useState<{
    name: string;
    abhaNumber: string;
    age: number;
    gender: string;
  } | null>(null);
  const [abhaError, setAbhaError] = useState<string | null>(null);

  // Consent Toggles
  const [consent, setConsent] = useState<KioskConsentState>({
    historyStorage: true,
    voiceProcessing: true,
    documentScan: true,
    cloudAi: true,
    fhirExport: true,
  });

  // Local-only privacy enforcement flag
  const [localOnlyMode, setLocalOnlyMode] = useState(false);

  // Complaint Selection
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintStub | null>(null);
  const [patientNotes, setPatientNotes] = useState('');

  // Kiosk Inactivity Timer (3-minute privacy guardrail)
  const [secondsIdle, setSecondsIdle] = useState(0);
  const [showInactivityModal, setShowInactivityModal] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Track user activity to reset inactivity counter
  useEffect(() => {
    const handleActivity = () => {
      setSecondsIdle(0);
      setShowInactivityModal(false);
    };

    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('keydown', handleActivity);

    idleTimerRef.current = setInterval(() => {
      setSecondsIdle((prev) => {
        if (prev >= 150) {
          setShowInactivityModal(true);
        }
        if (prev >= 180) {
          // Automatic session reset after 3 minutes idle
          handleResetSession();
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    return () => {
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      if (idleTimerRef.current) clearInterval(idleTimerRef.current);
    };
  }, []);

  const handleVerifyAbha = async () => {
    if (!abhaInput.trim()) {
      setAbhaError('Please enter an ABHA ID or PHR address');
      return;
    }

    setIsVerifyingAbha(true);
    setAbhaError(null);

    try {
      const res = await fetch('/api/kiosk/abha/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ abhaId: abhaInput }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAbhaError(data.error || 'Verification failed');
      } else {
        setAbhaProfile({
          name: data.profile.name,
          abhaNumber: data.profile.abhaNumber,
          age: data.profile.age,
          gender: data.profile.gender,
        });
      }
    } catch {
      // Offline fallback mock
      setAbhaProfile({
        name: 'Ramesh Kumar Patil',
        abhaNumber: abhaInput.trim(),
        age: 52,
        gender: 'M',
      });
    } finally {
      setIsVerifyingAbha(false);
    }
  };

  const handleResetSession = () => {
    setAbhaInput('');
    setAbhaProfile(null);
    setAbhaError(null);
    setSelectedComplaint(null);
    setPatientNotes('');
    setStep(1);
    setSecondsIdle(0);
    setShowInactivityModal(false);
  };

  const getComplaintIcon = (iconName: string) => {
    switch (iconName) {
      case 'Thermometer': return <Thermometer className="w-6 h-6 text-red-500" />;
      case 'Activity': return <Activity className="w-6 h-6 text-blue-500" />;
      case 'Heart': return <Heart className="w-6 h-6 text-rose-600" />;
      case 'ShieldAlert': return <ShieldAlert className="w-6 h-6 text-amber-500" />;
      case 'Zap': return <Zap className="w-6 h-6 text-yellow-500" />;
      case 'Wind': return <Wind className="w-6 h-6 text-teal-500" />;
      case 'RefreshCw': return <RefreshCw className="w-6 h-6 text-emerald-500" />;
      case 'Crosshair': return <Crosshair className="w-6 h-6 text-indigo-500" />;
      case 'Droplets': return <Droplets className="w-6 h-6 text-sky-500" />;
      case 'Clock': return <Clock className="w-6 h-6 text-purple-500" />;
      default: return <Activity className="w-6 h-6 text-slate-500" />;
    }
  };

  const isCloudAiActive = !localOnlyMode && consent.cloudAi;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-teal-500 selection:text-white">
      {/* Top Touch Navigation & Status Bar */}
      <header className="bg-slate-800/90 border-b border-slate-700/80 px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center font-bold text-white shadow-lg shadow-teal-900/30">
            MS
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              MedScribe AI
              <span className="text-xs uppercase bg-teal-950/80 text-teal-400 border border-teal-800/60 px-2 py-0.5 rounded-full font-semibold">
                Self-Service Kiosk
              </span>
            </h1>
            <p className="text-xs text-slate-400">{t.header.subtitle}</p>
          </div>
        </div>

        {/* Cloud AI Indicator & Language Switcher */}
        <div className="flex items-center gap-3">
          {/* Cloud AI Status Badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
              isCloudAiActive
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50'
                : 'bg-amber-950/60 text-amber-400 border-amber-800/50'
            }`}
            data-testid="cloud-ai-indicator"
          >
            {isCloudAiActive ? (
              <>
                <Cloud className="w-3.5 h-3.5" />
                <span>{t.kiosk.cloudAiIndicatorAllowed}</span>
              </>
            ) : (
              <>
                <CloudOff className="w-3.5 h-3.5" />
                <span>{t.kiosk.cloudAiIndicatorBlocked}</span>
              </>
            )}
          </div>

          {/* Touch-Friendly Language Buttons (Min 48px touch targets) */}
          <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-700">
            {(['en', 'hi', 'mr', 'es'] as SupportedLanguage[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`min-h-[48px] px-3.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center ${
                  language === lang
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                aria-label={`Switch language to ${lang}`}
              >
                {lang === 'en' ? 'English' : lang === 'hi' ? 'हिन्दी' : lang === 'mr' ? 'मराठी' : 'Español'}
              </button>
            ))}
          </div>

          {/* Reset / Start Over Button */}
          <button
            onClick={handleResetSession}
            className="min-h-[48px] px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-2 text-sm font-medium transition-all"
            title="Reset Kiosk Session"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">{t.kiosk.resetSession}</span>
          </button>

          {onExitKiosk && (
            <button
              onClick={onExitKiosk}
              className="min-h-[48px] px-3 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 text-xs"
            >
              Doctor View
            </button>
          )}
        </div>
      </header>

      {/* Main Touch Kiosk Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8">
          {[
            { num: 1, label: 'Patient Identification' },
            { num: 2, label: 'Consent & Privacy' },
            { num: 3, label: 'Select Complaint' },
            { num: 4, label: 'Confirmation' },
          ].map((item) => (
            <div key={item.num} className="flex items-center gap-2">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                  step === item.num
                    ? 'bg-teal-500 text-slate-900 ring-4 ring-teal-500/20'
                    : step > item.num
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {step > item.num ? <CheckCircle2 className="w-5 h-5" /> : item.num}
              </div>
              <span className={`text-xs font-medium hidden md:inline ${step === item.num ? 'text-teal-400' : 'text-slate-500'}`}>
                {item.label}
              </span>
              {item.num < 4 && <div className="w-4 sm:w-8 h-0.5 bg-slate-800" />}
            </div>
          ))}
        </div>

        {/* STEP 1: ABHA Registration / Quick Touch ID */}
        {step === 1 && (
          <div className="bg-slate-800/60 border border-slate-700 rounded-3xl p-6 sm:p-8 backdrop-blur shadow-2xl">
            <div className="flex items-center gap-3 mb-2">
              <UserCheck className="w-7 h-7 text-teal-400" />
              <h2 className="text-2xl font-bold text-white">{t.kiosk.abhaTitle}</h2>
            </div>
            <p className="text-sm text-slate-400 mb-6">{t.kiosk.abhaSubtitle}</p>

            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-950/40 border border-amber-800/40 rounded-full text-amber-300 text-xs mb-6 font-medium">
              <Shield className="w-3.5 h-3.5" />
              <span>{t.kiosk.mockBadge}</span>
            </div>

            {!abhaProfile ? (
              <div className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    ABHA Number / Address
                  </label>
                  <input
                    type="text"
                    value={abhaInput}
                    onChange={(e) => setAbhaInput(e.target.value)}
                    placeholder={t.kiosk.abhaPlaceholder}
                    className="w-full min-h-[56px] px-4 rounded-xl bg-slate-900 border border-slate-700 text-white text-lg font-mono placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  {abhaError && <p className="text-xs text-rose-400 mt-1">{abhaError}</p>}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={handleVerifyAbha}
                    disabled={isVerifyingAbha}
                    className="min-h-[52px] flex-1 px-6 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-base flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-900/30"
                  >
                    {isVerifyingAbha ? t.kiosk.verifying : t.kiosk.verifyAbha}
                  </button>

                  <button
                    onClick={() => {
                      setAbhaProfile({
                        name: 'Walk-In Patient',
                        abhaNumber: 'ANONYMOUS_WALKIN',
                        age: 35,
                        gender: 'Unspecified',
                      });
                      setStep(2);
                    }}
                    className="min-h-[52px] px-6 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium text-sm transition-all"
                  >
                    {t.kiosk.skipAbha}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/80 border border-teal-800/40 rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">
                    Verified Synthetic ABHA Record
                  </span>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500 block text-xs">Patient Name</span>
                    <span className="font-bold text-white text-base">{abhaProfile.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">ABHA Number</span>
                    <span className="font-mono text-slate-300">{abhaProfile.abhaNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">Age / Gender</span>
                    <span className="text-slate-300">{abhaProfile.age} yrs • {abhaProfile.gender}</span>
                  </div>
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="mt-6 w-full min-h-[52px] rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-base flex items-center justify-center gap-2 transition-all"
                >
                  <span>Proceed to Consent</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Separate Consent Toggles & Local-Only Mode */}
        {step === 2 && (
          <div className="bg-slate-800/60 border border-slate-700 rounded-3xl p-6 sm:p-8 backdrop-blur shadow-2xl">
            <div className="flex items-center justify-between gap-4 mb-2">
              <div className="flex items-center gap-3">
                <Shield className="w-7 h-7 text-teal-400" />
                <h2 className="text-2xl font-bold text-white">{t.kiosk.consentTitle}</h2>
              </div>

              {/* Local-Only Mode Master Switch */}
              <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700 px-3 py-2 rounded-xl">
                <span className="text-xs font-semibold text-slate-300">Local-Only Mode:</span>
                <button
                  onClick={() => setLocalOnlyMode(!localOnlyMode)}
                  className={`w-12 h-7 rounded-full p-1 transition-colors ${
                    localOnlyMode ? 'bg-amber-600' : 'bg-slate-700'
                  }`}
                  aria-label="Toggle Local Only Mode"
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      localOnlyMode ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
            <p className="text-sm text-slate-400 mb-6">{t.kiosk.consentSubtitle}</p>

            {localOnlyMode && (
              <div className="p-3 bg-amber-950/50 border border-amber-800/60 rounded-xl mb-6 text-amber-300 text-xs flex items-center gap-2 font-medium">
                <CloudOff className="w-4 h-4 shrink-0" />
                <span>{t.kiosk.localOnlyNotice}</span>
              </div>
            )}

            {/* Separate Consent Toggles (Each >= 48px touch height) */}
            <div className="space-y-3 mb-8">
              {[
                { key: 'historyStorage', label: t.kiosk.consentHistory, defaultChecked: true },
                { key: 'voiceProcessing', label: t.kiosk.consentVoice, defaultChecked: true },
                { key: 'documentScan', label: t.kiosk.consentDocs, defaultChecked: true },
                {
                  key: 'cloudAi',
                  label: t.kiosk.consentCloudAi,
                  defaultChecked: true,
                  disabled: localOnlyMode,
                },
                { key: 'fhirExport', label: t.kiosk.consentFhir, defaultChecked: true },
              ].map((item) => (
                <label
                  key={item.key}
                  className={`min-h-[56px] flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                    (consent as any)[item.key] && !item.disabled
                      ? 'bg-slate-900/80 border-teal-700/60 text-white'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400'
                  } ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-600'}`}
                >
                  <span className="text-sm font-medium pr-4">{item.label}</span>
                  <input
                    type="checkbox"
                    disabled={item.disabled}
                    checked={(consent as any)[item.key] && !item.disabled}
                    onChange={(e) =>
                      setConsent({ ...consent, [item.key]: e.target.checked })
                    }
                    className="w-6 h-6 rounded text-teal-600 focus:ring-teal-500 bg-slate-800 border-slate-700"
                  />
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="min-h-[52px] px-6 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium text-sm"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="min-h-[52px] flex-1 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-base flex items-center justify-center gap-2"
              >
                <span>Confirm & Choose Complaint</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: 10 Complaint Interactive Touch Selection Grid */}
        {step === 3 && (
          <div className="bg-slate-800/60 border border-slate-700 rounded-3xl p-6 sm:p-8 backdrop-blur shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-1">{t.kiosk.complaintsTitle}</h2>
            <p className="text-sm text-slate-400 mb-6">{t.kiosk.complaintsSubtitle}</p>

            {/* 10 Complaints Grid: High touch targets >= 64px, spacious gap */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 max-h-[520px] overflow-y-auto pr-1">
              {TEN_COMPLAINTS.map((comp) => {
                const isSelected = selectedComplaint?.id === comp.id;
                const titleText = comp.title[language as keyof typeof comp.title] || comp.title.en;
                const descText = comp.shortDescription[language as keyof typeof comp.shortDescription] || comp.shortDescription.en;

                return (
                  <button
                    key={comp.id}
                    onClick={() => setSelectedComplaint(comp)}
                    className={`min-h-[76px] p-4 rounded-2xl border text-left transition-all flex items-start gap-4 ${
                      isSelected
                        ? 'bg-teal-950/70 border-teal-500 ring-2 ring-teal-500/30'
                        : 'bg-slate-900/70 border-slate-700/80 hover:border-slate-600 hover:bg-slate-900'
                    }`}
                  >
                    <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700/80 shrink-0 mt-0.5">
                      {getComplaintIcon(comp.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-white text-base truncate">{titleText}</span>
                        {comp.riskLevel === 'HIGH' && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-950 text-rose-400 border border-rose-800 shrink-0">
                            High Priority
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{descText}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="min-h-[52px] px-6 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium text-sm"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!selectedComplaint}
                className={`min-h-[52px] flex-1 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
                  selectedComplaint
                    ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-900/30'
                    : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                }`}
              >
                <span>{selectedComplaint ? 'Review Intake' : 'Select a Complaint to Continue'}</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Review, Touch Notes & Submit */}
        {step === 4 && (
          <div className="bg-slate-800/60 border border-slate-700 rounded-3xl p-6 sm:p-8 backdrop-blur shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-2">Review Consultation Intake</h2>
            <p className="text-sm text-slate-400 mb-6">
              Review your information before submitting to the doctor's queue.
            </p>

            <div className="space-y-4 mb-6">
              <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-4">
                <span className="text-xs text-slate-500 uppercase font-semibold block mb-1">Patient</span>
                <span className="font-bold text-white text-base">
                  {abhaProfile?.name || 'Walk-In Patient'} • {abhaProfile?.age || 'Age 35'} • {abhaProfile?.gender || 'M'}
                </span>
                <span className="text-xs text-slate-400 block font-mono mt-0.5">
                  ID: {abhaProfile?.abhaNumber || 'ANONYMOUS_WALKIN'}
                </span>
              </div>

              <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-4">
                <span className="text-xs text-slate-500 uppercase font-semibold block mb-1">
                  Primary Chief Complaint
                </span>
                <span className="font-bold text-teal-400 text-lg">
                  {selectedComplaint?.title[language as keyof typeof selectedComplaint.title] || selectedComplaint?.title.en}
                </span>
                <p className="text-xs text-slate-300 mt-1">
                  {selectedComplaint?.shortDescription[language as keyof typeof selectedComplaint.shortDescription] || selectedComplaint?.shortDescription.en}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Additional Notes / Symptoms (Optional)
                </label>
                <textarea
                  value={patientNotes}
                  onChange={(e) => setPatientNotes(e.target.value)}
                  placeholder="e.g. Pain started 2 hours ago after climbing stairs..."
                  className="w-full min-h-[90px] p-4 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(3)}
                className="min-h-[52px] px-6 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium text-sm"
              >
                Back
              </button>
              <button
                onClick={() => {
                  const syntheticCaseId = `case_kiosk_${Date.now()}`;
                  if (onCaseSubmitted) {
                    onCaseSubmitted(syntheticCaseId);
                  }
                  handleResetSession();
                }}
                className="min-h-[52px] flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>{t.kiosk.confirmSubmission}</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Inactivity Warning Modal */}
      {showInactivityModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-slate-800 border border-amber-600 rounded-3xl p-6 max-w-md w-full text-center shadow-2xl">
            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-white mb-2">Are you still there?</h3>
            <p className="text-sm text-slate-300 mb-6">{t.kiosk.inactivityWarning}</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSecondsIdle(0);
                  setShowInactivityModal(false);
                }}
                className="min-h-[48px] flex-1 rounded-xl bg-teal-600 text-white font-bold text-sm"
              >
                Continue Consultation
              </button>
              <button
                onClick={handleResetSession}
                className="min-h-[48px] px-4 rounded-xl bg-slate-700 text-slate-300 text-sm"
              >
                Reset Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Disclaimer */}
      <footer className="py-3 px-6 text-center text-xs text-slate-500 border-t border-slate-800/80 bg-slate-900/60">
        MedScribeAI Kiosk Shell • Synthetic Patient Mode • Zero PHI Retained After Session Wipe
      </footer>
    </div>
  );
};
