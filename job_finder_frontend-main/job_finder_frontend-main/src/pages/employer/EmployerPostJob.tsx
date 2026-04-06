import type { PageView } from '../../App';
import { API_URL } from '../../lib/api';
import {
  ChevronLeft, Upload, Camera, Check, Flame, MapPin, Clock, IndianRupee, Eye, Briefcase, Shield, Users
} from 'lucide-react';
import { useState, useEffect } from 'react';
import ReactConfetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { supabase } from '../../lib/supabaseClient';
import { EmployerSidebar } from '../../components/layout/EmployerSidebar';

interface EmployerPostJobProps {
  onNavigate: (view: PageView) => void;
  onLogout: () => void;
}

export function EmployerPostJob({ onNavigate, onLogout }: EmployerPostJobProps) {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUrgent, setIsUrgent] = useState(false);
  const [uploadFileName, setUploadFileName] = useState<string | null>(null);
  const [jobTitle, setJobTitle] = useState('');
  const [description, setDescription] = useState('');
  const [wage, setWage] = useState('');
  const [slots, setSlots] = useState('1');
  // Structured shift timing
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [shopImage, setShopImage] = useState<string | null>(null);
  const [shopImageName, setShopImageName] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      if (session) {
        supabase
          .from('profiles')
          .select('is_verified')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data) setIsVerified(data.is_verified);
            setIsLoading(false);
          });
      } else {
        setIsLoading(false);
      }
    });
  }, []);

  const tips = [
    {
      title: 'Be Flexible',
      description: 'Students prioritize academics. Mention if shifts can be swapped.',
      icon: Check,
    },
    {
      title: 'Clear Wages',
      description: 'Listings with transparent daily rates get 40% more applications.',
      icon: Check,
    },
    {
      title: 'Location Matters',
      description: 'Ensure your address is accurate for students relying on public transit.',
      icon: Check,
    },
  ];

  const handleAutoFill = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFileName(file.name);
    setIsParsing(true);
    setErrorMsg('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Data = reader.result as string;

          const response = await fetch(`${API_URL}/api/jobs/parse-image`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ image: base64Data })
          });

          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Failed to parse image');
          }

          const json = await response.json();
          const parsedData = json.data;

          if (parsedData.title) setJobTitle(parsedData.title);
          if (parsedData.description) setDescription(parsedData.description);
          if (parsedData.wage) setWage(parsedData.wage);
          // AI-parsed timing stays as-is; user can adjust the structured pickers
        } catch (err: any) {
          setErrorMsg('AI Parsing Error: ' + err.message);
        } finally {
          setIsParsing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setErrorMsg('Auth Error: ' + err.message);
      setIsParsing(false);
    }
  };

  const handleShopImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setShopImageName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setShopImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(`${API_URL}/api/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          title: jobTitle,
          company_name: 'Local Business',
          wage: wage ? parseFloat(wage) : undefined,
          slots: slots ? parseInt(slots) : 1,
          location: location,
          description: description,
          urgent: isUrgent,
          requirements: [
            selectedDays.length > 0 ? selectedDays.join(', ') : '',
            startTime && endTime ? `${startTime}–${endTime}` : ''
          ].filter(Boolean).join(' | ') || undefined,
          image_url: shopImage,
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to post job');
      }

      setShowConfetti(true);
      setTimeout(() => {
        setShowConfetti(false);
        onNavigate('employer-dashboard');
      }, 3000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <EmployerSidebar activeView="employer-postjob" onNavigate={onNavigate} onLogout={onLogout} />

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40 px-4 md:px-8 py-4 pt-16 lg:pt-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#1A1A1A] dark:text-white">Post New Job</h1>
          </div>
        </header>

        {/* Content */}
        <div className="p-8 flex-1">
          {/* Title */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">

              <div>
                <h1 className="text-3xl font-bold text-[#1A1A1A] dark:text-white mb-1">Post a Student Opportunity</h1>
                <p className="text-gray-500 dark:text-gray-400">Create a new listing to find local student help.</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('employer-dashboard')}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-[#2D2D2D] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Cancel & Go Back
            </button>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Form Section */}
            <div className="lg:col-span-2">
              {isLoading ? (
                <div className="bg-white dark:bg-[#2D2D2D] border border-transparent dark:border-gray-800 rounded-2xl p-12 card-shadow text-center flex flex-col items-center justify-center h-full min-h-[400px]">
                  <div className="w-8 h-8 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-500 dark:text-gray-400 mt-4">Checking verification status...</p>
                </div>
              ) : !isVerified ? (
                <div className="bg-white dark:bg-[#2D2D2D] border border-transparent dark:border-gray-800 rounded-2xl p-12 card-shadow text-center flex flex-col items-center justify-center h-full min-h-[400px]">
                  <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                    <Shield className="w-8 h-8 text-red-500 dark:text-red-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#1A1A1A] dark:text-white mb-2">Verification Required</h2>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8">
                    To keep our student community safe, all employers must complete business verification before posting jobs.
                  </p>
                  <button
                    onClick={() => onNavigate('employer-verification')}
                    className="btn-primary py-3 px-8"
                  >
                    Verify Account Now
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Job Details Card */}
                  <div className="bg-white dark:bg-[#2D2D2D] border border-transparent dark:border-gray-800 rounded-2xl p-6 card-shadow">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-[#F5C518]/20 rounded-xl flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-[#F5C518]" />
                      </div>
                      <h2 className="text-xl font-bold text-[#1A1A1A] dark:text-white">Job Details</h2>
                    </div>

                    {errorMsg && (
                      <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm mb-6 border border-red-200 dark:border-red-900/30">
                        {errorMsg}
                      </div>
                    )}

                    <div className="space-y-6">
                      {/* Job Title */}
                      <div>
                        <label className="block text-sm font-medium text-[#1A1A1A] dark:text-white mb-2">
                          Job Title
                        </label>
                        <input
                          type="text"
                          value={jobTitle}
                          onChange={(e) => setJobTitle(e.target.value)}
                          placeholder="e.g. Weekend Cashier, Math Tutor"
                          className="input-field dark:bg-[#1A1A1A] dark:border-gray-700 dark:text-white"
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium text-[#1A1A1A] dark:text-white mb-2">
                          Description
                        </label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Describe the role, responsibilities, and what you're looking for..."
                          rows={4}
                          className="input-field resize-none dark:bg-[#1A1A1A] dark:border-gray-700 dark:text-white"
                        />
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                          Be clear about expectations. Students appreciate knowing if no prior experience is needed.
                        </p>
                      </div>

                      {/* Wage, Slots Row */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-[#1A1A1A] dark:text-white mb-2">
                            Wage (₹ per day)
                          </label>
                          <div className="relative">
                            <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                            <input
                              type="number"
                              value={wage}
                              onChange={(e) => setWage(e.target.value)}
                              placeholder="500"
                              className="input-field pl-12 dark:bg-[#1A1A1A] dark:border-gray-700 dark:text-white"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">/day</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#1A1A1A] dark:text-white mb-2">
                            Number of Slots
                          </label>
                          <div className="relative">
                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={slots}
                              onChange={(e) => setSlots(e.target.value)}
                              placeholder="1"
                              className="input-field pl-12 dark:bg-[#1A1A1A] dark:border-gray-700 dark:text-white"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">students</span>
                          </div>
                        </div>
                      </div>

                      {/* Shift Timing — structured picker */}
                      <div>
                        <label className="block text-sm font-medium text-[#1A1A1A] dark:text-white mb-3 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" /> Shift Timing
                        </label>

                        {/* Day selector */}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Select working days</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {DAYS.map(day => (
                            <button
                              key={day}
                              type="button"
                              onClick={() => setSelectedDays(prev =>
                                prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
                              )}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-150 ${
                                selectedDays.includes(day)
                                  ? 'bg-[#F5C518] border-[#F5C518] text-[#1A1A1A]'
                                  : 'bg-transparent border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-[#F5C518]'
                              }`}
                            >
                              {day}
                            </button>
                          ))}
                        </div>

                        {/* Time pickers */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Start Time</p>
                            <input
                              type="time"
                              value={startTime}
                              onChange={(e) => setStartTime(e.target.value)}
                              className="input-field dark:bg-[#1A1A1A] dark:border-gray-700 dark:text-white w-full"
                            />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">End Time</p>
                            <input
                              type="time"
                              value={endTime}
                              onChange={(e) => setEndTime(e.target.value)}
                              className="input-field dark:bg-[#1A1A1A] dark:border-gray-700 dark:text-white w-full"
                            />
                          </div>
                        </div>

                        {/* Live preview of timing string */}
                        {(selectedDays.length > 0 || startTime || endTime) && (
                          <p className="mt-3 text-xs text-[#F5C518] font-medium">
                            ⏰ Preview: {selectedDays.length > 0 ? selectedDays.join(', ') : '—'}{startTime && endTime ? ` | ${startTime}–${endTime}` : ''}
                          </p>
                        )}
                      </div>

                      {/* Location */}
                      <div>
                        <label className="block text-sm font-medium text-[#1A1A1A] dark:text-white mb-2">
                          Workplace Location
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                          <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Search address, city, or pincode..."
                            className="input-field pl-12 dark:bg-[#1A1A1A] dark:border-gray-700 dark:text-white"
                          />
                        </div>
                      </div>

                      {/* Shop Image Upload */}
                      <div>
                        <label className="block text-sm font-medium text-[#1A1A1A] dark:text-white mb-2">
                          Shop Image (Optional)
                        </label>
                        <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition-colors">
                          <div className="flex items-center gap-4">
                            {shopImage ? (
                              <img src={shopImage} alt="Shop Preview" className="w-16 h-16 rounded-xl object-cover" />
                            ) : (
                              <div className="w-16 h-16 bg-gray-100 dark:bg-[#1A1A1A] rounded-xl flex items-center justify-center">
                                <Camera className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-[#1A1A1A] dark:text-white text-sm">Upload a photo of your shop</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{shopImageName || 'Build trust with students by showing your workplace'}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="bg-white dark:bg-[#2D2D2D] border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-xl text-sm font-medium text-[#1A1A1A] dark:text-white hover:bg-gray-50 dark:hover:bg-[#1A1A1A] z-10 relative cursor-pointer"
                          >
                            Browse
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleShopImageUpload}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Visibility Options */}
                  <div className="bg-white dark:bg-[#2D2D2D] border border-transparent dark:border-gray-800 rounded-2xl p-6 card-shadow">
                    <h2 className="text-xl font-bold text-[#1A1A1A] dark:text-white mb-6">Visibility Options</h2>

                    <div className="flex items-center justify-between p-4 bg-[#FFFBF0] dark:bg-orange-900/10 rounded-xl border border-transparent dark:border-orange-900/20">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/40 rounded-xl flex items-center justify-center">
                          <Flame className="w-6 h-6 text-orange-500 dark:text-orange-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-[#1A1A1A] dark:text-white">Mark as Urgent</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Boost visibility for 24 hours. Great for immediate openings.</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsUrgent(!isUrgent)}
                        className={`w-14 h-8 rounded-full transition-colors duration-200 ease-in-out relative ${isUrgent ? 'bg-[#F5C518]' : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                      >
                        <span
                          className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${isUrgent ? 'translate-x-6' : 'translate-x-0'
                            }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full btn-dark py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Posting...' : 'Post Job Now'}
                    {!isSubmitting && <ChevronLeft className="w-5 h-5 rotate-180" />}
                  </button>
                </form>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Auto-fill Card */}
              <div className="bg-[#F5C518] rounded-2xl p-6 border border-transparent dark:border-yellow-600/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#1A1A1A]/10 rounded-xl flex items-center justify-center">
                    <Camera className="w-5 h-5 text-[#1A1A1A]" />
                  </div>
                  <h3 className="font-bold text-[#1A1A1A]">Auto-fill from Image</h3>
                </div>
                <p className="text-sm text-[#1A1A1A]/80 mb-4">
                  Have a &quot;Help Wanted&quot; poster? Upload a photo and our AI will fill out the form for you.
                </p>
                <div className="border-2 border-dashed border-[#1A1A1A]/20 dark:border-black/20 rounded-xl p-8 text-center hover:border-[#1A1A1A]/40 dark:hover:border-black/40 transition-colors cursor-pointer relative overflow-hidden bg-white/20 dark:bg-black/10">
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    onChange={handleAutoFill}
                  />
                  <div className="w-16 h-16 bg-[#1A1A1A] rounded-xl flex items-center justify-center mx-auto mb-4 relative z-0">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                  <p className="font-semibold text-[#1A1A1A] mb-1 relative z-0">
                    {isParsing ? 'Analyzing Poster...' : (uploadFileName ? uploadFileName : 'Upload Photo')}
                  </p>
                  <p className="text-xs text-[#1A1A1A]/60 relative z-0">JPG, PNG up to 5MB</p>
                </div>
              </div>

              {/* Tips Card */}
              <div className="bg-white dark:bg-[#2D2D2D] border border-transparent dark:border-gray-800 rounded-2xl p-6 card-shadow">
                <h3 className="font-bold text-[#1A1A1A] dark:text-white mb-4">Tips for Employers</h3>
                <div className="space-y-4">
                  {tips.map((tip, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="w-6 h-6 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#1A1A1A] dark:text-white text-sm">{tip.title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{tip.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview Card */}
              <div className="bg-white dark:bg-[#2D2D2D] border border-transparent dark:border-gray-800 rounded-2xl p-6 card-shadow">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-gray-400 uppercase tracking-wide">Preview Card</span>
                  <Eye className="w-4 h-4 text-gray-400" />
                </div>
                <div className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1A1A1A] rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-[#1A1A1A] dark:bg-white rounded-full flex items-center justify-center">
                      <span className="text-white dark:text-[#1A1A1A] font-bold text-sm">W</span>
                    </div>
                    <div>
                      <p className="font-semibold text-[#1A1A1A] dark:text-white text-sm">
                        {jobTitle || 'Weekend Cashier'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Local Grocery • 1.2 km away</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-[#F5C518] text-[#1A1A1A] px-2 py-1 rounded-full font-medium">
                      {wage ? `₹${wage}/day` : '₹500/day'}
                    </span>
                    <span className="text-xs bg-white dark:bg-[#2D2D2D] border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                      Part-time
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-8 py-6 border-t border-gray-100 dark:border-gray-800 mt-auto">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400 dark:text-gray-500">© 2026 AfterBell Inc. All rights reserved.</p>
            <div className="flex items-center gap-6 text-sm text-gray-400 dark:text-gray-500">
              <button className="hover:text-[#1A1A1A] dark:hover:text-white transition-colors">Privacy</button>
              <button className="hover:text-[#1A1A1A] dark:hover:text-white transition-colors">Terms</button>
              <button className="hover:text-[#1A1A1A] dark:hover:text-white transition-colors">Support</button>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
