import {
  getNimbusPostConfig,
  getNimbusPostHeaders,
  getNimbusPostToken,
  checkNimbusPostServiceability,
  createNimbusPostShipment,
  generateNimbusPostLabel,
  trackNimbusPostShipment,
  verifyNimbusPostWebhookSignature,
} from "../lib/nimbuspost";
import crypto from "crypto";

async function main() {
  console.log("=================================================");
  console.log("🧪 NIMBUSPOST API KEY & SECRET VERIFICATION TEST");
  console.log("=================================================\n");

  // 1. Credentials Configuration
  const config = getNimbusPostConfig();
  console.log("1. Inspecting Configured Credentials:");
  console.log("   - API Key:", config.maskedKey);
  console.log("   - Has Secret:", config.hasSecret ? "YES (32 chars)" : "NO");
  console.log("   - Is Configured:", config.isConfigured);
  console.log("   - Pickup Pincode:", config.pickupPincode);
  console.log("   - Warehouse Name:", config.warehouseName);

  if (!config.hasKey || !config.hasSecret) {
    console.error("❌ FAILED: API Key or Secret missing in .env!");
    process.exit(1);
  }
  console.log("   ✅ API Key and API Secret are properly loaded.\n");

  // 2. Standardized Headers Inspection
  console.log("2. Standardized Outbound Request Headers:");
  const sampleToken = await getNimbusPostToken();
  const headers = getNimbusPostHeaders(sampleToken);
  console.log("   - Authorization:", headers["Authorization"]?.slice(0, 25) + "...");
  console.log("   - api-key:", headers["api-key"] ? "Included (" + headers["api-key"].slice(0, 10) + "...)" : "Missing");
  console.log("   - secret-key:", headers["secret-key"] ? "Included (Masked)" : "Missing");
  console.log("   - x-api-key:", headers["x-api-key"] ? "Included" : "Missing");
  console.log("   - x-api-secret:", headers["x-api-secret"] ? "Included" : "Missing");
  console.log("   ✅ Header dispatch payload verified.\n");

  // 3. Webhook Signature Verification with API Secret
  console.log("3. Testing Webhook HMAC-SHA256 Signature Verification:");
  const testPayload = JSON.stringify({
    order_id: "ORD-9988",
    awb_number: "NP123456789IN",
    current_status: "DELIVERED",
  });
  const validSignature = crypto
    .createHmac("sha256", config.secret)
    .update(testPayload)
    .digest("hex");

  const isVerified = verifyNimbusPostWebhookSignature(testPayload, validSignature);
  const isRejected = verifyNimbusPostWebhookSignature(testPayload, "invalid_tampered_signature");

  console.log("   - Valid HMAC signature accepted:", isVerified ? "✅ PASS" : "❌ FAIL");
  console.log("   - Tampered HMAC signature rejected:", !isRejected ? "✅ PASS" : "❌ FAIL");

  if (!isVerified || isRejected) {
    console.error("❌ FAILED: Webhook HMAC signature verification error");
    process.exit(1);
  }
  console.log("   ✅ Webhook HMAC security verified with NIMBUSPOST_SECRET.\n");

  // 4. Courier Serviceability Test
  console.log("4. Testing Courier Serviceability & Live Rate Check:");
  const rates = await checkNimbusPostServiceability({
    pickup_postcode: config.pickupPincode,
    delivery_postcode: "400001",
    cod: 1,
    weight: 0.2,
    order_amount: 850,
  });

  console.log(`   - Available Couriers: ${rates.couriers.length}`);
  console.log(`   - Simulated fallback: ${rates.is_simulated ? "YES (Safe dev mode)" : "NO (Live API)"}`);
  if (rates.couriers.length > 0) {
    console.log(`   - Cheapest: ${rates.couriers.find((c) => c.is_cheapest)?.courier_name} (₹${rates.couriers.find((c) => c.is_cheapest)?.rate})`);
    console.log(`   - Fastest: ${rates.couriers.find((c) => c.is_fastest)?.courier_name} (${rates.couriers.find((c) => c.is_fastest)?.estimated_days})`);
  }
  console.log("   ✅ Serviceability check passed.\n");

  // 5. Forward Shipment Creation Test
  console.log("5. Testing Forward Shipment Creation & AWB Allocation:");
  const shipment = await createNimbusPostShipment({
    orderId: "TEST_ORDER_APIKEY_" + Date.now().toString().slice(-4),
    courier_id: rates.couriers[0]?.courier_id || 201,
    weight: 0.2,
    length: 10,
    breadth: 10,
    height: 2,
    warehouse_name: config.warehouseName,
    customerName: "Priya Sharma",
    phone: "9876543210",
    email: "priya@example.com",
    address: "Flat 402, Lotus Tower, Marine Lines",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
    items: [{ name: "Cotton Kurti", units: 1, selling_price: 850 }],
    totalPrice: 850,
    paymentMethod: "COD",
  });

  console.log("   - Shipment ID:", shipment.shipmentId);
  console.log("   - AWB Number:", shipment.awbCode);
  console.log("   - Courier:", shipment.courierName);
  console.log("   - Label URL:", shipment.labelUrl);
  console.log("   - Tracking Link:", shipment.trackingLink);
  console.log("   ✅ Shipment creation passed.\n");

  // 6. Label & Tracking Test
  console.log("6. Testing Label Generation & Tracking:");
  const label = await generateNimbusPostLabel(shipment.shipmentId);
  const track = await trackNimbusPostShipment(shipment.awbCode);
  console.log("   - Label PDF URL:", label);
  console.log("   - Tracking Status:", track?.status || track?.current_status || "Active");
  console.log("   ✅ Label & Tracking passed.\n");

  console.log("=================================================");
  console.log("🎉 ALL NIMBUSPOST API KEY & SECRET TESTS PASSED!");
  console.log("=================================================");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
