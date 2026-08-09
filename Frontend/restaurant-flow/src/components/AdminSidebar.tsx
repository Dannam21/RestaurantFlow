"use client";

export type AdminView = "live" | "reports";

interface NavItem {
  icon: string;
  label: string;
  view: AdminView | null;
}

const NAV_ITEMS: NavItem[] = [
  { icon: "🖥️", label: "Vista en vivo", view: "live" },
  { icon: "📋", label: "Órdenes", view: null },
  { icon: "🍽️", label: "Mesas", view: null },
  { icon: "🧍", label: "Clientes en espera", view: null },
  { icon: "🤖", label: "Agentes IA", view: null },
  { icon: "📊", label: "Reportes", view: "reports" },
  { icon: "👥", label: "Personal", view: null },
  { icon: "📖", label: "Menú", view: null },
  { icon: "📦", label: "Inventario", view: null },
  { icon: "🚚", label: "Proveedores", view: null },
  { icon: "⚙️", label: "Configuración", view: null },
];

interface AdminSidebarProps {
  activeView: AdminView;
  onSelectView: (view: AdminView) => void;
}

export default function AdminSidebar({ activeView, onSelectView }: AdminSidebarProps) {
  return (
    <aside className="flex h-full w-full flex-col overflow-y-auto border-r border-slate-800 bg-[#12121f] px-3 py-4">
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const enabled = item.view !== null;
          const isActive = enabled && item.view === activeView;
          return (
            <button
              key={item.label}
              type="button"
              disabled={!enabled}
              onClick={() => item.view && onSelectView(item.view)}
              title={enabled ? undefined : "Próximamente"}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                isActive
                  ? "bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-md"
                  : enabled
                    ? "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                    : "cursor-not-allowed text-slate-600"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {!enabled && <span className="shrink-0 text-xs text-slate-700">🔒</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
