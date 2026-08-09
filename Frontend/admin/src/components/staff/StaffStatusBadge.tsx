import type { StaffStatus } from '../../types/staff'
const labels:Record<StaffStatus,string>={available:'Disponible',serving:'Atendiendo',busy:'Muy ocupado',delivering:'En entrega',offline:'Offline'}
export function StaffStatusBadge({status}:{status:StaffStatus}){return <span className={`staff-status status-${status}`}><i/>{labels[status]}</span>}
