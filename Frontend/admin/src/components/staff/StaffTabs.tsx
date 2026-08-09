export type StaffTab='all'|'waiters'|'kitchen'|'other'
const tabs:[StaffTab,string][]=[['all','Todos'],['waiters','Meseros'],['kitchen','Cocina'],['other','Barman / Otros']]
export function StaffTabs({active,onChange}:{active:StaffTab;onChange:(tab:StaffTab)=>void}){return <div className="staff-tabs" role="tablist" aria-label="Filtrar personal">{tabs.map(([id,label])=><button key={id} type="button" role="tab" aria-selected={active===id} className={active===id?'active':''} onClick={()=>onChange(id)}>{label}</button>)}</div>}
