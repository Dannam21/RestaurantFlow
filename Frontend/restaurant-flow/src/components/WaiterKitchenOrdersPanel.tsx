"use client";

import Image from "next/image";
import ordersFrame from "@/assets/mesero/ordenesLista.png";
import { useContainSize } from "@/src/hooks/useContainSize";
import { READY_TO_MARK_THRESHOLD, useKitchenOrders } from "@/src/hooks/useKitchenOrders";
import type { OrderDishResponse } from "@/src/lib/api";

const FRAME_RATIO = 1024 / 1536;

const DISH_ICONS: { keywords: string[]; icon: string }[] = [
  { keywords: ["pizza"], icon: "🍕" },
  { keywords: ["burger", "hamburguesa"], icon: "🍔" },
  { keywords: ["ensalada"], icon: "🥗" },
  { keywords: ["pasta", "alfredo", "spaghetti", "espagueti"], icon: "🍝" },
  { keywords: ["salmón", "salmon", "pescado"], icon: "🐟" },
  { keywords: ["sushi"], icon: "🍣" },
  { keywords: ["taco"], icon: "🌮" },
  { keywords: ["sopa"], icon: "🍲" },
  { keywords: ["postre", "pastel", "cake"], icon: "🍰" },
  { keywords: ["bebida", "jugo", "café", "cafe"], icon: "🥤" },
];

function dishIcon(name: string) {
  const normalized = name.toLowerCase();
  return (
    DISH_ICONS.find((entry) => entry.keywords.some((keyword) => normalized.includes(keyword)))
      ?.icon ?? "🍽️"
  );
}

export default function WaiterKitchenOrdersPanel() {
  const { containerRef, size } = useContainSize(FRAME_RATIO);
  const {
    preparingDishes,
    readyDishes,
    error,
    pendingActionId,
    markDishStatus,
    progressFor,
    remainingMinutesFor,
  } = useKitchenOrders();

  function handleMarkReady(dish: OrderDishResponse) {
    markDishStatus(dish, "ready");
  }

  function handleDeliver(dish: OrderDishResponse) {
    markDishStatus(dish, "delivered");
  }

  return (
    <div
      ref={containerRef}
      className="flex h-full w-full items-center justify-center overflow-hidden"
    >
      <div
        className="relative"
        style={{ width: size.width || "100%", height: size.height || "100%" }}
      >
        <Image
          src={ordersFrame}
          alt=""
          fill
          priority
          className="pointer-events-none select-none object-contain"
        />

        {preparingDishes.length > 0 && (
          <span
            className="absolute flex items-center justify-center rounded-full bg-amber-500 font-bold text-amber-950 shadow"
            style={{ top: "18%", left: "68.5%", width: "6%", aspectRatio: "1", fontSize: "min(1.4vw, 11px)" }}
          >
            {preparingDishes.length}
          </span>
        )}

        <div
          className="absolute overflow-y-auto"
          style={{ top: "23.5%", left: "9%", width: "82%", height: "41%" }}
        >
          {preparingDishes.length === 0 && !error && (
            <p className="py-6 text-center text-xs text-amber-100/50">
              No hay platos en preparación.
            </p>
          )}

          <div className="space-y-2">
            {preparingDishes.map((dish) => {
              const progress = progressFor(dish);
              const remaining = remainingMinutesFor(dish);
              const canMarkReady = progress !== null && progress >= READY_TO_MARK_THRESHOLD;

              return (
                <div
                  key={dish.id}
                  title={`Pedido #${dish.order_id.slice(0, 8)}`}
                  className="rounded-lg border border-amber-900/40 bg-black/40 px-2.5 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 text-base">{dishIcon(dish.name)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-amber-50">
                        Mesa {dish.table_id} - {dish.name}
                        {dish.quantity > 1 ? ` x${dish.quantity}` : ""}
                      </p>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-black/50">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
                          style={{ width: `${progress ?? 0}%` }}
                        />
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[11px] font-bold text-amber-100">
                        {progress !== null ? `${progress}%` : "—"}
                      </p>
                      <p className="text-[9px] text-amber-200/60">
                        {remaining !== null ? `${remaining} min` : "—"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleMarkReady(dish)}
                    disabled={pendingActionId === dish.id || !canMarkReady}
                    title={
                      canMarkReady
                        ? undefined
                        : `Disponible al llegar al ${READY_TO_MARK_THRESHOLD}% de cocción`
                    }
                    className="mt-1.5 w-full rounded border border-emerald-500/50 bg-emerald-500/10 py-1 text-[10px] font-bold text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Listo
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {readyDishes.length > 0 && (
          <span
            className="absolute flex items-center justify-center rounded-full bg-emerald-500 font-bold text-emerald-950 shadow"
            style={{ top: "69.3%", left: "62%", width: "6%", aspectRatio: "1", fontSize: "min(1.4vw, 11px)" }}
          >
            {readyDishes.length}
          </span>
        )}

        <div
          className="absolute overflow-y-auto"
          style={{ top: "77%", left: "9%", width: "82%", height: "18%" }}
        >
          {readyDishes.length === 0 ? (
            <p className="py-2 text-center text-[11px] text-amber-100/50">
              Nada pendiente de entregar.
            </p>
          ) : (
            <div className="space-y-1.5">
              {readyDishes.map((dish) => (
                <div
                  key={dish.id}
                  className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-black/40 px-2 py-1.5"
                >
                  <span className="shrink-0 text-sm">{dishIcon(dish.name)}</span>
                  <p className="min-w-0 flex-1 truncate text-[11px] text-amber-50">
                    Mesa {dish.table_id} - {dish.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleDeliver(dish)}
                    disabled={pendingActionId === dish.id}
                    className="shrink-0 rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-1 text-[9px] font-bold text-amber-200 transition-colors hover:bg-amber-500/20 disabled:opacity-50"
                  >
                    Entregado
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <p
            className="absolute px-2 text-center text-[10px] text-rose-300"
            style={{ bottom: "1%", left: "9%", width: "82%" }}
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
