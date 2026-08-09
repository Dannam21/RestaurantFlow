import { useState } from 'react'
import { kitchenTimes } from '../../data/mockReportsData'
import { ReportLineChart } from './ReportLineChart'
export function KitchenTimeChart(){const[tab,setTab]=useState<'average'|'max'>('average');return <section className="report-panel report-chart-panel"><header><h2>TIEMPO PROMEDIO DE COCINA</h2><div className="chart-tabs"><button className={tab==='average'?'active':''} onClick={()=>setTab('average')}>Promedio</button><button className={tab==='max'?'active':''} onClick={()=>setTab('max')}>Máximo</button></div></header><ReportLineChart data={kitchenTimes} color="#a855f7" max={40} mode={tab==='average'?'primary':'secondary'} valueSuffix=" min" ariaLabel="Tiempo de cocina por hora"/></section>}
