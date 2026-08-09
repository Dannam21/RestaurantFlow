"use client";

import { useState, type FormEvent } from "react";
import { ApiError, loginCustomer } from "@/src/lib/api";
import type { AppRole, AuthUser } from "@/src/types";

interface LoginScreenProps {
  onLogin: (role: AppRole, user?: AuthUser) => void;
  onClose: () => void;
  onSwitchToRegister?: () => void;
}

export default function LoginScreen({
  onLogin,
  onClose,
  onSwitchToRegister,
}: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AppRole>("cliente");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setError(null);

    if (role !== "cliente") {
      setIsSubmitting(true);
      window.setTimeout(() => {
        onLogin(role);
      }, 700);
      return;
    }

    setIsSubmitting(true);
    try {
      const customer = await loginCustomer({
        email: email.trim().toLowerCase(),
        password,
      });
      onLogin(role, { id: customer.id, name: customer.full_name, email: customer.email });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo iniciar sesión. Intenta de nuevo."
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
          <p className="mt-1 text-sm text-slate-400">
            Inicia sesión para continuar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="role" className="text-xs font-medium text-slate-300">
              Vista inicial
            </label>
            <select
              id="role"
              value={role}
              onChange={(event) => setRole(event.target.value as AppRole)}
              className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-blue-500"
            >
              <option value="cliente">Cliente</option>
              <option value="mesero">Mesero</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-xs font-medium text-slate-300"
            >
              Correo
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@restaurante.com"
              className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-colors focus:border-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-xs font-medium text-slate-300"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
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
            {isSubmitting ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>
        </form>

        {onSwitchToRegister && (
          <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <span>¿No tienes cuenta?</span>
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="font-semibold text-blue-400 transition-colors hover:text-blue-300"
            >
              Regístrate
            </button>
          </div>
        )}

        <div className="mt-5 flex items-center justify-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="text-xs text-slate-500">Disponible 24/7</span>
        </div>
      </div>
    </div>
  );
}
