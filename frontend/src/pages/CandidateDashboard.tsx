import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/GlassCard';
import { Users, BarChart2, ShieldCheck, Mail, Globe, Save, Loader2, Award } from 'lucide-react';
import { motion } from 'framer-motion';

export const CandidateDashboard: React.FC = () => {
  const { user, fetchWithAuth } = useAuth();
  
  const [candidateProfile, setCandidateProfile] = useState<any | null>(null);
  const [election, setElection] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'stats'>('profile');
  
  // Stats
  const [results, setResults] = useState<any | null>(null);
  
  // Profile Form
  const [manifesto, setManifesto] = useState('');
  const [biography, setBiography] = useState('');
  const [symbol, setSymbol] = useState('');
  const [photo, setPhoto] = useState('');
  const [twitter, setTwitter] = useState('');
  const [website, setWebsite] = useState('');

  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadCandidateInfo = async () => {
    try {
      // Find candidate linked to this user ID
      const res = await fetchWithAuth(`/api/candidates`);
      if (res.ok) {
        const list = await res.json();
        // filter by userId
        const mine = list.find((c: any) => c.userId && c.userId._id === user?.id || (c.userId === user?.id));
        if (mine) {
          setCandidateProfile(mine);
          setManifesto(mine.manifesto);
          setBiography(mine.biography);
          setSymbol(mine.symbol);
          setPhoto(mine.photo || '');
          if (mine.socialLinks) {
            setTwitter(mine.socialLinks.twitter || '');
            setWebsite(mine.socialLinks.website || '');
          }
          
          // Get Election info
          const elRes = await fetchWithAuth(`/api/elections/${mine.electionID._id || mine.electionID}`);
          if (elRes.ok) {
            const elData = await elRes.json();
            setElection(elData);
            
            // Load stats if election ended
            if (elData.status === 'ended' || elData.status === 'published' || user?.role === 'Admin') {
              const resStats = await fetchWithAuth(`/api/votes/results/${elData._id}`);
              if (resStats.ok) {
                const statsData = await resStats.json();
                setResults(statsData);
              }
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidateInfo();
  }, []);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateProfile) return;

    setSaveLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetchWithAuth(`/api/candidates/${candidateProfile._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manifesto,
          biography,
          symbol,
          photo,
          socialLinks: { twitter, website }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save changes.');

      setMessage('Candidate campaign profile updated successfully.');
      setCandidateProfile(data);
    } catch (err: any) {
      setError(err.message || 'Error saving changes.');
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
      </div>
    );
  }

  if (!candidateProfile) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <Award size={48} className="mx-auto text-amber-500 mb-4" />
        <h2 className="text-xl font-bold font-sans text-slate-900 dark:text-white mb-2">No Candidate Registration Found</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Your account is not linked to any active candidate profiles. Please request an Election Officer or Admin to create your candidate registration.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b border-slate-200/50 dark:border-slate-800/50 pb-6">
        <div>
          <h1 className="text-3xl font-bold font-sans text-slate-900 dark:text-white">Candidate Campaign Portal</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Election: <span className="font-semibold text-slate-800 dark:text-white">{election?.title}</span>
          </p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
              activeTab === 'profile'
                ? 'bg-emerald-500 text-white shadow-lg'
                : 'bg-white dark:bg-darkBlue-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Campaign Profile
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
              activeTab === 'stats'
                ? 'bg-emerald-500 text-white shadow-lg'
                : 'bg-white dark:bg-darkBlue-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Campaign Analytics
          </button>
        </div>
      </div>

      {activeTab === 'profile' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Public Preview Card */}
          <div className="lg:col-span-1">
            <GlassCard hoverEffect={false}>
              <div className="text-center pb-6 border-b border-slate-200/50 dark:border-slate-800/50">
                {photo ? (
                  <img src={photo} alt={candidateProfile.name} className="w-24 h-24 rounded-full mx-auto object-cover border-2 border-emerald-500" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-3xl mx-auto border-2 border-slate-200">
                    {candidateProfile.name[0]}
                  </div>
                )}
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-4">{candidateProfile.name}</h3>
                <p className="text-xs text-emerald-500 font-semibold mt-1">{candidateProfile.party}</p>
                <span className="inline-block mt-2 text-xs text-amber-500 font-bold font-mono bg-amber-500/5 px-2.5 py-0.5 border border-amber-500/10 rounded-full">
                  {symbol}
                </span>
              </div>

              <div className="space-y-4 pt-6 text-sm text-slate-600 dark:text-slate-300">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Election District Status</span>
                  <p className="font-semibold text-slate-800 dark:text-white mt-0.5 capitalize">{election?.status}</p>
                </div>
                {twitter && (
                  <div className="flex items-center space-x-2 text-xs">
                    <Globe size={14} className="text-emerald-500" />
                    <span className="truncate">{twitter}</span>
                  </div>
                )}
                {website && (
                  <div className="flex items-center space-x-2 text-xs">
                    <Globe size={14} className="text-emerald-500" />
                    <span className="truncate">{website}</span>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Edit Form */}
          <div className="lg:col-span-2">
            <GlassCard hoverEffect={false}>
              <h3 className="text-xl font-bold font-sans mb-6">Manage Public Manifesto</h3>

              {message && (
                <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-semibold">
                  {message}
                </div>
              )}
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs">
                  {error}
                </div>
              )}

              <form onSubmit={handleProfileSave} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Election Symbol Name
                    </label>
                    <input
                      type="text"
                      required
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value)}
                      placeholder="e.g. 🦅 Liberty Eagle"
                      className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Profile Image URL
                    </label>
                    <input
                      type="text"
                      value={photo}
                      onChange={(e) => setPhoto(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Candidate Biography
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={biography}
                    onChange={(e) => setBiography(e.target.value)}
                    placeholder="Enter your professional background and history..."
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none leading-relaxed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Campaign Manifesto
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={manifesto}
                    onChange={(e) => setManifesto(e.target.value)}
                    placeholder="Advocating for digital services, healthcare integration, lower taxes..."
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Twitter Link
                    </label>
                    <input
                      type="url"
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                      placeholder="https://twitter.com/..."
                      className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Website URL
                    </label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saveLoading}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg transition-all"
                >
                  {saveLoading ? <Loader2 className="animate-spin" size={16} /> : (
                    <>
                      <Save size={16} />
                      <span>Save Campaign Changes</span>
                    </>
                  )}
                </button>
              </form>
            </GlassCard>
          </div>
        </div>
      ) : (
        // Campaign Analytics Tab
        <div className="space-y-6">
          <GlassCard hoverEffect={false}>
            <h3 className="text-xl font-bold font-sans mb-4">Election Votes Tally</h3>
            
            {election?.status !== 'ended' && election?.status !== 'published' ? (
              <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center">
                <BarChart2 className="mx-auto text-amber-500 mb-3" size={36} />
                <h4 className="font-bold text-slate-800 dark:text-white text-sm">Votes Tally Container Sealed</h4>
                <p className="text-xs text-slate-500 dark:text-slate-450 mt-1 max-w-sm mx-auto leading-relaxed">
                  To protect election integrity and prevent exit coercion, live vote counts are encrypted. 
                  Tally data will be released automatically once the election closes.
                </p>
              </div>
            ) : (
              results && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                      <span className="text-[10px] text-slate-450 uppercase block font-semibold">My Votes Count</span>
                      <span className="text-2xl font-bold text-emerald-500">
                        {results.results.find((r: any) => r.id === candidateProfile._id)?.votes || 0}
                      </span>
                    </div>
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                      <span className="text-[10px] text-slate-450 uppercase block font-semibold">Voter Turnout Rate</span>
                      <span className="text-2xl font-bold text-emerald-500">
                        {results.turnoutRate}%
                      </span>
                    </div>
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                      <span className="text-[10px] text-slate-450 uppercase block font-semibold">Total Ballots Cast</span>
                      <span className="text-2xl font-bold text-emerald-500">
                        {results.totalVotes}
                      </span>
                    </div>
                  </div>

                  {/* Leaderboard list */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Tally Registry Leaderboard</h4>
                    {results.results.map((c: any, index: number) => {
                      const isMe = c.id === candidateProfile._id;
                      return (
                        <div 
                          key={c.id}
                          className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                            isMe 
                              ? 'border-emerald-500 bg-emerald-500/5' 
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <span className="font-bold text-slate-400 text-sm">#{index + 1}</span>
                            <div>
                              <h5 className="text-sm font-bold text-slate-850 dark:text-white">{c.name} {isMe && '(You)'}</h5>
                              <p className="text-[10px] text-slate-400">{c.party}</p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-sm font-bold text-slate-900 dark:text-white block">{c.votes} votes</span>
                            <span className="text-[10px] text-slate-450 block">{c.percentage}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
};
