"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ApiError,
  getOrderDishes,
  updateOrderDishStatus,
  type OrderDishResponse,
  type OrderDishStatus,
} from "@/src/lib/api";

const POLL_INTERVAL_MS = 3000;
export const READY_TO_MARK_THRESHOLD = 90;

export function useKitchenOrders() {
  const [preparingDishes, setPreparingDishes] = useState<OrderDishResponse[]>([]);
  const [readyDishes, setReadyDishes] = useState<OrderDishResponse[]>([]);
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
    return Math.min(100, Math.max(0, dish.progress));
  }

  function remainingMinutesFor(dish: OrderDishResponse): number | null {
    const progress = Math.min(100, Math.max(0, dish.progress));
    const remaining = dish.estimated_time * (1 - progress / 100);
    return Math.max(0, Math.ceil(remaining));
  }

  return {
    preparingDishes,
    readyDishes,
    error,
    pendingActionId,
    markDishStatus,
    progressFor,
    remainingMinutesFor,
  };
}
