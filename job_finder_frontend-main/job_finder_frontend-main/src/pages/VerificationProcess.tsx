import type { PageView } from '../App';
import { ChevronLeft, CheckCircle2 } from 'lucide-react';

interface VerificationProcessProps {
 onNavigate: (view: PageView) => void;
}

export function VerificationProcess({ onNavigate }: VerificationProcessProps) {
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
 How We <span className="text-[#F5C518]">Verify</span> Employers
 </h1>
 <p className="text-xl text-gray-400 max-w-2xl mx-auto">
 Our rigorous 3-step KYC process ensures every student finds a safe work environment.
 </p>
 </section>

 {/* Content Section */}
 <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="space-y-8">

 <div className="bg-white rounded-2xl p-8 card-shadow flex gap-6 items-start">
 <div className="w-12 h-12 bg-[#F5C518] rounded-xl flex items-center justify-center shrink-0">
 <span className="font-bold text-[#1A1A1A] text-lg">1</span>
 </div>
 <div>
 <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Business Documentation</h3>
 <p className="text-gray-600">
 To start, Indian employers must upload a valid government-issued business registration document. This can be a GSTIN certificate, an MSME / Udyam registration, an FSSAI License, or a local shop establishment act document.
 </p>
 </div>
 </div>

 <div className="bg-white rounded-2xl p-8 card-shadow flex gap-6 items-start">
 <div className="w-12 h-12 bg-[#F5C518] rounded-xl flex items-center justify-center shrink-0">
 <span className="font-bold text-[#1A1A1A] text-lg">2</span>
 </div>
 <div>
 <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Cross-Reference Verification</h3>
 <p className="text-gray-600">
 Our internal audit team manually cross-references the submitted documents with public tax and business registry databases. This process typically takes 24 to 48 hours to ensure zero spoofing.
 </p>
 </div>
 </div>

 <div className="bg-white rounded-2xl p-8 card-shadow flex gap-6 items-start">
 <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shrink-0">
 <CheckCircle2 className="w-6 h-6 text-white" />
 </div>
 <div>
 <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Approval & Live Listing</h3>
 <p className="text-gray-600">
 Once approved, the business profile is marked with a green Verified Badge. Only verified employers can interact with students on the AfterBell platform. Re-verification occurs annually.
 </p>
 </div>
 </div>

 </div>
 </section>
 </div>
 );
}
