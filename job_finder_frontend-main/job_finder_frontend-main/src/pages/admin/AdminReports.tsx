import type { PageView } from '../../App';
import { API_URL } from '../../lib/api';
import {
  AlertTriangle, Flag, Eye, Trash2, CheckCircle, ChevronRight, X, Briefcase
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { AdminSidebar } from '../../components/layout/AdminSidebar';

interface AdminReportsProps {
  onNavigate: (view: PageView) => void;
  onLogout: () => void;
}

export function AdminReports({ onNavigate, onLogout }: AdminReportsProps) {
  const [activeTab, setActiveTab] = useState<'all-jobs' | 'reported'>('all-jobs');
  const [jobsData, setJobsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [reportsData, setReportsData] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const resJobs = await fetch(`${API_URL}/api/admin/jobs`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (resJobs.ok) {
        const json = await resJobs.json();
        setJobsData(json.data || []);
      }

      if (session) {
        const res = await fetch(`${API_URL}/api/admin/reports`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        if (res.ok) {
          const json = await res.json();
          setReportsData(json.data || []);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!jobId) return;
    if (!confirm("Are you sure you want to delete this job and all its applications?")) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${API_URL}/api/admin/jobs/${jobId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        setJobsData(prev => prev.filter(j => j.id !== jobId));
        if (selectedJob?.id === jobId) setSelectedJob(null);
        showToast("Job deleted successfully", "success");
      } else {
        const err = await res.json();
        showToast(err.message || 'Failed to delete job', "error");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredJobs = jobsData;

  const reports = {
    'all-jobs': filteredJobs,
    'reported': reportsData,
  };

  const currentReports = reports[activeTab];

  return (
    <div className="min-h-screen bg-[#FFFBF0] flex">
      <AdminSidebar activeView="admin-reports" onNavigate={onNavigate} onLogout={onLogout} />

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
                <span className="text-[#F5C518] font-medium">Job Reports</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 md:p-8">
          {/* Title */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#1A1A1A] mb-1">Reports & Moderation</h1>
              <p className="text-gray-500">Review and take action on reported content and user behavior. As of {currentTime.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-xl">
                <Briefcase className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">{jobsData.length} Total Jobs</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8">
            {(['all-jobs', 'reported'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 ${activeTab === tab
                  ? 'bg-[#F5C518] text-[#1A1A1A]'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
              >
                {tab === 'all-jobs' && 'All Job Posts'}
                {tab === 'reported' && 'Reported Jobs'}
              </button>
            ))}
          </div>

          {/* Reports Table */}
          <div className="bg-white rounded-2xl card-shadow overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {activeTab === 'all-jobs' && (
                <>
                  <div className="col-span-4">Job Details</div>
                  <div className="col-span-3">Company</div>
                  <div className="col-span-2">Location & Pay</div>
                  <div className="col-span-1">Status</div>
                  <div className="col-span-2">Actions</div>
                </>
              )}
              {activeTab === 'reported' && (
                <>
                  <div className="col-span-4">Job Details</div>
                  <div className="col-span-2">Reports</div>
                  <div className="col-span-3">Reason</div>
                  <div className="col-span-1">Severity</div>
                  <div className="col-span-2">Actions</div>
                </>
              )}
            </div>

            {/* Table Rows */}
            {loading ? (
              <div className="p-12 text-center text-gray-500">Loading jobs...</div>
            ) : currentReports.map((job: any) => (
              <div key={job.id} className="grid grid-cols-12 gap-4 px-6 py-5 border-t border-gray-100 items-center">
                {activeTab === 'all-jobs' && (
                  <>
                    <div className="col-span-4">
                      <p className="font-medium text-[#1A1A1A]">{job.title || 'Unknown Job'}</p>
                      <p className="text-xs text-gray-400">Posted: {new Date(job.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="col-span-3">
                      <p className="text-sm font-medium text-gray-700">{job.company_name || 'Unknown Company'}</p>
                      <p className="text-xs text-gray-500">{job.profiles?.full_name || 'N/A'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-[#1A1A1A]">₹{job.wage}/hr</p>
                      <p className="text-xs text-gray-400 truncate">{job.location}</p>
                    </div>
                    <div className="col-span-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700`}>
                        Active
                      </span>
                    </div>
                    <div className="col-span-2 flex items-center gap-2">
                      <button
                        onClick={() => setSelectedJob(job)}
                        className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center hover:bg-blue-200 transition-colors"
                      >
                        <Eye className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteJob(job.id)}
                        className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center hover:bg-red-200 transition-colors"
                        title="Delete Job"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </>
                )}
                {activeTab === 'reported' && (
                  <>
                    <div className="col-span-4">
                      <p className="font-medium text-[#1A1A1A]">{job.jobs?.title || 'Unknown Job'}</p>
                      <p className="text-sm text-gray-500">{job.jobs?.company_name || 'Unknown Company'}</p>
                      <p className="text-xs text-gray-400">Date: {new Date(job.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <Flag className="w-4 h-4 text-red-500" />
                        <span className="font-medium text-[#1A1A1A]">{job.status || 'Reported'}</span>
                      </div>
                    </div>
                    <div className="col-span-3 text-sm text-gray-600 truncate" title={job.reason}>{job.reason || 'Suspicious Activity'}</div>
                    <div className="col-span-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700`}>
                        High
                      </span>
                    </div>
                    <div className="col-span-2 flex items-center gap-2">
                      <button
                        onClick={() => handleDeleteJob(job.job_id)}
                        className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center hover:bg-red-200 transition-colors"
                        title="Delete Job"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* Empty State */}
            {currentReports.length === 0 && (
              <div className="px-6 py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">No jobs to display</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="px-8 py-6 border-t border-gray-100">
          <p className="text-sm text-gray-400 text-center">
            © 2026 AfterBell. All rights reserved. Made with <span className="text-red-500">♥</span> in India.
          </p>
        </footer>
      </main>

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setSelectedJob(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#1A1A1A] pr-8">{selectedJob.title}</h2>
              <p className="text-[#1A1A1A] font-medium">{selectedJob.company_name}</p>
            </div>

            <div className="space-y-4 text-sm text-gray-600 bg-gray-50 rounded-xl p-4">
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="font-medium text-gray-500">Location:</span>
                <span className="font-semibold text-[#1A1A1A]">{selectedJob.location}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="font-medium text-gray-500">Wage:</span>
                <span className="font-semibold text-[#1A1A1A]">₹{selectedJob.wage}/hr</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="font-medium text-gray-500">Job Type:</span>
                <span className="font-semibold text-[#1A1A1A] uppercase">{selectedJob.type || 'Standard'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-500">Date Posted:</span>
                <span className="font-semibold text-[#1A1A1A]">{new Date(selectedJob.created_at).toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-4 bg-gray-50 p-4 rounded-xl">
              <span className="font-medium text-gray-500 block mb-1 text-sm">Description:</span>
              <p className="text-sm text-[#1A1A1A] whitespace-pre-wrap max-h-40 overflow-y-auto">
                {selectedJob.description}
              </p>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleDeleteJob(selectedJob.id);
                }}
                className="px-4 py-2 bg-red-100 text-red-600 font-medium hover:bg-red-200 rounded-xl transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Job
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
