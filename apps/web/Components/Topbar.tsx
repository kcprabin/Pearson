import React from 'react';
import { Menu, Plus, Star, Download, LogOut, CheckCircle2, Bot } from 'lucide-react';
import { useAuth } from '../Contexts/Authcontext';
import type { DashboardView } from './Sidebar';

interface TopbarProps {
  currentView: DashboardView;
  onOpenMobile: () => void;
  onOpenNewOrder: () => void;
  onOpenFeedbackModal: () => void;
  onExportReport: () => void;
  whatsAppConnected: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentView,
  onOpenMobile,
  onOpenNewOrder,
  onOpenFeedbackModal,
  onExportReport,
  whatsAppConnected,
}) => {
  const auth = useAuth();

  const viewTitles: Record<DashboardView, { title: string; section: string }> = {
    overview: { title: 'Operations Overview', section: 'Real-time Command' },
    orders: { title: 'Kitchen & Orders', section: 'Live Orders' },
    feedback: { title: 'Customer Feedback Point', section: 'Experience & CSAT' },
    whatsapp: { title: 'WhatsApp & AI Voice Gateway', section: 'Autonomous Ordering' },
    knowledge: { title: 'Menu & Vector Knowledge Base', section: 'RAG Grounding' },
    assistant: { title: 'Pearson AI Assistant', section: 'Co-Pilot' },
    settings: { title: 'Restaurant Configuration', section: 'Settings' },
  };

  const { title, section } = viewTitles[currentView] || {
    title: 'Dashboard',
    section: 'Workspace',
  };

  const ownerName = auth?.user?.Username || auth?.user?.Name || 'Admin';
  const initials = (ownerName || 'AD')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <header className="topbar">
      <div className="flex items-center gap-3">
        <button className="mobile-menu" onClick={onOpenMobile} aria-label="Open menu">
          <Menu size={22} />
        </button>
        <div className="breadcrumb">
          <span>{section}</span>
          <strong>/</strong>
          <b>{title}</b>
        </div>
      </div>

      <div className="topbar-actions">
        {/* Status Pills */}
        <div className="hidden items-center gap-3 lg:flex">
          <div
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
              whatsAppConnected
                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
            }`}
          >
            <CheckCircle2 size={13} className={whatsAppConnected ? 'text-emerald-500' : 'text-amber-500'} />
            <span>{whatsAppConnected ? 'WhatsApp: Online' : 'WhatsApp: Pairing'}</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800 ring-1 ring-teal-200">
            <Bot size={13} className="text-teal-600" />
            <span>AI Voice Agent: Ready</span>
          </div>
        </div>

        {/* Quick action buttons */}
        <button
          onClick={onOpenFeedbackModal}
          className="inline-flex items-center gap-1.5 rounded-md bg-[#e4ede8] px-3 py-1.5 text-xs font-semibold text-[#183d38] transition hover:bg-[#d6e4dc]"
          title="Open Customer Feedback Point"
        >
          <Star size={14} className="text-amber-500 fill-amber-500" />
          <span className="hidden sm:inline">Feedback Point</span>
        </button>

        <button
          onClick={onOpenNewOrder}
          className="inline-flex items-center gap-1.5 rounded-md bg-[#d9e85a] px-3 py-1.5 text-xs font-bold text-[#143936] transition hover:bg-[#c9da45]"
          title="Create Walk-in or Phone Order"
        >
          <Plus size={15} />
          <span className="hidden sm:inline">New Order</span>
        </button>

        <button
          onClick={onExportReport}
          className="hidden items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 md:inline-flex"
          title="Download Executive PDF Summary"
        >
          <Download size={14} />
          <span>PDF Report</span>
        </button>

        {/* User avatar & logout */}
        <div className="flex items-center gap-2 pl-2">
          <div className="avatar" title={ownerName}>
            {initials}
          </div>
          <button
            onClick={() => void auth?.logout()}
            className="logout-button ml-1 cursor-pointer text-slate-500 hover:text-rose-600"
            title="Sign Out"
          >
            <LogOut size={16} />
            <span className="hidden xl:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
