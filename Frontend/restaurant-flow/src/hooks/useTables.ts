"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, getTables, type TableResponse } from "@/src/lib/api";

const POLL_INTERVAL_MS = 4000;

interface UseTablesOptions {
  enabled?: boolean;
}

export function useTables({ enabled = true }: UseTablesOptions = {}) {
  const [tables, setTables] = useState<TableResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTables = useCallback(async () => {
    try {
      const result = await getTables();
      setTables(result);
      setError(null);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo conectar con el servidor. Verifica tu conexión."
      );
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function initialLoad() {
      setIsLoading(true);
      await fetchTables();
      if (!cancelled) setIsLoading(false);
    }
    initialLoad();

    const intervalId = window.setInterval(fetchTables, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [enabled, fetchTables]);

  return { tables, isLoading, error, refetch: fetchTables };
}
