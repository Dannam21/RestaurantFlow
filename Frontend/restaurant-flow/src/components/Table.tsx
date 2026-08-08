import Image from "next/image";
import mesaVacia from "@/assets/mesa.png";
import mesa1 from "@/assets/mesas/mesa1.png";
import mesa3 from "@/assets/mesas/mesa3.png";
import mesa4 from "@/assets/mesas/mesa4.png";
import mesa22 from "@/assets/mesas/mesa22.png";

export type TableStatus = "vacio" | "ocupado" | "comiendo" | "pagando";

export interface TableProps {
  id: string;
  x: string;
  y: string;
  status: TableStatus;
  numPersonas: number;
  sinceMinutes?: number;
  scale?: number;
  onReserve?: () => void;
}

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
  sinceMinutes,
  scale = 1,
  onReserve,
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
      className="group absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-default transition-transform duration-300 ease-out hover:z-30 hover:scale-[1.08]"
      style={{ top: y, left: x }}
    >
      <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-3 w-44 -translate-x-1/2 translate-y-1 rounded-xl bg-slate-900/95 px-3 py-2.5 text-xs text-white opacity-0 shadow-xl ring-1 ring-white/10 transition-all duration-200 ease-out group-hover:translate-y-0 group-hover:opacity-100">
        <p className="text-sm font-semibold">Mesa {id}</p>

        <div className="mt-1.5 flex items-center gap-1.5 text-slate-300">
          <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`} />
          <span>{STATUS_LABEL[status]}</span>
        </div>

        <p className="mt-1 text-slate-300">
          {numPersonas > 0 ? `${numPersonas} personas` : "Sin comensales"}
        </p>

        {!isVacant && typeof sinceMinutes === "number" && (
          <p className="mt-1 text-slate-400">Llegaron hace {sinceMinutes} min</p>
        )}

        {isVacant && onReserve && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onReserve();
            }}
            className="pointer-events-auto mt-2 w-full rounded-lg bg-blue-600 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-500"
          >
            Reservar mesa
          </button>
        )}

        <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-900/95" />
      </div>

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
    </div>
  );
}
