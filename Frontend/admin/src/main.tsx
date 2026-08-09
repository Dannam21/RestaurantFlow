import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { LiveView } from './pages/LiveView'
import { OrdersPage } from './pages/OrdersPage'
import { StaffPage } from './pages/StaffPage'
import { ReportsPage } from './pages/ReportsPage'
import { SettingsPage } from './pages/SettingsPage'
import './styles/admin.css'

const normalizedPath = window.location.pathname.replace(/\/+$/, '')
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {normalizedPath === '/admin/orders' ? <OrdersPage /> : normalizedPath === '/admin/staff' ? <StaffPage /> : normalizedPath === '/admin/reports' ? <ReportsPage /> : normalizedPath === '/admin/settings' ? <SettingsPage /> : <LiveView />}
  </StrictMode>,
)
