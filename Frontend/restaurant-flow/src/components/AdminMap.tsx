"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import restaurantBg from "@/assets/fondorestaurante.png";
import queueRope from "@/assets/fila.png";
import chef from "@/assets/cocina/chef.png";
import cocinaMesa from "@/assets/cocina/mesa.png";
import Table from "@/src/components/Table";
import WaitingListSign from "@/src/components/WaitingListSign";
import { useContainSize } from "@/src/hooks/useContainSize";
import { useTables } from "@/src/hooks/useTables";
import {
  getOrder,
  getServiceSessions,
  getStaff,
  listWaitlistEntries,
  type OrderResponse,
  type WaitlistEntryResponse,
} from "@/src/lib/api";
import {
  TABLE_POSITIONS,
  BACKEND_TO_UI_STATUS,
  minutesSince,
  getTableAlert,
} from "@/src/lib/tableLayout";

function shortId(id: string) {
  return id.slice(0, 8);
}

const LEGEND: { tone: string; label: string }[] = [
  { tone: "bg-amber-400", label: "Esperando pedido" },
  { tone: "bg-sky-400", label: "Pedido en cocina" },
  { tone: "bg-emerald-400", label: "Comiendo" },
  { tone: "bg-rose-400", label: "Pagando" },
  { tone: "bg-slate-500", label: "Vacío" },
];

