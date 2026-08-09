"use client";

import { useState } from "react";
import type { AgentActivityResponse } from "@/src/lib/api";

interface AlertsPanelProps {
  alerts: AgentActivityResponse[];
}

const SEVERITY_STYLE: Record<string, { icon: string; className: string }> = {
  critical: { icon: "🔴", className: "border-rose-500/30 bg-rose-500/10 text-rose-200" },
  warning: { icon: "🟠", className: "border-amber-500/30 bg-amber-500/10 text-amber-200" },
  info: { icon: "🟡", className: "border-sky-500/30 bg-sky-500/10 text-sky-200" },
};

function timeAgoLabel(iso: string): string {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return "justo ahora";
  if (minutes === 1) return "hace 1 min";
  return `hace ${minutes} min`;
}

export default function AlertsPanel({ alerts }: AlertsPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <section className="flex h-full flex-col rounded-xl border border-slate-800 bg-[#12121f] p-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
        Alertas en vivo
      </p>

      {alerts.length === 0 ? (
        <div className="mt-3 flex flex-1 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-4 text-xs text-emerald-200">
          🟢 Todo en orden, sin alertas activas
        </div>
      ) : (
        <div className="mt-3 space-y-2 overflow-y-auto">
          {alerts.map((alert) => {
            const data = (alert.output_data ?? {}) as Record<string, unknown>;
            const severity = typeof data.severity === "string" ? data.severity : "info";
            const style = SEVERITY_STYLE[severity] ?? SEVERITY_STYLE.info;
            const message = typeof data.message === "string" ? data.message : alert.action;
            const isExpanded = expandedId === alert.id;

            return (
              <button
                key={alert.id}
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                className={`w-full rounded-lg border px-3 py-2 text-left text-[11px] transition-colors ${style.className}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="flex items-start gap-1.5 font-semibold">
                    <span>{style.icon}</span>
                    <span>{message}</span>
                  </span>
                  <span className="shrink-0 opacity-60">{timeAgoLabel(alert.created_at)}</span>
                </div>
                {isExpanded && (
                  <div className="mt-1.5 space-y-0.5 border-t border-white/10 pt-1.5 opacity-80">
                    {typeof data.table_id !== "undefined" && data.table_id !== null && (
                      <p>Mesa: {String(data.table_id)}</p>
                    )}
                    {typeof data.order_id === "string" && (
                      <p>Pedido: #{data.order_id.slice(0, 8)}</p>
                    )}
                    {typeof data.alert_type === "string" && <p>Tipo: {data.alert_type}</p>}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
