"use client";

import { useTables } from "@/src/hooks/useTables";
import { minutesSince } from "@/src/lib/tableLayout";

export default function AdminPaymentRequestsPanel() {
  const { tables } = useTables();
  const payingTables = tables.filter((table) => table.status === "paying");

  return (
    <section className="rounded-xl border border-slate-800 bg-[#12121f] p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
          Pagos Pendientes
        </p>
        {payingTables.length > 0 && (
          <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[11px] font-semibold text-orange-300 ring-1 ring-orange-500/20">
            {payingTables.length}
          </span>
        )}
      </div>

      <div className="mt-3 space-y-2">
        {payingTables.length === 0 ? (
          <p className="px-1 py-4 text-center text-xs text-slate-500">
            No hay solicitudes de pago pendientes.
          </p>
        ) : (
          payingTables.map((table) => (
            <div
              key={table.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-xs text-orange-100"
            >
              <span className="font-semibold">Mesa {table.id}</span>
              <span className="text-orange-300/80">
                Solicitud hace {minutesSince(table.updated_at)} min
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
