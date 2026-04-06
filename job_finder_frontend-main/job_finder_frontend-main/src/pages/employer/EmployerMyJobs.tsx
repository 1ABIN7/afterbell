import type { PageView } from '../../App';
import { API_URL } from '../../lib/api';
import {
  Bell, MapPin, IndianRupee, Clock, Eye, Edit, Trash2, Search, Briefcase, Users, X, Save
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { EmployerSidebar } from '../../components/layout/EmployerSidebar';
import { NotificationBell } from '../../components/layout/NotificationBell';

interface EmployerMyJobsProps {
  onNavigate: (view: PageView) => void;
  onLogout?: () => void;
}

export function EmployerMyJobs({ onNavigate, onLogout }: EmployerMyJobsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // View modal
  const [viewJob, setViewJob] = useState<any | null>(null);

  // Edit modal
  const [editJob, setEditJob] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    title: '', location: '', description: '', wage: '', requirements: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${API_URL}/api/employer/jobs`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setMyJobs(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteJob = async (jobId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${API_URL}/api/jobs/${jobId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        fetchJobs();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleStatus = async (jobId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'open' ? 'closed' : 'open';
    // Optimistically update UI immediately
    setMyJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: nextStatus } : j));
    setTogglingIds(prev => new Set(prev).add(jobId));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { showToast('Not logged in', 'error'); return; }
      const res = await fetch(`${API_URL}/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        showToast(nextStatus !== 'open' ? 'Job paused successfully' : 'Job re-opened successfully', 'success');
      } else {
        const err = await res.json();
        // Revert optimistic update on failure
        setMyJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: currentStatus } : j));
        showToast(err.error || 'Failed to update job status', 'error');
      }
    } catch (e) {
      // Revert on network error
      setMyJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: currentStatus } : j));
      showToast('Network error — please try again', 'error');
    } finally {
      setTogglingIds(prev => { const s = new Set(prev); s.delete(jobId); return s; });
    }
  };

  const openEditModal = (job: any) => {
    setEditJob(job);
    setEditForm({
      title: job.title || '',
      location: job.location || '',
      description: job.description || '',
      wage: job.wage || '',
      requirements: job.requirements || '',
    });
    setSaveMsg('');
  };

  const handleSaveEdit = async () => {
    if (!editJob) return;
    setIsSaving(true);
    setSaveMsg('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${API_URL}/api/jobs/${editJob.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        setSaveMsg('✅ Job updated successfully!');
        fetchJobs();
        setTimeout(() => { setEditJob(null); setSaveMsg(''); }, 1200);
      } else {
        const err = await res.json();
        setSaveMsg(`❌ ${err.error || 'Failed to update'}`);
      }
    } catch (e) {
      setSaveMsg('❌ Network error');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredJobs = myJobs.filter(job => {
    const matchesSearch = (job.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.location || '').toLowerCase().includes(searchQuery.toLowerCase());
    const isPaused = job.status === 'closed' || job.status === 'paused';
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'open' && job.status === 'open') ||
      (filterStatus === 'paused' && isPaused);
    return matchesSearch && matchesStatus;
  });

  const activeJobs = myJobs.filter(j => j.status === 'open').length;
  const totalApplicants = myJobs.reduce((sum, j) => sum + (j.applications?.[0]?.count || 0), 0);

  return (
    <div className="min-h-screen bg-[#FFFBF0] dark:bg-[#121212] flex transition-colors duration-200">
      <EmployerSidebar activeView="employer-myjobs" onNavigate={onNavigate} onLogout={onLogout} />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[999] px-5 py-3 rounded-xl shadow-lg text-white font-medium text-sm transition-all duration-300 ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}>
          {toast.msg}
        </div>
      )}

      {/* ── VIEW MODAL ── */}
      {viewJob && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all" onClick={() => setViewJob(null)}>
          <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-2xl w-full max-w-lg p-8 relative border border-transparent dark:border-gray-800" onClick={e => e.stopPropagation()}>
            <button onClick={() => setViewJob(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-2xl font-bold text-[#1A1A1A] dark:text-white">{viewJob.title}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${viewJob.status === 'open'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                }`}>
                {viewJob.status === 'open' ? 'OPEN' : 'PAUSED'}
              </span>
            </div>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300 mb-6">
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#F5C518]" /><span>{viewJob.location || 'Not specified'}</span></div>
              <div className="flex items-center gap-2"><IndianRupee className="w-4 h-4 text-[#F5C518]" /><span>₹{viewJob.wage} / day</span></div>
              <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-[#F5C518]" /><span className="capitalize">{viewJob.job_type || 'Part-time'}</span></div>
              <div className="flex items-center gap-2"><Users className="w-4 h-4 text-[#F5C518]" /><span>{viewJob.applications?.[0]?.count || 0} Applicants</span></div>
            </div>
            {viewJob.description && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Description</p>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{viewJob.description}</p>
              </div>
            )}
            {viewJob.requirements && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Requirements</p>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{viewJob.requirements}</p>
              </div>
            )}
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-6">Posted on {new Date(viewJob.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setViewJob(null); openEditModal(viewJob); }}
                className="flex-1 py-3 bg-[#F5C518] text-[#1A1A1A] rounded-xl font-bold hover:bg-[#e5b518] transition-colors"
              >
                Edit This Job
              </button>
              <button onClick={() => setViewJob(null)} className="flex-1 py-3 bg-gray-100 dark:bg-[#2D2D2D] text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ── */}
      {editJob && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all" onClick={() => setEditJob(null)}>
          <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-2xl w-full max-w-lg p-8 relative max-h-[90vh] overflow-y-auto border border-transparent dark:border-gray-800" onClick={e => e.stopPropagation()}>
            <button onClick={() => setEditJob(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-[#1A1A1A] dark:text-white mb-6">Edit Job Post</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#1A1A1A] dark:text-gray-300 mb-1">Job Title *</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2D2D2D] text-[#1A1A1A] dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F5C518] transition-colors"
                  placeholder="e.g. Cashier at Bakery"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1A1A1A] dark:text-gray-300 mb-1">Location *</label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2D2D2D] text-[#1A1A1A] dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F5C518] transition-colors"
                  placeholder="e.g. Ernakulam, Kerala"
                />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Saving will auto-update the job's map coordinates</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1A1A1A] dark:text-gray-300 mb-1">Wage (₹/day)</label>
                <input
                  type="text"
                  value={editForm.wage}
                  onChange={e => setEditForm(f => ({ ...f, wage: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2D2D2D] text-[#1A1A1A] dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F5C518] transition-colors"
                  placeholder="e.g. 500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1A1A1A] dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2D2D2D] text-[#1A1A1A] dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F5C518] resize-none transition-colors"
                  placeholder="Describe the role..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1A1A1A] dark:text-gray-300 mb-1">Requirements</label>
                <textarea
                  value={editForm.requirements}
                  onChange={e => setEditForm(f => ({ ...f, requirements: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2D2D2D] text-[#1A1A1A] dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F5C518] resize-none transition-colors"
                  placeholder="Skills or qualifications needed..."
                />
              </div>
            </div>

            {saveMsg && (
              <p className={`mt-4 text-sm font-medium text-center ${saveMsg.startsWith('✅') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{saveMsg}</p>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="flex-1 py-3 bg-[#F5C518] text-[#1A1A1A] rounded-xl font-bold hover:bg-[#e5b518] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving…' : 'Save Changes'}
              </button>
              <button onClick={() => setEditJob(null)} className="flex-1 py-3 bg-gray-100 dark:bg-[#2D2D2D] text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40 px-4 md:px-8 py-4 pt-16 lg:pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">Job Management</p>
                <h1 className="text-2xl font-bold text-[#1A1A1A] dark:text-white">
                  My <span className="text-[#F5C518]">Jobs</span>
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => onNavigate('employer-postjob')}
                className="px-4 py-2 bg-[#F5C518] text-[#1A1A1A] font-bold rounded-xl hover:bg-yellow-400 transition-colors text-sm"
              >
                + Post New Job
              </button>
              <NotificationBell />
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-8 flex-1">
          {/* Summary Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-[#2D2D2D] rounded-2xl p-6 card-shadow border border-transparent dark:border-gray-800 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-[#F5C518]/20 dark:bg-[#F5C518]/10 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-[#F5C518] dark:text-yellow-400" />
                </div>
              </div>
              <p className="text-4xl font-bold text-[#1A1A1A] dark:text-white mb-2">{myJobs.length}</p>
              <p className="text-gray-600 dark:text-gray-400 font-medium">Total Jobs Posted</p>
            </div>

            <div className="bg-white dark:bg-[#2D2D2D] rounded-2xl p-6 card-shadow border border-transparent dark:border-gray-800 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-green-500 dark:text-green-400" />
                </div>
              </div>
              <p className="text-4xl font-bold text-[#1A1A1A] dark:text-white mb-2">{activeJobs}</p>
              <p className="text-gray-600 dark:text-gray-400 font-medium">Active Jobs</p>
            </div>

            <div className="bg-white dark:bg-[#2D2D2D] rounded-2xl p-6 card-shadow border border-transparent dark:border-gray-800 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                </div>
              </div>
              <p className="text-4xl font-bold text-[#1A1A1A] dark:text-white mb-2">{totalApplicants}</p>
              <p className="text-gray-600 dark:text-gray-400 font-medium">Total Applicants</p>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-white rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#F5C518] w-full transition-colors"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-white rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#F5C518] w-full sm:w-auto transition-colors"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="paused">Paused</option>
              </select>
            </div>
          </div>

          {/* Loading */}
          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-10 h-10 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Jobs Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                {filteredJobs.map((job) => (
                  <div key={job.id} className="bg-white dark:bg-[#2D2D2D] rounded-2xl p-6 card-shadow border border-transparent dark:border-gray-800 hover:card-shadow-hover transition-all duration-300 flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {job.image_url && (
                          <img src={job.image_url} alt="Shop" className="w-12 h-12 rounded-xl object-cover border border-gray-100 dark:border-gray-700" />
                        )}
                        <div>
                          <h3 className="text-lg font-bold text-[#1A1A1A] dark:text-white mb-1 leading-tight">{job.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <MapPin className="w-4 h-4" />
                            {job.location || <span className="italic text-gray-400 dark:text-gray-500">No location set</span>}
                          </div>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide tracking-wider ml-4 flex-shrink-0 ${job.status === 'open' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                        }`}>
                        {job.status}
                      </span>
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2 flex-1">{job.description}</p>

                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4 bg-gray-50 dark:bg-[#1A1A1A] p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-1.5 text-sm">
                        <IndianRupee className="w-4 h-4 text-[#F5C518]" />
                        <span className="font-semibold text-[#1A1A1A] dark:text-white">₹{job.wage}<span className="text-gray-500 dark:text-gray-400 font-normal">/day</span></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="capitalize font-medium">{job.job_type}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                      <div className="flex flex-col">
                        <button
                          onClick={() => onNavigate('employer-applicants')}
                          className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                        >
                          <Users className="w-4 h-4" />
                          {job.applications?.[0]?.count || 0} Candidates
                        </button>
                        <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          Posted {new Date(job.created_at).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* View button */}
                        <button
                          onClick={() => setViewJob(job)}
                          title="View Details"
                          className="w-8 h-8 bg-gray-100 dark:bg-[#1A1A1A] rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-transparent dark:border-gray-800"
                        >
                          <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        {/* Edit button */}
                        <button
                          onClick={() => openEditModal(job)}
                          title="Edit Job"
                          className="w-8 h-8 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center justify-center hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors border border-transparent dark:border-amber-900/50"
                        >
                          <Edit className="w-4 h-4 text-amber-600 dark:text-amber-500" />
                        </button>
                        {/* Pause / Resume toggle */}
                        <button
                          onClick={() => handleToggleStatus(job.id, job.status)}
                          disabled={togglingIds.has(job.id)}
                          title={job.status === 'open' ? 'Pause Job' : 'Re-open Job'}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors border border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${job.status === 'open'
                            ? 'bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 dark:border-orange-900/50'
                            : 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 dark:border-green-900/50'
                            }`}
                        >
                          {togglingIds.has(job.id)
                            ? <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                            : <span className={`text-[10px] font-bold tracking-wide ${job.status === 'open' ? 'text-orange-600 dark:text-orange-500' : 'text-green-600 dark:text-green-500'}`}>
                              {job.status === 'open' ? 'PAUSE' : 'OPEN'}
                            </span>
                          }
                        </button>
                        {/* Delete button */}
                        <button
                          onClick={() => handleDeleteJob(job.id, job.title)}
                          title="Delete Job"
                          className="w-8 h-8 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors border border-transparent dark:border-red-900/50"
                        >
                          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredJobs.length === 0 && (
                <div className="text-center py-16 bg-white dark:bg-[#2D2D2D] rounded-2xl border border-transparent dark:border-gray-800 mt-6">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-[#1A1A1A] rounded-full flex items-center justify-center mx-auto mb-4 border border-transparent dark:border-gray-800">
                    <Briefcase className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-xl font-bold text-[#1A1A1A] dark:text-white mb-2">No jobs found</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">You haven't posted any jobs yet, or none match your current filters.</p>
                  <button
                    onClick={() => onNavigate('employer-postjob')}
                    className="btn-dark px-8 inline-flex items-center gap-2"
                  >
                    Post New Job
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <footer className="px-8 py-6 border-t border-gray-100 dark:border-gray-800 mt-auto">
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center">
            © 2026 AfterBell. Made with <span className="text-red-500">♥</span> in India.
          </p>
        </footer>
      </main>
    </div>
  );
}
