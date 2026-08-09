import Image from "next/image";
import mesaVacia from "@/assets/mesa.png";
import mesa1 from "@/assets/mesas/mesa1.png";
import mesa3 from "@/assets/mesas/mesa3.png";
import mesa4 from "@/assets/mesas/mesa4.png";
import mesa22 from "@/assets/mesas/mesa22.png";
import type { TableAlert } from "@/src/types";

export type TableStatus = "vacio" | "ocupado" | "comiendo" | "pagando";

export interface TableProps {
  id: string;
  x: string;
  y: string;
  status: TableStatus;
  numPersonas: number;
  sinceMinutes?: number;
  scale?: number;
  alert?: TableAlert;
  onClick?: () => void;
  assignedWaiterName?: string;
  isMine?: boolean;
  hoverHint?: string;
}

const ALERT_TONE_CLASS: Record<TableAlert["tone"], string> = {
  emerald: "border-emerald-500/50 bg-emerald-950/90 text-emerald-200",
  amber: "border-amber-500/50 bg-amber-950/90 text-amber-200",
  rose: "border-rose-500/50 bg-rose-950/90 text-rose-200",
  sky: "border-sky-500/50 bg-sky-950/90 text-sky-200",
};

const ALERT_DOT_CLASS: Record<TableAlert["tone"], string> = {
  emerald: "bg-emerald-400",
  amber: "bg-amber-400",
  rose: "bg-rose-400",
  sky: "bg-sky-400",
};

const STATUS_LABEL: Record<TableStatus, string> = {
  vacio: "Vacía",
  ocupado: "Ocupada",
  comiendo: "Comiendo",
  pagando: "Pagando",
};

const STATUS_DOT: Record<TableStatus, string> = {
  vacio: "bg-slate-500",
  ocupado: "bg-sky-400",
  comiendo: "bg-amber-400",
  pagando: "bg-red-500",
};

export default function Table({
  id,
  x,
  y,
  status,
  numPersonas,
  scale = 1,
  alert,
  onClick,
  assignedWaiterName,
  isMine,
  hoverHint,
}: TableProps) {
  const isVacant = status === "vacio";
  const tableSprite =
    isVacant
      ? mesaVacia
      : numPersonas >= 4
      ? mesa4
      : numPersonas === 3
        ? mesa3
        : numPersonas === 2
          ? mesa22
          : mesa1;
  const imageWidth = `${9.4 * scale}rem`;
  const imageHeight = `${6.3 * scale}rem`;

  return (
    <div
      className={`group absolute z-20 -translate-x-1/2 -translate-y-1/2 transition-transform duration-300 ease-out hover:z-30 hover:scale-[1.08] ${
        onClick ? "cursor-pointer" : "cursor-default"
      }`}
      style={{ top: y, left: x }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
    >
      {alert ? (
        <div
          className={`pointer-events-none absolute bottom-full left-1/2 z-30 mb-3 w-max max-w-[11rem] -translate-x-1/2 rounded-lg border px-2.5 py-1.5 text-[11px] leading-tight shadow-lg backdrop-blur-sm ${ALERT_TONE_CLASS[alert.tone]}`}
        >
          <div className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${ALERT_DOT_CLASS[alert.tone]}`} />
            <span className="font-semibold text-white">Mesa {id}</span>
          </div>
          <p className="mt-0.5 flex items-center gap-1 font-medium">
            <span>{alert.icon}</span>
            <span>{alert.label}</span>
          </p>
          {alert.detail && (
            <p className="mt-0.5 text-[10px] opacity-80">{alert.detail}</p>
          )}
        </div>
      ) : (
        <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-3 w-44 -translate-x-1/2 translate-y-1 rounded-xl bg-slate-900/95 px-3 py-2.5 text-xs text-white opacity-0 shadow-xl ring-1 ring-white/10 transition-all duration-200 ease-out group-hover:translate-y-0 group-hover:opacity-100">
          <p className="text-sm font-semibold">Mesa {id}</p>

          <div className="mt-1.5 flex items-center gap-1.5 text-slate-300">
            <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`} />
            <span>{STATUS_LABEL[status]}</span>
          </div>

          {hoverHint && (
            <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
              {hoverHint}
            </p>
          )}

          <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-900/95" />
        </div>
      )}

      <div className="relative overflow-hidden rounded-xl">
        <Image
          src={tableSprite}
          alt={`Mesa ${id} — ${STATUS_LABEL[status]}`}
          width={tableSprite.width}
          height={tableSprite.height}
          className={`object-contain transition-opacity duration-500 ${
            isVacant ? "opacity-40 grayscale" : "opacity-100"
          }`}
          style={{ width: imageWidth, height: imageHeight }}
        />
      </div>

      {assignedWaiterName && isMine ? (
        <div className="pointer-events-none absolute -bottom-2 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center whitespace-nowrap rounded-lg border border-emerald-500/50 bg-emerald-950/90 px-2.5 py-1 text-center shadow-lg">
          <span className="text-[9px] font-medium leading-tight text-emerald-300/90">
            Atendiendo:
          </span>
          <span className="text-[11px] font-semibold leading-tight text-white">
            Mesa {id} ({assignedWaiterName})
          </span>
        </div>
      ) : (
        assignedWaiterName && (
          <div className="pointer-events-none absolute -bottom-1 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full border border-violet-500/50 bg-violet-950/90 px-2 py-0.5 text-[10px] font-medium text-violet-200 shadow-lg">
            <span>🧑‍🍳</span>
            <span>{assignedWaiterName}</span>
          </div>
        )
      )}
    </div>
  );
}
