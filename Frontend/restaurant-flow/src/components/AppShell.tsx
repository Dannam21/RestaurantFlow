"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import AdminMap from "@/src/components/AdminMap";
import AdminPanel from "@/src/components/AdminPanel";
import ChatPanel from "@/src/components/ChatPanel";
import LoginScreen from "@/src/components/LoginScreen";
import Navbar from "@/src/components/Navbar";
import ReservationHistoryModal from "@/src/components/ReservationHistoryModal";
import RegisterScreen from "@/src/components/RegisterScreen";
import RestaurantMap from "@/src/components/RestaurantMap";
import WaiterView from "@/src/components/WaiterView";
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

  function renderSidePanel() {
    if (resolvedRole === "admin") {
      return <AdminPanel />;
    }

    return (
      <ChatPanel
        isAuthenticated={resolvedIsAuthenticated}
        onRequireAuth={requireAuth}
        currentUser={resolvedUser}
      />
    );
  }

  const resolvedIsAuthenticated = isHydrated ? isAuthenticated : false;
  const resolvedRole = isHydrated ? activeRole : "cliente";
  const resolvedUser = isHydrated ? currentUser : null;

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#0f172a]">
      <Navbar
        isAuthenticated={resolvedIsAuthenticated}
        activeRole={resolvedRole}
        currentUser={resolvedUser}
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
      ) : (
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <div className="h-72 w-full shrink-0 md:h-full md:w-1/4 md:min-w-[320px]">
            {renderSidePanel()}
          </div>
          <div className="h-full min-h-0 flex-1">
            {resolvedRole === "admin" ? (
              <AdminMap />
            ) : (
              <RestaurantMap
                isAuthenticated={resolvedIsAuthenticated}
                onRequireAuth={requireAuth}
                currentUser={resolvedUser}
              />
            )}
          </div>
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
