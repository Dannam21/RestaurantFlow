"use client";

import { useEffect, useRef, useState } from "react";
import Message from "@/src/components/Message";
import { useChat } from "@/src/hooks/useChat";

interface ChatPanelProps {
  isAuthenticated: boolean;
  onRequireAuth: () => void;
  tableId?: number;
}

export default function ChatPanel({
  isAuthenticated,
  onRequireAuth,
  tableId,
}: ChatPanelProps) {
  const { messages, isLoading, isSending, error, sendMessage } = useChat({
    tableId,
    enabled: isAuthenticated,
  });
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isSending]);

  async function handleSend() {
    const text = draft.trim();
    if (!text || isSending) return;

    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }

    setDraft("");
    try {
      await sendMessage(text);
    } catch {
      setDraft(text);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSend();
    }
  }

  return (
    <aside className="flex h-full w-full flex-col border-r border-slate-700/60 bg-[#1e293b]">
      <div className="border-b border-slate-700/60 px-5 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-200">Chat en vivo</h2>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-medium text-emerald-400">
              En línea
            </span>
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto px-4 py-4"
      >
        {isLoading && (
          <p className="pl-1 text-xs text-slate-500">Cargando mensajes...</p>
        )}

        {!isLoading && messages.length === 0 && (
          <p className="pl-1 text-xs text-slate-500">
            Aún no hay mensajes. Escribe para iniciar la conversación.
          </p>
        )}

        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}
      </div>

      {error && (
        <div className="border-t border-rose-900/40 bg-rose-950/40 px-4 py-2">
          <p className="text-xs text-rose-300">{error}</p>
        </div>
      )}

      <div className="border-t border-slate-700/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            type="text"
            placeholder="Escribe tu mensaje..."
            className="flex-1 rounded-full border border-slate-600/60 bg-slate-800/80 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-colors focus:border-blue-500"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!draft.trim() || isSending}
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

        <div className="mt-3 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="text-xs text-slate-500">Disponible 24/7</span>
        </div>
      </div>
    </aside>
  );
}
