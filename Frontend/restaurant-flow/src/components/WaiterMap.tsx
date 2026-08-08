"use client";

import Image from "next/image";
import { useState } from "react";
import restaurantBg from "@/assets/fondorestaurante.png";
import chef from "@/assets/cocina/chef.png";
import cocinaMesa from "@/assets/cocina/mesa.png";
import Table, { type TableStatus } from "@/src/components/Table";
import type { AvailableWaiter, TableAlert } from "@/src/types";

interface WaiterTableSeed {
  id: string;
  x: string;
  y: string;
  status: TableStatus;
  numPersonas: number;
  alert?: TableAlert;
}

const WAITER_TABLES: WaiterTableSeed[] = [
  {
    id: "1",
    x: "22%",
    y: "31%",
    status: "comiendo",
    numPersonas: 2,
    alert: { tone: "emerald", icon: "🍽️", label: "Comiendo" },
  },
  {
    id: "2",
    x: "44%",
    y: "31%",
    status: "ocupado",
    numPersonas: 4,
    alert: { tone: "amber", icon: "🔔", label: "Pedido listo", detail: "2 hamburguesas" },
  },
  {
    id: "3",
    x: "66%",
    y: "31%",
    status: "ocupado",
    numPersonas: 3,
    alert: { tone: "amber", icon: "⏳", label: "Esperando pedido" },
  },
  {
    id: "4",
    x: "88%",
    y: "33%",
    status: "ocupado",
    numPersonas: 4,
    alert: { tone: "sky", icon: "💬", label: "Nuevo mensaje" },
  },
  {
    id: "5",
    x: "24%",
    y: "58%",
    status: "comiendo",
    numPersonas: 3,
    alert: { tone: "emerald", icon: "🍽️", label: "Comiendo" },
  },
  {
    id: "6",
    x: "48%",
    y: "58%",
    status: "ocupado",
    numPersonas: 4,
    alert: { tone: "amber", icon: "⏳", label: "Esperando pedido" },
  },
  {
    id: "7",
    x: "72%",
    y: "58%",
    status: "ocupado",
    numPersonas: 3,
    alert: { tone: "rose", icon: "🆘", label: "Solicita atención" },
  },
];

interface WaiterMapProps {
  waiters: AvailableWaiter[];
  assignments: Record<string, string>;
  onAssign: (tableId: string, waiterId: string | null) => void;
}

export default function WaiterMap({ waiters, assignments, onAssign }: WaiterMapProps) {
  const [openTableId, setOpenTableId] = useState<string | null>(null);

  function waiterName(waiterId: string | undefined) {
    return waiters.find((waiter) => waiter.id === waiterId)?.name;
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#0f172a]">
      <div className="relative aspect-[3/2] max-h-full w-full max-w-full">
        <Image
          src={restaurantBg}
          alt="Restaurante El Sabor visto desde arriba"
          fill
          priority
          className="select-none object-contain"
        />

        {WAITER_TABLES.map((table) => {
          const assignedWaiterId = assignments[table.id];
          const isOpen = openTableId === table.id;

          return (
            <div key={table.id}>
              <Table
                id={table.id}
                x={table.x}
                y={table.y}
                status={table.status}
                numPersonas={table.numPersonas}
                alert={table.alert}
                assignedWaiterName={waiterName(assignedWaiterId)}
                onClick={() => setOpenTableId(isOpen ? null : table.id)}
              />

              {isOpen && (
                <div
                  className="absolute z-40 w-40 -translate-x-1/2 rounded-xl border border-slate-700 bg-slate-900/95 p-1.5 shadow-2xl backdrop-blur-sm"
                  style={{ top: table.y, left: table.x, marginTop: "3.6rem" }}
                >
                  <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    Asignar Mesa {table.id}
                  </p>
                  {waiters.map((waiter) => (
                    <button
                      key={waiter.id}
                      type="button"
                      disabled={!waiter.online}
                      onClick={() => {
                        onAssign(table.id, waiter.id);
                        setOpenTableId(null);
                      }}
                      className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors ${
                        assignedWaiterId === waiter.id
                          ? "bg-violet-600/90 text-white"
                          : waiter.online
                            ? "text-slate-200 hover:bg-slate-800"
                            : "cursor-not-allowed text-slate-600"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${waiter.online ? "bg-emerald-400" : "bg-slate-600"}`}
                      />
                      {waiter.name}
                    </button>
                  ))}
                  {assignedWaiterId && (
                    <button
                      type="button"
                      onClick={() => {
                        onAssign(table.id, null);
                        setOpenTableId(null);
                      }}
                      className="mt-0.5 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-rose-300 transition-colors hover:bg-rose-500/10"
                    >
                      Quitar asignación
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        <Image
          src={chef}
          alt="Chef"
          className="pointer-events-none absolute z-10 h-auto w-[4%] select-none object-contain drop-shadow-[0_6px_6px_rgba(0,0,0,0.5)]"
          style={{ top: "8%", left: "63%" }}
        />

        <Image
          src={cocinaMesa}
          alt="Mesa de la cocina"
          className="pointer-events-none absolute z-10 h-auto w-[30%] select-none object-contain"
          style={{ top: "5%", left: "40%" }}
        />
      </div>
    </div>
  );
}
