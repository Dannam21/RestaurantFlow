export type MessageSender = "bot" | "user";

export type MessageStatus = "sent" | "delivered" | "read";

export interface ChatMessageType {
  id: string;
  sender: MessageSender;
  text: string;
  time: string;
  status?: MessageStatus;
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
