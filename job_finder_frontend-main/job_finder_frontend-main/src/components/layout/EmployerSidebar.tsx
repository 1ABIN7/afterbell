import { useState, useEffect } from 'react';
import { Menu, X, Bell, LayoutDashboard, Briefcase, Users, Calendar, MessageSquare, Plus, LogOut } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import type { PageView } from '../../App';
import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

interface EmployerSidebarProps {
    activeView: PageView;
    onNavigate: (view: PageView) => void;
    onLogout?: () => void;
}

export function EmployerSidebar({ activeView, onNavigate, onLogout }: EmployerSidebarProps) {
    const [isOpen, setIsOpen] = useState(true);
    const [profileName, setProfileName] = useState('Employer');
    const [avatarUrl, setAvatarUrl] = useState('');
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', session.user.id).single();
                if (data && data.full_name) setProfileName(data.full_name);
                if (data && data.avatar_url) setAvatarUrl(data.avatar_url);
            }
        };
        fetchProfile();
    }, []);


    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setIsOpen(true);
            } else {
                setIsOpen(false);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const main = document.querySelector('main');
        if (main) {
            main.style.marginLeft = isOpen && window.innerWidth >= 1024 ? '16rem' : window.innerWidth >= 1024 ? '5rem' : '0';
            main.style.transition = 'margin-left 300ms ease-in-out';
        }
    }, [isOpen]);

    const handleNavigate = (view: PageView) => {
        onNavigate(view);
        if (window.innerWidth < 1024) {
            setIsOpen(false);
        }
    };

    const sidebarItems = [
        { icon: LayoutDashboard, label: 'Dashboard', view: 'employer-dashboard' as PageView },
        { icon: Plus, label: 'Post New Job', view: 'employer-postjob' as PageView },
        { icon: Briefcase, label: 'My Jobs', view: 'employer-myjobs' as PageView },
        { icon: Users, label: 'Candidates', view: 'employer-applicants' as PageView },
        { icon: Calendar, label: 'Schedule', view: 'employer-shifts' as PageView },
        { icon: MessageSquare, label: 'Messages', view: 'employer-messages' as PageView },
    ];


    return (
        <>
            {/* Hamburger Button (Fixed top-left) visible when sidebar is closed */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed top-5 left-5 z-50 p-2.5 bg-white border border-gray-200 rounded-xl shadow-sm text-gray-600 hover:bg-gray-50 flex items-center justify-center transition-all hover:scale-105"
                >
                    <Menu className="w-5 h-5" />
                </button>
            )}

            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={`w-64 bg-[#1A1A1A] inset-y-0 flex flex-col fixed left-0 z-50 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 flex items-center justify-between">
                    <button
                        onClick={() => handleNavigate('landing')}
                        className="flex items-center gap-3"
                    >
                        <div className="w-10 h-10 bg-[#F5C518] rounded-xl flex items-center justify-center">
                            <Bell className="w-5 h-5 text-[#1A1A1A]" />
                        </div>
                        <span className="text-xl font-bold text-white">AfterBell</span>
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-4">
                    <div className="space-y-2">
                        {sidebarItems.map((item) => (
                            <button
                                key={item.label}
                                onClick={() => handleNavigate(item.view)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeView === item.view
                                    ? 'bg-[#F5C518] text-[#1A1A1A]'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <item.icon className="w-5 h-5" />
                                <span className="font-medium flex-1 text-left">{item.label}</span>
                                {('badge' in item) && (item as any).badge > 0 && (
                                    <span className="bg-[#F5C518] text-[#1A1A1A] text-xs font-bold px-2 py-1 rounded-full">
                                        {(item as any).badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </nav>

                <div className="p-4 border-t border-white/10 space-y-2">
                    {/* Theme Toggle Button */}
                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all duration-200"
                    >
                        {theme === 'dark' ? (
                            <>
                                <Sun className="w-5 h-5 text-yellow-400" />
                                <span className="font-medium text-left flex-1 text-white">Light Mode</span>
                            </>
                        ) : (
                            <>
                                <Moon className="w-5 h-5 text-blue-400" />
                                <span className="font-medium text-left flex-1 text-white">Dark Mode</span>
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => handleNavigate('employer-profile')}
                        className={`flex items-center gap-3 p-3 rounded-xl w-full transition-all duration-200 ${activeView === 'employer-profile'
                            ? 'bg-[#F5C518] text-[#1A1A1A]'
                            : 'bg-white/5 hover:bg-white/10 text-white'
                            }`}
                    >
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full flex items-center justify-center text-white font-bold">
                                {profileName.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div className="flex-1 min-w-0 text-left">
                            <p className={`font-medium text-sm truncate ${activeView === 'employer-profile' ? 'text-[#1A1A1A]' : 'text-white'}`}>{profileName}</p>
                            <p className={`text-xs ${activeView === 'employer-profile' ? 'text-[#1A1A1A]/70' : 'text-gray-400'}`}>View Profile</p>
                        </div>
                    </button>
                </div>
            </aside>
        </>
    );
}
