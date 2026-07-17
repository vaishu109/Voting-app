import React from 'react';
import { 
  BarChart2, 
  Vote, 
  Users, 
  FileText, 
  Settings, 
  History,
  FileSpreadsheet
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, role }) => {
  const adminTabs = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'elections', label: 'Manage Elections', icon: Vote },
    { id: 'candidates', label: 'Manage Candidates', icon: Users },
    { id: 'voters', label: 'Manage Voters', icon: FileSpreadsheet },
    { id: 'audit-logs', label: 'Audit Logs', icon: History },
  ];

  const candidateTabs = [
    { id: 'profile', label: 'Candidate Profile', icon: Users },
    { id: 'manifesto', label: 'Manifesto & Campaign', icon: FileText },
    { id: 'stats', label: 'Campaign Stats', icon: BarChart2 },
  ];

  const tabs = role === 'Candidate' ? candidateTabs : adminTabs;

  return (
    <aside className="w-full md:w-64 flex-shrink-0 bg-white dark:bg-darkBlue-900 border-r border-slate-200 dark:border-slate-800 md:min-h-[calc(100vh-4rem)] flex flex-col transition-colors">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {role} Control Panel
        </h3>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-500'
              }`}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400">
        SecureVote Admin v1.0.0
      </div>
    </aside>
  );
};
