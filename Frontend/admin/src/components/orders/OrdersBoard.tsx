import type { AdminOrder, OrderStatus } from '../../types/orders'
import { OrdersColumn } from './OrdersColumn'
const statuses:OrderStatus[]=['new','kitchen','preparing','ready']
export function OrdersBoard({orders,selectedId,onSelect}:{orders:AdminOrder[];selectedId:string;onSelect:(order:AdminOrder)=>void}){return <div className="orders-board">{statuses.map(status=><OrdersColumn key={status} status={status} orders={orders.filter(order=>order.status===status)} selectedId={selectedId} onSelect={onSelect}/>)}</div>}
