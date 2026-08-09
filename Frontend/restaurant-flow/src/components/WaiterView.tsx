"use client";

import { useEffect, useState } from "react";
import PaymentNotification from "@/src/components/PaymentNotification";
import WaiterKitchenOrdersPanel from "@/src/components/WaiterKitchenOrdersPanel";
import WaiterMap from "@/src/components/WaiterMap";
import WaiterOrderModal from "@/src/components/WaiterOrderModal";
import WaiterPanel from "@/src/components/WaiterPanel";
import WaiterSummaryBar from "@/src/components/WaiterSummaryBar";
import {
  usePaymentNotifications,
  type PaymentRequestItem,
} from "@/src/hooks/usePaymentNotifications";
import {
  ApiError,
  applyWaiterTableAction,
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
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(
    null
  );

  const { requests: paymentRequests, dismissRequest: dismissPaymentRequest } =
    usePaymentNotifications();

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

  async function handlePaymentAcknowledge(request: PaymentRequestItem) {
    if (request.tableId === null) {
      dismissPaymentRequest(request.id);
      return;
    }
    if (!currentWaiterId) {
      setError("Selecciona primero qué mesero eres para poder llevar la cuenta.");
      return;
    }

    setProcessingRequestId(request.id);
    try {
      await applyWaiterTableAction(request.tableId, currentWaiterId, "paying");
      dismissPaymentRequest(request.id);
      setError(null);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo actualizar el estado de la mesa."
      );
    } finally {
      setProcessingRequestId(null);
    }
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Full-screen map, base layer */}
      <div className="absolute inset-0">
        <WaiterMap
          waiters={waiters}
          assignments={assignments}
          currentWaiterId={currentWaiterId}
          onTakeOrder={(tableId) => setOrderingTableId(tableId)}
          onAssign={handleAssign}
        />
      </div>

      {/* Floating HUD layer */}
      <div className="pointer-events-none absolute inset-3 z-20 flex flex-col gap-3 lg:flex-row">
        <div className="pointer-events-auto hidden w-80 max-w-[90vw] shrink-0 overflow-hidden rounded-2xl border border-slate-700/60 shadow-2xl shadow-black/40 lg:flex lg:flex-col">
          <WaiterPanel />
        </div>

        <div className="flex flex-1 flex-col justify-between gap-3">
          <div className="hidden justify-end lg:flex">
            <div
              className="pointer-events-auto w-72 shrink-0 sm:w-80"
              style={{ height: "min(65vh, 620px)" }}
            >
              <WaiterKitchenOrdersPanel />
            </div>
          </div>

          <div className="pointer-events-auto overflow-hidden rounded-2xl border border-slate-700/60 shadow-2xl shadow-black/40">
            <WaiterSummaryBar
              waiters={waiters}
              assignments={assignments}
              currentWaiterId={currentWaiterId}
              onCurrentWaiterChange={setCurrentWaiterId}
              error={error}
            />
          </div>
        </div>
      </div>

      {paymentRequests.length > 0 && (
        <div className="pointer-events-none fixed top-4 right-4 z-[9999] flex flex-col items-end gap-2">
          {paymentRequests.map((request) => (
            <PaymentNotification
              key={request.id}
              request={request}
              onAcknowledge={handlePaymentAcknowledge}
              onDismiss={dismissPaymentRequest}
              isProcessing={processingRequestId === request.id}
            />
          ))}
        </div>
      )}

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
