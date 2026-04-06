import type { PageView } from '../../App';
import { API_URL } from '../../lib/api';
import {
  User, Mail, Phone, MapPin, GraduationCap, Star, Edit2, Camera, CheckCircle, BookOpen, Calendar, LogOut
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { validatePhone } from '../../lib/validation';
import { StudentSidebar } from '../../components/layout/StudentSidebar';

interface StudentProfileProps {
  onNavigate: (view: PageView) => void;
  onLogout: () => void;
}

export function StudentProfile({ onNavigate, onLogout }: StudentProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    phone: '',
    university: '',
    course: '',
    year: '',
    address: '',
    avatar_url: ''
  });
  const [ratingData, setRatingData] = useState({ average: 0, count: 0 });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${API_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        const json = await res.json();
        const data = json.data;
        setProfileData({
          full_name: data.full_name || '',
          email: session.user.email || '',
          phone: data.phone || '',
          university: data.university || '',
          course: data.course || '',
          year: data.year || '',
          address: data.address || '',
          avatar_url: data.avatar_url || ''
        });
        fetchRating(session.user.id, session.access_token);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRating = async (userId: string, token: string) => {
    try {
      const res = await fetch(`${API_URL}/api/users/${userId}/ratings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setRatingData({ average: json.stats?.average || 0, count: json.stats?.count || 0 });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    if (profileData.phone) {
      const phoneValidation = validatePhone(profileData.phone);
      if (!phoneValidation.isValid) {
        showToast(phoneValidation.error, 'error');
        return;
      }
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${API_URL}/api/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(profileData)
      });
      if (res.ok) {
        setIsEditing(false);
        showToast('Profile updated successfully!', 'success');
      } else {
        showToast('Failed to update profile', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Error updating profile', 'error');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size (max 5MB)
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be smaller than 5MB', 'error');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { showToast('Not logged in', 'error'); return; }

      const userId = session.user.id;
      const ext = file.name.split('.').pop();
      const filePath = `${userId}/avatar.${ext}`;

      // Upload to Supabase Storage bucket 'avatars'
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Add cache-busting param so browser re-fetches freshly uploaded image
      const urlWithBust = `${publicUrl}?t=${Date.now()}`;

      // Save the URL to the profile immediately
      await fetch(`${API_URL}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ avatar_url: publicUrl })
      });

      setProfileData(prev => ({ ...prev, avatar_url: urlWithBust }));
      showToast('Profile photo updated!', 'success');
    } catch (err: any) {
      console.error('Avatar upload failed:', err);
      showToast(err?.message || 'Failed to upload photo. Make sure the avatars bucket exists in Supabase Storage.', 'error');
    } finally {
      setIsUploadingPhoto(false);
      // Reset input so same file can be re-selected
      e.target.value = '';
    }
  };

  const stats = [
    { label: 'Rating', value: ratingData.average > 0 ? ratingData.average.toString() : 'N/A' },
    { label: 'Reviews', value: ratingData.count },
    { label: 'Member Since', value: '2026' },
  ];

  return (
    <div className="min-h-screen bg-[#FFFBF0] dark:bg-[#121212] flex transition-colors duration-200">
      <StudentSidebar activeView="student-profile" onNavigate={onNavigate} onLogout={onLogout} />

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[999] px-5 py-3 rounded-xl shadow-lg text-white font-medium text-sm ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}>
          {toast.msg}
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40 px-4 md:px-8 py-4 pt-16 lg:pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">

              <div>
                <h1 className="text-2xl font-bold text-[#1A1A1A] dark:text-white">My Profile</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage your account settings</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#F5C518] text-[#1A1A1A] rounded-xl font-medium hover:bg-[#E5B508] transition-colors flex-shrink-0"
            >
              <Edit2 className="w-4 h-4" />
              <span className="hidden sm:inline">{isEditing ? 'Save Changes' : 'Edit Profile'}</span>
              <span className="sm:hidden">{isEditing ? 'Save' : 'Edit'}</span>
            </button>
          </div>
        </header>

        {/* Profile Content */}
        <div className="p-8 flex-1">
          {/* Profile Header */}
          <div className="bg-white dark:bg-[#2D2D2D] rounded-2xl p-8 card-shadow border border-transparent dark:border-gray-800 mb-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Avatar */}
              <div className="relative group cursor-pointer" onClick={() => !isUploadingPhoto && document.getElementById('student-avatar-upload')?.click()}>
                {profileData.avatar_url ? (
                  <img src={profileData.avatar_url} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-[#1A1A1A] shadow-md" />
                ) : (
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white text-4xl font-bold border-4 border-white dark:border-[#1A1A1A] shadow-md">
                    {profileData.full_name ? profileData.full_name.substring(0, 2).toUpperCase() : 'ST'}
                  </div>
                )}
                <div className={`absolute bottom-0 right-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors ${isUploadingPhoto ? 'bg-gray-300' : 'bg-[#F5C518] hover:bg-[#E5B508]'}`}>
                  {isUploadingPhoto
                    ? <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                    : <Camera className="w-5 h-5 text-[#1A1A1A]" />}
                </div>
                <input
                  type="file"
                  id="student-avatar-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                  <h2 className="text-3xl font-bold text-[#1A1A1A] dark:text-white">{profileData.full_name || 'Your Name'}</h2>
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 rounded-full text-sm font-medium flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Verified
                  </span>
                </div>
                <p className="text-gray-500 dark:text-gray-400 mb-4">{profileData.course || 'Course'} • {profileData.year || 'Year'} • {profileData.university || 'University'}</p>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <Star className="w-5 h-5 fill-[#F5C518] text-[#F5C518]" />
                  <span className="font-bold text-[#1A1A1A] dark:text-white">{ratingData.average > 0 ? ratingData.average : 'New'}</span>
                  <span className="text-gray-400 dark:text-gray-500">({ratingData.count} reviews)</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-8 border-t border-gray-100 dark:border-gray-800">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <p className="text-2xl font-bold text-[#F5C518]">{stat.value}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Profile Details */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Personal Information */}
            <div className="bg-white dark:bg-[#2D2D2D] rounded-2xl p-6 card-shadow border border-transparent dark:border-gray-800">
              <h3 className="text-lg font-bold text-[#1A1A1A] dark:text-white mb-6">Personal Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Full Name</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-[#1A1A1A] border border-transparent dark:border-gray-700 rounded-xl">
                    <User className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      value={profileData.full_name}
                      onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                      disabled={!isEditing}
                      className="bg-transparent flex-1 focus:outline-none text-[#1A1A1A] dark:text-white disabled:text-gray-600 dark:disabled:text-gray-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Email</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-[#1A1A1A] border border-transparent dark:border-gray-700 rounded-xl">
                    <Mail className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="email"
                      value={profileData.email}
                      disabled={true}
                      className="bg-transparent flex-1 focus:outline-none text-[#1A1A1A] dark:text-white disabled:text-gray-600 dark:disabled:text-gray-500"
                      title="Email cannot be changed directly"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Phone</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-[#1A1A1A] border border-transparent dark:border-gray-700 rounded-xl">
                    <Phone className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value.replace(/\D/g, '') })}
                      disabled={!isEditing}
                      className="bg-transparent flex-1 focus:outline-none text-[#1A1A1A] dark:text-white disabled:text-gray-600 dark:disabled:text-gray-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="bg-white dark:bg-[#2D2D2D] rounded-2xl p-6 card-shadow border border-transparent dark:border-gray-800">
              <h3 className="text-lg font-bold text-[#1A1A1A] dark:text-white mb-6">Academic Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">College/University</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-[#1A1A1A] border border-transparent dark:border-gray-700 rounded-xl">
                    <GraduationCap className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      value={profileData.university}
                      onChange={(e) => setProfileData({ ...profileData, university: e.target.value })}
                      disabled={!isEditing}
                      className="bg-transparent flex-1 focus:outline-none text-[#1A1A1A] dark:text-white disabled:text-gray-600 dark:disabled:text-gray-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Course</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-[#1A1A1A] border border-transparent dark:border-gray-700 rounded-xl">
                    <BookOpen className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      value={profileData.course}
                      onChange={(e) => setProfileData({ ...profileData, course: e.target.value })}
                      disabled={!isEditing}
                      className="bg-transparent flex-1 focus:outline-none text-[#1A1A1A] dark:text-white disabled:text-gray-600 dark:disabled:text-gray-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Year</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-[#1A1A1A] border border-transparent dark:border-gray-700 rounded-xl">
                    <Calendar className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      value={profileData.year}
                      onChange={(e) => setProfileData({ ...profileData, year: e.target.value })}
                      disabled={!isEditing}
                      className="bg-transparent flex-1 focus:outline-none text-[#1A1A1A] dark:text-white disabled:text-gray-600 dark:disabled:text-gray-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white dark:bg-[#2D2D2D] rounded-2xl p-6 card-shadow mt-8 border border-transparent dark:border-gray-800">
            <h3 className="text-lg font-bold text-[#1A1A1A] dark:text-white mb-6">Location</h3>
            <div>
              <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Address</label>
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-[#1A1A1A] border border-transparent dark:border-gray-700 rounded-xl">
                <MapPin className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  value={profileData.address}
                  onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                  disabled={!isEditing}
                  className="bg-transparent flex-1 focus:outline-none text-[#1A1A1A] dark:text-white disabled:text-gray-600 dark:disabled:text-gray-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <div className="px-8 pt-4 pb-2">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-6 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-2xl font-semibold transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
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
