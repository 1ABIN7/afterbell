import type { PageView } from '../../App';
import { API_URL } from '../../lib/api';
import {
  Clock, ChevronRight, Users, Eye, Calendar, MapPin, TrendingUp
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabaseClient';
import { EmployerSidebar } from '../../components/layout/EmployerSidebar';
import { NotificationBell } from '../../components/layout/NotificationBell';

interface EmployerDashboardProps {
  onNavigate: (view: PageView) => void;
  onLogout: () => void;
}

function toISODate(d: Date) { return d.toISOString().slice(0, 10); }

export function EmployerDashboard({ onNavigate, onLogout }: EmployerDashboardProps) {
  const [userName, setUserName] = useState('');
  const [userInitials, setUserInitials] = useState('');
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [newAppsCount, setNewAppsCount] = useState(0);
  const [isLoadingApps, setIsLoadingApps] = useState(true);
  const [todayShifts, setTodayShifts] = useState<any[]>([]);
  const [upcomingShiftsCount, setUpcomingShiftsCount] = useState(0);
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(true);

  const todayISO = toISODate(new Date());
  const todayLabel = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      if (session) {
        supabase.from('profiles').select('full_name').eq('id', session.user.id).single()
          .then(({ data }) => {
            if (data?.full_name) {
              setUserName(data.full_name);
              setUserInitials(data.full_name.charAt(0).toUpperCase());
            }
          });
        fetchApplications(session.access_token);
        fetchShifts(session.access_token);
        fetchAnalytics(session.access_token);
      }
    });
  }, []);

  const fetchApplications = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/api/applications/employer`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const j = await res.json();
        const apps = j.data || [];
        setRecentApplications(apps.slice(0, 5));
        setNewAppsCount(apps.filter((a: any) => a.status === 'pending').length);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingApps(false);
    }
  };

  const fetchShifts = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/api/shifts/employer`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const j = await res.json();
        const allShifts: any[] = j.data || [];
        // Today's shifts
        setTodayShifts(allShifts.filter(s => s.shift_date === todayISO));
        // Upcoming shifts = after today, not cancelled
        setUpcomingShiftsCount(allShifts.filter(s => s.shift_date > todayISO && s.status !== 'Cancelled').length);
      }
    } catch (e) { console.error(e); }
  };

  const fetchAnalytics = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/api/employer/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const j = await res.json();
        setAnalyticsData(j.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyticsLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-[#FFFBF0] dark:bg-[#121212] flex transition-colors duration-200">
      <EmployerSidebar activeView="employer-dashboard" onNavigate={onNavigate} onLogout={onLogout} />

      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40 px-4 md:px-8 py-4 pt-16 lg:pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="hidden sm:block text-sm text-gray-500 dark:text-gray-400">Here&apos;s what&apos;s happening today.</p>
              <h1 className="text-xl md:text-2xl font-bold text-[#1A1A1A] dark:text-white line-clamp-1">
                Welcome{userName ? `, ${userName.split(' ')[0]}` : ''}! <span className="text-[#F5C518]">👋</span>
              </h1>
            </div>
            <NotificationBell />
          </div>
        </header>

        <div className="p-8 flex-1">
          {/* Summary Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* New Applications Card */}
            <div className="bg-white dark:bg-[#2D2D2D] rounded-2xl p-6 card-shadow border border-transparent dark:border-gray-800 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg animate-fade-in-up">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                </div>
                {newAppsCount > 0 && (
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full">{newAppsCount} pending</span>
                )}
              </div>
              <p className="text-4xl font-bold text-[#1A1A1A] dark:text-white mb-2">{newAppsCount}</p>
              <p className="text-gray-600 dark:text-gray-400 font-medium">Pending Applications</p>
              <button
                onClick={() => onNavigate('employer-applicants')}
                className="text-blue-600 text-sm font-medium mt-3 flex items-center gap-1 hover:underline"
              >
                Review candidates <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Upcoming Shifts Card */}
            <div className="bg-white dark:bg-[#2D2D2D] rounded-2xl p-6 card-shadow border border-transparent dark:border-gray-800 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-500 dark:text-orange-400" />
                </div>
                {upcomingShiftsCount > 0 && (
                  <span className="text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-full">Next 24h+</span>
                )}
              </div>
              <p className="text-4xl font-bold text-[#1A1A1A] dark:text-white mb-2">{upcomingShiftsCount}</p>
              <p className="text-gray-600 dark:text-gray-400 font-medium">Upcoming Shifts</p>
              <button
                onClick={() => onNavigate('employer-shifts')}
                className="text-orange-600 text-sm font-medium mt-3 flex items-center gap-1 hover:underline"
              >
                View schedule <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Analytics Chart */}
          <div className="bg-white dark:bg-[#2D2D2D] rounded-2xl p-6 mb-8 card-shadow border border-transparent dark:border-gray-800 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-[#1A1A1A] dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#F5C518]" />
                  Analytics Overview
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Applications (Last 7 Days)</p>
              </div>
            </div>
            <div className="h-[300px] w-full">
              {isAnalyticsLoading ? (
                <div className="w-full h-full flex flex-col items-center justify-center space-y-3">
                  <div className="w-8 h-8 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">Loading live data...</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: '#1A1A1A', color: '#fff' }}
                      itemStyle={{ fontSize: '14px', fontWeight: 500 }}
                    />
                    <Area type="monotone" dataKey="applications" name="Applications" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorApps)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Recent Applications */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#1A1A1A] dark:text-white">Recent Applications</h2>
                <button onClick={() => onNavigate('employer-applicants')} className="btn-primary text-sm py-2 px-4">
                  View All
                </button>
              </div>

              <div className="bg-white dark:bg-[#2D2D2D] border border-transparent dark:border-gray-800 rounded-2xl card-shadow overflow-hidden">
                <div className="grid grid-cols-5 gap-4 px-6 py-4 bg-gray-50 dark:bg-[#1A1A1A] text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  <div className="col-span-2">Candidate</div>
                  <div>Role</div>
                  <div>Pay Rate</div>
                  <div className="text-center">Action</div>
                </div>
                {isLoadingApps ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="grid grid-cols-5 gap-4 px-6 py-4 border-t border-gray-100 dark:border-gray-800 items-center animate-pulse">
                      <div className="col-span-2 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                      </div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                      <div className="flex justify-center">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                      </div>
                    </div>
                  ))
                ) : recentApplications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">No recent applications found.</div>
                ) : recentApplications.map((app) => {
                  const studentName = app.profiles?.full_name || 'Unknown Student';
                  const initials = studentName.substring(0, 2).toUpperCase();
                  const avatarUrl = app.profiles?.avatar_url;
                  const role = app.jobs?.title || 'Job';
                  const wage = app.jobs?.wage || '—';
                  const statusLabel = app.status === 'pending' ? 'NEW' : app.status.toUpperCase();
                  const statusColor = app.status === 'pending' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400' :
                    app.status === 'approved' || app.status === 'accepted' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400';
                  return (
                    <div key={app.id} className="grid grid-cols-5 gap-4 px-6 py-4 border-t border-gray-100 dark:border-gray-800 items-center">
                      <div className="col-span-2 flex items-center gap-3">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 bg-pink-400 rounded-full flex items-center justify-center text-white font-bold text-sm">{initials}</div>
                        )}
                        <p className="font-semibold text-[#1A1A1A] dark:text-white truncate max-w-[150px]">{studentName}</p>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 truncate">{role}</div>
                      <div className="text-sm font-medium text-[#1A1A1A] dark:text-white">₹{wage}</div>
                      <div className="flex items-center justify-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}>{statusLabel}</span>
                        <button onClick={() => onNavigate('employer-applicants')} className="w-8 h-8 bg-gray-100 dark:bg-[#1A1A1A] rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
                          <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Today's Schedule — LIVE */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#1A1A1A] dark:text-white">Today&apos;s Schedule</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{todayLabel}</p>
              </div>

              <div className="space-y-4">
                {isLoadingApps ? (
                  Array(2).fill(0).map((_, i) => (
                    <div key={i} className="bg-white dark:bg-[#2D2D2D] border border-transparent dark:border-gray-800 rounded-xl p-4 card-shadow animate-pulse flex items-start gap-3">
                      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0"></div>
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mt-2"></div>
                      </div>
                    </div>
                  ))
                ) : todayShifts.length === 0 ? (
                  <div className="bg-white dark:bg-[#2D2D2D] border border-transparent dark:border-gray-800 rounded-xl p-6 card-shadow text-center">
                    <Calendar className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No shifts scheduled for today.</p>
                    <button
                      onClick={() => onNavigate('employer-shifts')}
                      className="mt-3 text-xs text-[#F5C518] font-semibold hover:underline"
                    >
                      + Add a shift
                    </button>
                  </div>
                ) : todayShifts.map((shift) => (
                  <div key={shift.id} className="bg-white dark:bg-[#2D2D2D] border border-transparent dark:border-gray-800 rounded-xl p-4 card-shadow">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-[#F5C518]/10 rounded-lg flex flex-col items-center justify-center flex-shrink-0 text-center">
                        <Clock className="w-4 h-4 text-[#F5C518] mb-0.5" />
                        <span className="text-xs font-bold text-[#1A1A1A] dark:text-white leading-none">{shift.start_time?.slice(0, 5)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#1A1A1A] dark:text-white truncate">{shift.jobs?.title || 'Shift'}</p>
                        {shift.jobs?.location && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            <MapPin className="w-3 h-3" />{shift.jobs.location}
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                          <Clock className="w-3 h-3" />
                          {shift.start_time?.slice(0, 5)} – {shift.end_time?.slice(0, 5)}
                        </div>
                        {shift.profiles?.full_name ? (
                          <span className="inline-block mt-2 text-xs text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                            👤 {shift.profiles.full_name}
                          </span>
                        ) : (
                          <span className="inline-block mt-2 text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">UNASSIGNED</span>
                        )}
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${shift.status === 'Confirmed' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400' :
                        shift.status === 'Completed' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' :
                          shift.status === 'No-show' ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400' : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400'
                        }`}>{shift.status}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => onNavigate('employer-shifts')}
                className="w-full mt-4 text-center text-[#F5C518] font-medium hover:underline"
              >
                View Full Schedule →
              </button>
            </div>
          </div>
        </div>

        <footer className="px-8 py-6 border-t border-gray-100 dark:border-gray-800 mt-auto">
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center">© 2026 AfterBell. Made with <span className="text-red-500">♥</span> in India.</p>
        </footer>
      </main>
    </div>
  );
}
