import type { PageView } from '../../App';
import { API_URL } from '../../lib/api';
import {
  Search, RefreshCw, CheckCircle, XCircle, FileCheck,
  AlertTriangle, ChevronRight, Bot, ShieldCheck, ShieldAlert, ShieldX
} from 'lucide-react';
import { useState, useEffect } from 'react';
import ReactConfetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { supabase } from '../../lib/supabaseClient';
import { AdminSidebar } from '../../components/layout/AdminSidebar';

interface AdminVerificationProps {
  onNavigate: (view: PageView) => void;
  onLogout: () => void;
}

export function AdminVerification({ onNavigate, onLogout }: AdminVerificationProps) {
  const [merchants, setMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [currentTime, setCurrentTime] = useState(new Date());

  const [selectedDocUrl, setSelectedDocUrl] = useState<string | null>(null);
  const [selectedEmployer, setSelectedEmployer] = useState<any | null>(null);

  const [docBlobUrl, setDocBlobUrl] = useState<string | null>(null);
  
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize();

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    setDocBlobUrl(selectedDocUrl);
  }, [selectedDocUrl]);


  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const filteredMerchants = merchants.filter(merchant => {
    const bName = merchant.business_name || '';
    const rNum = merchant.registration_number || '';
    const matchesSearch = bName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rNum.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || merchant.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getAiAnalysis = (merchant: any) => {
    try {
      if (!merchant.ai_analysis) return null;
      return typeof merchant.ai_analysis === 'string' ? JSON.parse(merchant.ai_analysis) : merchant.ai_analysis;
    } catch { return null; }
  };

  const AiConfidenceBadge = ({ merchant }: { merchant: any }) => {
    const ai = getAiAnalysis(merchant);
    if (!ai || ai.error) return <span className="text-xs text-gray-400 italic">No AI data</span>;
    const score = ai.confidence || 0;
    if (score >= 85 && ai.recommendation === 'auto_approve') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
          <ShieldCheck className="w-3 h-3" />{score}% Auto
        </span>
      );
    } else if (score >= 50) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
          <ShieldAlert className="w-3 h-3" />{score}% Review
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
          <ShieldX className="w-3 h-3" />{score}% Flag
        </span>
      );
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${API_URL}/api/admin/verifications`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setMerchants(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReject = async (id: string, employerId: string, newStatus: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${API_URL}/api/admin/verifications/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          verification_id: id,
          employer_id: employerId,
          status: newStatus
        })
      });
      if (res.ok) {
        if (newStatus === 'approved') {
          showToast("Employer verified successfully!", 'success');
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 4000);
        } else {
          showToast("Employer rejected.", 'info');
        }
        fetchVerifications();
      } else {
        const err = await res.json();
        showToast(err.message || "Error processing request", 'error');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBF0] flex">
      {showConfetti && <ReactConfetti width={width} height={height} recycle={false} numberOfPieces={500} gravity={0.15} />}
      <AdminSidebar activeView="admin-verification" onNavigate={onNavigate} onLogout={onLogout} />

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[999] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg text-white font-medium text-sm transition-all duration-300 ${toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
          }`}>
          <span>{toast.msg}</span>
          <button onClick={() => setToast(null)} className="ml-1 opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 px-4 md:px-8 py-4 pt-16 lg:pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">

              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Dashboard</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <span className="text-[#F5C518] font-medium">Employer Verification</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 md:p-8">
          {/* Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#1A1A1A] mb-1">Employer Approvals</h1>
            <p className="text-gray-500">Verify Indian business entities and licenses. As of {currentTime.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}.</p>
          </div>

          {/* Stats */}
          <div className="flex gap-4 mb-8">
            <div className="bg-white rounded-2xl p-5 card-shadow flex items-center gap-4 min-w-[180px]">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <FileCheck className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">TOTAL REQUESTS</p>
                <p className="text-2xl font-bold text-[#1A1A1A]">{filteredMerchants.length}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 card-shadow flex items-center gap-4 min-w-[180px]">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">PENDING REVIEW</p>
                <p className="text-2xl font-bold text-[#1A1A1A]">{merchants.filter(m => m.status === 'pending').length}</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl p-4 card-shadow mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by Entity Name or Reg Number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F5C518]"
                />
              </div>
              <button
                onClick={() => {
                  const nextStatus = statusFilter === 'pending' ? 'approved' : statusFilter === 'approved' ? 'rejected' : statusFilter === 'rejected' ? 'all' : 'pending';
                  setStatusFilter(nextStatus);
                }}
                className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                title="Click to cycle status filter"
              >
                <span className="text-sm text-gray-600 capitalize">Status: {statusFilter}</span>
                <ChevronRight className="w-4 h-4 rotate-90 text-gray-400" />
              </button>
              <button onClick={fetchVerifications} className="w-12 h-12 border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors relative group">
                <RefreshCw className="w-5 h-5 text-gray-400 group-hover:rotate-180 transition-transform duration-500" />
              </button>
            </div>
          </div>

          {/* Merchants Table */}
          <div className="bg-white rounded-2xl card-shadow overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <div className="col-span-3">Entity Details</div>
              <div className="col-span-2">Contact User</div>
              <div className="col-span-1">Date</div>
              <div className="col-span-1">Docs</div>
              <div className="col-span-2">AI Analysis</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {/* Table Rows */}
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading requests...</div>
            ) : filteredMerchants.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No verification requests found.</div>
            ) : filteredMerchants.map((merchant) => (
              <div key={merchant.id} className="grid grid-cols-12 gap-4 px-6 py-5 border-t border-gray-100 items-center">
                <div className="col-span-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-400 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {merchant.business_name ? merchant.business_name.substring(0, 2).toUpperCase() : 'B'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-[#1A1A1A] truncate">{merchant.business_name}</p>
                      <p className="text-xs text-gray-400 truncate">Reg: {merchant.registration_number}</p>
                      <button onClick={() => setSelectedEmployer(merchant)} className="mt-1 text-xs text-blue-500 hover:text-blue-700 underline text-left">
                        View full details
                      </button>
                    </div>
                  </div>
                </div>
                <div className="col-span-2 min-w-0">
                  <p className="font-medium text-[#1A1A1A] truncate">{merchant.profiles?.full_name || 'N/A'}</p>
                  <p className="text-xs text-gray-400 truncate">{merchant.profiles?.email || 'No email'}</p>
                  <p className="text-xs text-gray-400 truncate">{merchant.profiles?.phone || 'No phone'}</p>
                </div>
                <div className="col-span-1">
                  <p className="text-xs text-[#1A1A1A]">
                    {new Date(merchant.submitted_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="col-span-1">
                  {merchant.document_url ? (
                    <button onClick={() => setSelectedDocUrl(merchant.document_url)} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-xs">
                      <FileCheck className="w-3 h-3 text-blue-500" />
                      <span className="text-blue-600">View</span>
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400">None</span>
                  )}
                </div>
                <div className="col-span-2">
                  <AiConfidenceBadge merchant={merchant} />
                </div>
                <div className="col-span-1">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${merchant.status === 'pending'
                    ? 'bg-orange-100 text-orange-700'
                    : merchant.status === 'approved'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                    }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${merchant.status === 'pending' ? 'bg-orange-500'
                      : merchant.status === 'approved' ? 'bg-green-500' : 'bg-red-500'
                      }`}></span>
                    {merchant.status.toUpperCase()}
                  </span>
                </div>
                <div className="col-span-2 flex items-center gap-2 justify-end">
                  {merchant.status === 'pending' ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleApproveReject(merchant.id, merchant.employer_id, 'approved')}
                        className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center hover:bg-green-200 transition-colors"
                        title="Approve"
                      >
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </button>
                      <button
                        onClick={() => handleApproveReject(merchant.id, merchant.employer_id, 'rejected')}
                        className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center hover:bg-red-200 transition-colors"
                        title="Reject"
                      >
                        <XCircle className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 italic font-medium whitespace-nowrap">Processed</span>
                  )}
                </div>
              </div>
            ))}

            {/* Pagination Controls Hidden, we show all filtered */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">Showing <span className="font-medium">{filteredMerchants.length}</span> results</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-8 py-6 border-t border-gray-100">
          <p className="text-sm text-gray-400 text-center">
            © 2026 AfterBell. All rights reserved. Made with <span className="text-red-500">♥</span> in India.
          </p>
        </footer>
        {/* View Document Modal */}
        {selectedDocUrl && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <h3 className="font-bold text-[#1A1A1A] flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-blue-500" />
                  Proof Document
                </h3>
                <button onClick={() => setSelectedDocUrl(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <XCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4 relative">
                {!docBlobUrl ? (
                  <p className="text-gray-500">Loading document...</p>
                ) : selectedDocUrl.startsWith('data:image/') || docBlobUrl.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                  <img src={docBlobUrl} alt="Uploaded Proof" className="max-w-full max-h-full object-contain" />
                ) : (
                  <iframe src={docBlobUrl} className="w-full h-full border-0 bg-white" title="Document"></iframe>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Employer Details Modal */}
        {selectedEmployer && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <h3 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {selectedEmployer.business_name ? selectedEmployer.business_name.substring(0, 2).toUpperCase() : 'B'}
                  </div>
                  Employer Details
                </h3>
                <button onClick={() => setSelectedEmployer(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <XCircle className="w-6 h-6 text-gray-500" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Business Name</p>
                    <p className="font-semibold text-[#1A1A1A] text-lg">{selectedEmployer.business_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Contact User</p>
                    <p className="font-semibold text-[#1A1A1A] text-lg">{selectedEmployer.profiles?.full_name || 'N/A'}</p>
                    <p className="text-sm text-gray-500">{selectedEmployer.profiles?.email || 'No email'}</p>
                    <p className="text-sm text-gray-500">{selectedEmployer.profiles?.phone || 'No phone'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Registration Number</p>
                    <p className="font-semibold text-[#1A1A1A]">{selectedEmployer.registration_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Submission Date</p>
                    <p className="font-semibold text-[#1A1A1A]">{new Date(selectedEmployer.submitted_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Status</p>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold mt-1 ${selectedEmployer.status === 'pending'
                      ? 'bg-orange-100 text-orange-700'
                      : selectedEmployer.status === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                      }`}>
                      {selectedEmployer.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* AI Analysis Report */}
                {(() => {
                  const ai = getAiAnalysis(selectedEmployer);
                  if (!ai || ai.error) return null;
                  const score = ai.confidence || 0;
                  const barColor = score >= 85 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500';
                  return (
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-5 border border-indigo-100 mb-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Bot className="w-5 h-5 text-indigo-600" />
                        <p className="text-sm font-bold text-indigo-800">AI Verification Report</p>
                        <span className={`ml-auto px-3 py-1 rounded-full text-xs font-bold text-white ${barColor}`}>
                          {ai.recommendation === 'auto_approve' ? '✅ Auto-Approved' : ai.recommendation === 'likely_reject' ? '❌ Suspicious' : '⚠️ Needs Review'}
                        </span>
                      </div>

                      {/* Confidence Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600">Confidence Score</span>
                          <span className="font-bold text-indigo-700">{score}/100</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className={`h-2.5 rounded-full ${barColor} transition-all duration-500`} style={{ width: `${score}%` }}></div>
                        </div>
                      </div>

                      {/* Extracted Details */}
                      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                        <div className="bg-white/70 p-3 rounded-lg">
                          <p className="text-xs text-gray-500">Document Type</p>
                          <p className="font-semibold text-[#1A1A1A]">{ai.document_type || 'Unknown'}</p>
                        </div>
                        <div className="bg-white/70 p-3 rounded-lg">
                          <p className="text-xs text-gray-500">Extracted Name</p>
                          <p className={`font-semibold ${!ai.extracted_name || ai.extracted_name.toLowerCase() === 'not found' ? 'text-red-500 italic' : 'text-[#1A1A1A]'}`}>
                            {ai.extracted_name || 'Not found'}
                          </p>
                        </div>
                        <div className="bg-white/70 p-3 rounded-lg">
                          <p className="text-xs text-gray-500">Extracted ID</p>
                          <p className={`font-semibold ${!ai.extracted_id || ai.extracted_id.toLowerCase() === 'not found' ? 'text-red-500 italic' : 'text-[#1A1A1A]'}`}>
                            {ai.extracted_id || 'Not found'}
                          </p>
                        </div>
                        <div className="bg-white/70 p-3 rounded-lg">
                          <p className="text-xs text-gray-500">Name Match</p>
                          <p className={`font-semibold ${ai.name_match === true ? 'text-green-600' : ai.name_match === false ? 'text-red-600' : 'text-gray-400'}`}>
                            {ai.name_match === true ? '✅ Match' : ai.name_match === false ? '❌ Mismatch' : 'N/A'}
                          </p>
                        </div>
                      </div>

                      {/* ID Format Check */}
                      {ai.id_format_check && (
                        <div className="bg-white/70 p-3 rounded-lg mb-4 text-sm">
                          <p className="text-xs text-gray-500 mb-1">ID Format Validation</p>
                          <div className={`flex items-center gap-1.5 font-semibold ${ai.id_format_check.type === 'unknown' || ai.id_format_check.type === 'Generic ID' || !ai.id_format_check.valid ? 'text-orange-600' : 'text-green-600'}`}>
                            {ai.id_format_check.type === 'unknown' || ai.id_format_check.type === 'Generic ID' || !ai.id_format_check.valid ? (
                              <ShieldAlert className="w-4 h-4" />
                            ) : (
                              <ShieldCheck className="w-4 h-4" />
                            )}
                            {ai.id_format_check.details}
                          </div>
                        </div>
                      )}

                      {/* Red Flags */}
                      {ai.red_flags && ai.red_flags.length > 0 && (
                        <div className="bg-red-50 p-3 rounded-lg border border-red-100 mb-4">
                          <p className="text-xs font-bold text-red-700 mb-2">⚠️ Red Flags ({ai.red_flags.length})</p>
                          <ul className="space-y-1">
                            {ai.red_flags.map((flag: string, i: number) => (
                              <li key={i} className="text-sm text-red-600 flex items-start gap-1">
                                <span className="mt-0.5">•</span> {flag}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* AI Summary */}
                      {ai.summary && (
                        <p className="text-sm text-gray-600 italic">🤖 "{ai.summary}"</p>
                      )}
                    </div>
                  );
                })()}

                {selectedEmployer.document_url && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-6">
                    <p className="text-sm font-semibold mb-3">Uploaded Documents</p>
                    <button
                      onClick={() => {
                        setSelectedEmployer(null);
                        setSelectedDocUrl(selectedEmployer.document_url);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors w-full justify-center"
                    >
                      <FileCheck className="w-5 h-5 text-blue-500" />
                      <span className="font-medium text-blue-600">View Uploaded Proof</span>
                    </button>
                  </div>
                )}

                {selectedEmployer.status === 'pending' && (
                  <div className="bg-orange-50 rounded-xl p-5 border border-orange-100 mt-6">
                    <p className="text-sm font-semibold text-orange-800 mb-3">Pending Actions</p>
                    <div className="flex gap-4">
                      <button
                        onClick={() => {
                          handleApproveReject(selectedEmployer.id, selectedEmployer.employer_id, 'approved');
                          setSelectedEmployer(null);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-semibold"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Approve Verify
                      </button>
                      <button
                        onClick={() => {
                          handleApproveReject(selectedEmployer.id, selectedEmployer.employer_id, 'rejected');
                          setSelectedEmployer(null);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors font-semibold"
                      >
                        <XCircle className="w-5 h-5" />
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
