"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ApiError,
  getMessages,
  sendMessage,
  type MessageResponse,
} from "@/src/lib/api";
import type { ChatMessageType } from "@/src/types";

const POLL_INTERVAL_MS = 3000;
const CUSTOMER_ID_KEY = "restaurantflow_customer_id";

function getCustomerId(): string {
  if (typeof window === "undefined") return "anonymous";
  let id = window.localStorage.getItem(CUSTOMER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(CUSTOMER_ID_KEY, id);
  }
  return id;
}

function toChatMessage(message: MessageResponse): ChatMessageType {
  return {
    id: message.id,
    sender: message.sender === "client" ? "user" : "bot",
    text: message.text,
    time: new Date(message.created_at).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    status: message.sender === "client" ? "sent" : undefined,
  };
}

interface UseChatOptions {
  tableId?: number;
  enabled?: boolean;
}

export function useChat({ tableId, enabled = true }: UseChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const customerIdRef = useRef<string>("");
  const knownIdsRef = useRef<Set<string>>(new Set());

  const applyMessages = useCallback((incoming: MessageResponse[]) => {
    let changed = false;
    for (const message of incoming) {
      if (!knownIdsRef.current.has(message.id)) {
        knownIdsRef.current.add(message.id);
        changed = true;
      }
    }
    if (!changed) return;

    setMessages(() => incoming.map(toChatMessage));
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const history = await getMessages({ table_id: tableId, limit: 50 });
      applyMessages(history);
      setError(null);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo conectar con el servidor. Verifica tu conexión."
      );
    }
  }, [applyMessages, tableId]);

  useEffect(() => {
    if (!enabled) return;
    if (!customerIdRef.current) {
      customerIdRef.current = getCustomerId();
    }

    let cancelled = false;

    async function initialLoad() {
      setIsLoading(true);
      await fetchMessages();
      if (!cancelled) setIsLoading(false);
    }
    initialLoad();

    const intervalId = window.setInterval(fetchMessages, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [enabled, fetchMessages]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      setIsSending(true);
      setError(null);
      try {
        const created = await sendMessage({
          sender: "client",
          sender_id: customerIdRef.current || getCustomerId(),
          recipient_role: "waiter",
          table_id: tableId,
          text: trimmed,
          message_type: "message",
        });
        knownIdsRef.current.add(created.id);
        setMessages((prev) => [...prev, toChatMessage(created)]);
      } catch (err) {
        setError(
          err instanceof ApiError
            ? err.message
            : "No se pudo enviar el mensaje. Inténtalo de nuevo."
        );
        throw err;
      } finally {
        setIsSending(false);
      }
    },
    [tableId]
  );

  return { messages, isLoading, isSending, error, sendMessage: send };
}
