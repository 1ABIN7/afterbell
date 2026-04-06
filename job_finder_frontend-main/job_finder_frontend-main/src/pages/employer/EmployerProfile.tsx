import type { PageView } from '../../App';
import { API_URL } from '../../lib/api';
import {
  Building2, Mail, Phone, MapPin, Star, Edit2, Camera, CheckCircle,
  Briefcase as BriefcaseIcon, LogOut
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { validatePhone } from '../../lib/validation';
import { EmployerSidebar } from '../../components/layout/EmployerSidebar';

interface EmployerProfileProps {
  onNavigate: (view: PageView) => void;
  onLogout: () => void;
}

export function EmployerProfile({ onNavigate, onLogout }: EmployerProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveMsg, setSaveMsg] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [activeJobsCount, setActiveJobsCount] = useState(0);
  const [memberSince, setMemberSince] = useState('');
  const [totalHires, setTotalHires] = useState(0);

  const [profileData, setProfileData] = useState({
    full_name: '',
    company_name: '',
    email: '',
    phone: '',
    course: '',       // business type
    address: '',
    university: '',   // city
    year: '',         // pincode
    bio: '',
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
          company_name: data.company_name || '',
          email: session.user.email || '',
          phone: data.phone || '',
          course: data.course || '',
          address: data.address || '',
          university: data.university || '',
          year: data.year || '',
          bio: data.bio || '',
          avatar_url: data.avatar_url || ''
        });
        // member since year
        const created = session.user.created_at || data.created_at;
        if (created) setMemberSince(new Date(created).getFullYear().toString());
      }

      // Live: active jobs
      const jRes = await fetch(`${API_URL}/api/employer/jobs`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (jRes.ok) {
        const jj = await jRes.json();
        const jobs = jj.data || [];
        setActiveJobsCount(jobs.filter((j: any) => j.status === 'open').length);
      }

      // Live: total accepted applications (hires)
      const aRes = await fetch(`${API_URL}/api/applications/employer`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (aRes.ok) {
        const aj = await aRes.json();
        const apps = aj.data || [];
        setTotalHires(apps.filter((a: any) => ['accepted', 'approved'].includes(a.status)).length);
      }
      
      // Fetch Ratings
      const rRes = await fetch(`${API_URL}/api/users/${session.user.id}/ratings`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (rRes.ok) {
        const rj = await rRes.json();
        setRatingData({ average: rj.stats?.average || 0, count: rj.stats?.count || 0 });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!isEditing) { setIsEditing(true); return; }

    if (profileData.phone) {
      const phoneValidation = validatePhone(profileData.phone);
      if (!phoneValidation.isValid) {
        setSaveMsg(`❌ ${phoneValidation.error}`);
        return;
      }
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${API_URL}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(profileData)
      });
      if (res.ok) {
        setIsEditing(false);
        setSaveMsg('✅ Profile updated!');
        setTimeout(() => setSaveMsg(''), 3000);
      } else {
        setSaveMsg('❌ Failed to update profile');
      }
    } catch (e) {
      setSaveMsg('❌ Network error');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSaveMsg('❌ Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSaveMsg('❌ Image must be smaller than 5MB');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const userId = session.user.id;
      const ext = file.name.split('.').pop();
      const filePath = `${userId}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const urlWithBust = `${publicUrl}?t=${Date.now()}`;

      await fetch(`${API_URL}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ avatar_url: publicUrl })
      });

      setProfileData(prev => ({ ...prev, avatar_url: urlWithBust }));
      setSaveMsg('✅ Profile photo updated!');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err: any) {
      console.error('Avatar upload failed:', err);
      setSaveMsg('❌ ' + (err?.message || 'Failed to upload. Check Supabase Storage avatars bucket.'));
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const stats = [
    { label: 'Active Jobs', value: activeJobsCount },
    { label: 'Total Hires', value: totalHires },
    { label: 'Member Since', value: memberSince || '—' },
  ];


  return (
    <div className="min-h-screen bg-[#FFFBF0] dark:bg-[#121212] flex transition-colors duration-200">
      <EmployerSidebar activeView="employer-profile" onNavigate={onNavigate} onLogout={onLogout} />

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40 px-4 md:px-8 py-4 pt-16 lg:pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">

              <div>
                <h1 className="text-2xl font-bold text-[#1A1A1A] dark:text-white">Business Profile</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage your business information</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {saveMsg && <span className={`text-sm font-medium ${saveMsg.startsWith('✅') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{saveMsg}</span>}
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-[#F5C518] text-[#1A1A1A] rounded-xl font-medium hover:bg-[#E5B508] transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                {isEditing ? 'Save Changes' : 'Edit Profile'}
              </button>
            </div>
          </div>
        </header>

        {/* Profile Content */}
        <div className="p-8 flex-1">
          {/* Profile Header */}
          <div className="bg-white dark:bg-[#2D2D2D] border border-transparent dark:border-gray-800 rounded-2xl p-8 card-shadow mb-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Avatar */}
              <div className="relative group cursor-pointer" onClick={() => !isUploadingPhoto && document.getElementById('avatar-upload')?.click()}>
                {profileData.avatar_url ? (
                  <img src={profileData.avatar_url} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-[#1A1A1A] shadow-md" />
                ) : (
                  <div className="w-32 h-32 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full flex items-center justify-center text-white text-4xl font-bold border-4 border-white dark:border-[#1A1A1A] shadow-md">
                    {profileData.full_name ? profileData.full_name.substring(0, 1).toUpperCase() : 'B'}
                  </div>
                )}
                <div className={`absolute bottom-0 right-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors ${isUploadingPhoto ? 'bg-gray-300' : 'bg-[#F5C518] hover:bg-[#E5B508]'}`}>
                  {isUploadingPhoto
                    ? <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                    : <Camera className="w-5 h-5 text-[#1A1A1A]" />}
                </div>
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                  <h2 className="text-3xl font-bold text-[#1A1A1A] dark:text-white">{profileData.company_name || profileData.full_name || 'Business Name'}</h2>
                </div>
                <p className="text-gray-500 dark:text-gray-400 mb-2">{profileData.course || 'Business Type'}{profileData.university ? ` • ${profileData.university}` : ''}</p>
                {profileData.phone && <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">📞 {profileData.phone}</p>}
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
            {/* Business Information */}
            <div className="bg-white dark:bg-[#2D2D2D] border border-transparent dark:border-gray-800 rounded-2xl p-6 card-shadow">
              <h3 className="text-lg font-bold text-[#1A1A1A] dark:text-white mb-6">Business Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Company / Business Name</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-[#1A1A1A] rounded-xl border border-transparent dark:border-gray-700">
                    <Building2 className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      value={profileData.company_name}
                      onChange={(e) => setProfileData({ ...profileData, company_name: e.target.value })}
                      disabled={!isEditing}
                      placeholder="e.g. Sunrise Bakery"
                      className="bg-transparent flex-1 focus:outline-none disabled:text-gray-600 dark:disabled:text-gray-400 dark:text-white dark:placeholder-gray-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Owner / Contact Name</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-[#1A1A1A] rounded-xl border border-transparent dark:border-gray-700">
                    <Building2 className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      value={profileData.full_name}
                      onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                      disabled={!isEditing}
                      className="bg-transparent flex-1 focus:outline-none disabled:text-gray-600 dark:disabled:text-gray-400 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Business Type</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-[#1A1A1A] rounded-xl border border-transparent dark:border-gray-700">
                    <BriefcaseIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      value={profileData.course}
                      onChange={(e) => setProfileData({ ...profileData, course: e.target.value })}
                      disabled={!isEditing}
                      className="bg-transparent flex-1 focus:outline-none disabled:text-gray-600 dark:disabled:text-gray-400 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Email</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-[#1A1A1A] rounded-xl border border-transparent dark:border-gray-700">
                    <Mail className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="email"
                      value={profileData.email}
                      disabled={true}
                      className="bg-transparent flex-1 focus:outline-none disabled:text-gray-600 dark:disabled:text-gray-500 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Phone</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-[#1A1A1A] rounded-xl border border-transparent dark:border-gray-700">
                    <Phone className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value.replace(/\D/g, '') })}
                      disabled={!isEditing}
                      className="bg-transparent flex-1 focus:outline-none disabled:text-gray-600 dark:disabled:text-gray-400 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-white dark:bg-[#2D2D2D] border border-transparent dark:border-gray-800 rounded-2xl p-6 card-shadow">
              <h3 className="text-lg font-bold text-[#1A1A1A] dark:text-white mb-6">Location</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Address</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-[#1A1A1A] rounded-xl border border-transparent dark:border-gray-700">
                    <MapPin className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      value={profileData.address}
                      onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                      disabled={!isEditing}
                      className="bg-transparent flex-1 focus:outline-none disabled:text-gray-600 dark:disabled:text-gray-400 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">City</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-[#1A1A1A] rounded-xl border border-transparent dark:border-gray-700">
                    <MapPin className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      value={profileData.university}
                      onChange={(e) => setProfileData({ ...profileData, university: e.target.value })}
                      disabled={!isEditing}
                      className="bg-transparent flex-1 focus:outline-none disabled:text-gray-600 dark:disabled:text-gray-400 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Pincode</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-[#1A1A1A] rounded-xl border border-transparent dark:border-gray-700">
                    <MapPin className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      value={profileData.year}
                      onChange={(e) => setProfileData({ ...profileData, year: e.target.value })}
                      disabled={!isEditing}
                      className="bg-transparent flex-1 focus:outline-none disabled:text-gray-600 dark:disabled:text-gray-400 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* About */}
          <div className="bg-white dark:bg-[#2D2D2D] border border-transparent dark:border-gray-800 rounded-2xl p-6 card-shadow mt-8">
            <h3 className="text-lg font-bold text-[#1A1A1A] dark:text-white mb-4">About</h3>
            <textarea
              value={profileData.bio}
              onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
              disabled={!isEditing}
              rows={4}
              placeholder="Tell us about your business..."
              className="w-full px-4 py-3 bg-gray-50 dark:bg-[#1A1A1A] border border-transparent dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F5C518] disabled:text-gray-600 dark:disabled:text-gray-400 dark:text-white dark:placeholder-gray-500 resize-none"
            />
          </div>

          {/* Logout Section */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 font-bold hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors border border-transparent dark:border-red-900/30"
            >
              <LogOut className="w-5 h-5" />
              <span>Log Out of AfterBell</span>
            </button>
          </div>
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
