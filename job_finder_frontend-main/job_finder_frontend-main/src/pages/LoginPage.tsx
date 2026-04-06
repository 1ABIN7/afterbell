import { useState } from 'react';
import type { PageView, UserRole } from '../App';
import { Bell, Mail, Lock, Eye, EyeOff, MessageSquare } from 'lucide-react';
import { API_URL } from '../lib/api';
import { supabase } from '../lib/supabaseClient';
import { validateEmail } from '../lib/validation';

interface LoginPageProps {
    onNavigate: (view: PageView) => void;
    onLogin: (role: UserRole) => void;
}

export function LoginPage({ onNavigate, onLogin }: LoginPageProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [forgotMode, setForgotMode] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [resetSent, setResetSent] = useState(false);

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        const safeForgotEmail = forgotEmail.trim().toLowerCase();
        if (!safeForgotEmail) {
            setErrorMsg('Please enter your email address.');
            return;
        }
        setIsLoading(true);
        setErrorMsg('');
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(safeForgotEmail, {
                redirectTo: window.location.origin,
            });
            if (error) throw error;
            setResetSent(true);
        } catch (err: any) {
            setErrorMsg(err.message || 'Failed to send reset email. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const safeEmail = email.trim().toLowerCase();

        if (!safeEmail) {
            setErrorMsg('Please enter an email address.');
            return;
        }

        const emailValidation = validateEmail(safeEmail);
        if (!emailValidation.isValid) {
            setErrorMsg(emailValidation.error);
            return;
        }

        setIsLoading(true);
        setErrorMsg('');

        try {
            if (loginMethod === 'password') {
                const { data, error } = await supabase.auth.signInWithPassword({ email: safeEmail, password });
                if (error) throw error;
                await checkRoleAndLogin(data.user);
            } else if (loginMethod === 'otp' && !otpSent) {
                const checkRes = await fetch(`${API_URL}/api/auth/check-email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: safeEmail })
                });

                if (!checkRes.ok) {
                    throw new Error('Failed to verify account. Please try again later.');
                }

                const checkData = await checkRes.json();
                if (!checkData.exists) {
                    throw new Error('Account does not exist. Please create an account first.');
                }

                const { error } = await supabase.auth.signInWithOtp({
                    email: safeEmail,
                    options: { shouldCreateUser: false },
                });
                if (error) throw error;
                setOtpSent(true);
            } else if (loginMethod === 'otp' && otpSent) {
                if (!otpCode) throw new Error('Please enter the OTP code.');
                const { data, error } = await supabase.auth.verifyOtp({ email: safeEmail, token: otpCode, type: 'email' });
                if (error) throw error;
                await checkRoleAndLogin(data.user);
            }
        } catch (err: any) {
            setErrorMsg(err.message || 'Invalid login credentials');
        } finally {
            setIsLoading(false);
        }
    };

    const checkRoleAndLogin = async (user: any) => {
        if (!user) return;
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profileError) throw profileError;

        if (profileData?.role === 'banned') {
            await supabase.auth.signOut();
            throw new Error('Your account has been banned due to violations of our policies.');
        }

        if (profileData && profileData.role) {
            onLogin(profileData.role as UserRole);
        } else {
            onLogin('student');
        }
    };

    return (
        <div className="min-h-screen bg-[#FFFBF0] flex items-center justify-center p-4">
            {/* Background Decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-20 w-32 h-32 bg-[#F5C518]/20 rounded-full blur-2xl"></div>
                <div className="absolute bottom-20 right-20 w-48 h-48 bg-[#F5C518]/10 rounded-full blur-3xl"></div>
                <div className="absolute top-1/3 right-10 w-24 h-24 bg-[#F5C518]/15 rounded-full blur-xl"></div>
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <div className="w-12 h-12 bg-[#F5C518] rounded-xl flex items-center justify-center">
                        <Bell className="w-6 h-6 text-[#1A1A1A]" />
                    </div>
                    <span className="text-2xl font-bold text-[#1A1A1A]">AfterBell</span>
                </div>

                {forgotMode ? (
                    /* ── FORGOT PASSWORD PANEL ── */
                    <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10">
                        <button
                            onClick={() => { setForgotMode(false); setResetSent(false); setErrorMsg(''); }}
                            className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#1A1A1A] mb-6 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back to Sign In
                        </button>

                        {resetSent ? (
                            <div className="text-center py-4">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">Check your inbox!</h2>
                                <p className="text-gray-600 text-sm mb-1">We sent a password reset link to</p>
                                <p className="font-semibold text-[#1A1A1A] mb-6">{forgotEmail}</p>
                                <p className="text-gray-500 text-xs leading-relaxed mb-6">
                                    Click the link to set a new password. Check your spam folder if you don't see it.
                                </p>
                                <button
                                    onClick={() => { setForgotMode(false); setResetSent(false); }}
                                    className="w-full btn-dark py-3 font-semibold"
                                >
                                    Back to Sign In
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="mb-6">
                                    <h2 className="text-2xl font-bold text-[#1A1A1A] mb-1">Forgot password?</h2>
                                    <p className="text-gray-600 text-sm">Enter your email and we'll send you a reset link.</p>
                                </div>
                                <form onSubmit={handleForgotPassword} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="email"
                                                value={forgotEmail}
                                                onChange={(e) => setForgotEmail(e.target.value.trim().toLowerCase())}
                                                placeholder="you@university.edu"
                                                className="w-full px-4 py-3 border border-gray-200 bg-white text-[#1A1A1A] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent transition-all duration-200 pl-12"
                                                required
                                            />
                                        </div>
                                    </div>
                                    {errorMsg && (
                                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{errorMsg}</div>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full btn-dark py-4 text-base disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? 'Sending...' : 'Send Reset Link'}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                ) : (
                    /* ── NORMAL LOGIN PANEL ── */
                    <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-[#1A1A1A] mb-2">Welcome!</h1>
                            <p className="text-gray-600">Login to find part-time gigs near your college.</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-6">
                            {/* Email Field */}
                            {!otpSent ? (
                                <div>
                                    <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value.trim().toLowerCase())}
                                            placeholder="you@university.edu"
                                            className="w-full px-4 py-3 border border-gray-200 bg-white text-[#1A1A1A] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent transition-all duration-200 pl-12"
                                            required
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-green-50 rounded-xl p-4 flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-green-800">OTP Sent!</p>
                                        <p className="text-xs text-green-600 mt-1">We've sent a 6-digit code to {email}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setOtpSent(false)}
                                        className="text-xs font-semibold text-green-700 hover:text-green-800 underline"
                                    >
                                        Change Email
                                    </button>
                                </div>
                            )}

                            {/* Password Field */}
                            {loginMethod === 'password' && (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-medium text-[#1A1A1A]">Password</label>
                                        <button
                                            type="button"
                                            onClick={() => { setForgotEmail(email); setForgotMode(true); setResetSent(false); setErrorMsg(''); }}
                                            className="text-sm text-[#F5C518] hover:underline font-medium"
                                        >
                                            FORGOT?
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••••••"
                                            className="w-full px-4 py-3 border border-gray-200 bg-white text-[#1A1A1A] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent transition-all duration-200 pl-12 pr-12"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* OTP Code Field */}
                            {loginMethod === 'otp' && otpSent && (
                                <div>
                                    <label className="block text-sm font-medium text-[#1A1A1A] mb-2">8-Digit OTP</label>
                                    <div className="relative">
                                        <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            maxLength={8}
                                            value={otpCode}
                                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                            placeholder="12345678"
                                            className="w-full px-4 py-3 border border-gray-200 bg-white text-[#1A1A1A] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent transition-all duration-200 pl-12 text-center tracking-[0.5em] font-bold text-xl"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2 text-center">
                                        Make sure to check your spam folder!
                                    </p>
                                </div>
                            )}

                            {/* Error Message */}
                            {errorMsg && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
                                    {errorMsg}
                                </div>
                            )}

                            {/* Login Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full btn-dark py-4 text-lg disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading
                                    ? 'Please wait...'
                                    : loginMethod === 'password'
                                        ? 'Log In'
                                        : otpSent
                                            ? 'Verify & Log In'
                                            : 'Send OTP Code'}
                            </button>
                        </form>

                        {/* Alternative Login Methods */}
                        {!otpSent && (
                            <div className="space-y-4 pt-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setLoginMethod('password')}
                                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all duration-200 ${loginMethod === 'password'
                                            ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white'
                                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                            }`}
                                    >
                                        <Lock className="w-5 h-5" />
                                        Password
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setLoginMethod('otp')}
                                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all duration-200 ${loginMethod === 'otp'
                                            ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white'
                                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                            }`}
                                    >
                                        <MessageSquare className="w-5 h-5" />
                                        Email OTP
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Sign Up Link */}
                        <p className="text-center mt-8 text-gray-600">
                            New here?{' '}
                            <button
                                onClick={() => onNavigate('signup')}
                                className="text-[#F5C518] font-semibold hover:underline"
                            >
                                Create Account
                            </button>
                        </p>
                    </div>
                )}

                {/* Footer Links */}
                <div className="flex items-center justify-center gap-6 mt-8 text-sm text-gray-500">
                    <button onClick={() => onNavigate('privacy-policy')} className="hover:text-[#1A1A1A] transition-colors">Privacy</button>
                    <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                    <button onClick={() => onNavigate('terms')} className="hover:text-[#1A1A1A] transition-colors">Terms</button>
                    <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                    <button onClick={() => onNavigate('help')} className="hover:text-[#1A1A1A] transition-colors">Help</button>
                </div>

                <p className="text-center mt-4 text-sm text-gray-400">
                    © 2026 AfterBell India. All rights reserved.
                </p>
            </div>
        </div>
    );
}
