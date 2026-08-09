"use client";

import { useEffect, useState } from "react";
import {
  ApiError,
  getCookingTimeByHour,
  getDashboard,
  getOrdersByStatus,
  getPeakHours,
  getSalesByCategory,
  getSalesByHour,
  getTopDishes,
  type AgentActivityResponse,
  type CookingTimeEntry,
  type PeakHourEntry,
  type SalesByCategoryEntry,
  type SalesByHourEntry,
  type StatsResponse,
  type TopDishEntry,
} from "@/src/lib/api";

const POLL_INTERVAL_MS = 3000;

export function useReportsData() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [alerts, setAlerts] = useState<AgentActivityResponse[]>([]);
  const [salesByHour, setSalesByHour] = useState<SalesByHourEntry[]>([]);
  const [cookingTimeByHour, setCookingTimeByHour] = useState<CookingTimeEntry[]>([]);
  const [ordersByStatus, setOrdersByStatus] = useState<Record<string, number>>({});
  const [topDishes, setTopDishes] = useState<TopDishEntry[]>([]);
  const [salesByCategory, setSalesByCategory] = useState<SalesByCategoryEntry[]>([]);
  const [peakHours, setPeakHours] = useState<PeakHourEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      try {
        const [
          dashboard,
          sales,
          cookingTime,
          statusCounts,
          dishes,
          categories,
          hours,
        ] = await Promise.all([
          getDashboard(),
          getSalesByHour(),
          getCookingTimeByHour(),
          getOrdersByStatus(),
          getTopDishes(),
          getSalesByCategory(),
          getPeakHours(),
        ]);
        if (cancelled) return;

        setStats(dashboard.stats);
        setAlerts(dashboard.alerts);
        setSalesByHour(sales);
        setCookingTimeByHour(cookingTime);
        setOrdersByStatus(statusCounts);
        setTopDishes(dishes);
        setSalesByCategory(categories);
        setPeakHours(hours);
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : "No se pudieron cargar los reportes."
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchAll();
    const intervalId = window.setInterval(fetchAll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  return {
    stats,
    alerts,
    salesByHour,
    cookingTimeByHour,
    ordersByStatus,
    topDishes,
    salesByCategory,
    peakHours,
    error,
    isLoading,
  };
}
