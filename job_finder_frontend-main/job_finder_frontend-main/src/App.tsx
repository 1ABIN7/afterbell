import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { supabase } from './lib/supabaseClient';
import { keepBackendAlive } from './lib/api';
import { ThemeProvider } from './contexts/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';

const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const SignUpPage = lazy(() => import('./pages/SignupPage').then(m => ({ default: m.SignUpPage })));
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard').then(m => ({ default: m.StudentDashboard })));
const StudentNearbyJobs = lazy(() => import('./pages/student/StudentNearbyJobs').then(m => ({ default: m.StudentNearbyJobs })));
const StudentApplications = lazy(() => import('./pages/student/StudentApplications').then(m => ({ default: m.StudentApplications })));
const StudentSchedule = lazy(() => import('./pages/student/StudentSchedule').then(m => ({ default: m.StudentSchedule })));
const StudentSavedJobs = lazy(() => import('./pages/student/StudentSavedJobs').then(m => ({ default: m.StudentSavedJobs })));
const StudentMessages = lazy(() => import('./pages/student/StudentMessages').then(m => ({ default: m.StudentMessages })));
const StudentHelp = lazy(() => import('./pages/student/StudentHelp').then(m => ({ default: m.StudentHelp })));
const StudentProfile = lazy(() => import('./pages/student/StudentProfile').then(m => ({ default: m.StudentProfile })));
const EmployerDashboard = lazy(() => import('./pages/employer/EmployerDashboard').then(m => ({ default: m.EmployerDashboard })));
const EmployerPostJob = lazy(() => import('./pages/employer/EmployerPostJob').then(m => ({ default: m.EmployerPostJob })));
const EmployerApplicants = lazy(() => import('./pages/employer/EmployerApplicants').then(m => ({ default: m.EmployerApplicants })));
const EmployerShifts = lazy(() => import('./pages/employer/EmployerShifts').then(m => ({ default: m.EmployerShifts })));
const EmployerMessages = lazy(() => import('./pages/employer/EmployerMessages').then(m => ({ default: m.EmployerMessages })));
const EmployerSettings = lazy(() => import('./pages/employer/EmployerSettings').then(m => ({ default: m.EmployerSettings })));
const EmployerProfile = lazy(() => import('./pages/employer/EmployerProfile').then(m => ({ default: m.EmployerProfile })));
const EmployerMyJobs = lazy(() => import('./pages/employer/EmployerMyJobs').then(m => ({ default: m.EmployerMyJobs })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminVerification = lazy(() => import('./pages/admin/AdminVerification').then(m => ({ default: m.AdminVerification })));
const AdminReports = lazy(() => import('./pages/admin/AdminReports').then(m => ({ default: m.AdminReports })));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers').then(m => ({ default: m.AdminUsers })));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin').then(m => ({ default: m.AdminLogin })));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings').then(m => ({ default: m.AdminSettings })));
const AboutPage = lazy(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const TermsOfService = lazy(() => import('./pages/TermsOfService').then(m => ({ default: m.TermsOfService })));
const HelpPage = lazy(() => import('./pages/HelpPage').then(m => ({ default: m.HelpPage })));
const CareerAdvice = lazy(() => import('./pages/CareerAdvice').then(m => ({ default: m.CareerAdvice })));
const SafetyTips = lazy(() => import('./pages/SafetyTips').then(m => ({ default: m.SafetyTips })));
const SuccessStories = lazy(() => import('./pages/SuccessStories').then(m => ({ default: m.SuccessStories })));
const VerificationProcess = lazy(() => import('./pages/VerificationProcess').then(m => ({ default: m.VerificationProcess })));
const ContactUs = lazy(() => import('./pages/ContactUs').then(m => ({ default: m.ContactUs })));

export type UserRole = 'guest' | 'student' | 'employer' | 'admin';
export type PageView =
  | 'landing'
  | 'login'
  | 'signup'
  | 'employer-signup'
  | 'student-signup'
  | 'about'
  | 'privacy-policy'
  | 'career-advice'
  | 'safety-tips'
  | 'success-stories'
  | 'verification-process'
  | 'contact-us'
  | 'student-dashboard'
  | 'student-jobs'
  | 'student-applications'
  | 'student-schedule'
  | 'student-saved'
  | 'student-messages'
  | 'student-help'
  | 'student-profile'
  | 'student-settings'
  | 'employer-dashboard'
  | 'employer-postjob'
  | 'employer-applicants'
  | 'employer-shifts'
  | 'employer-messages'
  | 'employer-settings'
  | 'employer-verification'
  | 'employer-profile'
  | 'employer-myjobs'
  | 'admin-login'
  | 'admin-dashboard'
  | 'admin-verification'
  | 'admin-reports'
  | 'admin-users'
  | 'admin-employers'
  | 'admin-students'
  | 'admin-settings'
  | 'terms'
  | 'help';

function App() {
  /* eslint-disable react-hooks/exhaustive-deps */
  const [currentView, setCurrentView] = useState<PageView>('landing');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('guest');
  const [authLoading, setAuthLoading] = useState(true);
  const roleRef = useRef<UserRole>(userRole);
  const viewRef = useRef<PageView>(currentView);
  const [history, setHistory] = useState<PageView[]>(['landing']);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [chatTarget, setChatTarget] = useState<{ id: string; full_name: string } | null>(null);
  // Global toast for critical system messages (banned, profile not found)
  const [globalToast, setGlobalToast] = useState<{ msg: string; type: 'error' | 'info' } | null>(null);
  const showGlobalToast = useCallback((msg: string, type: 'error' | 'info' = 'error') => {
    setGlobalToast({ msg, type });
    setTimeout(() => setGlobalToast(null), 5000);
  }, []);

  useEffect(() => {
    roleRef.current = userRole;
    viewRef.current = currentView;
  }, [userRole, currentView]);

  // Prevent Render backend from sleeping
  useEffect(() => {
    keepBackendAlive();
  }, []);

  // Sync with browser history
  useEffect(() => {
    // Check for existing state on mount (fixes refresh issue)
    if (window.history.state && window.history.state.view) {
      setCurrentView(window.history.state.view as PageView);
      if (typeof window.history.state.index === 'number') {
        setCurrentIndex(window.history.state.index);
      }
    } else {
      // Set initial state only if none exists
      window.history.replaceState({ view: 'landing', index: 0 }, '');
    }

    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.view) {
        const view = event.state.view as PageView;
        const currentRole = roleRef.current;
        const unauthViews = ['landing', 'login', 'signup', 'employer-signup', 'student-signup'];

        // Prevent navigating back to unauthenticated views if the user is already logged in
        if (currentRole !== 'guest' && unauthViews.includes(view)) {
          let dashboard: PageView = 'student-dashboard';
          if (currentRole === 'employer') dashboard = 'employer-dashboard';
          else if (currentRole === 'admin') dashboard = 'admin-dashboard';

          window.history.pushState({ view: dashboard, index: event.state.index + 1 }, '');
          setCurrentView(dashboard);
          return;
        }

        // Strict Role Guards for back/forward navigation
        if (currentRole === 'student' && (view.includes('employer') || view.includes('admin'))) {
          showGlobalToast('Access denied. You cannot view employer or admin pages.', 'error');
          // Revert history state visually
          window.history.pushState({ view: 'student-dashboard', index: event.state.index }, '');
          setCurrentView('student-dashboard');
          return;
        }

        if (currentRole === 'employer' && (view.includes('student') || view.includes('admin'))) {
          showGlobalToast('Access denied. You cannot view student or admin pages.', 'error');
          window.history.pushState({ view: 'employer-dashboard', index: event.state.index }, '');
          setCurrentView('employer-dashboard');
          return;
        }

        if (currentRole === 'admin' && (view.includes('student') || view.includes('employer-')) && !view.startsWith('admin-')) {
          // Admins have wide access, but let's keep them out of student/employer specific workflows
          showGlobalToast('Admins should use the Admin Dashboard.', 'info');
          window.history.pushState({ view: 'admin-dashboard', index: event.state.index }, '');
          setCurrentView('admin-dashboard');
          return;
        }

        setCurrentView(view);
        if (typeof event.state.index === 'number') {
          setCurrentIndex(event.state.index);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);



  const navigateTo = (view: PageView) => {
    const currentRole = roleRef.current;

    // Strict Role Guards for direct navigation
    if (currentRole === 'student' && (view.includes('employer') || view.includes('admin'))) {
      showGlobalToast('Access denied. You cannot view employer or admin pages.', 'error');
      return;
    }

    if (currentRole === 'employer' && (view.includes('student') || view.includes('admin'))) {
      showGlobalToast('Access denied. You cannot view student or admin pages.', 'error');
      return;
    }

    if (currentRole === 'admin' && (view.includes('student') || view.includes('employer-')) && !view.startsWith('admin-')) {
      showGlobalToast('Admins should use the Admin Dashboard.', 'info');
      view = 'admin-dashboard';
    }

    // Update internal state
    const newIndex = currentIndex + 1;
    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(view);
    setHistory(newHistory);
    setCurrentIndex(newIndex);
    setCurrentView(view);

    // Update browser history
    window.history.pushState({ view, index: newIndex }, '');

    // Scroll to top on navigation
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    // Check active session with catch block to prevent infinite loading
    supabase.auth.getSession()
      .then(({ data: { session } }: any) => {
        if (session) {
          fetchUserProfile(session.user.id).finally(() => setAuthLoading(false));
        } else {
          setAuthLoading(false);
        }
      })
      .catch((err) => {
        console.error("Auth session error:", err);
        setAuthLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: any) => {
        if (session) {
          fetchUserProfile(session.user.id);
        } else {
          handleLogoutLocal();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('role').eq('id', userId).single();

      if (error) throw error;

      if (!data) {
        showGlobalToast('Profile not found. Please complete sign-up first.', 'error');
        await supabase.auth.signOut();
        handleLogoutLocal();
        return;
      }

      if (data && data.role === 'banned') {
        showGlobalToast('Your account has been banned due to policy violations.', 'error');
        await handleLogout();
        return;
      }
      
      if (data && data.role) {
        setUserRole(data.role as UserRole);
        // We don't auto-navigate here to avoid overriding user's deep links, unless they're currently on landing/login
        const current = viewRef.current;
        if (current === 'landing' || current === 'login' || current === 'signup' || current === 'employer-signup' || current === 'student-signup') {
          handleLoginNavigation(data.role as UserRole);
        }
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
      // Force exit loading state on failure
      setAuthLoading(false);
    }
  };

  const handleLoginNavigation = (role: UserRole) => {
    let startView: PageView = 'landing';
    if (role === 'student') {
      startView = 'student-dashboard';
    } else if (role === 'employer') {
      startView = 'employer-dashboard';
    } else if (role === 'admin') {
      startView = 'admin-dashboard';
    }

    // Completely replace the history stack when logging in to clear the back button trail
    setHistory([startView]);
    setCurrentIndex(0);
    setCurrentView(startView);
    window.history.replaceState({ view: startView, index: 0 }, '');
    window.scrollTo(0, 0);
  };

  const handleLogin = (role: UserRole) => {
    setUserRole(role);
    handleLoginNavigation(role);
  };

  const handleLogoutLocal = () => {
    setUserRole('guest');
    setHistory(['landing']);
    setCurrentIndex(0);
    setCurrentView('landing');
    window.history.pushState({ view: 'landing', index: 0 }, '');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    handleLogoutLocal();
  };

  const renderPage = () => {
    switch (currentView) {
      case 'landing':
        return <LandingPage onNavigate={navigateTo} />;
      case 'login':
        return <LoginPage onNavigate={navigateTo} onLogin={handleLogin} />;
      case 'signup':
        return <SignUpPage onNavigate={navigateTo} onSignUp={handleLogin} initialRole="student" />;
      case 'employer-signup':
        return <SignUpPage onNavigate={navigateTo} onSignUp={handleLogin} initialRole="employer" />;
      case 'student-signup':
        return <SignUpPage onNavigate={navigateTo} onSignUp={handleLogin} initialRole="student" />;
      case 'about':
        return <AboutPage onNavigate={navigateTo} />;
      case 'privacy-policy':
        return <PrivacyPolicy onNavigate={navigateTo} />;
      case 'terms':
        return <TermsOfService onNavigate={navigateTo} />;
      case 'help':
        return <HelpPage onNavigate={navigateTo} />;
      case 'career-advice':
        return <CareerAdvice onNavigate={navigateTo} />;
      case 'safety-tips':
        return <SafetyTips onNavigate={navigateTo} />;
      case 'success-stories':
        return <SuccessStories onNavigate={navigateTo} />;
      case 'verification-process':
        return <VerificationProcess onNavigate={navigateTo} />;
      case 'contact-us':
        return <ContactUs onNavigate={navigateTo} />;
      case 'student-dashboard':
        return <StudentDashboard onNavigate={navigateTo} onLogout={handleLogout} setGlobalSearchQuery={setGlobalSearchQuery} />;
      case 'student-jobs':
        return <StudentNearbyJobs onNavigate={navigateTo} onLogout={handleLogout} globalSearchQuery={globalSearchQuery} setGlobalSearchQuery={setGlobalSearchQuery} />;
      case 'student-applications':
        return <StudentApplications onNavigate={navigateTo} onLogout={handleLogout} />;
      case 'student-schedule':
        return <StudentSchedule onNavigate={navigateTo} onLogout={handleLogout} />;
      case 'student-saved':
        return <StudentSavedJobs onNavigate={navigateTo} onLogout={handleLogout} />;
      case 'student-messages':
        return <StudentMessages onNavigate={navigateTo} onLogout={handleLogout} />;
      case 'student-help':
        return <StudentHelp onNavigate={navigateTo} onLogout={handleLogout} />;
      case 'student-profile':
        return <StudentProfile onNavigate={navigateTo} onLogout={handleLogout} />;
      case 'employer-dashboard':
        return <EmployerDashboard onNavigate={navigateTo} onLogout={handleLogout} />;
      case 'employer-postjob':
        return <EmployerPostJob onNavigate={navigateTo} onLogout={handleLogout} />;
      case 'employer-applicants':
        return <EmployerApplicants onNavigate={navigateTo} onLogout={handleLogout} onMessageStudent={(student) => { setChatTarget(student); navigateTo('employer-messages'); }} />;
      case 'employer-shifts':
        return <EmployerShifts onNavigate={navigateTo} onLogout={handleLogout} />;
      case 'employer-messages':
        return <EmployerMessages onNavigate={navigateTo} onLogout={handleLogout} initialChat={chatTarget || undefined} />;
      case 'employer-settings':
        return <EmployerSettings onNavigate={navigateTo} onLogout={handleLogout} />;
      case 'employer-verification':
        return <EmployerSettings onNavigate={navigateTo} onLogout={handleLogout} initialTab="verification" />;
      case 'employer-profile':
        return <EmployerProfile onNavigate={navigateTo} onLogout={handleLogout} />;
      case 'employer-myjobs':
        return <EmployerMyJobs onNavigate={navigateTo} onLogout={handleLogout} />;
      case 'admin-login':
        return <AdminLogin onNavigate={navigateTo} onLogin={() => handleLogin('admin')} />;
      case 'admin-dashboard':
        return <AdminDashboard onNavigate={navigateTo} onLogout={handleLogout} />;
      case 'admin-verification':
        return <AdminVerification onNavigate={navigateTo} onLogout={handleLogout} />;
      case 'admin-reports':
        return <AdminReports onNavigate={navigateTo} onLogout={handleLogout} />;
      case 'admin-users':
        return <AdminUsers onNavigate={navigateTo} onLogout={handleLogout} />;
      case 'admin-employers':
        return <AdminUsers onNavigate={navigateTo} onLogout={handleLogout} initialTab="employers" />;
      case 'admin-students':
        return <AdminUsers onNavigate={navigateTo} onLogout={handleLogout} initialTab="students" />;
      case 'admin-settings':
        return <AdminSettings onNavigate={navigateTo} onLogout={handleLogout} />;
      default:
        return <LandingPage onNavigate={navigateTo} />;
    }
  };

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <div className="min-h-screen bg-[#FFFBF0] dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-white transition-colors duration-200">
          {/* Auth Loading Spinner — prevents white screen on first load */}
          {authLoading ? (
            <div className="min-h-screen flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 bg-[#F5C518] rounded-xl flex items-center justify-center animate-pulse">
                  <svg className="w-6 h-6 text-[#1A1A1A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500 font-medium">Loading AfterBell...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Global System Toast */}
              {globalToast && (
                <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[9999] px-6 py-3.5 rounded-xl shadow-2xl text-white font-semibold text-sm flex items-center gap-3 ${globalToast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                  }`}>
                  <span>{globalToast.msg}</span>
                  <button onClick={() => setGlobalToast(null)} className="opacity-70 hover:opacity-100 text-lg leading-none">×</button>
                </div>
              )}
              <Suspense fallback={
                <div className="flex-1 min-h-[50vh] flex items-center justify-center p-20">
                  <div className="w-10 h-10 bg-[#F5C518] rounded-xl flex items-center justify-center animate-pulse shadow-lg">
                    <svg className="w-5 h-5 text-[#1A1A1A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                </div>
              }>
                {renderPage()}
              </Suspense>
            </>
          )}
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
