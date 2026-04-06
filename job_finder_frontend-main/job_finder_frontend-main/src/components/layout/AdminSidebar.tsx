import { useState, useEffect } from 'react';
import { Menu, X, LayoutDashboard, Shield, Users, Briefcase, Settings, Bell, LogOut } from 'lucide-react';
import type { PageView } from '../../App';

interface AdminSidebarProps {
    activeView: PageView;
    onNavigate: (view: PageView) => void;
    onLogout?: () => void;
}

export function AdminSidebar({ activeView, onNavigate, onLogout }: AdminSidebarProps) {
    const [isOpen, setIsOpen] = useState(true);

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
        { icon: LayoutDashboard, label: 'Dashboard', view: 'admin-dashboard' as PageView },
        { icon: Shield, label: 'Verification', view: 'admin-verification' as PageView },
        { icon: Users, label: 'Employers', view: 'admin-employers' as PageView },
        { icon: Users, label: 'Students', view: 'admin-students' as PageView },
        { icon: Briefcase, label: 'Job Reports', view: 'admin-reports' as PageView },
        { icon: Settings, label: 'Settings', view: 'admin-settings' as PageView },
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

            <aside className={`w-64 bg-[#7B1113] inset-y-0 flex flex-col fixed left-0 z-50 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 flex items-center justify-between">
                    <button
                        onClick={() => handleNavigate('landing')}
                        className="flex items-center gap-3"
                    >
                        <div className="w-10 h-10 bg-[#F5C518] rounded-xl flex items-center justify-center">
                            <Bell className="w-5 h-5 text-[#1A1A1A]" />
                        </div>
                        <div>
                            <span className="text-xl font-bold text-white">AfterBell</span>
                            <span className="text-xs text-[#F5C518] ml-2">ADMIN</span>
                        </div>
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-4">
                    <div className="mb-6">
                        <p className="text-xs text-gray-500 uppercase tracking-wide px-4 mb-2">Platform</p>
                        <div className="space-y-2">
                            {sidebarItems.slice(0, 4).map((item) => (
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
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mb-6">
                        <p className="text-xs text-gray-500 uppercase tracking-wide px-4 mb-2">Management</p>
                        <div className="space-y-2">
                            {sidebarItems.slice(4).map((item) => (
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
                                </button>
                            ))}
                        </div>
                    </div>
                </nav>

                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all duration-200"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium flex-1 text-left">Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
