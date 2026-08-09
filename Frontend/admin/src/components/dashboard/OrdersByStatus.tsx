import { orderStatuses } from '../../data/mockAdminData'

export function OrdersByStatus() {
  return <section className="panel bottom-panel"><div className="panel-heading"><div><span className="eyebrow">DISTRIBUCIÓN</span><h2>ÓRDENES POR ESTADO</h2></div></div><div className="donut-wrap"><div className="donut" role="img" aria-label="48 órdenes distribuidas por estado"><div><strong>48</strong><span>órdenes</span></div></div><div className="donut-legend">{orderStatuses.map(item => <div key={item.label}><i style={{background:item.color}}/><span>{item.label}</span><strong>{item.value}</strong><small>{item.percentage}%</small></div>)}</div></div></section>
}
