import { NextRequest } from "next/server";
import { OrderController } from "@/controllers/order.controller";

/**
 * PATCH /api/orders/[id]/status
 *
 * Updates the status of a specific order. Admin only.
 *
 * Request Body:
 *   {
 *     "status": "SHIPPED",           // required
 *     "awbNumber": "123456789",      // required when status = "shipped"
 *     "trackingLink": "https://..."  // optional when status = "shipped"
 *   }
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return OrderController.updateStatus(request, id);
}
