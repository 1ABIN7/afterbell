import type { PageView } from '../../App';
import { API_URL } from '../../lib/api';
import {
  Users, Ban, Eye, ChevronRight, UserX, UserCheck, X
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { AdminSidebar } from '../../components/layout/AdminSidebar';

interface AdminUsersProps {
  onNavigate: (view: PageView) => void;
  onLogout: () => void;
  initialTab?: 'students' | 'employers' | 'banned';
}

export function AdminUsers({ onNavigate, onLogout, initialTab }: AdminUsersProps) {
  const [activeTab, setActiveTab] = useState<'students' | 'employers' | 'banned'>(initialTab || 'students');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const USERS_PER_PAGE = 10;

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const [usersData, setUsersData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setUsersData(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleBanToggle = async (userId: string, currentRole: string) => {
    if (currentRole === 'banned') {
      showToast("Unbanning is not fully supported in this demo mode yet.", "info");
      return;
    }
    if (!confirm("Are you sure you want to ban this user?")) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        showToast("User banned successfully", "success");
        fetchUsers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getAvatar = (name: string) => name ? name.substring(0, 2).toUpperCase() : 'U';

  const users = {
    students: usersData.filter(u => u.role === 'student' && !u.is_banned).map(u => ({
      id: u.id,
      name: u.full_name || 'Student',
      email: u.email || 'No Email',
      phone: u.phone || 'Not Provided',
      college: u.university || 'Not Listed',
      year: u.year || 'N/A',
      location: u.address || 'N/A',
      completedJobs: u.completedJobs || 0,
      rating: u.rating || 0,
      status: u.is_banned ? 'Banned' : 'Active',
      avatarUrl: u.avatar_url,
      avatar: getAvatar(u.full_name),
      color: 'bg-blue-400',
      role: u.role,
      created_at: u.created_at
    })),
    employers: usersData.filter(u => u.role === 'employer' && !u.is_banned).map(u => ({
      id: u.id,
      name: u.full_name || 'Employer',
      email: u.email || 'No Email',
      phone: u.phone || 'Not Provided',
      business: u.company_name || 'Business',
      location: u.address || u.location || 'Not Set',
      activeJobs: u.activeJobs || 0,
      totalHires: u.totalHires || 0,
      status: u.is_banned ? 'Banned' : (u.verification_status === 'rejected' ? 'Rejected' : (u.verification_status === 'approved' || u.is_verified ? 'Verified' : 'Pending')),
      avatarUrl: u.avatar_url,
      avatar: getAvatar(u.full_name),
      color: 'bg-amber-400',
      role: u.role,
      created_at: u.created_at
    })),
    banned: usersData.filter(u => u.is_banned === true).map(u => ({
      id: u.id,
      name: u.full_name || 'Banned User',
      email: u.email || 'No Email',
      type: u.company_name ? 'employer' : (u.university ? 'student' : 'Unknown'),
      reason: 'Admin Action',
      bannedDate: new Date(u.created_at).toLocaleDateString(),
      avatarUrl: u.avatar_url,
      avatar: getAvatar(u.full_name),
      color: 'bg-red-400',
      role: u.role
    })),
  };

  const currentUsers = users[activeTab];
  const totalPages = Math.max(1, Math.ceil(currentUsers.length / USERS_PER_PAGE));
  const paginatedUsers = currentUsers.slice((currentPage - 1) * USERS_PER_PAGE, currentPage * USERS_PER_PAGE);

  // Reset page when switching tabs
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-[#FFFBF0] flex" >
      <AdminSidebar activeView={activeTab === 'employers' ? 'admin-employers' : 'admin-students'} onNavigate={onNavigate} onLogout={onLogout} />

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[999] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg text-white font-medium text-sm transition-all duration-300 ${toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
          }`}>
          <span>{toast.msg}</span>
          <button onClick={() => setToast(null)} className="ml-1 opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen" >
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 px-4 md:px-8 py-4 pt-16 lg:pt-4" >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">

              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Dashboard</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <span className="text-[#F5C518] font-medium">User Management</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 md:p-8" >
          {/* Title */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8" >
            <div>
              <h1 className="text-3xl font-bold text-[#1A1A1A] mb-1">User Management</h1>
              <p className="text-gray-500">Manage student and employer accounts on the platform. As of {currentTime.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-red-100 rounded-xl">
                <Ban className="w-5 h-5 text-red-600" />
                <span className="text-sm font-medium text-red-600">{users.banned.length} Banned Users</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8" >
            {(['students', 'employers', 'banned'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${activeTab === tab
                  ? 'bg-[#F5C518] text-[#1A1A1A]'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
              >
                {tab === 'students' && <UserCheck className="w-4 h-4" />}
                {tab === 'employers' && <Users className="w-4 h-4" />}
                {tab === 'banned' && <UserX className="w-4 h-4" />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab ? 'bg-[#1A1A1A]/20' : 'bg-gray-200'
                  }`}>
                  {users[tab].length}
                </span>
              </button>
            ))
            }
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl card-shadow overflow-hidden" >
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide" >
              {activeTab === 'students' && (
                <>
                  <div className="col-span-3">Student</div>
                  <div className="col-span-2">College</div>
                  <div className="col-span-2">Location</div>
                  <div className="col-span-1 text-center">Jobs Done</div>
                  <div className="col-span-1 text-center">Rating</div>
                  <div className="col-span-1">Status</div>
                  <div className="col-span-2 text-center">Actions</div>
                </>
              )}
              {
                activeTab === 'employers' && (
                  <>
                    <div className="col-span-3">Employer</div>
                    <div className="col-span-2">Business Type</div>
                    <div className="col-span-1">Location</div>
                    <div className="col-span-1 text-center">Active Jobs</div>
                    <div className="col-span-1 text-center">Total Hires</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2 text-center">Actions</div>
                  </>
                )
              }
              {
                activeTab === 'banned' && (
                  <>
                    <div className="col-span-3">User</div>
                    <div className="col-span-2">Type</div>
                    <div className="col-span-3">Reason</div>
                    <div className="col-span-2">Banned Date</div>
                    <div className="col-span-2">Actions</div>
                  </>
                )
              }
            </div>

            {/* Table Rows */}
            {
              currentUsers.length === 0 ? null :
              paginatedUsers.map((user: any) => (
                <div key={user.id} className="grid grid-cols-12 gap-4 px-6 py-5 border-t border-gray-100 items-center">
                  <div className="col-span-3">
                    <div className="flex items-center gap-3">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className={`w-10 h-10 ${user.color} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                          {user.avatar}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-[#1A1A1A]">{user.name}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  {activeTab === 'students' && (
                    <>
                      <div className="col-span-2 text-sm text-gray-600 truncate">{user.college}</div>
                      <div className="col-span-2 text-sm text-gray-600 truncate">{user.location}</div>
                      <div className="col-span-1 text-sm text-[#1A1A1A] text-center">{user.completedJobs}</div>
                      <div className="col-span-1 flex justify-center">
                        <div className="flex items-center gap-1">
                          <span className="text-[#F5C518]">★</span>
                          <span className="text-sm font-medium">{user.rating}</span>
                        </div>
                      </div>
                      <div className="col-span-1">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          {user.status}
                        </span>
                      </div>
                    </>
                  )}

                  {activeTab === 'employers' && (
                    <>
                      <div className="col-span-2 text-sm text-gray-600 truncate">{user.business}</div>
                      <div className="col-span-1 text-sm text-gray-600 truncate">{user.location}</div>
                      <div className="col-span-1 text-sm text-[#1A1A1A] text-center">{user.activeJobs}</div>
                      <div className="col-span-1 text-sm text-[#1A1A1A] text-center">{user.totalHires}</div>
                      <div className="col-span-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.status === 'Verified' ? 'bg-green-100 text-green-700' : (user.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700')
                          }`}>
                          {user.status}
                        </span>
                      </div>
                    </>
                  )}

                  {activeTab === 'banned' && (
                    <>
                      <div className="col-span-2 text-sm text-gray-600 uppercase">{user.type}</div>
                      <div className="col-span-3 text-sm text-red-600">{user.reason}</div>
                      <div className="col-span-2 text-sm text-gray-600">{user.bannedDate}</div>
                    </>
                  )}

                  <div className="col-span-2 flex items-center gap-2">
                    {activeTab === 'banned' ? (
                      <button
                        onClick={() => handleBanToggle(user.id, user.role)}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                      >
                        Unban
                      </button>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleBanToggle(user.id, user.role)}
                          className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors">
                          <Ban className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            }

            {/* Empty State */}
            {
              loading ? (
                <div className="px-6 py-12 text-center text-gray-500">Loading users...</div>
              ) : currentUsers.length === 0 && (
                <div className="px-6 py-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">No users found in this category</p>
                </div>
              )
            }
          </div>

          {/* Pagination */}
          {currentUsers.length > 0 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-500">
                Showing <span className="font-medium">{(currentPage - 1) * USERS_PER_PAGE + 1}-{Math.min(currentPage * USERS_PER_PAGE, currentUsers.length)}</span> of <span className="font-medium">{currentUsers.length}</span> users
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 border border-gray-200 rounded-lg text-sm transition-colors ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-white'}`}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${page === currentPage ? 'bg-[#F5C518] text-[#1A1A1A]' : 'border border-gray-200 text-gray-600 hover:bg-white'}`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 border border-gray-200 rounded-lg text-sm transition-colors ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-white'}`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="px-8 py-6 border-t border-gray-100" >
          <p className="text-center text-sm text-gray-400">
            © {currentTime.getFullYear()} AfterBell India. All rights reserved.
          </p>
        </footer>
      </main>

      {/* User Details Modal */}
      {
        selectedUser && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
              <button
                onClick={() => setSelectedUser(null)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4 mb-6">
                {selectedUser.avatarUrl ? (
                  <img src={selectedUser.avatarUrl} alt="Avatar" className="w-16 h-16 rounded-2xl object-cover shadow-inner" />
                ) : (
                  <div className={`w-16 h-16 ${selectedUser.color} rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-inner`}>
                    {selectedUser.avatar}
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-[#1A1A1A]">{selectedUser.name}</h2>
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold text-gray-600 capitalize">
                    {selectedUser.role} Account
                  </span>
                  <span className={`ml-2 px-3 py-1 rounded-full text-xs font-semibold ${selectedUser.status === 'Verified' || selectedUser.status === 'Active' ? 'bg-green-100 text-green-700' : (selectedUser.status === 'Rejected' || selectedUser.status === 'Banned' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700')}`}>
                    {selectedUser.status}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-xl">
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Email</p>
                    <p className="text-sm font-medium text-[#1A1A1A] truncate">{selectedUser.email}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl">
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Phone</p>
                    <p className="text-sm font-medium text-[#1A1A1A]">{selectedUser.phone || 'N/A'}</p>
                  </div>
                </div>

                {selectedUser.role === 'student' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-xl">
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">University</p>
                      <p className="text-sm font-medium text-[#1A1A1A]">{selectedUser.college}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl">
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Location / Address</p>
                      <p className="text-sm font-medium text-[#1A1A1A]">{selectedUser.location}</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-xl">
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Company / Type</p>
                      <p className="text-sm font-medium text-[#1A1A1A]">{selectedUser.business}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl">
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Address</p>
                      <p className="text-sm font-medium text-[#1A1A1A]">{selectedUser.location}</p>
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Joined Date</p>
                  <p className="text-sm font-medium text-[#1A1A1A]">
                    {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleString() : 'Unknown'}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button onClick={() => setSelectedUser(null)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors">
                  Close
                </button>
                <button
                  onClick={() => {
                    handleBanToggle(selectedUser.id, selectedUser.role);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 bg-red-100 text-red-600 font-medium hover:bg-red-200 rounded-xl transition-colors"
                >
                  Ban User
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div>
  );
}
