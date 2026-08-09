"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ApiError,
  getOrder,
  getOrderDishes,
  updateOrderDishStatus,
  type OrderDishResponse,
  type OrderDishStatus,
  type OrderResponse,
} from "@/src/lib/api";

const POLL_INTERVAL_MS = 3000;
export const READY_TO_MARK_THRESHOLD = 90;

export function useKitchenOrders() {
  const [preparingDishes, setPreparingDishes] = useState<OrderDishResponse[]>([]);
  const [readyDishes, setReadyDishes] = useState<OrderDishResponse[]>([]);
  const [ordersById, setOrdersById] = useState<Record<string, OrderResponse>>({});
  const [error, setError] = useState<string | null>(null);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchDishes() {
      try {
        const [preparing, ready] = await Promise.all([
          getOrderDishes({ status: "preparing" }),
          getOrderDishes({ status: "ready" }),
        ]);
        if (cancelled) return;
        setPreparingDishes(preparing);
        setReadyDishes(ready);
        setError(null);

        const orderIds = Array.from(
          new Set([...preparing, ...ready].map((dish) => dish.order_id))
        );
        if (orderIds.length > 0) {
          const fetched = await Promise.all(orderIds.map((id) => getOrder(id)));
          if (!cancelled) {
            const next: Record<string, OrderResponse> = {};
            for (const order of fetched) next[order.id] = order;
            setOrdersById(next);
          }
        } else {
          setOrdersById({});
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : "No se pudo cargar la cocina."
          );
        }
      }
    }

    fetchDishes();
    const intervalId = window.setInterval(fetchDishes, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const markDishStatus = useCallback(
    async (dish: OrderDishResponse, nextStatus: OrderDishStatus) => {
      setPendingActionId(dish.id);
      try {
        await updateOrderDishStatus(dish.id, nextStatus);
        if (nextStatus === "ready") {
          setPreparingDishes((prev) => prev.filter((d) => d.id !== dish.id));
          setReadyDishes((prev) => [...prev, { ...dish, status: "ready" }]);
        } else if (nextStatus === "delivered") {
          setReadyDishes((prev) => prev.filter((d) => d.id !== dish.id));
        }
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : "No se pudo actualizar el plato."
        );
      } finally {
        setPendingActionId(null);
      }
    },
    []
  );

  function progressFor(dish: OrderDishResponse): number | null {
    const order = ordersById[dish.order_id];
    return order ? Math.min(100, Math.max(0, order.progress)) : null;
  }

  function remainingMinutesFor(dish: OrderDishResponse): number | null {
    const order = ordersById[dish.order_id];
    if (!order || order.estimated_time === null) return null;
    const progress = Math.min(100, Math.max(0, order.progress));
    const remaining = order.estimated_time * (1 - progress / 100);
    return Math.max(0, Math.ceil(remaining));
  }

  return {
    preparingDishes,
    readyDishes,
    ordersById,
    error,
    pendingActionId,
    markDishStatus,
    progressFor,
    remainingMinutesFor,
  };
}
