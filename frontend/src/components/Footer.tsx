import React from 'react';
import { ShieldCheck, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-darkBlue-900 transition-colors mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4 col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
              <span className="font-sans font-bold text-lg text-slate-900 dark:text-white">SecureVote</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              Empowering citizens with a next-generation, secure, and transparent digital voting experience. Bridging security with convenience.
            </p>
            <div className="text-xs text-amber-500/80 max-w-sm border border-amber-500/20 bg-amber-500/5 p-3 rounded-xl leading-relaxed">
              <strong>Notice:</strong> SecureVote is an educational portfolio showcase demonstrating modern secure coding and cryptography. Not certified for state or federal public elections.
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-sans font-semibold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider">Resources</h4>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li>
                <Link to="/" className="hover:text-emerald-500 transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/verify-receipt" className="hover:text-emerald-500 transition-colors">Verify Receipt Hash</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-emerald-500 transition-colors">Voter Portal</Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-emerald-500 transition-colors">Register Account</Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <h4 className="font-sans font-semibold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider">Contact & Support</h4>
            <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
              <li className="flex items-center space-x-2">
                <Mail size={16} className="text-emerald-500 flex-shrink-0" />
                <span>support@securevote.gov</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone size={16} className="text-emerald-500 flex-shrink-0" />
                <span>+1 (800) 555-VOTE</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin size={16} className="text-emerald-500 flex-shrink-0" />
                <span>Federal Democracy Plaza, Suite 404</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 dark:text-slate-400">
          <p>© {new Date().getFullYear()} SecureVote. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 sm:mt-0">
            <span className="hover:text-emerald-500 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-emerald-500 cursor-pointer">Terms of Service</span>
            <span className="hover:text-emerald-500 cursor-pointer">Security Audits</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
