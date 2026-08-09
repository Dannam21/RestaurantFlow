import { Crown } from 'lucide-react'
import { peakHours } from '../../data/mockReportsData'
export function PeakHours(){return <section className="report-panel peak-hours"><header><div><h2>HORAS PICO</h2><p>Identificamos tus horas de mayor actividad</p></div></header><div>{peakHours.map(hour=><article className={hour.highlighted?'highlighted':''} key={hour.range}>{hour.highlighted&&<Crown size={11}/>}<span>{hour.range}</span><strong>{hour.orders}</strong><small>órdenes</small></article>)}</div></section>}
