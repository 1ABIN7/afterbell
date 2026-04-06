import { useState } from 'react';
import type { PageView, UserRole } from '../App';
import { Bell, User, Mail, Lock, Eye, EyeOff, GraduationCap, Building2, ArrowRight, CheckCircle } from 'lucide-react';

import { supabase } from '../lib/supabaseClient';
import { validateEmail } from '../lib/validation';

interface SignUpPageProps {
  onNavigate: (view: PageView) => void;
  onSignUp: (role: UserRole) => void;
  initialRole?: 'student' | 'employer';
}

export function SignUpPage({ onNavigate, initialRole = 'student' }: SignUpPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'student' | 'employer'>(initialRole);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [signedUp, setSignedUp] = useState(false);

  // Password Validation
  const validatePassword = (pass: string) => {
    const minLength = pass.length >= 8;
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSpecial = /[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/.test(pass);

    if (!minLength) return 'Password must be at least 8 characters long.';
    if (!hasUpper) return 'Password must contain at least one uppercase letter.';
    if (!hasLower) return 'Password must contain at least one lowercase letter.';
    if (!hasNumber) return 'Password must contain at least one number.';
    if (!hasSpecial) return 'Password must contain at least one special character.';
    return '';
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const safeEmail = email.trim().toLowerCase();

    // Validate password
    const pwdError = validatePassword(password);
    if (pwdError) {
      setErrorMsg(pwdError);
      return;
    }

    const emailValidation = validateEmail(safeEmail);
    if (!emailValidation.isValid) {
      setErrorMsg(emailValidation.error);
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: safeEmail,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            role: selectedRole,
            full_name: fullName,
          });

        if (profileError) throw profileError;

        // Show email verification screen — do NOT auto-login
        setSignedUp(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during signup');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBF0] flex items-center justify-center p-4">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-[#F5C518]/20 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-[#F5C518]/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-5xl relative z-10">
        {/* Header Logo */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#F5C518] rounded-xl flex items-center justify-center">
              <Bell className="w-5 h-5 text-[#1A1A1A]" />
            </div>
            <span className="text-xl font-bold text-[#1A1A1A]">AfterBell</span>
          </div>
          <p className="text-gray-600">
            Already have an account?{' '}
            <button
              onClick={() => onNavigate('login')}
              className="text-[#F5C518] font-semibold hover:underline"
            >
              Log in
            </button>
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="grid lg:grid-cols-2">
            {/* Left Side - Info */}
            <div className="bg-gradient-to-br from-[#F5C518]/20 to-[#F5C518]/5 p-10 lg:p-12 flex flex-col justify-between relative overflow-hidden">
              {/* Decorative dots */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute top-10 left-10 w-2 h-2 bg-[#F5C518] rounded-full"></div>
                <div className="absolute top-20 left-20 w-3 h-3 bg-[#F5C518] rounded-full"></div>
                <div className="absolute top-40 left-8 w-2 h-2 bg-[#F5C518] rounded-full"></div>
                <div className="absolute bottom-40 right-10 w-2 h-2 bg-[#F5C518] rounded-full"></div>
                <div className="absolute bottom-20 right-20 w-3 h-3 bg-[#F5C518] rounded-full"></div>
              </div>

              <div className="relative z-10">
                <h2 className="text-3xl lg:text-4xl font-bold text-[#1A1A1A] mb-6 leading-tight">
                  Start your career journey while you study.
                </h2>
                <p className="text-gray-600 text-lg">
                  Join thousands of students finding flexible work across India.
                </p>
              </div>

              {/* Features List */}
              <div className="relative z-10 mt-12 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#F5C518] rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-700 font-medium">Verified employers only</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#F5C518] rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-700 font-medium">Flexible work hours</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#F5C518] rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-700 font-medium">Daily payment options</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#F5C518] rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-700 font-medium">Location-based matching</span>
                </div>
              </div>
            </div>

            {/* Right Side - Form or Confirmation */}
            <div className="p-10 lg:p-12">
              {signedUp ? (
                /* Email Verification Confirmation */
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#1A1A1A] mb-3">Account Created!</h2>
                  <p className="text-gray-600 mb-2">
                    We've sent a verification link to
                  </p>
                  <p className="font-semibold text-[#1A1A1A] mb-6">{email}</p>
                  <p className="text-gray-500 text-sm mb-8 leading-relaxed max-w-xs">
                    Please check your inbox (and spam folder) and click the verification link before signing in.
                  </p>
                  <button
                    onClick={() => onNavigate('login')}
                    className="w-full btn-dark py-4 text-base font-semibold flex items-center justify-center gap-2"
                  >
                    Go to Sign In
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                /* Sign Up Form */
                <>
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">Create an account</h2>
                    <p className="text-gray-600">
                      Fill in your details to get started with AfterBell.
                    </p>
                  </div>

                  <form onSubmit={handleSignUp} className="space-y-6">
                    {/* Role Selection */}
                    <div>
                      <label className="block text-sm font-medium text-[#1A1A1A] mb-3">
                        I am a...
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setSelectedRole('student')}
                          className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all duration-200 ${selectedRole === 'student'
                            ? 'border-[#F5C518] bg-[#F5C518]/10'
                            : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                          <GraduationCap className={`w-8 h-8 ${selectedRole === 'student' ? 'text-[#F5C518]' : 'text-gray-400'}`} />
                          <span className={`font-semibold ${selectedRole === 'student' ? 'text-[#1A1A1A]' : 'text-gray-500'}`}>
                            Student
                          </span>
                          {selectedRole === 'student' && (
                            <div className="w-6 h-6 bg-[#F5C518] rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedRole('employer')}
                          className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all duration-200 ${selectedRole === 'employer'
                            ? 'border-[#F5C518] bg-[#F5C518]/10'
                            : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                          <Building2 className={`w-8 h-8 ${selectedRole === 'employer' ? 'text-[#F5C518]' : 'text-gray-400'}`} />
                          <span className={`font-semibold ${selectedRole === 'employer' ? 'text-[#1A1A1A]' : 'text-gray-500'}`}>
                            Employer
                          </span>
                          {selectedRole === 'employer' && (
                            <div className="w-6 h-6 bg-[#F5C518] rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Full Name */}
                    <div>
                      <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Rahul Sharma"
                          className="w-full px-4 py-3 border border-gray-200 bg-white text-[#1A1A1A] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent transition-all duration-200 pl-12"
                          required
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value.trim().toLowerCase())}
                          placeholder="you@example.com"
                          className="w-full px-4 py-3 border border-gray-200 bg-white text-[#1A1A1A] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent transition-all duration-200 pl-12"
                          required
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-4 py-3 border border-gray-200 bg-white text-[#1A1A1A] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent transition-all duration-200 pl-12 pr-12"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        Must be at least 8 characters, with uppercase, lowercase, number, and special character.
                      </p>
                    </div>

                    {/* Error Message */}
                    {errorMsg && (
                      <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                        {errorMsg}
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Creating Account...' : 'Create Account'}
                      {!isLoading && <ArrowRight className="w-5 h-5" />}
                    </button>
                  </form>

                  {/* Terms */}
                  <p className="text-center mt-8 text-sm text-gray-500">
                    By clicking "Create Account", you agree to our{' '}
                    <button
                      onClick={() => onNavigate('terms')}
                      className="text-[#F5C518] hover:underline"
                    >
                      Terms of Service
                    </button>
                    {' '}and{' '}
                    <button
                      onClick={() => onNavigate('privacy-policy')}
                      className="text-[#F5C518] hover:underline"
                    >
                      Privacy Policy
                    </button>.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <p className="text-center mt-8 text-sm text-gray-400">
          © 2026 AfterBell. All rights reserved.
        </p>
      </div>
    </div>
  );
}
