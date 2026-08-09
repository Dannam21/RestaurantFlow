"use client";

import { useEffect, useState } from "react";
import {
  ApiError,
  getCustomerReservations,
  type ReservationTrackingResponse,
} from "@/src/lib/api";

interface ReservationHistoryModalProps {
  customerId: string;
  customerName: string;
  onClose: () => void;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function ReservationHistoryModal({
  customerId,
  customerName,
  onClose,
}: ReservationHistoryModalProps) {
  const [reservations, setReservations] = useState<ReservationTrackingResponse[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadReservations() {
      setIsLoading(true);
      try {
        const result = await getCustomerReservations(customerId);
        if (cancelled) return;
        setReservations(result);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof ApiError
            ? err.message
            : "No se pudieron cargar tus reservas."
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadReservations();
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-800 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-white">Mis reservas</h2>
            <p className="text-sm text-slate-400">{customerName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            aria-label="Cerrar historial de reservas"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[70vh] space-y-3 overflow-y-auto px-6 py-5">
          {isLoading ? (
            <p className="text-sm text-slate-300">Cargando reservas...</p>
          ) : error ? (
            <p className="rounded-2xl border border-rose-500/30 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
              {error}
            </p>
          ) : reservations.length === 0 ? (
            <p className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
              Aún no tienes reservas registradas.
            </p>
          ) : (
            reservations.map((reservation) => (
              <article
                key={reservation.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Mesa {reservation.table_id}
                    </p>
                    <p className="text-xs text-slate-400">
                      {reservation.party_size} persona
                      {reservation.party_size === 1 ? "" : "s"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      reservation.status === "reserved"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-slate-700/70 text-slate-200"
                    }`}
                  >
                    {reservation.status === "reserved" ? "Activa" : "Finalizada"}
                  </span>
                </div>

                <div className="mt-3 grid gap-2 text-xs text-slate-300 sm:grid-cols-2">
                  <p>Reservada: {formatDateTime(reservation.reserved_at)}</p>
                  <p>
                    Liberada:{" "}
                    {reservation.released_at
                      ? formatDateTime(reservation.released_at)
                      : "Aún activa"}
                  </p>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
