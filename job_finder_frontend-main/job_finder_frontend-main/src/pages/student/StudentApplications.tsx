import type { PageView } from '../../App';
import { API_URL } from '../../lib/api';
import {
  Bell, Search, MapPin, Filter, ChevronRight, Plus, Calendar, Clock, Video, CheckCircle, XCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import ReactConfetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { supabase } from '../../lib/supabaseClient';
import { StudentSidebar } from '../../components/layout/StudentSidebar';
import { NotificationBell } from '../../components/layout/NotificationBell';

interface StudentApplicationsProps {
  onNavigate: (view: PageView) => void;
  onLogout: () => void;
}

export function StudentApplications({ onNavigate, onLogout }: StudentApplicationsProps) {
  const [activeTab, setActiveTab] = useState<'applied' | 'interview' | 'accepted' | 'rejected'>('applied');

  const [appsData, setAppsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const { width, height } = useWindowSize();

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${API_URL}/api/applications/student`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setAppsData(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInterview = async (applicationId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${API_URL}/api/applications/${applicationId}/accept_interview`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        showToast('Interview accepted! Added to your schedule 🎉', 'success');
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 4000);
        fetchApplications();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to accept interview', 'error');
      }
    } catch (e) {
      showToast('Network error. Please try again.', 'error');
    }
  };

  const handleDeclineInterview = async (applicationId: string) => {
    if (!window.confirm('Are you sure you want to decline this interview?')) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${API_URL}/api/applications/${applicationId}/decline_interview`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        showToast('Interview declined.', 'success');
        fetchApplications();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to decline interview', 'error');
      }
    } catch (e) {
      showToast('Network error. Please try again.', 'error');
    }
  };

  const handleWithdraw = async (applicationId: string) => {
    if (!window.confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${API_URL}/api/applications/${applicationId}/withdraw`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        showToast('Application withdrawn successfully.', 'success');
        fetchApplications();
      } else {
        const err = await res.json();
        showToast(err.message || err.error || 'Failed to withdraw', 'error');
      }
    } catch (e) {
      showToast('Network error. Please try again.', 'error');
    }
  };

  const applications = {
    applied: appsData.filter(a => ['pending', 'Pending'].includes(a.status)),
    interview: appsData.filter(a => ['interview', 'Interview'].includes(a.status)),
    accepted: appsData.filter(a => ['accepted', 'Accepted', 'approved', 'Approved', 'Confirmed', 'Completed'].includes(a.status)),
    rejected: appsData.filter(a => ['rejected', 'Rejected', 'Cancelled', 'No-show'].includes(a.status)),
  };

  const currentApplications = applications[activeTab];

  const getAppCardProps = (app: any) => {
    let statusLabel = app.status;
    let statusColor = 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300';
    let icon = '💼';
    let iconBg = 'bg-blue-100 dark:bg-blue-900/20';

    if (['pending', 'Pending'].includes(app.status)) {
      statusColor = 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400';
      statusLabel = 'Pending Review';
    } else if (['interview', 'Interview'].includes(app.status)) {
      statusColor = 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400';
      statusLabel = '📅 Interview Scheduled';
      iconBg = 'bg-blue-100 dark:bg-blue-900/40';
      icon = '📅';
    } else if (['accepted', 'Accepted', 'approved', 'Approved', 'Confirmed', 'Completed'].includes(app.status)) {
      statusColor = 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400';
      statusLabel = app.status;
      iconBg = 'bg-green-100 dark:bg-green-900/40';
      icon = '🎉';
    } else if (['rejected', 'Rejected', 'Cancelled', 'No-show'].includes(app.status)) {
      statusColor = 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400';
      statusLabel = app.status;
      iconBg = 'bg-red-100 dark:bg-red-900/40';
      icon = '❌';
    }

    return { statusLabel, statusColor, icon, iconBg };
  };

  return (
    <div className="min-h-screen bg-[#FFFBF0] dark:bg-[#121212] flex transition-colors duration-200 relative">
      {showConfetti && (
        <ReactConfetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.15}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999, pointerEvents: 'none' }}
        />
      )}
      {toast && (
        <div className={`fixed top-6 right-6 z-[999] px-5 py-3.5 rounded-xl shadow-lg text-white font-medium text-sm transition-all duration-300 ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {toast.msg}
        </div>
      )}
      <StudentSidebar activeView="student-applications" onNavigate={onNavigate} onLogout={onLogout} />

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        {/* Header */}
        <header className="bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40 px-4 md:px-8 py-4 pt-16 lg:pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 w-full overflow-hidden">
              <div className="flex items-center gap-6 overflow-x-auto hide-scrollbar whitespace-nowrap max-w-full pb-1">
                <button
                  onClick={() => onNavigate('student-jobs')}
                  className="text-gray-600 dark:text-gray-400 hover:text-[#1A1A1A] dark:hover:text-white font-medium transition-colors flex-shrink-0"
                >
                  Find Jobs
                </button>
                <button
                  onClick={() => onNavigate('student-applications')}
                  className="text-[#F5C518] font-semibold border-b-2 border-[#F5C518] pb-1 flex-shrink-0"
                >
                  My Applications
                </button>
                <button
                  onClick={() => onNavigate('student-saved')}
                  className="text-gray-600 dark:text-gray-400 hover:text-[#1A1A1A] dark:hover:text-white font-medium transition-colors flex-shrink-0"
                >
                  Saved
                </button>
              </div>
            </div>
            <NotificationBell />
          </div>
        </header>

        {/* Content */}
        <div className="p-4 md:p-8">
          <p className="text-gray-500 dark:text-gray-400 mb-8">Track your progress for local part-time opportunities.</p>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            {/* Tabs */}
            <div className="flex gap-2 w-full overflow-x-auto hide-scrollbar pb-2">
              {(['applied', 'interview', 'accepted', 'rejected'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-shrink-0 px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${activeTab === tab
                    ? 'bg-[#F5C518] text-[#1A1A1A]'
                    : 'bg-white dark:bg-[#2D2D2D] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab ? 'bg-[#1A1A1A]/20 dark:bg-black/20' : 'bg-gray-200 dark:bg-gray-700'
                    }`}>
                    {applications[tab].length}
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={() => onNavigate('student-jobs')}
              className="btn-primary flex items-center gap-2 flex-shrink-0 w-full md:w-auto justify-center"
            >
              <Search className="w-4 h-4" />
              Find More Jobs
            </button>
          </div>

          {/* Applications Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full py-12 text-center text-gray-500 dark:text-gray-400">Loading your applications...</div>
            ) : currentApplications.length === 0 ? (
              <div className="col-span-full py-12 text-center text-gray-500 dark:text-gray-400">No {activeTab} applications found.</div>
            ) : currentApplications.map((app: any) => {
              const { statusLabel, statusColor, icon, iconBg } = getAppCardProps(app);
              const jobDetails = app.jobs || {};
              const companyName = jobDetails.company_name || jobDetails.profiles?.full_name || 'Unknown Company';
              const avatarUrl = jobDetails.image_url || jobDetails.profiles?.avatar_url;

              return (
                <div key={app.id} className="bg-white dark:bg-[#2D2D2D] rounded-2xl p-6 card-shadow hover:card-shadow-hover border border-transparent dark:border-gray-800 transition-all duration-300">
                  <div className="flex items-start gap-4 mb-4">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                      <div className={`w-14 h-14 ${iconBg} rounded-xl flex items-center justify-center text-3xl flex-shrink-0`}>
                        {icon}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[#1A1A1A] dark:text-white break-words whitespace-pre-wrap">{jobDetails.title || 'Unknown Job'}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 break-words whitespace-pre-wrap">{companyName}</p>
                    </div>
                  </div>

                  {/* Job Paused Banner */}
                  {(jobDetails.status === 'closed' || jobDetails.status === 'paused') && (
                    <div className="mb-2 flex items-center gap-1.5 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg text-xs font-semibold">
                      ⏸ This job is currently paused by the employer
                    </div>
                  )}

                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 ${statusColor}`}>
                    {statusLabel}
                  </span>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      {jobDetails.location || 'Remote/Campus'}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-green-600 dark:text-green-400 font-semibold">{jobDetails.wage || 'Competitive'}</span>
                    </div>
                  </div>

                  {/* Interview Accept/Decline Buttons */}
                  {['interview', 'Interview'].includes(app.status) && (
                    <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/40 rounded-2xl">
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <span className="font-semibold text-blue-800 dark:text-blue-300">Interview Proposed</span>
                      </div>
                      <p className="text-sm text-blue-700 dark:text-blue-400 mb-3">
                        Your employer has scheduled an interview. Check your Schedule for details, then accept below!
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleAcceptInterview(app.id)}
                          className="flex-1 py-2.5 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-600/20"
                        >
                          <CheckCircle className="w-4 h-4" /> Accept
                        </button>
                        <button
                          onClick={() => handleDeclineInterview(app.id)}
                          className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                        >
                          <XCircle className="w-4 h-4" /> Decline
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                    <span className="text-sm text-gray-400 dark:text-gray-500">Applied {new Date(app.created_at).toLocaleDateString()}</span>
                    <div className="flex items-center gap-3">
                      {['pending', 'Pending'].includes(app.status) && (
                        <button
                          onClick={() => handleWithdraw(app.id)}
                          className="text-red-500 hover:text-red-600 font-semibold text-sm transition-colors"
                        >
                          Withdraw
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="text-[#F5C518] font-semibold text-sm flex items-center gap-1 hover:underline"
                      >
                        View Details
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Keep Applying Card */}
            {activeTab === 'applied' && (
              <div className="bg-[#1A1A1A] rounded-2xl p-6 text-white flex flex-col items-center justify-center text-center min-h-[280px] card-shadow border border-transparent dark:border-gray-800">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
                  <Plus className="w-8 h-8 text-[#F5C518]" />
                </div>
                <h3 className="text-xl font-bold mb-2">Keep Applying!</h3>
                <p className="text-gray-400 text-sm mb-6">
                  Increase your chances by applying to more positions near campus.
                </p>
                <button
                  onClick={() => onNavigate('student-jobs')}
                  className="btn-primary"
                >
                  Browse New Jobs
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <footer className="px-8 py-6 border-t border-gray-100 dark:border-gray-800 mt-auto">
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center">
            © 2026 AfterBell. Helping students earn and learn.
          </p>
        </footer>
      </main>

      {/* Application Details Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedApp(null)}
          ></div>
          <div className="bg-white dark:bg-[#2D2D2D] border border-transparent dark:border-gray-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative z-10 p-8">
            <button
              onClick={() => setSelectedApp(null)}
              className="absolute top-6 right-6 p-2 bg-gray-100 dark:bg-[#1A1A1A] hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <span className="sr-only">Close</span>
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-2xl font-bold text-[#1A1A1A] dark:text-white mb-2">{selectedApp.jobs?.title || 'Unknown Job'}</h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium mb-6">{selectedApp.jobs?.company_name || selectedApp.jobs?.profiles?.full_name || 'Unknown Company'}</p>

            <div className="space-y-6">
              <div className="p-4 bg-gray-50 dark:bg-[#1A1A1A] rounded-2xl flex flex-col sm:flex-row gap-6">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-1 ${getAppCardProps(selectedApp).statusColor}`}>
                    {getAppCardProps(selectedApp).statusLabel}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Wage</p>
                  <p className="text-[#1A1A1A] dark:text-white font-semibold mt-1">₹{selectedApp.jobs?.wage}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Location</p>
                  <p className="text-[#1A1A1A] dark:text-white font-semibold mt-1">{selectedApp.jobs?.location}</p>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-[#1A1A1A] dark:text-white mb-3">Job Description</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-gray-800 p-6 rounded-2xl shadow-sm">
                  {selectedApp.jobs?.description || 'No description provided.'}
                </p>
              </div>

              {selectedApp.status === 'pending' && (
                <div className="bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 p-4 rounded-xl text-sm mt-4">
                  Your application is currently being reviewed by the employer. You will be notified once a decision is made.
                </div>
              )}
              {(selectedApp.jobs?.status === 'closed' || selectedApp.jobs?.status === 'paused') && (
                <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 p-4 rounded-xl text-sm mt-4 flex items-start gap-2">
                  <span className="text-lg">⏸</span>
                  <span><strong>Job Paused:</strong> The employer has temporarily paused this job listing. Your application is still saved and will be reviewed when the job reopens.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


