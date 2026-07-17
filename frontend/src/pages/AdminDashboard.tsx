import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { GlassCard } from '../components/GlassCard';
import { Sidebar } from '../components/Sidebar';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { 
  Users, 
  Vote, 
  History, 
  Plus, 
  Trash2, 
  Upload, 
  FileDown, 
  Play, 
  Pause, 
  Square, 
  Globe, 
  Save, 
  Loader2, 
  Edit,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

export const AdminDashboard: React.FC = () => {
  const { fetchWithAuth, user } = useAuth();
  const socket = useSocket();
  
  const [activeTab, setActiveTab] = useState('overview');

  // Stats
  const [stats, setStats] = useState<any | null>(null);

  // Elections
  const [elections, setElections] = useState<any[]>([]);
  const [showElectionForm, setShowElectionForm] = useState(false);
  const [editingElectionId, setEditingElectionId] = useState<string | null>(null);
  const [electionTitle, setElectionTitle] = useState('');
  const [electionDesc, setElectionDesc] = useState('');
  const [electionStart, setElectionStart] = useState('');
  const [electionEnd, setElectionEnd] = useState('');
  const [electionRules, setElectionRules] = useState('');
  const [electionElig, setElectionElig] = useState('');
  const [electionBanner, setElectionBanner] = useState('');

  // Candidates
  const [candidates, setCandidates] = useState<any[]>([]);
  const [showCandidateForm, setShowCandidateForm] = useState(false);
  const [candName, setCandName] = useState('');
  const [candParty, setCandParty] = useState('');
  const [candSymbol, setCandSymbol] = useState('');
  const [candBio, setCandBio] = useState('');
  const [candMan, setCandMan] = useState('');
  const [candPhoto, setCandPhoto] = useState('');
  const [candElectionId, setCandElectionId] = useState('');
  const [candUserEmail, setCandUserEmail] = useState('');

  // Voters
  const [voters, setVoters] = useState<any[]>([]);
  const [bulkCsvText, setBulkCsvText] = useState('');
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  // Audit Logs
  const [logs, setLogs] = useState<any[]>([]);

  // Modals & General
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load dashboard overview stats
  const loadStats = async () => {
    try {
      const res = await fetchWithAuth('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

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

  // Load candidates
  const loadCandidates = async () => {
    try {
      const res = await fetchWithAuth('/api/candidates');
      if (res.ok) {
        const data = await res.json();
        setCandidates(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Load voters
  const loadVoters = async () => {
    try {
      const res = await fetchWithAuth('/api/users');
      if (res.ok) {
        const data = await res.json();
        setVoters(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Load audit logs
  const loadLogs = async () => {
    try {
      const res = await fetchWithAuth('/api/admin/audit-logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const initDashboard = async () => {
    setLoading(true);
    await Promise.all([
      loadStats(),
      loadElections(),
      loadCandidates(),
      loadVoters(),
      loadLogs()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    initDashboard();
  }, [activeTab]);

  // Realtime update listener via sockets
  useEffect(() => {
    if (socket) {
      socket.on('vote_cast', (data: any) => {
        console.log('Realtime vote update received:', data);
        // Refresh overview stats and logs silently
        loadStats();
        loadLogs();
      });
      
      socket.on('election_update', () => {
        loadElections();
      });
    }
    return () => {
      if (socket) {
        socket.off('vote_cast');
        socket.off('election_update');
      }
    };
  }, [socket]);

  // Manage Elections: Save
  const handleSaveElection = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setMessage(null);
    setError(null);

    const payload = {
      title: electionTitle,
      description: electionDesc,
      startDate: electionStart,
      endDate: electionEnd,
      rules: electionRules,
      eligibility: electionElig,
      bannerImage: electionBanner
    };

    const endpoint = editingElectionId ? `/api/elections/${editingElectionId}` : '/api/elections';
    const method = editingElectionId ? 'PUT' : 'POST';

    try {
      const res = await fetchWithAuth(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save election.');

      setMessage(`Election ${editingElectionId ? 'updated' : 'created'} successfully.`);
      setShowElectionForm(false);
      setEditingElectionId(null);
      
      // Clear forms
      setElectionTitle('');
      setElectionDesc('');
      setElectionStart('');
      setElectionEnd('');
      setElectionRules('');
      setElectionElig('');
      setElectionBanner('');

      loadElections();
    } catch (err: any) {
      setError(err.message || 'Error occurred.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditElectionClick = (el: any) => {
    setEditingElectionId(el._id);
    setElectionTitle(el.title);
    setElectionDesc(el.description);
    setElectionStart(new Date(el.startDate).toISOString().substring(0, 16));
    setElectionEnd(new Date(el.endDate).toISOString().substring(0, 16));
    setElectionRules(el.rules || '');
    setElectionElig(el.eligibility || '');
    setElectionBanner(el.bannerImage || '');
    setShowElectionForm(true);
  };

  const handleDeleteElection = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this election? Candidates will also be deleted.')) return;
    setActionLoading(true);
    try {
      const res = await fetchWithAuth(`/api/elections/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage('Election deleted successfully.');
        loadElections();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // Start / Pause / End Elections
  const handleUpdateStatus = async (id: string, status: string) => {
    setActionLoading(true);
    try {
      const res = await fetchWithAuth(`/api/elections/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setMessage(`Election status set to ${status}.`);
        loadElections();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // Manage Candidates: Save
  const handleSaveCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setMessage(null);
    setError(null);

    const payload = {
      name: candName,
      party: candParty,
      symbol: candSymbol,
      biography: candBio,
      manifesto: candMan,
      photo: candPhoto,
      electionID: candElectionId,
      userEmail: candUserEmail
    };

    try {
      const res = await fetchWithAuth('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create candidate.');

      setMessage('Candidate created successfully.');
      setShowCandidateForm(false);

      // Clear form
      setCandName('');
      setCandParty('');
      setCandSymbol('');
      setCandBio('');
      setCandMan('');
      setCandPhoto('');
      setCandUserEmail('');

      loadCandidates();
    } catch (err: any) {
      setError(err.message || 'Error occurred.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCandidate = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this candidate?')) return;
    setActionLoading(true);
    try {
      const res = await fetchWithAuth(`/api/candidates/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage('Candidate deleted successfully.');
        loadCandidates();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // Manage Voters: Bulk CSV import
  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setImportResult(null);
    setError(null);

    // CSV format: Name, Email, Phone, Password
    const rows = bulkCsvText.split('\n');
    const votersList = [];
    for (let r of rows) {
      const cols = r.split(',');
      if (cols.length >= 4 && cols[0].trim() !== 'Name') {
        votersList.push({
          name: cols[0].trim(),
          email: cols[1].trim(),
          phone: cols[2].trim(),
          password: cols[3].trim()
        });
      }
    }

    if (votersList.length === 0) {
      setError('No valid voter rows found. Ensure CSV format is: Name,Email,Phone,Password');
      setActionLoading(false);
      return;
    }

    try {
      const res = await fetchWithAuth('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voters: votersList })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Bulk import failed.');

      setImportResult(data.message);
      setBulkCsvText('');
      loadVoters();
    } catch (err: any) {
      setError(err.message || 'Error executing import.');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle user verified approval status
  const handleToggleVoterApproval = async (userId: string, currentStatus: boolean) => {
    setActionLoading(true);
    try {
      const res = await fetchWithAuth('/api/users/verification', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, verified: !currentStatus })
      });
      if (res.ok) {
        setMessage('Voter validation status updated.');
        loadVoters();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteVoter = async (id: string) => {
    if (!window.confirm('Delete voter account permanently?')) return;
    setActionLoading(true);
    try {
      const res = await fetchWithAuth(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage('Voter account removed.');
        loadVoters();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // Export reports
  const triggerReportDownload = async (electionId: string, format: 'pdf' | 'excel' | 'csv') => {
    try {
      const res = await fetchWithAuth(`/api/admin/export?electionId=${electionId}&format=${format}`);
      if (!res.ok) throw new Error('Failed to generate report');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      let ext = format === 'pdf' ? 'pdf' : format === 'excel' ? 'xlsx' : 'csv';
      link.setAttribute('download', `election_report_${electionId}.${ext}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
      alert('Error downloading report.');
    }
  };

  // Chart configs
  const barChartData = {
    labels: ['Registered Users', 'Voters', 'Candidates'],
    datasets: [
      {
        label: 'Users breakdown',
        data: [
          stats?.totalUsers || 0,
          stats?.votersCount || 0,
          stats?.candidatesCount || 0
        ],
        backgroundColor: ['rgba(16, 185, 129, 0.6)', 'rgba(59, 130, 246, 0.6)', 'rgba(245, 158, 11, 0.6)'],
        borderColor: ['#10b981', '#3b82f6', '#f59e0b'],
        borderWidth: 1
      }
    ]
  };

  const donutChartData = {
    labels: ['Voted Turnout', 'Abstained'],
    datasets: [
      {
        data: [stats?.totalVotesCast || 0, Math.max(0, (stats?.votersCount || 0) - (stats?.totalVotesCast || 0))],
        backgroundColor: ['#10b981', '#1e293b'],
        borderWidth: 0
      }
    ]
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">
      {/* Sidebar Control Panel */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role={user?.role || 'Admin'} />

      {/* Main Panel */}
      <main className="flex-1 p-6 md:p-8 bg-slate-50 dark:bg-darkBlue-950/20 text-slate-800 dark:text-slate-200">
        
        {/* Alerts */}
        {message && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl text-xs font-semibold">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-xs font-semibold">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* OVERVIEW PANEL */}
          {activeTab === 'overview' && stats && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              key="overview"
              className="space-y-8"
            >
              <h2 className="text-2xl font-bold font-sans">System Overview</h2>

              {/* Stat Counters cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-5 bg-white dark:bg-darkBlue-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                  <span className="text-[10px] text-slate-450 uppercase block font-semibold">Total Users</span>
                  <span className="text-3xl font-bold text-slate-900 dark:text-white mt-1 block">{stats.totalUsers}</span>
                </div>
                <div className="p-5 bg-white dark:bg-darkBlue-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                  <span className="text-[10px] text-slate-450 uppercase block font-semibold">Registered Voters</span>
                  <span className="text-3xl font-bold text-slate-900 dark:text-white mt-1 block">{stats.votersCount}</span>
                </div>
                <div className="p-5 bg-white dark:bg-darkBlue-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                  <span className="text-[10px] text-slate-450 uppercase block font-semibold">Live Participation Count</span>
                  <span className="text-3xl font-bold text-emerald-500 mt-1 block">{stats.totalVotesCast} votes</span>
                </div>
                <div className="p-5 bg-white dark:bg-darkBlue-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                  <span className="text-[10px] text-slate-450 uppercase block font-semibold">Live Turnout Rate</span>
                  <span className="text-3xl font-bold text-emerald-500 mt-1 block">{stats.liveTurnoutRate}%</span>
                </div>
              </div>

              {/* Charts grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <GlassCard hoverEffect={false}>
                  <h3 className="text-sm font-bold font-sans uppercase text-slate-450 mb-4">Voter Participation breakdown</h3>
                  <div className="max-h-[220px] flex justify-center">
                    <Doughnut data={donutChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                  </div>
                </GlassCard>

                <GlassCard hoverEffect={false}>
                  <h3 className="text-sm font-bold font-sans uppercase text-slate-450 mb-4">User Registry Breakdown</h3>
                  <div className="max-h-[220px]">
                    <Bar data={barChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                  </div>
                </GlassCard>
              </div>

              {/* Recent Elections List */}
              <div className="bg-white dark:bg-darkBlue-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                <h3 className="text-base font-bold mb-4 font-sans">Active & Recent Elections</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-950/40 text-slate-450">
                      <tr>
                        <th className="px-4 py-3">Title</th>
                        <th className="px-4 py-3">Schedule Dates</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Reports</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {stats.recentElections.map((el: any) => (
                        <tr key={el._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                          <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{el.title}</td>
                          <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                            {new Date(el.startDate).toLocaleDateString()} - {new Date(el.endDate).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
                              {el.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 flex gap-2">
                            <button
                              onClick={() => triggerReportDownload(el._id, 'pdf')}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-slate-500"
                              title="Download PDF"
                            >
                              <FileDown size={14} />
                            </button>
                            <button
                              onClick={() => triggerReportDownload(el._id, 'excel')}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-slate-500"
                              title="Download Excel"
                            >
                              <FileSpreadsheet size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* MANAGE ELECTIONS PANEL */}
          {activeTab === 'elections' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              key="elections"
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold font-sans">Manage Elections</h2>
                <button
                  onClick={() => { setShowElectionForm(!showElectionForm); setEditingElectionId(null); }}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-500/10"
                >
                  <Plus size={16} />
                  <span>Create Election</span>
                </button>
              </div>

              {/* Create/Edit Form */}
              {showElectionForm && (
                <GlassCard hoverEffect={false} className="border-emerald-500/30">
                  <h3 className="text-base font-bold mb-4 font-sans">{editingElectionId ? 'Edit' : 'Create'} Election</h3>
                  <form onSubmit={handleSaveElection} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-450 uppercase">Election Title</label>
                        <input
                          type="text"
                          required
                          value={electionTitle}
                          onChange={(e) => setElectionTitle(e.target.value)}
                          className="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-805 bg-white dark:bg-slate-900"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-450 uppercase">Banner Image URL</label>
                        <input
                          type="text"
                          value={electionBanner}
                          onChange={(e) => setElectionBanner(e.target.value)}
                          className="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-805 bg-white dark:bg-slate-900"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-450 uppercase">Description</label>
                      <textarea
                        rows={3}
                        required
                        value={electionDesc}
                        onChange={(e) => setElectionDesc(e.target.value)}
                        className="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-805 bg-white dark:bg-slate-900"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-450 uppercase">Start Date & Time</label>
                        <input
                          type="datetime-local"
                          required
                          value={electionStart}
                          onChange={(e) => setElectionStart(e.target.value)}
                          className="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-805 bg-white dark:bg-slate-900"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-450 uppercase">End Date & Time</label>
                        <input
                          type="datetime-local"
                          required
                          value={electionEnd}
                          onChange={(e) => setElectionEnd(e.target.value)}
                          className="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-805 bg-white dark:bg-slate-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-450 uppercase">Rules</label>
                        <input
                          type="text"
                          value={electionRules}
                          onChange={(e) => setElectionRules(e.target.value)}
                          placeholder="e.g. One vote per citizen"
                          className="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-805 bg-white dark:bg-slate-900"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-450 uppercase">Eligibility</label>
                        <input
                          type="text"
                          value={electionElig}
                          onChange={(e) => setElectionElig(e.target.value)}
                          placeholder="e.g. Over 18, District 1 resident"
                          className="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-805 bg-white dark:bg-slate-900"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold rounded-xl text-xs shadow-md"
                    >
                      {actionLoading ? 'Saving...' : 'Save Election'}
                    </button>
                  </form>
                </GlassCard>
              )}

              {/* Elections Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {elections.map((el) => (
                  <GlassCard key={el._id} hoverEffect={false}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 rounded">
                        {el.status}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditElectionClick(el)}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteElection(el._id)}
                          className="p-1 hover:bg-red-500/10 rounded text-red-500"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">{el.title}</h3>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">{el.description}</p>
                    
                    {/* Workflow status adjusters */}
                    <div className="mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-800/50 flex flex-wrap gap-2">
                      {el.status === 'upcoming' && (
                        <button
                          onClick={() => handleUpdateStatus(el._id, 'active')}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-[10px] font-semibold transition-all"
                        >
                          <Play size={10} />
                          <span>Start Election</span>
                        </button>
                      )}
                      {el.status === 'active' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(el._id, 'paused')}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded text-[10px] font-semibold transition-all"
                          >
                            <Pause size={10} />
                            <span>Pause</span>
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(el._id, 'ended')}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-red-500 hover:bg-red-650 text-white rounded text-[10px] font-semibold transition-all"
                          >
                            <Square size={10} />
                            <span>End Election</span>
                          </button>
                        </>
                      )}
                      {el.status === 'paused' && (
                        <button
                          onClick={() => handleUpdateStatus(el._id, 'active')}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-[10px] font-semibold transition-all"
                        >
                          <Play size={10} />
                          <span>Resume</span>
                        </button>
                      )}
                      {el.status === 'ended' && (
                        <button
                          onClick={() => handleUpdateStatus(el._id, 'published')}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-[10px] font-semibold transition-all"
                        >
                          <ShieldCheck size={10} />
                          <span>Publish Results</span>
                        </button>
                      )}
                    </div>
                  </GlassCard>
                ))}
              </div>
            </motion.div>
          )}

          {/* MANAGE CANDIDATES PANEL */}
          {activeTab === 'candidates' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              key="candidates"
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold font-sans">Manage Candidates</h2>
                <button
                  onClick={() => setShowCandidateForm(!showCandidateForm)}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-500/10"
                >
                  <Plus size={16} />
                  <span>Create Candidate</span>
                </button>
              </div>

              {/* Create Form */}
              {showCandidateForm && (
                <GlassCard hoverEffect={false} className="border-emerald-500/30">
                  <h3 className="text-base font-bold mb-4 font-sans font-sans">Create Candidate Profile</h3>
                  <form onSubmit={handleSaveCandidate} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-450 uppercase">Candidate Name</label>
                        <input
                          type="text"
                          required
                          value={candName}
                          onChange={(e) => setCandName(e.target.value)}
                          className="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-805 bg-white dark:bg-slate-900"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-450 uppercase">Political Party</label>
                        <input
                          type="text"
                          required
                          value={candParty}
                          onChange={(e) => setCandParty(e.target.value)}
                          className="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-805 bg-white dark:bg-slate-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-450 uppercase">Symbol (Name/Emoji)</label>
                        <input
                          type="text"
                          required
                          value={candSymbol}
                          onChange={(e) => setCandSymbol(e.target.value)}
                          placeholder="e.g. 🦅 Eagle"
                          className="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-805 bg-white dark:bg-slate-900"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-450 uppercase">Candidate Account Email (to Link Dashboard)</label>
                        <input
                          type="email"
                          value={candUserEmail}
                          onChange={(e) => setCandUserEmail(e.target.value)}
                          placeholder="alice@securevote.gov"
                          className="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-805 bg-white dark:bg-slate-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-450 uppercase">Associated Election</label>
                        <select
                          required
                          value={candElectionId}
                          onChange={(e) => setCandElectionId(e.target.value)}
                          className="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-805 bg-white dark:bg-slate-900"
                        >
                          <option value="">Select Election...</option>
                          {elections.map(el => (
                            <option key={el._id} value={el._id}>{el.title}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-450 uppercase">Photo URL</label>
                        <input
                          type="text"
                          value={candPhoto}
                          onChange={(e) => setCandPhoto(e.target.value)}
                          className="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-805 bg-white dark:bg-slate-900"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-450 uppercase">Biography</label>
                      <textarea
                        rows={2}
                        required
                        value={candBio}
                        onChange={(e) => setCandBio(e.target.value)}
                        className="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-805 bg-white dark:bg-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-450 uppercase">Manifesto</label>
                      <textarea
                        rows={2}
                        required
                        value={candMan}
                        onChange={(e) => setCandMan(e.target.value)}
                        className="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-805 bg-white dark:bg-slate-900"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold rounded-xl text-xs shadow-md"
                    >
                      {actionLoading ? 'Saving...' : 'Save Candidate'}
                    </button>
                  </form>
                </GlassCard>
              )}

              {/* Candidates Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {candidates.map((cand) => (
                  <GlassCard key={cand._id} hoverEffect={false}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3">
                        {cand.photo ? (
                          <img src={cand.photo} alt={cand.name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-sm">
                            {cand.name[0]}
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-slate-850 dark:text-white leading-tight">{cand.name}</h4>
                          <p className="text-[10px] text-slate-400 font-semibold">{cand.party}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteCandidate(cand._id)}
                        className="p-1 text-red-500 hover:bg-red-500/10 rounded"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="text-xs space-y-2 text-slate-500 dark:text-slate-400">
                      <p className="line-clamp-2 italic">"{cand.manifesto}"</p>
                      <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/50 flex justify-between text-[10px]">
                        <span>Election:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-350">{cand.electionID?.title || 'Unknown'}</span>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </motion.div>
          )}

          {/* MANAGE VOTERS PANEL */}
          {activeTab === 'voters' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              key="voters"
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold font-sans">Manage Voters</h2>
                <button
                  onClick={() => setShowBulkImport(!showBulkImport)}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-500/10"
                >
                  <Upload size={16} />
                  <span>Bulk Import CSV</span>
                </button>
              </div>

              {/* Bulk import form */}
              {showBulkImport && (
                <GlassCard hoverEffect={false} className="border-emerald-500/30">
                  <h3 className="text-base font-bold mb-2 font-sans flex items-center">
                    <FileSpreadsheet className="mr-2 text-emerald-500" size={18} />
                    Bulk Import Voter Registry CSV
                  </h3>
                  <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                    Paste raw CSV records. Each row format: <strong>Name,Email,Phone,Password</strong> (e.g. John Doe,john@test.com,+15550011,password123). Do not include header columns.
                  </p>

                  {importResult && (
                    <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-semibold">
                      {importResult}
                    </div>
                  )}

                  <form onSubmit={handleBulkImport} className="space-y-4">
                    <textarea
                      rows={5}
                      required
                      value={bulkCsvText}
                      onChange={(e) => setBulkCsvText(e.target.value)}
                      placeholder="Jane Austin,jane@securevote.gov,+15550212,password123&#10;Steve Miller,steve@securevote.gov,+15550213,password123"
                      className="w-full p-4 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-805 bg-white dark:bg-slate-900 leading-relaxed"
                    />

                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold rounded-xl text-xs shadow-md"
                    >
                      {actionLoading ? 'Executing Import...' : 'Run Voter Import'}
                    </button>
                  </form>
                </GlassCard>
              )}

              {/* Voters list table */}
              <div className="bg-white dark:bg-darkBlue-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-950/40 text-slate-450">
                      <tr>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Email / ID</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Approval</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {voters.map((v) => (
                        <tr key={v._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                          <td className="px-4 py-3 font-semibold text-slate-850 dark:text-white">{v.name}</td>
                          <td className="px-4 py-3 text-xs">
                            <div>{v.email}</div>
                            <div className="font-mono text-slate-450 mt-0.5">{v.voterID}</div>
                          </td>
                          <td className="px-4 py-3 capitalize text-xs text-slate-500">{v.role}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleToggleVoterApproval(v._id, v.verified)}
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                v.verified
                                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                  : 'bg-red-500/10 text-red-500 border-red-500/20'
                              }`}
                            >
                              {v.verified ? 'Approved' : 'Pending Verification'}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleDeleteVoter(v._id)}
                              disabled={v._id === user?.id}
                              className="p-1 hover:bg-red-500/10 rounded text-red-500 disabled:opacity-30"
                              title="Delete Voter"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* AUDIT LOGS PANEL */}
          {activeTab === 'audit-logs' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              key="audit-logs"
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold font-sans">System Compliance Audit Logs</h2>
              <p className="text-xs text-slate-450 leading-relaxed max-w-xl">
                Every critical transaction, authentication event, status change, and ballot registry submission is logged instantly with IP addresses for compliance verification.
              </p>

              <div className="bg-white dark:bg-darkBlue-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto max-h-[500px]">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[10px] uppercase bg-slate-50 dark:bg-slate-950/40 text-slate-450 sticky top-0">
                      <tr>
                        <th className="px-4 py-3">Timestamp</th>
                        <th className="px-4 py-3">Action Type</th>
                        <th className="px-4 py-3">Operator</th>
                        <th className="px-4 py-3">IP Address</th>
                        <th className="px-4 py-3">Audit Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                      {logs.map((log) => (
                        <tr key={log._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                          <td className="px-4 py-2.5 text-slate-400 whitespace-nowrap">
                            {new Date(log.timestamp).toISOString().substring(11,19)} / {new Date(log.timestamp).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-white">{log.action}</td>
                          <td className="px-4 py-2.5 text-slate-500">
                            <div>{log.user}</div>
                            <div className="text-[9px] text-slate-400 capitalize">{log.role}</div>
                          </td>
                          <td className="px-4 py-2.5 text-slate-500">{log.ipAddress}</td>
                          <td className="px-4 py-2.5 text-slate-450 max-w-xs truncate" title={log.details}>
                            {log.details || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
