import type { PageView } from '../App';
import { ChevronLeft, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface SafetyTipsProps {
    onNavigate: (view: PageView) => void;
}

export function SafetyTips({ onNavigate }: SafetyTipsProps) {
    return (
        <div className="min-h-screen bg-[#FFFBF0]">
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 px-4 md:px-8 py-4 pt-16 lg:pt-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <button onClick={() => onNavigate('landing')} className="flex items-center gap-2 text-gray-600 hover:text-[#1A1A1A] transition-colors">
                        <ChevronLeft className="w-5 h-5" /> Back to Home
                    </button>
                </div>
            </header>
            <section className="bg-[#1A1A1A] py-20 text-center px-4">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                    Safety <span className="text-[#F5C518]">Tips</span>
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto">Your safety is our priority. Here's how to stay secure while looking for opportunities.</p>
            </section>
            <section className="py-20 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                <div className="bg-white rounded-2xl p-8 card-shadow flex gap-4">
                    <ShieldAlert className="w-8 h-8 text-red-500 shrink-0" />
                    <div>
                        <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Never Pay to Work</h3>
                        <p className="text-gray-600">Real employers pay YOU. Never pay upfront registration fees, uniform deposits, or training charges to secure a job.</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-8 card-shadow flex gap-4">
                    <CheckCircle2 className="w-8 h-8 text-green-500 shrink-0" />
                    <div>
                        <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Meet in Public First</h3>
                        <p className="text-gray-600">If an employer asks for an interview before hiring, arrange to meet at the actual workplace during operating hours or a public coffee shop.</p>
                    </div>
                </div>
            </section>
        </div>
    );
}
