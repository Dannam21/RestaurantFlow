import type { AdminOrder, OrderStatus } from '../../types/orders'
import { OrderCard } from './OrderCard'
const titles:Record<OrderStatus,string>={new:'NUEVAS',kitchen:'EN COCINA',preparing:'PREPARANDO',ready:'LISTAS',delivered:'ENTREGADAS'}
export function OrdersColumn({status,orders,selectedId,onSelect}:{status:OrderStatus;orders:AdminOrder[];selectedId:string;onSelect:(order:AdminOrder)=>void}){return <section className={`orders-column column-${status}`}><header><i/><h3>{titles[status]}</h3><span>{orders.length} órdenes</span></header><div className="column-orders">{orders.map(order=><OrderCard key={order.id} order={order} selected={order.id===selectedId} onSelect={onSelect}/>)}</div><button className="view-all" type="button">Ver todas →</button></section>}
