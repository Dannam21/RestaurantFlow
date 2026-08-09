"use client";

import WaiterKitchenOrdersPanel from "@/src/components/WaiterKitchenOrdersPanel";

export default function ChefView() {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center bg-[#0f172a] p-6">
      <div className="h-full w-full max-w-md">
        <WaiterKitchenOrdersPanel />
      </div>
    </div>
  );
}
