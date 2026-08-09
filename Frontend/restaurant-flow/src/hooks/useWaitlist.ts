"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ApiError,
  getWaitlistEntry,
  joinWaitlist,
  listWaitlistEntries,
  updateWaitlistEntry,
  type WaitlistEntryResponse,
  type WaitlistJoinRequest,
} from "@/src/lib/api";

const POLL_INTERVAL_MS = 5000;
const ENTRY_STORAGE_KEY = "restaurantflow_waitlist_entry_id";
const FINAL_STATUSES = new Set(["seated", "cancelled"]);

export interface JoinIdentity {
  full_name: string;
  email?: string | null;
  customer_id?: string | null;
}

export type JoinResult =
  | { kind: "seated"; tableId: number }
  | { kind: "queued"; entry: WaitlistEntryResponse };

interface UseWaitlistOptions {
  enabled?: boolean;
}

export function useWaitlist({ enabled = true }: UseWaitlistOptions = {}) {
  const [activeCount, setActiveCount] = useState(0);
  const [myEntry, setMyEntry] = useState<WaitlistEntryResponse | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const entryIdRef = useRef<string | null>(null);

  useEffect(() => {
    entryIdRef.current = window.localStorage.getItem(ENTRY_STORAGE_KEY);
  }, []);

  const fetchActiveCount = useCallback(async () => {
    try {
      const entries = await listWaitlistEntries({ active_only: true });
      setActiveCount(entries.length);
    } catch {
      // ambient count is best-effort; keep the last known value on failure
    }
  }, []);

  const fetchMyEntry = useCallback(async () => {
    const entryId = entryIdRef.current;
    if (!entryId) return;

    try {
      const entry = await getWaitlistEntry(entryId);
      if (FINAL_STATUSES.has(entry.status)) {
        setMyEntry(entry.status === "seated" ? entry : null);
        entryIdRef.current = null;
        window.localStorage.removeItem(ENTRY_STORAGE_KEY);
      } else {
        setMyEntry(entry);
      }
    } catch {
      entryIdRef.current = null;
      window.localStorage.removeItem(ENTRY_STORAGE_KEY);
      setMyEntry(null);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    fetchActiveCount();
    fetchMyEntry();

    const intervalId = window.setInterval(() => {
      fetchActiveCount();
      fetchMyEntry();
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [enabled, fetchActiveCount, fetchMyEntry]);

  const join = useCallback(
    async (partySize: number, identity: JoinIdentity): Promise<JoinResult> => {
      setIsJoining(true);
      setError(null);
      try {
        const payload: WaitlistJoinRequest = {
          full_name: identity.full_name,
          email: identity.email ?? null,
          customer_id: identity.customer_id ?? null,
          party_size: partySize,
        };
        const response = await joinWaitlist(payload);

        if (response.outcome === "seated" && response.table_id !== null) {
          entryIdRef.current = null;
          window.localStorage.removeItem(ENTRY_STORAGE_KEY);
          setMyEntry(null);
          return { kind: "seated", tableId: response.table_id };
        }

        if (response.entry) {
          entryIdRef.current = response.entry.id;
          window.localStorage.setItem(ENTRY_STORAGE_KEY, response.entry.id);
          setMyEntry(response.entry);
          return { kind: "queued", entry: response.entry };
        }

        throw new Error("Respuesta inesperada del servidor");
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : "No se pudo unir a la fila. Intenta de nuevo.";
        setError(message);
        throw err;
      } finally {
        setIsJoining(false);
      }
    },
    []
  );

  const leave = useCallback(async () => {
    const entryId = entryIdRef.current;
    if (!entryId) return;

    setIsLeaving(true);
    setError(null);
    try {
      await updateWaitlistEntry(entryId, { status: "cancelled" });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo salir de la fila. Intenta de nuevo."
      );
      throw err;
    } finally {
      entryIdRef.current = null;
      window.localStorage.removeItem(ENTRY_STORAGE_KEY);
      setMyEntry(null);
      setIsLeaving(false);
    }
  }, []);

  return { activeCount, myEntry, isJoining, isLeaving, error, join, leave };
}
