import { ChefHat, ClipboardList, Coins, Receipt, Star, TableProperties } from 'lucide-react'
import { reportSummary } from '../../data/mockReportsData'
const icons={sales:Coins,orders:ClipboardList,ticket:Receipt,kitchen:ChefHat,rating:Star,tables:TableProperties}
export function ReportsSummaryCards(){return <section className="reports-summary">{reportSummary.map(item=>{const Icon=icons[item.icon];return <article key={item.id}><header><span>{item.label}</span><i><Icon size={15}/></i></header><strong>{item.value}</strong><small className={`change-${item.tone}`}>{item.change}</small></article>})}</section>}
