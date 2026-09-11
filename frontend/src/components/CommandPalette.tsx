import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Plus, History, Bot, Layers, Telescope, PlugZap, BookOpen } from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  icon: ReactNode;
  action: () => void;
  group: string;
}

interface CommandPaletteContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

// The hook and provider intentionally share this small context module.
// eslint-disable-next-line react-refresh/only-export-components
export function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext);
  return ctx;
}

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <CommandPaletteContext.Provider value={{ open, setOpen }}>
      {children}
      <CommandPalette />
    </CommandPaletteContext.Provider>
  );
}

function CommandPalette() {
  const ctx = useCommandPalette();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  if (!ctx?.open) return null;

  const items: CommandItem[] = [
    {
      id: 'new',
      label: 'Start new investigation',
      icon: <Plus className="w-4 h-4" />,
      action: () => { navigate('/new'); ctx.setOpen(false); },
      group: 'Actions',
    },
    {
      id: 'command',
      label: 'Go to Command Center',
      icon: <Layers className="w-4 h-4" />,
      action: () => { navigate('/'); ctx.setOpen(false); },
      group: 'Navigation',
    },
    {
      id: 'archive',
      label: 'View investigation archive',
      icon: <History className="w-4 h-4" />,
      action: () => { navigate('/archive'); ctx.setOpen(false); },
      group: 'Navigation',
    },
    {
      id: 'capabilities',
      label: 'Manage AI specialists',
      icon: <Bot className="w-4 h-4" />,
      action: () => { navigate('/capabilities'); ctx.setOpen(false); },
      group: 'Navigation',
    },
    {
      id: 'connections',
      label: 'Open connections and tools',
      icon: <PlugZap className="w-4 h-4" />,
      action: () => { navigate('/connections'); ctx.setOpen(false); },
      group: 'Navigation',
    },
    {
      id: 'knowledge',
      label: 'Browse reusable knowledge',
      icon: <BookOpen className="w-4 h-4" />,
      action: () => { navigate('/knowledge'); ctx.setOpen(false); },
      group: 'Navigation',
    },
    {
      id: 'vision',
      label: 'Open future vision roadmap',
      icon: <Telescope className="w-4 h-4" />,
      action: () => { navigate('/vision'); ctx.setOpen(false); },
      group: 'Navigation',
    },
  ];

  const filtered = items.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()));
  const groups = [...new Set(filtered.map((i) => i.group))];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-ink/40 backdrop-blur-sm"
      onClick={() => ctx.setOpen(false)}
    >
      <div
        className="w-full max-w-xl bg-white rounded-xl2 shadow-lift border border-slate-200/50 overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200/40">
          <Search className="w-4 h-4 text-slate-300" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands and investigations..."
            className="flex-1 text-sm bg-transparent outline-none text-ink placeholder:text-slate-300"
          />
          <kbd className="text-2xs font-mono text-slate-300 bg-ice-100 px-1.5 py-0.5 rounded">ESC</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto scrollbar-thin py-2">
          {groups.map((group) => (
            <div key={group}>
              <div className="px-4 py-1.5 text-2xs font-semibold text-slate-300 uppercase tracking-wider">{group}</div>
              {filtered.filter((i) => i.group === group).map((item) => (
                <button
                  key={item.id}
                  onClick={item.action}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-ink hover:bg-ice-100/60 transition-colors text-left group"
                >
                  <span className="text-slate-300 group-hover:text-enterprise transition-colors">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-slate-300">No results found</div>
          )}
        </div>
      </div>
    </div>
  );
}
