"use client";

import { useEffect, useRef, useState } from "react";
import { getOrder, sendMessage, type OrderResponse } from "@/src/lib/api";
import { resolveChatParticipantId } from "@/src/hooks/useChat";
import { useTables } from "@/src/hooks/useTables";
import {
  isNotificationsEnabled,
  playSound,
  shouldPlaySound,
  vibrate,
  type SoundKind,
} from "@/src/utils/notificationSound";
import type { AuthUser } from "@/src/types";

const POLL_INTERVAL_MS = 5000;

export type NotificationLevel = "info" | "warning" | "success";
export type NotificationThreshold = 25 | 50 | 75 | 90 | 100;

export interface OrderNotificationItem {
  id: string;
  threshold: NotificationThreshold;
  level: NotificationLevel;
  text: string;
  createdAt: number;
}

const THRESHOLDS: NotificationThreshold[] = [50, 100];

function levelForThreshold(threshold: NotificationThreshold): NotificationLevel {
  if (threshold === 100) return "success";
  if (threshold === 90) return "warning";
  return "info";
}

function soundForThreshold(threshold: NotificationThreshold): SoundKind {
  if (threshold === 100) return "tada";
  if (threshold === 90) return "alert";
  return "ding";
}

function dishLabel(order: OrderResponse): string {
  const items = (order.items ?? []) as { name?: unknown }[];
  if (items.length === 1 && typeof items[0]?.name === "string") {
    return items[0].name as string;
  }
  return "tu pedido";
}

function buildText(threshold: NotificationThreshold, order: OrderResponse): string {
  if (threshold === 100) {
    return `¡Tu ${dishLabel(order)} está lista! 🎉 El mesero la llevará en breve.`;
  }
  if (threshold === 90) {
    return "¡Tu orden está casi lista! 🔜 Solo 1-2 minutos más.";
  }
  return `Tu comida está al ${threshold}% ⏳`;
}

interface UseOrderNotificationsOptions {
  currentUser: AuthUser | null | undefined;
  enabled?: boolean;
}

export function useOrderNotifications({
  currentUser,
  enabled = true,
}: UseOrderNotificationsOptions) {
  const isActive = enabled && !!currentUser?.id;
  const { tables } = useTables({ enabled: isActive });
  const [currentOrder, setCurrentOrder] = useState<OrderResponse | null>(null);
  const [notifications, setNotifications] = useState<OrderNotificationItem[]>([]);
  const lastThresholdRef = useRef(0);
  const lastOrderIdRef = useRef<string | null>(null);

  const myTable = currentUser?.id
    ? tables.find(
        (table) => table.customer_id === currentUser.id && table.status !== "empty"
      )
    : undefined;
  const orderId = myTable?.order_id ?? null;
  const tableId = myTable?.id ?? null;

  useEffect(() => {
    if (!isActive || !orderId || tableId === null) {
      setCurrentOrder(null);
      return;
    }

    let cancelled = false;

    async function poll() {
      try {
        const order = await getOrder(orderId as string);
        if (cancelled) return;
        setCurrentOrder(order);

        if (lastOrderIdRef.current !== order.id) {
          lastOrderIdRef.current = order.id;
          const alreadyDone = order.status === "served" || order.status === "paid";
          lastThresholdRef.current = alreadyDone ? 100 : 0;
        }

        const progress = Math.min(100, Math.max(0, order.progress));
        const crossed = THRESHOLDS.filter(
          (threshold) => progress >= threshold && threshold > lastThresholdRef.current
        );
        if (crossed.length === 0) return;

        const threshold = crossed[crossed.length - 1];
        lastThresholdRef.current = threshold;

        const text = buildText(threshold, order);
        const notification: OrderNotificationItem = {
          id: `${order.id}-${threshold}-${Date.now()}`,
          threshold,
          level: levelForThreshold(threshold),
          text,
          createdAt: Date.now(),
        };
        setNotifications((prev) => [...prev, notification]);

        if (shouldPlaySound()) {
          playSound(soundForThreshold(threshold));
        }
        if (threshold === 100 && isNotificationsEnabled()) {
          vibrate([120, 60, 120]);
        }

        sendMessage({
          sender: "bot",
          sender_id: resolveChatParticipantId(currentUser ?? undefined),
          recipient_role: "client",
          table_id: tableId as number,
          text,
          message_type: "message",
        }).catch(() => {
          // Toast/sound already informed the customer even if this persists later.
        });
      } catch {
        // Transient network errors shouldn't spam the customer with error toasts.
      }
    }

    poll();
    const intervalId = window.setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [isActive, orderId, tableId, currentUser]);

  function dismissNotification(id: string) {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  }

  return {
    currentOrder,
    notifications,
    dismissNotification,
    tableId,
    tableStatus: myTable?.status ?? null,
  };
}
