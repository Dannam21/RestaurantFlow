export type TableStatus = 'served' | 'eating' | 'waiting' | 'paying' | 'empty' | 'guest-waiting' | 'delayed'

export interface AdminTable {
  id: number
  name: string
  status: TableStatus
  statusLabel: string
  order?: string
  progress?: number
  seats: number
  position: { x: number; y: number }
}

export interface KitchenOrder {
  id: string
  table: string
  dish: string
  progress: number
  eta: number
}

export interface AgentActivity {
  name: string
  activity: string
  detail?: string
  state: 'healthy' | 'warning'
  sparkline: number[]
}

export interface RestaurantAlert {
  title: string
  description: string
  level: 'danger' | 'warning' | 'success'
}

export interface DashboardStat {
  label: string
  value: string
  detail: string
  trend?: 'up' | 'down'
  accent?: 'orange' | 'green' | 'purple' | 'blue'
}

export interface OrderStatusMetric {
  label: string
  value: number
  percentage: number
  color: string
}
