import React from "react";
import {
  Home,
  LayoutDashboard,
  Inbox,
  GitPullRequest,
  AlertTriangle,
  UploadCloud,
  CheckCircle2,
  FileDown,
  Settings,
  Sparkles
} from "lucide-react";

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  isMobileOpen,
  onCloseMobile
}) => {
  const navItems = [
    { id: "home", label: "HOME", icon: Home },
    { id: "dashboard", label: "MANAGER DASHBOARD", icon: LayoutDashboard },
    { id: "inbox", label: "CONVERSATION INBOX", icon: Inbox },
    { id: "routing", label: "ROUTING & REVIEW", icon: GitPullRequest },
    { id: "deals", label: "DEALS & RISK", icon: AlertTriangle },
    { id: "imports", label: "IMPORT & REPLAY", icon: UploadCloud },
    { id: "quality", label: "DATA QUALITY", icon: CheckCircle2 },
    { id: "exports", label: "EXPORTS & FINDINGS", icon: FileDown },
    { id: "settings", label: "SETTINGS", icon: Settings },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 w-72 md:w-80 bg-[#272830] border-r border-[#3B3B3B] z-50 flex flex-col transition-transform duration-300 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Sidebar Header / Logo */}
        <div className="p-6 border-b border-[#3B3B3B]/60 flex flex-col items-center text-center">
          {/* Logo Icon matching screenshot style: 3 stacked layered documents with small colorful avatars */}
          <div className="relative w-14 h-14 mb-3 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#08B6D4] to-[#008DB5] rounded-2xl transform rotate-6 opacity-30"></div>
            <div className="absolute inset-0 bg-[#202124] border border-[#08B6D4]/50 rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-7 h-7 text-[#08B6D4]" />
            </div>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Revenue Intelligence
          </h1>
          <p className="text-xs text-[#999999] mt-1 font-medium tracking-wide">
            SpendNest Sales Inbox
          </p>
        </div>

        {/* Navigation Buttons */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onCloseMobile();
                }}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs tracking-wider uppercase transition-all duration-200 flex items-center gap-3.5 shadow-sm text-left ${
                  isActive
                    ? "bg-gradient-to-r from-[#08B6D4] to-[#008DB5] text-white shadow-[0_4px_20px_rgba(8,182,212,0.4)] scale-[1.02]"
                    : "bg-[#202124]/70 hover:bg-[#202124] text-[#F5F5F5] hover:text-[#08B6D4] border border-[#3B3B3B]/40 hover:border-[#08B6D4]/50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-[#999999]"}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer with system status & version */}
        <div className="p-4 border-t border-[#3B3B3B]/60 bg-[#202124]/40">
          <div className="flex items-center justify-between text-xs text-[#999999]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-medium text-emerald-400">System Healthy</span>
            </div>
            <span className="text-[11px] font-mono bg-[#151515] px-2 py-0.5 rounded border border-[#3B3B3B]">
              v1.0.0
            </span>
          </div>
          <div className="text-[11px] text-[#777777] mt-1.5 truncate">
            SpendNest Candidate Review
          </div>
        </div>
      </aside>
    </>
  );
};
