"use client";

import { useEffect, useRef, useState } from "react";
import Message from "@/src/components/Message";
import MenuModal from "@/src/components/MenuModal";
import PaymentButton from "@/src/components/PaymentButton";
import { useChat } from "@/src/hooks/useChat";
import type { OrderResponse } from "@/src/lib/api";
import {
  isNotificationsEnabled,
  setNotificationsEnabled,
} from "@/src/utils/notificationSound";
import type { AuthUser } from "@/src/types";

interface ChatPanelProps {
  isAuthenticated: boolean;
  onRequireAuth: () => void;
  tableId?: number;
  currentUser?: AuthUser | null;
  currentOrder?: OrderResponse | null;
  myTableId?: number | null;
  myTableStatus?: string | null;
  onClose?: () => void;
}

export default function ChatPanel({
  isAuthenticated,
  onRequireAuth,
  tableId,
  currentUser,
  currentOrder,
  myTableId,
  myTableStatus,
  onClose,
}: ChatPanelProps) {
  const { messages, isLoading, isSending, error, sendMessage } = useChat({
    tableId,
    enabled: isAuthenticated,
    currentUser: currentUser ?? undefined,
  });
  const [draft, setDraft] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [notificationsOn, setNotificationsOn] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNotificationsOn(isNotificationsEnabled());
  }, []);

  function toggleNotifications() {
    const next = !notificationsOn;
    setNotificationsOn(next);
    setNotificationsEnabled(next);
  }

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
    <aside className="flex h-full w-full flex-col bg-[#1e293b]">
      <div className="border-b border-slate-700/60 px-5 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-200">Chat en vivo</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-xs font-medium text-emerald-400">
                En línea
              </span>
            </div>
            <button
              type="button"
              onClick={toggleNotifications}
              aria-label={
                notificationsOn
                  ? "Silenciar notificaciones"
                  : "Activar notificaciones"
              }
              title={
                notificationsOn
                  ? "Silenciar notificaciones"
                  : "Activar notificaciones"
              }
              className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-700/60 hover:text-white"
            >
              {notificationsOn ? "🔔" : "🔕"}
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar chat"
                title="Cerrar chat"
                className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-700/60 hover:text-white"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                  <path
                    d="M6 6l12 12M18 6 6 18"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {myTableId && currentOrder && (
        <div className="border-b border-slate-700/60 px-4 py-3">
          <PaymentButton
            tableId={myTableId}
            order={currentOrder}
            tableStatus={myTableStatus ?? null}
            currentUser={currentUser}
          />
        </div>
      )}

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
          <Message
            key={message.id}
            message={message}
            onOpenMenu={() => setShowMenu(true)}
          />
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

      {showMenu && <MenuModal onClose={() => setShowMenu(false)} />}
    </aside>
  );
}
