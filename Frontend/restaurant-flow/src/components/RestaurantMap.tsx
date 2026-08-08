"use client";

import Image from "next/image";
import { useState } from "react";
import restaurantBg from "@/assets/fondorestaurante.png";
import queueRope from "@/assets/fila.png";
import chef from "@/assets/cocina/chef.png";
import cocinaMesa from "@/assets/cocina/mesa.png";
import persona1 from "@/assets/personas/persona1.png";
import persona2 from "@/assets/personas/persona2.png";
import Table, { type TableStatus } from "@/src/components/Table";

interface TableSeed {
  id: string;
  x: string;
  y: string;
  status: TableStatus;
  numPersonas: number;
  sinceMinutes?: number;
}

const INITIAL_TABLES: TableSeed[] = [
  { id: "1", x: "33%", y: "29%", status: "comiendo", numPersonas: 2, sinceMinutes: 18 },
  { id: "2", x: "58%", y: "30%", status: "ocupado", numPersonas: 4, sinceMinutes: 6 },
  { id: "3", x: "88%", y: "30%", status: "pagando", numPersonas: 2, sinceMinutes: 42 },
  { id: "4", x: "41%", y: "47%", status: "vacio", numPersonas: 0 },
  { id: "5", x: "68%", y: "45%", status: "comiendo", numPersonas: 3, sinceMinutes: 11 },
  { id: "6", x: "90%", y: "48%", status: "ocupado", numPersonas: 4, sinceMinutes: 3 },
];

interface RestaurantMapProps {
  isAuthenticated: boolean;
  onRequireAuth: () => void;
}

export default function RestaurantMap({
  isAuthenticated,
  onRequireAuth,
}: RestaurantMapProps) {
  const [tables, setTables] = useState<TableSeed[]>(INITIAL_TABLES);

  function handleReserve(id: string) {
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }

    setTables((prev) =>
      prev.map((table) =>
        table.id === id
          ? { ...table, status: "ocupado", numPersonas: 2, sinceMinutes: 0 }
          : table
      )
    );
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#0f172a]">
      <div className="relative aspect-[3/2] max-h-full w-full max-w-full">
        <Image
          src={restaurantBg}
          alt="Restaurante El Sabor visto desde arriba"
          fill
          priority
          className="select-none object-contain"
        />

        {tables.map((table) => (
          <Table
            key={table.id}
            id={table.id}
            x={table.x}
            y={table.y}
            status={table.status}
            numPersonas={table.numPersonas}
            sinceMinutes={table.sinceMinutes}
            onReserve={() => handleReserve(table.id)}
          />
        ))}


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
          src={persona1}
          alt="Persona esperando en la fila"
          className="pointer-events-none absolute z-10 h-auto w-[3.5%] select-none object-contain drop-shadow-[0_6px_6px_rgba(0,0,0,0.5)]"
          style={{ top: "62%", left: "15%" }}
        />
        <Image
          src={persona2}
          alt="Persona esperando en la fila"
          className="pointer-events-none absolute z-10 h-auto w-[3.6%] select-none object-contain drop-shadow-[0_6px_6px_rgba(0,0,0,0.5)]"
          style={{ top: "62%", left: "20%" }}
        />

        <Image
          src={queueRope}
          alt="Fila de espera"
          className="pointer-events-none absolute z-20 h-auto w-[18%] select-none object-contain"
          style={{ top: "65%", left: "11%" }}
        />
        <Image
          src={queueRope}
          alt="Fila de espera"
          className="pointer-events-none absolute z-20 h-auto w-[18%] select-none object-contain"
          style={{ top: "65%", left: "25%" }}
        />
      </div>
    </div>
  );
}
