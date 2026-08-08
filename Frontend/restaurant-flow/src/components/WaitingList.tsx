import type { WaitingPerson } from "@/src/types";

const QUEUE: WaitingPerson[] = [
  { id: "w1", emoji: "🧑" },
  { id: "w2", emoji: "👩" },
  { id: "w3", emoji: "🧑‍🦱" },
  { id: "w4", emoji: "👨‍🦰" },
  { id: "w5", emoji: "🧑‍🦳" },
];

export default function WaitingList() {
  return (
    <div
      className="absolute flex items-end gap-3"
      style={{ top: "76%", left: "26%" }}
    >
      <div className="w-32 rounded-md border border-amber-900/60 bg-slate-900/85 p-2.5 shadow-lg shadow-black/40 backdrop-blur-sm sm:w-36">
        <div className="flex items-center gap-1.5 text-amber-400">
          <span className="text-sm">👥</span>
          <span className="text-[11px] font-semibold uppercase tracking-wide">
            Lista de espera
          </span>
        </div>
        <p className="mt-1.5 text-xs font-medium text-white">
          5 personas esperando
        </p>
        <p className="mt-1 text-[11px] text-slate-400">
          Tiempo estimado
          <br />
          <span className="text-amber-300">~12 min</span>
        </p>
      </div>

      <div className="relative flex items-end gap-2 px-2 pb-2">
        <div className="absolute inset-x-0 top-3 h-0.5 rounded-full bg-red-600/70" />
        {QUEUE.map((person, index) => (
          <span
            key={person.id}
            className="animate-bob-y text-2xl drop-shadow-md sm:text-3xl"
            style={{ animationDelay: `${index * 0.25}s` }}
          >
            {person.emoji}
          </span>
        ))}
      </div>

      <div className="hidden w-28 rounded-md border border-amber-900/60 bg-slate-900/85 p-2.5 text-center shadow-lg shadow-black/40 backdrop-blur-sm md:block">
        <p className="text-[11px] leading-snug text-amber-200">
          ¡Te avisaremos cuando tu mesa esté lista!
        </p>
      </div>
    </div>
  );
}
