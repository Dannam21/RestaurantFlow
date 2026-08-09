"use client";

import { useEffect, useState } from "react";
import type { PaymentRequestItem } from "@/src/hooks/usePaymentNotifications";

interface PaymentNotificationProps {
  request: PaymentRequestItem;
  onAcknowledge: (request: PaymentRequestItem) => void;
  onDismiss: (id: string) => void;
  isProcessing?: boolean;
}

export default function PaymentNotification({
  request,
  onAcknowledge,
  onDismiss,
  isProcessing = false,
}: PaymentNotificationProps) {
  const [autoHidden, setAutoHidden] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setAutoHidden(true), 15000);
    return () => window.clearTimeout(timeoutId);
  }, []);

  if (autoHidden) return null;

  return (
    <div
      role="status"
      className="animate-slide-in-top pointer-events-auto w-80 max-w-[90vw] rounded-xl border border-orange-500/40 bg-orange-500/15 px-4 py-3 text-orange-100 shadow-lg backdrop-blur"
    >
      <div className="flex items-start gap-3">
        <span className="text-xl">🧾</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug">
            Mesa {request.tableId ?? "?"} solicita el pago
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => onAcknowledge(request)}
              disabled={isProcessing}
              className="rounded-lg border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-semibold transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isProcessing ? "Actualizando..." : "Llevar Cuenta"}
            </button>
            <button
              type="button"
              onClick={() => onDismiss(request.id)}
              className="rounded-lg px-2.5 py-1 text-xs text-orange-200/80 transition-colors hover:text-white"
            >
              Descartar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
