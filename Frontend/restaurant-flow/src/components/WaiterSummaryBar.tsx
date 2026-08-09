"use client";

import Image from "next/image";
import { useMemo } from "react";
import summaryOccupied from "@/assets/mesero/img1.png";
import summaryWaiting from "@/assets/mesero/img2.png";
import summaryCooking from "@/assets/mesero/img3.png";
import summaryPaying from "@/assets/mesero/img4.png";
import summaryEating from "@/assets/mesero/img5.png";
import { useTables } from "@/src/hooks/useTables";
import type { AvailableWaiter, ServiceRequest } from "@/src/types";

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
    { image: summaryOccupied, label: "Mesas ocupadas", count: occupiedTables },
    { image: summaryWaiting, label: "Esperando pedido", count: waitingOrderTables },
    { image: summaryCooking, label: "En cocina", count: cookingTables },
    { image: summaryPaying, label: "Pagando", count: payingTables },
    { image: summaryEating, label: "Comiendo", count: eatingTables },
  ].sort((a, b) => b.count - a.count);

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
    <div className="grid shrink-0 grid-cols-1 gap-2 bg-[#0b1120]/95 px-3 py-1.5 backdrop-blur-sm lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
      <section className="flex h-full flex-col justify-center">
        <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Resumen en vivo
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {summaryTiles.map((tile) => (
            <div
              key={tile.label}
              className="relative aspect-[1627/1085] w-full overflow-hidden"
            >
              <Image
                src={tile.image}
                alt={tile.label}
                fill
                className="select-none object-contain"
              />
              <span className="absolute right-[14%] top-1/2 -translate-y-1/2 text-base font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] sm:text-lg">
                {tile.count}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-700/60 bg-slate-900/40 px-3 py-1.5">
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

      <section className="rounded-lg border border-slate-700/60 bg-slate-900/40 px-3 py-1.5">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Mi Turno
        </p>
        <div className="mt-1.5 flex flex-wrap items-start gap-2">
          <div className="flex flex-wrap gap-1.5">
            {waiters.map((waiter) => {
              return (
                <button
                  key={waiter.id}
                  type="button"
                  disabled={!waiter.online}
                  onClick={() => onCurrentWaiterChange(waiter.id)}
                  className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-left transition-colors ${
                    currentWaiterId === waiter.id
                      ? "border-violet-500/40 bg-violet-500/15"
                      : waiter.online
                        ? "border-slate-700/60 bg-slate-900/40 hover:border-slate-500"
                        : "cursor-not-allowed border-slate-800 bg-slate-900/20 opacity-50"
                  }`}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-rose-500 text-[10px] font-bold text-white">
                    {waiter.name.charAt(0)}
                  </span>
                  <span className="flex flex-col leading-tight">
                    <span className="flex items-center gap-1 text-[11px] text-slate-300">
                      {waiter.name}
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${waiter.online ? "bg-emerald-400" : "bg-slate-600"}`}
                      />
                    </span>
                    <span className="text-[9px] text-slate-500">
                      {!waiter.online
                        ? "Desconectado"
                        : currentWaiterId === waiter.id
                          ? "Eres tú"
                          : "Disponible"}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="min-w-[10rem] flex-1 rounded-lg border border-slate-700/60 bg-slate-950/40 px-2.5 py-1.5">
            {currentWaiter ? (
              <>
                <p className="text-xs font-semibold text-white">
                  Mesero actual: {currentWaiter.name}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {currentWaiterTables.length > 0
                    ? `Mesas: ${currentWaiterTables.join(", ")}`
                    : "Selecciona una mesa del mapa para empezar."}
                </p>
              </>
            ) : (
              <p className="text-[11px] text-slate-500">
                Selecciona qué mesero eres para empezar a operar.
              </p>
            )}
          </div>
        </div>

        {error ? (
          <p className="mt-1.5 rounded-xl border border-rose-500/30 bg-rose-950/30 px-3 py-1.5 text-xs text-rose-200">
            {error}
          </p>
        ) : null}
      </section>
    </div>
  );
}
