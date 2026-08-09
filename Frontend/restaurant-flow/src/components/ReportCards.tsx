import type { StatsResponse } from "@/src/lib/api";

// Satisfaction and every "vs. ayer" delta below are static demo values —
// there is no ratings table and no daily-snapshot history in the backend to
// compute these for real (same reasoning as AdminStatsFooter's DEMO_REVENUE).
// Every other field on this card row is a live number from GET /api/stats.
const DEMO_SATISFACTION = 4.8;
const DEMO_DELTAS = {
  revenue: "+12% vs ayer",
  orders: "+14% vs ayer",
  ticket: "+5% vs ayer",
  cookingTime: "-2:15 vs ayer",
  satisfaction: "+0.3 vs ayer",
};

interface ReportCardsProps {
  stats: StatsResponse | null;
}

function formatCurrency(value: number) {
  return `S/. ${value.toFixed(2)}`;
}

function formatMinutes(value: number) {
  const minutes = Math.floor(value);
  const seconds = Math.round((value - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")} min`;
}

const CARD_STYLE =
  "rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm flex flex-col gap-1";

export default function ReportCards({ stats }: ReportCardsProps) {
  const occupancyPct = stats && stats.tables_total > 0
    ? Math.round((stats.tables_occupied / stats.tables_total) * 100)
    : 0;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      <div className={`${CARD_STYLE} border-orange-500/30 bg-orange-500/10`}>
        <span className="text-xl">💰</span>
        <p className="text-lg font-bold text-white">
          {stats ? formatCurrency(stats.revenue_today ?? 0) : "—"}
        </p>
        <p className="text-[11px] text-orange-200/80">Ventas totales</p>
        <p className="text-[10px] font-semibold text-emerald-400">{DEMO_DELTAS.revenue}</p>
      </div>

      <div className={`${CARD_STYLE} border-sky-500/30 bg-sky-500/10`}>
        <span className="text-xl">🧾</span>
        <p className="text-lg font-bold text-white">{stats ? stats.total_orders : "—"}</p>
        <p className="text-[11px] text-sky-200/80">Órdenes totales</p>
        <p className="text-[10px] font-semibold text-emerald-400">{DEMO_DELTAS.orders}</p>
      </div>

      <div className={`${CARD_STYLE} border-violet-500/30 bg-violet-500/10`}>
        <span className="text-xl">🎟️</span>
        <p className="text-lg font-bold text-white">
          {stats ? formatCurrency(stats.avg_ticket_today ?? 0) : "—"}
        </p>
        <p className="text-[11px] text-violet-200/80">Ticket promedio</p>
        <p className="text-[10px] font-semibold text-emerald-400">{DEMO_DELTAS.ticket}</p>
      </div>

      <div className={`${CARD_STYLE} border-amber-500/30 bg-amber-500/10`}>
        <span className="text-xl">⏱️</span>
        <p className="text-lg font-bold text-white">
          {stats ? formatMinutes(stats.average_order_time_minutes) : "—"}
        </p>
        <p className="text-[11px] text-amber-200/80">Tiempo prom. cocina</p>
        <p className="text-[10px] font-semibold text-emerald-400">{DEMO_DELTAS.cookingTime}</p>
      </div>

      <div className={`${CARD_STYLE} border-rose-500/30 bg-rose-500/10`}>
        <span className="text-xl">⭐</span>
        <p className="text-lg font-bold text-white">{DEMO_SATISFACTION} / 5</p>
        <p className="text-[11px] text-rose-200/80">Satisfacción</p>
        <p className="text-[10px] font-semibold text-emerald-400">{DEMO_DELTAS.satisfaction}</p>
      </div>

      <div className={`${CARD_STYLE} border-emerald-500/30 bg-emerald-500/10`}>
        <span className="text-xl">🍽️</span>
        <p className="text-lg font-bold text-white">
          {stats ? `${stats.tables_occupied} / ${stats.tables_total}` : "—"}
        </p>
        <p className="text-[11px] text-emerald-200/80">Mesas ocupadas</p>
        <p className="text-[10px] font-semibold text-slate-400">{occupancyPct}% ocupación</p>
      </div>
    </div>
  );
}
