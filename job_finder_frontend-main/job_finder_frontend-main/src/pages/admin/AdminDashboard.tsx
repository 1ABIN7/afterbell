import type { PageView } from '../../App';
import { API_URL } from '../../lib/api';
import {
  Download, ChevronRight
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { AdminSidebar } from '../../components/layout/AdminSidebar';
import { supabase } from '../../lib/supabaseClient';

interface AdminDashboardProps {
  onNavigate: (view: PageView) => void;
  onLogout: () => void;
}

export function AdminDashboard({ onNavigate, onLogout }: AdminDashboardProps) {
  const [stats, setStats] = useState({ pending: 0, jobs: 0, users: 0 });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${API_URL}/api/admin/dashboard/stats`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (res.ok) {
        const json = await res.json();
        setStats(json.data.stats);
        setRecentActivity(json.data.recentActivity);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const handleDownloadReport = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Metric,Count\n"
      + `Pending Employer Approvals,${stats.pending}\n`
      + `Total Active Jobs,${stats.jobs}\n`
      + `Total Platform Users,${stats.users}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `afterbell_admin_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const summaryCards = [
    {
      title: 'PENDING APPROVALS',
      value: stats.pending.toString(),
      subtitle: 'employers waiting',
      badge: stats.pending > 0 ? 'Action Required' : 'All Clear',
      badgeColor: stats.pending > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600',
      button: 'Review Queue',
      progress: Math.min(100, stats.pending * 10),
      progressColor: 'bg-[#F5C518]',
      view: 'admin-verification' as PageView
    },
    {
      title: 'ACTIVE JOBS',
      value: stats.jobs.toString(),
      subtitle: 'on platform',
      badge: 'Live',
      badgeColor: 'bg-blue-100 text-blue-600',
      button: 'View Jobs',
      progress: 100,
      progressColor: 'bg-blue-500',
      view: 'admin-reports' as PageView
    },
    {
      title: 'TOTAL USERS',
      value: stats.users.toString(),
      subtitle: 'students & employers',
      badge: 'Growing',
      badgeColor: 'bg-green-100 text-green-600',
      button: 'Manage Users',
      progress: 100,
      progressColor: 'bg-green-500',
      view: 'admin-users' as PageView
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFFBF0] flex">
      <AdminSidebar activeView="admin-dashboard" onNavigate={onNavigate} onLogout={onLogout} />

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 px-4 md:px-8 py-4 pt-16 lg:pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">


              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Admin</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <span className="text-[#1A1A1A] font-medium">Dashboard Overview</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 md:p-8">
          {/* Title */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-xl md:text-3xl font-bold text-[#1A1A1A] mb-1 line-clamp-1">Dashboard Overview</h1>
              <p className="hidden sm:block text-gray-500">Platform activity summary for {currentTime.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}.</p>
            </div>
            <button onClick={handleDownloadReport} className="btn-dark flex flex-shrink-0 items-center gap-2 text-sm px-3 md:px-4 py-2">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download Report</span>
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {summaryCards.map((card, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 card-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{card.title}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${card.badgeColor}`}>
                    {card.badge}
                  </span>
                </div>

                <div className="flex items-baseline gap-2 mb-2">
                  <p className="text-4xl font-bold text-[#1A1A1A]">{card.value}</p>
                  <p className="text-sm text-gray-500">{card.subtitle}</p>
                </div>

                <div className="w-full h-2 bg-gray-100 rounded-full mb-4">
                  <div className={`h-full rounded-full ${card.progressColor}`} style={{ width: `${card.progress}%` }}></div>
                </div>

                <button
                  onClick={() => onNavigate(card.view)}
                  className="w-full py-3 border border-gray-200 rounded-xl text-sm font-medium text-[#1A1A1A] hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  {card.button}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Recent Alerts */}
          <div className="bg-white rounded-2xl card-shadow overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-[#F5C518] rounded-full"></div>
                <h2 className="text-xl font-bold text-[#1A1A1A]">Recent Alerts & Activity</h2>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  Filter
                </button>
                <button className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  Export
                </button>
              </div>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <div className="col-span-2">Timestamp</div>
              <div className="col-span-3">Entity / User</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-3">Actions</div>
            </div>

            {/* Table Rows */}
            {recentActivity.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No recent activity detected.</div>
            ) : (
              recentActivity.map((activity, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 px-6 py-4 border-t border-gray-100 items-center">
                  <div className="col-span-2 text-sm text-gray-600">
                    {new Date(activity.created_at).toLocaleDateString()}
                  </div>
                  <div className="col-span-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-600 text-sm">
                        {(activity.full_name || 'U').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-[#1A1A1A] text-sm">{activity.full_name || 'Unnamed User'}</p>
                        <p className="text-xs text-gray-400 capitalize">{activity.role}</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 text-sm text-gray-600">New Registration</div>
                  <div className="col-span-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${activity.role === 'employer'
                      ? (activity.verification_status === 'rejected' ? 'bg-red-100 text-red-700' : (activity.verification_status === 'approved' || activity.is_verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'))
                      : 'bg-green-100 text-green-700'
                      }`}>
                      {activity.role === 'employer'
                        ? (activity.verification_status === 'rejected' ? 'Rejected' : (activity.verification_status === 'approved' || activity.is_verified ? 'Active' : 'Pending Verification'))
                        : 'Active'}
                    </span>
                  </div>
                  <div className="col-span-3 flex items-center gap-2">
                    <button
                      onClick={() => onNavigate(activity.role === 'employer' ? 'admin-verification' : 'admin-users')}
                      className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-[#1A1A1A] hover:bg-gray-200 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))
            )}
            {/* Pagination Controls Removed for Live Data View */}
          </div>
        </div>

        {/* Footer */}
        <footer className="px-8 py-6 border-t border-gray-100">
          <p className="text-sm text-gray-400 text-center">
            © 2026 AfterBell. All rights reserved. Made with <span className="text-red-500">♥</span> in India.
          </p>
        </footer>
      </main>
    </div>
  );
}
