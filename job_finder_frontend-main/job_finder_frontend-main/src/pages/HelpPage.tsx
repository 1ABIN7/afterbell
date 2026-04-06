import type { PageView } from '../App';
import {
    ArrowLeft, ChevronRight, Mail, MessageCircle, HelpCircle
} from 'lucide-react';

interface HelpPageProps {
    onNavigate: (view: PageView) => void;
}

export function HelpPage({ onNavigate }: HelpPageProps) {
    const faqs = [
        {
            question: "How do I verify my student status?",
            answer: "Upload your valid college ID card in the profile section. Verification usually takes 24-48 hours."
        },
        {
            question: "Is AfterBell free to use?",
            answer: "Yes! AfterBell is completely free for students. Employers pay a small fee for premium postings."
        },
        {
            question: "When do I get paid?",
            answer: "Payment terms are set by the employer. Many offer daily or weekly payouts directly to your bank account."
        },
        {
            question: "How can I delete my account?",
            answer: "You can request account deletion from the Settings menu or by contacting our support team."
        }
    ];

    return (
        <div className="min-h-screen bg-[#FFFBF0]">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 px-4 md:px-8 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <button
                        onClick={() => onNavigate('landing')}
                        className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#F5C518] rounded-lg flex items-center justify-center">
                            <HelpCircle className="w-4 h-4 text-[#1A1A1A]" />
                        </div>
                        <span className="font-bold text-[#1A1A1A]">Help Center</span>
                    </div>
                    <div className="w-10"></div> {/* Spacer */}
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 md:px-8 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-3xl md:text-5xl font-bold text-[#1A1A1A] mb-4">How can we help?</h1>
                    <p className="text-gray-600 text-lg">
                        Search our knowledge base or contact support.
                    </p>
                </div>

                {/* Contact Options */}
                <div className="grid md:grid-cols-2 gap-6 mb-12">
                    <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 hover:border-[#F5C518] transition-colors group cursor-pointer">
                        <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <MessageCircle className="w-7 h-7 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Chat with Support</h3>
                        <p className="text-gray-500 mb-4">Get instant answers from our automated assistant or chat with a human.</p>
                        <span className="text-blue-600 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                            Start Chat <ChevronRight className="w-4 h-4" />
                        </span>
                    </div>

                    <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 hover:border-[#F5C518] transition-colors group cursor-pointer">
                        <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Mail className="w-7 h-7 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Email Us</h3>
                        <p className="text-gray-500 mb-4">Send us your query and we'll get back to you within 24 hours.</p>
                        <span className="text-green-600 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                            supportafterbell@gmail.com <ChevronRight className="w-4 h-4" />
                        </span>
                    </div>
                </div>

                {/* FAQs */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                    <div className="p-8 border-b border-gray-100">
                        <h2 className="text-2xl font-bold text-[#1A1A1A]">Frequently Asked Questions</h2>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {faqs.map((faq, index) => (
                            <div key={index} className="p-8 hover:bg-gray-50 transition-colors">
                                <h3 className="font-bold text-[#1A1A1A] mb-2">{faq.question}</h3>
                                <p className="text-gray-600">{faq.answer}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
