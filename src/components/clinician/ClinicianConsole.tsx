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
  LogIn,
  LogOut,
  Lock,
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
  const [token, setToken] = useState<string>(() => {
    if (clinicianToken && clinicianToken !== 'mock_clinician_token') return clinicianToken;
    return typeof window !== 'undefined' ? sessionStorage.getItem('medscribe_clinician_token') || '' : '';
  });
  const [displayName, setDisplayName] = useState<string>(() => {
    return typeof window !== 'undefined' ? sessionStorage.getItem('medscribe_clinician_name') || 'Dr. Primary Care' : 'Dr. Primary Care';
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (clinicianToken && clinicianToken !== 'mock_clinician_token') return true;
    return typeof window !== 'undefined' ? !!sessionStorage.getItem('medscribe_clinician_token') : false;
  });

  // Login form state
  const [loginUsername, setLoginUsername] = useState('doctor');
  const [loginPassword, setLoginPassword] = useState('medscribe2026');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [queue, setQueue] = useState<QueueItemSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCase, setSelectedCase] = useState<ClinicalCase | null>(null);
  const [isLoadingCase, setIsLoadingCase] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const fetchQueue = async (activeToken = token) => {
    if (!activeToken) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/clinician/queue', {
        headers: {
          Authorization: `Bearer ${activeToken}`,
        },
      });
      if (res.status === 401) {
        setIsAuthenticated(false);
        throw new Error('Session invalid or expired. Please sign in with your clinician credentials.');
      }
      if (!res.ok) {
        throw new Error(`Queue fetch failed with status ${res.status}`);
      }
      const data = await res.json();
      setQueue(data.queue || []);
      setIsAuthenticated(true);
    } catch (err: any) {
      console.warn('Queue fetch error:', err.message);
      setError(err.message || 'Unable to fetch live clinician queue.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchQueue(token);
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const res = await fetch('/api/clinician/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid clinician credentials');
      }
      setToken(data.token);
      setDisplayName(data.displayName || 'Dr. Primary Care');
      setIsAuthenticated(true);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('medscribe_clinician_token', data.token);
        sessionStorage.setItem('medscribe_clinician_name', data.displayName || 'Dr. Primary Care');
      }
      fetchQueue(data.token);
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setToken('');
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('medscribe_clinician_token');
      sessionStorage.removeItem('medscribe_clinician_name');
    }
  };

  const handleSelectCase = async (caseId: string) => {
    setIsLoadingCase(true);
    setError(null);
    try {
      const res = await fetch(`/api/clinician/cases/${caseId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
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

  if (!isAuthenticated) {
    return (
      <div className="w-full max-w-md mx-auto my-12 px-4" data-testid="clinician-login-card">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-lg space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md shadow-blue-500/20">
              <Stethoscope className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Clinician Workstation Login</h2>
            <p className="text-xs text-slate-500">
              Access the clinical priority queue, review patient intakes, and sign SOAP consultation records
            </p>
          </div>

          {/* Demo Credentials Quick Pill */}
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between text-blue-900 font-semibold">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Demo Account</span>
              </span>
              <button
                type="button"
                id="btn-autofill-demo-credentials"
                onClick={() => {
                  setLoginUsername('doctor');
                  setLoginPassword('medscribe2026');
                }}
                className="text-[11px] text-blue-700 hover:text-blue-900 underline font-bold cursor-pointer"
              >
                1-Click Autofill
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-700 bg-white/80 p-2 rounded-xl border border-blue-100">
              <div>User: <span className="font-bold text-blue-900">doctor</span></div>
              <div>Pass: <span className="font-bold text-blue-900">medscribe2026</span></div>
            </div>
          </div>

          {loginError && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Clinician Username
              </label>
              <input
                type="text"
                id="input-clinician-username"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                placeholder="e.g. doctor"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                id="input-clinician-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                placeholder="••••••••••••"
              />
            </div>

            <button
              type="submit"
              id="btn-clinician-submit-login"
              disabled={isLoggingIn}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In as Medical Officer</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={onDirectDoctorConsultation}
              className="text-xs text-slate-500 hover:text-slate-800 underline transition-colors"
            >
              ← Skip to Direct Doctor Consultation (Offline)
            </button>
          </div>
        </div>
      </div>
    );
  }

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

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs text-emerald-800 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{displayName}</span>
            <button
              type="button"
              id="btn-clinician-logout"
              onClick={handleLogout}
              className="ml-2 text-slate-400 hover:text-rose-600 transition-colors p-1"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => fetchQueue(token)}
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
