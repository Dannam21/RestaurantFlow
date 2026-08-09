export type MessageSender = "bot" | "user";

export type MessageStatus = "sent" | "delivered" | "read";

export interface ChatMessageType {
  id: string;
  sender: MessageSender;
  text: string;
  time: string;
  status?: MessageStatus;
}

export type AppRole = "cliente" | "mesero" | "admin";

export interface AuthUser {
  id?: string;
  name: string;
  email: string;
}

export type StaffRole = "cook" | "waiter";

export interface StaffMember {
  id: string;
  role: StaffRole;
  emoji: string;
  top: string;
  left: string;
  delay: string;
}

export interface DinerTable {
  id: string;
  top: string;
  left: string;
  guests: string[];
}

export interface WaitingPerson {
  id: string;
  emoji: string;
}

export type TableAlertTone = "emerald" | "amber" | "rose" | "sky";

export interface TableAlert {
  tone: TableAlertTone;
  icon: string;
  label: string;
  detail?: string;
}

export type TeamChannel = "general" | "cocina" | "meseros";

export type TeamMessageKind = "mesa" | "cocina" | "alerta" | "mesero";

export interface TeamMessage {
  id: string;
  channel: TeamChannel;
  kind: TeamMessageKind;
  name: string;
  time: string;
  text: string;
  tone: TableAlertTone | "violet";
}

export interface ServiceRequest {
  id: string;
  time: string;
  table: string;
  description: string;
  urgent?: boolean;
}

export interface AvailableWaiter {
  id: string;
  name: string;
  online: boolean;
}
