import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import type { DashboardStat } from '../../types/admin'

export function MetricCard({ stat }: { stat: DashboardStat }) {
  return (
    <article className={`metric-card metric-${stat.accent ?? 'orange'}`}>
      <span>{stat.label}</span>
      <strong>{stat.value}</strong>
      <small className={stat.trend ? `trend-${stat.trend}` : ''}>
        {stat.trend === 'up' && <ArrowUpRight size={13} />}
        {stat.trend === 'down' && <ArrowDownRight size={13} />}
        {stat.detail}
      </small>
    </article>
  )
}
