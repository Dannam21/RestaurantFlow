"use client";

import { useState, type FormEvent } from "react";
import { ApiError, registerCustomer } from "@/src/lib/api";
import type { AuthUser } from "@/src/types";

interface RegisterScreenProps {
  onRegistered: (user: AuthUser) => void;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export default function RegisterScreen({
  onRegistered,
  onClose,
  onSwitchToLogin,
}: RegisterScreenProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRegisterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setError(null);

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setIsSubmitting(true);
    try {
      const customer = await registerCustomer({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      onRegistered({ id: customer.id, name: customer.full_name, email: customer.email });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo completar el registro. Intenta de nuevo."
      );
    } finally {
      setIsSubmitting(false);
    }
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
            🍴
          </span>
          <h1 className="mt-4 text-xl font-bold text-white">
            Restaurant<span className="text-orange-500">Flow</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">Crea tu cuenta de cliente</p>
        </div>

        <form onSubmit={handleRegisterSubmit} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="fullName" className="text-xs font-medium text-slate-300">
              Nombre completo
            </label>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              required
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Juan Pérez"
              className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-colors focus:border-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="registerEmail" className="text-xs font-medium text-slate-300">
              Correo
            </label>
            <input
              id="registerEmail"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@correo.com"
              className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-colors focus:border-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="registerPassword" className="text-xs font-medium text-slate-300">
              Contraseña
            </label>
            <input
              id="registerPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-colors focus:border-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirmPassword" className="text-xs font-medium text-slate-300">
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repite tu contraseña"
              className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-colors focus:border-blue-500"
            />
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
            {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <span>¿Ya tienes cuenta?</span>
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-semibold text-blue-400 transition-colors hover:text-blue-300"
          >
            Inicia sesión
          </button>
        </div>
      </div>
    </div>
  );
}
