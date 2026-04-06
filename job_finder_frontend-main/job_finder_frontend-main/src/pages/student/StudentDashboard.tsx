import type { PageView } from '../../App';
import { API_URL } from '../../lib/api';
import {
  Clock, ChevronRight, Bookmark, Navigation,
  Search, Briefcase, AlertCircle
} from 'lucide-react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { StudentSidebar } from '../../components/layout/StudentSidebar';
import { NotificationBell } from '../../components/layout/NotificationBell';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet default icon issue completely
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Red "You Are Here" marker
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface StudentDashboardProps {
  onNavigate: (view: PageView) => void;
  onLogout?: () => void;
  setGlobalSearchQuery: (q: string) => void;
}

export function StudentDashboard({ onNavigate, onLogout, setGlobalSearchQuery }: StudentDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [userName, setUserName] = useState<string>('');
  const [userInitials, setUserInitials] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [recommendedJobs, setRecommendedJobs] = useState<any[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [activeAppsCount, setActiveAppsCount] = useState<number>(0);
  const [pendingAppsCount, setPendingAppsCount] = useState<number>(0);
  const [totalJobsCount, setTotalJobsCount] = useState<number>(0);
  const [todayJobsCount, setTodayJobsCount] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [allMapJobs, setAllMapJobs] = useState<any[]>([]);
  const [profileCompletion, setProfileCompletion] = useState<number>(0);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  useEffect(() => {
    // Only fetch time once on mount. The date won't change while browsing.
    // This stops the 1s interval that causes mass re-renders.
    setCurrentTime(new Date());
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      if (session) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data, error }) => {
            if (error || !data) {
              console.error('Failed to fetch user profile for location:', error?.message);
              // Fallback: fetch jobs without distance sorting so the dashboard unblocks
              fetchJobs(session.access_token);
              return;
            }
            if (data.full_name) {
              setUserName(data.full_name);
              setUserInitials(data.full_name.charAt(0).toUpperCase());
            }
            if (data.avatar_url) {
              setAvatarUrl(data.avatar_url);
            }

            // Calculate Profile Completion
            const requiredFields = ['full_name', 'phone', 'university', 'course', 'year', 'address', 'avatar_url'];
            const missing = requiredFields.filter(f => !data[f]);
            const completePct = Math.round(((requiredFields.length - missing.length) / requiredFields.length) * 100);
            setProfileCompletion(completePct);
            setMissingFields(missing);

            if (data.latitude && data.longitude) {
              setUserLocation({ lat: data.latitude, lng: data.longitude });
              fetchJobs(session.access_token, data.latitude, data.longitude);
            } else {
              fetchJobs(session.access_token);
            }
          });
        fetchApplications(session.access_token);
      }
    });
  }, []);



  const fetchJobs = useCallback(async (token: string, lat?: number, lng?: number) => {
    try {
      let url = `${API_URL}/api/jobs`;
      if (lat !== undefined && lng !== undefined) {
        url += `?lat=${lat}&lng=${lng}`;
      }
      const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) {
        const resData = await response.json();
        const allJobs = resData.data || [];
        setAllMapJobs(allJobs.filter((j: any) => j.latitude && j.longitude));

        if (lat !== undefined && lng !== undefined) {
          const nearbyJobs = allJobs.filter((j: any) => j.distance_km !== undefined && j.distance_km !== null && j.distance_km <= 5);
          setTotalJobsCount(nearbyJobs.length);
          const todayCount = nearbyJobs.filter((j: any) => new Date(j.created_at).getTime() > Date.now() - 86400000).length;
          setTodayJobsCount(todayCount);
          setRecommendedJobs(nearbyJobs.slice(0, 3));
        } else {
          setTotalJobsCount(allJobs.length);
          setTodayJobsCount(0);
          setRecommendedJobs(allJobs.slice(0, 3));
        }
      }
    } catch (err) {
      console.error('Failed to fetch recommended jobs:', err);
    } finally {
      setIsLoadingJobs(false);
    }
  }, []);




  const fetchApplications = useCallback(async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/applications/student`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const resData = await response.json();
        const apps = resData.data || [];
        const active = apps.filter((a: any) => ['pending', 'interviewing', 'accepted', 'approved'].includes(a.status));
        setActiveAppsCount(active.length);
        const pending = apps.filter((a: any) => a.status === 'pending');
        setPendingAppsCount(pending.length);
      }
    } catch (err) {
      console.error("Failed to fetch applications:", err);
    }
  }, []);

  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      setGlobalSearchQuery(searchQuery);
      onNavigate('student-jobs');
    }
  }, [searchQuery, setGlobalSearchQuery, onNavigate]);

  const executeSearch = useCallback(() => {
    if (searchQuery.trim()) {
      setGlobalSearchQuery(searchQuery);
      onNavigate('student-jobs');
    }
  }, [searchQuery, setGlobalSearchQuery, onNavigate]);

  return (
    <div className="min-h-screen bg-[#FFFBF0] dark:bg-[#121212] flex transition-colors duration-200">
      <StudentSidebar activeView="student-dashboard" onNavigate={onNavigate} onLogout={onLogout} />

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        {/* Header */}
        <header className="bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40 px-4 md:px-8 py-4 pt-16 lg:pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">


              </div>
              <div className="flex-1 min-w-0 pr-2">
                <p className="hidden md:block text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {currentTime.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                </p>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-[#1A1A1A] dark:text-white leading-tight break-words">
                  Welcome, <span className="text-[#F5C518] block sm:inline">{userName || 'Student'}!</span>
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Search Bar - Hidden on small mobile */}
              <div className="relative flex-1 max-w-md hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-white rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#F5C518] transition-all duration-200"
                />
              </div>
              <NotificationBell />
              <button
                onClick={() => onNavigate('student-profile')}
                className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold hover:ring-2 hover:ring-[#F5C518] transition-all overflow-hidden"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  userInitials || 'S'
                )}
              </button>
              <button
                onClick={() => onNavigate('student-jobs')}
                className="btn-dark flex items-center gap-2 px-3 md:px-4"
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Find Nearby Jobs</span>
                <span className="sm:hidden text-xs">Find Jobs</span>
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-4 md:p-8">
          {/* Profile Completion Bar */}
          {profileCompletion < 100 && (
            <div className="mb-8 bg-white dark:bg-[#2D2D2D] rounded-2xl p-6 card-shadow border border-gray-100 dark:border-gray-800 animate-fade-in-up">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1A1A1A] dark:text-white">Complete your profile</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      You're missing {missingFields.length} field{missingFields.length !== 1 ? 's' : ''}. Complete it to stand out!
                    </p>
                  </div>
                </div>
                <div className="font-bold text-2xl text-[#1A1A1A] dark:text-white">
                  {profileCompletion}%
                </div>
              </div>
              
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 mb-4 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-orange-400 to-[#F5C518] h-3 rounded-full transition-all duration-1000 ease-out relative" 
                  style={{ width: `${profileCompletion}%` }}
                >
                  <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2 text-xs">
                  {missingFields.slice(0, 3).map(f => (
                    <span key={f} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-md capitalize font-medium">
                      {f.replace('_', ' ')}
                    </span>
                  ))}
                  {missingFields.length > 3 && <span className="text-gray-400 font-medium">+{missingFields.length - 3} more</span>}
                </div>
                <button
                  onClick={() => onNavigate('student-profile')}
                  className="w-full sm:w-auto px-6 py-2 bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] font-bold rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors text-sm whitespace-nowrap"
                >
                  Update Profile
                </button>
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Nearby Jobs Card */}
            <div className="bg-white dark:bg-[#2D2D2D] rounded-2xl p-6 card-shadow border border-transparent dark:border-gray-800 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg animate-fade-in-up">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-[#F5C518]/20 dark:bg-[#F5C518]/10 rounded-xl flex items-center justify-center">
                  <Navigation className="w-6 h-6 text-[#F5C518] dark:text-yellow-400" />
                </div>
                {todayJobsCount > 0 && (
                  <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    +{todayJobsCount} today
                  </span>
                )}
              </div>
              <p className="text-4xl font-bold text-[#1A1A1A] dark:text-white mb-2">{totalJobsCount}</p>
              <p className="text-gray-600 dark:text-gray-300 font-medium">{userLocation ? 'Nearby Jobs Available' : 'Total Jobs Available'}</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{userLocation ? 'Within 5 km of you' : 'Enable location for nearby jobs'}</p>
            </div>

            {/* Active Applications Card */}
            <div className="bg-white dark:bg-[#2D2D2D] rounded-2xl p-6 card-shadow border border-transparent dark:border-gray-800 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                </div>
                <button
                  onClick={() => onNavigate('student-applications')}
                  className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View All
                </button>
              </div>
              <p className="text-4xl font-bold text-[#1A1A1A] dark:text-white mb-2">{activeAppsCount}</p>
              <p className="text-gray-600 dark:text-gray-300 font-medium">Active Applications</p>
              {pendingAppsCount > 0 ? (
                <p className="text-sm text-orange-500 mt-1 flex items-center gap-1">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  {pendingAppsCount} Review Pending
                </p>
              ) : (
                <p className="text-sm text-gray-400 mt-1">No pending updates</p>
              )}
            </div>

            {/* Application Tracker Card */}
            {activeAppsCount > 0 ? (
              <div className="bg-[#1A1A1A] rounded-2xl p-6 text-white flex flex-col justify-center min-h-[160px] card-shadow border border-transparent dark:border-gray-800 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10"></div>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-[#F5C518]" />
                  </div>
                  <span className="text-xs font-medium text-[#F5C518] bg-[#F5C518]/20 px-2 py-1 rounded-full">
                    ACTIVE
                  </span>
                </div>
                <p className="text-xl font-bold mb-1">Application Progress</p>
                <p className="text-gray-400 text-sm mb-4">You have {activeAppsCount} active applications!</p>
                <button
                  onClick={() => onNavigate('student-applications')}
                  className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
                >
                  Open Applications
                </button>
              </div>
            ) : (
              <div className="bg-[#1A1A1A] rounded-2xl p-6 text-white flex flex-col justify-center items-center text-center min-h-[160px] card-shadow border border-transparent dark:border-gray-800 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                <Briefcase className="w-12 h-12 text-[#F5C518] mb-4 opacity-70" />
                <p className="text-lg font-bold">Ready to Work?</p>
                <p className="text-gray-400 text-sm mt-1 mb-4">Start applying to unlock your schedule.</p>
                <button
                  onClick={() => onNavigate('student-jobs')}
                  className="w-full py-2 bg-[#F5C518] text-[#1A1A1A] hover:bg-yellow-400 rounded-lg text-sm font-bold transition-colors"
                >
                  Find Jobs
                </button>
              </div>
            )}
          </div>

          {/* Main Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Hotspots Map Section */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#1A1A1A] dark:text-white">Hotspots Near You</h2>
                <button
                  onClick={() => onNavigate('student-jobs')}
                  className="text-[#F5C518] font-medium hover:underline flex items-center gap-1"
                >
                  View Map
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <style>
                {`
                  /* Dark mode map tiles inversion */
                  .dark .dark-map-tiles {
                    filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7);
                  }
                `}
              </style>
              <div className="bg-gray-100 dark:bg-[#1A1A1A] rounded-2xl relative overflow-hidden h-[400px] border border-gray-200 dark:border-gray-800 z-0 map-container">
                <MapContainer
                  key={userLocation ? `${userLocation.lat}-${userLocation.lng}` : 'default'}
                  center={userLocation ? [userLocation.lat, userLocation.lng] : [9.5916, 76.5222]}
                  zoom={12}
                  style={{ height: '100%', width: '100%', zIndex: 0 }}
                  attributionControl={false}
                >
                  <TileLayer
                    attribution=''
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    className="dark-map-tiles"
                  />
                  {/* Red "You Are Here" user location marker */}
                  {userLocation && (
                    <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                      <Popup><strong>📍 You are here</strong></Popup>
                    </Marker>
                  )}
                  {/* All geocoded job markers */}
                  {allMapJobs.slice(0, 50).map((job: any) => (
                    <Marker key={job.id} position={[job.latitude, job.longitude]} icon={customIcon}>
                      <Popup>
                        <div className="p-1">
                          <p className="font-bold text-[#1A1A1A] m-0">{job.title}</p>
                          <p className="text-xs text-gray-500 m-0">{job.company_name}</p>
                          {job.distance_km !== undefined && (
                            <p className="text-xs text-blue-600 m-0">{job.distance_km.toFixed(1)} km away</p>
                          )}
                          <p className="text-xs text-green-600 font-semibold m-0 mt-1">{job.wage}</p>
                          <button
                            onClick={() => onNavigate('student-jobs')}
                            className="w-full mt-2 py-1 bg-[#F5C518] text-[#1A1A1A] font-medium text-xs rounded hover:bg-yellow-400"
                          >
                            View Details
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </div>

            {/* Recommended Jobs */}
            <div>
              <h2 className="text-xl font-bold text-[#1A1A1A] dark:text-white mb-6">Recommended</h2>
              <div className="space-y-4">
                {isLoadingJobs ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="bg-white dark:bg-[#2D2D2D] rounded-xl p-4 border border-transparent dark:border-gray-800 animate-pulse">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        <div className="flex-1 space-y-2 py-1">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                          <div className="flex gap-2 mt-2">
                            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                          </div>
                        </div>
                        <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </div>
                    </div>
                  ))
                ) : recommendedJobs.length > 0 ? (
                  recommendedJobs.map((job, index) => (
                    <div key={index} className="bg-white dark:bg-[#2D2D2D] rounded-xl p-4 card-shadow hover:card-shadow-hover border border-transparent dark:border-gray-800 transition-all duration-300">
                      <div className="flex items-start gap-3">
                        {job.image_url ? (
                          <img src={job.image_url} alt="Shop" className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className={`w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-xl`}>
                            💼
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#1A1A1A] dark:text-white truncate">{job.title}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{job.company_name}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                              Part-time
                            </span>
                            <span className="text-xs text-[#F5C518] font-medium">₹{job.wage}/day</span>
                          </div>
                        </div>
                        <button
                          onClick={() => onNavigate('student-saved')}
                          className="text-gray-400 hover:text-[#F5C518] transition-colors"
                        >
                          <Bookmark className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-6 bg-gray-50 dark:bg-[#1A1A1A] rounded-xl border border-transparent dark:border-gray-800">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No jobs available right now.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
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
