export type OrderStatus = 'new' | 'kitchen' | 'preparing' | 'ready' | 'delivered'
export type OrderPriority = 'low' | 'medium' | 'high' | 'critical'
export interface OrderDish { id:string; name:string; quantity:number; note?:string; alert?:boolean; icon:string; ready?:boolean }
export interface TimelineEvent { id:string; time?:string; label:string; state:'complete'|'current'|'pending' }
export interface AdminOrder { id:string; tableNumber:number; responsibleName:string; responsibleRole:'Mesero'|'Chef'; guestCount:number; orderTime:string; status:OrderStatus; priority:OrderPriority; elapsedTime?:string; progress?:number; readyTime?:string; dishes:OrderDish[]; timeline:TimelineEvent[] }
export interface AttentionOrder { id:string; tableNumber:number; priority:OrderPriority; elapsedTime:string; itemCount:number; chef:string; reason:string }
