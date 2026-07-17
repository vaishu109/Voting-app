import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, KeyRound, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const Verification: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const state = location.state as { email: string; action: 'verify-email' | 'verify-2fa' } | undefined;
  const email = state?.email || '';
  const action = state?.action || 'verify-email';

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // If no email state, bounce to login
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Please enter a 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError(null);

    const apiEndpoint = action === 'verify-2fa' ? '/api/auth/verify-2fa' : '/api/auth/verify-email';

    try {
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Verification failed.');
      }

      setSuccess(action === 'verify-2fa' ? 'MFA Verification successful!' : 'Account verified successfully!');

      if (action === 'verify-2fa') {
        setTimeout(() => {
          login(data.accessToken, data.refreshToken, data.user);
          // Redirect based on role
          if (data.user.role === 'Admin' || data.user.role === 'Election Officer') {
            navigate('/admin');
          } else if (data.user.role === 'Candidate') {
            navigate('/candidate');
          } else {
            navigate('/voter');
          }
        }, 1500);
      } else {
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl p-8 text-center"
      >
        <div className="inline-flex p-3 bg-emerald-500/10 text-emerald-500 rounded-full mb-4">
          <KeyRound size={28} />
        </div>
        <h2 className="text-2xl font-bold font-sans text-slate-900 dark:text-white mb-2">
          {action === 'verify-2fa' ? 'Enter 2FA Code' : 'Verify Email Address'}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          We sent a 6-digit one-time code to <strong className="text-slate-800 dark:text-white font-mono">{email}</strong>.
          <br />
          <span className="text-amber-500 font-semibold mt-1 block">
            [Dev Mode]: Code printed in backend server console.
          </span>
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-center space-x-2 text-xs">
            <ShieldAlert size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-semibold">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center">
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="px-6 py-4 text-3xl font-bold font-mono tracking-widest text-center border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 w-full max-w-[240px] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading || success !== null}
            className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/35 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none transition-all"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <span>Submit Code</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
