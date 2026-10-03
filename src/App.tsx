import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { PatientForm } from './components/PatientForm';
import { TranscriptInput } from './components/TranscriptInput';
import { SOAPNoteView } from './components/SOAPNoteView';
import { SafetyAlertsPanel } from './components/SafetyAlertsPanel';
import { BillingCodingPanel } from './components/BillingCodingPanel';
import { PrintPrescriptionModal } from './components/PrintPrescriptionModal';
import { EncounterHistoryModal } from './components/EncounterHistoryModal';
import { ClinicAnalyticsModal } from './components/ClinicAnalyticsModal';
import { SAMPLE_SCENARIOS } from './data/sampleScenarios';
import { PatientInfo, SOAPNote, EncounterRecord } from './types';
import { Sparkles, AlertCircle, FileText, CheckCircle2, RotateCcw, HeartPulse } from 'lucide-react';

import { checkDrugInteractions } from './utils/drugInteractionChecker';
import { generateOfflineSOAPNote } from './utils/offlineLocalEngine';
import { FHIRExportModal } from './components/soap-note';

const STORAGE_KEY = 'medscribe_lite_encounters_v1';

export default function App() {
  // Navigation view state: 'landing' | 'workstation'
  const [currentView, setCurrentView] = useState<'landing' | 'workstation'>('landing');

  // Offline local model mode state
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);

  // Default patient info
  const defaultPatientInfo: PatientInfo = {
    name: 'Kwame Mensah',
    age: 28,
    sex: 'Male',
    medicalHistory: 'No chronic illness. Prior episode of malaria 2 years ago.',
    currentMedications: 'Paracetamol 500mg PRN',
    knownAllergies: 'NKDA',
    encounterType: 'Acute Unscheduled Visit',
    clinicLocation: 'Sub-District Health Center',
  };

  const [patientInfo, setPatientInfo] = useState<PatientInfo>(defaultPatientInfo);
  const [transcript, setTranscript] = useState<string>(SAMPLE_SCENARIOS[0].transcript);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(SAMPLE_SCENARIOS[0].id);

  const [soapNote, setSoapNote] = useState<SOAPNote | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals state
  const [activeModal, setActiveModal] = useState<'history' | 'analytics' | 'print' | 'fhir' | null>(null);

  // Saved encounters history in localStorage
  const [encounters, setEncounters] = useState<EncounterRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save encounters array to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(encounters));
    } catch (e) {
      console.error('Failed to save encounters to localStorage:', e);
    }
  }, [encounters]);

  // Load a sample scenario
  const handleSelectScenario = (scenarioId: string) => {
    const scenario = SAMPLE_SCENARIOS.find((s) => s.id === scenarioId);
    if (!scenario) return;

    setSelectedScenarioId(scenario.id);
    setPatientInfo(scenario.patientInfo);
    setTranscript(scenario.transcript);
    setErrorMessage(null);
  };

  // Reset Form
  const handleResetForm = () => {
    setPatientInfo({
      name: '',
      age: '',
      sex: 'Male',
      medicalHistory: '',
      currentMedications: '',
      knownAllergies: 'NKDA',
      encounterType: 'Primary Care Consultation',
      clinicLocation: 'Primary Care Clinic',
    });
    setTranscript('');
    setSelectedScenarioId('');
    setSoapNote(null);
    setErrorMessage(null);
  };

  // Generate SOAP Note via Gemini API or Offline Local Engine
  const handleGenerateSOAP = async (audioData?: { base64: string; mimeType: string }) => {
    setIsGenerating(true);
    setErrorMessage(null);

    // If Offline Mode is active, bypass backend network call completely
    if (isOfflineMode) {
      setTimeout(() => {
        const offlineNote = generateOfflineSOAPNote(patientInfo, transcript);
        setSoapNote(offlineNote);
        setIsGenerating(false);
        const soapElem = document.getElementById('soap-result-anchor');
        if (soapElem) {
          soapElem.scrollIntoView({ behavior: 'smooth' });
        }
      }, 400);
      return;
    }

    try {
      const response = await fetch('/api/medscribe/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientInfo,
          transcript,
          audioBase64: audioData?.base64,
          audioMimeType: audioData?.mimeType,
        }),
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson.error || `Server responded with status ${response.status}`);
      }

      const generatedData: SOAPNote = await response.json();
      setSoapNote(generatedData);

      // Auto-scroll to SOAP result
      setTimeout(() => {
        const soapElem = document.getElementById('soap-result-anchor');
        if (soapElem) {
          soapElem.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
    } catch (err: any) {
      console.warn('Backend API unavailable. Activating Offline Local Engine fallback:', err);
      const fallbackNote = generateOfflineSOAPNote(patientInfo, transcript);
      setSoapNote(fallbackNote);
      setErrorMessage('Cloud API unavailable. Offline Local Clinical Engine activated.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save current encounter to localStorage history
  const handleSaveEncounter = () => {
    if (!soapNote) return;

    const newRecord: EncounterRecord = {
      id: `enc-${Date.now()}`,
      timestamp: new Date().toISOString(),
      patientInfo,
      transcript,
      soapNote,
      status: 'finalized',
    };

    setEncounters((prev) => [newRecord, ...prev]);
    alert('Encounter saved successfully to clinic local records!');
  };

  // Load an existing encounter from history
  const handleLoadEncounterFromHistory = (record: EncounterRecord) => {
    setPatientInfo(record.patientInfo);
    setTranscript(record.transcript);
    setSoapNote(record.soapNote);
    setActiveModal(null);
  };

  // Delete an encounter from history
  const handleDeleteEncounter = (id: string) => {
    setEncounters((prev) => prev.filter((e) => e.id !== id));
  };

  // Clear all encounters
  const handleClearAllEncounters = () => {
    if (confirm('Are you sure you want to clear all saved encounter records?')) {
      setEncounters([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  if (currentView === 'landing') {
    return <LandingPage onLaunchWorkstation={() => setCurrentView('workstation')} />;
  }

  return (
    <div id="app-root" className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation Bar */}
      <Header
        onOpenHistory={() => setActiveModal('history')}
        onOpenAnalytics={() => setActiveModal('analytics')}
        onSelectSampleScenario={() => {
          // Cycle or open first scenario
          handleSelectScenario(SAMPLE_SCENARIOS[0].id);
        }}
        onNavigateToLanding={() => setCurrentView('landing')}
        totalEncountersCount={encounters.length}
        safetyAlertsCount={soapNote?.safety_alerts?.length || 0}
        isOfflineMode={isOfflineMode}
        onToggleOfflineMode={() => setIsOfflineMode((prev) => !prev)}
      />

      {/* Main Workspace Body */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner / Low Resource Primary Care Intro */}
        <div id="intro-banner" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
              <h2 className="font-bold text-base text-slate-800 tracking-tight">Clinical Documentation & Safety Engine</h2>
            </div>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              Transform consultation transcripts into verified SOAP notes, ICD-10/CPT coding, and safety alerts. Built for low-resource primary care clinics.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs text-blue-700 bg-blue-50 px-3 py-2 rounded-xl border border-blue-100 font-semibold">
            <HeartPulse className="w-4 h-4 text-blue-600 shrink-0" />
            <span>100% Fact Extraction Guardrails</span>
          </div>
        </div>

        {/* Error Alert Message */}
        {errorMessage && (
          <div id="error-banner" className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl text-xs flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span className="font-medium">{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-700 hover:text-red-900 font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Top Grid: Patient Information Form */}
        <PatientForm
          patientInfo={patientInfo}
          onChange={setPatientInfo}
          onReset={handleResetForm}
        />

        {/* Transcript Input Workspace */}
        <TranscriptInput
          transcript={transcript}
          onChangeTranscript={setTranscript}
          onSelectScenario={handleSelectScenario}
          onGenerateSOAP={handleGenerateSOAP}
          isGenerating={isGenerating}
          selectedScenarioId={selectedScenarioId}
          isOfflineMode={isOfflineMode}
        />

        {/* Anchor point for smooth auto-scroll */}
        <div id="soap-result-anchor"></div>

        {/* SOAP Note Output & Safety Panels */}
        {soapNote || isGenerating ? (
          <div className="space-y-6 pt-2">
            {/* Safety Alerts Panel */}
            {soapNote && (() => {
              const dbAlerts = checkDrugInteractions(
                soapNote.plan?.prescriptions || [],
                `${patientInfo.currentMedications || ''} ${soapNote.subjective?.current_medications?.join(' ') || ''}`,
                patientInfo.medicalHistory || '',
                `${patientInfo.knownAllergies || ''} ${soapNote.subjective?.allergies?.join(' ') || ''}`
              );

              const existingAlerts = soapNote.safety_alerts || [];
              const combinedAlerts = [...existingAlerts];
              dbAlerts.forEach((dbAlert) => {
                if (!combinedAlerts.some((a) => a.message === dbAlert.message)) {
                  combinedAlerts.push(dbAlert);
                }
              });

              return (
                <SafetyAlertsPanel
                  safetyAlerts={combinedAlerts}
                  meta={soapNote.meta || { uncertainty_flagged: false, time_saved_estimate_minutes: 12 }}
                />
              );
            })()}

            {/* SOAP Note View */}
            <SOAPNoteView
              soapNote={soapNote}
              isGenerating={isGenerating}
              isOfflineMode={isOfflineMode}
              onUpdateSOAP={(updated) => setSoapNote(updated)}
              onOpenPrintPrescription={() => setActiveModal('print')}
              onOpenFHIR={() => setActiveModal('fhir')}
              onSaveEncounter={handleSaveEncounter}
            />

            {/* Billing & Coding Suggestions Panel */}
            {soapNote && (
              <BillingCodingPanel
                billingSuggestions={soapNote.billing_suggestions || { icd_10_codes: [], cpt_codes: [] }}
              />
            )}
          </div>
        ) : (
          <div id="empty-state-card" className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Clinical Safety Copilot Ready</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Enter or dictate a patient consultation transcript above, or click one of the pre-loaded clinical scenarios (e.g. Malaria, Diabetes, Pediatrics) to generate verified SOAP notes with automatic drug interaction and clinical safety guardrail auditing.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer id="app-footer" className="border-t border-slate-200 bg-white py-4 mt-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© MedScribe Lite • Primary Care AI Clinical Assistant</p>
          <p className="text-[11px] text-slate-400 font-medium">Powered by Gemini 3.6 Flash • Bento Grid Edition</p>
        </div>
      </footer>

      {/* Modals with AnimatePresence exit animations */}
      <AnimatePresence>
        {activeModal === 'print' && soapNote && (
          <PrintPrescriptionModal
            key="print-modal"
            patientInfo={patientInfo}
            soapNote={soapNote}
            onClose={() => setActiveModal(null)}
          />
        )}

        {activeModal === 'fhir' && soapNote && (
          <FHIRExportModal
            key="fhir-modal"
            patientInfo={patientInfo}
            soapNote={soapNote}
            onClose={() => setActiveModal(null)}
          />
        )}

        {activeModal === 'history' && (
          <EncounterHistoryModal
            key="history-modal"
            encounters={encounters}
            onLoadEncounter={handleLoadEncounterFromHistory}
            onDeleteEncounter={handleDeleteEncounter}
            onClearAll={handleClearAllEncounters}
            onClose={() => setActiveModal(null)}
          />
        )}

        {activeModal === 'analytics' && (
          <ClinicAnalyticsModal
            key="analytics-modal"
            encounters={encounters}
            onClose={() => setActiveModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
