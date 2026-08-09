import { Activity, Bot } from 'lucide-react'
import { agents } from '../../data/mockAdminData'

export function AgentActivityPanel() {
  return <section className="panel side-panel"><div className="panel-heading"><div><span className="eyebrow">AUTOMATIZACIÓN</span><h2>AGENTES IA ACTIVOS</h2></div><span className="count-badge">4 activos</span></div><div className="agent-list">{agents.map(agent => <article className={`agent-row ${agent.state}`} key={agent.name}><span className="agent-icon"><Bot size={17}/><i/></span><div className="agent-copy"><strong>{agent.name}</strong><span>{agent.activity}</span>{agent.detail && <small>{agent.detail}</small>}</div><svg className="sparkline" viewBox="0 0 54 24" aria-label={`Actividad de ${agent.name}`}><polyline points={agent.sparkline.map((v,i)=>`${i*10+2},${22-v}`).join(' ')} /></svg></article>)}</div><div className="systems-ok"><Activity size={15}/><span>Sistema coordinado</span><i/></div></section>
}
