"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import logo from "@/assets/logo.png";
import { ApiError, loginCustomer, loginStaff } from "@/src/lib/api";
import { QUICK_LOGIN_OPTIONS, type QuickLoginOption } from "@/src/utils/quickLogin";
import type { AppRole, AuthUser } from "@/src/types";

interface LoginScreenProps {
  onLogin: (role: AppRole, user?: AuthUser) => void;
  onClose: () => void;
  onSwitchToRegister?: () => void;
}

const QUICK_LOGIN_STYLE: Record<QuickLoginOption["role"], string> = {
  cliente: "border-blue-500/40 bg-blue-500/10 text-blue-200 hover:bg-blue-500/20",
  admin: "border-violet-500/40 bg-violet-500/10 text-violet-200 hover:bg-violet-500/20",
  mesero: "border-orange-500/40 bg-orange-500/10 text-orange-200 hover:bg-orange-500/20",
  chef: "border-rose-500/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20",
};

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

  async function performLogin(
    targetRole: AppRole,
    targetEmail: string,
    targetPassword: string
  ) {
    if (isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    try {
      if (targetRole === "cliente") {
        const customer = await loginCustomer({
          email: targetEmail.trim().toLowerCase(),
          password: targetPassword,
        });
        onLogin(targetRole, {
          id: customer.id,
          name: customer.full_name,
          email: customer.email,
        });
      } else {
        const staff = await loginStaff({
          email: targetEmail.trim().toLowerCase(),
          password: targetPassword,
        });
        onLogin(targetRole, { id: staff.staff_id, name: staff.name, email: staff.email });
      }
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await performLogin(role, email, password);
  }

  function handleQuickLogin(option: QuickLoginOption) {
    setRole(option.role);
    setEmail(option.email);
    setPassword(option.password);
    void performLogin(option.role, option.email, option.password);
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
          <Image
            src={logo}
            alt="RestaurantFlow"
            className="h-20 w-20 select-none object-contain drop-shadow-lg"
            priority
          />
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
              <option value="chef">Chef</option>
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

        <div className="mt-5 border-t border-slate-800 pt-4">
          <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Quick login para demostración
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {QUICK_LOGIN_OPTIONS.map((option) => (
              <button
                key={option.role}
                type="button"
                onClick={() => handleQuickLogin(option)}
                disabled={isSubmitting}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${QUICK_LOGIN_STYLE[option.role]}`}
              >
                🔓 {option.label}
              </button>
            ))}
          </div>
        </div>

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
