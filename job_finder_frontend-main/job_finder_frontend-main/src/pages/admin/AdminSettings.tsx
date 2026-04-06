import type { PageView } from '../../App';
import { API_URL } from '../../lib/api';
import {
  User, Mail, Lock, BellRing, ShieldCheck, Globe
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { AdminSidebar } from '../../components/layout/AdminSidebar';
import { supabase } from '../../lib/supabaseClient';

interface AdminSettingsProps {
  onNavigate: (view: PageView) => void;
  onLogout: () => void;
}

export function AdminSettings({ onNavigate, onLogout }: AdminSettingsProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  // Profile State
  const [profileName, setProfileName] = useState('System Admin');
  const [profileEmail, setProfileEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setProfileEmail(session.user.email || '');
      const { data } = await supabase.from('profiles').select('full_name').eq('id', session.user.id).single();
      if (data && data.full_name) {
        setProfileName(data.full_name);
      }
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${API_URL}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ full_name: profileName })
      });
      if (res.ok) showToast("Profile updated successfully", "success");
      else showToast("Failed to update profile", "error");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) return showToast("Please fill in all fields", "error");
    if (newPassword !== confirmPassword) return showToast("New passwords do not match", "error");
    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) showToast(error.message, "error");
      else {
        showToast("Password updated securely", "success");
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBF0] flex">
      <AdminSidebar activeView="admin-settings" onNavigate={onNavigate} onLogout={onLogout} />

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[999] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg text-white font-medium text-sm transition-all duration-300 ${toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
          }`}>
          <span>{toast.msg}</span>
          <button onClick={() => setToast(null)} className="ml-1 opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 px-4 md:px-8 py-4 pt-16 lg:pt-4">
          <div className="flex items-center gap-4">

            <div>
              <h1 className="text-2xl font-bold text-[#1A1A1A]">Settings</h1>
              <p className="text-sm text-gray-500">Manage platform and account settings</p>
            </div>
          </div>
        </header>

        {/* Settings Content */}
        <div className="p-4 md:p-8">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Sidebar Tabs */}
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full px-6 py-4 flex items-center gap-3 text-left transition-colors ${activeTab === 'profile' ? 'bg-[#F5C518]/10 text-[#1A1A1A]' : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              <User className="w-5 h-5" />
              <span className="font-medium">Profile</span>
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`w-full px-6 py-4 flex items-center gap-3 text-left transition-colors ${activeTab === 'security' ? 'bg-[#F5C518]/10 text-[#1A1A1A]' : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              <ShieldCheck className="w-5 h-5" />
              <span className="font-medium">Security</span>
            </button>

            {/* Content */}
            <div className="md:col-span-3">
              {activeTab === 'profile' && (
                <div className="bg-white rounded-2xl p-8 card-shadow">
                  <h2 className="text-xl font-bold text-[#1A1A1A] mb-6">Admin Profile</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Full Name</label>
                      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
                        <User className="w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          className="bg-transparent flex-1 focus:outline-none text-[#1A1A1A]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Email</label>
                      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl opacity-70">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          value={profileEmail}
                          disabled
                          className="bg-transparent flex-1 focus:outline-none text-gray-500 cursor-not-allowed"
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-2">Email address cannot be changed for admin accounts.</p>
                    </div>
                    <button onClick={handleSaveProfile} disabled={loading} className="btn-primary w-full disabled:opacity-50">
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="bg-white rounded-2xl p-8 card-shadow">
                  <h2 className="text-xl font-bold text-[#1A1A1A] mb-6">Security Settings</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">New Password</label>
                      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
                        <Lock className="w-5 h-5 text-gray-400" />
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                          className="bg-transparent flex-1 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Confirm New Password</label>
                      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
                        <Lock className="w-5 h-5 text-gray-400" />
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          className="bg-transparent flex-1 focus:outline-none"
                        />
                      </div>
                    </div>
                    <button onClick={handleUpdatePassword} disabled={loading} className="btn-primary w-full disabled:opacity-50">
                      {loading ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </div>
              )}
            </div>
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
