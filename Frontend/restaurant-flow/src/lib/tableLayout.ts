import type { TableStatus } from "@/src/components/Table";
import type { BackendTableStatus } from "@/src/lib/api";
import type { TableAlert } from "@/src/types";

export const TABLE_POSITIONS: Record<number, { x: string; y: string }> = {
  1: { x: "32%", y: "31%" },
  2: { x: "46%", y: "31%" },
  3: { x: "60%", y: "31%" },
  4: { x: "74%", y: "31%" },
  5: { x: "88%", y: "31%" },

  6: { x: "32%", y: "51%" },
  7: { x: "46%", y: "51%" },
  8: { x: "60%", y: "51%" },
  9: { x: "74%", y: "51%" },
  10: { x: "88%", y: "51%" },
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
