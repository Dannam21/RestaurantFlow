"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import AdminDashboard from "@/src/components/AdminDashboard";
import ChatPanel from "@/src/components/ChatPanel";
import ChefView from "@/src/components/ChefView";
import LoginScreen from "@/src/components/LoginScreen";
import Navbar from "@/src/components/Navbar";
import ReservationHistoryModal from "@/src/components/ReservationHistoryModal";
import RegisterScreen from "@/src/components/RegisterScreen";
import RestaurantMap from "@/src/components/RestaurantMap";
import WaiterView from "@/src/components/WaiterView";
import { useOrderNotifications } from "@/src/hooks/useOrderNotifications";
import type { AppRole, AuthUser } from "@/src/types";

type AuthMode = "login" | "register";
const AUTH_STORAGE_KEY = "restaurant-flow-auth";

interface PersistedAuthState {
  isAuthenticated: boolean;
  activeRole: AppRole;
  currentUser: AuthUser | null;
}

function subscribeToHydration() {
  return () => {};
}

function getInitialAuthState(): PersistedAuthState {
  if (typeof window === "undefined") {
    return {
      isAuthenticated: false,
      activeRole: "cliente",
      currentUser: null,
    };
  }

  const savedAuth = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!savedAuth) {
    return {
      isAuthenticated: false,
      activeRole: "cliente",
      currentUser: null,
    };
  }

  try {
    const parsedAuth = JSON.parse(savedAuth) as PersistedAuthState;
    if (!parsedAuth.isAuthenticated) {
      return {
        isAuthenticated: false,
        activeRole: "cliente",
        currentUser: null,
      };
    }

    return {
      isAuthenticated: true,
      activeRole: parsedAuth.activeRole ?? "cliente",
      currentUser: parsedAuth.currentUser ?? null,
    };
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return {
      isAuthenticated: false,
      activeRole: "cliente",
      currentUser: null,
    };
  }
}

export default function AppShell() {
  const [initialAuthState] = useState(getInitialAuthState);
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false
  );
  const [isAuthenticated, setIsAuthenticated] = useState(
    initialAuthState.isAuthenticated
  );
  const [showLogin, setShowLogin] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [activeRole, setActiveRole] = useState<AppRole>(
    initialAuthState.activeRole
  );
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(
    initialAuthState.currentUser
  );
  const [showReservationHistory, setShowReservationHistory] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }

    const authState: PersistedAuthState = {
      isAuthenticated,
      activeRole,
      currentUser,
    };
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
  }, [activeRole, currentUser, isAuthenticated]);

  function requireAuth() {
    setAuthMode("login");
    setShowLogin(true);
  }

  function closeAuth() {
    setShowLogin(false);
    setAuthMode("login");
  }

  const resolvedIsAuthenticated = isHydrated ? isAuthenticated : false;
  const resolvedRole = isHydrated ? activeRole : "cliente";
  const resolvedUser = isHydrated ? currentUser : null;

  const { notifications, dismissNotification, currentOrder, tableId, tableStatus } =
    useOrderNotifications({
      currentUser: resolvedUser,
      enabled: resolvedIsAuthenticated && resolvedRole === "cliente",
    });

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#0f172a]">
      <Navbar
        isAuthenticated={resolvedIsAuthenticated}
        activeRole={resolvedRole}
        currentUser={resolvedUser}
        notifications={notifications}
        onDismissNotification={dismissNotification}
        onLoginClick={requireAuth}
        onViewReservations={() => setShowReservationHistory(true)}
        onLogout={() => {
          setIsAuthenticated(false);
          setActiveRole("cliente");
          setCurrentUser(null);
          setShowReservationHistory(false);
        }}
      />

      {resolvedRole === "mesero" ? (
        <WaiterView />
      ) : resolvedRole === "admin" ? (
        <AdminDashboard />
      ) : resolvedRole === "chef" ? (
        <ChefView />
      ) : (
        <div className="relative min-h-0 flex-1">
          <RestaurantMap
            isAuthenticated={resolvedIsAuthenticated}
            onRequireAuth={requireAuth}
            currentUser={resolvedUser}
          />

          {isChatOpen ? (
            <div className="fixed bottom-6 right-6 z-40 flex h-[32rem] max-h-[75vh] w-96 max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-slate-700/60 shadow-2xl shadow-black/50">
              <ChatPanel
                isAuthenticated={resolvedIsAuthenticated}
                onRequireAuth={requireAuth}
                currentUser={resolvedUser}
                notifications={notifications}
                onDismissNotification={dismissNotification}
                currentOrder={currentOrder}
                myTableId={tableId}
                myTableStatus={tableStatus}
                onClose={() => setIsChatOpen(false)}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsChatOpen(true)}
              aria-label="Abrir chat"
              title="Abrir chat"
              className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-2xl text-white shadow-2xl shadow-black/40 transition-transform hover:scale-105 hover:bg-blue-500 active:scale-95"
            >
              💬
            </button>
          )}
        </div>
      )}

      {showLogin && authMode === "login" && (
        <LoginScreen
          onLogin={(role, user) => {
            setIsAuthenticated(true);
            setActiveRole(role);
            setCurrentUser(user ?? null);
            closeAuth();
          }}
          onClose={closeAuth}
          onSwitchToRegister={() => setAuthMode("register")}
        />
      )}

      {showLogin && authMode === "register" && (
        <RegisterScreen
          onRegistered={(user) => {
            setIsAuthenticated(true);
            setActiveRole("cliente");
            setCurrentUser(user);
            closeAuth();
          }}
          onClose={closeAuth}
          onSwitchToLogin={() => setAuthMode("login")}
        />
      )}

      {showReservationHistory && resolvedUser?.id ? (
        <ReservationHistoryModal
          customerId={resolvedUser.id}
          customerName={resolvedUser.name}
          onClose={() => setShowReservationHistory(false)}
        />
      ) : null}
    </div>
  );
}
