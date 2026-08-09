const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "https://restaurantflow-ijjc.onrender.com";

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

async function putJson<TResponse>(
  path: string,
  body: unknown
): Promise<TResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "PUT",
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

export interface CustomerResponse {
  id: string;
  full_name: string;
  email: string;
  is_verified: boolean;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReservationTrackingResponse {
  id: string;
  customer_id: string;
  table_id: number;
  party_size: number;
  status: "reserved" | "released";
  reserved_at: string;
  released_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerLoginRequest {
  email: string;
  password: string;
}

export function registerCustomer(payload: CustomerRegisterRequest) {
  return postJson<CustomerResponse>("/api/customers/register", payload);
}

export function loginCustomer(payload: CustomerLoginRequest) {
  return postJson<CustomerResponse>("/api/customers/login", payload);
}

export function getCustomerReservations(customerId: string) {
  return getJson<ReservationTrackingResponse[]>(
    `/api/customers/${customerId}/reservations`
  );
}

export type MessageSender = "client" | "waiter" | "chef" | "admin" | "system" | "bot";
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
  sender_id?: string;
  recipient_role?: MessageRecipient;
  message_type?: MessageType;
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

export type OrderStatus =
  | "pending"
  | "analyzing"
  | "cooking"
  | "ready"
  | "served"
  | "paid";

export interface OrderResponse {
  id: string;
  table_id: number;
  status: string;
  items: OrderItemRequest[];
  progress: number;
  estimated_time: number | null;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export function createOrder(payload: OrderCreateRequest) {
  return postJson<OrderResponse>("/api/orders", payload);
}

export function getOrder(orderId: string) {
  return getJson<OrderResponse>(`/api/orders/${orderId}`);
}

export function getOrders(params: { status?: OrderStatus; limit?: number } = {}) {
  return getJson<OrderResponse[]>(
    "/api/orders",
    params as Record<string, string | number | undefined>
  );
}

export function updateOrderStatus(orderId: string, status: OrderStatus) {
  return putJson<OrderResponse>(`/api/orders/${orderId}/status`, { status });
}

export type OrderDishStatus = "pending" | "preparing" | "ready" | "delivered";

export interface OrderDishResponse {
  id: string;
  order_id: string;
  table_id: number;
  product_id: string | null;
  name: string;
  quantity: number;
  notes: string | null;
  price: number | null;
  status: OrderDishStatus;
  estimated_time: number;
  progress: number;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

export function getOrderDishes(
  params: { order_id?: string; table_id?: number; status?: OrderDishStatus } = {}
) {
  return getJson<OrderDishResponse[]>(
    "/api/order-dishes",
    params as Record<string, string | number | undefined>
  );
}

export function updateOrderDishStatus(dishId: string, status: OrderDishStatus) {
  return putJson<OrderDishResponse>(`/api/order-dishes/${dishId}/status`, { status });
}

export interface MenuItemResponse {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export function getMenuItems(params: { available_only?: boolean } = {}) {
  return getJson<MenuItemResponse[]>(
    "/api/menu",
    params as Record<string, string | number | undefined>
  );
}

export interface StaffUserResponse {
  id: string;
  name: string;
  role: "admin" | "waiter" | "chef";
  email: string;
}

export function getStaff(params: { role?: "admin" | "waiter" | "chef" } = {}) {
  return getJson<StaffUserResponse[]>(
    "/api/staff",
    params as Record<string, string | number | undefined>
  );
}

export interface StaffLoginRequest {
  email: string;
  password: string;
}

export interface StaffLoginResponse {
  staff_id: string;
  name: string;
  role: "admin" | "waiter" | "chef";
  email: string;
}

export function loginStaff(payload: StaffLoginRequest) {
  return postJson<StaffLoginResponse>("/api/staff/login", payload);
}

export interface ServiceSessionResponse {
  id: string;
  table_id: number;
  customer_id: string | null;
  waiter_id: string | null;
  order_id: string | null;
  status: "active" | "completed";
  seated_at: string;
  waiter_assigned_at: string | null;
  order_sent_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function getServiceSessions(params: { active_only?: boolean } = {}) {
  return getJson<ServiceSessionResponse[]>(
    "/api/service-sessions",
    params as Record<string, string | number | undefined>
  );
}

export function assignServiceSessionWaiter(
  tableId: number,
  waiterId: string | null
) {
  return putJson<ServiceSessionResponse>(
    `/api/service-sessions/tables/${tableId}/assignment`,
    { waiter_id: waiterId }
  );
}

export function applyWaiterTableAction(
  tableId: number,
  waiterId: string,
  action: "ready" | "served" | "paying" | "paid"
) {
  return postJson<ServiceSessionResponse>(
    `/api/service-sessions/tables/${tableId}/waiter-actions`,
    {
      waiter_id: waiterId,
      action,
    }
  );
}

export type BackendTableStatus =
  | "empty"
  | "waiting_order"
  | "cooking"
  | "eating"
  | "paying";

export interface TableResponse {
  id: number;
  status: BackendTableStatus;
  customers: number;
  capacity: number;
  order_id: string | null;
  customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TableUpdateRequest {
  status?: BackendTableStatus;
  customers?: number;
  capacity?: number;
  order_id?: string | null;
  customer_id?: string | null;
}

export function getTables() {
  return getJson<TableResponse[]>("/api/tables");
}

export function updateTable(tableId: number, payload: TableUpdateRequest) {
  return putJson<TableResponse>(`/api/tables/${tableId}`, payload);
}

export type WaitlistStatus = "waiting" | "notified" | "seated" | "cancelled";

export interface WaitlistEntryResponse {
  id: string;
  customer_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  party_size: number;
  status: WaitlistStatus;
  quoted_wait_minutes: number | null;
  notes: string | null;
  table_id: number | null;
  notified_at: string | null;
  seated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WaitlistEntryUpdateRequest {
  status?: WaitlistStatus;
  quoted_wait_minutes?: number | null;
  notes?: string | null;
  table_id?: number | null;
}

export interface WaitlistJoinRequest {
  customer_id?: string | null;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  party_size: number;
}

export interface WaitlistJoinResponse {
  outcome: "seated" | "queued";
  table_id: number | null;
  entry: WaitlistEntryResponse | null;
  estimated_wait_minutes: number | null;
}

export interface WaitlistAvailabilityResponse {
  available: boolean;
  estimated_wait_minutes: number | null;
  table_id: number | null;
}

export function getWaitlistAvailability(partySize: number) {
  return getJson<WaitlistAvailabilityResponse>("/api/waitlist/availability", {
    party_size: partySize,
  });
}

export function joinWaitlist(payload: WaitlistJoinRequest) {
  return postJson<WaitlistJoinResponse>("/api/waitlist/join", payload);
}

export function getWaitlistEntry(entryId: string) {
  return getJson<WaitlistEntryResponse>(`/api/waitlist/${entryId}`);
}

export function updateWaitlistEntry(
  entryId: string,
  payload: WaitlistEntryUpdateRequest
) {
  return putJson<WaitlistEntryResponse>(`/api/waitlist/${entryId}`, payload);
}

export function listWaitlistEntries(
  params: { status?: WaitlistStatus; active_only?: boolean } = {}
) {
  return getJson<WaitlistEntryResponse[]>(
    "/api/waitlist",
    params as Record<string, string | number | undefined>
  );
}

export interface StatsResponse {
  total_orders: number;
  active_orders: number;
  completed_orders: number;
  average_order_time_minutes: number;
  average_estimated_time_minutes: number;
  tables_total: number;
  tables_occupied: number;
  tables_available: number;
  messages_today: number;
  alerts_today: number;
  revenue_today: number | null;
  avg_ticket_today: number | null;
  satisfaction: number | null;
}

export interface AgentActivityResponse {
  id: string;
  agent_name: string;
  action: string;
  output_data: Record<string, unknown> | unknown[] | null;
  created_at: string;
}

export interface DashboardResponse {
  stats: StatsResponse;
  orders: OrderResponse[];
  tables: TableResponse[];
  waitlist: WaitlistEntryResponse[];
  alerts: AgentActivityResponse[];
  agent_activity: AgentActivityResponse[];
  recent_requests: MessageResponse[];
}

export function getStats() {
  return getJson<StatsResponse>("/api/stats");
}

export function getDashboard() {
  return getJson<DashboardResponse>("/api/dashboard");
}

export interface SalesByHourEntry {
  hour: string;
  sales: number;
}

export interface TopDishEntry {
  name: string;
  count: number;
}

export interface SalesByCategoryEntry {
  category: string;
  amount: number;
}

export interface PeakHourEntry {
  hour: string;
  orders: number;
}

export interface CookingTimeEntry {
  hour: string;
  minutes: number;
}

export function getSalesByHour() {
  return getJson<SalesByHourEntry[]>("/api/stats/sales-by-hour");
}

export function getTopDishes() {
  return getJson<TopDishEntry[]>("/api/stats/top-dishes");
}

export function getSalesByCategory() {
  return getJson<SalesByCategoryEntry[]>("/api/stats/sales-by-category");
}

export function getOrdersByStatus() {
  return getJson<Record<string, number>>("/api/stats/orders-by-status");
}

export function getPeakHours() {
  return getJson<PeakHourEntry[]>("/api/stats/peak-hours");
}

export function getCookingTimeByHour() {
  return getJson<CookingTimeEntry[]>("/api/stats/cooking-time-by-hour");
}
