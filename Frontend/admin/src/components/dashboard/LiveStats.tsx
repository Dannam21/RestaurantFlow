import { stats } from '../../data/mockAdminData'
import { MetricCard } from '../ui/MetricCard'

export function LiveStats() { return <section className="stats-block"><div className="section-title"><span>Rendimiento actual</span><h2>ESTADÍSTICAS EN VIVO</h2></div><div className="stats-grid">{stats.map(stat => <MetricCard key={stat.label} stat={stat}/>)}</div></section> }
