import type { TimelineEvent } from '../../types/orders'
export function OrderTimeline({events}:{events:TimelineEvent[]}){return <section className="order-timeline"><h3>Línea de tiempo</h3><ol>{events.map(event=><li key={event.id} className={`timeline-${event.state}`}><time>{event.time??'Pendiente'}</time><i/><span>{event.label}</span></li>)}</ol></section>}
