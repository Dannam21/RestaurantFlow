import { AgentActivityPanel } from '../components/dashboard/AgentActivity'
import { AlertsPanel } from '../components/dashboard/AlertsPanel'
import { KitchenOrders } from '../components/dashboard/KitchenOrders'
import { LiveStats } from '../components/dashboard/LiveStats'
import { OrdersByStatus } from '../components/dashboard/OrdersByStatus'
import { OrdersTrend } from '../components/dashboard/OrdersTrend'
import { RestaurantLiveMap } from '../components/dashboard/RestaurantLiveMap'
import { AdminLayout } from '../components/layout/AdminLayout'

export function LiveView() {
  return <AdminLayout><div className="dashboard-intro"><div><span>OPERACIÓN EN TIEMPO REAL</span><h2>Vista en vivo</h2><p>Supervisa el salón, la cocina y el rendimiento desde un solo lugar.</p></div><span className="last-update"><i/> Actualizado hace 8 seg</span></div><div className="hero-grid"><RestaurantLiveMap/><aside className="right-column"><AgentActivityPanel/><KitchenOrders/></aside></div><LiveStats/><div className="bottom-grid"><AlertsPanel/><OrdersByStatus/><OrdersTrend/></div></AdminLayout>
}
