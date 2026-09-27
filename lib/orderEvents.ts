import { EventEmitter } from "events";

export interface RealtimeOrderPayload {
  id: string;
  orderId: string;
  totalAmount: number;
  recipientName: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  itemsCount: number;
  paymentMethod: "cod" | "online" | "credit/debit" | string;
  paymentStatus: "paid" | "unpaid" | string;
  status: string;
  createdAt: string;
}

// Global singleton across hot module reloads and serverless invocations
declare global {
  var __orderEventEmitter: EventEmitter | undefined;
  var __recentOrderEventsBuffer: RealtimeOrderPayload[] | undefined;
}

const orderEventEmitter: EventEmitter =
  globalThis.__orderEventEmitter || new EventEmitter();
orderEventEmitter.setMaxListeners(100);
globalThis.__orderEventEmitter = orderEventEmitter;

const recentOrderEventsBuffer: RealtimeOrderPayload[] =
  globalThis.__recentOrderEventsBuffer || [];
globalThis.__recentOrderEventsBuffer = recentOrderEventsBuffer;

/**
 * Broadcast a new order event to all connected admin listeners
 */
export function broadcastNewOrder(order: RealtimeOrderPayload) {
  // Deduplicate in buffer
  const exists = recentOrderEventsBuffer.some((o) => o.id === order.id);
  if (!exists) {
    recentOrderEventsBuffer.unshift(order);
    if (recentOrderEventsBuffer.length > 50) {
      recentOrderEventsBuffer.pop();
    }
  }

  orderEventEmitter.emit("new_order", order);
}

/**
 * Subscribe to new order broadcasts
 */
export function subscribeToOrderEvents(
  callback: (order: RealtimeOrderPayload) => void,
) {
  orderEventEmitter.on("new_order", callback);
  return () => {
    orderEventEmitter.off("new_order", callback);
  };
}

/**
 * Retrieve recent order events from buffer for polling fallback
 */
export function getRecentOrderEvents(since?: string | number) {
  if (!since) return recentOrderEventsBuffer;
  const sinceTime = new Date(since).getTime();
  return recentOrderEventsBuffer.filter(
    (o) => new Date(o.createdAt).getTime() > sinceTime,
  );
}
