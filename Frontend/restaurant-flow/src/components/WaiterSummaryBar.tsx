"use client";

import { useMemo } from "react";
import { useTables } from "@/src/hooks/useTables";
import type { AvailableWaiter, ServiceRequest } from "@/src/types";

const TILE_TONE_CLASS = {
  emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  amber: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  rose: "border-rose-500/30 bg-rose-500/10 text-rose-200",
  violet: "border-violet-500/30 bg-violet-500/10 text-violet-200",
  sky: "border-sky-500/30 bg-sky-500/10 text-sky-200",
};

interface WaiterSummaryBarProps {
  waiters: AvailableWaiter[];
  assignments: Record<string, string>;
  currentWaiterId: string | null;
  onCurrentWaiterChange: (waiterId: string) => void;
  error?: string | null;
}

export default function WaiterSummaryBar({
  waiters,
  assignments,
  currentWaiterId,
  onCurrentWaiterChange,
  error,
}: WaiterSummaryBarProps) {
  const { tables } = useTables();
  const tablesByWaiter = new Map<string, string[]>();
  for (const [tableId, waiterId] of Object.entries(assignments)) {
    const tables = tablesByWaiter.get(waiterId) ?? [];
    tables.push(tableId);
    tablesByWaiter.set(waiterId, tables);
  }

  const occupiedTables = tables.filter((table) => table.status !== "empty").length;
  const waitingOrderTables = tables.filter(
    (table) => table.status === "waiting_order"
  ).length;
  const cookingTables = tables.filter((table) => table.status === "cooking").length;
  const payingTables = tables.filter((table) => table.status === "paying").length;
  const eatingTables = tables.filter((table) => table.status === "eating").length;

  const summaryTiles = [
    {
      icon: "👥",
      label: "Mesas ocupadas",
      value: String(occupiedTables),
      tone: "emerald" as const,
    },
    {
      icon: "⏳",
      label: "Esperando pedido",
      value: String(waitingOrderTables),
      tone: "amber" as const,
    },
    {
      icon: "👨‍🍳",
      label: "En cocina",
      value: String(cookingTables),
      tone: "sky" as const,
    },
    {
      icon: "💳",
      label: "Pagando",
      value: String(payingTables),
      tone: "violet" as const,
    },
    {
      icon: "🍽️",
      label: "Comiendo",
      value: String(eatingTables),
      tone: "rose" as const,
    },
  ];

  const requestQueue = useMemo<ServiceRequest[]>(
    () =>
      tables.flatMap((table) => {
        if (table.status === "waiting_order") {
          return [
            {
              id: `request-${table.id}-waiting`,
              time: new Date(table.updated_at).toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              table: `Mesa ${table.id}`,
              description: "Pendiente de tomar pedido",
            },
          ];
        }
        if (table.status === "paying") {
          return [
            {
              id: `request-${table.id}-paying`,
              time: new Date(table.updated_at).toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              table: `Mesa ${table.id}`,
              description: "Cerrar cuenta",
              urgent: true,
            },
          ];
        }
        return [];
      }),
    [tables]
  );
  const currentWaiter =
    waiters.find((waiter) => waiter.id === currentWaiterId) ?? null;
  const currentWaiterTables = currentWaiter
    ? tablesByWaiter.get(currentWaiter.id) ?? []
    : [];

  return (
    <div className="grid shrink-0 grid-cols-1 gap-2 border-t border-slate-800 bg-[#0b1120] px-3 py-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
      <section>
        <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Resumen en vivo
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {summaryTiles.map((tile) => (
            <div
              key={tile.label}
              className={`rounded-lg border px-3 py-2 ${TILE_TONE_CLASS[tile.tone]}`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-xs">{tile.icon}</span>
                <span className="text-lg font-semibold text-white">{tile.value}</span>
              </div>
              <p className="mt-0.5 text-[10px] leading-tight opacity-90">{tile.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-700/60 bg-slate-900/40 px-3 py-2">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Cola de solicitudes
        </p>
        {requestQueue.length > 0 ? (
          <div className="space-y-1.5">
            {requestQueue.map((request) => (
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
        ) : (
          <p className="text-xs text-slate-500">No hay solicitudes activas.</p>
        )}
      </section>

      <section className="rounded-lg border border-slate-700/60 bg-slate-900/40 px-3 py-2">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Mi Turno
        </p>
        <div className="mt-3 flex flex-wrap items-start gap-3">
          <div className="flex flex-wrap gap-2">
            {waiters.map((waiter) => {
              return (
                <button
                  key={waiter.id}
                  type="button"
                  disabled={!waiter.online}
                  onClick={() => onCurrentWaiterChange(waiter.id)}
                  className={`flex flex-col items-center gap-1 rounded-lg border px-2.5 py-2 text-center transition-colors ${
                    currentWaiterId === waiter.id
                      ? "border-violet-500/40 bg-violet-500/15"
                      : waiter.online
                        ? "border-slate-700/60 bg-slate-900/40 hover:border-slate-500"
                        : "cursor-not-allowed border-slate-800 bg-slate-900/20 opacity-50"
                  }`}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-rose-500 text-[11px] font-bold text-white">
                    {waiter.name.charAt(0)}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-slate-300">
                    {waiter.name}
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${waiter.online ? "bg-emerald-400" : "bg-slate-600"}`}
                    />
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {!waiter.online
                      ? "Desconectado"
                      : currentWaiterId === waiter.id
                        ? "Eres tú"
                        : "Disponible"}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="min-w-[10rem] flex-1 rounded-lg border border-slate-700/60 bg-slate-950/40 px-3 py-2">
            {currentWaiter ? (
              <>
                <p className="text-sm font-semibold text-white">
                  Mesero actual: {currentWaiter.name}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {currentWaiterTables.length > 0
                    ? `Mesas tomadas: ${currentWaiterTables.join(", ")}`
                    : "Aun no has tomado ninguna mesa."}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Selecciona una mesa del mapa para empezar a atenderla.
                </p>
              </>
            ) : (
              <p className="text-xs text-slate-500">
                Selecciona qué mesero eres para empezar a operar.
              </p>
            )}
          </div>
        </div>

        {error ? (
          <p className="mt-2 rounded-xl border border-rose-500/30 bg-rose-950/30 px-3 py-2 text-xs text-rose-200">
            {error}
          </p>
        ) : null}
      </section>
    </div>
  );
}
