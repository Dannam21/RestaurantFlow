"use client";

import { useEffect, useState } from "react";
import type {
  NotificationLevel,
  OrderNotificationItem,
} from "@/src/hooks/useOrderNotifications";

interface OrderNotificationProps {
  notification: OrderNotificationItem;
  onDismiss: (id: string) => void;
}

const LEVEL_STYLES: Record<NotificationLevel, string> = {
  info: "border-orange-500/40 bg-orange-500/15 text-orange-100",
  warning: "border-amber-400/50 bg-amber-400/20 text-amber-100",
  success: "border-emerald-500/50 bg-emerald-500/20 text-emerald-100",
};

const LEVEL_ICON: Record<NotificationLevel, string> = {
  info: "⏳",
  warning: "🔔",
  success: "🔔",
};

export default function OrderNotification({
  notification,
  onDismiss,
}: OrderNotificationProps) {
  const isSuccess = notification.level === "success";
  const autoDismissMs = isSuccess ? 10000 : 5000;
  // Auto-hides the floating toast only; the notification stays in the bell
  // dropdown until the customer explicitly dismisses it from there.
  const [autoHidden, setAutoHidden] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setAutoHidden(true);
    }, autoDismissMs);
    return () => window.clearTimeout(timeoutId);
  }, [autoDismissMs]);

  if (autoHidden) return null;

  return (
    <div
      role="status"
      className={`animate-slide-in-top pointer-events-auto w-80 max-w-[90vw] rounded-xl border px-4 py-3 shadow-lg backdrop-blur ${LEVEL_STYLES[notification.level]}`}
    >
      <div className="flex items-start gap-3">
        <span className={`text-xl ${isSuccess ? "animate-bob-y" : ""}`}>
          {LEVEL_ICON[notification.level]}
        </span>
        <div className="min-w-0 flex-1">
          <p className={`font-semibold leading-snug ${isSuccess ? "text-base" : "text-sm"}`}>
            {notification.text}
          </p>
        </div>
        {isSuccess ? (
          <button
            type="button"
            onClick={() => onDismiss(notification.id)}
            className="shrink-0 rounded-lg border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-semibold transition-colors hover:bg-white/20"
          >
            Entendido
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onDismiss(notification.id)}
            aria-label="Cerrar notificación"
            className="shrink-0 text-sm opacity-60 transition-opacity hover:opacity-100"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
