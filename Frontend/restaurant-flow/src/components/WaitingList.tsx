"use client";

import Image from "next/image";
import waitingSign from "@/assets/place/filacartel.png";
import persona1 from "@/assets/personas/persona1.png";
import persona2 from "@/assets/personas/persona2.png";
import persona3 from "@/assets/personas/persona3.png";
import persona4 from "@/assets/personas/persona4.png";
import persona5 from "@/assets/personas/persona5.png";
import type { WaitlistEntryResponse } from "@/src/lib/api";

const PERSONA_SPRITES = [persona1, persona2, persona3, persona4, persona5];
const SIGN_RATIO = 1536 / 1024;

interface WaitingListProps {
  isAuthenticated: boolean;
  activeCount: number;
  myEntry: WaitlistEntryResponse | null;
  isLeaving?: boolean;
  onJoinClick: () => void;
  onLeave: () => void;
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
      style={{ top: "60%", left: "18%" }}
    >
      <div className="relative w-36" style={{ aspectRatio: SIGN_RATIO }}>
        <Image
          src={waitingSign}
          alt="Fila de espera"
          fill
          className="pointer-events-none select-none object-contain drop-shadow-lg"
        />

        {myEntry ? (
          <button
            type="button"
            onClick={onLeave}
            disabled={isLeaving}
            className="pointer-events-auto absolute rounded text-[6px] font-bold leading-none text-rose-100 transition-colors hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            style={{ top: "53%", left: "20%", width: "58%", height: "9%" }}
          >
            {isLeaving ? "Saliendo..." : "Salir"}
          </button>
        ) : (
          <button
            type="button"
            onClick={onJoinClick}
            className="pointer-events-auto absolute rounded text-[6px] font-bold leading-none text-sky-100 transition-colors hover:bg-blue-500/20"
            style={{ top: "53%", left: "20%", width: "58%", height: "9%" }}
          >
            {isAuthenticated ? "Unirme" : "Inicia sesión"}
          </button>
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
