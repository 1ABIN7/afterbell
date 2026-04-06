import type { PageView } from '../App';
import { ChevronLeft, Send, MapPin, Mail, Phone } from 'lucide-react';
import { useState } from 'react';

interface ContactUsProps {
    onNavigate: (view: PageView) => void;
}

export function ContactUs({ onNavigate }: ContactUsProps) {
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitted(true);
        setTimeout(() => setIsSubmitted(false), 5000);
    };

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
                    Contact <span className="text-[#F5C518]">Us</span>
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                    Need help? Have questions about AfterBell? We're here to support employers and students 24/7.
                </p>
            </section>

            {/* Content Section */}
            <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-12">

                    {/* Contact Form */}
                    <div className="bg-white rounded-2xl p-8 card-shadow">
                        <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6">Send us a Message</h2>

                        {isSubmitted ? (
                            <div className="bg-green-50 text-green-800 p-6 rounded-xl border border-green-200">
                                <h3 className="font-bold mb-2">Message Sent!</h3>
                                <p>Thank you for reaching out. Our support team will respond to your email within 24 hours.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-[#1A1A1A] mb-2">First Name</label>
                                        <input type="text" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F5C518]" placeholder="John" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Last Name</label>
                                        <input type="text" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F5C518]" placeholder="Doe" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Email Address</label>
                                    <input type="email" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F5C518]" placeholder="john@example.com" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Inquiry Type</label>
                                    <select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F5C518]">
                                        <option>General Question</option>
                                        <option>Student Support / Issues</option>
                                        <option>Business Account Help</option>
                                        <option>Report Content/Abuse</option>
                                        <option>Feedback</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Message</label>
                                    <textarea required rows={5} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F5C518] resize-none" placeholder="How can we help you today?"></textarea>
                                </div>

                                <button type="submit" className="w-full btn-dark py-4 flex items-center justify-center gap-2">
                                    <Send className="w-5 h-5" />
                                    Send Message
                                </button>
                            </form>
                        )}
                    </div>

                    {/* Contact Info Widget */}
                    <div className="space-y-8">
                        <div className="bg-[#1A1A1A] rounded-2xl p-8 text-white">
                            <h3 className="text-xl font-bold mb-6">Contact Information</h3>
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                                        <MapPin className="w-5 h-5 text-[#F5C518]" />
                                    </div>
                                    <div>
                                        <p className="font-semibold mb-1">Office Location</p>
                                        <p className="text-gray-400">123 Tech Park, Cyber City<br />Gurugram, Haryana 122002<br />India</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                                        <Mail className="w-5 h-5 text-[#F5C518]" />
                                    </div>
                                    <div>
                                        <p className="font-semibold mb-1">Email Support</p>
                                        <p className="text-gray-400">supportafterbell@gmail.com<br />partnerships@afterbell.com</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                                        <Phone className="w-5 h-5 text-[#F5C518]" />
                                    </div>
                                    <div>
                                        <p className="font-semibold mb-1">Phone Inquiry</p>
                                        <p className="text-gray-400">+91 (800) 123-4567<br />Mon-Fri, 9am - 6pm IST</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#FFFBF0] rounded-2xl p-8 card-shadow border border-[#F5C518]/20">
                            <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Need immediate assistance?</h3>
                            <p className="text-gray-600 mb-6">If you are facing an emergency or safety critical issue at a workplace, please contact local authorities or use our 24/7 designated safety emergency hotline.</p>
                            <div className="inline-block bg-red-100 text-red-700 px-4 py-2 rounded-lg font-bold">Emergency Only: +91 (800) 999-0000</div>
                        </div>
                    </div>

                </div>
            </section>
        </div>
    );
}
