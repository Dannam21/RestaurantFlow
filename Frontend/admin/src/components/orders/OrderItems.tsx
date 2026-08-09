import { AlertTriangle } from 'lucide-react'
import type { OrderDish } from '../../types/orders'
export function OrderItems({dishes}:{dishes:OrderDish[]}){return <section className="order-items"><h3>Platos ({dishes.length})</h3>{dishes.map(dish=><article key={dish.id}><i>{dish.icon}</i><div><strong>{dish.quantity}x {dish.name}</strong>{dish.note&&<small className={dish.alert?'dish-alert':''}>{dish.alert&&<AlertTriangle size={10}/>} {dish.note}</small>}</div></article>)}</section>}