export default function AdminMap() {
  const { tables, error } = useTables();
  const { containerRef, size } = useContainSize(3 / 2);

  const [waiterNames, setWaiterNames] = useState<Record<number, string>>({});
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntryResponse[]>([]);
  const [now, setNow] = useState<Date | null>(null);
  const [openTableId, setOpenTableId] = useState<number | null>(null);
  const [openTableOrder, setOpenTableOrder] = useState<OrderResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStaffState() {
      try {
        const [staffUsers, activeSessions] = await Promise.all([
          getStaff({ role: "waiter" }),
          getServiceSessions({ active_only: true }),
        ]);
        if (cancelled) return;

        const staffById = new Map(staffUsers.map((user) => [user.id, user.name]));
        const nextWaiterNames: Record<number, string> = {};
        for (const session of activeSessions) {
          if (session.waiter_id) {
            const name = staffById.get(session.waiter_id);
            if (name) nextWaiterNames[session.table_id] = name;
          }
        }
        setWaiterNames(nextWaiterNames);
      } catch {
        // best-effort — the map still works without waiter names
      }
    }

    async function loadWaitlist() {
      try {
        const entries = await listWaitlistEntries({ active_only: true });
        if (!cancelled) setWaitlistEntries(entries);
      } catch {
        // best-effort
      }
    }

    loadStaffState();
    loadWaitlist();
    const intervalId = window.setInterval(() => {
      loadStaffState();
      loadWaitlist();
    }, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const updateNow = () => setNow(new Date());
    const timeoutId = window.setTimeout(updateNow, 0);
    const intervalId = window.setInterval(updateNow, 30000);
    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadOpenOrder() {
      const openTable = tables.find((table) => table.id === openTableId);
      if (!openTable?.order_id) {
        setOpenTableOrder(null);
        return;
      }
      try {
        const order = await getOrder(openTable.order_id);
        if (!cancelled) setOpenTableOrder(order);
      } catch {
        if (!cancelled) setOpenTableOrder(null);
      }
    }

    if (openTableId === null) {
      setOpenTableOrder(null);
    } else {
      loadOpenOrder();
    }
    return () => {
      cancelled = true;
    };
  }, [openTableId, tables]);

  const occupiedTables = tables.filter((table) => table.status !== "empty").length;
  const attentionTables = tables.filter(
    (table) => getTableAlert(table.status) !== undefined
  ).length;
  const kitchenOnline = tables.some((table) => table.status === "cooking");

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#0f172a]"
    >
      <Image
        src={restaurantBg}
        alt=""
        aria-hidden="true"
        fill
        priority
        className="scale-110 select-none object-cover opacity-50 blur-2xl"
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-32 bg-gradient-to-b from-slate-950 via-slate-950/70 to-transparent" />

      <div className="absolute left-4 right-4 top-3 z-30">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
          Mapa del restaurante en vivo
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          {LEGEND.map((entry) => (
            <span key={entry.label} className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className={`h-2 w-2 rounded-full ${entry.tone}`} />
              {entry.label}
            </span>
          ))}
        </div>
      </div>

      <div className="absolute left-4 top-14 z-30 flex max-w-[calc(100%-2rem)] flex-wrap items-center gap-2">
        <div className="rounded-full border border-slate-700/80 bg-slate-950/85 px-3 py-1.5 text-xs text-slate-200 shadow-lg backdrop-blur-sm">
          {occupiedTables}/{tables.length || 10} mesas activas
        </div>
        <div className="rounded-full border border-amber-500/30 bg-amber-950/70 px-3 py-1.5 text-xs text-amber-200 shadow-lg backdrop-blur-sm">
          {attentionTables} mesas con seguimiento
        </div>
        <div
          className={`rounded-full border px-3 py-1.5 text-xs shadow-lg backdrop-blur-sm ${
            kitchenOnline
              ? "border-emerald-500/30 bg-emerald-950/70 text-emerald-200"
              : "border-slate-700/60 bg-slate-950/70 text-slate-400"
          }`}
        >
          {kitchenOnline ? "🟢 Cocina en línea" : "Cocina sin actividad"}
        </div>
        {now && (
          <div className="rounded-full border border-slate-700/80 bg-slate-950/85 px-3 py-1.5 text-xs font-medium text-slate-200 shadow-lg backdrop-blur-sm">
            {now.toLocaleTimeString("es-ES", { hour: "numeric", minute: "2-digit" })}
          </div>
        )}
      </div>

      {error && (
        <div className="absolute right-4 top-4 z-30 max-w-sm rounded-2xl border border-rose-500/30 bg-rose-950/85 px-4 py-3 text-sm text-rose-100 shadow-xl backdrop-blur-sm">
          {error}
        </div>
      )}

      <div
        className="relative scale-140"
        style={{
          width: size.width || "100%",
          height: size.height || "100%",
        }}
      >
        <Image
          src={restaurantBg}
          alt="Restaurante El Sabor visto desde arriba"
          fill
          priority
          className="select-none object-contain drop-shadow-[0_10px_40px_rgba(0,0,0,0.6)]"
        />

        {tables.map((table) => {
          const position = TABLE_POSITIONS[table.id];
          if (!position) return null;

          const isOpen = openTableId === table.id;
          const alert = getTableAlert(table.status);
          const waiterName = waiterNames[table.id];

          return (
            <div key={table.id}>
              <Table
                id={String(table.id)}
                x={position.x}
                y={position.y}
                status={BACKEND_TO_UI_STATUS[table.status]}
                numPersonas={table.customers}
                sinceMinutes={
                  table.status === "empty" ? undefined : minutesSince(table.updated_at)
                }
                alert={alert}
                assignedWaiterName={waiterName}
                onClick={
                  table.status === "empty"
                    ? undefined
                    : () => setOpenTableId(isOpen ? null : table.id)
                }
              />

              {isOpen && (
                <div
                  className="absolute z-40 w-52 -translate-x-1/2 rounded-2xl border border-slate-700/80 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-sm"
                  style={{ top: position.y, left: position.x, marginTop: "4rem" }}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Mesa {table.id}
                  </p>
                  <p className="mt-1 text-sm text-slate-200">
                    {table.customers} {table.customers === 1 ? "comensal" : "comensales"}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Mesero: {waiterName ?? "Sin asignar"}
                  </p>
                  {table.order_id ? (
                    <>
                      <p className="mt-1 text-xs text-slate-400">
                        Pedido #{shortId(table.order_id)}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Estado del pedido: {openTableOrder?.status ?? "cargando..."}
                      </p>
                    </>
                  ) : (
                    <p className="mt-1 text-xs text-slate-500">Sin pedido activo</p>
                  )}
                  <p className="mt-1 text-xs text-slate-500">
                    Hace {minutesSince(table.updated_at)} min
                  </p>
                </div>
              )}
            </div>
          );
        })}

        <Image
          src={chef}
          alt="Chef"
          className="pointer-events-none absolute z-10 h-auto w-[4%] select-none object-contain drop-shadow-[0_6px_6px_rgba(0,0,0,0.5)]"
          style={{ top: "19%", left: "56%" }}
        />

        <Image
          src={cocinaMesa}
          alt="Mesa de la cocina"
          className="pointer-events-none absolute z-10 h-auto w-[25%] select-none object-contain"
          style={{ top: "15%", left: "41%" }}
        />

        <div
          className="pointer-events-none absolute z-20 rounded-md border border-amber-700/50 bg-slate-950/85 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300 shadow-lg"
          style={{ top: "1%", left: "48%" }}
        >
          Cocina
        </div>

        <Image
          src={queueRope}
          alt="Fila de espera"
          className="pointer-events-none absolute z-10 h-auto w-[18%] select-none object-contain"
          style={{ top: "57%", left: "24%" }}
        />
        <Image
          src={queueRope}
          alt="Fila de espera"
          className="pointer-events-none absolute z-10 h-auto w-[18%] select-none object-contain"
          style={{ top: "57%", left: "38%" }}
        />

        <WaitingListSign activeCount={waitlistEntries.length} />
      </div>
    </div>
  );
}
