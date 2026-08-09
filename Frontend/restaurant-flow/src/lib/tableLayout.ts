import type { TableStatus } from "@/src/components/Table";
import type { BackendTableStatus } from "@/src/lib/api";
import type { TableAlert } from "@/src/types";

export const TABLE_POSITIONS: Record<number, { x: string; y: string }> = {
  1: { x: "33%", y: "37%" },
  2: { x: "43%", y: "37%" },
  3: { x: "53%", y: "37%" },
  4: { x: "63%", y: "37%" },
  5: { x: "73%", y: "37%" },

  6: { x: "33%", y: "48%" },
  7: { x: "43%", y: "48%" },
  8: { x: "53%", y: "48%" },
  9: { x: "63%", y: "48%" },
  10: { x: "73%", y: "48%" },
};

export const BACKEND_TO_UI_STATUS: Record<BackendTableStatus, TableStatus> = {
  empty: "vacio",
  waiting_order: "ocupado",
  cooking: "ocupado",
  eating: "comiendo",
  paying: "pagando",
};

export function minutesSince(iso: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
}

export function getTableAlert(status: BackendTableStatus): TableAlert | undefined {
  if (status === "waiting_order") {
    return { tone: "amber", icon: "⏳", label: "Esperando pedido" };
  }
  if (status === "cooking") {
    return { tone: "sky", icon: "👨‍🍳", label: "Pedido en cocina" };
  }
  if (status === "eating") {
    return { tone: "emerald", icon: "🍽️", label: "Comiendo" };
  }
  if (status === "paying") {
    return { tone: "rose", icon: "💳", label: "Cuenta en proceso" };
  }
  return undefined;
}
