const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:8000";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function postJson<TResponse>(
  path: string,
  body: unknown
): Promise<TResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "No se pudo conectar con el servidor. Intenta de nuevo.");
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const detail =
      (data && typeof data.detail === "string" && data.detail) ||
      "Ocurrió un error inesperado.";
    throw new ApiError(response.status, detail);
  }

  return data as TResponse;
}

async function getJson<TResponse>(
  path: string,
  query?: Record<string, string | number | undefined>
): Promise<TResponse> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) params.set(key, String(value));
  }
  const queryString = params.toString();

  let response: Response;
  try {
    response = await fetch(
      `${API_BASE_URL}${path}${queryString ? `?${queryString}` : ""}`
    );
  } catch {
    throw new ApiError(0, "No se pudo conectar con el servidor. Intenta de nuevo.");
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const detail =
      (data && typeof data.detail === "string" && data.detail) ||
      "Ocurrió un error inesperado.";
    throw new ApiError(response.status, detail);
  }

  return data as TResponse;
}

export interface CustomerRegisterRequest {
  full_name: string;
  email: string;
  password: string;
}

export interface CustomerRegisterResponse {
  message: string;
  customer_id: string;
  email: string;
  expires_in_minutes: number;
}

export interface CustomerVerifyRequest {
  email: string;
  code: string;
}

export interface CustomerResponse {
  id: string;
  full_name: string;
  email: string;
  is_verified: boolean;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerLoginRequest {
  email: string;
  password: string;
}

export function registerCustomer(payload: CustomerRegisterRequest) {
  return postJson<CustomerRegisterResponse>("/api/customers/register", payload);
}

export function verifyCustomer(payload: CustomerVerifyRequest) {
  return postJson<CustomerResponse>("/api/customers/verify", payload);
}

export function loginCustomer(payload: CustomerLoginRequest) {
  return postJson<CustomerResponse>("/api/customers/login", payload);
}

export type MessageSender = "client" | "waiter" | "chef" | "admin" | "system";
export type MessageRecipient = "client" | "waiter" | "chef" | "admin";
export type MessageType =
  | "message"
  | "customer_request"
  | "kitchen_note"
  | "system";

export interface MessageCreateRequest {
  sender: MessageSender;
  sender_id?: string | null;
  recipient_role?: MessageRecipient | null;
  table_id?: number | null;
  order_id?: string | null;
  text: string;
  message_type?: MessageType;
}

export interface MessageResponse {
  id: string;
  sender: string;
  sender_id: string | null;
  recipient_role: string | null;
  table_id: number | null;
  order_id: string | null;
  text: string;
  message_type: string;
  created_at: string;
}

export interface GetMessagesParams {
  table_id?: number;
  order_id?: string;
  sender?: MessageSender;
  limit?: number;
}

export function sendMessage(payload: MessageCreateRequest) {
  return postJson<MessageResponse>("/api/messages", payload);
}

export function getMessages(params: GetMessagesParams = {}) {
  return getJson<MessageResponse[]>(
    "/api/messages",
    params as Record<string, string | number | undefined>
  );
}

export interface OrderItemRequest {
  product_id?: string | null;
  name: string;
  quantity: number;
  notes?: string | null;
  price?: number | null;
}

export interface OrderCreateRequest {
  table_id: number;
  items: OrderItemRequest[];
}

export interface OrderResponse {
  id: string;
  table_id: number;
  status: string;
  items: OrderItemRequest[];
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export function createOrder(payload: OrderCreateRequest) {
  return postJson<OrderResponse>("/api/orders", payload);
}
