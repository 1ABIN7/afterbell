import type { PageView } from '../../App';
import { API_URL } from '../../lib/api';
import {
  Bell, Plus, MapPin, IndianRupee, Clock, Star, MessageCircle, Search,
  XCircle, Calendar, CheckCircle, Video, FileText
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import ReactConfetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { supabase } from '../../lib/supabaseClient';
import { EmployerSidebar } from '../../components/layout/EmployerSidebar';

interface EmployerApplicantsProps {
  onNavigate: (view: PageView) => void;
  onLogout: () => void;
  onMessageStudent?: (student: { id: string; full_name: string }) => void;
}

export function EmployerApplicants({ onNavigate, onLogout, onMessageStudent }: EmployerApplicantsProps) {
  const [selectedJob, setSelectedJob] = useState('All Jobs');
  const [searchQuery, setSearchQuery] = useState('');
  const [appsData, setAppsData] = useState<any[]>([]);
  const [studentRatings, setStudentRatings] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize();

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${API_URL}/api/applications/employer`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        const json = await res.json();
        const apps = json.data || [];
        setAppsData(apps);
        setLoading(false); // Show cards immediately — don't block on ratings

        // Fetch ALL ratings in parallel (was sequential before)
        const studentIds = Array.from(new Set(apps.map((a: any) => a.student_id))) as string[];
        const results = await Promise.all(
          studentIds.map(sid =>
            fetch(`${API_URL}/api/users/${sid}/ratings`, {
              headers: { Authorization: `Bearer ${session.access_token}` }
            })
              .then(r => r.ok ? r.json() : { stats: { average: 0 } })
              .then(data => ({ sid, avg: data.stats?.average || 0 }))
              .catch(() => ({ sid, avg: 0 }))
          )
        );
        const ratingsMap: Record<string, number> = {};
        results.forEach(({ sid, avg }) => { ratingsMap[sid] = avg; });
        setStudentRatings(ratingsMap);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };


  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected' | 'interview'>('all');

  // Interview state
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewAppId, setInterviewAppId] = useState<string | null>(null);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewLink, setInterviewLink] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');

  const pendingApps = appsData.filter(a => ['pending', 'Pending'].includes(a.status));
  const totalCandidates = appsData.length;
  const needsReview = pendingApps.length;
  const shortlisted = appsData.filter(a => ['accepted', 'Accepted', 'approved', 'Approved'].includes(a.status)).length;
  const rejected = appsData.filter(a => ['rejected', 'Rejected'].includes(a.status)).length;

  const uniqueJobs = Array.from(new Set(appsData.map(a => a.jobs?.title))).filter(Boolean) as string[];
  const jobTabs = [
    { name: 'All Jobs', count: totalCandidates, new: needsReview > 0 }
  ];
  uniqueJobs.forEach(title => {
    const count = appsData.filter(a => a.jobs?.title === title).length;
    jobTabs.push({ name: title, count, new: appsData.filter(a => a.jobs?.title === title && a.status === 'pending').length > 0 });
  });

  const stats = [
    { label: 'TOTAL CANDIDATES', value: totalCandidates },
    { label: 'NEEDS REVIEW', value: needsReview, highlight: true },
    { label: 'SHORTLISTED', value: shortlisted },
    { label: 'REJECTED', value: rejected },
  ];

  const displayedApps = appsData.filter(a => {
    const matchesJob = selectedJob === 'All Jobs' || a.jobs?.title === selectedJob;
    let matchesStatus = false;
    if (statusFilter === 'all') matchesStatus = true;
    else if (statusFilter === 'pending') matchesStatus = ['pending', 'Pending'].includes(a.status);
    else if (statusFilter === 'accepted') matchesStatus = ['accepted', 'Accepted', 'approved', 'Approved'].includes(a.status);
    else if (statusFilter === 'rejected') matchesStatus = ['rejected', 'Rejected'].includes(a.status);
    else if (statusFilter === 'interview') matchesStatus = ['interview', 'Interview'].includes(a.status);

    const matchesSearch = searchQuery === '' ||
      (a.profiles?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.jobs?.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.profiles?.university || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesJob && matchesStatus && matchesSearch;
  });

  const handleAction = async (id: string, action: 'accepted' | 'rejected') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${API_URL}/api/applications/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ application_id: id, status: action })
      });
      if (res.ok) {
        fetchApplications();
        showToast(`Application ${action} successfully!`, 'success');
        if (action === 'accepted') {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 4000);
        }
      } else {
        const err = await res.json();
        showToast(err.message || 'Failed to update status', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Network error. Please try again.', 'error');
    }
  };

  const handleScheduleInterview = async () => {
    if (!interviewAppId || !interviewDate || !interviewTime) {
      showToast("Date and Time are required.", "error");
      return;
    }
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${API_URL}/api/applications/${interviewAppId}/schedule_interview`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          interview_date: interviewDate,
          interview_time: interviewTime,
          interview_link: interviewLink,
          interview_notes: interviewNotes
        })
      });
      if (res.ok) {
        fetchApplications();
        showToast(`Interview scheduled successfully!`, 'success');
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 4000);
        closeInterviewModal();
      } else {
        const err = await res.json();
        showToast(err.message || 'Failed to schedule interview', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Network error. Please try again.', 'error');
    }
  };

  const openInterviewModal = (appId: string) => {
    setInterviewAppId(appId);
    setInterviewDate('');
    setInterviewTime('');
    setInterviewLink('');
    setInterviewNotes('');
    setShowInterviewModal(true);
  };
  
  const closeInterviewModal = () => {
    setShowInterviewModal(false);
    setInterviewAppId(null);
  }

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
      <EmployerSidebar activeView="employer-applicants" onNavigate={onNavigate} onLogout={onLogout} />

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[999] px-5 py-3 rounded-xl shadow-lg text-white font-medium text-sm transition-all duration-300 ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}>
          {toast.msg}
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40 px-4 md:px-8 py-4 pt-16 lg:pt-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#1A1A1A] dark:text-white">Candidates</h1>
            <div className="flex items-center gap-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search candidates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-white rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#F5C518] w-48 transition-colors duration-200"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-8 flex-1">
          {/* Title */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">

              <div>
                <h1 className="text-3xl font-bold text-[#1A1A1A] dark:text-white mb-1">Manage Candidates</h1>
                <p className="text-gray-500 dark:text-gray-400">Review, shortlist, and contact students applying for your open positions.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('employer-postjob')}
                className="btn-dark flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Post New Job
              </button>
            </div>
          </div>

          {/* Job Tabs */}
          <div className="flex flex-wrap gap-3 mb-8">
            {jobTabs.map((job) => (
              <button
                key={job.name}
                onClick={() => setSelectedJob(job.name)}
                className={`px-5 py-3 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${selectedJob === job.name
                  ? 'bg-[#F5C518] text-[#1A1A1A]'
                  : 'bg-white dark:bg-[#2D2D2D] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent dark:border-gray-800'
                  }`}
              >
                {job.name}
                {job.new && job.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${selectedJob === job.name ? 'bg-[#1A1A1A]/20 dark:bg-black/20' : 'bg-gray-200 dark:bg-gray-700'
                    }`}>
                    {job.count} New
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`rounded-2xl p-5 ${stat.highlight ? 'bg-[#1A1A1A] text-white card-shadow' : 'bg-white dark:bg-[#2D2D2D] card-shadow border border-transparent dark:border-gray-800'
                  }`}
              >
                <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${stat.highlight ? 'text-[#F5C518]' : 'text-gray-400 dark:text-gray-500'
                  }`}>
                  {stat.label}
                </p>
                <p className={`text-3xl font-bold ${stat.highlight ? 'text-white' : 'text-[#1A1A1A] dark:text-white'}`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Status Filter + Header */}
          <div className="flex items-center flex-wrap gap-3 mb-6">
            <h2 className="text-xl font-bold text-[#1A1A1A] dark:text-white mr-2">Candidates</h2>
            {(['all', 'pending', 'interview', 'accepted', 'rejected'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${statusFilter === s
                  ? s === 'pending' ? 'bg-yellow-400 text-black'
                    : s === 'accepted' ? 'bg-green-500 text-white'
                      : s === 'rejected' ? 'bg-red-500 text-white'
                        : s === 'interview' ? 'bg-blue-500 text-white'
                          : 'bg-[#1A1A1A] text-white'
                  : 'bg-white dark:bg-[#2D2D2D] border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {/* Applicant Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full py-12 text-center text-gray-500 dark:text-gray-400">Loading candidates...</div>
            ) : displayedApps.length === 0 ? (
              <div className="col-span-full py-12 text-center text-gray-500 dark:text-gray-400">No candidates found for {selectedJob}.</div>
            ) : displayedApps.map((applicant) => {
              const studentName = applicant.profiles?.full_name || 'Student';
              const initials = studentName.substring(0, 2).toUpperCase();
              const avatarUrl = applicant.profiles?.avatar_url;
              const role = applicant.jobs?.title || 'Unknown Job';
              const wage = applicant.jobs?.wage || 'Competitive';
              const location = applicant.jobs?.location || 'Remote/Campus';

              return (
                <div key={applicant.id} className="bg-white dark:bg-[#2D2D2D] rounded-2xl p-6 card-shadow hover:card-shadow-hover transition-all duration-300 border border-transparent dark:border-gray-800 hover:-translate-y-1 group">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Avatar" className="w-14 h-14 rounded-full object-cover" />
                        ) : (
                          <div className="w-14 h-14 bg-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                            {initials}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#1A1A1A] dark:text-white flex items-center gap-2">
                          {studentName}
                          {studentRatings[applicant.student_id] !== undefined && (
                            <span className="flex items-center text-sm bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-full">
                              <Star className="w-3 h-3 fill-current mr-1" />
                              {studentRatings[applicant.student_id] > 0 ? studentRatings[applicant.student_id] : 'New'}
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-[#F5C518] font-medium">{role}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${applicant.status === 'accepted' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                      : applicant.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'
                        : applicant.status === 'interview' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400'
                          : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400'
                      }`}>
                      {(applicant.status === 'interview' ? 'Interview Scheduled' : applicant.status || 'pending').toUpperCase()}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="font-medium text-[#1A1A1A] dark:text-white">{location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <IndianRupee className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="font-medium text-[#1A1A1A] dark:text-white">₹{wage}/day</span>
                    </div>
                    {applicant.profiles?.university && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-400 dark:text-gray-500">🎓</span>
                        <span className="text-gray-700 dark:text-gray-300">{applicant.profiles.university}{applicant.profiles.course ? ` · ${applicant.profiles.course}` : ''}{applicant.profiles.year ? ` (Yr ${applicant.profiles.year})` : ''}</span>
                      </div>
                    )}
                    {applicant.profiles?.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-400 dark:text-gray-500">📞</span>
                        <span className="text-gray-700 dark:text-gray-300">{applicant.profiles.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">Applied: {new Date(applicant.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    {applicant.profiles?.bio && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic mt-2 line-clamp-2">"{applicant.profiles.bio}"</p>
                    )}

                    {applicant.cover_letter && (
                      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Cover Letter</p>
                        <p className="text-sm text-[#1A1A1A] dark:text-white bg-yellow-50/50 dark:bg-yellow-900/10 p-4 rounded-xl border border-yellow-100 dark:border-yellow-900/30 italic leading-relaxed">
                          "{applicant.cover_letter}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-6 border-t border-gray-100 dark:border-gray-800 pt-4">
                    {(applicant.status === 'pending' || !applicant.status) ? (
                      <>
                        <button
                          onClick={() => handleAction(applicant.id, 'rejected')}
                          className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          title="Reject Application"
                        >
                          <XCircle className="w-5 h-5 text-red-500" />
                        </button>
                        <button
                          onClick={() => openInterviewModal(applicant.id)}
                          className="flex-1 px-2 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center justify-center gap-1"
                        >
                          <Calendar className="w-4 h-4 text-blue-500" /> <span className="text-sm">Schedule</span>
                        </button>
                        <button
                          onClick={() => handleAction(applicant.id, 'accepted')}
                          className="flex-1 btn-dark py-2 flex items-center justify-center text-sm"
                        >
                          <CheckCircle className="w-4 h-4 mr-1 text-green-400" /> Accept
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            const sName = applicant.profiles?.full_name || 'Student';
                            if (onMessageStudent) {
                              onMessageStudent({ id: applicant.student_id, full_name: sName });
                            } else {
                              onNavigate('employer-messages');
                            }
                          }}
                          className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          title="Message this student"
                        >
                          <MessageCircle className="w-4 h-4" /> Message
                        </button>
                        {applicant.status !== 'pending' && (
                          <button
                            onClick={() => handleAction(applicant.id, applicant.status === 'accepted' ? 'rejected' : 'accepted')}
                            className={`flex-1 py-2 rounded-xl font-medium transition-colors ${applicant.status === 'accepted'
                              ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/40'
                              : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/40'
                              }`}
                          >
                            {applicant.status === 'accepted' ? 'Withdraw' : 'Accept'}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <footer className="px-8 py-6 border-t border-gray-100 dark:border-gray-800 mt-auto">
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center">
            © 2026 AfterBell. Made with <span className="text-red-500">♥</span> in India.
          </p>
        </footer>
      </main>

      {/* Schedule Interview Modal */}
      {showInterviewModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl relative border border-gray-200 dark:border-gray-800 animate-fade-in-up">
            <button onClick={closeInterviewModal} className="absolute right-4 top-4 text-gray-400 hover:text-[#1A1A1A] dark:hover:text-white transition-colors">
              <XCircle className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-[#1A1A1A] dark:text-white mb-2 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-500" /> Schedule Interview
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Propose a date, time, and link for the interview. The student will be notified immediately.</p>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1A1A1A] dark:text-gray-300 mb-2">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="date" value={interviewDate} onChange={e => setInterviewDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2D2D2D] text-[#1A1A1A] dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1A1A1A] dark:text-gray-300 mb-2">Time</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="time" value={interviewTime} onChange={e => setInterviewTime(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2D2D2D] text-[#1A1A1A] dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 text-sm" />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-[#1A1A1A] dark:text-gray-300 mb-2">Meeting Link (Optional)</label>
                <div className="relative">
                  <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="url" value={interviewLink} onChange={e => setInterviewLink(e.target.value)} placeholder="e.g. Google Meet, Zoom link"
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2D2D2D] text-[#1A1A1A] dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1A1A1A] dark:text-gray-300 mb-2">Notes/Instructions</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <textarea value={interviewNotes} onChange={e => setInterviewNotes(e.target.value)} placeholder="Any special instructions for the candidate..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2D2D2D] text-[#1A1A1A] dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 text-sm h-24 resize-none" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={closeInterviewModal} className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                Cancel
              </button>
              <button onClick={handleScheduleInterview} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition">
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
