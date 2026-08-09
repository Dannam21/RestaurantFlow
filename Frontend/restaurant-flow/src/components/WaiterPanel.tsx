"use client";

import { useEffect, useRef, useState } from "react";
import { useTables } from "@/src/hooks/useTables";
import type { TeamChannel, TeamMessage } from "@/src/types";

function nowLabel() {
  return new Date().toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const CHANNELS: { id: TeamChannel; label: string }[] = [
  { id: "general", label: "General" },
  { id: "cocina", label: "Cocina" },
  { id: "meseros", label: "Meseros" },
];

const KIND_ICON: Record<TeamMessage["kind"], string> = {
  mesa: "🙋",
  cocina: "👨‍🍳",
  alerta: "🔔",
  mesero: "🧑‍🍳",
};

const TONE_CLASS: Record<TeamMessage["tone"], string> = {
  emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  amber: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  rose: "border-rose-500/30 bg-rose-500/10 text-rose-200",
  sky: "border-sky-500/30 bg-sky-500/10 text-sky-200",
  violet: "border-violet-500/30 bg-violet-500/10 text-violet-200",
};

const AVATAR_TONE_CLASS: Record<TeamMessage["tone"], string> = {
  emerald: "bg-emerald-500/20 text-emerald-300",
  amber: "bg-amber-500/20 text-amber-300",
  rose: "bg-rose-500/20 text-rose-300",
  sky: "bg-sky-500/20 text-sky-300",
  violet: "bg-violet-500/20 text-violet-300",
};

export default function WaiterPanel() {
  const { tables } = useTables();
  const [activeChannel, setActiveChannel] = useState<TeamChannel>("general");
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const generatedMessages = tables.flatMap<TeamMessage>((table) => {
      if (table.status === "waiting_order") {
        return [
          {
            id: `table-${table.id}-waiting`,
            channel: "general",
            kind: "mesa",
            name: `Mesa ${table.id}`,
            time: nowLabel(),
            text: "Cliente sentado, pendiente de tomar pedido.",
            tone: "amber",
          },
        ];
      }
      if (table.status === "cooking") {
        return [
          {
            id: `table-${table.id}-cooking-general`,
            channel: "general",
            kind: "cocina",
            name: "Cocina",
            time: nowLabel(),
            text: `Mesa ${table.id} en preparación.`,
            tone: "sky",
          },
          {
            id: `table-${table.id}-cooking-kitchen`,
            channel: "cocina",
            kind: "cocina",
            name: "Cocina",
            time: nowLabel(),
            text: `Mesa ${table.id} tiene un pedido en cocina.`,
            tone: "sky",
          },
        ];
      }
      if (table.status === "paying") {
        return [
          {
            id: `table-${table.id}-paying`,
            channel: "general",
            kind: "alerta",
            name: `Mesa ${table.id}`,
            time: nowLabel(),
            text: "Solicita cierre de cuenta.",
            tone: "emerald",
          },
        ];
      }
      return [];
    });

    setMessages((prev) => {
      const manualMessages = prev.filter((message) => message.name === "Tú");
      return [...generatedMessages, ...manualMessages];
    });
  }, [tables]);

  const visibleMessages = messages.filter(
    (message) => message.channel === activeChannel
  );

  const channelBadges = CHANNELS.reduce<Record<TeamChannel, number>>(
    (acc, channel) => {
      acc[channel.id] = messages.filter(
        (message) => message.channel === channel.id
      ).length;
      return acc;
    },
    { general: 0, cocina: 0, meseros: 0 }
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [visibleMessages.length]);

  function handleSend() {
    const text = draft.trim();
    if (!text) return;

    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        channel: activeChannel,
        kind: "mesero",
        name: "Tú",
        time: nowLabel(),
        text,
        tone: "violet",
      },
    ]);
    setDraft("");
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSend();
    }
  }

  return (
    <aside className="flex h-full w-full flex-col bg-[#1e293b]">
      <div className="flex items-center justify-between border-b border-slate-700/60 px-5 py-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
          Comunicación del equipo
        </h2>
        <button
          type="button"
          aria-label="Configuración de canales"
          className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
            <path
              d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path
              d="M19.4 13.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.9 2.9l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.9-2.9l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H4a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.9-2.9l.1.1a1.7 1.7 0 0 0 1.9.3H10a1.7 1.7 0 0 0 1-1.6V4a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.9 2.9l-.1.1a1.7 1.7 0 0 0-.3 1.9V10a1.7 1.7 0 0 0 1.6 1h.2a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1Z"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className="border-b border-slate-700/60 px-3 py-3">
        <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Canales
        </p>
        <div className="space-y-0.5">
          {CHANNELS.map((channel) => (
            <button
              key={channel.id}
              type="button"
              onClick={() => setActiveChannel(channel.id)}
              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                activeChannel === channel.id
                  ? "bg-blue-600/90 text-white"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <span># {channel.label}</span>
              {channelBadges[channel.id] > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    activeChannel === channel.id
                      ? "bg-white/20 text-white"
                      : "bg-slate-700 text-slate-200"
                  }`}
                >
                  {channelBadges[channel.id]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-2.5 overflow-y-auto px-3 py-3">
        {visibleMessages.map((message) => (
          <div
            key={message.id}
            className={`animate-fade-in-up rounded-xl border px-3 py-2.5 ${TONE_CLASS[message.tone]}`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${AVATAR_TONE_CLASS[message.tone]}`}
              >
                {KIND_ICON[message.kind]}
              </span>
              <p className="text-sm font-semibold text-white">{message.name}</p>
              <span className="ml-auto text-[10px] text-slate-400">
                {message.time}
              </span>
            </div>
            <p className="mt-1.5 pl-8 text-sm leading-snug text-slate-200">
              {message.text}
            </p>
          </div>
        ))}

        {visibleMessages.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-slate-500">
            No hay mensajes en este canal todavía.
          </p>
        )}
      </div>

      <div className="border-t border-slate-700/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            type="text"
            placeholder="Escribe un mensaje..."
            className="flex-1 rounded-full border border-slate-600/60 bg-slate-800/80 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-colors focus:border-blue-500"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!draft.trim()}
            aria-label="Enviar mensaje"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition-all hover:bg-blue-500 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500"
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-4.5 w-4.5 translate-x-[1px]"
            >
              <path d="M3.4 20.6 22 12 3.4 3.4 3 10l12 2-12 2z" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
