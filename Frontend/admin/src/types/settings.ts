export type SettingsSection='general'|'operations'|'notifications'|'appearance'
export interface RestaurantSettings{name:string;branchId:string;address:string;phone:string;email:string;currency:string;timezone:string;openTime:string;closeTime:string;defaultPrepTime:number;tableCount:number;capacity:number}
export interface NotificationSetting{id:string;title:string;description:string;enabled:boolean}
