import type { PageView } from '../../App';
import {
  ChevronDown, ChevronRight, Mail, Phone, BookOpen, Shield, FileText
} from 'lucide-react';
import { useState } from 'react';
import { StudentSidebar } from '../../components/layout/StudentSidebar';

interface StudentHelpProps {
  onNavigate: (view: PageView) => void;
  onLogout: () => void;
}

export function StudentHelp({ onNavigate, onLogout }: StudentHelpProps) {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    {
      id: 1,
      question: 'How do I apply for a job?',
      answer: 'Browse jobs in the "Find Jobs" section, click on a job that interests you, and click the "Apply Now" button. Your profile will be sent to the employer for review.',
    },
    {
      id: 2,
      question: 'When will I get paid?',
      answer: 'Most employers on AfterBell offer daily payment. Payment terms are clearly mentioned in each job listing. You will receive payment directly from the employer after completing your shift.',
    },
    {
      id: 3,
      question: 'Is it safe to work through AfterBell?',
      answer: 'Yes! All employers on AfterBell are verified. We manually review each job posting and employer profile to ensure student safety.',
    },
    {
      id: 4,
      question: 'Can I cancel my application?',
      answer: 'Yes, you can withdraw your application from the "My Applications" page before it is accepted by the employer.',
    },
    {
      id: 5,
      question: 'What if an employer doesn\'t pay me?',
      answer: 'Report the issue immediately through the "Messages" section or contact our support team. We take payment disputes very seriously and will investigate promptly.',
    },
  ];

  const helpCategories = [
    { icon: BookOpen, title: 'Getting Started', description: 'Learn the basics of using AfterBell', color: 'bg-blue-100 text-blue-600' },
    { icon: Shield, title: 'Safety Guidelines', description: 'Tips for staying safe while working', color: 'bg-green-100 text-green-600' },
    { icon: FileText, title: 'Terms & Policies', description: 'Read our terms of service and policies', color: 'bg-purple-100 text-purple-600' },
  ];

  return (
    <div className="min-h-screen bg-[#FFFBF0] dark:bg-[#121212] flex transition-colors duration-200">
      <StudentSidebar activeView="student-help" onNavigate={onNavigate} onLogout={onLogout} />

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        {/* Header */}
        <header className="bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40 px-4 md:px-8 py-4 pt-16 lg:pt-4">
          <div className="flex items-center gap-4">

            <div>
              <h1 className="text-2xl font-bold text-[#1A1A1A] dark:text-white">Help Center</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Get support and find answers</p>
            </div>
          </div>
        </header>

        {/* Help Content */}
        <div className="p-4 md:p-8">
          {/* Contact Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            <div className="bg-white dark:bg-[#2D2D2D] rounded-2xl p-6 card-shadow border border-transparent dark:border-gray-800 text-center">
              <div className="w-14 h-14 bg-[#F5C518]/20 dark:bg-[#F5C518]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7 text-[#F5C518]" />
              </div>
              <h3 className="font-bold text-[#1A1A1A] dark:text-white mb-2">Email Support</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">We reply within 24 hours</p>
              <a href="mailto:supportafterbell@gmail.com" className="text-[#F5C518] font-medium hover:underline">
                supportafterbell@gmail.com
              </a>
            </div>

            <div className="bg-white dark:bg-[#2D2D2D] rounded-2xl p-6 card-shadow border border-transparent dark:border-gray-800 text-center">
              <div className="w-14 h-14 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Phone className="w-7 h-7 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-bold text-[#1A1A1A] dark:text-white mb-2">Phone Support</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">Mon-Fri, 9AM - 6PM</p>
              <a href="tel:+917907764791" className="text-[#F5C518] font-medium hover:underline">
                +91 79077 64791
              </a>
            </div>
          </div>

          {/* Help Categories */}
          <div className="mb-10">
            <h2 className="text-xl font-bold text-[#1A1A1A] dark:text-white mb-6">Browse by Topic</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {helpCategories.map((category, index) => (
                <button
                  key={index}
                  className="bg-white dark:bg-[#2D2D2D] rounded-2xl p-6 card-shadow border border-transparent dark:border-gray-800 hover:card-shadow-hover transition-all text-left"
                >
                  <div className={`w-12 h-12 ${category.color} rounded-xl flex items-center justify-center mb-4`}>
                    <category.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-[#1A1A1A] dark:text-white mb-2">{category.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{category.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* FAQs */}
          <div>
            <h2 className="text-xl font-bold text-[#1A1A1A] dark:text-white mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div
                  key={faq.id}
                  className="bg-white dark:bg-[#2D2D2D] rounded-2xl card-shadow border border-transparent dark:border-gray-800 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left"
                  >
                    <span className="font-semibold text-[#1A1A1A] dark:text-white">{faq.question}</span>
                    {expandedFaq === faq.id ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  {expandedFaq === faq.id && (
                    <div className="px-6 pb-4">
                      <p className="text-gray-600 dark:text-gray-400">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-8 py-6 border-t border-gray-100 dark:border-gray-800">
          <p className="text-sm text-gray-400 dark:text-gray-500">
            © 2026 AfterBell. Made with <span className="text-red-500">♥</span> for Students.
          </p>
        </footer>
      </main>
    </div>
  );
}
