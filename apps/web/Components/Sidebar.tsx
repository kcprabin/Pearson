import React from 'react';
import {
  LayoutDashboard,
  Inbox,
  Star,
  MessageSquare,
  FileText,
  Bot,
  Settings,
  Sparkles,
  LogOut,
  ChevronDown,
  X,
} from 'lucide-react';
import { useAuth } from '../Contexts/Authcontext';

export type DashboardView =
  | 'overview'
  | 'orders'
  | 'feedback'
  | 'whatsapp'
  | 'knowledge'
  | 'assistant'
  | 'settings';

interface SidebarProps {
  currentView: DashboardView;
  onSelectView: (view: DashboardView) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  pendingOrdersCount: number;
  totalFeedbackCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  mobileOpen,
  onCloseMobile,
  pendingOrdersCount,
  totalFeedbackCount,
}) => {
  const auth = useAuth();

  const navItems: { label: string; icon: React.ComponentType<{ size?: number; className?: string }>; view: DashboardView; badge?: number | string }[] = [
    { label: 'Overview', icon: LayoutDashboard, view: 'overview' },
    { label: 'Orders & Kitchen', icon: Inbox, view: 'orders', badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined },
    { label: 'Feedback Point', icon: Star, view: 'feedback', badge: `${totalFeedbackCount}` },
    { label: 'WhatsApp & Bot', icon: MessageSquare, view: 'whatsapp' },
    { label: 'Menu & Knowledge', icon: FileText, view: 'knowledge' },
    { label: 'Pearson AI Chat', icon: Bot, view: 'assistant' },
    { label: 'Restaurant Settings', icon: Settings, view: 'settings' },
  ];

  const restaurantName = auth?.user?.name || auth?.user?.Name || 'Pearson Restaurant';
  const ownerName = auth?.user?.Username || auth?.user?.Name || 'Restaurant Admin';
  const initials = (ownerName || 'AD')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <>
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        {/* Brand */}
        <div className="flex items-center justify-between">
          <div className="brand">
            <div className="brand-mark">P</div>
            <span>Pearson</span>
          </div>
          {mobileOpen && (
            <button
              onClick={onCloseMobile}
              className="text-slate-400 hover:text-white md:hidden"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Workspace Switcher */}
        <div className="workspace-switcher cursor-pointer" onClick={() => onSelectView('settings')}>
          <div className="workspace-icon">🍽️</div>
          <div>
            <strong>{restaurantName}</strong>
            <small>Autonomous Voice Ordering</small>
          </div>
          <ChevronDown size={14} className="text-slate-400" />
        </div>

        {/* Nav Label */}
        <p className="nav-label">COMMAND CENTER</p>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1">
          {navItems.map(({ label, icon: Icon, view, badge }) => {
            const isActive = currentView === view;
            return (
              <button
                key={view}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  onSelectView(view);
                  onCloseMobile();
                }}
              >
                <Icon size={18} />
                <span>{label}</span>
                {badge !== undefined && <em>{badge}</em>}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Bottom */}
        <div className="sidebar-bottom">
          <div
            className="help-box cursor-pointer transition hover:bg-[#225754]"
            onClick={() => onSelectView('assistant')}
          >
            <Sparkles size={18} className="shrink-0 text-[#d9e85a]" />
            <div>
              <strong>Pearson AI Assistant</strong>
              <small>Ask about orders, menus or stats</small>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[#23504d] pt-3 text-xs text-slate-300">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="avatar small shrink-0">{initials}</div>
              <div className="min-w-0">
                <strong className="block truncate text-white">{ownerName}</strong>
                <small className="block truncate text-slate-400">Admin</small>
              </div>
            </div>
            <button
              onClick={() => void auth?.logout()}
              title="Sign Out"
              className="rounded p-1.5 text-slate-400 hover:bg-[#204946] hover:text-white"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <button
          className="mobile-overlay"
          aria-label="Close navigation"
          onClick={onCloseMobile}
        />
      )}
    </>
  );
};
