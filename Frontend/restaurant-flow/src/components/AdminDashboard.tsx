"use client";

import AdminAgentsPanel from "@/src/components/AdminAgentsPanel";
import AdminMap from "@/src/components/AdminMap";
import AdminSidebar from "@/src/components/AdminSidebar";
import AdminStatsFooter from "@/src/components/AdminStatsFooter";
import KitchenOrdersPanel from "@/src/components/KitchenOrdersPanel";

export default function AdminDashboard() {
  return (
    <div className="flex h-full w-full overflow-hidden bg-[#0f172a]">
      <div className="h-full w-64 shrink-0">
        <AdminSidebar />
      </div>

      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <div className="h-full min-h-0 flex-1">
            <AdminMap />
          </div>

          <div className="flex h-72 w-full shrink-0 flex-col gap-3 p-3 lg:h-full lg:w-[26rem] lg:shrink-0">
            <div className="h-[45%] min-h-0">
              <AdminAgentsPanel />
            </div>
            <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-800">
              <KitchenOrdersPanel />
            </div>
          </div>
        </div>

        <AdminStatsFooter />
      </div>
    </div>
  );
}
