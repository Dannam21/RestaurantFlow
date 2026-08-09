import type { ReactNode } from 'react'
import { AdminHeader } from './AdminHeader'
import { AdminSidebar } from './AdminSidebar'

export function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="admin-shell"><AdminSidebar /><div className="admin-workspace"><AdminHeader /><main>{children}</main></div></div>
}
