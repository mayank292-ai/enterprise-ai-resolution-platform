import { motion } from "motion/react";
import {
  BarChart3,
  BookOpen,
  Bot,
  ChevronLeft,
  LayoutDashboard,
  ListChecks,
  PlugZap,
  Plus,
  Scale,
  Settings,
  Telescope,
  X,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

import { OrbitMotif } from "@/components/ui/OrbitMotif";
import { cn } from "@/lib/utils";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  approvalCount: number;
  mobile?: boolean;
  onNavigate?: () => void;
}

const navSections = [
  {
    label: "Resolve",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard },
      { to: "/new", label: "Start Investigation", icon: Plus },
      { to: "/investigations", label: "Investigations", icon: ListChecks },
    ],
  },
  {
    label: "Platform",
    items: [
      { to: "/connections", label: "Connections & Tools", icon: PlugZap },
      { to: "/specialists", label: "AI Specialists", icon: Bot },
      { to: "/knowledge", label: "Knowledge Center", icon: BookOpen },
      { to: "/governance", label: "Governance", icon: Scale },
    ],
  },
  {
    label: "Insights",
    items: [
      { to: "/analytics", label: "Analytics", icon: BarChart3 },
      { to: "/vision", label: "Future Vision", icon: Telescope },
    ],
  },
];

export function Sidebar({
  collapsed,
  setCollapsed,
  approvalCount,
  mobile = false,
  onNavigate,
}: SidebarProps) {
  const navigate = useNavigate();
  const compact = collapsed && !mobile;

  return (
    <motion.aside
      initial={mobile ? { x: -24 } : false}
      animate={{ width: mobile ? 280 : compact ? 76 : 252, x: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "z-50 h-dvh shrink-0 flex-col border-r border-white/10 bg-midnight text-white shadow-2xl",
        mobile ? "fixed inset-y-0 left-0 flex lg:hidden" : "relative hidden lg:flex",
      )}
    >
      <div className="flex h-16 items-center border-b border-white/10 px-4">
        <button
          onClick={() => {
            navigate("/");
            onNavigate?.();
          }}
          className="flex min-w-0 items-center gap-3 text-left"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-electric/30 bg-white/5 text-electric">
            <OrbitMotif size={23} progress={1} />
          </div>
          {!compact && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight">Resolution AI</p>
              <p className="text-2xs text-slate-200">Enterprise Platform</p>
            </div>
          )}
        </button>
        {mobile && (
          <button
            onClick={onNavigate}
            aria-label="Close navigation"
            className="ml-auto rounded-xl p-2 text-slate-200 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {!compact && (
        <div className="mx-3 mt-4 rounded-xl border border-electric/20 bg-electric/8 px-3 py-2">
          <p className="text-2xs font-semibold uppercase tracking-[.16em] text-electric-300">
            Configurable by design
          </p>
          <p className="mt-1 text-2xs leading-4 text-slate-200">
            Any domain · governed connections · dynamic capabilities
          </p>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-3 py-3 scrollbar-thin">
        {navSections.map((section, sectionIndex) => (
          <div key={section.label} className={sectionIndex > 0 ? "mt-3" : undefined}>
            {!compact && (
              <p className="mb-1.5 px-3 text-[9px] font-semibold uppercase tracking-[.18em] text-white/30">
                {section.label}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/"}
                  onClick={onNavigate}
                  title={compact ? label : undefined}
                  className={({ isActive }) =>
                    cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all",
                      isActive
                        ? "bg-white/10 text-white shadow-inner"
                        : "text-slate-200 hover:bg-white/6 hover:text-white",
                    )
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!compact && <span className="truncate">{label}</span>}
                  {!compact && to === "/investigations" && approvalCount > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-approval px-1 text-2xs font-bold text-white">
                      {approvalCount}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <NavLink
          to="/settings"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/6 hover:text-white"
        >
          <Settings className="h-4 w-4" />
          {!compact && <span>Settings</span>}
        </NavLink>
        {!mobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-200 hover:bg-white/6 hover:text-white"
          >
            <ChevronLeft
              className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")}
            />
            {!compact && <span>Collapse</span>}
          </button>
        )}
      </div>
    </motion.aside>
  );
}
