"use client";

import type { AvailableWaiter, ServiceRequest } from "@/src/types";

const SUMMARY_TILES = [
  { icon: "👥", label: "Mesas ocupadas", value: "5", tone: "emerald" as const },
  { icon: "⏳", label: "Esperando pedido", value: "2", tone: "amber" as const },
  { icon: "🔔", label: "Solicitando atención", value: "1", tone: "rose" as const },
  { icon: "🛎️", label: "Pedidos listos", value: "3", tone: "violet" as const },
  { icon: "🚶", label: "Clientes en espera", value: "4", tone: "sky" as const },
];

const TILE_TONE_CLASS: Record<(typeof SUMMARY_TILES)[number]["tone"], string> = {
  emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  amber: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  rose: "border-rose-500/30 bg-rose-500/10 text-rose-200",
  violet: "border-violet-500/30 bg-violet-500/10 text-violet-200",
  sky: "border-sky-500/30 bg-sky-500/10 text-sky-200",
};

const REQUEST_QUEUE: ServiceRequest[] = [
  { id: "r1", time: "1:12 p.m.", table: "Mesa 7", description: "Solicita atención", urgent: true },
  { id: "r2", time: "1:11 p.m.", table: "Mesa 4", description: "Traer la cuenta" },
  { id: "r3", time: "1:10 p.m.", table: "Mesa 6", description: "Más servilletas" },
];

interface WaiterSummaryBarProps {
  waiters: AvailableWaiter[];
  assignments: Record<string, string>;
}

export default function WaiterSummaryBar({ waiters, assignments }: WaiterSummaryBarProps) {
  const tablesByWaiter = new Map<string, string[]>();
  for (const [tableId, waiterId] of Object.entries(assignments)) {
    const tables = tablesByWaiter.get(waiterId) ?? [];
    tables.push(tableId);
    tablesByWaiter.set(waiterId, tables);
  }

  return (
    <div className="grid shrink-0 grid-cols-1 gap-3 border-t border-slate-800 bg-[#0b1120] px-4 py-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
      <section>
        <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Resumen en vivo
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {SUMMARY_TILES.map((tile) => (
            <div
              key={tile.label}
              className={`rounded-xl border px-3 py-2.5 ${TILE_TONE_CLASS[tile.tone]}`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{tile.icon}</span>
                <span className="text-xl font-semibold text-white">{tile.value}</span>
              </div>
              <p className="mt-0.5 text-[11px] leading-tight opacity-90">{tile.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-700/60 bg-slate-900/40 px-3 py-2.5">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Cola de solicitudes
        </p>
        <div className="space-y-1.5">
          {REQUEST_QUEUE.map((request) => (
            <div key={request.id} className="flex items-center gap-2 text-xs">
              <span className="w-14 shrink-0 text-slate-500">{request.time}</span>
              <span
                className={`truncate ${request.urgent ? "font-semibold text-rose-300" : "text-slate-300"}`}
              >
                {request.table} · {request.description}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-700/60 bg-slate-900/40 px-3 py-2.5">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Meseros disponibles
        </p>
        <div className="flex flex-wrap gap-3">
          {waiters.map((waiter) => {
            const tables = tablesByWaiter.get(waiter.id) ?? [];
            return (
              <div key={waiter.id} className="flex flex-col items-center gap-1">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-rose-500 text-xs font-bold text-white">
                  {waiter.name.charAt(0)}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-slate-300">
                  {waiter.name}
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${waiter.online ? "bg-emerald-400" : "bg-slate-600"}`}
                  />
                </span>
                <span className="text-[10px] text-slate-500">
                  {tables.length > 0
                    ? `Mesa ${tables.join(", ")}`
                    : waiter.online
                      ? "Libre"
                      : "Desconectado"}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
