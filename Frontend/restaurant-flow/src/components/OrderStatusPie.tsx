const STATUS_META: Record<string, { label: string; color: string }> = {
  pending: { label: "Nuevas", color: "#3b82f6" },
  analyzing: { label: "Analizando", color: "#0ea5e9" },
  cooking: { label: "En cocina", color: "#f97316" },
  ready: { label: "Listas", color: "#22c55e" },
  served: { label: "Servidas", color: "#a855f7" },
  paid: { label: "Entregadas", color: "#64748b" },
};

interface OrderStatusPieProps {
  data: Record<string, number>;
}

export default function OrderStatusPie({ data }: OrderStatusPieProps) {
  const entries = Object.entries(data).filter(([, count]) => count > 0);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  const radius = 38;
  const circumference = 2 * Math.PI * radius;

  const slices = entries.reduce<{ status: string; count: number; dash: number; offset: number }[]>(
    (acc, [status, count]) => {
      const dash = total > 0 ? (count / total) * circumference : 0;
      const previousOffset = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].dash : 0;
      acc.push({ status, count, dash, offset: previousOffset });
      return acc;
    },
    []
  );

  return (
    <section className="rounded-xl border border-slate-800 bg-[#12121f] p-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
        Órdenes por estado
      </p>

      {total === 0 ? (
        <div className="flex h-28 items-center justify-center text-xs text-slate-500">
          Sin órdenes registradas.
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-4">
          <svg viewBox="0 0 100 100" className="h-24 w-24 shrink-0 -rotate-90">
            {slices.map(({ status, dash, offset }) => {
              const meta = STATUS_META[status] ?? { label: status, color: "#64748b" };
              return (
                <circle
                  key={status}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke={meta.color}
                  strokeWidth="14"
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-offset}
                />
              );
            })}
          </svg>
          <div className="space-y-1">
            {entries.map(([status, count]) => {
              const meta = STATUS_META[status] ?? { label: status, color: "#64748b" };
              return (
                <div key={status} className="flex items-center gap-1.5 text-[11px]">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.color }} />
                  <span className="text-slate-300">{meta.label}</span>
                  <span className="text-slate-500">
                    {count} ({Math.round((count / total) * 100)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <p className="mt-2 text-[11px] text-slate-500">Total: {total} órdenes</p>
    </section>
  );
}
