"use client";

import { useState } from "react";
import type { CookingTimeEntry } from "@/src/lib/api";

interface OrdersChartProps {
  data: CookingTimeEntry[];
}

const WIDTH = 100;
const HEIGHT = 36;

export default function OrdersChart({ data }: OrdersChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  return (
    <section className="rounded-xl border border-slate-800 bg-[#12121f] p-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
        Tiempo promedio de cocina
      </p>

      {data.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-xs text-slate-500">
          Sin órdenes completadas hoy todavía.
        </div>
      ) : (
        (() => {
          const max = Math.max(...data.map((entry) => entry.minutes), 1);
          const points = data.map((entry, index) => {
            const x = data.length > 1 ? (index / (data.length - 1)) * WIDTH : 0;
            const y = HEIGHT - (entry.minutes / max) * (HEIGHT - 4);
            return { x, y, entry };
          });
          const coords = points.map((point) => `${point.x},${point.y}`).join(" ");
          const areaCoords = `0,${HEIGHT} ${coords} ${WIDTH},${HEIGHT}`;
          const hovered = hoverIndex !== null ? points[hoverIndex] : null;

          return (
            <div className="relative mt-3">
              <svg
                viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                preserveAspectRatio="none"
                className="h-40 w-full overflow-visible"
              >
                <polygon points={areaCoords} fill="url(#ordersGradient)" opacity={0.25} />
                <polyline
                  points={coords}
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth={1.2}
                  vectorEffect="non-scaling-stroke"
                />
                <defs>
                  <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                {points.map((point, index) => (
                  <circle
                    key={point.entry.hour}
                    cx={point.x}
                    cy={point.y}
                    r={hoverIndex === index ? 1.6 : 0.9}
                    fill="#a855f7"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoverIndex(index)}
                    onMouseLeave={() => setHoverIndex((current) => (current === index ? null : current))}
                  />
                ))}
              </svg>

              {hovered && (
                <div
                  className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg border border-violet-500/40 bg-slate-950/95 px-2.5 py-1.5 text-[11px] shadow-xl"
                  style={{
                    left: `${hovered.x}%`,
                    top: `${(hovered.y / HEIGHT) * 100}%`,
                  }}
                >
                  <p className="font-semibold text-white">{hovered.entry.minutes.toFixed(1)} min</p>
                  <p className="text-slate-400">{hovered.entry.hour}</p>
                </div>
              )}

              <div className="mt-1 flex justify-between text-[10px] text-slate-500">
                <span>{data[0]?.hour}</span>
                <span>{data[data.length - 1]?.hour}</span>
              </div>
            </div>
          );
        })()
      )}
    </section>
  );
}
