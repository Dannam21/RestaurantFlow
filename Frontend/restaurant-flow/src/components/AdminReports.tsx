"use client";

import AlertsPanel from "@/src/components/AlertsPanel";
import OrderStatusPie from "@/src/components/OrderStatusPie";
import OrdersChart from "@/src/components/OrdersChart";
import PeakHours from "@/src/components/PeakHours";
import ReportCards from "@/src/components/ReportCards";
import SalesByCategory from "@/src/components/SalesByCategory";
import SalesChart from "@/src/components/SalesChart";
import TableRotation from "@/src/components/TableRotation";
import TopDishes from "@/src/components/TopDishes";
import { useReportsData } from "@/src/hooks/useReportsData";

export default function AdminReports() {
  const {
    stats,
    alerts,
    salesByHour,
    cookingTimeByHour,
    ordersByStatus,
    topDishes,
    salesByCategory,
    peakHours,
    error,
  } = useReportsData();

  return (
    <div className="h-full w-full overflow-y-auto bg-[#0f172a] p-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-4">
          <ReportCards stats={stats} />

          {error && (
            <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
              {error}
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <SalesChart data={salesByHour} />
            <OrdersChart data={cookingTimeByHour} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <OrderStatusPie data={ordersByStatus} />
            <SalesByCategory data={salesByCategory} />
            <TableRotation />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <TopDishes data={topDishes} />
            <PeakHours data={peakHours} />
          </div>
        </div>

        <div className="lg:h-full">
          <AlertsPanel alerts={alerts} />
        </div>
      </div>
    </div>
  );
}
