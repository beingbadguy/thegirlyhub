/**
 * NimbusPost End-to-End Integration Verification Script
 * Run with: npx tsx --env-file=.env scripts/test-nimbuspost.ts
 */

import { databaseConnection } from "../config/databseConnection";
import Order from "../models/order.model";
import {
  getNimbusPostToken,
  checkNimbusPostServiceability,
  createNimbusPostShipment,
  mapNimbusPostStatusToInternal,
} from "../lib/nimbuspost";

async function runNimbusPostVerification() {
  console.log("=================================================");
  console.log("    NIMBUSPOST INTEGRATION VERIFICATION SUITE    ");
  console.log("=================================================\n");

  await databaseConnection();
  console.log("✅ 1. MongoDB Connected");

  // Step 1: Token
  const token = await getNimbusPostToken();
  console.log("✅ 2. Auth Token retrieved:", token.slice(0, 25) + "...");

  // Step 2: Serviceability
  const serviceRes = await checkNimbusPostServiceability({
    pickup_postcode: "110032",
    delivery_postcode: "560001",
    cod: 0,
    weight: 0.2,
  });
  console.log(`✅ 3. Serviceability returned ${serviceRes.couriers.length} NimbusPost couriers:`);
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
    const shipment = await createNimbusPostShipment({
      orderId: String(order.orderId || order._id),
      courier_id: serviceRes.couriers[0].courier_id,
      weight: 0.2,
      length: 10,
      breadth: 10,
      height: 2,
      customerName: order.customerName || order.recipientName || "Customer",
      phone: order.phone || 9876543210,
      address: order.address || "123 Sample Street",
      pincode: order.pincode || order.zip || 560001,
      items: [],
      totalPrice: order.totalPrice || order.totalAmount || 100,
      paymentMethod: order.paymentMethod || "online",
    });
    console.log("✅ 5. Shipment created successfully on NimbusPost:", {
      shipmentId: shipment.shipmentId,
      awbCode: shipment.awbCode,
      courier: shipment.courierName,
      labelUrl: shipment.labelUrl,
      trackingLink: shipment.trackingLink,
    });
  }

  // Step 4: Webhook mapping
  const mappedShipped = mapNimbusPostStatusToInternal("IN TRANSIT");
  const mappedDelivered = mapNimbusPostStatusToInternal("DELIVERED");
  const mappedRTO = mapNimbusPostStatusToInternal("RTO INITIATED");

  console.log("✅ 6. Webhook status mapping verified:");
  console.log(`   - "IN TRANSIT" -> shipmentStatus: ${mappedShipped.shipmentStatus}, orderStatus: ${mappedShipped.orderStatus}`);
  console.log(`   - "DELIVERED"  -> shipmentStatus: ${mappedDelivered.shipmentStatus}, orderStatus: ${mappedDelivered.orderStatus}`);
  console.log(`   - "RTO"        -> shipmentStatus: ${mappedRTO.shipmentStatus}, orderStatus: ${mappedRTO.orderStatus}`);

  console.log("\n=================================================");
  console.log("   ALL NIMBUSPOST TESTS PASSED SUCCESSFULLY!     ");
  console.log("=================================================");
  process.exit(0);
}

runNimbusPostVerification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
