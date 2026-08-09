"use client";

import { useEffect, useState } from "react";
import {
  ApiError,
  getOrder,
  getOrderDishes,
  type OrderDishResponse,
  type OrderDishStatus,
  type OrderResponse,
} from "@/src/lib/api";

interface MyOrderModalProps {
  tableId: number;
  orderId: string | null;
  onClose: () => void;
}

const POLL_INTERVAL_MS = 3000;

const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: "Recibido",
  analyzing: "Analizando",
  cooking: "En preparación",
  ready: "Listo",
  served: "Servido",
  paid: "Pagado",
};

const DISH_STATUS_LABEL: Record<OrderDishStatus, string> = {
  pending: "Pendiente",
  preparing: "Preparando",
  ready: "Listo",
  delivered: "Entregado",
};

const DISH_STATUS_CLASS: Record<OrderDishStatus, string> = {
  pending: "border-slate-600 bg-slate-800 text-slate-300",
  preparing: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  ready: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  delivered: "border-sky-500/40 bg-sky-500/10 text-sky-300",
};

function remainingMinutes(order: OrderResponse): number | null {
  if (order.estimated_time === null) return null;
  const progress = Math.min(100, Math.max(0, order.progress));
  return Math.max(0, Math.ceil(order.estimated_time * (1 - progress / 100)));
}

export default function MyOrderModal({ tableId, orderId, onClose }: MyOrderModalProps) {
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [dishes, setDishes] = useState<OrderDishResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchOrder() {
      try {
        const [orderResult, dishesResult] = await Promise.all([
          getOrder(orderId as string),
          getOrderDishes({ order_id: orderId as string }),
        ]);
        if (!cancelled) {
          setOrder(orderResult);
          setDishes(dishesResult);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : "No se pudo cargar tu pedido."
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchOrder();
    const intervalId = window.setInterval(fetchOrder, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [orderId]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const progress = order ? Math.min(100, Math.max(0, order.progress)) : 0;
  const remaining = order ? remainingMinutes(order) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-sm rounded-2xl border border-slate-800 bg-[#1e293b] p-6 shadow-2xl shadow-black/40"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
            <path
              d="M6 6l12 12M18 6 6 18"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <span className="rounded-full border border-sky-400/50 bg-sky-950/60 px-2.5 py-1 text-[11px] font-semibold text-sky-300">
            Tu mesa
          </span>
          <h2 className="text-base font-bold text-white">Mesa {tableId}</h2>
        </div>

        {!orderId ? (
          <p className="mt-4 rounded-xl border border-slate-700/60 bg-slate-900/40 px-4 py-3 text-sm text-slate-300">
            Aún no se ha registrado tu pedido. En cuanto tu mesero lo tome, verás
            el progreso aquí.
          </p>
        ) : isLoading ? (
          <p className="mt-4 text-center text-sm text-slate-500">Cargando pedido...</p>
        ) : error ? (
          <p className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
            {error}
          </p>
        ) : order ? (
          <>
            <div className="mt-4 rounded-xl border border-slate-700/60 bg-slate-900/40 px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">
                  {ORDER_STATUS_LABEL[order.status] ?? order.status}
                </p>
                <p className="text-xs text-slate-400">
                  {remaining !== null ? `~${remaining} min` : ""}
                </p>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1 text-right text-[11px] text-slate-500">{progress}%</p>
            </div>

            <div className="mt-4 space-y-2">
              {dishes.map((dish) => (
                <div
                  key={dish.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-700/50 bg-slate-950/40 px-3 py-2"
                >
                  <p className="min-w-0 truncate text-sm text-slate-200">
                    {dish.name}
                    {dish.quantity > 1 ? ` x${dish.quantity}` : ""}
                  </p>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${DISH_STATUS_CLASS[dish.status]}`}
                  >
                    {DISH_STATUS_LABEL[dish.status]}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
