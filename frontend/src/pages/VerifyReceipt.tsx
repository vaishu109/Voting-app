import React, { useState } from 'react';
import { ShieldCheck, Search, Loader2, AlertCircle, Calendar } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { motion } from 'framer-motion';

export const VerifyReceipt: React.FC = () => {
  const [hash, setHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hash.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/votes/verify/${hash.trim()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Verification hash not found.');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Invalid verification hash.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 min-h-[calc(100vh-8rem)]">
      <div className="text-center max-w-xl mx-auto mb-12">
        <div className="inline-flex p-3 bg-emerald-500/10 text-emerald-500 rounded-full mb-3">
          <ShieldCheck size={32} />
        </div>
        <h1 className="text-3xl font-bold font-sans text-slate-900 dark:text-white">Audit & Verify Ballots</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Verify that your vote exists securely and unchanged in the SecureVote official registry.
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input
              type="text"
              required
              value={hash}
              onChange={(e) => setHash(e.target.value)}
              placeholder="Enter your 16-character verification hash..."
              className="w-full pl-12 pr-4 py-3 text-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono tracking-wide"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold rounded-2xl shadow-lg shadow-emerald-500/15 hover:shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <span>Verify Ballot</span>}
          </button>
        </form>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-start space-x-3 text-sm"
          >
            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold">Ballot Verification Failed</h4>
              <p className="text-xs opacity-90 mt-1">{error}</p>
            </div>
          </motion.div>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GlassCard hoverEffect={false} className="border-emerald-500/30 dark:border-emerald-500/20 bg-emerald-500/5">
              <div className="flex items-center space-x-3 text-emerald-500 mb-4">
                <ShieldCheck size={24} />
                <h3 className="text-lg font-bold font-sans">Ballot Verification Signature Confirmed</h3>
              </div>

              <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
                <p className="leading-relaxed">
                  The cryptographic fingerprint submitted matches a recorded entry in the official ballot registry. 
                  The ballot remains present and untampered.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-semibold">Associated Election</span>
                    <p className="font-bold text-slate-800 dark:text-white mt-0.5">{result.electionTitle}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-semibold">Ballot Timestamp</span>
                    <p className="font-bold text-slate-800 dark:text-white mt-0.5 flex items-center">
                      <Calendar size={14} className="mr-1 text-slate-400" />
                      {new Date(result.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-xs text-slate-400 uppercase font-semibold">Ballot Audit Hash Signature</span>
                    <p className="font-mono bg-slate-100 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-800/30 text-xs text-slate-800 dark:text-white mt-1 break-all select-all">
                      {result.verificationHash}
                    </p>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </div>
    </div>
  );
};
