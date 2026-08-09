"use client";

import Image from "next/image";
import waitingSign from "@/assets/place/filacartel.png";

const SIGN_RATIO = 1536 / 1024;

interface WaitingListSignProps {
  activeCount: number;
}

/**
 * Read-only staff-facing version of the customer waiting-list sign
 * (see WaitingList.tsx) — same asset, size, and position, but shows the
 * live count instead of a join button since staff don't join the queue.
 */
export default function WaitingListSign({ activeCount }: WaitingListSignProps) {
  return (
    <div className="absolute z-20" style={{ top: "60%", left: "18%" }}>
      <div className="relative w-36" style={{ aspectRatio: SIGN_RATIO }}>
        <Image
          src={waitingSign}
          alt="Fila de espera"
          fill
          className="pointer-events-none select-none object-contain drop-shadow-lg"
        />
        <p
          className="pointer-events-none absolute flex items-center justify-center px-1 text-center text-[6px] font-bold leading-none text-sky-100"
          style={{ top: "53%", left: "20%", width: "58%", height: "9%" }}
        >
          {activeCount === 0 ? "Nadie esperando" : `${activeCount} esperando`}
        </p>
      </div>
    </div>
  );
}
