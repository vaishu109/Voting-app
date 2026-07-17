import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Captcha } from '../components/Captcha';
import { ShieldCheck, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const Login: React.FC = () => {
  const [voterID, setVoterID] = useState('');
  const [password, setPassword] = useState('');
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaVerified) {
      setError('Please resolve the CAPTCHA check.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voterID, password })
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.unverified) {
          // Redirect to email verification
          navigate('/verify', { state: { email: data.email, action: 'verify-email' } });
          return;
        }
        throw new Error(data.message || 'Login failed');
      }

      if (data.require2FA) {
        // Redirect to 2FA page
        navigate('/verify', { state: { email: data.email, action: 'verify-2fa' } });
        return;
      }

      // Successful login
      login(data.accessToken, data.refreshToken, data.user);
      
      // Redirect based on role
      if (data.user.role === 'Admin' || data.user.role === 'Election Officer') {
        navigate('/admin');
      } else if (data.user.role === 'Candidate') {
        navigate('/candidate');
      } else {
        navigate('/voter');
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 relative">
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md glass border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl p-8 relative z-10"
      >
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex p-3 bg-emerald-500/10 text-emerald-500 rounded-full">
            <ShieldCheck size={28} />
          </div>
          <h2 className="text-2xl font-bold font-sans text-slate-900 dark:text-white">Secure Portal Access</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sign in using your unique Voter ID to cast your ballot.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-start space-x-2 text-xs">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Voter ID
            </label>
            <input
              type="text"
              required
              value={voterID}
              onChange={(e) => setVoterID(e.target.value.toUpperCase())}
              placeholder="e.g. SV-XXXXXX"
              className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Password
              </label>
              <Link 
                to="/forgot-password"
                className="text-xs text-emerald-500 hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          {/* CAPTCHA validation */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-850/50 rounded-xl">
            <Captcha onVerify={setCaptchaVerified} />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/35 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none transition-all"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <span>Sign In Securely</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400">
          Not registered yet?{' '}
          <Link to="/register" className="text-emerald-500 hover:underline font-semibold">
            Register a voter account
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
