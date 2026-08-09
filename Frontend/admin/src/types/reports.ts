export interface ReportSummary{id:string;label:string;value:string;change:string;tone:'green'|'orange';icon:'sales'|'orders'|'ticket'|'kitchen'|'rating'|'tables'}
export interface TimeSeriesPoint{label:string;value:number;secondary?:number}
export interface OrderStatusMetric{status:string;count:number;percentage:number;color:string}
export interface TopDish{id:string;name:string;count:number;icon:string}
export interface CategoryMetric{category:string;percentage:number;amount:number;color:string}
export interface TableRotationStats{average:number;change:number;mostRotated:{table:number,value:string};longest:{table:number,value:string};shortest:{table:number,value:string}}
export interface PeakHour{range:string;orders:number;highlighted?:boolean}
