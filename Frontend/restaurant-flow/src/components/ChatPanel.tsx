"use client";

import { useEffect, useRef, useState } from "react";
import Message from "@/src/components/Message";
import type { ChatMessageType } from "@/src/types";

function nowLabel() {
  return new Date().toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const INITIAL_MESSAGES: ChatMessageType[] = [
  {
    id: "1",
    sender: "bot",
    text: "¡Bienvenido! 👋\n\nPuedes escribir aquí si tienes alguna consulta sobre tu orden, el menú o cualquier otra cosa.",
    time: "12:30 PM",
  },
  {
    id: "2",
    sender: "user",
    text: "Hola, ¿cuánto tiempo falta para mi orden?",
    time: "12:31 PM",
    status: "read",
  },
  {
    id: "3",
    sender: "bot",
    text: "Tu orden está en preparación.\nTiempo estimado: ~4 minutos 👨‍🍳",
    time: "12:31 PM",
  },
  {
    id: "4",
    sender: "user",
    text: "Perfecto, gracias!",
    time: "12:31 PM",
    status: "read",
  },
  {
    id: "5",
    sender: "bot",
    text: "¡De nada! Te avisaremos cuando esté lista. 🎉",
    time: "12:32 PM",
  },
];

const BOT_REPLIES: { keywords: string[]; reply: string }[] = [
  {
    keywords: ["mesa", "espera", "cuanto falta", "tiempo"],
    reply: "Tu mesa se está preparando. El tiempo estimado de espera es de ~12 minutos. Te avisaremos apenas esté lista 🔔",
  },
  {
    keywords: ["menu", "carta", "plato", "comida"],
    reply: "Puedes ver nuestro menú completo en el mostrador de la entrada. ¿Buscas alguna recomendación en especial? 🍽️",
  },
  {
    keywords: ["gracias"],
    reply: "¡Con mucho gusto! Estamos para ayudarte 😊",
  },
  {
    keywords: ["orden", "pedido"],
    reply: "Tu orden está en camino a la cocina. Te mantendré al tanto de cualquier actualización 👨‍🍳",
  },
];

const DEFAULT_REPLY =
  "¡Gracias por tu mensaje! Un miembro de nuestro equipo lo revisará en breve. Mientras tanto, ¿hay algo más en lo que pueda ayudarte?";

function pickReply(userText: string) {
  const normalized = userText.toLowerCase();
  const match = BOT_REPLIES.find((entry) =>
    entry.keywords.some((keyword) => normalized.includes(keyword))
  );
  return match?.reply ?? DEFAULT_REPLY;
}

interface ChatPanelProps {
  isAuthenticated: boolean;
  onRequireAuth: () => void;
}

export default function ChatPanel({
  isAuthenticated,
  onRequireAuth,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>(INITIAL_MESSAGES);
  const [draft, setDraft] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isTyping]);

  function handleSend() {
    const text = draft.trim();
    if (!text) return;

    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }

    const userMessage: ChatMessageType = {
      id: crypto.randomUUID(),
      sender: "user",
      text,
      time: nowLabel(),
      status: "sent",
    };

    setMessages((prev) => [...prev, userMessage]);
    setDraft("");
    setIsTyping(true);

    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          sender: "bot",
          text: pickReply(text),
          time: nowLabel(),
        },
      ]);
      setIsTyping(false);
    }, 1100 + Math.random() * 600);
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
        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}

        {isTyping && (
          <div className="flex animate-fade-in-up items-center gap-2 pl-1">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-sm">
              👨‍🍳
            </span>
            <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-slate-700/70 px-4 py-3">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
            </div>
          </div>
        )}
      </div>

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

        <div className="mt-3 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="text-xs text-slate-500">Disponible 24/7</span>
        </div>
      </div>
    </aside>
  );
}
