import type { PageView } from '../../App';
import { API_URL } from '../../lib/api';
import {
  Bell, MapPin, CheckCircle, XCircle, ChevronRight, Star, X, Plus, Trash2, Clock, Calendar, Users
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { EmployerSidebar } from '../../components/layout/EmployerSidebar';

interface EmployerShiftsProps {
  onNavigate: (view: PageView) => void;
  onLogout: () => void;
}

function getWeekStart(d: Date) {
  const date = new Date(d);
  const day = date.getDay(); // 0=Sun
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function toISODate(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const STATUS_COLORS: Record<string, string> = {
  Confirmed: 'bg-blue-100 text-blue-700',
  Completed: 'bg-green-100 text-green-700',
  Pending: 'bg-yellow-100 text-yellow-700',
  'No-show': 'bg-red-100 text-red-700',
  Cancelled: 'bg-gray-100 text-gray-700',
};

export function EmployerShifts({ onNavigate, onLogout }: EmployerShiftsProps) {
  const [shifts, setShifts] = useState<any[]>([]);
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [acceptedApplicants, setAcceptedApplicants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Week navigation
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()));
  const [selectedDate, setSelectedDate] = useState<string>(() => toISODate(new Date()));

  // Create shift modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    job_id: '', student_id: '', shift_date: toISODate(new Date()), start_time: '09:00', end_time: '17:00', notes: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [shiftToDelete, setShiftToDelete] = useState<string | null>(null);

  // Rating modal
  const [ratingModal, setRatingModal] = useState<{ isOpen: boolean; shift: any; rating: number; comment: string }>({
    isOpen: false, shift: null, rating: 0, comment: ''
  });

  const getSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  };

  const fetchShifts = useCallback(async () => {
    setIsLoading(true);
    try {
      const session = await getSession();
      if (!session) return;
      const res = await fetch(`${API_URL}/api/shifts/employer`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setShifts(json.data || []);
      }
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  }, []);

  const fetchJobsAndApplicants = useCallback(async () => {
    try {
      const session = await getSession();
      if (!session) return;
      // My jobs
      const jRes = await fetch(`${API_URL}/api/employer/jobs`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (jRes.ok) { const j = await jRes.json(); setMyJobs(j.data || []); }
      // Accepted applicants
      const aRes = await fetch(`${API_URL}/api/shifts/accepted-applicants`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (aRes.ok) { const a = await aRes.json(); setAcceptedApplicants(a.data || []); }
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    fetchShifts();
    fetchJobsAndApplicants();
  }, [fetchShifts, fetchJobsAndApplicants]);

  // Week days array
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i);
    return { date: d, iso: toISODate(d), dayName: d.toLocaleDateString('en-IN', { weekday: 'short' }), dayNum: d.getDate() };
  });

  // Shifts for selected day
  const dayShifts = shifts.filter(s => s.shift_date === selectedDate);
  const todayISO = toISODate(new Date());

  const updateShiftStatus = async (shiftId: string, status: string) => {
    try {
      const session = await getSession();
      if (!session) return;
      await fetch(`${API_URL}/api/shifts/${shiftId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ status })
      });
      fetchShifts();
    } catch (e) { console.error(e); }
  };

  const deleteShift = async (shiftId: string) => {
    try {
      const session = await getSession();
      if (!session) return;
      await fetch(`${API_URL}/api/shifts/${shiftId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      fetchShifts();
    } catch (e) { console.error(e); }
  };

  const handleCreateShift = async () => {
    if (!createForm.job_id || !createForm.shift_date || !createForm.start_time || !createForm.end_time) {
      setSaveMsg('❌ Job, date, start time, and end time are required.');
      return;
    }
    setIsSaving(true);
    setSaveMsg('');
    try {
      const session = await getSession();
      if (!session) return;
      const body: any = {
        job_id: createForm.job_id,
        shift_date: createForm.shift_date,
        start_time: createForm.start_time,
        end_time: createForm.end_time,
        notes: createForm.notes,
      };
      if (createForm.student_id) body.student_id = createForm.student_id;

      const res = await fetch(`${API_URL}/api/shifts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setSaveMsg('✅ Shift created!');
        fetchShifts();
        setTimeout(() => { setShowCreate(false); setSaveMsg(''); setCreateForm({ job_id: '', student_id: '', shift_date: toISODate(new Date()), start_time: '09:00', end_time: '17:00', notes: '' }); }, 800);
      } else {
        const err = await res.json();
        setSaveMsg(`❌ ${err.error || 'Failed'}`);
      }
    } catch (e) { setSaveMsg('❌ Network error'); }
    finally { setIsSaving(false); }
  };

  const submitRating = async () => {
    if (!ratingModal.shift || ratingModal.rating === 0) return;
    try {
      const session = await getSession();
      if (!session) return;
      const res = await fetch(`${API_URL}/api/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ target_id: ratingModal.shift.student_id, job_id: ratingModal.shift.job_id, rating: ratingModal.rating, comment: ratingModal.comment })
      });
      if (res.ok) {
        setRatingModal({ isOpen: false, shift: null, rating: 0, comment: '' });
        alert('Rating submitted successfully!');
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to submit rating. You may have already rated them for this job.');
      }
    } catch (e) { console.error(e); }
  };

  // Applicants filtered by selected job
  const filteredApplicants = createForm.job_id
    ? acceptedApplicants.filter((a: any) => a.job_id === createForm.job_id)
    : acceptedApplicants;

  return (
    <div className="min-h-screen bg-[#FFFBF0] dark:bg-[#121212] flex transition-colors duration-200">
      <EmployerSidebar activeView="employer-shifts" onNavigate={onNavigate} onLogout={onLogout} />

      {/* ── CREATE SHIFT MODAL ── */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-2xl w-full max-w-md p-8 relative border border-transparent dark:border-gray-800" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowCreate(false)} className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"><X className="w-5 h-5" /></button>
            <h2 className="text-2xl font-bold text-[#1A1A1A] dark:text-white mb-6">Schedule New Shift</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Job *</label>
                <select value={createForm.job_id} onChange={e => setCreateForm(f => ({ ...f, job_id: e.target.value, student_id: '' }))}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2D2D2D] text-[#1A1A1A] dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F5C518]"
                >
                  <option value="">-- Select Job --</option>
                  {myJobs.map((j: any) => <option key={j.id} value={j.id}>{j.title}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Assign To</label>
                <select value={createForm.student_id} onChange={e => setCreateForm(f => ({ ...f, student_id: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2D2D2D] text-[#1A1A1A] dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F5C518]"
                >
                  <option value="">-- Unassigned --</option>
                  {filteredApplicants.map((a: any) => (
                    <option key={a.student_id} value={a.student_id}>{a.profiles?.full_name}</option>
                  ))}
                </select>
                {createForm.job_id && filteredApplicants.length === 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">No accepted applicants for this job yet.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Date *</label>
                <input type="date" value={createForm.shift_date} min={todayISO}
                  onChange={e => setCreateForm(f => ({ ...f, shift_date: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2D2D2D] text-[#1A1A1A] dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F5C518]"
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Start Time *</label>
                  <input type="time" value={createForm.start_time}
                    onChange={e => setCreateForm(f => ({ ...f, start_time: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2D2D2D] text-[#1A1A1A] dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F5C518]"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">End Time *</label>
                  <input type="time" value={createForm.end_time}
                    onChange={e => setCreateForm(f => ({ ...f, end_time: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2D2D2D] text-[#1A1A1A] dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F5C518]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Notes (optional)</label>
                <textarea rows={2} value={createForm.notes}
                  onChange={e => setCreateForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Any special instructions..."
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2D2D2D] text-[#1A1A1A] dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F5C518] resize-none"
                />
              </div>
            </div>

            {saveMsg && <p className={`mt-3 text-sm text-center font-medium ${saveMsg.startsWith('✅') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{saveMsg}</p>}

            <div className="flex gap-3 mt-6">
              <button onClick={handleCreateShift} disabled={isSaving}
                className="flex-1 py-3 bg-[#F5C518] text-[#1A1A1A] rounded-xl font-bold hover:bg-yellow-400 disabled:opacity-60 transition-colors"
              >
                {isSaving ? 'Saving…' : 'Create Shift'}
              </button>
              <button onClick={() => setShowCreate(false)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── RATING MODAL ── */}
      {ratingModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1A1A1A] border border-transparent dark:border-gray-800 rounded-3xl p-8 max-w-md w-full relative">
            <button onClick={() => setRatingModal({ isOpen: false, shift: null, rating: 0, comment: '' })} className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"><X className="w-5 h-5 text-gray-500 dark:text-gray-400" /></button>
            <h2 className="text-2xl font-bold text-[#1A1A1A] dark:text-white mb-2">Rate Student</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">How was <strong className="text-[#1A1A1A] dark:text-white">{ratingModal.shift?.profiles?.full_name}</strong>'s performance?</p>
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} onClick={() => setRatingModal(m => ({ ...m, rating: star }))}
                  className={`w-12 h-12 flex items-center justify-center rounded-full transition-colors ${ratingModal.rating >= star ? 'bg-[#F5C518] text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                >
                  <Star className={`w-6 h-6 ${ratingModal.rating >= star ? 'fill-current' : ''}`} />
                </button>
              ))}
            </div>
            <textarea value={ratingModal.comment} onChange={e => setRatingModal(m => ({ ...m, comment: e.target.value }))}
              placeholder="Leave optional feedback..." rows={3}
              className="w-full p-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2D2D2D] text-[#1A1A1A] dark:text-white rounded-xl focus:outline-none focus:border-[#F5C518] focus:ring-1 focus:ring-[#F5C518] resize-none mb-6"
            />
            <button onClick={submitRating} disabled={ratingModal.rating === 0}
              className={`w-full py-4 rounded-full font-bold transition-colors ${ratingModal.rating > 0 ? 'bg-[#1A1A1A] text-white hover:bg-gray-900' : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'}`}
            >Submit Review</button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40 px-4 md:px-8 py-4 pt-16 lg:pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Shift Management</p>
              <h1 className="text-2xl font-bold text-[#1A1A1A] dark:text-white">Schedule</h1>
            </div>
            <div className="flex items-center gap-3">

              <button onClick={() => { setShowCreate(true); setCreateForm(f => ({ ...f, shift_date: selectedDate })); }}
                className="flex items-center gap-2 px-4 py-2 bg-[#F5C518] text-[#1A1A1A] font-bold rounded-xl hover:bg-yellow-400 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Shift
              </button>
            </div>
          </div>
        </header>

        <div className="p-8 flex-1">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Shifts', value: shifts.length, icon: Calendar, color: 'text-[#F5C518]', bg: 'bg-[#F5C518]/10' },
              { label: 'Confirmed', value: shifts.filter(s => ['Confirmed', 'Completed'].includes(s.status)).length, icon: CheckCircle, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/40' },
              { label: 'Pending', value: shifts.filter(s => s.status === 'Pending').length, icon: Clock, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/40' },
              { label: 'No-show', value: shifts.filter(s => s.status === 'No-show').length, icon: XCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/40' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-white dark:bg-[#2D2D2D] border border-transparent dark:border-gray-800 rounded-2xl p-5 card-shadow">
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <p className="text-3xl font-bold text-[#1A1A1A] dark:text-white">{value}</p>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Week Calendar */}
          <div className="bg-white dark:bg-[#2D2D2D] border border-transparent dark:border-gray-800 rounded-2xl p-5 card-shadow mb-8">
            <div className="flex items-center justify-between">
              <button onClick={() => setWeekStart(d => addDays(d, -7))} className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <ChevronRight className="w-5 h-5 rotate-180 text-gray-600 dark:text-gray-400" />
              </button>
              <div className="flex gap-2 flex-1 justify-start sm:justify-center overflow-x-auto hide-scrollbar pb-2 mx-2">
                {weekDays.map(({ date, iso, dayName, dayNum }) => {
                  const count = shifts.filter(s => s.shift_date === iso).length;
                  const isSelected = iso === selectedDate;
                  const isToday = iso === todayISO;
                  return (
                    <button key={iso} onClick={() => setSelectedDate(iso)}
                      className={`relative flex flex-col items-center justify-center w-14 h-16 rounded-xl transition-all duration-200
                        ${isSelected ? 'bg-[#F5C518] text-[#1A1A1A] shadow-md' : isToday ? 'ring-2 ring-[#F5C518] text-[#1A1A1A] dark:text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                    >
                      <span className="text-xs font-medium">{dayName}</span>
                      <span className="text-lg font-bold">{dayNum}</span>
                      {count > 0 && (
                        <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${isSelected ? 'bg-[#1A1A1A] text-white' : 'bg-[#F5C518] text-[#1A1A1A]'}`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <button onClick={() => setWeekStart(d => addDays(d, 7))} className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-3 font-medium">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Shifts List for selected day */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#1A1A1A] dark:text-white">
              {dayShifts.length > 0 ? `${dayShifts.length} Shift${dayShifts.length !== 1 ? 's' : ''}` : 'No shifts'} on this day
            </h2>
            <button onClick={() => { setShowCreate(true); setCreateForm(f => ({ ...f, shift_date: selectedDate })); }}
              className="flex items-center gap-1 text-sm text-[#F5C518] font-semibold hover:underline"
            >
              <Plus className="w-4 h-4" /> Add shift for this day
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-10 h-10 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : dayShifts.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-[#2D2D2D] border border-transparent dark:border-gray-800 rounded-2xl card-shadow">
              <Calendar className="w-16 h-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">No shifts scheduled for this day.</p>
              <button onClick={() => { setShowCreate(true); setCreateForm(f => ({ ...f, shift_date: selectedDate })); }}
                className="mt-4 px-6 py-2 bg-[#F5C518] text-[#1A1A1A] font-bold rounded-xl hover:bg-yellow-400 transition-colors"
              >
                Schedule a Shift
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {dayShifts.map(shift => (
                <div key={shift.id} className="bg-white dark:bg-[#2D2D2D] border border-transparent dark:border-gray-800 rounded-2xl p-6 card-shadow hover:card-shadow-hover transition-all duration-300">
                  <div className="flex items-start gap-6">

                    {/* Time block */}
                    <div className="w-28 flex-shrink-0 text-center bg-[#F5C518]/10 rounded-xl py-3 px-2">
                      <Clock className="w-4 h-4 text-[#F5C518] dark:text-[#F5C518] mx-auto mb-1" />
                      <p className="text-sm font-bold text-[#1A1A1A] dark:text-white">{shift.start_time?.slice(0, 5)}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">to</p>
                      <p className="text-sm font-bold text-[#1A1A1A] dark:text-white">{shift.end_time?.slice(0, 5)}</p>
                    </div>

                    <div className="w-px bg-gray-200 dark:bg-gray-700 self-stretch" />

                    {/* Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-[#1A1A1A] dark:text-white text-lg">{shift.jobs?.title || 'Shift'}</h3>
                          {shift.jobs?.location && (
                            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                              <MapPin className="w-3 h-3" />{shift.jobs.location}
                            </div>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[shift.status] || 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>
                          {shift.status}
                        </span>
                      </div>

                      {/* Assigned to */}
                      <div className="flex items-center gap-2 mt-3">
                        <Users className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        {shift.profiles ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-blue-400 dark:bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {shift.profiles.full_name?.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-[#1A1A1A] dark:text-white">{shift.profiles.full_name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-amber-500 font-medium">Unassigned</span>
                        )}
                      </div>

                      {shift.notes && <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 italic">📝 {shift.notes}</p>}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      {shift.status === 'Completed' && shift.student_id && (
                        <button title="Rate Student" onClick={() => setRatingModal({ isOpen: true, shift, rating: 0, comment: '' })}
                          className="w-9 h-9 bg-purple-100 dark:bg-purple-900/40 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/60 transition-colors"
                        ><Star className="w-4 h-4 fill-current" /></button>
                      )}
                      {shift.status === 'Pending' && (
                        <button title="Confirm" onClick={() => updateShiftStatus(shift.id, 'Confirmed')}
                          className="w-9 h-9 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors"
                        ><CheckCircle className="w-4 h-4" /></button>
                      )}
                      {['Pending', 'Confirmed'].includes(shift.status) && (
                        <button title="Mark Complete" onClick={() => updateShiftStatus(shift.id, 'Completed')}
                          className="w-9 h-9 bg-green-100 dark:bg-green-900/40 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/60 transition-colors"
                        ><CheckCircle className="w-4 h-4" /></button>
                      )}
                      {!['Completed', 'No-show', 'Cancelled'].includes(shift.status) && (
                        <button title="Mark No-show" onClick={() => updateShiftStatus(shift.id, 'No-show')}
                          className="w-9 h-9 bg-red-100 dark:bg-red-900/40 rounded-xl flex items-center justify-center text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
                        ><XCircle className="w-4 h-4" /></button>
                      )}
                      <button title="Delete Shift" onClick={() => setShiftToDelete(shift.id)}
                        className="w-9 h-9 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      ><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* All upcoming shifts summary */}
          {shifts.filter(s => s.shift_date > todayISO).length > 0 && (
            <div className="mt-8 bg-gradient-to-r from-[#F5C518]/20 to-[#F5C518]/5 dark:from-[#F5C518]/10 dark:to-transparent rounded-2xl p-5 flex items-center justify-between border border-transparent dark:border-yellow-600/30">
              <div>
                <p className="font-semibold text-[#1A1A1A] dark:text-white">You have {shifts.filter(s => s.shift_date > todayISO && s.status !== 'Cancelled').length} upcoming shift(s)</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Use the week calendar to view and manage each day's schedule.</p>
              </div>
              <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] font-bold rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
                <Plus className="w-4 h-4" /> Add Shift
              </button>
            </div>
          )}
        </div>

        <footer className="px-8 py-6 border-t border-gray-100 dark:border-gray-800 mt-auto">
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center">© 2026 AfterBell. Made with <span className="text-red-500">♥</span> in India.</p>
        </footer>
      </main>

      {/* Delete Confirmation Modal */}
      {shiftToDelete && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#2D2D2D] rounded-3xl max-w-md w-full p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 border border-transparent dark:border-gray-800">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-center text-[#1A1A1A] dark:text-white mb-2">Delete Shift?</h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
              Are you sure you want to delete this shift? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShiftToDelete(null)}
                className="flex-1 py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteShift(shiftToDelete);
                  setShiftToDelete(null);
                }}
                className="flex-1 py-3 px-4 font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-lg shadow-red-600/20"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
