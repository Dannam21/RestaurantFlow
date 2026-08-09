import { Clock3, Utensils } from 'lucide-react'
import { kitchenOrders } from '../../data/mockAdminData'

export function KitchenOrders() {
  return <section className="panel side-panel"><div className="panel-heading"><div><span className="eyebrow">PRODUCCIÓN</span><h2>ÓRDENES EN COCINA</h2></div><Utensils size={18}/></div><div className="kitchen-orders">{kitchenOrders.map(order => <article key={order.id} className="order-row"><div className="order-top"><strong>{order.id}</strong><span>{order.table}</span><small><Clock3 size={12}/> ETA: {order.eta} min</small></div><p>{order.dish}</p><div className="progress-copy"><span>Progreso</span><b>{order.progress}%</b></div><div className="progress"><i style={{width:`${order.progress}%`}}/></div></article>)}</div></section>
}
