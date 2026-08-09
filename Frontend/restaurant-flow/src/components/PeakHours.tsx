import type { PeakHourEntry } from "@/src/lib/api";

interface PeakHoursProps {
  data: PeakHourEntry[];
}

export default function PeakHours({ data }: PeakHoursProps) {
  const max = Math.max(...data.map((entry) => entry.orders), 1);

  return (
    <section className="rounded-xl border border-slate-800 bg-[#12121f] p-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
        Horas pico
      </p>

      {data.length === 0 ? (
        <div className="flex h-24 items-center justify-center text-xs text-slate-500">
          Sin órdenes registradas hoy todavía.
        </div>
      ) : (
        <div className="mt-3 flex items-end gap-1.5 overflow-x-auto pb-1">
          {data.map((entry) => (
            <div key={entry.hour} className="flex shrink-0 flex-col items-center gap-1">
              <span className="text-sm">👨‍🍳</span>
              <div className="flex h-16 w-6 items-end overflow-hidden rounded-t bg-slate-800">
                <div
                  className="w-full rounded-t bg-gradient-to-t from-orange-600 to-amber-400"
                  style={{ height: `${(entry.orders / max) * 100}%` }}
                />
              </div>
              <span className="text-[10px] font-semibold text-white">{entry.orders}</span>
              <span className="whitespace-nowrap text-[9px] text-slate-500">{entry.hour}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
