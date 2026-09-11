import { Bell, ChevronDown, ChevronRight, Menu, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useCommandPalette } from "@/components/CommandPalette";
import { cn } from "@/lib/utils";

interface TopBarProps {
  title: string;
  breadcrumb?: string[];
  approvalCount?: number;
  onApprovalClick?: () => void;
  onMenuClick?: () => void;
}

export function TopBar({
  title,
  breadcrumb,
  approvalCount = 0,
  onApprovalClick,
  onMenuClick,
}: TopBarProps) {
  const navigate = useNavigate();
  const palette = useCommandPalette();

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-slate-200/50 bg-white/90 px-4 backdrop-blur-xl sm:gap-4 sm:px-5 lg:px-7">
      <button
        onClick={onMenuClick}
        aria-label="Open navigation"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/60 bg-white text-slate shadow-subtle lg:hidden"
      >
        <Menu className="h-4 w-4" />
      </button>

      <div className="hidden min-w-0 items-center gap-1.5 text-sm sm:flex">
        {breadcrumb?.map((crumb, index) => (
          <span key={`${crumb}-${index}`} className="flex min-w-0 items-center gap-1.5">
            {index > 0 && (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
            )}
            <span
              className={cn(
                "truncate",
                index === breadcrumb.length - 1
                  ? "font-semibold text-ink"
                  : "cursor-pointer text-slate hover:text-ink",
              )}
              onClick={() => index === 0 && navigate("/")}
            >
              {crumb}
            </span>
          </span>
        ))}
      </div>
      <p className="min-w-0 truncate text-sm font-semibold text-ink sm:hidden">{title}</p>

      <div className="flex-1" />
      <button
        className="hidden items-center gap-2 rounded-xl border border-slate-200/60 bg-ice/70 px-3 py-2 text-xs text-slate transition hover:border-electric/40 md:flex"
        onClick={() => palette?.setOpen(true)}
      >
        <Search className="h-3.5 w-3.5" />
        <span className="min-w-24 text-left xl:min-w-28">Search platform</span>
        <kbd className="rounded-md border border-slate-200/60 bg-white px-1.5 py-0.5 font-mono text-2xs text-slate-300">
          Ctrl K
        </kbd>
      </button>
      <div className="hidden items-center gap-2 rounded-xl border border-slate-200/60 bg-white px-3 py-2 text-xs font-medium text-ink xl:flex">
        <span className="h-2 w-2 rounded-full bg-verified" />
        Demo Workspace
        <ChevronDown className="h-3.5 w-3.5 text-slate-300" />
      </div>
      <button
        onClick={() =>
          onApprovalClick ? onApprovalClick() : navigate("/investigations")
        }
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-transparent hover:border-slate-200/60 hover:bg-ice"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4 text-slate" />
        {approvalCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-approval px-1 text-[9px] font-bold text-white">
            {approvalCount}
          </span>
        )}
      </button>
      <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-midnight text-xs font-semibold text-white sm:flex">
        MS
      </div>
    </header>
  );
}
