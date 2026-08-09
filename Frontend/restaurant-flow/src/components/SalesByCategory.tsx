import type { SalesByCategoryEntry } from "@/src/lib/api";

const CATEGORY_COLORS = ["#f97316", "#3b82f6", "#22c55e", "#a855f7", "#f43f5e", "#64748b"];

interface SalesByCategoryProps {
  data: SalesByCategoryEntry[];
}

export default function SalesByCategory({ data }: SalesByCategoryProps) {
  const total = data.reduce((sum, entry) => sum + entry.amount, 0);
  const radius = 38;
  const circumference = 2 * Math.PI * radius;

  const slices = data.reduce<{ entry: SalesByCategoryEntry; dash: number; offset: number }[]>(
    (acc, entry) => {
      const dash = total > 0 ? (entry.amount / total) * circumference : 0;
      const previousOffset = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].dash : 0;
      acc.push({ entry, dash, offset: previousOffset });
      return acc;
    },
    []
  );

  return (
    <section className="rounded-xl border border-slate-800 bg-[#12121f] p-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
        Ventas por categoría
      </p>

      {total === 0 ? (
        <div className="flex h-28 items-center justify-center text-xs text-slate-500">
          Sin ventas registradas todavía.
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-4">
          <svg viewBox="0 0 100 100" className="h-24 w-24 shrink-0 -rotate-90">
            {slices.map(({ entry, dash, offset }, index) => (
              <circle
                key={entry.category}
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                strokeWidth="14"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
              />
            ))}
          </svg>
          <div className="space-y-1">
            {data.map((entry, index) => (
              <div key={entry.category} className="flex items-center gap-1.5 text-[11px]">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}
                />
                <span className="text-slate-300">{entry.category}</span>
                <span className="text-slate-500">
                  {Math.round((entry.amount / total) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      <p className="mt-2 text-[11px] text-slate-500">Total: S/. {total.toFixed(2)}</p>
    </section>
  );
}
