import type { PageView } from '../App';
import { ArrowLeft, Shield, Lock, FileText, Eye, UserCheck, Bell } from 'lucide-react';

interface PrivacyPolicyProps {
  onNavigate: (view: PageView) => void;
}

export function PrivacyPolicy({ onNavigate }: PrivacyPolicyProps) {
  const sections = [
    {
      icon: Shield,
      title: 'Information We Collect',
      content: 'We collect information you provide directly to us, including your name, email address, phone number, educational details, and employment history. For employers, we also collect business information and verification documents.'
    },
    {
      icon: Lock,
      title: 'How We Protect Your Data',
      content: 'We implement industry-standard security measures including encryption, secure servers, and regular security audits. Your data is stored on secure servers located in India and is protected against unauthorized access.'
    },
    {
      icon: Eye,
      title: 'How We Use Your Information',
      content: 'We use your information to match students with suitable job opportunities, verify employer identities, process applications, and improve our services. We never sell your personal information to third parties.'
    },
    {
      icon: FileText,
      title: 'Data Sharing and Disclosure',
      content: 'We share your information only with potential employers when you apply for jobs, or when required by law. Employers can see your profile information, resume, and application details.'
    },
    {
      icon: UserCheck,
      title: 'Your Rights and Choices',
      content: 'You have the right to access, update, or delete your personal information at any time. You can also choose what information is visible to employers in your privacy settings.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#FFFBF0]">
      {/* Header */}
      <header className="bg-[#1A1A1A] border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <button
              onClick={() => onNavigate('landing')}
              className="flex items-center gap-2"
            >
              <div className="w-10 h-10 bg-[#F5C518] rounded-xl flex items-center justify-center">
                <Bell className="w-5 h-5 text-[#1A1A1A]" />
              </div>
              <span className="text-xl font-bold text-white">AfterBell</span>
            </button>

            {/* Back Button */}
            <button
              onClick={() => onNavigate('landing')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back to Home</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-[#1A1A1A] py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-[#F5C518]/20 px-4 py-2 rounded-full mb-6">
            <Lock className="w-4 h-4 text-[#F5C518]" />
            <span className="text-sm font-medium text-[#F5C518]">Last Updated: January 2026</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Privacy <span className="text-[#F5C518]">Policy</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Your privacy is important to us. This policy explains how we collect, use,
            and protect your personal information when you use AfterBell.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {sections.map((section, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 card-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#F5C518]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <section.icon className="w-6 h-6 text-[#F5C518]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#1A1A1A] mb-3">{section.title}</h2>
                    <p className="text-gray-600 leading-relaxed">{section.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Contact Section */}
          <div className="mt-12 bg-[#1A1A1A] rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Have Questions?</h2>
            <p className="text-gray-400 mb-6">
              If you have any questions about our privacy policy or how we handle your data,
              please don&apos;t hesitate to contact us.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onNavigate('login')}
                className="btn-primary"
              >
                Contact Support
              </button>
              <button
                onClick={() => onNavigate('landing')}
                className="px-6 py-3 border border-white/30 text-white rounded-xl hover:bg-white/10 transition-all"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1A1A1A] py-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-500 text-sm">
            © 2026 AfterBell Inc. All rights reserved. Made with <span className="text-red-500">♥</span> in India.
          </p>
        </div>
      </footer>
    </div>
  );
}
