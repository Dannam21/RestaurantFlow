// Static demo data — there is no turnover/occupancy-history tracking in the
// backend (Table only stores current status + updated_at, no audit trail of
// past seatings), so this whole panel is hardcoded rather than computed.
const DEMO_ROTATION = {
  mostRotated: { table: 8, times: 4.2 },
  longestOccupied: { table: 3, duration: "2h 45m" },
  shortestOccupied: { table: 11, duration: "45m" },
};

export default function TableRotation() {
  return (
    <section className="rounded-xl border border-slate-800 bg-[#12121f] p-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
        Rotación de mesas
      </p>

      <div className="mt-3 space-y-2.5">
        <div className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2">
          <span className="text-[11px] text-emerald-200">🔄 Mesa con más rotación</span>
          <span className="text-xs font-semibold text-white">
            Mesa {DEMO_ROTATION.mostRotated.table} · {DEMO_ROTATION.mostRotated.times}x
          </span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2">
          <span className="text-[11px] text-amber-200">⏳ Mayor tiempo ocupada</span>
          <span className="text-xs font-semibold text-white">
            Mesa {DEMO_ROTATION.longestOccupied.table} · {DEMO_ROTATION.longestOccupied.duration}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-sky-500/20 bg-sky-500/10 px-3 py-2">
          <span className="text-[11px] text-sky-200">⚡ Menor tiempo ocupada</span>
          <span className="text-xs font-semibold text-white">
            Mesa {DEMO_ROTATION.shortestOccupied.table} · {DEMO_ROTATION.shortestOccupied.duration}
          </span>
        </div>
      </div>
    </section>
  );
}
