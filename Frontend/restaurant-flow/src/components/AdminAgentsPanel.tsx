"use client";

import { useEffect, useState } from "react";
import { ApiError, getDashboard, type AgentActivityResponse } from "@/src/lib/api";

const POLL_INTERVAL_MS = 5000;

const AGENT_META: Record<string, { name: string; icon: string }> = {
  analyzer: { name: "Analizador", icon: "🔍" },
  prioritizer: { name: "Priorizador", icon: "📊" },
  predictor: { name: "Predictor", icon: "⏱️" },
  supervisor: { name: "Supervisor", icon: "👁️" },
};
const AGENT_ORDER = ["analyzer", "prioritizer", "predictor", "supervisor"];

function describeActivity(entry: AgentActivityResponse | undefined): string {
  if (!entry) return "Sin actividad reciente";
  const data = (entry.output_data ?? {}) as Record<string, unknown>;

  switch (entry.action) {
    case "analyze_order":
      return typeof data.complexity === "string"
        ? `Analizó un pedido (complejidad ${data.complexity})`
        : "Analizando pedidos...";
    case "update_eta": {
      const updated = typeof data.orders_updated === "number" ? data.orders_updated : 0;
      return updated > 0
        ? `Actualizó el tiempo de ${updated} pedido${updated === 1 ? "" : "s"}`
        : "Recalculando tiempos...";
    }
    case "prioritize_orders": {
      const priorities = Array.isArray(data.priorities) ? data.priorities.length : 0;
      return priorities > 0
        ? `Priorizó ${priorities} pedido${priorities === 1 ? "" : "s"}`
        : "Reordenando cola...";
    }
    case "operational_alert":
      return typeof data.message === "string" ? data.message : "Detectó una alerta";
    default:
      return entry.action;
  }
}

function timeAgoLabel(iso: string): string {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return "justo ahora";
  if (minutes === 1) return "hace 1 min";
  return `hace ${minutes} min`;
}

// Decorative, stable per-agent sparkline (no real time-series metric exists yet).
function sparklinePoints(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const points: number[] = [];
  let value = 10 + (hash % 8);
  for (let i = 0; i < 12; i += 1) {
    hash = (hash * 1103515245 + 12345) >>> 0;
    value += ((hash % 7) - 3);
    value = Math.max(2, Math.min(18, value));
    points.push(value);
  }
  return points
    .map((v, i) => `${(i / (points.length - 1)) * 100},${20 - v}`)
    .join(" ");
}

export default function AdminAgentsPanel() {
  const [activity, setActivity] = useState<AgentActivityResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchActivity() {
      try {
        const dashboard = await getDashboard();
        if (!cancelled) {
          setActivity(dashboard.agent_activity);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : "No se pudo cargar la actividad de agentes."
          );
        }
      }
    }

    fetchActivity();
    const intervalId = window.setInterval(fetchActivity, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-800 bg-[#12121f] p-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-400">
        Agentes IA activos
      </p>

      {error && (
        <p className="mt-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1.5 text-[11px] text-rose-200">
          {error}
        </p>
      )}

      <div className="mt-3 flex-1 space-y-3 overflow-y-auto">
        {AGENT_ORDER.map((agentName) => {
          const latest = activity.find((entry) => entry.agent_name === agentName);
          const meta = AGENT_META[agentName];
          const isAlert = latest?.action === "operational_alert";

          return (
            <div key={agentName} className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-base">
                {meta.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-semibold ${isAlert ? "text-amber-400" : "text-emerald-400"}`}
                >
                  {meta.name}
                </p>
                <p className="truncate text-[11px] text-slate-400">
                  {describeActivity(latest)}
                </p>
                {latest && (
                  <p className="text-[10px] text-slate-600">{timeAgoLabel(latest.created_at)}</p>
                )}
              </div>
              <svg viewBox="0 0 100 20" className="h-5 w-14 shrink-0">
                <polyline
                  points={sparklinePoints(agentName)}
                  fill="none"
                  stroke={isAlert ? "#f59e0b" : "#22c55e"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          );
        })}
      </div>
    </div>
  );
}
