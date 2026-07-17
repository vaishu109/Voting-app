import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Cpu, 
  Lock, 
  Users, 
  ChevronDown, 
  CheckCircle2, 
  Check, 
  Send,
  Vote,
  Award,
  BookOpen
} from 'lucide-react';
import { GlassCard } from '../components/GlassCard';

export const LandingPage: React.FC = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [emailSub, setEmailSub] = useState('');
  const [subbed, setSubbed] = useState(false);

  const stats = [
    { value: '1.2M+', label: 'Votes Secured' },
    { value: '99.99%', label: 'Uptime Integrity' },
    { value: '0', label: 'Security Breaches' },
    { value: '150+', label: 'Elections Hosted' }
  ];

  const features = [
    {
      icon: Shield,
      title: 'Cryptographic Security',
      desc: 'Utilizing end-to-end AES-256 vote encryption and SHA-256 checksums to ensure tamper-proof ballots.'
    },
    {
      icon: Lock,
      title: 'Voter Anonymity',
      desc: 'Our zero-link architecture separates identity verification from vote registry to guarantee secret voting.'
    },
    {
      icon: Cpu,
      title: 'Double Vote Protection',
      desc: 'Robust identity matching tracks participation and stops double voting instantly.'
    },
    {
      icon: Users,
      title: 'Multi-Role Portals',
      desc: 'Tailored platforms for Voters, Candidates, Election Officers, and Administrators.'
    }
  ];

  const steps = [
    { num: '01', title: 'Verify Identity', desc: 'Secure login with multi-factor authentication (MFA) and OTP codes.' },
    { num: '02', title: 'Select Candidate', desc: 'Browse manifestos, bios, symbols and review options carefully.' },
    { num: '03', title: 'Cast Secure Vote', desc: 'Verify choices, confirm with a one-time OTP, and submit balloting.' },
    { num: '04', title: 'Verify Registry', desc: 'Download a receipt containing your verification hash to audit your vote.' }
  ];

  const faqs = [
    {
      q: 'How does SecureVote ensure my vote remains secret?',
      a: 'When you cast a vote, our server verifies your registration and records that you voted. Separately, the vote details are encrypted and stored anonymously without any reference to your voter ID. It is cryptographically impossible to map a ballot back to a specific user.'
    },
    {
      q: 'Can I change my vote after it is submitted?',
      a: 'No. To maintain system integrity and prevent coercion, once a vote is encrypted and registered in the database, it cannot be modified, deleted, or replaced.'
    },
    {
      q: 'What is a voter verification hash?',
      a: 'After voting, you receive a verification receipt hash (a unique SHA-256 checksum). You can input this hash in our public registry portal at any time to verify that your ballot remains present and unchanged in the final election tally.'
    },
    {
      q: 'Does the system require special hardware?',
      a: 'No. SecureVote is fully responsive and compatible with standard web browsers on smartphones, tablets, laptops, and desktop computers.'
    }
  ];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailSub) {
      setSubbed(true);
      setEmailSub('');
    }
  };

  return (
    <div className="relative overflow-hidden min-h-screen">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl ambient-glow-1 pointer-events-none" />
      <div className="absolute top-2/3 right-1/10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl ambient-glow-2 pointer-events-none" />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-4"
        >
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Shield size={14} />
            <span>Cryptographically Certified Portal</span>
          </div>
          <h1 className="font-sans font-extrabold text-4xl sm:text-6xl tracking-tight text-slate-900 dark:text-white leading-tight">
            Secure Digital Democracy <br />
            <span className="bg-gradient-to-r from-emerald-500 via-emerald-400 to-amber-500 bg-clip-text text-transparent">
              Trustworthy, Auditable Voting
            </span>
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            SecureVote is a web platform designed to host transparent elections. Vote remotely with confidence, knowing your ballot is encrypted and instantly auditable.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 flex justify-center space-x-4"
        >
          <Link
            to="/login"
            className="flex items-center space-x-2 px-6 py-3 rounded-2xl bg-emerald-500 text-white font-semibold shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 hover:shadow-emerald-500/30 transition-all hover:scale-[1.02]"
          >
            <Vote size={18} />
            <span>Access Portal</span>
          </Link>
          <Link
            to="/verify-receipt"
            className="flex items-center space-x-2 px-6 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-darkBlue-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition-all"
          >
            <BookOpen size={18} />
            <span>Verify Receipt</span>
          </Link>
        </motion.div>

        {/* Voting Illustration */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-16 max-w-4xl mx-auto relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-amber-500 rounded-2xl opacity-10 blur-xl group-hover:opacity-20 transition-opacity" />
          <img
            src="https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&q=80&w=1200"
            alt="Secure Voting Interface Mockup"
            className="rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-800/50 relative z-10 w-full h-[300px] sm:h-[450px] object-cover"
          />
        </motion.div>
      </section>

      {/* Stats Counter Section */}
      <section className="bg-slate-100/50 dark:bg-darkBlue-900/40 py-12 border-y border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, index) => (
              <div key={index} className="text-center">
                <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-sans">
                  {s.value}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center max-w-xl mx-auto mb-16">
          <h2 className="text-3xl font-bold font-sans text-slate-900 dark:text-white">Security-First Architecture</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            SecureVote is built on standard cryptographic primitives to deliver auditability and privacy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, index) => {
            const Icon = f.icon;
            return (
              <GlassCard key={index} className="flex flex-col h-full" delay={index * 0.1}>
                <div className="p-3 bg-emerald-500/10 dark:bg-emerald-950/30 text-emerald-500 rounded-2xl w-fit mb-4">
                  <Icon size={24} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed flex-1">{f.desc}</p>
              </GlassCard>
            );
          })}
        </div>
      </section>

      {/* How It Works - Visual Timeline */}
      <section className="bg-slate-100/50 dark:bg-darkBlue-900/20 py-24 border-t border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="text-3xl font-bold font-sans text-slate-900 dark:text-white">How the Process Works</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Cast your digital ballot in 4 simple and secure steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {steps.map((s, index) => (
              <div key={index} className="relative group text-center sm:text-left">
                <div className="text-6xl font-extrabold text-slate-200 dark:text-slate-800 font-sans mb-3 group-hover:text-emerald-500/20 transition-colors">
                  {s.num}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center max-w-xl mx-auto mb-16">
          <h2 className="text-3xl font-bold font-sans text-slate-900 dark:text-white">Trusted by Leaders</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Read comments from administrators and officers who ran successful elections.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard hoverEffect={false}>
            <p className="text-sm text-slate-500 dark:text-slate-400 italic leading-relaxed">
              "Running municipal elections used to require weeks of setup and huge paper budgets. With SecureVote, we completed district balloting in 48 hours with full voter turnout auditability."
            </p>
            <div className="mt-4 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-bold text-emerald-500">
                MW
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Mayor Marcus Vance</h4>
                <p className="text-[11px] text-slate-400">Metro City Council</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard hoverEffect={false}>
            <p className="text-sm text-slate-500 dark:text-slate-400 italic leading-relaxed">
              "The ability to download verification hashes allows students to confirm their vote is counted. It has turned campus elections into a classroom exercise in modern cryptography."
            </p>
            <div className="mt-4 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-bold text-emerald-500">
                DK
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Dr. Karen Brooks</h4>
                <p className="text-[11px] text-slate-400">Dean of Student Affairs, Tech University</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard hoverEffect={false}>
            <p className="text-sm text-slate-500 dark:text-slate-400 italic leading-relaxed">
              "As an auditor, the automated PDF and Excel reports saved us hours. We validated the entire SHA-256 vote log registry against local registration lists without breaking voter secrecy."
            </p>
            <div className="mt-4 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-bold text-emerald-500">
                JL
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">James Sterling</h4>
                <p className="text-[11px] text-slate-400">Chief Compliance Auditor, Voting Watchdog</p>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-slate-100/50 dark:bg-darkBlue-900/20 py-24 border-y border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold font-sans text-slate-900 dark:text-white">Frequently Asked Questions</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Everything you need to know about SecureVote and its features.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div 
                  key={index}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-darkBlue-900 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left focus:outline-none"
                  >
                    <span className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">
                      {faq.q}
                    </span>
                    <ChevronDown 
                      size={18} 
                      className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-emerald-500' : ''}`} 
                    />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="px-6 pb-4 pt-1 text-sm text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/50 leading-relaxed">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="max-w-xl mx-auto px-4 sm:px-6 py-24 text-center">
        <h2 className="text-3xl font-bold font-sans text-slate-900 dark:text-white mb-2">Want to Run an Election?</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
          Subscribe to get system updates, documentation releases, and announcements.
        </p>

        {subbed ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center space-x-2 text-sm font-semibold"
          >
            <CheckCircle2 size={18} />
            <span>Subscribed successfully! We will email you.</span>
          </motion.div>
        ) : (
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
            <input
              type="email"
              required
              value={emailSub}
              onChange={(e) => setEmailSub(e.target.value)}
              placeholder="Enter your administrative email"
              className="flex-1 px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
            <button
              type="submit"
              className="px-5 py-3 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
            >
              <span>Keep Me Updated</span>
              <Send size={14} />
            </button>
          </form>
        )}
      </section>
    </div>
  );
};
