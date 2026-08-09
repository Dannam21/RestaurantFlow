import { Activity } from 'lucide-react'
import { OrderFilters } from './OrderFilters'
export function OrdersHeader(){return <div className="orders-page-header"><div><span><Activity size={13}/> OPERACIÓN EN TIEMPO REAL</span><h2>Órdenes en vivo</h2><p><i/> Actualizado hace 2 seg</p></div><OrderFilters/></div>}
