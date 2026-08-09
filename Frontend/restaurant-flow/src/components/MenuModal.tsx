"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import menuFrame from "@/assets/menuabierto.png";
import { useContainSize } from "@/src/hooks/useContainSize";
import { ApiError, getMenuItems, type MenuItemResponse } from "@/src/lib/api";

interface MenuModalProps {
  onClose: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  Entradas: "🥗",
  "Platos Principales": "🍝",
  Fondos: "🍲",
  Pastas: "🍜",
  Pizzas: "🍕",
  Ensaladas: "🥗",
  Postres: "🍰",
  Bebidas: "🥤",
};

function categoryIcon(category: string) {
  return CATEGORY_ICONS[category] ?? "🍽️";
}

// Top offset (%) of each of the 7 slots drawn into menuabierto.png's sidebar.
// Buttons are shorter than the full slot height and nudged down within it.
const SIDEBAR_SLOT_TOPS = [8.6, 19.9, 31.2, 42.5, 53.8, 65.1, 76.4];
const SIDEBAR_SLOT_HEIGHT = 7.5;
// Per-slot vertical nudge within its slot; index 2 (3rd slot) needed to sit higher.
const SIDEBAR_SLOT_OFFSETS = [3.4, 3.4, 1.8, 3.4, 3.4, 3.4, 3.4];

function formatPrice(price: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(price);
}

export default function MenuModal({ onClose }: MenuModalProps) {
  const { containerRef, size } = useContainSize(3 / 2);
  const [items, setItems] = useState<MenuItemResponse[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchMenu() {
      try {
        const result = await getMenuItems({ available_only: true });
        if (!cancelled) {
          setItems(result);
          setActiveCategory((prev) => prev ?? result[0]?.category ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : "No se pudo cargar el menú."
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchMenu();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const categories = useMemo(
    () => Array.from(new Set(items.map((item) => item.category))),
    [items]
  );
  const visibleItems = items.filter((item) => item.category === activeCategory);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        onClick={(event) => event.stopPropagation()}
        className="relative flex h-full max-h-[90vh] w-full max-w-3xl items-center justify-center"
      >
        <div
          className="relative"
          style={{ width: size.width || "100%", height: size.height || "100%" }}
        >
          <Image
            src={menuFrame}
            alt=""
            fill
            priority
            className="pointer-events-none select-none object-contain"
          />

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute z-20"
            style={{ top: "1.5%", right: "1.5%", width: "7%", height: "10.5%" }}
          />

          {categories.slice(0, SIDEBAR_SLOT_TOPS.length).map((category, index) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              style={{
                top: `${SIDEBAR_SLOT_TOPS[index] + SIDEBAR_SLOT_OFFSETS[index]}%`,
                height: `${SIDEBAR_SLOT_HEIGHT}%`,
                left: "4.3%",
                width: "18%",
              }}
              className={`absolute flex items-center justify-between gap-1.5 overflow-hidden rounded px-2 text-left text-xs font-bold leading-tight transition-all duration-150 active:scale-[0.97] sm:text-sm ${
                activeCategory === category
                  ? "border border-amber-200/70 bg-gradient-to-b from-amber-300 to-amber-600 text-amber-950 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),inset_0_-2px_3px_rgba(120,53,15,0.4)]"
                  : "border border-amber-900/40 bg-black/30 text-amber-100/90 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] hover:border-amber-500/40 hover:bg-black/40 hover:text-amber-50"
              }`}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="shrink-0 text-base drop-shadow-sm">{categoryIcon(category)}</span>
                <span className="truncate">{category}</span>
              </span>
              <span className="shrink-0 text-sm opacity-80">›</span>
            </button>
          ))}

          <div
            className="absolute overflow-y-auto px-2"
            style={{ top: "12%", left: "25%", width: "65%", height: "65%" }}
          >
            {isLoading && (
              <p className="py-8 text-center text-sm text-amber-950/70">
                Cargando menú...
              </p>
            )}

            {error && (
              <p className="rounded-lg border border-rose-700/30 bg-rose-100 px-3 py-2 text-xs text-rose-800">
                {error}
              </p>
            )}

            {!isLoading && !error && (
              <>
                <p className="mb-3 text-center text-xs font-bold uppercase tracking-[0.25em] text-amber-900/80">
                  {activeCategory ?? "Menú"}
                </p>

                {visibleItems.length === 0 && (
                  <p className="py-6 text-center text-sm text-amber-950/60">
                    No hay platos disponibles en esta categoría.
                  </p>
                )}

                <div className="space-y-2.5">
                  {visibleItems.map((item) => (
                    <div key={item.id} className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-900/20 bg-amber-100 text-lg shadow-sm">
                        {categoryIcon(item.category)}
                      </span>
                      <div className="min-w-0 flex-1 border-b border-amber-900/15 pb-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-amber-950">
                            {item.name}
                          </p>
                          <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-amber-800">
                            {formatPrice(item.price)}
                            <span className="text-xs">🪙</span>
                          </span>
                        </div>
                        {item.description && (
                          <p className="mt-0.5 text-xs leading-relaxed text-amber-950/60">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div
            className="absolute flex items-center"
            style={{ top: "83%", left: "12.5%", width: "55%", height: "13.5%" }}
          >
            <p className="line-clamp-2 text-[10px] leading-snug text-amber-100/90">
              Todos nuestros platos son preparados al momento
              con ingredientes frescos y de alta calidad.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
