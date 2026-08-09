"use client";

import { useEffect, useState } from "react";
import WaiterMap from "@/src/components/WaiterMap";
import WaiterOrderModal from "@/src/components/WaiterOrderModal";
import WaiterPanel from "@/src/components/WaiterPanel";
import WaiterSummaryBar from "@/src/components/WaiterSummaryBar";
import {
  ApiError,
  assignServiceSessionWaiter,
  getServiceSessions,
  getStaff,
} from "@/src/lib/api";
import type { AvailableWaiter } from "@/src/types";

const CURRENT_WAITER_STORAGE_KEY = "restaurant-flow-current-waiter";

export default function WaiterView() {
  const [waiters, setWaiters] = useState<AvailableWaiter[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [currentWaiterId, setCurrentWaiterId] = useState<string | null>(null);
  const [orderingTableId, setOrderingTableId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadWaiterState() {
      try {
        const [staffUsers, activeSessions] = await Promise.all([
          getStaff({ role: "waiter" }),
          getServiceSessions({ active_only: true }),
        ]);
        if (cancelled) return;

        const nextWaiters: AvailableWaiter[] = staffUsers.map((user) => ({
          id: user.id,
          name: user.name,
          online: true,
        }));
        setWaiters(nextWaiters);

        const nextAssignments = activeSessions.reduce<Record<string, string>>(
          (acc, session) => {
            if (session.waiter_id) {
              acc[String(session.table_id)] = session.waiter_id;
            }
            return acc;
          },
          {}
        );
        setAssignments(nextAssignments);

        const savedWaiterId =
          typeof window !== "undefined"
            ? window.localStorage.getItem(CURRENT_WAITER_STORAGE_KEY)
            : null;
        const savedWaiterExists = nextWaiters.some(
          (waiter) => waiter.id === savedWaiterId
        );
        const fallbackWaiterId = nextWaiters[0]?.id ?? null;
        setCurrentWaiterId(savedWaiterExists ? savedWaiterId : fallbackWaiterId);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof ApiError
            ? err.status === 404
              ? "El backend no tiene cargadas las rutas de meseros. Reinicia el servidor FastAPI."
              : err.message
            : "No se pudo sincronizar la vista del mesero."
        );
      }
    }

    loadWaiterState();
    const intervalId = window.setInterval(loadWaiterState, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !currentWaiterId) return;
    window.localStorage.setItem(CURRENT_WAITER_STORAGE_KEY, currentWaiterId);
  }, [currentWaiterId]);

  async function handleAssign(tableId: string, waiterId: string | null) {
    try {
      const updatedSession = await assignServiceSessionWaiter(Number(tableId), waiterId);
      setAssignments((prev) => {
        const next = { ...prev };
        if (updatedSession.waiter_id) {
          next[tableId] = updatedSession.waiter_id;
        } else {
          delete next[tableId];
        }
        return next;
      });
      setError(null);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.status === 404
            ? "La ruta de asignacion de meseros no esta disponible en el backend actual."
            : err.message
          : "No se pudo guardar la asignacion del mesero."
      );
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="h-72 w-full shrink-0 md:h-full md:w-1/4 md:min-w-[320px]">
          <WaiterPanel />
        </div>
        <div className="h-full min-h-0 flex-1">
          <WaiterMap
            waiters={waiters}
            assignments={assignments}
            currentWaiterId={currentWaiterId}
            onTakeOrder={(tableId) => setOrderingTableId(tableId)}
            onAssign={handleAssign}
          />
        </div>
      </div>

      <WaiterSummaryBar
        waiters={waiters}
        assignments={assignments}
        currentWaiterId={currentWaiterId}
        onCurrentWaiterChange={setCurrentWaiterId}
        error={error}
      />

      {orderingTableId !== null ? (
        <WaiterOrderModal
          tableId={orderingTableId}
          onClose={() => setOrderingTableId(null)}
          onSubmitted={() => setOrderingTableId(null)}
        />
      ) : null}
    </div>
  );
}
