import { ChefHat, TrendingUp, UserRound, UsersRound, Wine } from 'lucide-react'
import { staffSummary } from '../../data/mockStaffData'
const icons=[UsersRound,UserRound,ChefHat,Wine,TrendingUp]
export function StaffSummaryCards(){return <section className="staff-summary">{staffSummary.map((item,index)=>{const Icon=icons[index];return <article className={`staff-summary-${item.tone}`} key={item.id}><i><Icon size={18}/></i><div><strong>{item.value}</strong><span>{item.label}</span></div></article>})}</section>}
