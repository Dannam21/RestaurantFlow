"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import restaurantBg from "@/assets/fondorestaurante.png";
import queueRope from "@/assets/fila.png";
import chef from "@/assets/cocina/chef.png";
import cocinaMesa from "@/assets/cocina/mesa.png";
import Table from "@/src/components/Table";
import { useContainSize } from "@/src/hooks/useContainSize";
import { useTables } from "@/src/hooks/useTables";
import {
  applyWaiterTableAction,
  ApiError,
  getOrder,
  type OrderResponse,
} from "@/src/lib/api";
import {
  TABLE_POSITIONS,
  BACKEND_TO_UI_STATUS,
  minutesSince,
  getTableAlert,
} from "@/src/lib/tableLayout";
import type { AvailableWaiter } from "@/src/types";

interface WaiterMapProps {
  waiters: AvailableWaiter[];
  assignments: Record<string, string>;
  currentWaiterId: string | null;
  onTakeOrder: (tableId: number) => void;
  onAssign: (tableId: string, waiterId: string | null) => void;
}

export default function WaiterMap({
  waiters,
  assignments,
  currentWaiterId,
  onTakeOrder,
  onAssign,
}: WaiterMapProps) {
  const { tables, isLoading, error, refetch } = useTables();
  const { containerRef, size } = useContainSize(3 / 2);
  const [openTableId, setOpenTableId] = useState<string | null>(null);
  const [openTableOrder, setOpenTableOrder] = useState<OrderResponse | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  function waiterName(waiterId: string | undefined) {
    return waiters.find((waiter) => waiter.id === waiterId)?.name;
  }

  const currentWaiter = waiters.find((waiter) => waiter.id === currentWaiterId) ?? null;

  const occupiedTables = tables.filter((table) => table.status !== "empty").length;
  const attentionTables = tables.filter(
    (table) => getTableAlert(table.status) !== undefined
  ).length;

  useEffect(() => {
    let cancelled = false;

    async function loadOpenOrder() {
      if (!openTableId) {
        setOpenTableOrder(null);
        return;
      }

      const openTable = tables.find((table) => String(table.id) === openTableId);
      if (!openTable?.order_id) {
        setOpenTableOrder(null);
        return;
      }

      try {
        const order = await getOrder(openTable.order_id);
        if (!cancelled) {
          setOpenTableOrder(order);
          setActionError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setActionError(
            err instanceof ApiError
              ? err.message
              : "No se pudo cargar el estado del pedido."
          );
        }
      }
    }

    loadOpenOrder();
    return () => {
      cancelled = true;
    };
  }, [openTableId, tables]);

  async function handleTableStatusAction(
    tableId: number,
    action: "ready" | "served" | "paying" | "paid"
  ) {
    const table = tables.find((item) => item.id === tableId);
    if (!table || isUpdatingStatus || !currentWaiterId) return;

    setIsUpdatingStatus(true);
    setActionError(null);
    try {
      await applyWaiterTableAction(table.id, currentWaiterId, action);

      await refetch();
      setOpenTableId(null);
      setOpenTableOrder(null);
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? err.message
          : "No se pudo actualizar el estado de la mesa."
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#0f172a]"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-28 bg-gradient-to-b from-slate-950 via-slate-950/70 to-transparent" />

      <div className="absolute left-1/2 top-4 z-30 flex max-w-[calc(100%-2rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-2">
        <div className="rounded-full border border-slate-700/80 bg-slate-950/85 px-3 py-1.5 text-xs text-slate-200 shadow-lg backdrop-blur-sm">
          {isLoading ? "Cargando salón..." : `${occupiedTables}/${tables.length || 10} mesas activas`}
        </div>
        <div className="rounded-full border border-amber-500/30 bg-amber-950/70 px-3 py-1.5 text-xs text-amber-200 shadow-lg backdrop-blur-sm">
          {attentionTables} mesas con seguimiento
        </div>
        <div className="rounded-full border border-violet-500/30 bg-violet-950/70 px-3 py-1.5 text-xs text-violet-200 shadow-lg backdrop-blur-sm">
          {currentWaiter
            ? `${currentWaiter.name}, toca una mesa para tomarla`
            : "Selecciona qué mesero eres para tomar mesas"}
        </div>
      </div>

      {error && (
        <div className="absolute left-1/2 top-16 z-30 max-w-sm -translate-x-1/2 rounded-2xl border border-rose-500/30 bg-rose-950/85 px-4 py-3 text-sm text-rose-100 shadow-xl backdrop-blur-sm">
          {error}
        </div>
      )}

      <div
        className="relative"
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
          className="select-none object-contain"
        />

        {tables.map((table) => {
          const position = TABLE_POSITIONS[table.id];
          if (!position) return null;

          const assignedWaiterId = assignments[String(table.id)];
          const isOpen = openTableId === String(table.id);
          const alert = getTableAlert(table.status);
          const isClaimedByCurrentWaiter =
            currentWaiterId !== null && assignedWaiterId === currentWaiterId;
          const canMarkServed =
            isClaimedByCurrentWaiter &&
            table.status === "cooking" &&
            openTableOrder?.status === "ready" &&
            isOpen;
          const canMarkReady =
            isClaimedByCurrentWaiter &&
            table.status === "cooking" &&
            openTableOrder?.status !== "ready" &&
            isOpen;
          const canMarkPaying =
            isClaimedByCurrentWaiter && table.status === "eating";
          const canCloseBill =
            isClaimedByCurrentWaiter && table.status === "paying";

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
                assignedWaiterName={waiterName(assignedWaiterId)}
                isMine={isClaimedByCurrentWaiter}
                onClick={() =>
                  setOpenTableId(isOpen ? null : String(table.id))
                }
              />

              {isOpen && (
                <div
                  className="absolute z-40 w-48 -translate-x-1/2 rounded-2xl border border-slate-700/80 bg-slate-950/95 p-2 shadow-2xl backdrop-blur-sm"
                  style={{ top: position.y, left: position.x, marginTop: "4rem" }}
                >
                  <div className="border-b border-slate-800 px-2 pb-2 pt-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Operación
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      Mesa {table.id}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {table.customers > 0
                        ? `${table.customers} personas en sala`
                        : "Disponible para asignación futura"}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {assignedWaiterId
                        ? `Atiende: ${waiterName(assignedWaiterId)}`
                        : "Sin mesero asignado"}
                    </p>
                  </div>

                  {currentWaiter ? (
                    <div className="mt-2 flex flex-col gap-2">
                      {isClaimedByCurrentWaiter && table.status === "waiting_order" ? (
                        <button
                          type="button"
                          onClick={() => {
                            setOpenTableId(null);
                            onTakeOrder(table.id);
                          }}
                          className="flex w-full items-center justify-center rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-500"
                        >
                          Tomar pedido
                        </button>
                      ) : null}

                      {canMarkReady ? (
                        <button
                          type="button"
                          onClick={() => handleTableStatusAction(table.id, "ready")}
                          disabled={isUpdatingStatus}
                          className="flex w-full items-center justify-center rounded-xl bg-sky-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-sky-500 disabled:bg-slate-700"
                        >
                          {isUpdatingStatus ? "Actualizando..." : "Marcar pedido listo"}
                        </button>
                      ) : null}

                      {canMarkServed ? (
                        <button
                          type="button"
                          onClick={() => handleTableStatusAction(table.id, "served")}
                          disabled={isUpdatingStatus}
                          className="flex w-full items-center justify-center rounded-xl bg-sky-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-sky-500 disabled:bg-slate-700"
                        >
                          {isUpdatingStatus ? "Actualizando..." : "Marcar como servida"}
                        </button>
                      ) : null}

                      {canMarkPaying ? (
                        <button
                          type="button"
                          onClick={() => handleTableStatusAction(table.id, "paying")}
                          disabled={isUpdatingStatus}
                          className="flex w-full items-center justify-center rounded-xl bg-amber-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-500 disabled:bg-slate-700"
                        >
                          {isUpdatingStatus ? "Actualizando..." : "Pasar a pagando"}
                        </button>
                      ) : null}

                      {canCloseBill ? (
                        <button
                          type="button"
                          onClick={() => handleTableStatusAction(table.id, "paid")}
                          disabled={isUpdatingStatus}
                          className="flex w-full items-center justify-center rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 disabled:bg-slate-700"
                        >
                          {isUpdatingStatus ? "Actualizando..." : "Cerrar cuenta"}
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => {
                          onAssign(String(table.id), currentWaiter.id);
                          setOpenTableId(null);
                        }}
                        className={`flex w-full items-center justify-center rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                          isClaimedByCurrentWaiter
                            ? "bg-violet-600/90 text-white"
                            : "bg-slate-800 text-slate-100 hover:bg-violet-600/80"
                        }`}
                      >
                        {isClaimedByCurrentWaiter
                          ? "Esta mesa ya es tuya"
                          : `Tomar mesa como ${currentWaiter.name}`}
                      </button>

                      {assignedWaiterId && !isClaimedByCurrentWaiter ? (
                        <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
                          Esta mesa ya fue tomada por {waiterName(assignedWaiterId)}.
                        </p>
                      ) : null}

                      {isClaimedByCurrentWaiter &&
                      table.status === "cooking" &&
                      openTableOrder?.status !== "ready" ? (
                        <p className="rounded-xl border border-sky-500/20 bg-sky-500/10 px-3 py-2 text-[11px] text-sky-200">
                          El pedido sigue en cocina. Puedes marcarlo listo cuando cocina te confirme. Estado actual:{" "}
                          {openTableOrder?.status ?? "cargando"}.
                        </p>
                      ) : null}

                      {actionError && isOpen ? (
                        <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-200">
                          {actionError}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-2 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-[11px] text-slate-400">
                      Selecciona primero qué mesero eres.
                    </p>
                  )}

                  {isClaimedByCurrentWaiter && (
                    <button
                      type="button"
                      onClick={() => {
                        onAssign(String(table.id), null);
                        setOpenTableId(null);
                      }}
                      className="mt-2 flex w-full items-center justify-center rounded-xl border border-rose-500/30 px-3 py-2 text-xs font-medium text-rose-200 transition-colors hover:bg-rose-500/10"
                    >
                      Dejar mesa
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

        <Image
          src={queueRope}
          alt="Fila de espera"
          className="pointer-events-none absolute z-10 h-auto w-[18%] select-none object-contain"
          style={{ top: "65%", left: "11%" }}
        />

        <Image
          src={queueRope}
          alt="Fila de espera"
          className="pointer-events-none absolute z-10 h-auto w-[18%] select-none object-contain"
          style={{ top: "65%", left: "25%" }}
        />

      </div>
    </div>
  );
}
