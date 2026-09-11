import { useLayoutEffect, useRef, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import { CommandPaletteProvider } from "@/components/CommandPalette";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { useInvestigationsList } from "@/hooks/useInvestigations";
import { Archive } from "@/pages/Archive";
import { AnalyticsPage } from "@/pages/AnalyticsPage";
import { CommandCenter } from "@/pages/CommandCenter";
import { ConnectionsPage } from "@/pages/Connections";
import { DevMenu } from "@/pages/DevMenu";
import { HistoricalReport } from "@/pages/HistoricalReport";
import { InvestigationReplay } from "@/pages/InvestigationReplay";
import { KnowledgePage } from "@/pages/KnowledgePage";
import { LiveInvestigation } from "@/pages/LiveInvestigation";
import { SpecialistsPage } from "@/pages/SpecialistsPage";
import { StartInvestigation } from "@/pages/StartInvestigation";
import {
  FutureVisionPage,
  GovernancePage,
  SettingsPage,
} from "@/pages/VisionPages";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
});

const breadcrumbMap: Record<string, string[]> = {
  "/": ["Dashboard"],
  "/new": ["Dashboard", "Start Investigation"],
  "/investigations": ["Investigations"],
  "/specialists": ["AI Specialists"],
  "/connections": ["Connections & Tools"],
  "/knowledge": ["Knowledge Center"],
  "/analytics": ["Analytics"],
  "/governance": ["Governance"],
  "/vision": ["Future Vision"],
  "/settings": ["Settings"],
  "/dev": ["Developer Menu"],
};

function AnimatedRoutes({
  approvalCount,
  onOpenNavigation,
}: {
  approvalCount: number;
  onOpenNavigation: () => void;
}) {
  const location = useLocation();
  const scrollContainerRef = useRef<HTMLElement>(null);
  const crumbs =
    breadcrumbMap[location.pathname] ??
    (location.pathname.startsWith("/investigation/")
      ? ["Investigations", "Investigation"]
      : location.pathname.startsWith("/history/")
        ? ["Investigations", "Archived Report"]
        : location.pathname.startsWith("/replay/")
          ? ["Investigations", "Replay"]
          : ["Dashboard"]);

  useLayoutEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, left: 0 });
  }, [location.pathname]);

  return (
    <>
      <TopBar
        title={crumbs.at(-1) ?? "Dashboard"}
        breadcrumb={crumbs}
        approvalCount={approvalCount}
        onMenuClick={onOpenNavigation}
      />
      <main
        ref={scrollContainerRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain scrollbar-thin"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.18 }}
            className="h-full min-h-full"
          >
            <Routes location={location}>
              <Route path="/" element={<CommandCenter />} />
              <Route path="/new" element={<StartInvestigation />} />
              <Route path="/investigations" element={<Archive />} />
              <Route path="/archive" element={<Navigate to="/investigations" replace />} />
              <Route path="/investigation/:id" element={<LiveInvestigation />} />
              <Route path="/history/:id" element={<HistoricalReport />} />
              <Route path="/replay/:id" element={<InvestigationReplay />} />
              <Route path="/specialists" element={<SpecialistsPage />} />
              <Route path="/connections" element={<ConnectionsPage />} />
              <Route path="/capabilities" element={<Navigate to="/specialists" replace />} />
              <Route path="/knowledge" element={<KnowledgePage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/governance" element={<GovernancePage />} />
              <Route path="/vision" element={<FutureVisionPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/dev" element={<DevMenu />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
    </>
  );
}

function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const { data } = useInvestigationsList();
  const approvalCount = (data ?? []).filter(
    (investigation) =>
      investigation.status === "awaiting_capability_approval" &&
      investigation.pending_capability_gap != null,
  ).length;

  return (
    <div className="app-canvas flex h-dvh overflow-hidden">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        approvalCount={approvalCount}
      />
      {mobileNavigationOpen && (
        <>
          <button
            aria-label="Close navigation"
            onClick={() => setMobileNavigationOpen(false)}
            className="fixed inset-0 z-40 bg-midnight/45 backdrop-blur-sm lg:hidden"
          />
          <Sidebar
            collapsed={false}
            setCollapsed={() => undefined}
            approvalCount={approvalCount}
            mobile
            onNavigate={() => setMobileNavigationOpen(false)}
          />
        </>
      )}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AnimatedRoutes
          approvalCount={approvalCount}
          onOpenNavigation={() => setMobileNavigationOpen(true)}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <CommandPaletteProvider>
          <AppShell />
        </CommandPaletteProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
