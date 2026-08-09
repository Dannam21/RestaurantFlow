import { BarChart3, ChefHat, ClipboardList, LayoutDashboard, Settings, Store, UserRoundCheck } from 'lucide-react'

const navigation = [
  { icon: LayoutDashboard, label: 'Vista en vivo', route: '/admin/' },
  { icon: ClipboardList, label: 'Órdenes', route: '/admin/orders', badge: 18 },
  { icon: UserRoundCheck, label: 'Personal', route: '/admin/staff' },
  { icon: BarChart3, label: 'Reportes', route: '/admin/reports' },
  { icon: Settings, label: 'Configuración', route: '/admin/settings' },
] as const

export function AdminSidebar() {
  const currentPath = window.location.pathname.replace(/\/+$/, '') || '/admin'
  return (
    <aside className="admin-sidebar">
      <div className="brand"><span className="brand-mark"><ChefHat size={21} /></span><div><strong>Restaurant<span>Flow</span></strong><small>ADMIN CONSOLE</small></div></div>
      <nav aria-label="Navegación de administrador">
        <span className="nav-caption">OPERACIÓN</span>
        {navigation.map(({ icon: Icon, label, route, ...item }) => {
          const normalizedRoute = route.replace(/\/+$/, '')
          const active = currentPath === normalizedRoute
          return <a key={label} href={route} className={active ? 'nav-item active' : 'nav-item'} aria-current={active ? 'page' : undefined}><Icon size={18} strokeWidth={1.8} /><span>{label}</span>{'badge' in item && <b className="nav-badge">{item.badge}</b>}{active && <i />}</a>
        })}
      </nav>
      <div className="sidebar-footer">
        <section className="location-card"><Store size={18} /><div><strong>Restaurante El Sabor</strong><small>ID: RS-001</small></div><span>Abierto</span></section>
        <section className="shift-card"><small>TURNO ACTUAL</small><strong>11:00 a. m. - 3:00 p. m.</strong><div><i /> En curso</div></section>
      </div>
    </aside>
  )
}
