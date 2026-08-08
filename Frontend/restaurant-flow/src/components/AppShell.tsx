"use client";

import { useState } from "react";
import AdminPanel from "@/src/components/AdminPanel";
import ChatPanel from "@/src/components/ChatPanel";
import LoginScreen from "@/src/components/LoginScreen";
import Navbar from "@/src/components/Navbar";
import RegisterScreen from "@/src/components/RegisterScreen";
import RestaurantMap from "@/src/components/RestaurantMap";
import WaiterView from "@/src/components/WaiterView";
import type { AppRole, AuthUser } from "@/src/types";

type AuthMode = "login" | "register";

export default function AppShell() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [activeRole, setActiveRole] = useState<AppRole>("cliente");
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  function requireAuth() {
    setAuthMode("login");
    setShowLogin(true);
  }

  function closeAuth() {
    setShowLogin(false);
    setAuthMode("login");
  }

  function renderSidePanel() {
    if (activeRole === "admin") {
      return <AdminPanel />;
    }

    return (
      <ChatPanel
        isAuthenticated={isAuthenticated}
        onRequireAuth={requireAuth}
      />
    );
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#0f172a]">
      <Navbar
        isAuthenticated={isAuthenticated}
        activeRole={activeRole}
        currentUser={currentUser}
        onLoginClick={requireAuth}
        onLogout={() => {
          setIsAuthenticated(false);
          setActiveRole("cliente");
          setCurrentUser(null);
        }}
      />

      {activeRole === "mesero" ? (
        <WaiterView />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <div className="h-72 w-full shrink-0 md:h-full md:w-1/4 md:min-w-[320px]">
            {renderSidePanel()}
          </div>
          <div className="h-full min-h-0 flex-1">
            <RestaurantMap
              isAuthenticated={isAuthenticated}
              onRequireAuth={requireAuth}
            />
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
    </div>
  );
}
