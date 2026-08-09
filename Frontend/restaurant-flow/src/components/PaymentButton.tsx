"use client";

import { useEffect, useState } from "react";
import { resolveChatParticipantId } from "@/src/hooks/useChat";
import { ApiError, sendMessage, type OrderResponse } from "@/src/lib/api";
import type { AuthUser } from "@/src/types";

interface PaymentButtonProps {
  tableId: number | null;
  order: OrderResponse | null;
  tableStatus: string | null;
  currentUser: AuthUser | null | undefined;
}

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

export default function PaymentButton({
  tableId,
  order,
  tableStatus,
  currentUser,
}: PaymentButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justRequested, setJustRequested] = useState(false);

  useEffect(() => {
    if (!showModal) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setShowModal(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showModal]);

  if (!tableId || !order) return null;

  const items = order.items ?? [];
  const total = items.reduce(
    (sum, item) => sum + (item.price ?? 0) * item.quantity,
    0
  );
  const alreadyPaying = tableStatus === "paying";

  async function handleConfirm() {
    if (!tableId || !order) return;
    setIsSending(true);
    setError(null);
    try {
      const participantId = resolveChatParticipantId(currentUser ?? undefined);
      await sendMessage({
        sender: "client",
        sender_id: participantId,
        recipient_role: "waiter",
        table_id: tableId,
        order_id: order.id,
        message_type: "customer_request",
        text: `Mesa ${tableId} pide la cuenta 🧾 (Total: ${formatCurrency(total)})`,
      });
      await sendMessage({
        sender: "bot",
        sender_id: participantId,
        recipient_role: "client",
        table_id: tableId,
        text: "Tu cuenta ha sido enviada al mesero 🧾. El mesero la llevará en breve.",
        message_type: "message",
      }).catch(() => {
        // The waiter-facing request already went out even if this echo fails.
      });
      setJustRequested(true);
      setShowModal(false);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "No se pudo enviar la solicitud."
      );
    } finally {
      setIsSending(false);
    }
  }

  const disabled = alreadyPaying || justRequested;

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        disabled={disabled}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:border-emerald-500/30 disabled:bg-emerald-500/10 disabled:text-emerald-300"
      >
        {disabled ? "Cuenta solicitada ✅" : "🧾 Pedir la Cuenta"}
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-sm rounded-2xl border border-slate-800 bg-[#1e293b] p-6 shadow-2xl shadow-black/40"
          >
            <button
              type="button"
              onClick={() => setShowModal(false)}
              aria-label="Cerrar"
              className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
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

            <h2 className="text-base font-bold text-white">
              Resumen de tu cuenta
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">Mesa {tableId}</p>

            <div className="mt-4 space-y-2">
              {items.length === 0 && (
                <p className="text-sm text-slate-500">Sin platos registrados.</p>
              )}
              {items.map((item, index) => (
                <div
                  key={`${item.name}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-700/50 bg-slate-950/40 px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate text-slate-200">{item.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {item.quantity} x {formatCurrency(item.price ?? 0)}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold text-white">
                    {formatCurrency((item.price ?? 0) * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-700/60 pt-3">
              <p className="text-sm font-semibold text-slate-300">Total</p>
              <p className="text-lg font-bold text-white">
                {formatCurrency(total)}
              </p>
            </div>

            {error && (
              <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSending}
              className="mt-4 flex w-full items-center justify-center rounded-xl bg-amber-600 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:cursor-not-allowed disabled:bg-slate-700"
            >
              {isSending ? "Enviando..." : "Confirmar Pago"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
