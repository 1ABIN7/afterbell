import type { PageView } from '../../App';
import { API_URL } from '../../lib/api';
import {
  Search,
  Bookmark, Navigation, Trash2, ExternalLink
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { StudentSidebar } from '../../components/layout/StudentSidebar';
import { NotificationBell } from '../../components/layout/NotificationBell';

interface StudentSavedJobsProps {
  onNavigate: (view: PageView) => void;
  onLogout: () => void;
}

export function StudentSavedJobs({ onNavigate, onLogout }: StudentSavedJobsProps) {
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const fetchSavedJobs = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${API_URL}/api/jobs/saved`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setSavedJobs(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const removeJob = async (jobId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${API_URL}/api/jobs/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ job_id: jobId })
      });
      if (res.ok) {
        fetchSavedJobs();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredJobs = savedJobs.filter(job => {
    const q = searchQuery.toLowerCase();
    return !q ||
      (job.jobs?.title || '').toLowerCase().includes(q) ||
      (job.jobs?.company_name || '').toLowerCase().includes(q) ||
      (job.jobs?.location || '').toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-[#FFFBF0] dark:bg-[#121212] flex transition-colors duration-200">
      <StudentSidebar activeView="student-saved" onNavigate={onNavigate} onLogout={onLogout} />

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40 px-4 md:px-8 py-4 pt-16 lg:pt-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                  className="text-gray-600 dark:text-gray-400 hover:text-[#1A1A1A] dark:hover:text-white font-medium transition-colors flex-shrink-0"
                >
                  My Applications
                </button>
                <button
                  onClick={() => onNavigate('student-saved')}
                  className="text-[#F5C518] font-semibold border-b-2 border-[#F5C518] pb-1 flex-shrink-0"
                >
                  Saved
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search saved jobs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-white rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#F5C518] w-full md:w-48 transition-colors duration-200"
                />
              </div>
              <NotificationBell />
            </div>
          </div>
        </header>

        {/* Saved Jobs Content */}
        <div className="p-8 flex-1">
          {loading ? (
            <div className="text-center py-20 text-gray-500 dark:text-gray-400">Loading saved jobs...</div>
          ) : filteredJobs.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.map((job) => (
                <div key={job.id} className="bg-white dark:bg-[#2D2D2D] rounded-2xl p-6 card-shadow hover:card-shadow-hover transition-all duration-300 flex flex-col justify-between border border-transparent dark:border-gray-800">
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-xl flex items-center justify-center text-2xl`}>
                          💼
                        </div>
                        <div>
                          <h3 className="font-semibold text-[#1A1A1A] dark:text-white line-clamp-1">{job.jobs?.title || 'Unknown Job'}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{job.jobs?.company_name || 'Unknown Company'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeJob(job.job_id)}
                        className="w-8 h-8 bg-red-100 dark:bg-red-900/40 rounded-lg flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </button>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-2 text-sm">
                        <Navigation className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                        <span className="font-medium text-[#1A1A1A] dark:text-white truncate">{job.jobs?.location || 'Remote'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-green-600 dark:text-green-400 font-semibold text-lg">₹{job.jobs?.wage || 'Competitive'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                    <span className="text-sm text-gray-400 dark:text-gray-500">Saved {new Date(job.created_at).toLocaleDateString()}</span>
                    <button
                      onClick={() => onNavigate('student-jobs')}
                      className="flex items-center gap-1 text-[#F5C518] font-medium hover:underline"
                    >
                      View Job
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-gray-100 dark:bg-[#1A1A1A] rounded-full flex items-center justify-center mx-auto mb-6 border border-transparent dark:border-gray-800">
                <Bookmark className="w-10 h-10 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-[#1A1A1A] dark:text-white mb-2">
                {searchQuery ? 'No results found' : 'No saved jobs yet'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchQuery ? `No saved jobs match "${searchQuery}"` : 'Start browsing and save jobs you\'re interested in'}
              </p>
              {!searchQuery && (
                <button onClick={() => onNavigate('student-jobs')} className="btn-primary">Browse Jobs</button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="px-8 py-6 border-t border-gray-100 dark:border-gray-800 mt-auto">
          <p className="text-sm text-gray-400 dark:text-gray-500">
            © 2026 AfterBell. Made with <span className="text-red-500">♥</span> for Students.
          </p>
        </footer>
      </main>
    </div>
  );
}

