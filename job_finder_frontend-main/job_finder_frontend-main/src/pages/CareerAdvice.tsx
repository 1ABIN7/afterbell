import type { PageView } from '../App';
import { ChevronLeft, MapPin, Search } from 'lucide-react';

interface CareerAdviceProps {
    onNavigate: (view: PageView) => void;
}

export function CareerAdvice({ onNavigate }: CareerAdviceProps) {
    return (
        <div className="min-h-screen bg-[#FFFBF0]">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 px-4 md:px-8 py-4 pt-16 lg:pt-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <button
                        onClick={() => onNavigate('landing')}
                        className="flex items-center gap-2 text-gray-600 hover:text-[#1A1A1A] transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        Back to Home
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="bg-[#1A1A1A] py-20 text-center px-4">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                    Career <span className="text-[#F5C518]">Advice</span>
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                    Expert tips and guidance to help you land the perfect part-time job and build your career in India.
                </p>
            </section>

            {/* Content Section */}
            <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-2 gap-8">

                    <div className="bg-white rounded-2xl p-8 card-shadow hover:-translate-y-1 transition-transform">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                            <Search className="w-6 h-6 text-blue-500" />
                        </div>
                        <h3 className="text-xl font-bold text-[#1A1A1A] mb-3">How to Stand Out</h3>
                        <p className="text-gray-600 mb-4">
                            Learn how to highlight your skills—even without prior experience. Focus on reliability, eagerness to learn, and clear communication.
                        </p>
                        <button className="text-blue-600 font-medium hover:underline">Read Article</button>
                    </div>

                    <div className="bg-white rounded-2xl p-8 card-shadow hover:-translate-y-1 transition-transform">
                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
                            <MapPin className="w-6 h-6 text-orange-500" />
                        </div>
                        <h3 className="text-xl font-bold text-[#1A1A1A] mb-3">Acing the Local Interview</h3>
                        <p className="text-gray-600 mb-4">
                            Local Indian business owners value punctuality and respect. Discover the top 5 questions they ask and how to answer them confidently.
                        </p>
                        <button className="text-orange-600 font-medium hover:underline">Read Article</button>
                    </div>

                </div>
            </section>
        </div>
    );
}
