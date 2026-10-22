import React from "react";
import { Menu, Calendar, Download, User, Bell } from "lucide-react";
import { api } from "../api/client";

interface HeaderProps {
  currentPage: string;
  onOpenMobile: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPage, onOpenMobile }) => {
  const getPageTitle = (page: string) => {
    switch (page) {
      case "home":
        return "Home Overview";
      case "dashboard":
        return "Manager Dashboard";
      case "inbox":
        return "Conversation Inbox";
      case "routing":
        return "Routing & Review Queue";
      case "deals":
        return "Deals & Revenue Risk";
      case "imports":
        return "Import & Replay Verification";
      case "quality":
        return "Data Quality & Contract Audit";
      case "exports":
        return "Exports & Evidence Findings";
      case "settings":
        return "System Settings & Routing Rules";
      default:
        return "Revenue Intelligence";
    }
  };

  const handleQuickExport = async () => {
    try {
      const res = await api.createExport();
      window.location.href = api.getExportDownloadUrl(res.export_id);
    } catch (err) {
      alert("Error generating export: " + err);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#151515]/95 backdrop-blur-md border-b border-[#3B3B3B] px-4 md:px-8 py-3.5 flex items-center justify-between">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenMobile}
          className="lg:hidden p-2 text-[#999999] hover:text-white bg-[#202124] rounded-lg border border-[#3B3B3B]"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2 text-xs text-[#999999]">
            <span>SpendNest</span>
            <span>/</span>
            <span className="text-[#08B6D4] font-medium capitalize">{currentPage}</span>
          </div>
          <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
            {getPageTitle(currentPage)}
          </h2>
        </div>
      </div>

      {/* Right: Date badge, Quick actions & User menu */}
      <div className="flex items-center gap-3">
        {/* Local Assessment Date */}
        <div className="hidden sm:flex items-center gap-2 bg-[#202124] border border-[#3B3B3B] px-3 py-1.5 rounded-xl text-xs text-[#F5F5F5]">
          <Calendar className="w-3.5 h-3.5 text-[#08B6D4]" />
          <span>21 August 2026 (Asia/Kolkata)</span>
        </div>

        {/* Quick Export ZIP button */}
        <button
          onClick={handleQuickExport}
          className="hidden md:flex items-center gap-2 bg-gradient-to-r from-[#08B6D4] to-[#008DB5] hover:opacity-90 text-white font-semibold text-xs px-3.5 py-1.5 rounded-xl shadow-[0_2px_12px_rgba(8,182,212,0.35)] transition-all"
          title="Generate and download ZIP export package with manifest.json"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export ZIP</span>
        </button>

        {/* Notification bell */}
        <button className="p-2 text-[#999999] hover:text-white bg-[#202124] rounded-xl border border-[#3B3B3B] relative transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#08B6D4]"></span>
        </button>

        {/* User profile */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#3B3B3B]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#08B6D4] to-[#008DB5] flex items-center justify-center text-white font-bold text-xs shadow-md">
            SM
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-semibold text-white">Sales Manager</div>
            <div className="text-[10px] text-[#999999]">Review Lead</div>
          </div>
        </div>
      </div>
    </header>
  );
};
