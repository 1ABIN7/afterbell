import { useState } from 'react';
import { Lock, Mail, ArrowRight, Shield } from 'lucide-react';
import type { PageView } from '../../App';

interface AdminLoginProps {
    onNavigate: (view: PageView) => void;
    onLogin: () => void;
}

export function AdminLogin({ onNavigate, onLogin }: AdminLoginProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
    const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate login
        if (email === 'admin@afterbell.com' && password === 'admin123') {
            onLogin(); // Triggers the global login state
            onNavigate('admin-dashboard');
        } else {
            showToast('Invalid credentials. Use admin@afterbell.com / admin123', 'error');
        }
    };

    return (
        <div className="min-h-screen bg-[#FFFBF0] flex items-center justify-center p-4">
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-6 right-6 z-[999] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg text-white font-medium text-sm transition-all duration-300 ${toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                    }`}>
                    <span>{toast.msg}</span>
                    <button onClick={() => setToast(null)} className="ml-1 opacity-70 hover:opacity-100">✕</button>
                </div>
            )}

            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#7B1113]/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#F5C518]/10 rounded-full blur-3xl" />
            </div>

            <div className="max-w-md w-full relative z-10">
                <div className="bg-white rounded-3xl p-8 card-shadow border border-gray-100">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-[#7B1113]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Shield className="w-8 h-8 text-[#7B1113]" />
                        </div>
                        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">Admin Portal Access</h1>
                        <p className="text-gray-500 text-sm">Sign in to manage the AfterBell platform.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                                Admin Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@afterbell.com"
                                    className="input-field pl-12"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="admin123"
                                    className="input-field pl-12"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-[#7B1113] hover:bg-[#5A0C0E] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                            Access System
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => onNavigate('landing')}
                            className="text-sm text-gray-400 hover:text-[#1A1A1A] transition-colors"
                        >
                            Return to Public Portal
                        </button>
                    </div>
                </div>

                {/* Footer info for demo */}
                <div className="mt-8 text-center text-xs text-gray-400">
                    <p>This is a restricted area. Unauthorized access is strictly prohibited.</p>
                </div>
            </div>
        </div>
    );
}
