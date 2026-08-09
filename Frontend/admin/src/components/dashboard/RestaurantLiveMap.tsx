import type { CSSProperties } from 'react'
import restaurantBackground from '../../../../restaurant-flow/assets/fondorestaurante.png'
import chefImage from '../../../../restaurant-flow/assets/cocina/chef.png'
import waiterImage from '../../../../restaurant-flow/assets/cocina/mesero.png'
import queueRope from '../../../../restaurant-flow/assets/fila.png'
import emptyTable from '../../../../restaurant-flow/assets/mesa.png'
import tableOne from '../../../../restaurant-flow/assets/mesas/mesa1.png'
import tableTwo from '../../../../restaurant-flow/assets/mesas/mesa22.png'
import tableThree from '../../../../restaurant-flow/assets/mesas/mesa3.png'
import tableFour from '../../../../restaurant-flow/assets/mesas/mesa4.png'
import personOne from '../../../../restaurant-flow/assets/personas/persona1.png'
import personTwo from '../../../../restaurant-flow/assets/personas/persona2.png'
import personThree from '../../../../restaurant-flow/assets/personas/persona3.png'
import personFour from '../../../../restaurant-flow/assets/personas/persona4.png'
import personFive from '../../../../restaurant-flow/assets/personas/persona5.png'
import { tables } from '../../data/mockAdminData'
import type { AdminTable, TableStatus } from '../../types/admin'
import { StatusBadge } from '../ui/StatusBadge'

const legend: [TableStatus, string][] = [['served','Servido'], ['eating','Comiendo'], ['waiting','Esperando orden'], ['paying','Pagando'], ['empty','Vacío'], ['guest-waiting','Cliente esperando'], ['delayed','Retrasado']]
const people = [personOne, personTwo, personThree, personFour, personFive]

function tableImage(table: AdminTable) {
  if (table.status === 'empty') return emptyTable
  if (table.seats >= 4) return tableFour
  if (table.seats === 3) return tableThree
  if (table.seats === 2) return tableTwo
  return tableOne
}

export function RestaurantLiveMap() {
  return (
    <section className="panel live-map-panel">
      <div className="panel-heading map-heading"><div><span className="eyebrow">PLANO OPERATIVO</span><h2>MAPA DEL RESTAURANTE EN VIVO</h2></div><div className="legend">{legend.map(([status, label]) => <span key={status}><i className={`dot status-${status}`} />{label}</span>)}</div></div>
      <div className="restaurant-map restaurant-map-art" style={{ backgroundImage: `linear-gradient(rgba(4,8,12,.12),rgba(4,8,12,.25)), url(${restaurantBackground})` }}>
        <div className="map-kitchen-status"><span />COCINA EN LÍNEA <small>3 órdenes activas</small></div>
        <img className="map-chef" src={chefImage} alt="Chef trabajando en cocina" />
        <div className="waiting-queue art-queue"><div className="queue-copy"><strong>5 personas esperando</strong><span>~12 min de espera</span></div><div className="queue-people art-people">{people.map((person, index) => <img src={person} alt="" aria-hidden="true" key={person} style={{ '--person-index': index } as CSSProperties} />)}</div><img className="queue-rope" src={queueRope} alt="Zona de fila" /></div>
        <div className="map-worker worker-one"><img src={waiterImage} alt="Mesero en el salón" /><span>MESERO</span></div>
        <div className="map-worker worker-two"><img src={waiterImage} alt="Mesero en el salón" /><span>MESERO</span></div>
        {tables.map(table => <article key={table.id} className={`map-table art-table table-${table.status}`} style={{ left: `${table.position.x}%`, top: `${table.position.y}%` }} tabIndex={0} aria-label={`${table.name}, ${table.statusLabel}, ${table.seats} puestos`}><div className="table-label"><strong>{table.name}</strong><StatusBadge status={table.status}>{table.statusLabel}</StatusBadge>{table.order && <small>{table.order} · {table.progress}%</small>}</div><img className="table-image" src={tableImage(table)} alt="" aria-hidden="true" /><span className="table-capacity">{table.seats} puestos</span></article>)}
      </div>
    </section>
  )
}
