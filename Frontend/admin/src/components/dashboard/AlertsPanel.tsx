import { AlertTriangle, CheckCircle2, ChevronRight, Timer } from 'lucide-react'
import { alerts } from '../../data/mockAdminData'

const icons = { danger: AlertTriangle, warning: Timer, success: CheckCircle2 }
export function AlertsPanel() { return <section className="panel bottom-panel"><div className="panel-heading"><div><span className="eyebrow">ATENCIÓN REQUERIDA</span><h2>ALERTAS</h2></div><span className="alert-total">7</span></div><div className="alert-list">{alerts.map(alert => { const Icon=icons[alert.level]; return <article className={`alert-row ${alert.level}`} key={alert.title}><Icon size={17}/><div><strong>{alert.title}</strong><span>{alert.description}</span></div></article> })}</div><button className="panel-link" type="button">Ver todas las alertas (7)<ChevronRight size={15}/></button></section> }
