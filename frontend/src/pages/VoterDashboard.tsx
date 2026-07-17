import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/GlassCard';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { 
  Vote, 
  Settings, 
  History, 
  Search, 
  Filter, 
  ShieldCheck, 
  ChevronRight, 
  Download, 
  CheckCircle2, 
  XCircle,
  KeyRound,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const VoterDashboard: React.FC = () => {
  const { user, fetchWithAuth, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'elections' | 'history' | 'settings'>('elections');
  
  // Elections list states
  const [elections, setElections] = useState<any[]>([]);
  const [selectedElection, setSelectedElection] = useState<any | null>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterParty, setFilterParty] = useState('');

  // Voting Wizard states
  const [votingWizard, setVotingWizard] = useState<boolean>(false);
  const [wizardStep, setWizardStep] = useState<number>(1); // 1: Verify, 2: Select, 3: Confirm, 4: OTP, 5: Receipt
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [votingOtp, setVotingOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [receipt, setReceipt] = useState<any | null>(null);
  const [wizardError, setWizardError] = useState<string | null>(null);
  const [wizardLoading, setWizardLoading] = useState(false);

  // Settings states
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(user?.twoFactorEnabled || false);

  // Modals
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Load elections
  const loadElections = async () => {
    try {
      const res = await fetchWithAuth('/api/elections');
      if (res.ok) {
        const data = await res.json();
        setElections(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadElections();
  }, [activeTab]);

  // Load candidates for selected election
  const selectElectionForVoting = async (election: any) => {
    setSelectedElection(election);
    try {
      const res = await fetchWithAuth(`/api/candidates?electionId=${election._id}`);
      if (res.ok) {
        const data = await res.json();
        setCandidates(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Launch voting wizard
  const startVotingFlow = async () => {
    if (!selectedElection) return;
    setVotingWizard(true);
    setWizardStep(1);
    setSelectedCandidate(null);
    setVotingOtp('');
    setOtpSent(false);
    setReceipt(null);
    setWizardError(null);
  };

  // Step 1: Send OTP to verify identity
  const handleVerifyIdentity = async () => {
    setWizardLoading(true);
    setWizardError(null);
    try {
      const res = await fetchWithAuth('/api/votes/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ electionID: selectedElection._id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Verification initialization failed.');

      setOtpSent(true);
      setWizardStep(2); // Proceed to candidate selection
    } catch (err: any) {
      setWizardError(err.message || 'Error occurred.');
    } finally {
      setWizardLoading(false);
    }
  };

  // Step 3: Trigger confirmation modal before submitting
  const confirmVoteSelection = () => {
    if (!selectedCandidate) {
      setWizardError('Please select a candidate to proceed.');
      return;
    }
    setWizardStep(3); // Proceed to confirmation preview
  };

  // Step 4: Submit ballot
  const handleCastBallot = async () => {
    setWizardLoading(true);
    setWizardError(null);
    try {
      const res = await fetchWithAuth('/api/votes/cast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          electionID: selectedElection._id,
          candidateID: selectedCandidate._id,
          otpCode: votingOtp
        });
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit vote.');

      setReceipt(data.receipt);
      setWizardStep(5); // Show success receipt
      loadElections(); // Reload list to update hasVoted states
    } catch (err: any) {
      setWizardError(err.message || 'Error occurred.');
      setWizardStep(3); // bounce back to confirmation
    } finally {
      setWizardLoading(false);
    }
  };

  // Download Receipt locally as txt file
  const downloadReceiptFile = () => {
    if (!receipt) return;
    const text = `SECUREVOTE ballot receipt\n=================================\nElection: ${receipt.electionTitle}\nReceipt Hash: ${receipt.verificationHash}\nTimestamp: ${new Date(receipt.timestamp).toLocaleString()}\n\nStatus: Cryptographically Verified & Registered\n=================================\nKeep this receipt hash to verify that your ballot remains present in the official final tally.`;
    
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SecureVote_Receipt_${receipt.verificationHash.substring(0,6)}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Settings update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsSuccess(null);
    setSettingsError(null);
    try {
      const res = await fetchWithAuth('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profileName, phone: profilePhone, profilePhoto })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      updateUser(data.user);
      setSettingsSuccess('Profile updated successfully.');
    } catch (err: any) {
      setSettingsError(err.message || 'Profile update failed.');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsSuccess(null);
    setSettingsError(null);
    try {
      const res = await fetchWithAuth('/api/users/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setOldPassword('');
      setNewPassword('');
      setSettingsSuccess('Password changed successfully.');
    } catch (err: any) {
      setSettingsError(err.message || 'Password update failed.');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleToggleMfa = async () => {
    setSettingsLoading(true);
    setSettingsSuccess(null);
    setSettingsError(null);
    try {
      const res = await fetchWithAuth('/api/auth/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setMfaEnabled(data.twoFactorEnabled);
      if (user) {
        updateUser({ ...user, twoFactorEnabled: data.twoFactorEnabled });
      }
      setSettingsSuccess(data.message);
    } catch (err: any) {
      setSettingsError(err.message || 'MFA change failed.');
    } finally {
      setSettingsLoading(false);
    }
  };

  // Filters
  const filteredCandidates = candidates.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.party.toLowerCase().includes(searchQuery.toLowerCase());
    const matchParty = filterParty === '' || c.party.toLowerCase() === filterParty.toLowerCase();
    return matchSearch && matchParty;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-8rem)]">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b border-slate-200/50 dark:border-slate-800/50 pb-6">
        <div>
          <h1 className="text-3xl font-bold font-sans text-slate-900 dark:text-white">Voter Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Voter ID: <span className="font-mono font-bold text-emerald-500 select-all">{user?.voterID}</span>
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex space-x-2">
          <button
            onClick={() => { setActiveTab('elections'); setVotingWizard(false); setSelectedElection(null); }}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
              activeTab === 'elections'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                : 'bg-white dark:bg-darkBlue-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-950'
            }`}
          >
            <Vote size={14} />
            <span>Elections</span>
          </button>
          <button
            onClick={() => { setActiveTab('history'); setVotingWizard(false); setSelectedElection(null); }}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
              activeTab === 'history'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                : 'bg-white dark:bg-darkBlue-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-950'
            }`}
          >
            <History size={14} />
            <span>Voting History</span>
          </button>
          <button
            onClick={() => { setActiveTab('settings'); setVotingWizard(false); setSelectedElection(null); }}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
              activeTab === 'settings'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                : 'bg-white dark:bg-darkBlue-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-950'
            }`}
          >
            <Settings size={14} />
            <span>Profile settings</span>
          </button>
        </div>
      </div>

      {/* Main Panel Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'elections' && !votingWizard && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            key="elections-list"
          >
            {selectedElection ? (
              // Candidate profile selection view
              <div>
                <button
                  onClick={() => setSelectedElection(null)}
                  className="mb-6 text-sm text-slate-500 hover:text-emerald-500 font-semibold flex items-center space-x-1"
                >
                  <span>← Back to Elections</span>
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Election Description details */}
                  <div className="lg:col-span-1 space-y-6">
                    <GlassCard hoverEffect={false}>
                      <h3 className="text-xl font-bold font-sans text-slate-900 dark:text-white mb-2">
                        {selectedElection.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 capitalize mb-4 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded w-fit font-bold">
                        Status: {selectedElection.status}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                        {selectedElection.description}
                      </p>
                      
                      {selectedElection.rules && (
                        <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-4 mt-4 space-y-2">
                          <h4 className="text-xs uppercase font-semibold tracking-wider text-slate-400">Election Rules</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed">{selectedElection.rules}</p>
                        </div>
                      )}

                      {/* Vote casting action */}
                      {selectedElection.status === 'active' && (
                        <button
                          onClick={startVotingFlow}
                          disabled={user?.hasVoted.includes(selectedElection._id)}
                          className={`w-full py-3 rounded-xl font-semibold shadow-lg text-white transition-all mt-6 flex items-center justify-center space-x-2 ${
                            user?.hasVoted.includes(selectedElection._id)
                              ? 'bg-slate-400 dark:bg-slate-800 pointer-events-none'
                              : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20 hover:scale-[1.01]'
                          }`}
                        >
                          <Vote size={18} />
                          <span>{user?.hasVoted.includes(selectedElection._id) ? 'Vote Already Cast' : 'Cast Your Ballot'}</span>
                        </button>
                      )}
                    </GlassCard>
                  </div>

                  {/* Candidates profiles */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                      <h2 className="text-2xl font-bold font-sans">Running Candidates</h2>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-60">
                          <Search className="absolute left-3.5 top-2.5 text-slate-400" size={16} />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search name or party..."
                            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>
                      </div>
                    </div>

                    {filteredCandidates.length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400">No candidates found for this election.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredCandidates.map((candidate) => (
                          <GlassCard key={candidate._id} className="flex flex-col justify-between">
                            <div>
                              <div className="flex items-center space-x-4 mb-4">
                                {candidate.photo ? (
                                  <img src={candidate.photo} alt={candidate.name} className="w-14 h-14 rounded-full object-cover border border-emerald-500" />
                                ) : (
                                  <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-lg">
                                    {candidate.name[0]}
                                  </div>
                                )}
                                <div>
                                  <h4 className="font-bold text-slate-900 dark:text-white text-base leading-tight">{candidate.name}</h4>
                                  <p className="text-xs text-emerald-500 font-semibold mt-0.5">{candidate.party}</p>
                                  <p className="text-[10px] text-amber-500 font-mono mt-0.5">{candidate.symbol}</p>
                                </div>
                              </div>
                              <div className="space-y-3 text-xs mb-4">
                                <div>
                                  <strong className="text-slate-400 uppercase tracking-wider block text-[10px]">Biography</strong>
                                  <p className="text-slate-650 dark:text-slate-350 leading-relaxed mt-0.5 line-clamp-3">{candidate.biography}</p>
                                </div>
                                <div>
                                  <strong className="text-slate-400 uppercase tracking-wider block text-[10px]">Manifesto Highlights</strong>
                                  <p className="text-slate-650 dark:text-slate-350 leading-relaxed mt-0.5 line-clamp-3 font-sans italic">"{candidate.manifesto}"</p>
                                </div>
                              </div>
                            </div>
                          </GlassCard>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // General Elections list
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {elections.map((election) => {
                  const hasVoted = user?.hasVoted.includes(election._id);
                  return (
                    <GlassCard key={election._id} className="flex flex-col justify-between">
                      <div>
                        {election.bannerImage && (
                          <img src={election.bannerImage} alt={election.title} className="w-full h-32 object-cover rounded-xl mb-4 border border-slate-200/20" />
                        )}
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded ${
                            election.status === 'active' 
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                              : election.status === 'upcoming' 
                              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                              : 'bg-slate-500/10 text-slate-500 border border-slate-550/20'
                          }`}>
                            {election.status}
                          </span>
                          {hasVoted && (
                            <span className="text-[10px] text-emerald-500 font-semibold flex items-center">
                              <ShieldCheck size={12} className="mr-1" /> Ballot Registered
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">{election.title}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                          {election.description}
                        </p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
                        <div className="text-[10px] text-slate-400">
                          Ends: {new Date(election.endDate).toLocaleDateString()}
                        </div>
                        <button
                          onClick={() => selectElectionForVoting(election)}
                          className="text-xs font-semibold text-emerald-500 hover:text-emerald-600 flex items-center space-x-1"
                        >
                          <span>Explore Details</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Voting Wizard Flow */}
        {activeTab === 'elections' && votingWizard && selectedElection && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            key="voting-wizard"
            className="max-w-2xl mx-auto"
          >
            <GlassCard hoverEffect={false}>
              {/* Wizard Steps indicator */}
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200/50 dark:border-slate-800/50">
                <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-500">
                  Ballot Cast Wizard
                </span>
                <span className="text-xs text-slate-400">
                  Step {wizardStep} of 5
                </span>
              </div>

              {wizardError && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-start space-x-2 text-xs">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{wizardError}</span>
                </div>
              )}

              {/* Wizard Step 1: Identity OTP Verification request */}
              {wizardStep === 1 && (
                <div className="space-y-6 text-center py-6">
                  <KeyRound className="mx-auto text-emerald-500" size={48} />
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold font-sans">Multi-Factor Identity Audit</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                      To open your ballot container, we must send a cryptographically secure verification code to your email.
                    </p>
                  </div>
                  <button
                    onClick={handleVerifyIdentity}
                    disabled={wizardLoading}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/10 transition-all flex items-center justify-center space-x-2 mx-auto"
                  >
                    {wizardLoading ? <Loader2 className="animate-spin" size={18} /> : <span>Request Ballot Verification OTP</span>}
                  </button>
                </div>
              )}

              {/* Wizard Step 2: Select candidate */}
              {wizardStep === 2 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold font-sans">Ballot Selection</h3>
                    <p className="text-xs text-slate-450 dark:text-slate-400">
                      Select a candidate to register in your ballot entry.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {candidates.map((c) => (
                      <div
                        key={c._id}
                        onClick={() => setSelectedCandidate(c)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          selectedCandidate?._id === c._id
                            ? 'border-emerald-500 bg-emerald-500/5 shadow-md'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-950'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {c.photo ? (
                            <img src={c.photo} alt={c.name} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-sm">
                              {c.name[0]}
                            </div>
                          )}
                          <div>
                            <h4 className="text-sm font-bold text-slate-800 dark:text-white">{c.name}</h4>
                            <p className="text-xs text-slate-400">{c.party}</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-amber-500 font-semibold font-mono bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
                          {c.symbol}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
                    <button
                      onClick={() => setVotingWizard(false)}
                      className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Cancel Balloting
                    </button>
                    <button
                      onClick={confirmVoteSelection}
                      disabled={!selectedCandidate}
                      className="px-5 py-2 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 rounded-xl"
                    >
                      Confirm Candidate Selection
                    </button>
                  </div>
                </div>
              )}

              {/* Wizard Step 3: Confirmation page & OTP requirement */}
              {wizardStep === 3 && (
                <div className="space-y-6">
                  <div className="space-y-2 text-center">
                    <ShieldCheck className="mx-auto text-emerald-500" size={44} />
                    <h3 className="text-xl font-bold font-sans text-slate-900 dark:text-white">Verify Ballot Structure</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                      Please confirm that the selection below matches your intended choice. Once cast, this choice cannot be changed.
                    </p>
                  </div>

                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-emerald-500">Intended Ballot Option</span>
                      <h4 className="text-base font-bold text-slate-800 dark:text-white mt-0.5">{selectedCandidate.name}</h4>
                      <p className="text-xs text-slate-400">{selectedCandidate.party}</p>
                    </div>
                    <span className="text-xs text-amber-500 font-bold">{selectedCandidate.symbol}</span>
                  </div>

                  <div className="space-y-2 pt-4">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Verify Authorization OTP Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={votingOtp}
                      onChange={(e) => setVotingOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 6-digit OTP code"
                      className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-center font-mono tracking-widest"
                    />
                    <p className="text-[10px] text-amber-500 font-semibold block">
                      [Dev Bypass]: OTP code printed in back-end terminal logs.
                    </p>
                  </div>

                  <div className="flex justify-between pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
                    <button
                      onClick={() => setWizardStep(2)}
                      className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800"
                    >
                      Change Choice
                    </button>
                    <button
                      onClick={handleCastBallot}
                      disabled={votingOtp.length !== 6 || wizardLoading}
                      className="px-5 py-2 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 rounded-xl flex items-center space-x-1.5"
                    >
                      {wizardLoading ? <Loader2 className="animate-spin" size={14} /> : (
                        <>
                          <ShieldCheck size={14} />
                          <span>Cast Audited Vote</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Wizard Step 5: Success Receipt screen */}
              {wizardStep === 5 && receipt && (
                <div className="space-y-6 text-center py-4">
                  <CheckCircle2 className="mx-auto text-emerald-500" size={56} />
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold font-sans">Ballot Cast Successfully</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                      Your choice was successfully encrypted, registered anonymously, and verified in the database logs.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-slate-200/50 dark:border-slate-800/30 text-left space-y-3 font-mono text-xs max-w-md mx-auto">
                    <div>
                      <span className="text-[10px] text-slate-450 uppercase block font-semibold">Ballot Receipt Hash</span>
                      <span className="text-slate-800 dark:text-white break-all select-all font-bold">{receipt.verificationHash}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-450 uppercase block font-semibold">Verification Timestamp</span>
                      <span className="text-slate-800 dark:text-white">{new Date(receipt.timestamp).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex justify-center space-x-3 pt-6 border-t border-slate-200/50 dark:border-slate-800/50">
                    <button
                      onClick={downloadReceiptFile}
                      className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center space-x-2 transition-all"
                    >
                      <Download size={14} />
                      <span>Download Receipt</span>
                    </button>
                    <button
                      onClick={() => { setVotingWizard(false); setSelectedElection(null); }}
                      className="px-5 py-2.5 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition-all"
                    >
                      Return to Elections
                    </button>
                  </div>
                </div>
              )}
            </GlassCard>
          </motion.div>
        )}

        {/* Voting History & Audit hashes tab */}
        {activeTab === 'history' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            key="history-panel"
            className="max-w-3xl mx-auto space-y-6"
          >
            <GlassCard hoverEffect={false}>
              <h3 className="text-xl font-bold font-sans mb-4">Registration Ballots Audited</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                Below is the list of elections in which your identity was validated and logged. 
                Our zero-link layout records your turnout logs here to prevent duplicate submissions, but does not trace your selection records.
              </p>

              <div className="space-y-4">
                {elections.filter(e => user?.hasVoted.includes(e._id)).length === 0 ? (
                  <div className="p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center text-slate-500 dark:text-slate-400">
                    No ballot records found. Explore active elections to cast your first vote.
                  </div>
                ) : (
                  elections.filter(e => user?.hasVoted.includes(e._id)).map(election => (
                    <div key={election._id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-slate-950 dark:text-white">{election.title}</h4>
                        <p className="text-[10px] text-slate-450 mt-1">
                          Ballot Status: <span className="text-emerald-500 font-semibold">Registered & Sealed</span>
                        </p>
                      </div>
                      <span className="text-[10px] uppercase font-extrabold tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded">
                        Voted
                      </span>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Profile Settings (MFA, password changes) */}
        {activeTab === 'settings' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            key="settings-panel"
            className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {/* Form 1: Edit profile */}
            <GlassCard hoverEffect={false}>
              <h3 className="text-lg font-bold font-sans mb-4">Edit Profile details</h3>
              
              {settingsSuccess && (
                <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-semibold">
                  {settingsSuccess}
                </div>
              )}
              {settingsError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs">
                  {settingsError}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    required
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Profile Photo URL
                  </label>
                  <input
                    type="text"
                    value={profilePhoto}
                    onChange={(e) => setProfilePhoto(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={settingsLoading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl shadow-md transition-all"
                >
                  {settingsLoading ? 'Saving...' : 'Save Profile'}
                </button>
              </form>

              <div className="mt-8 border-t border-slate-200/50 dark:border-slate-800/50 pt-6">
                <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-2">Two-Factor Authentication</h4>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Require a random OTP sent to your email whenever logging in to authenticate your voting session.
                </p>
                <button
                  onClick={handleToggleMfa}
                  disabled={settingsLoading}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                    mfaEnabled
                      ? 'bg-red-500/15 text-red-500 hover:bg-red-550/25 border border-red-500/20'
                      : 'bg-emerald-500 text-white shadow-md'
                  }`}
                >
                  {mfaEnabled ? 'Disable Two-Factor Auth' : 'Enable Two-Factor Auth'}
                </button>
              </div>
            </GlassCard>

            {/* Form 2: Change password */}
            <GlassCard hoverEffect={false}>
              <h3 className="text-lg font-bold font-sans mb-4">Change Password</h3>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={settingsLoading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl shadow-md transition-all"
                >
                  {settingsLoading ? 'Saving...' : 'Update Password'}
                </button>
              </form>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
