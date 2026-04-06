import type { PageView } from '../../App';
import { API_URL } from '../../lib/api';
import {
  User, Mail, Phone, MapPin, Building2, Lock, BellRing, Shield, FileCheck, Upload, ShieldAlert
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { EmployerSidebar } from '../../components/layout/EmployerSidebar';

interface EmployerSettingsProps {
  onNavigate: (view: PageView) => void;
  onLogout: () => void;
  initialTab?: 'profile' | 'notifications' | 'security' | 'verification';
}

export function EmployerSettings({ onNavigate, onLogout, initialTab = 'profile' }: EmployerSettingsProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security' | 'verification'>(initialTab);

  // Verification Form State
  const [bName, setBName] = useState('');
  const [regType, setRegType] = useState('GST Registered (GSTIN)');
  const [regNumber, setRegNumber] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');
  const [verifStatus, setVerifStatus] = useState('Pending');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');

  // Profile Form State
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  const [attemptsCount, setAttemptsCount] = useState(0);

  useEffect(() => {
    // Check if they are already verified
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      if (session) {
        setUserEmail(session.user.email || 'No email registered');
        setUserPhone(session.user.phone || 'No phone registered');

        supabase
          .from('profiles')
          .select('is_verified, full_name, address')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data?.is_verified) {
              setVerifStatus('Verified');
            }
            if (data?.full_name) {
              setBName(data.full_name);
              setProfileName(data.full_name);
            }
            if ((data as any)?.address) {
              setProfileAddress((data as any).address);
            }
          });

        // Fetch detailed verification status
        supabase
          .from('employer_verifications')
          .select('status, ai_analysis')
          .eq('employer_id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              if (data.status === 'rejected') setVerifStatus('Rejected');
              else if (data.status === 'pending') setVerifStatus('Pending');
              else if (data.status === 'approved') setVerifStatus('Verified');
              
              if (data.ai_analysis) {
                try {
                  const aiData = typeof data.ai_analysis === 'string' ? JSON.parse(data.ai_analysis) : data.ai_analysis;
                  setAttemptsCount(aiData.submission_attempts || 0);
                } catch(e) {}
              }
            }
          });
      }
    });
  }, []);

  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    setProfileMsg('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Update basic fields in profiles table
      const { error: profileError } = await supabase.from('profiles').update({
        full_name: profileName,
        address: profileAddress
      }).eq('id', session.user.id);

      if (profileError) throw profileError;

      // Update phone in user_metadata for verification extraction
      const { error: authError } = await supabase.auth.updateUser({
        data: { phone: profilePhone }
      });

      if (authError) throw authError;

      // Update UI state so form values feel consistent
      setUserPhone(profilePhone);
      setProfileMsg("Profile updated successfully!");
    } catch (err: any) {
      setProfileMsg(`Error: ${err.message}`);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleVerifySubmit = async () => {
    if (!regNumber || !bName) {
      setSubmitMsg("Error: Please provide Business Name and Registration Number.");
      return;
    }
    setIsSubmitting(true);
    setSubmitMsg('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Save userPhone dynamically straight to auth metadata if it changed
      if (userPhone && userPhone !== 'No phone registered') {
        await supabase.auth.updateUser({
          data: { phone: userPhone }
        });
      }

      let document_url = '';
      if (docFile) {
        document_url = await getBase64(docFile);
      }

      const response = await fetch(`${API_URL}/api/verifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          business_name: bName,
          registration_number: regNumber,
          document_url: document_url
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 403 && data.message?.includes('maximum')) {
          setAttemptsCount(4); // Force UI lock
        }
        throw new Error(data.message || data.error || 'Failed to submit verification');
      }

      if (data.attempts_remaining !== undefined) {
         setAttemptsCount(3 - data.attempts_remaining);
      }

      setSubmitMsg('Verification submitted successfully! We will review it shortly.');
      setRegNumber('');
      setRegType('GST Registered (GSTIN)');
      setDocFile(null);
      if (document.getElementById('upload-text-proof')) {
        document.getElementById('upload-text-proof')!.innerText = 'Click to upload document';
      }
    } catch (err: any) {
      setSubmitMsg(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBF0] dark:bg-[#121212] flex transition-colors duration-200">
      <EmployerSidebar activeView="employer-settings" onNavigate={onNavigate} onLogout={onLogout} />

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40 px-4 md:px-8 py-4 pt-16 lg:pt-4">
          <div className="flex items-center gap-4">

            <div>
              <h1 className="text-2xl font-bold text-[#1A1A1A] dark:text-white">Settings</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage your account preferences</p>
            </div>
          </div>
        </header>

        {/* Settings Content */}
        <div className="p-8 flex-1">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Sidebar Tabs */}
            <div className="md:col-span-1">
              <div className="bg-white dark:bg-[#2D2D2D] border border-transparent dark:border-gray-800 rounded-2xl card-shadow overflow-hidden">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full px-6 py-4 flex items-center gap-3 text-left transition-colors ${activeTab === 'profile' ? 'bg-[#F5C518]/10 text-[#1A1A1A] dark:text-white dark:bg-[#F5C518]/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                >
                  <User className="w-5 h-5" />
                  <span className="font-medium">Profile</span>
                </button>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`w-full px-6 py-4 flex items-center gap-3 text-left transition-colors ${activeTab === 'notifications' ? 'bg-[#F5C518]/10 text-[#1A1A1A] dark:text-white dark:bg-[#F5C518]/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                >
                  <BellRing className="w-5 h-5" />
                  <span className="font-medium">Notifications</span>
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full px-6 py-4 flex items-center gap-3 text-left transition-colors ${activeTab === 'security' ? 'bg-[#F5C518]/10 text-[#1A1A1A] dark:text-white dark:bg-[#F5C518]/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                >
                  <Shield className="w-5 h-5" />
                  <span className="font-medium">Security</span>
                </button>
                <button
                  onClick={() => setActiveTab('verification')}
                  className={`w-full px-6 py-4 flex items-center gap-3 text-left transition-colors ${activeTab === 'verification' ? 'bg-[#F5C518]/10 text-[#1A1A1A] dark:text-white dark:bg-[#F5C518]/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                >
                  <FileCheck className="w-5 h-5" />
                  <span className="font-medium">Verification (KYC)</span>
                </button>
              </div>
            </div>

            <div className="md:col-span-3">
              {activeTab === 'profile' && (
                <div className="bg-white dark:bg-[#2D2D2D] border border-transparent dark:border-gray-800 rounded-2xl p-8 card-shadow">
                  <h2 className="text-xl font-bold text-[#1A1A1A] dark:text-white mb-6">Business Profile</h2>

                  {profileMsg && (
                    <div className={`p-4 rounded-xl border mb-6 ${profileMsg.startsWith('Error') ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/50' : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/50'}`}>
                      {profileMsg}
                    </div>
                  )}

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Business Name</label>
                      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-[#1A1A1A] rounded-xl border border-transparent dark:border-gray-700">
                        <Building2 className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        <input
                          type="text"
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          className="bg-transparent flex-1 focus:outline-none dark:text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Email</label>
                      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-[#1A1A1A] rounded-xl border border-transparent dark:border-gray-700">
                        <Mail className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        <input
                          type="email"
                          value={profileEmail}
                          readOnly
                          className="bg-transparent flex-1 focus:outline-none text-gray-500 cursor-not-allowed"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Phone</label>
                      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-[#1A1A1A] rounded-xl border border-transparent dark:border-gray-700">
                        <Phone className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        <input
                          type="tel"
                          value={profilePhone}
                          onChange={(e) => setProfilePhone(e.target.value)}
                          placeholder="+91"
                          className="bg-transparent flex-1 focus:outline-none dark:text-white dark:placeholder-gray-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Address</label>
                      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-[#1A1A1A] rounded-xl border border-transparent dark:border-gray-700">
                        <MapPin className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        <input
                          type="text"
                          value={profileAddress}
                          onChange={(e) => setProfileAddress(e.target.value)}
                          placeholder="e.g. 123 Street, City"
                          className="bg-transparent flex-1 focus:outline-none dark:text-white dark:placeholder-gray-500"
                        />
                      </div>
                    </div>
                    <button onClick={handleSaveProfile} disabled={isSavingProfile} className="btn-primary w-full disabled:opacity-50">
                      {isSavingProfile ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="bg-white dark:bg-[#2D2D2D] border border-transparent dark:border-gray-800 rounded-2xl p-8 card-shadow">
                  <h2 className="text-xl font-bold text-[#1A1A1A] dark:text-white mb-6">Notification Preferences</h2>
                  <div className="space-y-4">
                    {[
                      { label: 'New Applications', desc: 'Get notified when someone applies to your job', checked: true },
                      { label: 'Messages', desc: 'Get notified when you receive a new message', checked: true },
                      { label: 'Shift Reminders', desc: 'Get reminded about upcoming shifts', checked: true },
                      { label: 'Marketing Emails', desc: 'Receive updates about new features and offers', checked: false },
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-700 rounded-xl">
                        <div>
                          <p className="font-medium text-[#1A1A1A] dark:text-white">{item.label}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
                        </div>
                        <button
                          className={`w-12 h-6 rounded-full transition-colors relative ${item.checked ? 'bg-[#F5C518]' : 'bg-gray-200 dark:bg-gray-600'
                            }`}
                        >
                          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${item.checked ? 'left-7' : 'left-1'
                            }`}></span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="bg-white dark:bg-[#2D2D2D] border border-transparent dark:border-gray-800 rounded-2xl p-8 card-shadow">
                  <h2 className="text-xl font-bold text-[#1A1A1A] dark:text-white mb-6">Security Settings</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Current Password</label>
                      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-[#1A1A1A] rounded-xl border border-transparent dark:border-gray-700">
                        <Lock className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        <input
                          type="password"
                          placeholder="Enter current password"
                          className="bg-transparent flex-1 focus:outline-none dark:text-white dark:placeholder-gray-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">New Password</label>
                      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-[#1A1A1A] rounded-xl border border-transparent dark:border-gray-700">
                        <Lock className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        <input
                          type="password"
                          placeholder="Enter new password"
                          className="bg-transparent flex-1 focus:outline-none dark:text-white dark:placeholder-gray-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Confirm New Password</label>
                      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-[#1A1A1A] rounded-xl border border-transparent dark:border-gray-700">
                        <Lock className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        <input
                          type="password"
                          placeholder="Confirm new password"
                          className="bg-transparent flex-1 focus:outline-none dark:text-white dark:placeholder-gray-500"
                        />
                      </div>
                    </div>
                    <button className="btn-primary w-full">Update Password</button>
                  </div>
                </div>
              )}

              {activeTab === 'verification' && (
                <div className="bg-white dark:bg-[#2D2D2D] border border-transparent dark:border-gray-800 rounded-2xl p-8 card-shadow">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/40 rounded-xl flex items-center justify-center">
                      <FileCheck className="w-6 h-6 text-orange-500 dark:text-orange-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[#1A1A1A] dark:text-white">KYC & Business Verification</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Status: <span className={`font-semibold ${verifStatus === 'Verified' ? 'text-green-500' : verifStatus === 'Rejected' ? 'text-red-500' : 'text-orange-500'}`}>{verifStatus}</span>
                      </p>
                    </div>
                  </div>

                  {submitMsg && (
                    <div className={`p-4 rounded-xl border mb-6 ${submitMsg.startsWith('Error') ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/50' : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/50'}`}>
                      {submitMsg}
                    </div>
                  )}

                  <div className="space-y-6">
                    <div className="p-4 bg-gray-50 dark:bg-[#1A1A1A] rounded-xl border border-gray-100 dark:border-gray-800 mb-6 flex justify-between items-start">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        To post jobs on AfterBell, you must verify your identity and business. Verification typically takes 24-48 hours.
                      </p>
                      {attemptsCount > 0 && attemptsCount < 3 && verifStatus !== 'Verified' && (
                        <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded-full whitespace-nowrap">
                          Attempt {attemptsCount} of 3
                        </span>
                      )}
                    </div>

                    {verifStatus === 'Rejected' ? (
                      <div className="p-6 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl text-center">
                        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2">Verification Rejected</h3>
                        <p className="text-sm text-red-600 dark:text-red-300">
                          Your verification request was reviewed and explicitly rejected by our compliance team. To protect the platform, further automated submissions are disabled for this account.
                        </p>
                        <p className="text-sm text-red-600 dark:text-red-300 font-medium mt-4">
                          Please contact supportafterbell@gmail.com to resolve this manually.
                        </p>
                      </div>
                    ) : attemptsCount >= 3 && verifStatus !== 'Verified' ? (
                      <div className="p-6 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl text-center">
                        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2">Maximum Attempts Reached</h3>
                        <p className="text-sm text-red-600 dark:text-red-300">
                          Your verification requests have been rejected by the AI system multiple times. To protect the platform, further automated submissions are disabled for this account.
                        </p>
                        <p className="text-sm text-red-600 dark:text-red-300 font-medium mt-4">
                          Please contact supportafterbell@gmail.com to resolve this manually.
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Contact Information Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-gray-100 dark:border-gray-800 pb-6 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-[#1A1A1A] dark:text-white mb-2">Contact Email</label>
                        <input
                          type="email"
                          value={userEmail}
                          readOnly
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 cursor-not-allowed focus:outline-none"
                        />
                        <p className="text-xs text-gray-400 mt-1">Sourced from your account</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#1A1A1A] dark:text-white mb-2">Contact Phone</label>
                        <input
                          type="tel"
                          value={userPhone}
                          onChange={(e) => setUserPhone(e.target.value)}
                          className="w-full px-4 py-3 bg-white dark:bg-[#2D2D2D] border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F5C518] dark:text-white"
                        />
                        <p className="text-xs text-gray-400 mt-1">Sourced from your account</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#1A1A1A] dark:text-white mb-2">Business Name</label>
                      <input
                        type="text"
                        value={bName}
                        onChange={(e) => setBName(e.target.value)}
                        placeholder="e.g. Bean & Brew"
                        className="w-full px-4 py-3 bg-white dark:bg-[#2D2D2D] border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F5C518] dark:text-white dark:placeholder-gray-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#1A1A1A] dark:text-white mb-2">Registration Type</label>
                      <select
                        value={regType}
                        onChange={(e) => setRegType(e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-[#2D2D2D] border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F5C518] dark:text-white"
                      >
                        <option>GST Registered (GSTIN)</option>
                        <option>MSME / Udyam</option>
                        <option>FSSAI License (Food & Beverage)</option>
                        <option>Sole Proprietorship (PAN/Aadhaar)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#1A1A1A] dark:text-white mb-2">Registration Number</label>
                      <input
                        type="text"
                        value={regNumber}
                        onChange={(e) => setRegNumber(e.target.value)}
                        placeholder="e.g. 29ABCDE1234F1Z5"
                        className="w-full px-4 py-3 bg-white dark:bg-[#2D2D2D] border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F5C518] dark:text-white dark:placeholder-gray-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#1A1A1A] dark:text-white mb-2">Upload Proof Document</label>
                      <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer bg-gray-50 dark:bg-[#1A1A1A] relative overflow-hidden">
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setDocFile(e.target.files[0]);
                              document.getElementById('upload-text-proof')!.innerText = e.target.files[0].name;
                            }
                          }}
                        />
                        <div className="w-12 h-12 bg-white dark:bg-[#2D2D2D] rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-gray-400 dark:text-gray-500 relative z-0">
                          <Upload className="w-5 h-5" />
                        </div>
                        <p id="upload-text-proof" className="font-medium text-[#1A1A1A] dark:text-white mb-1 relative z-0">Click to upload document</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 relative z-0">PDF, JPG or PNG (Max. 5MB)</p>
                      </div>
                    </div>

                    <div className="pt-4">
                      <button
                        onClick={handleVerifySubmit}
                        disabled={isSubmitting || verifStatus === 'Verified'}
                        className="btn-primary w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Submitting...' : verifStatus === 'Verified' ? 'Already Verified' : 'Submit for Verification'}
                      </button>
                    </div>
                  </>
                  )}
                  </div>
                </div>
              )}
            </div>
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
