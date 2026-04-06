import type { PageView } from '../../App';
import { API_URL } from '../../lib/api';
import {
  Navigation, Bookmark, Flame, Settings, Search, Bell, AlertTriangle, Sparkles, X, Loader2, Star
} from 'lucide-react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import ReactConfetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { supabase } from '../../lib/supabaseClient';
import { StudentSidebar } from '../../components/layout/StudentSidebar';
import { NotificationBell } from '../../components/layout/NotificationBell';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const jobIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface StudentNearbyJobsProps {
  onNavigate: (view: PageView) => void;
  onLogout: () => void;
  globalSearchQuery: string;
  setGlobalSearchQuery: (q: string) => void;
}

export function StudentNearbyJobs({ onNavigate, onLogout, globalSearchQuery, setGlobalSearchQuery }: StudentNearbyJobsProps) {
  const [radius, setRadius] = useState<'1' | '3' | '5' | '10' | '25'>('5');
  const [searchQuery, setSearchQuery] = useState(globalSearchQuery);

  const [jobs, setJobs] = useState<any[]>([]);
  const [employerRatings, setEmployerRatings] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [visibleJobCount, setVisibleJobCount] = useState(6);
  const { width, height } = useWindowSize();

  // Toast notification state
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Report modal state
  const [reportJobId, setReportJobId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportSeverity, setReportSeverity] = useState<'low' | 'medium' | 'high'>('medium');

  // Sync search query changes back to global state
  useEffect(() => {
    setGlobalSearchQuery(searchQuery);
  }, [searchQuery, setGlobalSearchQuery]);

  // Application Modal State
  const [isApplyingToJob, setIsApplyingToJob] = useState<any | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Get user location
      let lat: number | undefined;
      let lng: number | undefined;
      const { data: profile } = await supabase.from('profiles').select('latitude, longitude').eq('id', session.user.id).single();
      if (profile && profile.latitude && profile.longitude) {
        lat = profile.latitude as number;
        lng = profile.longitude as number;
        setUserLocation([lat, lng] as [number, number]);
      }

      let url = `${API_URL}/api/jobs`;
      if (lat !== undefined && lng !== undefined) {
        url += `?lat=${lat}&lng=${lng}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }

      const resData = await response.json();
      const fetchedJobs = resData.data || [];
      setJobs(fetchedJobs);

      // Fetch employer ratings silently
      const employerIds = Array.from(new Set(fetchedJobs.map((j: any) => j.employer_id).filter(Boolean))) as string[];
      Promise.all(
        employerIds.map(eid =>
          fetch(`${API_URL}/api/users/${eid}/ratings`, {
            headers: { Authorization: `Bearer ${session.access_token}` }
          })
            .then(r => r.ok ? r.json() : { stats: { average: 0 } })
            .then(data => ({ eid, avg: data.stats?.average || 0 }))
            .catch(() => ({ eid, avg: 0 }))
        )
      ).then(ratingResults => {
        const rm: Record<string, number> = {};
        ratingResults.forEach(({ eid, avg }) => { rm[eid] = avg; });
        setEmployerRatings(rm);
      });

      // Also fetch saved jobs to show correct bookmark state
      const savedRes = await fetch(`${API_URL}/api/jobs/saved`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (savedRes.ok) {
        const savedData = await savedRes.json();
        const savedIds = new Set((savedData.data || []).map((sj: any) => sj.job_id));
        setSavedJobs(savedIds as Set<string>);
      }

      // Also fetch applied jobs
      const appRes = await fetch(`${API_URL}/api/applications/student`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (appRes.ok) {
        const appData = await appRes.json();
        const appIds = new Set((appData.data || []).map((a: any) => a.job_id));
        setAppliedJobs(appIds as Set<string>);
      }

    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyJob = async () => {
    if (!isApplyingToJob) return;

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const payload = {
        job_id: isApplyingToJob.id,
        role: 'student',
        cover_letter: coverLetter.trim() || undefined
      };
      const response = await fetch(`${API_URL}/api/applications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        setAppliedJobs(prev => new Set(prev).add(isApplyingToJob.id));
        showToast("Successfully applied! You can view it in 'My Applications'.", 'success');
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 4000);
        closeModal();
      } else {
        const err = await response.json();
        showToast(err.message || "Failed to apply", 'error');
      }
    } catch (e) {
      console.error(e);
      showToast("Error submitting application", 'error');
    } finally {
      setIsSubmitting(false);
    }
  };



  const closeModal = () => {
    setIsApplyingToJob(null);
    setCoverLetter('');
  };

  const handleReportJob = async () => {
    if (!reportJobId || !reportReason.trim()) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`${API_URL}/api/reports`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ job_id: reportJobId, reason: reportReason, severity: reportSeverity })
      });

      if (response.ok) {
        showToast("Job reported successfully. Our moderation team will review it.", 'success');
      } else {
        const err = await response.json();
        showToast(err.message || 'Failed to submit report', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('An error occurred while submitting the report.', 'error');
    } finally {
      setReportJobId(null);
      setReportReason('');
      setReportSeverity('medium');
    }
  };

  const handleSaveJob = async (jobId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`${API_URL}/api/jobs/save`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ job_id: jobId })
      });
      if (response.ok) {
        const json = await response.json();
        if (json.saved) {
          setSavedJobs(prev => new Set(prev).add(jobId));
          showToast("Job saved! View it in the 'Saved Jobs' section.", 'info');
        } else {
          setSavedJobs(prev => {
            const next = new Set(prev);
            next.delete(jobId);
            return next;
          });
          showToast("Job removed from saved list.", 'info');
        }
      } else {
        const err = await response.json();
        showToast(err.message || "Failed to save job", 'error');
      }
    } catch (e) {
      console.error(e);
      showToast("Error saving job", 'error');
    }
  };

  // Filter jobs by search query AND radius (if user location is known)
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesSearch = searchQuery === '' ||
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (job.company_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (job.location || '').toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesRadius = userLocation === null || job.distance_km === undefined || job.distance_km <= parseInt(radius);
      
      return matchesSearch && matchesRadius;
    });
  }, [jobs, searchQuery, radius, userLocation]);

  // Separate into nearby vs other for informational display
  const nearbyCount = useMemo(() => {
    return filteredJobs.filter(job =>
      job.distance_km !== undefined && job.distance_km <= parseInt(radius)
    ).length;
  }, [filteredJobs, radius]);

  // Cap the number of markers to prevent leaflet lag when panning/zooming over huge clusters
  const mapJobs = useMemo(() => {
    return filteredJobs.slice(0, 100);
  }, [filteredJobs]);

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
      <StudentSidebar activeView="student-jobs" onNavigate={onNavigate} onLogout={onLogout} />

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[999] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg text-white font-medium text-sm transition-all duration-300 ${toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
          }`}>
          <span>{toast.msg}</span>
          <button onClick={() => setToast(null)} className="ml-1 opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      <main className="flex-1 lg:ml-64">
        {/* Header */}
        <header className="bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40 px-4 md:px-8 py-4 pt-16 lg:pt-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full overflow-hidden">
              <div className="flex items-center gap-6 overflow-x-auto hide-scrollbar whitespace-nowrap max-w-full pb-1">
                <button
                  onClick={() => onNavigate('student-jobs')}
                  className="text-[#F5C518] font-semibold border-b-2 border-[#F5C518] pb-1 flex-shrink-0"
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
                  className="text-gray-600 dark:text-gray-400 hover:text-[#1A1A1A] dark:hover:text-white font-medium transition-colors flex-shrink-0"
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
                  placeholder="Search jobs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-white rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#F5C518] w-full md:w-56 transition-colors duration-200"
                />
              </div>
              <NotificationBell />
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 md:p-8">
          {/* Title and Filter */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#1A1A1A] dark:text-white mb-1">Find Jobs</h1>
              <p className="text-gray-500 dark:text-gray-400">
                {filteredJobs.length} open jobs available
                {userLocation && nearbyCount > 0 && (
                  <span className="ml-2 text-[#F5C518] font-medium">· {nearbyCount} within {radius} km</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1 max-w-full">
              <span className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide flex-shrink-0">Radius Filter</span>
              {(['1', '3', '5', '10', '25'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRadius(r)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${radius === r
                    ? 'bg-[#F5C518] text-[#1A1A1A]'
                    : 'bg-white dark:bg-[#2D2D2D] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                >
                  {r === '25' ? 'Under 25 km' : `${r} km`}
                </button>
              ))}
            </div>
          </div>

          {/* Jobs Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Map Card - spans multiple job rows */}
            <div className="lg:row-span-3">
              <div className="bg-white dark:bg-[#2D2D2D] rounded-2xl p-4 card-shadow border border-transparent dark:border-gray-800 sticky top-24">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-[#1A1A1A] dark:text-white">Jobs Near You</h3>
                  {userLocation && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full font-medium">
                      📍 Location Active
                    </span>
                  )}
                </div>

                {/* Live Map */}
                <style>
                  {`
                    /* Dark mode map tiles inversion */
                    .dark .dark-map-tiles {
                      filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7);
                    }
                  `}
                </style>
                <div className="rounded-xl overflow-hidden h-72 z-0 bg-gray-100 dark:bg-gray-800 relative map-container">
                  <MapContainer
                    key={userLocation ? `${userLocation[0]}-${userLocation[1]}` : 'default'}
                    center={userLocation || [9.5916, 76.5222]}
                    zoom={12}
                    style={{ height: '100%', width: '100%' }}
                    attributionControl={false}
                  >
                    <TileLayer
                      attribution=''
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      className="dark-map-tiles"
                    />

                    {/* User location marker + radius circle */}
                    {userLocation && (
                      <>
                        <Marker position={userLocation} icon={userIcon}>
                          <Popup><strong>📍 You are here</strong></Popup>
                        </Marker>
                        <Circle
                          center={userLocation}
                          radius={parseInt(radius) * 1000}
                          pathOptions={{ color: '#F5C518', fillColor: '#F5C518', fillOpacity: 0.08, weight: 2 }}
                        />
                      </>
                    )}

                    {/* Job markers */}
                    {mapJobs.map((job: any, i: number) => {
                      const jlat = job.latitude ? job.latitude + (i * 0.002) : (userLocation ? userLocation[0] + 0.01 * (i + 1) : 9.5916 + i * 0.01);
                      const jlng = job.longitude ? job.longitude + (i * 0.002) : (userLocation ? userLocation[1] + 0.01 * (i + 1) : 76.5222 + i * 0.01);
                      return (
                        <Marker key={job.id} position={[jlat, jlng]} icon={jobIcon}>
                          <Popup>
                            <div style={{ minWidth: 140 }}>
                              <p style={{ fontWeight: 700, margin: 0 }}>{job.title}</p>
                              <p style={{ fontSize: 12, color: '#666', margin: '2px 0' }}>{job.company_name}</p>
                              {job.distance_km !== undefined && (
                                <p style={{ fontSize: 12, color: '#2563eb', margin: 0 }}>{job.distance_km.toFixed(1)} km away</p>
                              )}
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
                  </MapContainer>
                </div>

                {/* Info footer */}
                {!userLocation && (
                  <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                    <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">💡 Update your profile address to see distance-sorted results!</p>
                  </div>
                )}
                {userLocation && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <p className="text-xs text-green-700 dark:text-green-400 font-semibold uppercase tracking-wide">Results Filtered by Radius ({radius} km)</p>
                    <p className="text-sm text-[#1A1A1A] dark:text-white font-medium">
                      {nearbyCount > 0 ? `${nearbyCount} job${nearbyCount !== 1 ? 's' : ''} found within radius` : 'No jobs found within this radius'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="lg:col-span-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl">
                {errorMsg}
              </div>
            )}

            {/* Loading State */}
            {isLoading ? (
              <div className="lg:col-span-2 space-y-4">
                {Array(4).fill(0).map((_, i) => (
                  <div key={i} className="bg-white dark:bg-[#2D2D2D] rounded-2xl p-6 border border-transparent dark:border-gray-800 animate-pulse">
                    <div className="flex justify-between mb-4">
                      <div className="flex gap-3">
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                        <div className="space-y-2 py-1">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3 mb-6">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                      </div>
                      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl w-32"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredJobs.length > 0 ? (
              filteredJobs.slice(0, visibleJobCount).map((job) => (
                <div key={job.id} className="bg-white dark:bg-[#2D2D2D] rounded-2xl p-6 card-shadow border border-transparent dark:border-gray-800 hover:card-shadow-hover transition-all duration-300 hover:-translate-y-1 group relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {job.image_url ? (
                        <img src={job.image_url} alt={job.title} className="w-12 h-12 rounded-xl object-cover group-hover:scale-110 transition-transform" />
                      ) : (
                        <div className={`w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
                          💼
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-[#1A1A1A] dark:text-white">{job.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                          {job.company_name}
                          {employerRatings[job.employer_id] !== undefined && employerRatings[job.employer_id] > 0 && (
                            <span className="flex items-center text-xs bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 px-1.5 py-0.5 rounded-md ml-2">
                              <Star className="w-3 h-3 fill-current mr-0.5" />
                              {employerRatings[job.employer_id]}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    {job.urgent && (
                      <span className="badge-urgent flex items-center gap-1">
                        <Flame className="w-3 h-3" />
                        URGENT
                      </span>
                    )}
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm">
                      <Navigation className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                      <span className="font-medium text-[#1A1A1A] dark:text-white">
                        {job.location}
                        {job.distance_km !== undefined && (
                          <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">
                            ({job.distance_km.toFixed(1)} km)
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-green-600 dark:text-green-400 font-semibold text-lg">₹{job.wage}</span>
                      <span className="text-gray-400 dark:text-gray-500">/day</span>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                        {job.description || "No description provided for this job."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-4">
                    {appliedJobs.has(job.id) ? (
                      <button disabled className="flex-1 bg-green-50 text-green-600 font-semibold py-3 rounded-xl border border-green-200">
                        Applied ✓
                      </button>
                    ) : (
                      <button onClick={() => setIsApplyingToJob(job)} className="flex-1 btn-dark py-3">
                        Apply Now
                      </button>
                    )}
                    <button
                      onClick={() => handleSaveJob(job.id)}
                      className={`w-12 h-12 border rounded-xl flex items-center justify-center transition-colors ${savedJobs.has(job.id) ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/50' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                      title={savedJobs.has(job.id) ? "Unsave Job" : "Save Job"}
                    >
                      <Bookmark className={`w-5 h-5 ${savedJobs.has(job.id) ? 'text-blue-500 fill-current' : 'text-gray-400 dark:text-gray-500 hover:text-[#F5C518]'}`} />
                    </button>
                    <button
                      onClick={() => setReportJobId(job.id)}
                      className="w-12 h-12 border border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                      title="Report Job"
                    >
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="lg:col-span-2 flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-[#1A1A1A] rounded-full flex items-center justify-center mx-auto mb-4 border border-transparent dark:border-gray-800">
                    <Search className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">
                    No jobs found {radius === '25' ? 'under 25 km' : `within ${radius} km`}
                  </p>
                  {radius !== '25' ? (
                    <button
                      onClick={() => setRadius(radius === '10' ? '25' : '10')}
                      className="text-[#F5C518] font-medium hover:underline mt-2 transition-colors"
                    >
                      Try {radius === '10' ? 'under 25' : '10'} km radius
                    </button>
                  ) : searchQuery ? (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-[#F5C518] font-medium hover:underline mt-2 transition-colors"
                    >
                      Clear search filter
                    </button>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          {/* Load More */}
          {filteredJobs.length > 0 && visibleJobCount < filteredJobs.length && (
            <div className="text-center mt-8">
              <button
                onClick={() => setVisibleJobCount(prev => prev + 6)}
                className="px-8 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-full text-gray-600 dark:text-gray-400 font-medium hover:border-[#F5C518] hover:text-[#F5C518] dark:hover:border-[#F5C518] dark:hover:text-[#F5C518] transition-all duration-200"
              >
                LOAD MORE JOBS
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="px-8 py-6 border-t border-gray-100 dark:border-gray-800 mt-auto">
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center">
            © 2026 AfterBell. Helping students earn and learn.
          </p>
        </footer>
      </main >

      {/* Application Modal */}
      {isApplyingToJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#2D2D2D] border border-transparent dark:border-gray-800 rounded-2xl w-full max-w-xl overflow-hidden card-shadow flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-[#1A1A1A]/50">
              <div>
                <h3 className="text-xl font-bold text-[#1A1A1A] dark:text-white">Apply for Role</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{isApplyingToJob.title} at {isApplyingToJob.company_name}</p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                disabled={isSubmitting}
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-[#1A1A1A] dark:text-gray-200 mb-2">
                  Cover Letter (Optional)
                </label>

              </div>

              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Write a brief message to the employer about why you're a great fit!"
                className="w-full h-40 input-field resize-none text-sm"
                disabled={isSubmitting}
              />
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#1A1A1A] flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-6 py-2.5 rounded-xl font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleApplyJob}
                disabled={isSubmitting}
                className="btn-dark px-8 py-2.5 flex items-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Job Modal */}
      {reportJobId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#2D2D2D] rounded-2xl p-6 w-full max-w-md shadow-2xl border border-transparent dark:border-gray-700">
            <h3 className="text-lg font-bold text-[#1A1A1A] dark:text-white mb-2">Report Job</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Please describe why you're reporting this job listing.</p>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="e.g., Fake listing, Scam, Inappropriate content..."
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-700 rounded-xl text-[#1A1A1A] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
            />
            {/* Severity Selector */}
            <div className="mt-4">
              <label className="block text-sm font-semibold text-[#1A1A1A] dark:text-gray-200 mb-2">Severity Level</label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setReportSeverity(level)}
                    className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${
                      reportSeverity === level
                        ? level === 'low'
                          ? 'bg-green-100 dark:bg-green-900/40 border-green-400 text-green-700 dark:text-green-400'
                          : level === 'medium'
                            ? 'bg-yellow-100 dark:bg-yellow-900/40 border-yellow-400 text-yellow-700 dark:text-yellow-400'
                            : 'bg-red-100 dark:bg-red-900/40 border-red-400 text-red-700 dark:text-red-400'
                        : 'bg-gray-50 dark:bg-[#1A1A1A] border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setReportJobId(null); setReportReason(''); setReportSeverity('medium'); }}
                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReportJob}
                disabled={!reportReason.trim()}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div >
  );
}
