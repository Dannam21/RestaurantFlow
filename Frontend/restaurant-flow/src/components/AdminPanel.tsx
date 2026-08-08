"use client";

const KPI_CARDS = [
  { label: "Ocupacion", value: "83%", detail: "15 de 18 asientos usados" },
  { label: "Espera media", value: "12 min", detail: "Bajo 3 min vs ayer" },
  { label: "Tickets abiertos", value: "8", detail: "3 con prioridad alta" },
];

const STAFF = [
  { name: "Lucia", role: "Mesera", status: "Atendiendo 4 mesas" },
  { name: "Mateo", role: "Mesero", status: "Llevando pedidos a cocina" },
  { name: "Camila", role: "Caja", status: "2 pagos pendientes" },
  { name: "Diego", role: "Chef", status: "5 ordenes activas" },
];

const INCIDENTS = [
  "Mesa 3 reporto demora en la cuenta",
  "Stock bajo de limonada y pasta",
  "Fila exterior supera 10 minutos",
];

export default function AdminPanel() {
  return (
    <aside className="flex h-full w-full flex-col border-r border-slate-700/60 bg-[#1e293b]">
      <div className="border-b border-slate-700/60 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-fuchsia-300/80">
          Vista admin
        </p>
        <h2 className="mt-1 text-lg font-semibold text-slate-100">
          Control operativo
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Monitorea ocupacion, equipo y puntos de atencion del servicio.
        </p>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
        <section className="space-y-3">
          {KPI_CARDS.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-slate-700/60 bg-slate-900/45 p-4"
            >
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                {card.label}
              </p>
              <div className="mt-2 flex items-end justify-between gap-3">
                <p className="text-2xl font-semibold text-white">{card.value}</p>
                <p className="text-right text-xs text-slate-400">{card.detail}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-slate-700/60 bg-slate-900/40 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">
              Equipo en turno
            </h3>
            <span className="rounded-full bg-fuchsia-500/10 px-2.5 py-1 text-[11px] font-medium text-fuchsia-300 ring-1 ring-fuchsia-500/20">
              6 personas
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {STAFF.map((member) => (
              <div
                key={member.name}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-700/50 bg-slate-950/35 px-3 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-white">
                    {member.name}
                  </p>
                  <p className="text-xs text-slate-400">{member.role}</p>
                </div>
                <p className="max-w-[10rem] text-right text-xs text-slate-300">
                  {member.status}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-700/60 bg-slate-900/40 p-4">
          <h3 className="text-sm font-semibold text-slate-200">
            Incidencias a revisar
          </h3>
          <div className="mt-3 space-y-2">
            {INCIDENTS.map((incident) => (
              <div
                key={incident}
                className="rounded-xl border border-rose-500/15 bg-rose-500/8 px-3 py-2 text-sm text-rose-100"
              >
                {incident}
              </div>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}
