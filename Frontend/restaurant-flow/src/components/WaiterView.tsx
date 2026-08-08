"use client";

import { useState } from "react";
import WaiterMap from "@/src/components/WaiterMap";
import WaiterPanel from "@/src/components/WaiterPanel";
import WaiterSummaryBar from "@/src/components/WaiterSummaryBar";
import type { AvailableWaiter } from "@/src/types";

const WAITERS: AvailableWaiter[] = [
  { id: "w1", name: "Luis", online: true },
  { id: "w2", name: "Cami", online: true },
  { id: "w3", name: "Marcos", online: true },
  { id: "w4", name: "Valeria", online: false },
];

const INITIAL_ASSIGNMENTS: Record<string, string> = {
  "7": "w3",
};

export default function WaiterView() {
  const [assignments, setAssignments] = useState<Record<string, string>>(
    INITIAL_ASSIGNMENTS
  );

  function handleAssign(tableId: string, waiterId: string | null) {
    setAssignments((prev) => {
      const next = { ...prev };
      if (waiterId) {
        next[tableId] = waiterId;
      } else {
        delete next[tableId];
      }
      return next;
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="h-72 w-full shrink-0 md:h-full md:w-1/4 md:min-w-[320px]">
          <WaiterPanel />
        </div>
        <div className="h-full min-h-0 flex-1">
          <WaiterMap
            waiters={WAITERS}
            assignments={assignments}
            onAssign={handleAssign}
          />
        </div>
      </div>

      <WaiterSummaryBar waiters={WAITERS} assignments={assignments} />
    </div>
  );
}
