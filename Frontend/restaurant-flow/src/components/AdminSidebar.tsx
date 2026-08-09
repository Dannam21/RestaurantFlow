"use client";

interface NavItem {
  icon: string;
  label: string;
  enabled: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { icon: "🖥️", label: "Vista en vivo", enabled: true },
  { icon: "📋", label: "Órdenes", enabled: false },
  { icon: "🍽️", label: "Mesas", enabled: false },
  { icon: "🧍", label: "Clientes en espera", enabled: false },
  { icon: "🤖", label: "Agentes IA", enabled: false },
  { icon: "📊", label: "Reportes", enabled: false },
  { icon: "👥", label: "Personal", enabled: false },
  { icon: "📖", label: "Menú", enabled: false },
  { icon: "📦", label: "Inventario", enabled: false },
  { icon: "🚚", label: "Proveedores", enabled: false },
  { icon: "⚙️", label: "Configuración", enabled: false },
];

export default function AdminSidebar() {
  return (
    <aside className="flex h-full w-full flex-col overflow-y-auto border-r border-slate-800 bg-[#12121f] px-3 py-4">
      <div className="flex items-center gap-2.5 px-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-base shadow-md shadow-amber-900/30">
          🍴
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white">
            Restaurant<span className="text-orange-500">Flow</span>
          </p>
          <p className="truncate text-[11px] text-slate-500">
            Panel de Administración
          </p>
        </div>
      </div>

      <nav className="mt-6 flex flex-col gap-1">
        {NAV_ITEMS.map((item, index) => (
          <button
            key={item.label}
            type="button"
            disabled={!item.enabled}
            title={item.enabled ? undefined : "Próximamente"}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
              index === 0
                ? "bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-md"
                : item.enabled
                  ? "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                  : "cursor-not-allowed text-slate-600"
            }`}
          >
            <span className="text-base">{item.icon}</span>
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {!item.enabled && (
              <span className="shrink-0 text-xs text-slate-700">🔒</span>
            )}
          </button>
        ))}
      </nav>
    </aside>
  );
}
