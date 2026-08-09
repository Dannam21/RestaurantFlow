import type { AdminTable, AgentActivity, DashboardStat, KitchenOrder, OrderStatusMetric, RestaurantAlert } from '../types/admin'

export const tables: AdminTable[] = [
  { id: 1, name: 'Mesa 1', status: 'served', statusLabel: 'Servido', seats: 4, position: { x: 25, y: 35 } },
  { id: 2, name: 'Mesa 2', status: 'eating', statusLabel: 'Comiendo', order: 'Orden #123', progress: 60, seats: 4, position: { x: 51, y: 35 } },
  { id: 3, name: 'Mesa 3', status: 'waiting', statusLabel: 'Esperando orden', seats: 2, position: { x: 77, y: 35 } },
  { id: 4, name: 'Mesa 4', status: 'paying', statusLabel: 'Pagando', seats: 4, position: { x: 25, y: 70 } },
  { id: 5, name: 'Mesa 5', status: 'empty', statusLabel: 'Vacío', seats: 2, position: { x: 51, y: 70 } },
  { id: 6, name: 'Mesa 6', status: 'guest-waiting', statusLabel: 'Cliente esperando', seats: 4, position: { x: 77, y: 70 } },
]

export const agents: AgentActivity[] = [
  { name: 'Analizador', activity: 'Procesando 3 órdenes', state: 'healthy', sparkline: [4, 8, 6, 11, 9, 14] },
  { name: 'Priorizador', activity: 'Reordenando cola...', state: 'healthy', sparkline: [7, 5, 9, 8, 12, 11] },
  { name: 'Predictor', activity: 'Recalculando tiempos...', state: 'healthy', sparkline: [3, 7, 5, 10, 8, 13] },
  { name: 'Supervisor', activity: 'Detectó 1 retraso', detail: 'Mesa 2 excede 5 min', state: 'warning', sparkline: [5, 5, 6, 7, 12, 14] },
]

export const kitchenOrders: KitchenOrder[] = [
  { id: '#123', table: 'Mesa 2', dish: 'Pasta Alfredo', progress: 60, eta: 2 },
  { id: '#124', table: 'Mesa 4', dish: 'Pizza Pepperoni', progress: 30, eta: 6 },
  { id: '#125', table: 'Mesa 6', dish: 'Ensalada César', progress: 40, eta: 4 },
]

export const stats: DashboardStat[] = [
  { label: 'Total órdenes', value: '48', detail: 'Hoy', accent: 'orange' },
  { label: 'Completadas hoy', value: '36', detail: '75% del total', accent: 'green' },
  { label: 'Promedio tiempo', value: '18 min', detail: '4 min vs ayer', trend: 'down', accent: 'blue' },
  { label: 'Ingresos', value: '$2,450', detail: '15% vs ayer', trend: 'up', accent: 'green' },
  { label: 'Satisfacción', value: '4.8 / 5', detail: '★★★★★', accent: 'orange' },
  { label: 'Capacidad', value: '60%', detail: '12 / 20 mesas', accent: 'purple' },
]

export const alerts: RestaurantAlert[] = [
  { title: 'Mesa 2: Retraso de 5 min', description: 'Orden #123 excede el tiempo estimado', level: 'danger' },
  { title: '3 órdenes en espera >10 min', description: 'Órdenes #120, #118, #115', level: 'warning' },
  { title: 'Cocina operando normal', description: 'Todos los sistemas funcionando correctamente', level: 'success' },
]

export const orderStatuses: OrderStatusMetric[] = [
  { label: 'Cocinando', value: 12, percentage: 25, color: '#ff8a00' },
  { label: 'Listas', value: 8, percentage: 17, color: '#27c281' },
  { label: 'Esperando', value: 15, percentage: 31, color: '#f3c451' },
  { label: 'Completadas', value: 13, percentage: 27, color: '#7459e8' },
]

export const trendPoints = [9, 18, 41, 48, 35]
export const trendLabels = ['6 a.m.', '9 a.m.', '12 p.m.', '3 p.m.', '6 p.m.']
