import type { PageView } from '../../App';
import { API_URL } from '../../lib/api';
import {
  CheckCircle, XCircle, AlertCircle, Calendar, Star, X,
  ChevronLeft, ChevronRight, Clock, MapPin, Briefcase
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { StudentSidebar } from '../../components/layout/StudentSidebar';

interface StudentScheduleProps {
  onNavigate: (view: PageView) => void;
  onLogout: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  Confirmed: 'bg-blue-100 text-blue-700',
  Completed: 'bg-green-100 text-green-700',
  Pending: 'bg-yellow-100 text-yellow-700',
  Cancelled: 'bg-gray-100 text-gray-500',
  'No-show': 'bg-red-100 text-red-700',
};

const STATUS_DOT: Record<string, string> = {
  Confirmed: 'bg-blue-500',
  Completed: 'bg-green-500',
  Pending: 'bg-yellow-500',
  Cancelled: 'bg-gray-400',
  'No-show': 'bg-red-500',
};

function monthName(d: Date) {
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

function toISO(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function StudentSchedule({ onNavigate, onLogout }: StudentScheduleProps) {
  const [shifts, setShifts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [calendarBase, setCalendarBase] = useState(() => {
    const n = new Date(); n.setDate(1); return n;
  });
  const [selectedDate, setSelectedDate] = useState<string>(toISO(new Date()));
  const [shiftToDecline, setShiftToDecline] = useState<string | null>(null);

  const [ratingModal, setRatingModal] = useState<{ isOpen: boolean; shift: any; rating: number; comment: string }>({
    isOpen: false, shift: null, rating: 0, comment: ''
  });

  const submitRating = async () => {
    if (!ratingModal.shift || ratingModal.rating === 0) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${API_URL}/api/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ target_id: ratingModal.shift.employer_id, job_id: ratingModal.shift.job_id, rating: ratingModal.rating, comment: ratingModal.comment })
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

  const fetchShifts = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${API_URL}/api/shifts/student`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setShifts(json.data || []);
      }
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  }, []);

  const updateShiftStatus = async (shiftId: string, status: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${API_URL}/api/shifts/${shiftId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchShifts(); // Refresh the list after success
      }
    } catch (error) {
      console.error('Failed to update shift status:', error);
    }
  };

  useEffect(() => { fetchShifts(); }, [fetchShifts]);

  // --- Calendar helpers ---
  const year = calendarBase.getFullYear();
  const month = calendarBase.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayISO = toISO(new Date());

  // Build set of shift_dates for dot markers
  const shiftDateMap: Record<string, string[]> = {}; // date -> statuses[]
  shifts.forEach(s => {
    if (!s.shift_date) return;
    if (!shiftDateMap[s.shift_date]) shiftDateMap[s.shift_date] = [];
    shiftDateMap[s.shift_date].push(s.status);
  });

  function calendarDays() {
    const days: { iso: string; day: number; outOfMonth: boolean }[] = [];
    // Fill leading blanks from previous month
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const iso = toISO(new Date(year, month - 1, d));
      days.push({ iso, day: d, outOfMonth: true });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ iso: toISO(new Date(year, month, d)), day: d, outOfMonth: false });
    }
    // Pad to full rows
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        days.push({ iso: toISO(new Date(year, month + 1, d)), day: d, outOfMonth: true });
      }
    }
    return days;
  }

  const prevMonth = () => setCalendarBase(new Date(year, month - 1, 1));
  const nextMonth = () => setCalendarBase(new Date(year, month + 1, 1));

  // Filtered shifts for selected date or all upcoming
  const selectedShifts = selectedDate
    ? shifts.filter(s => s.shift_date === selectedDate)
    : shifts;

  const upcomingShifts = shifts
    .filter(s => s.shift_date && s.shift_date >= todayISO && s.status !== 'Cancelled')
    .sort((a, b) => a.shift_date.localeCompare(b.shift_date));

  const displayShifts = selectedDate ? selectedShifts : upcomingShifts;

  // Stats
  const totalUpcoming = upcomingShifts.length;
  const confirmed = shifts.filter(s => s.status === 'Confirmed').length;
  const completed = shifts.filter(s => s.status === 'Completed').length;

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="min-h-screen bg-[#FFFBF0] dark:bg-[#121212] flex transition-colors duration-200">
      <StudentSidebar activeView="student-schedule" onNavigate={onNavigate} onLogout={onLogout} />

      <main className="flex-1 lg:ml-64">
        {/* Header */}
        <header className="bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40 px-4 md:px-8 py-4 pt-16 lg:pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Your assigned work shifts</p>
              <h1 className="text-2xl font-bold text-[#1A1A1A] dark:text-white">My Schedule</h1>
            </div>
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-[#1A1A1A] dark:hover:text-white border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 transition-colors"
              >
                Clear filter
              </button>
            )}
          </div>
        </header>

        <div className="p-4 md:p-8">
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white dark:bg-[#2D2D2D] rounded-2xl p-5 card-shadow border border-transparent dark:border-gray-800 text-center">
              <p className="text-3xl font-bold text-[#F5C518]">{totalUpcoming}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Upcoming Shifts</p>
            </div>
            <div className="bg-white dark:bg-[#2D2D2D] rounded-2xl p-5 card-shadow border border-transparent dark:border-gray-800 text-center">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{confirmed}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Confirmed</p>
            </div>
            <div className="bg-white dark:bg-[#2D2D2D] rounded-2xl p-5 card-shadow border border-transparent dark:border-gray-800 text-center">
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{completed}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Completed</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Calendar */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-[#2D2D2D] rounded-2xl p-6 card-shadow border border-transparent dark:border-gray-800">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                  <h3 className="font-semibold text-[#1A1A1A] dark:text-white">{monthName(calendarBase)}</h3>
                  <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>

                {/* Weekday labels */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekDays.map(d => (
                    <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
                  ))}
                </div>

                {/* Days */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays().map((item, i) => {
                    const isToday = item.iso === todayISO;
                    const isSelected = item.iso === selectedDate;
                    const statuses = shiftDateMap[item.iso] || [];
                    const hasShift = statuses.length > 0;
                    const primaryStatus = statuses[0];

                    return (
                      <button
                        key={i}
                        onClick={() => !item.outOfMonth && setSelectedDate(item.iso === selectedDate ? '' : item.iso)}
                        className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 ${item.outOfMonth ? 'text-gray-300 dark:text-gray-600 cursor-default' :
                          isSelected ? 'bg-[#F5C518] text-[#1A1A1A] shadow-sm' :
                            isToday ? 'ring-2 ring-[#F5C518] text-[#1A1A1A] dark:text-white' :
                              'text-[#1A1A1A] dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                      >
                        {item.day}
                        {hasShift && !item.outOfMonth && (
                          <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? 'bg-[#1A1A1A]' : (STATUS_DOT[primaryStatus] || 'bg-[#F5C518]')}`} />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Legend</p>
                  <div className="space-y-2">
                    {[['Confirmed', 'bg-blue-500'], ['Pending', 'bg-yellow-500'], ['Completed', 'bg-green-500'], ['Cancelled', 'bg-gray-400']].map(([label, dot]) => (
                      <div key={label} className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
                        <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Shifts List */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#1A1A1A] dark:text-white">
                  {selectedDate
                    ? `Shifts on ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}`
                    : 'Upcoming Shifts'}
                </h2>
              </div>

              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="w-8 h-8 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">Loading your schedule...</p>
                  </div>
                ) : displayShifts.length === 0 ? (
                  <div className="bg-white dark:bg-[#2D2D2D] rounded-2xl p-10 card-shadow border border-transparent dark:border-gray-800 text-center">
                    <Calendar className="w-12 h-12 text-gray-200 dark:text-gray-600 mx-auto mb-3" />
                    <p className="font-semibold text-gray-500 dark:text-gray-400">
                      {selectedDate ? 'No shifts on this day' : 'No upcoming shifts scheduled'}
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Your employer assigns shifts after accepting your application.</p>
                  </div>
                ) : displayShifts.map((shift) => {
                  const shiftDateObj = shift.shift_date ? new Date(shift.shift_date + 'T00:00:00') : null;
                  const dayNum = shiftDateObj ? shiftDateObj.getDate() : '—';
                  const monthShort = shiftDateObj ? shiftDateObj.toLocaleDateString('en-IN', { month: 'short' }) : '—';
                  const weekdayShort = shiftDateObj ? shiftDateObj.toLocaleDateString('en-IN', { weekday: 'short' }) : '';
                  const isPast = shift.shift_date && shift.shift_date < todayISO;

                  return (
                    <div key={shift.id} className={`bg-white dark:bg-[#2D2D2D] rounded-2xl p-6 card-shadow border border-transparent dark:border-gray-800 transition-all duration-300 ${isPast ? 'opacity-60' : 'hover:shadow-md'}`}>
                      <div className="flex items-start gap-4">
                        {/* Date Box */}
                        <div className="w-16 h-16 bg-[#FFFBF0] dark:bg-[#1A1A1A] rounded-xl flex flex-col items-center justify-center flex-shrink-0 border border-[#F5C518]/30">
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{weekdayShort}</span>
                          <span className="text-2xl font-bold text-[#1A1A1A] dark:text-white leading-none">{dayNum}</span>
                          <span className="text-xs text-[#F5C518] font-semibold">{monthShort}</span>
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0">
                              <h3 className="font-semibold text-[#1A1A1A] dark:text-white truncate">{shift.jobs?.title || 'Work Shift'}</h3>
                              {shift.profiles?.full_name && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                  <Briefcase className="w-3 h-3" />
                                  {shift.profiles.company_name || shift.profiles.full_name}
                                </p>
                              )}
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${STATUS_COLORS[shift.status] || 'bg-gray-100 text-gray-700'}`}>
                              {shift.status}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4 text-gray-400" />
                              {shift.start_time
                                ? `${shift.start_time.slice(0, 5)} – ${shift.end_time?.slice(0, 5) || ''}`
                                : 'Time not set'}
                            </div>
                            {shift.jobs?.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                {shift.jobs.location}
                              </div>
                            )}
                            {shift.notes && (
                              <div className="text-xs text-gray-400 italic mt-1 w-full">📝 {shift.notes}</div>
                            )}
                          </div>
                        </div>

                        {/* Status icon */}
                        <div className="flex-shrink-0">
                          {shift.status === 'Confirmed' && (
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <CheckCircle className="w-5 h-5 text-blue-600" />
                            </div>
                          )}
                          {shift.status === 'Pending' && (
                            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                              <AlertCircle className="w-5 h-5 text-yellow-600" />
                            </div>
                          )}
                          {(shift.status === 'Cancelled' || shift.status === 'No-show') && (
                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                              <XCircle className="w-5 h-5 text-red-500" />
                            </div>
                          )}
                          {shift.status === 'Completed' && (
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons for Pending or Completed Shifts */}
                      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex gap-3">
                        {shift.status === 'Completed' && (
                          <button
                            onClick={() => setRatingModal({ isOpen: true, shift, rating: 0, comment: '' })}
                            className="flex-1 py-2 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 font-semibold rounded-xl hover:bg-purple-200 transition-colors flex items-center justify-center gap-2"
                          >
                            <Star className="w-4 h-4 fill-current" /> Rate Employer
                          </button>
                        )}
                        {shift.status === 'Pending' && !isPast && (
                          <>
                            <button
                              onClick={() => updateShiftStatus(shift.id, 'Confirmed')}
                              className="flex-1 py-2 bg-[#F5C518] text-[#1A1A1A] font-semibold rounded-xl hover:bg-yellow-400 transition-colors"
                            >
                              Confirm Shift
                            </button>
                            <button
                              onClick={() => setShiftToDecline(shift.id)}
                              className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                              Decline
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* CTA */}
              <div className="mt-8 bg-gradient-to-r from-[#F5C518]/20 to-[#F5C518]/5 dark:from-[#F5C518]/10 dark:to-[#F5C518]/5 rounded-2xl p-6 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-[#1A1A1A] dark:text-white mb-1">Looking for more shifts?</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Browse available jobs near your campus.</p>
                </div>
                <button onClick={() => onNavigate('student-jobs')} className="btn-primary">
                  Find Jobs
                </button>
              </div>
            </div>
          </div>
        </div>
        <footer className="px-8 py-6 border-t border-gray-100 dark:border-gray-800">
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center">© 2026 AfterBell. Made with <span className="text-red-500">♥</span> for Students.</p>
        </footer>
      </main>

      {/* Decline Confirmation Modal */}
      {shiftToDecline && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#2D2D2D] rounded-3xl max-w-md w-full p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-center text-[#1A1A1A] dark:text-white mb-2">Decline Shift?</h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
              Are you sure you want to decline this shift? Your employer will be notified.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShiftToDecline(null)}
                className="flex-1 py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateShiftStatus(shiftToDecline, 'Cancelled');
                  setShiftToDecline(null);
                }}
                className="flex-1 py-3 px-4 font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-lg shadow-red-600/20"
              >
                Yes, Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {ratingModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1A1A1A] border border-transparent dark:border-gray-800 rounded-3xl p-8 max-w-md w-full relative">
            <button onClick={() => setRatingModal({ isOpen: false, shift: null, rating: 0, comment: '' })} className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"><X className="w-5 h-5 text-gray-500 dark:text-gray-400" /></button>
            <h2 className="text-2xl font-bold text-[#1A1A1A] dark:text-white mb-2">Rate Employer</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">How was your shift with <strong className="text-[#1A1A1A] dark:text-white">{ratingModal.shift?.profiles?.full_name}</strong>?</p>
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
            >Submit Rating</button>
          </div>
        </div>
      )}
    </div>
  );
}
