"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ApiError,
  createOrder,
  getMenuItems,
  type MenuItemResponse,
  type OrderItemRequest,
} from "@/src/lib/api";

interface DraftOrderItem extends OrderItemRequest {
  localId: string;
}

interface WaiterOrderModalProps {
  tableId: number;
  onClose: () => void;
  onSubmitted: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  bebidas: "Bebidas",
  entradas: "Entradas",
  fondos: "Fondos",
  postres: "Postres",
};

export default function WaiterOrderModal({
  tableId,
  onClose,
  onSubmitted,
}: WaiterOrderModalProps) {
  const [menuItems, setMenuItems] = useState<MenuItemResponse[]>([]);
  const [draftItems, setDraftItems] = useState<DraftOrderItem[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadMenu() {
      setIsLoadingMenu(true);
      try {
        const result = await getMenuItems({ available_only: true });
        if (cancelled) return;
        setMenuItems(result);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof ApiError
            ? err.message
            : "No se pudo cargar el menu del restaurante."
        );
      } finally {
        if (!cancelled) setIsLoadingMenu(false);
      }
    }

    loadMenu();
    return () => {
      cancelled = true;
    };
  }, []);

  const groupedMenu = useMemo(() => {
    const map = new Map<string, MenuItemResponse[]>();
    for (const item of menuItems) {
      const categoryItems = map.get(item.category) ?? [];
      categoryItems.push(item);
      map.set(item.category, categoryItems);
    }
    return Array.from(map.entries());
  }, [menuItems]);

  const totalItems = draftItems.reduce((sum, item) => sum + item.quantity, 0);

  function addItem(menuItem: MenuItemResponse) {
    setDraftItems((prev) => [
      ...prev,
      {
        localId: crypto.randomUUID(),
        product_id: menuItem.id,
        name: menuItem.name,
        quantity: 1,
        price: menuItem.price,
        notes: "",
      },
    ]);
  }

  function updateDraftItem(
    localId: string,
    patch: Partial<Pick<DraftOrderItem, "quantity" | "notes">>
  ) {
    setDraftItems((prev) =>
      prev.map((item) =>
        item.localId === localId
          ? {
              ...item,
              ...patch,
            }
          : item
      )
    );
  }

  function removeDraftItem(localId: string) {
    setDraftItems((prev) => prev.filter((item) => item.localId !== localId));
  }

  async function handleSubmit() {
    if (draftItems.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await createOrder({
        table_id: tableId,
        items: draftItems.map(({ localId: _localId, ...item }) => ({
          ...item,
          notes: item.notes?.trim() || null,
        })),
      });
      onSubmitted();
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo enviar el pedido de la mesa."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 sm:p-4">
      <div className="grid h-[88vh] w-full max-w-6xl gap-3 overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 p-3 shadow-2xl xl:grid-cols-[minmax(0,1.2fr)_minmax(19rem,0.8fr)]">
        <section className="flex min-h-0 flex-col rounded-2xl border border-slate-800 bg-slate-950/60">
          <div className="flex items-start justify-between border-b border-slate-800 px-4 py-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Toma De Pedido
              </p>
              <h2 className="mt-1 text-lg font-semibold text-white">
                Mesa {tableId}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              aria-label="Cerrar toma de pedido"
            >
              ✕
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            {isLoadingMenu ? (
              <p className="text-sm text-slate-400">Cargando menu...</p>
            ) : (
              <div className="space-y-4">
                {groupedMenu.map(([category, items]) => (
                  <div key={category}>
                    <h3 className="mb-2 text-sm font-semibold text-white">
                      {CATEGORY_LABELS[category] ?? category}
                    </h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      {items.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => addItem(item)}
                          className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-left transition-colors hover:border-violet-500/40 hover:bg-slate-800"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-white">
                                {item.name}
                              </p>
                              {item.description ? (
                                <p className="mt-1 text-xs text-slate-400">
                                  {item.description}
                                </p>
                              ) : null}
                            </div>
                            <span className="text-sm font-semibold text-amber-300">
                              S/ {item.price.toFixed(2)}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="flex min-h-0 flex-col rounded-2xl border border-slate-800 bg-slate-950/60">
          <div className="border-b border-slate-800 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Pedido Listo
            </p>
            <p className="mt-1 text-sm text-slate-300">
              {totalItems > 0
                ? `${totalItems} item${totalItems === 1 ? "" : "s"} por enviar`
                : "Aun no agregaste productos"}
            </p>
          </div>

          <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 py-3">
            {draftItems.length === 0 ? (
              <p className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-400">
                Agrega platos desde el menu para confirmar el pedido.
              </p>
            ) : (
              draftItems.map((item) => (
                <article
                  key={item.localId}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {item.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        S/ {(item.price ?? 0).toFixed(2)} c/u
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDraftItem(item.localId)}
                      className="text-xs text-rose-300 transition-colors hover:text-white"
                    >
                      Quitar
                    </button>
                  </div>

                  <div className="mt-2.5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateDraftItem(item.localId, {
                          quantity: Math.max(1, item.quantity - 1),
                        })
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 text-slate-200"
                    >
                      -
                    </button>
                    <span className="min-w-8 text-center text-sm font-semibold text-white">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateDraftItem(item.localId, {
                          quantity: item.quantity + 1,
                        })
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 text-slate-200"
                    >
                      +
                    </button>
                  </div>

                  <textarea
                    value={item.notes ?? ""}
                    onChange={(event) =>
                      updateDraftItem(item.localId, {
                        notes: event.target.value,
                      })
                    }
                    rows={1}
                    placeholder="Notas para cocina"
                    className="mt-2.5 max-h-24 min-h-[44px] w-full resize-y rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition-colors focus:border-violet-500"
                  />
                </article>
              ))
            )}
          </div>

          <div className="border-t border-slate-800 px-4 py-3">
            {error ? (
              <p className="mb-3 rounded-xl border border-rose-500/30 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">
                {error}
              </p>
            ) : null}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={draftItems.length === 0 || isSubmitting}
              className="w-full rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              {isSubmitting ? "Enviando pedido..." : "Confirmar y enviar pedido"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
