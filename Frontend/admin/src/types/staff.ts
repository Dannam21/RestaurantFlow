export type StaffRole='waiter'|'chef'|'head_chef'|'bartender'|'other'
export type StaffStatus='available'|'serving'|'busy'|'delivering'|'offline'
export interface StaffMember{id:string;name:string;role:StaffRole;roleLabel:string;status:StaffStatus;avatar:string;assignedTables:number[];activeOrders:number;performance:number}
export interface StaffSummaryItem{id:string;label:string;value:string;tone:'neutral'|'green'|'blue'|'purple'|'orange'}
export interface WorkloadStats{average:number;low:number;medium:number;high:number}
export interface PerformanceEntry{id:string;name:string;avatar:string;performance:number}
export interface RecentStaffActivity{id:string;time:string;type:'order'|'delivery'|'kitchen';description:string}
export interface StaffMapMarker{id:string;name:string;detail:string;status:StaffStatus;x:number;y:number;avatar:string}
