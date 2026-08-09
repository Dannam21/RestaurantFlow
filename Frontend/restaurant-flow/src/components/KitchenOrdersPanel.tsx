"use client";

import { useState } from "react";
import type { OrderDishResponse } from "@/src/lib/api";
import { READY_TO_MARK_THRESHOLD, useKitchenOrders } from "@/src/hooks/useKitchenOrders";

const VISIBLE_LIMIT = 5;

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

export default function KitchenOrdersPanel() {
  const {
    preparingDishes,
    readyDishes,
    error,
    pendingActionId,
    markDishStatus,
    progressFor,
    remainingMinutesFor,
  } = useKitchenOrders();
  const [showAll, setShowAll] = useState(false);

  function handleMarkReady(dish: OrderDishResponse) {
    markDishStatus(dish, "ready");
  }

  function handleDeliver(dish: OrderDishResponse) {
    markDishStatus(dish, "delivered");
  }

  const visiblePreparing = showAll
    ? preparingDishes
    : preparingDishes.slice(0, VISIBLE_LIMIT);
  const hiddenCount = preparingDishes.length - visiblePreparing.length;

  return (
    <aside className="flex h-full w-full flex-col border-l border-slate-700/60 bg-[#1e293b]">
      <div className="flex items-center justify-between border-b border-slate-700/60 px-4 py-4">
        <h2 className="text-sm font-semibold text-white">Órdenes en Cocina</h2>
        <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-300 ring-1 ring-amber-500/20">
          {preparingDishes.length} en preparación
        </span>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto px-3 py-3">
        {visiblePreparing.length === 0 && !error && (
          <p className="px-2 py-6 text-center text-xs text-slate-500">
            No hay platos en preparación.
          </p>
        )}

        {visiblePreparing.map((dish) => {
          const progress = progressFor(dish);
          const remaining = remainingMinutesFor(dish);
          const canMarkReady = progress !== null && progress >= READY_TO_MARK_THRESHOLD;

          return (
            <div
              key={dish.id}
              title={`Pedido #${dish.order_id.slice(0, 8)}`}
              className="flex items-center gap-3 rounded-xl border border-slate-700/50 bg-slate-950/40 px-3 py-2.5"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-lg">
                {dishIcon(dish.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  Mesa {dish.table_id} - {dish.name}
                  {dish.quantity > 1 ? ` x${dish.quantity}` : ""}
                </p>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all"
                    style={{ width: `${progress ?? 0}%` }}
                  />
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs font-semibold text-white">
                  {progress !== null ? `${progress}%` : "—"}
                </p>
                <p className="text-[10px] text-slate-500">
                  {remaining !== null ? `${remaining} min` : "—"}
                </p>
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
                className="shrink-0 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2 py-1.5 text-[10px] font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Listo
              </button>
            </div>
          );
        })}

        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="w-full rounded-lg px-2 py-2 text-center text-xs text-slate-400 transition-colors hover:text-white"
          >
            + {hiddenCount} órdenes más
          </button>
        )}

        <div className="mt-4 border-t border-slate-800 pt-3">
          <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Listas para entregar ({readyDishes.length})
          </p>
          {readyDishes.length === 0 ? (
            <p className="px-2 py-2 text-center text-xs text-slate-500">
              Nada pendiente de entregar.
            </p>
          ) : (
            <div className="space-y-2">
              {readyDishes.map((dish) => (
                <div
                  key={dish.id}
                  className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-3 py-2"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-base">
                    {dishIcon(dish.name)}
                  </span>
                  <p className="min-w-0 flex-1 truncate text-xs font-medium text-white">
                    Mesa {dish.table_id} - {dish.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleDeliver(dish)}
                    disabled={pendingActionId === dish.id}
                    className="shrink-0 rounded-lg border border-slate-600 bg-slate-800 px-2 py-1.5 text-[10px] font-semibold text-slate-200 transition-colors hover:bg-slate-700 disabled:opacity-50"
                  >
                    Entregado
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
            {error}
          </p>
        )}
      </div>
    </aside>
  );
}
