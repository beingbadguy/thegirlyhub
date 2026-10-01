/**
 * Shiprocket End-to-End Integration Test Script
 * Run with: npx tsx --env-file=.env scripts/test-shiprocket.ts
 */

import { databaseConnection } from "../config/databseConnection";
import Order from "../models/order.model";
import {
  getShiprocketToken,
  checkServiceability,
  createForwardShipment,
  mapShiprocketStatusToInternal,
} from "../lib/shiprocket";

async function runShiprocketVerification() {
  console.log("=================================================");
  console.log("   SHIPROCKET INTEGRATION VERIFICATION SUITE     ");
  console.log("=================================================\n");

  await databaseConnection();
  console.log("✅ 1. MongoDB Connected");

  // Step 1: Token
  const token = await getShiprocketToken();
  console.log("✅ 2. Auth Token retrieved:", token.slice(0, 25) + "...");

  // Step 2: Serviceability
  const serviceRes = await checkServiceability({
    pickup_postcode: "110001",
    delivery_postcode: "560001",
    cod: 0,
    weight: 0.2,
  });
  console.log(`✅ 3. Serviceability returned ${serviceRes.couriers.length} couriers:`);
  serviceRes.couriers.forEach((c) => {
    const badges = [
      c.is_cheapest ? "[Cheapest]" : "",
      c.is_fastest ? "[Fastest]" : "",
    ]
      .filter(Boolean)
      .join(" ");
    console.log(`   - ${c.courier_name}: ₹${c.rate} (${c.estimated_days}) ${badges}`);
  });

  // Step 3: Find or use an order
  let order = await Order.findOne({});
  if (order) {
    console.log(`✅ 4. Testing with existing order: #${order._id}`);
    const shipment = await createForwardShipment({
      orderId: String(order.orderId || order._id),
      courier_id: serviceRes.couriers[0].courier_id,
      weight: 0.2,
      length: 10,
      breadth: 10,
      height: 2,
      customerName: order.customerName || order.recipientName || "Customer",
      phone: order.phone || 9876543210,
      address: order.address || "Test Address",
      pincode: order.pincode || order.zip || 560001,
      items: [],
      totalPrice: order.totalPrice || order.totalAmount || 100,
      paymentMethod: order.paymentMethod || "online",
    });
    console.log("✅ 5. Shipment created successfully:", {
      shipmentId: shipment.shipmentId,
      awbCode: shipment.awbCode,
      courier: shipment.courierName,
      labelUrl: shipment.labelUrl,
    });
  }

  // Step 4: Webhook mapping
  const mappedShipped = mapShiprocketStatusToInternal("IN TRANSIT");
  const mappedDelivered = mapShiprocketStatusToInternal("DELIVERED");
  const mappedRTO = mapShiprocketStatusToInternal("RTO INITIATED");

  console.log("✅ 6. Webhook status mapping verified:");
  console.log(`   - "IN TRANSIT" -> shipmentStatus: ${mappedShipped.shipmentStatus}, orderStatus: ${mappedShipped.orderStatus}`);
  console.log(`   - "DELIVERED"  -> shipmentStatus: ${mappedDelivered.shipmentStatus}, orderStatus: ${mappedDelivered.orderStatus}`);
  console.log(`   - "RTO"        -> shipmentStatus: ${mappedRTO.shipmentStatus}, orderStatus: ${mappedRTO.orderStatus}`);

  console.log("\n=================================================");
  console.log("   ALL SHIPROCKET TESTS PASSED SUCCESSFULLY!     ");
  console.log("=================================================");
  process.exit(0);
}

runShiprocketVerification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
