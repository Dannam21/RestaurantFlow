import { Bell, Settings } from 'lucide-react'

export function AdminHeader() {
  return (
    <header className="admin-header">
      <div className="header-title"><h1>RestaurantFlow</h1><span>Panel de Administración</span></div>
      <div className="live-clock"><span className="live-pill"><i /> En vivo</span><strong>1:12 p. m.</strong><span>Sábado, 8 de Agosto</span></div>
      <div className="admin-profile">
        <button type="button" aria-label="Notificaciones" className="icon-button"><Bell size={19} /><b>3</b></button>
        <button type="button" aria-label="Configuración" className="icon-button"><Settings size={19} /></button>
        <span className="avatar">A</span><div><strong>Admin</strong><small>Gerente</small></div>
      </div>
    </header>
  )
}
