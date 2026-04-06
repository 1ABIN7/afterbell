import type { PageView } from '../App';
import { ArrowLeft, FileText, Shield, Scale, ScrollText } from 'lucide-react';

interface TermsOfServiceProps {
    onNavigate: (view: PageView) => void;
}

export function TermsOfService({ onNavigate }: TermsOfServiceProps) {
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
                            <ScrollText className="w-4 h-4 text-[#1A1A1A]" />
                        </div>
                        <span className="font-bold text-[#1A1A1A]">Terms of Service</span>
                    </div>
                    <div className="w-10"></div> {/* Spacer for centering */}
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 md:px-8 py-12">
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8">
                    <div className="bg-[#1A1A1A] text-white p-8 md:p-12 text-center">
                        <h1 className="text-3xl md:text-5xl font-bold mb-4">Terms of Service</h1>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            Please read these terms carefully before using AfterBell.
                        </p>
                        <p className="text-sm text-gray-500 mt-4">Last Updated: October 24, 2026</p>
                    </div>

                    <div className="p-8 md:p-12 space-y-8">
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <FileText className="w-6 h-6 text-[#F5C518]" />
                                <h2 className="text-2xl font-bold text-[#1A1A1A]">1. Acceptance of Terms</h2>
                            </div>
                            <p className="text-gray-600 leading-relaxed">
                                By accessing and using AfterBell, you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.
                            </p>
                        </section>

                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <Shield className="w-6 h-6 text-[#F5C518]" />
                                <h2 className="text-2xl font-bold text-[#1A1A1A]">2. User Responsibilities</h2>
                            </div>
                            <p className="text-gray-600 leading-relaxed mb-4">
                                As a user of the platform, you agree to:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                                <li>Provide accurate and complete information during registration.</li>
                                <li>Maintain the security of your account credentials.</li>
                                <li>Use the platform in compliance with all applicable laws and regulations.</li>
                                <li>Respect the rights and privacy of other users.</li>
                            </ul>
                        </section>

                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <Scale className="w-6 h-6 text-[#F5C518]" />
                                <h2 className="text-2xl font-bold text-[#1A1A1A]">3. Employment Disclaimer</h2>
                            </div>
                            <p className="text-gray-600 leading-relaxed">
                                AfterBell acts as a facilitator connecting students with employers. We do not guarantee employment, nor are we responsible for the conduct of any employer or student. All employment relationships are directly between the student and the employer.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-[#1A1A1A] mb-3">4. Content Ownership</h2>
                            <p className="text-gray-600 leading-relaxed">
                                Users retain ownership of the content they post but grant AfterBell a license to use, store, and display that content for the purpose of operating the service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-[#1A1A1A] mb-3">5. Termination</h2>
                            <p className="text-gray-600 leading-relaxed">
                                We reserve the right to terminate or suspend access to our service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                            </p>
                        </section>
                    </div>
                </div>

                <p className="text-center text-gray-500 text-sm">
                    Questions? Contact us at <a href="mailto:supportafterbell@gmail.com" className="text-[#F5C518] hover:underline">supportafterbell@gmail.com</a>
                </p>
            </main>
        </div>
    );
}
