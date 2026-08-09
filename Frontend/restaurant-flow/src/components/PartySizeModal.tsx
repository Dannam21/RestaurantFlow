"use client";

import { useState, type FormEvent } from "react";

interface PartySizeModalProps {
  title: string;
  description?: string;
  maxSize?: number;
  isSubmitting?: boolean;
  error?: string | null;
  requireName?: boolean;
  onConfirm: (partySize: number, fullName?: string) => void;
  onClose: () => void;
}

const DEFAULT_MAX_SIZE = 12;

export default function PartySizeModal({
  title,
  description,
  maxSize = DEFAULT_MAX_SIZE,
  isSubmitting = false,
  error,
  requireName = false,
  onConfirm,
  onClose,
}: PartySizeModalProps) {
  const [partySize, setPartySize] = useState(2);
  const [fullName, setFullName] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    if (requireName && !fullName.trim()) return;
    onConfirm(partySize, requireName ? fullName.trim() : undefined);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-2xl border border-slate-800 bg-[#1e293b] p-8 shadow-2xl shadow-black/40">
        <button
          type="button"
          onClick={onClose}
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

        <div className="flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-2xl shadow-lg shadow-amber-900/30">
            🍽️
          </span>
          <h1 className="mt-4 text-xl font-bold text-white">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-slate-400">{description}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          {requireName && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="partyFullName" className="text-xs font-medium text-slate-300">
                Nombre
              </label>
              <input
                id="partyFullName"
                type="text"
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Tu nombre"
                className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-colors focus:border-blue-500"
              />
            </div>
          )}

          <div className="flex flex-col items-center gap-3">
            <label className="text-xs font-medium text-slate-300">
              ¿Cuántas personas son?
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setPartySize((prev) => Math.max(1, prev - 1))}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-900/60 text-lg font-semibold text-white transition-colors hover:bg-slate-800"
              >
                −
              </button>
              <span className="w-10 text-center text-2xl font-bold text-white">
                {partySize}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPartySize((prev) => Math.min(maxSize, prev + 1))
                }
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-900/60 text-lg font-semibold text-white transition-colors hover:bg-slate-800"
              >
                +
              </button>
            </div>
            {partySize >= maxSize && (
              <p className="text-center text-[11px] text-slate-500">
                ¿Grupo más grande? Habla directamente con el personal.
              </p>
            )}
          </div>

          {error && (
            <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Confirmando..." : "Confirmar"}
          </button>
        </form>
      </div>
    </div>
  );
}
