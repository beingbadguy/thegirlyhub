/**
 * Order Status Utilities
 * Defines the valid status flow and transition rules for orders.
 */

export type OrderStatus =
  | "processing"
  | "reviewing"
  | "preparing"
  | "shipped"
  | "delivered"
  | "completed"
  | "cancelled";

/**
 * Defines the strict forward-only status flow.
 * Each key maps to the statuses that it is allowed to transition INTO.
 * "cancelled" is a terminal state reachable from any non-delivered status.
 */
const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  processing: ["reviewing", "cancelled"],
  reviewing: ["preparing", "cancelled"],
  preparing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: ["completed"],
  completed: [],
  cancelled: [],
};

/**
 * Validates whether a status transition is allowed.
 *
 * @param oldStatus - The current status of the order.
 * @param newStatus - The target status to transition to.
 * @returns `{ valid: true }` if allowed, or `{ valid: false, message: string }` if not.
 */
export function validateStatusTransition(
  oldStatus: OrderStatus,
  newStatus: OrderStatus
): { valid: true } | { valid: false; message: string } {
  if (oldStatus === newStatus) {
    return {
      valid: false,
      message: `Order is already in "${newStatus}" status.`,
    };
  }

  const allowedTransitions = STATUS_TRANSITIONS[oldStatus];

  if (!allowedTransitions) {
    return {
      valid: false,
      message: `Unknown current status: "${oldStatus}".`,
    };
  }

  if (!allowedTransitions.includes(newStatus)) {
    return {
      valid: false,
      message: `Invalid status transition: cannot move from "${oldStatus}" to "${newStatus}". Allowed next statuses: [${allowedTransitions.join(", ") || "none"}].`,
    };
  }

  return { valid: true };
}
