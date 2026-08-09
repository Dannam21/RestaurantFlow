"use client";

import { useEffect, useRef, useState } from "react";
import { getMessages } from "@/src/lib/api";
import { isNotificationsEnabled, playSound } from "@/src/utils/notificationSound";

const POLL_INTERVAL_MS = 3000;

export interface PaymentRequestItem {
  id: string;
  tableId: number | null;
  text: string;
  createdAt: number;
}

interface UsePaymentNotificationsOptions {
  enabled?: boolean;
}

export function usePaymentNotifications({
  enabled = true,
}: UsePaymentNotificationsOptions = {}) {
  const [requests, setRequests] = useState<PaymentRequestItem[]>([]);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    if (startedAtRef.current === null) {
      startedAtRef.current = Date.now();
    }
    const startedAt = startedAtRef.current;

    let cancelled = false;

    async function poll() {
      try {
        const messages = await getMessages({
          recipient_role: "waiter",
          message_type: "customer_request",
          limit: 20,
        });
        if (cancelled) return;

        for (const message of messages) {
          if (knownIdsRef.current.has(message.id)) continue;
          knownIdsRef.current.add(message.id);

          const createdAtMs = new Date(message.created_at).getTime();
          // Skip requests that already existed before this hook mounted, so
          // reloading the waiter view doesn't replay old history as alerts.
          if (createdAtMs < startedAt) continue;

          const item: PaymentRequestItem = {
            id: message.id,
            tableId: message.table_id,
            text: message.text,
            createdAt: createdAtMs,
          };
          setRequests((prev) => [...prev, item]);

          if (isNotificationsEnabled()) {
            playSound("alert");
          }
        }
      } catch {
        // Transient network errors shouldn't spam the waiter with error toasts.
      }
    }

    poll();
    const intervalId = window.setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [enabled]);

  function dismissRequest(id: string) {
    setRequests((prev) => prev.filter((request) => request.id !== id));
  }

  return { requests, dismissRequest };
}
