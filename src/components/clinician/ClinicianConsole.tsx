import React, { useState, useEffect } from 'react';
import { ClinicalCase, RedFlagAlert, ProvenanceSource } from '../../types/clinicalCase';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Clock,
  FileText,
  User,
  ArrowRight,
  Stethoscope,
  RefreshCw,
  Search,
  Filter,
  Eye,
  FileCheck,
  Flower2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface QueueItemSummary {
  id: string;
  status: string;
  patientName: string;
  age?: number | string;
  sex?: string;
  chiefComplaint: string;
  language: string;
  priority: number;
  priorityLabel: 'EMERGENCY' | 'URGENT' | 'WARNING' | 'NORMAL';
  hasRedFlags: boolean;
  redFlagsCount: number;
  redFlags: RedFlagAlert[];
  hasDocuments: boolean;
  hasAyush: boolean;
  ayushPrakriti?: string;
  createdAt: string;
}

interface ClinicianConsoleProps {
  onLoadCaseIntoWorkstation: (clinicalCase: ClinicalCase) => void;
  onDirectDoctorConsultation: () => void;
  clinicianToken?: string;
}

export const ClinicianConsole: React.FC<ClinicianConsoleProps> = ({
  onLoadCaseIntoWorkstation,
  onDirectDoctorConsultation,
  clinicianToken = 'mock_clinician_token',
}) => {
  const [queue, setQueue] = useState<QueueItemSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCase, setSelectedCase] = useState<ClinicalCase | null>(null);
  const [isLoadingCase, setIsLoadingCase] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const fetchQueue = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/clinician/queue', {
        headers: {
          Authorization: `Bearer ${clinicianToken}`,
        },
      });
      if (!res.ok) {
        throw new Error(`Queue fetch failed with status ${res.status}`);
      }
      const data = await res.json();
      setQueue(data.queue || []);
    } catch (err: any) {
      console.warn('Queue fetch error:', err.message);
      setError('Unable to fetch live clinician queue. Using local memory cases.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleSelectCase = async (caseId: string) => {
    setIsLoadingCase(true);
    setError(null);
    try {
      const res = await fetch(`/api/clinician/cases/${caseId}`, {
        headers: {
          Authorization: `Bearer ${clinicianToken}`,
        },
      });
      if (!res.ok) {
        throw new Error(`Case fetch failed with status ${res.status}`);
      }
      const data = await res.json();
      setSelectedCase(data.case);
    } catch (err: any) {
      setError(`Failed to load case ${caseId}: ${err.message}`);
    } finally {
      setIsLoadingCase(false);
    }
  };

  const getPriorityBadge = (priorityLabel: string) => {
    switch (priorityLabel) {
      case 'EMERGENCY':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-600 text-white animate-pulse flex items-center gap-1 shadow-sm">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Priority 1: STAT Emergency</span>
          </span>
        );
      case 'URGENT':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500 text-slate-950 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Priority 2: Urgent</span>
          </span>
        );
      case 'WARNING':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-yellow-100 text-yellow-900 border border-yellow-300">
            Priority 3: Warning
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wider bg-slate-100 text-slate-700">
            Routine
          </span>
        );
    }
  };

  const getProvenanceBadge = (source?: ProvenanceSource, method?: string) => {
    switch (source) {
      case 'PATIENT_REPORTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-teal-100 text-teal-800 border border-teal-300">
            PATIENT REPORTED ({method || 'touch'})
          </span>
        );
      case 'DOCUMENT_EXTRACTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-indigo-100 text-indigo-800 border border-indigo-300">
            DOCUMENT OCR
          </span>
        );
      case 'CLINICIAN_OBSERVED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-purple-100 text-purple-800 border border-purple-300">
            CLINICIAN OBSERVED
          </span>
        );
      case 'CLINICIAN_VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
            CLINICIAN VERIFIED
          </span>
        );
      case 'AI_GENERATED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-300">
            AI DRAFT
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium uppercase bg-slate-100 text-slate-600">
            {source || 'UNSPECIFIED'}
          </span>
        );
    }
  };

  const filteredQueue = queue.filter((item) => {
    const matchesSearch =
      item.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.chiefComplaint.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'redflags' && item.hasRedFlags) ||
      item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6" data-testid="clinician-console">
      {/* Top Banner & Quick Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Clinician Triage & Consultation Console</h1>
              <p className="text-xs text-slate-500">
                Priority triage queue, deterministic red flags, clinical fact provenance, and preloaded SOAP workflow
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={fetchQueue}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 transition-all"
            title="Refresh Queue"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={onDirectDoctorConsultation}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-xs"
          >
            <span>Direct Doctor-Only Flow</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main 2-Column Layout: Left Queue (1/3) + Right Inspector (2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Priority Queue List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span>Patient Queue</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-mono">
                  {filteredQueue.length}
                </span>
              </h2>

              {/* Status Filter */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                    statusFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter('redflags')}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                    statusFilter === 'redflags' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  Alerts
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search patient, complaint, ID..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
              />
            </div>

            {/* Queue List Items */}
            <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
              {filteredQueue.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  {isLoading ? 'Loading patient queue...' : 'No patients in queue.'}
                </div>
              ) : (
                filteredQueue.map((item) => {
                  const isSelected = selectedCase?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectCase(item.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 shadow-xs'
                          : item.priority === 1
                          ? 'border-rose-300 bg-rose-50/40 hover:border-rose-400'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-bold text-slate-900 text-sm truncate">{item.patientName}</span>
                        {getPriorityBadge(item.priorityLabel)}
                      </div>

                      <div className="text-xs text-slate-600 mb-2 font-medium">
                        {item.chiefComplaint}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-100">
                        <span>
                          {item.age ? `${item.age} yrs` : ''} {item.sex ? `• ${item.sex}` : ''} • Lang: {item.language}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {item.hasDocuments && (
                            <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-mono text-[10px] border border-indigo-200">
                              DOCS
                            </span>
                          )}
                          {item.hasAyush && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-mono text-[10px] border border-emerald-200">
                              AYUSH
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Case Inspector & Doctor Workspace Preloader */}
        <div className="lg:col-span-7 space-y-4">
          {!selectedCase ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-700 text-base mb-1">Select a Patient Case</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Click any case from the priority queue on the left to inspect red flags, clinical facts with provenance, and preload into the doctor workstation.
              </p>
            </div>
          ) : (
            <div className="space-y-4" data-testid="case-inspector">
              {/* Emergency Red-Flag Banner (if active) */}
              {(selectedCase.intake?.redFlags?.length || 0) > 0 && (
                <div className="bg-rose-50 border-2 border-rose-500 rounded-2xl p-4 shadow-sm" data-testid="red-flag-banner">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5 animate-bounce" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-rose-900 text-sm uppercase tracking-wide">
                          Red-Flag Clinical Alerts Detected ({selectedCase.intake.redFlags.length})
                        </span>
                        <span className="px-2 py-0.5 rounded bg-rose-200 text-rose-950 font-mono text-[11px] font-bold">
                          STAT ACTION
                        </span>
                      </div>
                      <div className="space-y-2 mt-2">
                        {selectedCase.intake.redFlags.map((rf, idx) => (
                          <div key={idx} className="bg-white/80 border border-rose-200 rounded-xl p-3 text-xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-rose-900">{rf.title}</span>
                              <span className="text-[10px] font-mono text-slate-500">
                                Rule: {rf.ruleId} (v{rf.ruleVersion || '1.0.0'})
                              </span>
                            </div>
                            <p className="text-slate-700 text-xs mb-1.5">{rf.description}</p>
                            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-rose-100">
                              <span className="font-semibold text-rose-800">
                                Action Required: {rf.actionRequired}
                              </span>
                              <span className="text-slate-400">{new Date(rf.triggeredAt).toLocaleTimeString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Patient Header & Workstation Action */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      Case ID: {selectedCase.id}
                    </span>
                    <h2 className="text-xl font-black text-slate-900">{selectedCase.patient.name.value}</h2>
                    <p className="text-xs text-slate-500 font-medium">
                      {selectedCase.patient.age.value} years • {selectedCase.patient.sex.value} • Intake Status: {selectedCase.status}
                    </p>
                  </div>

                  <button
                    data-testid="btn-preload-workstation"
                    onClick={() => onLoadCaseIntoWorkstation(selectedCase)}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <Sparkles className="w-4 h-4 fill-white" />
                    <span>Open in Doctor SOAP Workspace</span>
                  </button>
                </div>

                {/* Patient-Ready Summary Section */}
                <div className="pt-4 space-y-4">
                  {/* Chief Complaint */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Chief Complaint</span>
                      {getProvenanceBadge(
                        selectedCase.intake?.chiefComplaint?.provenance?.source,
                        selectedCase.intake?.chiefComplaint?.provenance?.method
                      )}
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800 text-sm">
                      {selectedCase.intake?.chiefComplaint?.value}
                    </div>
                  </div>

                  {/* Symptom Onset & History */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-500">Onset / Duration</span>
                        {getProvenanceBadge(selectedCase.intake?.symptomOnset?.provenance?.source)}
                      </div>
                      <span className="font-bold text-slate-800">
                        {selectedCase.intake?.symptomOnset?.value || 'Not documented'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-500">Medical History</span>
                        {getProvenanceBadge(selectedCase.intake?.pastMedicalHistory?.provenance?.source)}
                      </div>
                      <span className="font-bold text-slate-800">
                        {selectedCase.intake?.pastMedicalHistory?.value || 'None reported'}
                      </span>
                    </div>
                  </div>

                  {/* Document Prescriptions (if any) */}
                  {(selectedCase.documents?.length || 0) > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Uploaded Clinical Documents ({selectedCase.documents.length})
                        </span>
                        {getProvenanceBadge('DOCUMENT_EXTRACTED', 'ocr')}
                      </div>
                      <div className="space-y-2">
                        {selectedCase.documents.map((doc) => (
                          <div key={doc.id} className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-200 text-xs">
                            <div className="flex items-center justify-between font-bold text-indigo-900 mb-1">
                              <span>{doc.fileName} ({doc.documentType})</span>
                              <span className="text-[10px] font-mono text-slate-500">{doc.uploadedAt}</span>
                            </div>
                            {doc.extractedPrescriptions && doc.extractedPrescriptions.length > 0 && (
                              <div className="mt-1 text-slate-700">
                                <span className="font-semibold text-indigo-800 block text-[11px] mb-0.5">
                                  Extracted Rx Items:
                                </span>
                                <ul className="list-disc list-inside space-y-0.5">
                                  {doc.extractedPrescriptions.map((rx, idx) => (
                                    <li key={idx}>
                                      {rx.medicationName} {rx.dosage} ({rx.frequency})
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AYUSH Assessment (if present) */}
                  {selectedCase.intake?.ayushAssessment && (
                    <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-300 text-xs">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                          <Flower2 className="w-4 h-4 text-emerald-700" />
                          <span>AYUSH Intake (Thin Slice)</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-950 border border-amber-400">
                          PENDING BAMS REVIEW
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-800 font-medium">
                        <div>
                          <span className="text-slate-500 block text-[11px]">Dominant Prakriti:</span>
                          <span className="font-bold text-emerald-900">
                            {selectedCase.intake.ayushAssessment.prakriti?.value || 'Unassessed'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Agni (Digestive Fire):</span>
                          <span className="font-bold text-emerald-900">
                            {selectedCase.intake.ayushAssessment.agni?.value || 'Unassessed'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
