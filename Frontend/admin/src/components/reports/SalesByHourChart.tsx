import { useState } from 'react'
import { salesByHour } from '../../data/mockReportsData'
import { ReportLineChart } from './ReportLineChart'
export function SalesByHourChart(){const[tab,setTab]=useState<'sales'|'orders'>('sales');return <section className="report-panel report-chart-panel"><header><h2>VENTAS POR HORA</h2><div className="chart-tabs"><button className={tab==='sales'?'active':''} onClick={()=>setTab('sales')}>Ventas (S/)</button><button className={tab==='orders'?'active':''} onClick={()=>setTab('orders')}>Órdenes</button></div></header><ReportLineChart data={salesByHour} color="#ff8a00" max={tab==='sales'?1200:32} mode={tab==='sales'?'primary':'secondary'} valuePrefix={tab==='sales'?'S/ ':''} ariaLabel={tab==='sales'?'Ventas por hora':'Órdenes por hora'}/></section>}
