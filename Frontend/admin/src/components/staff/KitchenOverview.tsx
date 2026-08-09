import kitchenBackground from '../../../../restaurant-flow/assets/cocina/mesa.png'
import chefImage from '../../../../restaurant-flow/assets/cocina/chef.png'
import { kitchenStaff } from '../../data/mockStaffData'
import { KitchenStaffCard } from './KitchenStaffCard'
export function KitchenOverview(){return <section className="kitchen-overview"><header><span>PRODUCCIÓN</span><h2>COCINEROS EN COCINA (4)</h2></header><div className="kitchen-overview-content"><div className="kitchen-staff-list">{kitchenStaff.map(staff=><KitchenStaffCard key={staff.id} staff={staff}/>)}</div><div className="kitchen-mini-map" style={{backgroundImage:`linear-gradient(rgba(5,8,12,.2),rgba(5,8,12,.35)),url(${kitchenBackground})`}}><span>COCINA • 7 ÓRDENES</span>{[18,45,72].map((left,index)=><img key={left} src={chefImage} alt="" style={{left:`${left}%`,top:`${36+(index%2)*20}%`}}/>)}</div></div></section>}
