import { CheckCircle2, ChefHat, CirclePlus, CookingPot, PackageCheck } from 'lucide-react'
import { orderKpis } from '../../data/mockOrdersData'
const icons=[CirclePlus,ChefHat,CookingPot,CheckCircle2,PackageCheck]
export function OrdersSummary(){return <section className="orders-summary" aria-label="Resumen de órdenes">{orderKpis.map((kpi,index)=>{const Icon=icons[index];return <article className={`summary-${kpi.tone}`} key={kpi.label}><i><Icon size={17}/></i><div><strong>{kpi.value}</strong><span>{kpi.label}</span></div></article>})}</section>}
