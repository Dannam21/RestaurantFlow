"use client";

import { useState } from "react";
import ChatPanel from "@/src/components/ChatPanel";
import LoginScreen from "@/src/components/LoginScreen";
import Navbar from "@/src/components/Navbar";
import RestaurantMap from "@/src/components/RestaurantMap";

export default function AppShell() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  function requireAuth() {
    setShowLogin(true);
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#0f172a]">
      <Navbar
        isAuthenticated={isAuthenticated}
        onLoginClick={requireAuth}
        onLogout={() => setIsAuthenticated(false)}
      />

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="h-72 w-full shrink-0 md:h-full md:w-1/4 md:min-w-[320px]">
          <ChatPanel
            isAuthenticated={isAuthenticated}
            onRequireAuth={requireAuth}
          />
        </div>
        <div className="h-full min-h-0 flex-1">
          <RestaurantMap
            isAuthenticated={isAuthenticated}
            onRequireAuth={requireAuth}
          />
        </div>
      </div>

      {showLogin && (
        <LoginScreen
          onLogin={() => {
            setIsAuthenticated(true);
            setShowLogin(false);
          }}
          onClose={() => setShowLogin(false)}
        />
      )}
    </div>
  );
}
