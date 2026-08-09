"use client";

import Image from "next/image";
import { useState } from "react";
import restaurantBg from "@/assets/fondorestaurante.png";
import queueRope from "@/assets/fila.png";
import chef from "@/assets/cocina/chef.png";
import cocinaMesa from "@/assets/cocina/mesa.png";
import Table from "@/src/components/Table";
import WaitingList from "@/src/components/WaitingList";
import MenuButton from "@/src/components/MenuButton";
import MenuModal from "@/src/components/MenuModal";
import MyOrderModal from "@/src/components/MyOrderModal";
import PartySizeModal from "@/src/components/PartySizeModal";
import { useContainSize } from "@/src/hooks/useContainSize";
import { useTables } from "@/src/hooks/useTables";
import { useWaitlist } from "@/src/hooks/useWaitlist";
import { ApiError, updateTable } from "@/src/lib/api";
import { TABLE_POSITIONS, BACKEND_TO_UI_STATUS, minutesSince } from "@/src/lib/tableLayout";
import type { AuthUser } from "@/src/types";

interface RestaurantMapProps {
  isAuthenticated: boolean;
  onRequireAuth: () => void;
  currentUser: AuthUser | null;
}

export default function RestaurantMap({
  isAuthenticated,
  onRequireAuth,
  currentUser,
}: RestaurantMapProps) {
  const { tables, refetch } = useTables();
  const waitlist = useWaitlist();
  const { containerRef, size } = useContainSize(3 / 2);

  const [reserveTableId, setReserveTableId] = useState<number | null>(null);
  const [isReserving, setIsReserving] = useState(false);
  const [reserveError, setReserveError] = useState<string | null>(null);

  const [showQueueModal, setShowQueueModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showMyOrder, setShowMyOrder] = useState(false);
  const [seatedMessage, setSeatedMessage] = useState<string | null>(null);

  const myActiveTable = currentUser?.id
    ? tables.find(
        (table) => table.customer_id === currentUser.id && table.status !== "empty"
      )
    : undefined;

  function handleReserveClick(tableId: number) {
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    if (myActiveTable && myActiveTable.id !== tableId) {
      setSeatedMessage(`Ya tienes la mesa ${myActiveTable.id} reservada.`);
      return;
    }
    setReserveError(null);
    setReserveTableId(tableId);
  }

  async function handleConfirmReserve(partySize: number) {
    if (reserveTableId === null) return;
    setIsReserving(true);
    setReserveError(null);
    try {
      await updateTable(reserveTableId, {
        status: "waiting_order",
        customers: partySize,
        customer_id: currentUser?.id ?? null,
      });
      setReserveTableId(null);
      refetch();
    } catch (err) {
      setReserveError(
        err instanceof ApiError
          ? err.message
          : "No se pudo reservar la mesa. Intenta de nuevo."
      );
    } finally {
      setIsReserving(false);
    }
  }

  function handleJoinQueueClick() {
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    if (myActiveTable) {
      setSeatedMessage(`Ya tienes la mesa ${myActiveTable.id} reservada.`);
      return;
    }
    setShowQueueModal(true);
  }

  async function handleConfirmJoinQueue(partySize: number, fullName?: string) {
    try {
      const result = await waitlist.join(partySize, {
        full_name: currentUser?.name ?? fullName ?? "Cliente",
        email: currentUser?.email ?? null,
        customer_id: currentUser?.id ?? null,
      });
      setShowQueueModal(false);
      if (result.kind === "seated") {
        setSeatedMessage(
          `¡Mesa ${result.tableId} reservada! Alguien del equipo vendrá a ubicarlos.`
        );
        refetch();
      }
    } catch {
      // waitlist.error already carries the message for the modal
    }
  }

  const reservingTable = tables.find((table) => table.id === reserveTableId);

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#0f172a]"
    >
      <MenuButton onClick={() => setShowMenu(true)} />

      <div
        className="relative"
        style={{
          width: size.width || "100%",
          height: size.height || "100%",
        }}
      >
        <Image
          src={restaurantBg}
          alt="Restaurante El Sabor visto desde arriba"
          fill
          priority
          className="select-none object-contain"
        />

        {tables.map((table) => {
          const position = TABLE_POSITIONS[table.id];
          if (!position) return null;

          const isMine = table.id === myActiveTable?.id;

          return (
            <Table
              key={table.id}
              id={String(table.id)}
              x={position.x}
              y={position.y}
              status={BACKEND_TO_UI_STATUS[table.status]}
              numPersonas={table.customers}
              sinceMinutes={
                table.status === "empty" ? undefined : minutesSince(table.updated_at)
              }
              hoverHint={
                table.status === "empty"
                  ? "Si quieres reservar, dale click."
                  : isMine
                    ? "Toca para ver el estado de tu pedido."
                    : undefined
              }
              ownerBadge={isMine ? "Tu mesa" : undefined}
              onClick={() => {
                if (table.status === "empty") {
                  handleReserveClick(table.id);
                  return;
                }
                if (isMine) {
                  setShowMyOrder(true);
                }
              }}
            />
          );
        })}

        <Image
          src={chef}
          alt="Chef"
          className="pointer-events-none absolute z-10 h-auto w-[4%] select-none object-contain drop-shadow-[0_6px_6px_rgba(0,0,0,0.5)]"
          style={{ top: "8%", left: "63%" }}
        />

        <Image
          src={cocinaMesa}
          alt="Mesa de la cocina"
          className="pointer-events-none absolute z-10 h-auto w-[30%] select-none object-contain"
          style={{ top: "5%", left: "40%" }}
        />

        <Image
          src={queueRope}
          alt="Fila de espera"
          className="pointer-events-none absolute z-10 h-auto w-[18%] select-none object-contain"
          style={{ top: "65%", left: "11%" }}
        />
        <Image
          src={queueRope}
          alt="Fila de espera"
          className="pointer-events-none absolute z-10 h-auto w-[18%] select-none object-contain"
          style={{ top: "65%", left: "25%" }}
        />

        <WaitingList
          isAuthenticated={isAuthenticated}
          activeCount={waitlist.activeCount}
          myEntry={waitlist.myEntry}
          isLeaving={waitlist.isLeaving}
          onJoinClick={handleJoinQueueClick}
          onLeave={() => waitlist.leave()}
        />

        {seatedMessage && (
          <div className="absolute left-1/2 top-4 z-40 w-max max-w-[90%] -translate-x-1/2 rounded-xl border border-emerald-500/40 bg-emerald-950/90 px-4 py-2.5 text-sm text-emerald-200 shadow-xl">
            <div className="flex items-center gap-3">
              <span>{seatedMessage}</span>
              <button
                type="button"
                onClick={() => setSeatedMessage(null)}
                className="text-emerald-300/70 transition-colors hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {reserveTableId !== null && (
        <PartySizeModal
          title={`Reservar mesa ${reserveTableId}`}
          maxSize={reservingTable?.capacity ?? 4}
          isSubmitting={isReserving}
          error={reserveError}
          onConfirm={handleConfirmReserve}
          onClose={() => setReserveTableId(null)}
        />
      )}

      {showQueueModal && (
        <PartySizeModal
          title="Unirme a la fila"
          description="Te avisaremos apenas tengamos una mesa lista para tu grupo."
          maxSize={12}
          isSubmitting={waitlist.isJoining}
          error={waitlist.error}
          requireName={!currentUser}
          onConfirm={handleConfirmJoinQueue}
          onClose={() => setShowQueueModal(false)}
        />
      )}

      {showMenu && <MenuModal onClose={() => setShowMenu(false)} />}

      {showMyOrder && myActiveTable && (
        <MyOrderModal
          tableId={myActiveTable.id}
          orderId={myActiveTable.order_id}
          onClose={() => setShowMyOrder(false)}
        />
      )}
    </div>
  );
}
