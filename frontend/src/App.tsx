import React, { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { HomePage } from "./pages/HomePage";
import { DashboardPage } from "./pages/DashboardPage";
import { ConversationInboxPage } from "./pages/ConversationInboxPage";
import { RoutingReviewPage } from "./pages/RoutingReviewPage";
import { DealsAtRiskPage } from "./pages/DealsAtRiskPage";
import { ImportReplayPage } from "./pages/ImportReplayPage";
import { DataQualityPage } from "./pages/DataQualityPage";
import { ExportsFindingsPage } from "./pages/ExportsFindingsPage";
import { SettingsPage } from "./pages/SettingsPage";

export function App() {
  const [currentPage, setCurrentPage] = useState<string>("home");
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "home":
        return <HomePage onNavigate={(p) => setCurrentPage(p)} />;
      case "dashboard":
        return <DashboardPage />;
      case "inbox":
        return <ConversationInboxPage />;
      case "routing":
        return <RoutingReviewPage />;
      case "deals":
        return <DealsAtRiskPage />;
      case "imports":
        return <ImportReplayPage />;
      case "quality":
        return <DataQualityPage />;
      case "exports":
        return <ExportsFindingsPage />;
      case "settings":
        return <SettingsPage />;
      default:
        return <HomePage onNavigate={(p) => setCurrentPage(p)} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#151515] text-[#F5F5F5] flex font-sans antialiased selection:bg-[#08B6D4] selection:text-black">
      {/* Fixed Left Sidebar matching screenshot */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={(page) => setCurrentPage(page)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 md:lg:pl-80 transition-all duration-300">
        <Header
          currentPage={currentPage}
          onOpenMobile={() => setIsMobileOpen(true)}
        />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {renderCurrentPage()}
        </main>
      </div>
    </div>
  );
}

export default App;
