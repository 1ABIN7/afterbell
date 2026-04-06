import type { PageView } from '../App';
import { ChevronLeft, Star } from 'lucide-react';

interface SuccessStoriesProps {
    onNavigate: (view: PageView) => void;
}

export function SuccessStories({ onNavigate }: SuccessStoriesProps) {
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
                    Success <span className="text-[#F5C518]">Stories</span>
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                    See how local employers and students are thriving together through AfterBell.
                </p>
            </section>

            {/* Content Section */}
            <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-2 gap-8">

                    <div className="bg-white rounded-2xl p-8 card-shadow flex flex-col items-center text-center">
                        <div className="flex text-[#F5C518] mb-4">
                            <Star fill="currentColor" className="w-5 h-5" />
                            <Star fill="currentColor" className="w-5 h-5" />
                            <Star fill="currentColor" className="w-5 h-5" />
                            <Star fill="currentColor" className="w-5 h-5" />
                            <Star fill="currentColor" className="w-5 h-5" />
                        </div>
                        <p className="text-gray-600 italic mb-6">
                            "We used to struggle heavily with weekend shifts at the cafe. Now, we post a schedule and have three eager college students applying within an hour. They are quick learners and incredibly reliable."
                        </p>
                        <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full flex items-center justify-center text-white font-bold text-xl mb-2">
                            B
                        </div>
                        <h4 className="font-bold text-[#1A1A1A]">Bean & Brew Cafe</h4>
                        <p className="text-sm text-gray-500">Employer</p>
                    </div>

                    <div className="bg-white rounded-2xl p-8 card-shadow flex flex-col items-center text-center">
                        <div className="flex text-[#F5C518] mb-4">
                            <Star fill="currentColor" className="w-5 h-5" />
                            <Star fill="currentColor" className="w-5 h-5" />
                            <Star fill="currentColor" className="w-5 h-5" />
                            <Star fill="currentColor" className="w-5 h-5" />
                            <Star fill="currentColor" className="w-5 h-5" />
                        </div>
                        <p className="text-gray-600 italic mb-6">
                            "Finding a job that lets me work 4 hours a day after my lectures was impossible before. AfterBell matched me with a local stationary store just 1km from my hostel."
                        </p>
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-2">
                            R
                        </div>
                        <h4 className="font-bold text-[#1A1A1A]">Rahul M.</h4>
                        <p className="text-sm text-gray-500">B.Tech Student</p>
                    </div>

                </div>
            </section>
        </div>
    );
}
