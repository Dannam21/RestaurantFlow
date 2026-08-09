import type { TopDishEntry } from "@/src/lib/api";

interface TopDishesProps {
  data: TopDishEntry[];
}

const DISH_ICONS: { keywords: string[]; icon: string }[] = [
  { keywords: ["pizza"], icon: "🍕" },
  { keywords: ["hamburguesa", "burger"], icon: "🍔" },
  { keywords: ["ensalada"], icon: "🥗" },
  { keywords: ["pasta", "alfredo"], icon: "🍝" },
  { keywords: ["salmón", "salmon", "pescado"], icon: "🐟" },
  { keywords: ["sushi"], icon: "🍣" },
  { keywords: ["taco"], icon: "🌮" },
  { keywords: ["sopa"], icon: "🍲" },
  { keywords: ["postre", "pastel", "suspiro"], icon: "🍰" },
  { keywords: ["chicha", "bebida", "jugo", "kola", "café", "cafe"], icon: "🥤" },
  { keywords: ["pollo", "gallina"], icon: "🍗" },
  { keywords: ["lomo", "carne"], icon: "🥩" },
];

function dishIcon(name: string) {
  const normalized = name.toLowerCase();
  return (
    DISH_ICONS.find((entry) => entry.keywords.some((keyword) => normalized.includes(keyword)))
      ?.icon ?? "🍽️"
  );
}

export default function TopDishes({ data }: TopDishesProps) {
  const max = Math.max(...data.map((entry) => entry.count), 1);

  return (
    <section className="rounded-xl border border-slate-800 bg-[#12121f] p-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
        Top 5 platos más vendidos
      </p>

      {data.length === 0 ? (
        <div className="flex h-28 items-center justify-center text-xs text-slate-500">
          Sin platos vendidos todavía.
        </div>
      ) : (
        <div className="mt-3 space-y-2.5">
          {data.map((dish, index) => (
            <div key={dish.name} className="flex items-center gap-2.5">
              <span className="w-4 shrink-0 text-[11px] font-bold text-slate-500">
                {index + 1}
              </span>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-base">
                {dishIcon(dish.name)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-medium text-white">{dish.name}</p>
                  <p className="shrink-0 text-xs font-semibold text-amber-300">
                    {dish.count}
                  </p>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                    style={{ width: `${(dish.count / max) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
