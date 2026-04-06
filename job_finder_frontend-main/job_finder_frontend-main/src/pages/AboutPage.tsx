import type { PageView } from '../App';
import { Bell, MapPin, Shield, Clock, Briefcase, ChevronLeft } from 'lucide-react';

interface AboutPageProps {
  onNavigate: (view: PageView) => void;
}

export function AboutPage({ onNavigate }: AboutPageProps) {
  return (
    <div className="min-h-screen bg-[#FFFBF0]">
      {/* Navigation */}
      <nav className="bg-[#1A1A1A] border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button 
              onClick={() => onNavigate('landing')}
              className="flex items-center gap-2"
            >
              <div className="w-10 h-10 bg-[#F5C518] rounded-xl flex items-center justify-center">
                <Bell className="w-5 h-5 text-[#1A1A1A]" />
              </div>
              <span className="text-xl font-bold text-white">AfterBell</span>
            </button>

            <div className="flex items-center gap-8">
              <button 
                onClick={() => onNavigate('landing')}
                className="text-gray-400 hover:text-[#F5C518] font-medium transition-colors"
              >
                Home
              </button>
              <button 
                onClick={() => onNavigate('about')}
                className="text-white hover:text-[#F5C518] font-medium transition-colors"
              >
                About
              </button>
              <button 
                onClick={() => onNavigate('login')}
                className="text-gray-400 hover:text-[#F5C518] font-medium transition-colors"
              >
                Login
              </button>
              <button 
                onClick={() => onNavigate('signup')}
                className="btn-primary text-sm"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <button 
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2 text-gray-600 hover:text-[#1A1A1A] transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Home
        </button>
      </div>

      {/* Hero Section */}
      <section className="py-16 bg-[#1A1A1A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            About <span className="text-[#F5C518]">AfterBell</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Connecting students with local part-time opportunities across India. 
            We're building the workforce of tomorrow, today.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-[#1A1A1A] mb-6">
                Our <span className="text-[#F5C518]">Mission</span>
              </h2>
              <p className="text-gray-600 text-lg mb-6">
                AfterBell was founded with a simple mission: to help students find meaningful 
                part-time work that fits around their academic schedules. We believe that 
                students shouldn't have to choose between earning money and focusing on their studies.
              </p>
              <p className="text-gray-600 text-lg">
                Every job on our platform is verified for safety, and we work closely with 
                employers who understand the unique needs of student workers.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-[#FFFBF0] rounded-2xl p-6 text-center">
                <p className="text-4xl font-bold text-[#F5C518] mb-2">10K+</p>
                <p className="text-gray-600">Students Helped</p>
              </div>
              <div className="bg-[#FFFBF0] rounded-2xl p-6 text-center">
                <p className="text-4xl font-bold text-[#F5C518] mb-2">500+</p>
                <p className="text-gray-600">Verified Employers</p>
              </div>
              <div className="bg-[#FFFBF0] rounded-2xl p-6 text-center">
                <p className="text-4xl font-bold text-[#F5C518] mb-2">25+</p>
                <p className="text-gray-600">Cities Covered</p>
              </div>
              <div className="bg-[#FFFBF0] rounded-2xl p-6 text-center">
                <p className="text-4xl font-bold text-[#F5C518] mb-2">4.8</p>
                <p className="text-gray-600">Average Rating</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-[#FFFBF0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[#1A1A1A] mb-4">
              Why Choose <span className="text-[#F5C518]">AfterBell</span>?
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="bg-white rounded-2xl p-6 card-shadow text-center">
              <div className="w-14 h-14 bg-[#F5C518]/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-[#F5C518]" />
              </div>
              <h3 className="font-bold text-[#1A1A1A] mb-2">Verified Jobs</h3>
              <p className="text-gray-600 text-sm">Every listing is manually reviewed for your safety.</p>
            </div>

            <div className="bg-white rounded-2xl p-6 card-shadow text-center">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-7 h-7 text-blue-500" />
              </div>
              <h3 className="font-bold text-[#1A1A1A] mb-2">Local Jobs</h3>
              <p className="text-gray-600 text-sm">Find work within walking distance of your campus.</p>
            </div>

            <div className="bg-white rounded-2xl p-6 card-shadow text-center">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-7 h-7 text-green-500" />
              </div>
              <h3 className="font-bold text-[#1A1A1A] mb-2">Flexible Hours</h3>
              <p className="text-gray-600 text-sm">Work around your class schedule.</p>
            </div>

            <div className="bg-white rounded-2xl p-6 card-shadow text-center">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-7 h-7 text-purple-500" />
              </div>
              <h3 className="font-bold text-[#1A1A1A] mb-2">Daily Pay</h3>
              <p className="text-gray-600 text-sm">Get paid every day, not monthly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[#1A1A1A] mb-4">
              Meet Our <span className="text-[#F5C518]">Team</span>
            </h2>
            <p className="text-gray-600">The people behind AfterBell</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                AJ
              </div>
              <h3 className="font-bold text-[#1A1A1A]">Aby Johnson</h3>
            </div>

            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-teal-400 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                AJ
              </div>
              <h3 className="font-bold text-[#1A1A1A]">Abin Joseph</h3>
            </div>

            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-pink-400 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                AJ
              </div>
              <h3 className="font-bold text-[#1A1A1A]">Akash Jose</h3>
            </div>

            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-400 to-cyan-400 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                AM
              </div>
              <h3 className="font-bold text-[#1A1A1A]">Alby Manoj</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1A1A1A] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <button 
                onClick={() => onNavigate('landing')}
                className="flex items-center gap-2 mb-6"
              >
                <div className="w-10 h-10 bg-[#F5C518] rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5 text-[#1A1A1A]" />
                </div>
                <span className="text-xl font-bold text-white">AfterBell</span>
              </button>
              <p className="text-gray-400 text-sm leading-relaxed">
                Connecting students with local opportunities across India.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-6">Quick Links</h4>
              <ul className="space-y-3">
                <li><button onClick={() => onNavigate('landing')} className="text-gray-400 hover:text-[#F5C518] text-sm transition-colors">Home</button></li>
                <li><button onClick={() => onNavigate('about')} className="text-gray-400 hover:text-[#F5C518] text-sm transition-colors">About</button></li>
                <li><button onClick={() => onNavigate('login')} className="text-gray-400 hover:text-[#F5C518] text-sm transition-colors">Login</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-6">Support</h4>
              <ul className="space-y-3">
                <li><button className="text-gray-400 hover:text-[#F5C518] text-sm transition-colors">Help Center</button></li>
                <li><button className="text-gray-400 hover:text-[#F5C518] text-sm transition-colors">Contact Us</button></li>
                <li><button className="text-gray-400 hover:text-[#F5C518] text-sm transition-colors">Privacy Policy</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-6">Contact</h4>
              <p className="text-gray-400 text-sm">supportafterbell@gmail.com</p>
              <p className="text-gray-400 text-sm">+91 98765 43210</p>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 text-center">
            <p className="text-gray-500 text-sm">
              © 2026 AfterBell Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
