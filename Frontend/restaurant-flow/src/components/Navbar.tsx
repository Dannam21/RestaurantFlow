"use client";

import { useEffect, useRef, useState } from "react";
import type { AppRole, AuthUser } from "@/src/types";

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("es-ES", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDate(date: Date) {
  const weekday = capitalize(
    date.toLocaleDateString("es-ES", { weekday: "long" })
  );
  const month = capitalize(date.toLocaleDateString("es-ES", { month: "long" }));
  return `${weekday}, ${date.getDate()} de ${month}`;
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5">
      <path
        d="M12 3a5 5 0 0 0-5 5v2.6c0 .6-.2 1.1-.6 1.6L5 14.5c-.7.9-.1 2.5 1.1 2.5h11.8c1.2 0 1.8-1.6 1.1-2.5l-1.4-2.3c-.4-.5-.6-1-.6-1.6V8a5 5 0 0 0-5-5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 20a2.5 2.5 0 0 0 5 0"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5">
      <path
        d="M4 12c0-4.4 3.8-8 8.5-8s8.5 3.6 8.5 8-3.8 8-8.5 8c-1 0-2-.2-2.9-.5L5 21l1.4-3.9C4.9 15.7 4 13.9 4 12Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path
        d="M15 17.25V19a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1.75"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 12h11m0 0-3-3m3 3-3 3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface NavbarProps {
  isAuthenticated: boolean;
  activeRole: AppRole;
  currentUser?: AuthUser | null;
  onLoginClick?: () => void;
  onLogout?: () => void;
  onViewReservations?: () => void;
}

export default function Navbar({
  isAuthenticated,
  activeRole,
  currentUser,
  onLoginClick,
  onLogout,
  onViewReservations,
}: NavbarProps) {
  const [now, setNow] = useState<Date | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const updateNow = () => setNow(new Date());
    const timeoutId = window.setTimeout(updateNow, 0);
    const intervalId = window.setInterval(updateNow, 1000 * 30);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }

    window.addEventListener("mousedown", handleOutsideClick);
    return () => window.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const roleLabel =
    activeRole === "cliente"
      ? "Cliente"
      : activeRole === "mesero"
        ? "Mesero"
        : "Admin";
  const canViewReservations =
    activeRole === "cliente" && Boolean(currentUser?.id) && Boolean(onViewReservations);

  return (
    <header className="flex h-14 w-full shrink-0 items-center justify-between border-b border-slate-800 bg-[#0b1120] px-4">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-base shadow-md shadow-amber-900/30">
          🍴
        </span>

        <h1 className="whitespace-nowrap text-base font-bold text-white">
          Restaurant<span className="text-orange-500">Flow</span>
        </h1>

        <span className="hidden h-5 w-px bg-slate-700 sm:block" />

        <span className="hidden items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20 sm:flex">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          En vivo
        </span>

        <div className="hidden min-w-[12rem] items-baseline gap-2 md:flex">
          <span className="text-sm font-semibold text-white">
            {now ? formatTime(now) : ""}
          </span>
          <span className="text-xs text-slate-400">
            {now ? formatDate(now) : ""}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Notificaciones"
          className="relative flex h-8 w-8 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
        >
          <BellIcon />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-[#0b1120]">
            3
          </span>
        </button>

        <button
          type="button"
          aria-label="Mensajes"
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
        >
          <ChatIcon />
        </button>

          <span className="mx-2 h-5 w-px bg-slate-700" />

        {isAuthenticated ? (
          <div className="flex items-center gap-1">
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((value) => !value)}
                className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-slate-800"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-rose-500 text-xs font-bold text-white">
                  {(currentUser?.name ?? roleLabel).charAt(0).toUpperCase()}
                </span>
                <span className="hidden text-left leading-tight sm:block">
                  <span className="block text-xs font-semibold text-white">
                    {currentUser?.name ?? roleLabel}
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    Vista: {roleLabel}
                  </span>
                </span>
                <span className="text-xs text-slate-400">▾</span>
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-52 rounded-2xl border border-slate-700 bg-slate-900 p-2 shadow-2xl">
                  {canViewReservations ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onViewReservations?.();
                      }}
                      className="flex w-full rounded-xl px-3 py-2 text-left text-sm text-slate-200 transition-colors hover:bg-slate-800"
                    >
                      Ver mis reservas
                    </button>
                  ) : (
                    <p className="px-3 py-2 text-sm text-slate-500">
                      Sin opciones disponibles
                    </p>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onLogout}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <LogoutIcon />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onLoginClick}
            className="rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-500"
          >
            Iniciar sesión
          </button>
        )}
      </div>
    </header>
  );
}
