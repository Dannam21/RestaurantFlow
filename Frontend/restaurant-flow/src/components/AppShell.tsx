"use client";

import { useState } from "react";
import ChatPanel from "@/src/components/ChatPanel";
import LoginScreen from "@/src/components/LoginScreen";
import Navbar from "@/src/components/Navbar";
import RestaurantMap from "@/src/components/RestaurantMap";

export default function AppShell() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

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

      <div className="flex min-h-0 flex-1">
        <div className="h-full min-h-0 flex-1">
          <RestaurantMap
            isAuthenticated={isAuthenticated}
            onRequireAuth={requireAuth}
          />
        </div>
      </div>

      {isChatOpen && (
        <div className="fixed bottom-20 right-4 z-50 h-[480px] w-[340px] rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
          <ChatPanel
            isAuthenticated={isAuthenticated}
            onRequireAuth={requireAuth}
          />
        </div>
      )}

      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-500 transition-all active:scale-95"
        aria-label="Abrir chat"
      >
        {isChatOpen ? (
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
          </svg>
        )}
      </button>

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