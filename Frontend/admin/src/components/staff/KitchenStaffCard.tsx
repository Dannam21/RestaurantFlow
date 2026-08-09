import { CookingPot } from 'lucide-react'
import type { StaffMember } from '../../types/staff'
import { StaffStatusBadge } from './StaffStatusBadge'
export function KitchenStaffCard({staff}:{staff:StaffMember}){return <article className="kitchen-staff-card"><span className="pixel-avatar"><img src={staff.avatar} alt=""/></span><div><strong>{staff.name}</strong><small>{staff.roleLabel}</small><StaffStatusBadge status={staff.status}/></div><span className="kitchen-orders"><CookingPot size={12}/><strong>{staff.activeOrders}</strong><small>órdenes</small></span><span className="kitchen-score">{staff.performance}%</span></article>}
