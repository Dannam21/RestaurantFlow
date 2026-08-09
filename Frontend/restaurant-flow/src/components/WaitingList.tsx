"use client";

import Image from "next/image";
import persona1 from "@/assets/personas/persona1.png";
import persona2 from "@/assets/personas/persona2.png";
import persona3 from "@/assets/personas/persona3.png";
import persona4 from "@/assets/personas/persona4.png";
import persona5 from "@/assets/personas/persona5.png";
import type { WaitlistEntryResponse } from "@/src/lib/api";

const PERSONA_SPRITES = [persona1, persona2, persona3, persona4, persona5];

interface WaitingListProps {
  isAuthenticated: boolean;
  activeCount: number;
  myEntry: WaitlistEntryResponse | null;
  isLeaving?: boolean;
  onJoinClick: () => void;
  onLeave: () => void;
}

function minutesLeft(entry: WaitlistEntryResponse): number | null {
  if (entry.quoted_wait_minutes === null) return null;
  const elapsed = (Date.now() - new Date(entry.created_at).getTime()) / 60000;
  return Math.max(0, Math.round(entry.quoted_wait_minutes - elapsed));
}

export default function WaitingList({
  isAuthenticated,
  activeCount,
  myEntry,
  isLeaving = false,
  onJoinClick,
  onLeave,
}: WaitingListProps) {
  const visibleAvatars = PERSONA_SPRITES.slice(0, Math.min(activeCount, PERSONA_SPRITES.length));
  const extraCount = Math.max(0, activeCount - PERSONA_SPRITES.length);

  return (
    <div
      className="absolute z-20 flex items-end gap-3"
      style={{ top: "60%", left: "9%" }}
    >
      <div className="w-40 rounded-md border border-amber-900/60 bg-slate-900/85 p-2.5 shadow-lg shadow-black/40 backdrop-blur-sm">
        <div className="flex items-center gap-1.5 text-amber-400">
          <span className="text-sm">👥</span>
          <span className="text-[11px] font-semibold uppercase tracking-wide">
            Fila de espera
          </span>
        </div>

        {myEntry ? (
          <>
            <p className="mt-1.5 text-xs font-medium text-white">
              {myEntry.party_size}{" "}
              {myEntry.party_size === 1 ? "persona" : "personas"} · Tú
            </p>
            {myEntry.status === "notified" ? (
              <p className="mt-1 text-[11px] font-medium text-emerald-300">
                ¡Te están buscando! Acércate a recepción.
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-slate-400">
                Tiempo estimado
                <br />
                <span className="text-amber-300">
                  ~{minutesLeft(myEntry) ?? "?"} min
                </span>
              </p>
            )}

            <button
              type="button"
              onClick={onLeave}
              disabled={isLeaving}
              className="pointer-events-auto mt-2 w-full rounded-lg border border-rose-500/40 bg-rose-500/10 py-1.5 text-xs font-semibold text-rose-200 transition-colors hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLeaving ? "Saliendo..." : "Salir de la fila"}
            </button>
          </>
        ) : (
          <>
            {activeCount === 0 ? (
              <p className="mt-1.5 text-xs text-slate-400">
                Nadie está esperando todavía.
              </p>
            ) : (
              <p className="mt-1.5 text-xs font-medium text-white">
                {activeCount} {activeCount === 1 ? "persona esperando" : "personas esperando"}
              </p>
            )}

            <button
              type="button"
              onClick={onJoinClick}
              className="pointer-events-auto mt-2 w-full rounded-lg bg-blue-600 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-500"
            >
              {isAuthenticated ? "Unirme a la fila" : "Inicia sesión para unirte"}
            </button>
          </>
        )}
      </div>

      {activeCount > 0 && (
        <div className="relative flex items-end gap-2 px-2 pb-2">
          <div className="absolute inset-x-0 top-3 h-0.5 rounded-full bg-red-600/70" />
          {visibleAvatars.map((sprite, index) => (
            <Image
              key={index}
              src={sprite}
              alt="Persona esperando en la fila"
              className="animate-bob-y h-auto w-8 select-none object-contain drop-shadow-md sm:w-10"
              style={{ animationDelay: `${index * 0.25}s` }}
            />
          ))}
          {extraCount > 0 && (
            <span className="mb-1 text-xs font-semibold text-amber-200">
              +{extraCount}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
