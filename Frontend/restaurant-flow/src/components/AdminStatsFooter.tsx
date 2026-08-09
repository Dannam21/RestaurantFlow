"use client";

import { useEffect, useState } from "react";
import { ApiError, getDashboard, type AgentActivityResponse, type OrderResponse } from "@/src/lib/api";

const POLL_INTERVAL_MS = 8000;

// Illustrative placeholders: the backend deliberately returns null for these
// (no financial ledger / feedback model exists yet) — shown as static demo
// values here purely for visual fidelity to the reference design.
const DEMO_REVENUE = "$2,450";
const DEMO_SATISFACTION = "4.8 / 5";

const ALERT_SEVERITY_STYLE: Record<string, { icon: string; className: string }> = {
  critical: { icon: "🔴", className: "border-rose-500/30 bg-rose-500/10 text-rose-200" },
  warning: { icon: "🟠", className: "border-amber-500/30 bg-amber-500/10 text-amber-200" },
  info: { icon: "🟢", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" },
};

const STATUS_BUCKETS: { key: string; label: string; color: string; statuses: string[] }[] = [
  { key: "cooking", label: "Cocinando", color: "#3b82f6", statuses: ["cooking"] },
  { key: "ready", label: "Listas", color: "#f97316", statuses: ["ready"] },
  { key: "waiting", label: "Esperando", color: "#a855f7", statuses: ["pending", "analyzing"] },
  { key: "done", label: "Completadas", color: "#22c55e", statuses: ["served", "paid"] },
];

function timeAgoLabel(iso: string): string {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return "justo ahora";
  if (minutes === 1) return "hace 1 min";
  return `hace ${minutes} min`;
}

function DonutChart({ orders }: { orders: OrderResponse[] }) {
  const total = orders.length;
  const counts = STATUS_BUCKETS.map((bucket) => ({
    ...bucket,
    count: orders.filter((order) => bucket.statuses.includes(order.status)).length,
  }));

  if (total === 0) {
    return (
      <div className="flex h-28 items-center justify-center text-xs text-slate-500">
        Sin órdenes registradas todavía.
      </div>
    );
  }

  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="h-24 w-24 shrink-0 -rotate-90">
        {counts.map((bucket) => {
          if (bucket.count === 0) return null;
          const dash = (bucket.count / total) * circumference;
          const circle = (
            <circle
              key={bucket.key}
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={bucket.color}
              strokeWidth="14"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
            />
          );
          offset += dash;
          return circle;
        })}
      </svg>
      <div className="space-y-1">
        {counts.map((bucket) => (
          <div key={bucket.key} className="flex items-center gap-1.5 text-[11px]">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: bucket.color }} />
            <span className="text-slate-300">{bucket.label}</span>
            <span className="text-slate-500">
              {bucket.count} ({total > 0 ? Math.round((bucket.count / total) * 100) : 0}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrendChart({ orders }: { orders: OrderResponse[] }) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const todaysOrders = orders.filter(
    (order) => new Date(order.created_at).getTime() >= startOfToday.getTime()
  );

  if (todaysOrders.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center text-xs text-slate-500">
        Aún no hay órdenes hoy.
      </div>
    );
  }

  const currentHour = new Date().getHours();
  const hours = Array.from({ length: currentHour + 1 }, (_, hour) => hour);
  let cumulative = 0;
  const points = hours.map((hour) => {
    cumulative += todaysOrders.filter(
      (order) => new Date(order.created_at).getHours() === hour
    ).length;
    return cumulative;
  });

  const max = Math.max(...points, 1);
  const coords = points
    .map((value, index) => {
      const x = hours.length > 1 ? (index / (hours.length - 1)) * 100 : 0;
      const y = 32 - (value / max) * 30;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div>
      <svg viewBox="0 0 100 32" className="h-20 w-full" preserveAspectRatio="none">
        <polyline points={coords} fill="none" stroke="#8b5cf6" strokeWidth="1.5" />
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-slate-500">
        <span>12 a.m.</span>
        <span>{currentHour}:00</span>
      </div>
    </div>
  );
}

export default function AdminStatsFooter() {
  const [stats, setStats] = useState<{
    total_orders: number;
    completed_orders: number;
    average_order_time_minutes: number;
  } | null>(null);
  const [alerts, setAlerts] = useState<AgentActivityResponse[]>([]);
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchDashboard() {
      try {
        const dashboard = await getDashboard();
        if (!cancelled) {
          setStats(dashboard.stats);
          setAlerts(dashboard.alerts.slice(0, 3));
          setOrders(dashboard.orders);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "No se pudieron cargar las estadísticas.");
        }
      }
    }

    fetchDashboard();
    const intervalId = window.setInterval(fetchDashboard, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="grid shrink-0 grid-cols-1 gap-3 border-t border-slate-800 bg-[#0b0b16] p-3 lg:grid-cols-4">
      <section className="rounded-xl border border-slate-800 bg-[#12121f] p-3">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
          Estadísticas en vivo
        </p>
        {error && <p className="mt-2 text-[11px] text-rose-300">{error}</p>}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Total órdenes</p>
            <p className="text-lg font-bold text-white">{stats?.total_orders ?? "—"}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Completadas</p>
            <p className="text-lg font-bold text-white">{stats?.completed_orders ?? "—"}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Tiempo promedio</p>
            <p className="text-lg font-bold text-white">
              {stats ? `${Math.round(stats.average_order_time_minutes)} min` : "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Ingresos</p>
            <p className="text-lg font-bold text-white">{DEMO_REVENUE}</p>
          </div>
        </div>
        <div className="mt-2">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Satisfacción</p>
          <p className="text-sm font-semibold text-amber-300">{DEMO_SATISFACTION}</p>
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-[#12121f] p-3">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">Alertas</p>
        <div className="mt-3 space-y-2">
          {alerts.length === 0 ? (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-2 text-[11px] text-emerald-200">
              🟢 Cocina operando normal
            </div>
          ) : (
            alerts.map((alert) => {
              const data = (alert.output_data ?? {}) as Record<string, unknown>;
              const severity = typeof data.severity === "string" ? data.severity : "info";
              const style = ALERT_SEVERITY_STYLE[severity] ?? ALERT_SEVERITY_STYLE.info;
              return (
                <div
                  key={alert.id}
                  className={`rounded-lg border px-2.5 py-2 text-[11px] ${style.className}`}
                >
                  <div className="flex items-center gap-1.5 font-semibold">
                    <span>{style.icon}</span>
                    <span>{typeof data.message === "string" ? data.message : alert.action}</span>
                  </div>
                  <p className="mt-0.5 text-[10px] opacity-70">{timeAgoLabel(alert.created_at)}</p>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-[#12121f] p-3">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
          Órdenes por estado
        </p>
        <div className="mt-3">
          <DonutChart orders={orders} />
        </div>
        <p className="mt-2 text-[11px] text-slate-500">Total: {orders.length} órdenes</p>
      </section>

      <section className="rounded-xl border border-slate-800 bg-[#12121f] p-3">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
          Tendencia de órdenes
        </p>
        <div className="mt-3">
          <TrendChart orders={orders} />
        </div>
      </section>
    </div>
  );
}
